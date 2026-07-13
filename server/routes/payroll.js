import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { getCache, setCache } from '../utils/cache.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireRole('hr', 'admin'));

function salaryParts(salary, deductions = 0) {
  const monthlySalary = Number(salary || 0);
  const deductionAmount = Number(deductions || 0);
  const basic = Math.round(monthlySalary * 0.50);
  const hra = Math.round(monthlySalary * 0.20);
  const allowance = monthlySalary - basic - hra;
  const netPay = monthlySalary - deductionAmount;

  return { monthlySalary, basic, hra, allowance, deductions: deductionAmount, netPay };
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

async function resetAutomaticDeductions(db, month) {
  return db.query(`
    UPDATE payroll_records pr
    SET basic = ROUND(e.salary * 0.50),
        hra = ROUND(e.salary * 0.20),
        allowance = e.salary - ROUND(e.salary * 0.50) - ROUND(e.salary * 0.20),
        deductions = 0,
        net_pay = e.salary,
        updated_at = NOW()
    FROM hr_employees e
    WHERE e.id = pr.employee_id
      AND pr.month = $1
      AND pr.status IN ('draft', 'processing')
      AND pr.deductions = ROUND(e.salary * 0.10)
      AND pr.allowance = ROUND(e.salary * 0.20)
  `, [month]);
}

function toPayroll(row) {
  const monthlySalary = Number(row.monthly_salary || 0);
  const lpa = monthlySalary * 12;

  return {
    id: row.id,
    employeeId: row.employee_id,
    emp: row.emp_name || '',
    employeeCode: row.employee_code || '',
    monthlySalary: formatCurrency(monthlySalary),
    monthlySalaryRaw: monthlySalary,
    lpa: formatCurrency(lpa),
    lpaRaw: lpa,
    basic: formatCurrency(row.basic),
    hra: formatCurrency(row.hra),
    allowance: formatCurrency(row.allowance),
    deductions: formatCurrency(row.deductions),
    deductionsRaw: Number(row.deductions || 0),
    net: formatCurrency(row.net_pay),
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
    await resetAutomaticDeductions(pool, month);

    const result = await pool.query(`
      SELECT pr.*, e.name AS emp_name, e.employee_code, e.salary AS monthly_salary
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

    // Cache payroll summary per-month for 60 seconds
    const cacheKey = `hr_payroll_summary_${month}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    await resetAutomaticDeductions(pool, month);

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

    const payload = {
      month,
      totalRecords: Number(row.total_records || 0),
      paid: Number(row.paid || 0),
      processing: Number(row.processing || 0),
      draft: Number(row.draft || 0),
      totalPayroll: formatIndian(totalPayroll),
      totalPayrollRaw: totalPayroll,
      avgSalary: formatIndian(avgSalary),
      avgSalaryRaw: avgSalary,
    };
    setCache(cacheKey, payload, 60);
    return res.json(payload);
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
    const resetResult = await resetAutomaticDeductions(client, month);

    // Get all active employees
    const employees = await client.query(
      `SELECT id, salary FROM hr_employees WHERE status = 'active'`
    );

    let created = 0;
    const reset = resetResult.rowCount || 0;
    let skipped = 0;

    for (const emp of employees.rows) {
      const parts = salaryParts(emp.salary, 0);

      // Check if already generated for this month
      const existing = await client.query(
        'SELECT id FROM payroll_records WHERE employee_id = $1 AND month = $2 LIMIT 1',
        [emp.id, month]
      );
      if (existing.rowCount > 0) {
        skipped += 1;
        continue;
      }

      await client.query(
        `INSERT INTO payroll_records (id, employee_id, month, basic, hra, allowance, deductions, net_pay, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')`,
        [crypto.randomUUID(), emp.id, month, parts.basic, parts.hra, parts.allowance, 0, parts.netPay]
      );
      created += 1;
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: `Payroll generated for ${month}. Created: ${created}, Reset unpaid: ${reset}, Skipped (already exists): ${skipped}.`,
      created,
      reset,
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

/* ── PUT /:id/deduction  —  Manually set deduction amount ── */
router.put('/:id/deduction', async (req, res, next) => {
  try {
    const deductions = Number(req.body?.deductions || 0);
    if (!Number.isFinite(deductions) || deductions < 0) {
      return res.status(400).json({ message: 'Enter a valid deduction amount.' });
    }

    const current = await pool.query(`
      SELECT pr.id, pr.status, e.salary
      FROM payroll_records pr
      JOIN hr_employees e ON e.id = pr.employee_id
      WHERE pr.id = $1
      LIMIT 1
    `, [req.params.id]);
    if (current.rowCount === 0) return res.status(404).json({ message: 'Payroll record not found.' });

    const record = current.rows[0];
    if (record.status === 'paid') {
      return res.status(400).json({ message: 'Paid payroll cannot be edited.' });
    }

    const salary = Number(record.salary || 0);
    if (deductions > salary) {
      return res.status(400).json({ message: 'Deduction cannot be greater than monthly salary.' });
    }

    const parts = salaryParts(salary, deductions);
    const result = await pool.query(
      `UPDATE payroll_records
       SET deductions = $2,
           basic = $3,
           hra = $4,
           allowance = $5,
           net_pay = $6,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, parts.deductions, parts.basic, parts.hra, parts.allowance, parts.netPay]
    );

    return res.json({
      message: 'Deduction updated.',
      payroll: toPayroll({
        ...result.rows[0],
        monthly_salary: salary,
      }),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
