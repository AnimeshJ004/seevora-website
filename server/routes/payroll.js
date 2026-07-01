import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

function toPayroll(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    emp: row.emp_name || '',
    employeeCode: row.employee_code || '',
    basic: `₹${Number(row.basic || 0).toLocaleString('en-IN')}`,
    hra: `₹${Number(row.hra || 0).toLocaleString('en-IN')}`,
    allowance: `₹${Number(row.allowance || 0).toLocaleString('en-IN')}`,
    deductions: `₹${Number(row.deductions || 0).toLocaleString('en-IN')}`,
    net: `₹${Number(row.net_pay || 0).toLocaleString('en-IN')}`,
    netRaw: Number(row.net_pay || 0),
    month: row.month,
    status: row.status,
    processedAt: row.processed_at,
  };
}

/* ── GET /  —  List payroll records for a month ── */
router.get('/', async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const result = await pool.query(`
      SELECT pr.*, e.name AS emp_name, e.employee_code
      FROM payroll_records pr
      JOIN hr_employees e ON e.id = pr.employee_id
      WHERE pr.month = $1
      ORDER BY e.name ASC
    `, [month]);

    return res.json({ payroll: result.rows.map(toPayroll), month });
  } catch (error) {
    return next(error);
  }
});

/* ── GET /summary  —  Payroll summary ── */
router.get('/summary', async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE status = 'paid')::int AS paid,
        COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COALESCE(SUM(net_pay), 0)::numeric AS total_payroll,
        COALESCE(AVG(net_pay), 0)::numeric AS avg_salary
      FROM payroll_records
      WHERE month = $1
    `, [month]);

    const row = result.rows[0] || {};
    const totalPayroll = Number(row.total_payroll || 0);
    const avgSalary = Number(row.avg_salary || 0);

    // Format Indian currency
    const formatIndian = (num) => {
      if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
      if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
      return `₹${num.toLocaleString('en-IN')}`;
    };

    return res.json({
      month,
      totalRecords: Number(row.total_records || 0),
      paid: Number(row.paid || 0),
      processing: Number(row.processing || 0),
      draft: Number(row.draft || 0),
      totalPayroll: formatIndian(totalPayroll),
      totalPayrollRaw: totalPayroll,
      avgSalary: formatIndian(avgSalary),
      avgSalaryRaw: avgSalary,
    });
  } catch (error) {
    return next(error);
  }
});

/* ── POST /generate  —  Generate payroll for all active employees ── */
router.post('/generate', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const month = req.body.month || new Date().toISOString().slice(0, 7);

    await client.query('BEGIN');

    // Get all active employees
    const employees = await client.query(
      `SELECT id, salary FROM hr_employees WHERE status = 'active'`
    );

    let created = 0;
    let skipped = 0;

    for (const emp of employees.rows) {
      // Check if already generated for this month
      const existing = await client.query(
        'SELECT id FROM payroll_records WHERE employee_id = $1 AND month = $2 LIMIT 1',
        [emp.id, month]
      );
      if (existing.rowCount > 0) {
        skipped += 1;
        continue;
      }

      const salary = Number(emp.salary || 0);
      const basic = Math.round(salary * 0.50);
      const hra = Math.round(salary * 0.20);
      const allowance = Math.round(salary * 0.20);
      const deductions = Math.round(salary * 0.10);
      const netPay = basic + hra + allowance - deductions;

      await client.query(
        `INSERT INTO payroll_records (id, employee_id, month, basic, hra, allowance, deductions, net_pay, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')`,
        [crypto.randomUUID(), emp.id, month, basic, hra, allowance, deductions, netPay]
      );
      created += 1;
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: `Payroll generated for ${month}. Created: ${created}, Skipped (already exists): ${skipped}.`,
      created,
      skipped,
      month,
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

/* ── PUT /:id/process  —  Process a payroll record ── */
router.put('/:id/process', async (req, res, next) => {
  try {
    const current = await pool.query('SELECT * FROM payroll_records WHERE id = $1 LIMIT 1', [req.params.id]);
    if (current.rowCount === 0) return res.status(404).json({ message: 'Payroll record not found.' });

    const record = current.rows[0];
    if (record.status === 'paid') return res.status(400).json({ message: 'Payroll already processed.' });

    const newStatus = record.status === 'draft' ? 'processing' : 'paid';
    const processedAt = newStatus === 'paid' ? 'NOW()' : 'processed_at';

    await pool.query(
      `UPDATE payroll_records
       SET status = $2, processed_at = ${newStatus === 'paid' ? 'NOW()' : 'processed_at'}, updated_at = NOW()
       WHERE id = $1`,
      [req.params.id, newStatus]
    );

    return res.json({ message: `Payroll ${newStatus === 'paid' ? 'marked as paid' : 'set to processing'}.`, status: newStatus });
  } catch (error) {
    return next(error);
  }
});

export default router;
