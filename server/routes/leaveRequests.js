import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { getCache, setCache, clearCache } from '../utils/cache.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);
router.use(requireRole('hr', 'admin', 'super_admin'));

const CACHE_LEAVE_SUMMARY = 'hr_leave_summary';
const LEAVE_SUMMARY_TTL = 60;

const LEAVE_TYPES = ['casual', 'sick', 'annual', 'comp_off'];
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
    role: row.role,
    managerName: row.manager_name || '',
  };
}

async function ensureBalanceRow(client, employeeId, year) {
  const existing = await client.query(
    'SELECT id FROM leave_balances WHERE employee_id = $1 AND year = $2 LIMIT 1',
    [employeeId, year]
  );
  if (existing.rowCount > 0) return;
  await client.query(
    `INSERT INTO leave_balances (id, employee_id, year)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [crypto.randomUUID(), employeeId, year]
  );
}

/* ── GET /  —  List all leave requests ── */
router.get('/', async (req, res, next) => {
  try {
    const statusFilter = req.query.status;
    let sql = `
      SELECT lr.*, e.name AS emp_name, e.email AS emp_email, e.employee_code, u.role AS role,
             manager.name AS manager_name,
             COALESCE(reviewer.username, reviewer.email) AS reviewed_by_name
      FROM leave_requests lr
      JOIN hr_employees e ON e.id = lr.employee_id
      JOIN users u ON u.id = e.user_id
      LEFT JOIN hr_employees manager ON manager.id = e.manager_id
      LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
      WHERE u.role NOT IN ('admin', 'super_admin')
    `;
    const params = [];
    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      sql += ' AND lr.status = $1';
      params.push(statusFilter);
    }
    sql += ' ORDER BY lr.applied_at DESC';

    const result = await pool.query(sql, params);
    return res.json({ leaves: result.rows.map(toLeaveRequest) });
  } catch (error) {
    return next(error);
  }
});

/* ── GET /summary  —  Leave stats ── */
router.get('/summary', async (_req, res, next) => {
  try {
    const cached = getCache(CACHE_LEAVE_SUMMARY);
    if (cached) return res.json(cached);

    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE lr.status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE lr.status = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE lr.status = 'rejected')::int AS rejected
      FROM leave_requests lr
      JOIN hr_employees e ON e.id = lr.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE u.role NOT IN ('admin', 'super_admin')
    `);
    const counts = result.rows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };

    const todayResult = await pool.query(`
      SELECT COUNT(*)::int AS on_leave_today
      FROM leave_requests lr
      JOIN hr_employees e ON e.id = lr.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE lr.status = 'approved'
        AND u.role NOT IN ('admin', 'super_admin')
        AND CURRENT_DATE BETWEEN lr.from_date AND lr.to_date
    `);
    const onLeaveToday = Number(todayResult.rows[0]?.on_leave_today || 0);

    const payload = {
      total: Number(counts.total),
      pending: Number(counts.pending),
      approved: Number(counts.approved),
      rejected: Number(counts.rejected),
      onLeaveToday,
    };
    setCache(CACHE_LEAVE_SUMMARY, payload, LEAVE_SUMMARY_TTL);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

/* ── GET /balances  —  Leave balances for all employees ── */
router.get('/balances', async (_req, res, next) => {
  try {
    const year = new Date().getFullYear();

    // Ensure balance rows exist for all employees this year
    const employees = await pool.query('SELECT id FROM hr_employees WHERE status != $1', ['inactive']);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const emp of employees.rows) {
        await ensureBalanceRow(client, emp.id, year);
      }
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const result = await pool.query(`
      SELECT 
        lb.employee_id, lb.year, e.name AS emp_name, e.employee_code,
        (
          SELECT COALESCE(SUM(days), 0)::int
          FROM leave_requests lr
          WHERE lr.employee_id = lb.employee_id
            AND lr.status <> 'rejected'
            AND EXTRACT(YEAR FROM lr.from_date) = lb.year
        ) AS yearly_used,
        (
          SELECT COALESCE(SUM(days), 0)::int
          FROM leave_requests lr
          WHERE lr.employee_id = lb.employee_id
            AND lr.status <> 'rejected'
            AND EXTRACT(YEAR FROM lr.from_date) = lb.year
            AND EXTRACT(MONTH FROM lr.from_date) = $2
        ) AS monthly_used
      FROM leave_balances lb
      JOIN hr_employees e ON e.id = lb.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE lb.year = $1 AND u.role NOT IN ('admin', 'super_admin')
      ORDER BY e.name ASC
    `, [year, new Date().getMonth() + 1]);

    const MONTHLY_LEAVE_ALLOWANCE = 2; // matching other endpoints
    const YEARLY_LEAVE_ALLOWANCE = MONTHLY_LEAVE_ALLOWANCE * 12;

    const balances = result.rows.map(row => ({
      employeeId: row.employee_id,
      employeeCode: row.employee_code,
      name: row.emp_name,
      year: row.year,
      monthly: {
        total: MONTHLY_LEAVE_ALLOWANCE,
        used: row.monthly_used,
        remaining: Math.max(MONTHLY_LEAVE_ALLOWANCE - row.monthly_used, 0)
      },
      yearly: {
        total: YEARLY_LEAVE_ALLOWANCE,
        used: row.yearly_used,
        remaining: Math.max(YEARLY_LEAVE_ALLOWANCE - row.yearly_used, 0)
      }
    }));

    return res.json({ balances });
  } catch (error) {
    return next(error);
  }
});

/* ── POST /  —  Apply for leave ── */
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { employeeId, leaveType, fromDate, toDate, days, reason } = req.body;

    if (!employeeId) return res.status(400).json({ message: 'Employee is required.' });
    if (!leaveType || !LEAVE_TYPES.includes(leaveType)) return res.status(400).json({ message: 'Invalid leave type.' });
    if (!fromDate || !toDate) return res.status(400).json({ message: 'From and To dates are required.' });
    const dayCount = Number(days) || Math.ceil((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;
    if (dayCount < 1) return res.status(400).json({ message: 'Invalid date range.' });

    await client.query('BEGIN');

    // Check employee exists
    const empResult = await client.query('SELECT id, name FROM hr_employees WHERE id = $1 LIMIT 1', [employeeId]);
    if (empResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Check balance
    const year = new Date(fromDate).getFullYear();
    await ensureBalanceRow(client, employeeId, year);
    const col = LEAVE_TYPE_COLUMN[leaveType];
    const balResult = await client.query(
      `SELECT ${col}_total AS total, ${col}_used AS used FROM leave_balances WHERE employee_id = $1 AND year = $2`,
      [employeeId, year]
    );
    const bal = balResult.rows[0];
    if (bal && (bal.total - bal.used) < dayCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Insufficient ${leaveType.replace('_', ' ')} leave balance. Available: ${bal.total - bal.used} days.` });
    }

    const leaveId = crypto.randomUUID();
    await client.query(
      `INSERT INTO leave_requests (id, employee_id, leave_type, from_date, to_date, days, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [leaveId, employeeId, leaveType, fromDate, toDate, dayCount, reason || '']
    );

    await client.query(
      `UPDATE leave_balances SET ${col}_used = ${col}_used + $1, updated_at = NOW()
       WHERE employee_id = $2 AND year = $3`,
      [dayCount, employeeId, year]
    );

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Leave request submitted.', id: leaveId });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

/* ── PUT /:id/approve  —  Approve a leave ── */
router.put('/:id/approve', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!['admin', 'super_admin'].includes(req.user?.role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Manager approval is required for employee leave requests.' });
    }

    const leaveResult = await client.query(
      'SELECT * FROM leave_requests WHERE id = $1 LIMIT 1',
      [req.params.id]
    );
    const leave = leaveResult.rows[0];
    if (!leave) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Leave request not found.' }); }
    if (leave.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ message: `Leave already ${leave.status}.` }); }

    // Balance was already decremented upon application, so we do not decrement again.

    await client.query(
      `UPDATE leave_requests SET status = 'approved', reviewed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    await client.query('COMMIT');
    clearCache(CACHE_LEAVE_SUMMARY);
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
    await client.query('BEGIN');
    if (!['admin', 'super_admin'].includes(req.user?.role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Manager rejection is required for employee leave requests.' });
    }

    const leaveResult = await client.query('SELECT * FROM leave_requests WHERE id = $1 LIMIT 1', [req.params.id]);
    const leave = leaveResult.rows[0];
    if (!leave) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Leave request not found.' }); }
    if (leave.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ message: `Leave already ${leave.status}.` }); }

    // Refund balance
    const year = new Date(leave.from_date).getFullYear();
    const col = LEAVE_TYPE_COLUMN[leave.leave_type];
    await ensureBalanceRow(client, leave.employee_id, year);
    await client.query(
      `UPDATE leave_balances SET ${col}_used = ${col}_used - $1, updated_at = NOW()
       WHERE employee_id = $2 AND year = $3`,
      [leave.days, leave.employee_id, year]
    );

    await client.query(
      `UPDATE leave_requests SET status = 'rejected', reviewed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    await client.query('COMMIT');
    clearCache(CACHE_LEAVE_SUMMARY);
    return res.json({ message: 'Leave rejected and balance refunded.' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

export default router;
