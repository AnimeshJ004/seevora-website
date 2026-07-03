import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const LEAVE_TYPES = ['casual', 'sick', 'annual', 'comp_off'];
const LEAVE_TYPE_COLUMN = {
  casual: 'casual',
  sick: 'sick',
  annual: 'annual',
  comp_off: 'comp_off',
};

async function getEmployeeByUserId(userId) {
  const res = await pool.query(
    'SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return res.rows[0] || null;
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

/* ── GET /api/employee/leaves  —  Get employee leaves and balances ── */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const emp = await getEmployeeByUserId(req.user.id);
    if (!emp) {
      return res.json({ leaves: [], balances: null, message: 'No employee profile linked to this account.' });
    }

    const year = new Date().getFullYear();
    const client = await pool.connect();
    try {
      await ensureBalanceRow(client, emp.id, year);
    } finally {
      client.release();
    }

    // Fetch Balances
    const balResult = await pool.query(
      `SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 LIMIT 1`,
      [emp.id, year]
    );
    const row = balResult.rows[0];
    let balances = null;
    if (row) {
      balances = {
        year: row.year,
        casual: { total: row.casual_total, used: row.casual_used, remaining: row.casual_total - row.casual_used },
        sick: { total: row.sick_total, used: row.sick_used, remaining: row.sick_total - row.sick_used },
        annual: { total: row.annual_total, used: row.annual_used, remaining: row.annual_total - row.annual_used },
        compOff: { total: row.comp_off_total, used: row.comp_off_used, remaining: row.comp_off_total - row.comp_off_used },
        totalUsed: row.casual_used + row.sick_used + row.annual_used + row.comp_off_used,
        totalRemaining: (row.casual_total - row.casual_used) + (row.sick_total - row.sick_used) + (row.annual_total - row.annual_used) + (row.comp_off_total - row.comp_off_used),
      };
    }

    // Fetch Requests
    const leavesResult = await pool.query(
      `SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY applied_at DESC`,
      [emp.id]
    );
    const leaves = leavesResult.rows.map(l => ({
      id: l.id,
      type: l.leave_type,
      from: l.from_date ? String(l.from_date).slice(0, 10) : '',
      to: l.to_date ? String(l.to_date).slice(0, 10) : '',
      days: Number(l.days),
      reason: l.reason,
      status: l.status,
      applied: l.applied_at,
    }));

    return res.json({ leaves, balances });
  } catch (error) {
    return next(error);
  }
});

/* ── POST /api/employee/leaves  —  Apply for a leave ── */
router.post('/', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const emp = await getEmployeeByUserId(req.user.id);
    if (!emp) {
      return res.status(400).json({ message: 'No employee profile linked to this account.' });
    }

    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !LEAVE_TYPES.includes(leaveType)) return res.status(400).json({ message: 'Invalid leave type.' });
    if (!fromDate || !toDate) return res.status(400).json({ message: 'From and To dates are required.' });
    
    const dayCount = Math.ceil((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;
    if (dayCount < 1) return res.status(400).json({ message: 'Invalid date range.' });

    await client.query('BEGIN');

    const year = new Date(fromDate).getFullYear();
    await ensureBalanceRow(client, emp.id, year);
    
    const col = LEAVE_TYPE_COLUMN[leaveType];
    const balResult = await client.query(
      `SELECT ${col}_total AS total, ${col}_used AS used FROM leave_balances WHERE employee_id = $1 AND year = $2`,
      [emp.id, year]
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
      [leaveId, emp.id, leaveType, fromDate, toDate, dayCount, reason || '']
    );

    await client.query(
      `UPDATE leave_balances SET ${col}_used = ${col}_used + $1, updated_at = NOW()
       WHERE employee_id = $2 AND year = $3`,
      [dayCount, emp.id, year]
    );

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Leave request submitted successfully.', id: leaveId });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

export default router;
