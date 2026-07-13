import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { clearCache } from '../utils/cache.js';

const router = express.Router();

router.use(requireRole('manager'));

const LEAVE_TYPE_COLUMN = {
  casual: 'casual',
  sick: 'sick',
  annual: 'annual',
  comp_off: 'comp_off',
};

function toLeaveRequest(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code || '',
    emp: row.emp_name || '',
    email: row.emp_email || '',
    department: row.department || '',
    type: row.leave_type,
    from: row.from_date ? String(row.from_date).slice(0, 10) : '',
    to: row.to_date ? String(row.to_date).slice(0, 10) : '',
    days: Number(row.days || 1),
    reason: row.reason || '',
    status: row.status,
    applied: row.applied_at,
    reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewed_by_name || '',
    reviewedAt: row.reviewed_at,
  };
}

async function resolveManagerEmployeeId(userId) {
  if (!userId) return null;
  const { rows } = await pool.query(
    'SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return rows[0]?.id || null;
}

async function loadManagedLeave(client, leaveId, managerEmployeeId) {
  const { rows } = await client.query(
    `SELECT lr.*
     FROM leave_requests lr
     JOIN hr_employees e ON e.id = lr.employee_id
     WHERE lr.id = $1 AND e.manager_id = $2
     LIMIT 1`,
    [leaveId, managerEmployeeId]
  );
  return rows[0] || null;
}

async function refundBalance(client, leave) {
  const col = LEAVE_TYPE_COLUMN[leave.leave_type];
  if (!col) return;
  const year = new Date(leave.from_date).getFullYear();
  await client.query(
    `UPDATE leave_balances
     SET ${col}_used = GREATEST(${col}_used - $1, 0), updated_at = NOW()
     WHERE employee_id = $2 AND year = $3`,
    [leave.days, leave.employee_id, year]
  );
}

router.get('/', async (req, res, next) => {
  try {
    const managerEmployeeId = await resolveManagerEmployeeId(req.user?.id);
    if (!managerEmployeeId) return res.json({ leaves: [] });

    const statusFilter = req.query.status;
    const params = [managerEmployeeId];
    let sql = `
      SELECT lr.*, e.name AS emp_name, e.email AS emp_email, e.employee_code, e.department,
             COALESCE(reviewer.username, reviewer.email) AS reviewed_by_name
      FROM leave_requests lr
      JOIN hr_employees e ON e.id = lr.employee_id
      LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
      WHERE e.manager_id = $1
    `;
    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      params.push(statusFilter);
      sql += ` AND lr.status = $${params.length}`;
    }
    sql += ' ORDER BY lr.applied_at DESC';

    const result = await pool.query(sql, params);
    return res.json({ leaves: result.rows.map(toLeaveRequest) });
  } catch (error) {
    return next(error);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const managerEmployeeId = await resolveManagerEmployeeId(req.user?.id);
    if (!managerEmployeeId) {
      return res.json({ total: 0, pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
    }

    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE lr.status = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE lr.status = 'approved')::int AS approved,
         COUNT(*) FILTER (WHERE lr.status = 'rejected')::int AS rejected,
         COUNT(*) FILTER (
           WHERE lr.status = 'approved' AND CURRENT_DATE BETWEEN lr.from_date AND lr.to_date
         )::int AS on_leave_today
       FROM leave_requests lr
       JOIN hr_employees e ON e.id = lr.employee_id
       WHERE e.manager_id = $1`,
      [managerEmployeeId]
    );

    const row = result.rows[0] || {};
    return res.json({
      total: Number(row.total || 0),
      pending: Number(row.pending || 0),
      approved: Number(row.approved || 0),
      rejected: Number(row.rejected || 0),
      onLeaveToday: Number(row.on_leave_today || 0),
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id/approve', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const managerEmployeeId = await resolveManagerEmployeeId(req.user?.id);
    if (!managerEmployeeId) return res.status(403).json({ message: 'Manager employee profile not linked.' });

    await client.query('BEGIN');
    const leave = await loadManagedLeave(client, req.params.id, managerEmployeeId);
    if (!leave) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Leave request not found for your team.' });
    }
    if (leave.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Leave already ${leave.status}.` });
    }

    await client.query(
      `UPDATE leave_requests
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, req.params.id]
    );

    await client.query('COMMIT');
    clearCache('hr_leave_summary');
    return res.json({ message: 'Leave approved.' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:id/reject', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const managerEmployeeId = await resolveManagerEmployeeId(req.user?.id);
    if (!managerEmployeeId) return res.status(403).json({ message: 'Manager employee profile not linked.' });

    await client.query('BEGIN');
    const leave = await loadManagedLeave(client, req.params.id, managerEmployeeId);
    if (!leave) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Leave request not found for your team.' });
    }
    if (leave.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Leave already ${leave.status}.` });
    }

    await refundBalance(client, leave);
    await client.query(
      `UPDATE leave_requests
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, req.params.id]
    );

    await client.query('COMMIT');
    clearCache('hr_leave_summary');
    return res.json({ message: 'Leave rejected and balance refunded.' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

export default router;
