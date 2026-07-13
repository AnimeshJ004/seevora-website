import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { getCache, setCache, clearCache } from '../utils/cache.js';

const router = express.Router();

// Cache key constants
const CACHE_EMPLOYEES_LIST = 'hr_employees_list';
const CACHE_EMPLOYEES_SUMMARY = 'hr_employees_summary';
const EMPLOYEES_TTL = 60; // 60 seconds

function bustEmployeeCache() {
  clearCache(CACHE_EMPLOYEES_LIST);
  clearCache(CACHE_EMPLOYEES_SUMMARY);
}

const DEFAULT_PASSWORD = 'Seevora@123';

function cleanText(value) {
  return String(value || '').trim();
}

function requireEmployeeManagement(req, res, next) {
  const allowedRoles = ['hr', 'super_admin', 'admin'];
  if (!allowedRoles.includes(String(req.user?.role || '').toLowerCase())) {
    return res.status(403).json({
      message: 'Only HR or Admins can create, edit, or delete employee accounts.',
    });
  }
  return next();
}

function toEmployee(row) {
  return {
    id: row.employee_code,
    databaseId: row.id,
    userId: row.user_id,
    username: row.username || '',
    accountRole: row.account_role || 'employee',
    managerId: row.manager_id || '',
    managerName: row.manager_name || '',
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    dept: row.department,
    role: row.job_title,
    salary: `Rs ${Number(row.salary || 0).toLocaleString('en-IN')}`,
    salaryAmount: Number(row.salary || 0),
    joined: row.joined_on ? String(row.joined_on).slice(0, 10) : '',
    status: row.status,
    hasAccount: Boolean(row.account_active && row.user_id),
    createdAt: row.created_at,
  };
}

function validateEmployee(body) {
  const errors = {};
  const data = {
    name: cleanText(body.name),
    email: cleanText(body.email).toLowerCase(),
    phone: cleanText(body.phone),
    department: cleanText(body.department || body.dept),
    jobTitle: cleanText(body.jobTitle || body.role),
    salary: Number(body.salary || body.salaryAmount || 0),
    joinedOn: cleanText(body.joinedOn || body.joined),
    status: cleanText(body.status || 'active').toLowerCase(),
    accountRole: cleanText(body.accountRole || 'employee').toLowerCase(),
    managerId: cleanText(body.managerId),
    username: cleanText(body.username).toLowerCase(),
    password: String(body.password || DEFAULT_PASSWORD),
  };

  if (!data.name) errors.name = 'Employee name is required.';
  if (!data.email) errors.email = 'Employee email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!data.department) errors.department = 'Department is required.';
  if (!data.jobTitle) errors.jobTitle = 'Role is required.';
  if (!Number.isFinite(data.salary) || data.salary < 0) errors.salary = 'Enter a valid salary.';
  if (data.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (!['active', 'inactive', 'probation'].includes(data.status)) data.status = 'active';
  if (!['employee', 'manager', 'hr'].includes(data.accountRole)) data.accountRole = 'employee';
  if (!data.joinedOn) data.joinedOn = new Date().toISOString().slice(0, 10);

  return { isValid: Object.keys(errors).length === 0, errors, data };
}

function validateEmployeeUpdate(body) {
  const result = validateEmployee({ ...body, password: body.password || DEFAULT_PASSWORD });
  if (!body.password) {
    delete result.errors.password;
    result.isValid = Object.keys(result.errors).length === 0;
    result.data.password = '';
  }
  return result;
}

function usernameFromEmail(email) {
  return email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40) || `employee${crypto.randomInt(1000, 9999)}`;
}

async function createUniqueUsername(client, preferred, email) {
  const base = (preferred || usernameFromEmail(email)).slice(0, 48);
  let username = base;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await client.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [username]
    );
    if (result.rowCount === 0) return username;
    username = `${base}${crypto.randomInt(100, 999)}`;
  }

  return `${base}${crypto.randomUUID().slice(0, 6)}`;
}

async function createEmployeeCode(client) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `EMP-${crypto.randomInt(1000, 9999)}`;
    const result = await client.query(
      'SELECT id FROM hr_employees WHERE employee_code = $1 LIMIT 1',
      [code]
    );
    if (result.rowCount === 0) return code;
  }

  return `EMP-${Date.now().toString().slice(-6)}`;
}

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const cached = getCache(CACHE_EMPLOYEES_LIST);
    if (cached) return res.json(cached);

    const result = await pool.query(`
      SELECT e.id, e.user_id, e.employee_code, e.name, e.email, e.phone, e.department, e.job_title,
             e.salary, e.joined_on::text AS joined_on, e.status, e.account_active, e.created_at,
             e.manager_id, m.name AS manager_name, u.username, u.role AS account_role
      FROM hr_employees e
      LEFT JOIN hr_employees m ON m.id = e.manager_id
      LEFT JOIN users u ON u.id = e.user_id
      ORDER BY e.created_at DESC
    `);

    const payload = { employees: result.rows.map(toEmployee) };
    setCache(CACHE_EMPLOYEES_LIST, payload, EMPLOYEES_TTL);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get('/summary', async (_req, res, next) => {
  try {
    const cached = getCache(CACHE_EMPLOYEES_SUMMARY);
    if (cached) return res.json(cached);

    const [countsResult, departmentResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active,
          COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive,
          COUNT(*) FILTER (WHERE status = 'probation')::int AS probation
        FROM hr_employees
      `),
      pool.query(`
        SELECT department, COUNT(*)::int AS count
        FROM hr_employees
        GROUP BY department
        ORDER BY count DESC, department ASC
      `),
    ]);

    const counts = countsResult.rows[0] || { total: 0, active: 0, inactive: 0, probation: 0 };
    const total = Number(counts.total || 0);

    const payload = {
      total,
      active: Number(counts.active || 0),
      inactive: Number(counts.inactive || 0),
      probation: Number(counts.probation || 0),
      byDepartment: departmentResult.rows.map((row) => ({
        dept: row.department,
        count: Number(row.count || 0),
        pct: total ? Math.round((Number(row.count || 0) / total) * 100) : 0,
      })),
    };
    setCache(CACHE_EMPLOYEES_SUMMARY, payload, EMPLOYEES_TTL);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireEmployeeManagement, async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { isValid, errors, data } = validateEmployee(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    await client.query('BEGIN');

    if (data.managerId) {
      const managerResult = await client.query('SELECT id FROM hr_employees WHERE id = $1 LIMIT 1', [data.managerId]);
      if (!managerResult.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Selected manager was not found.', errors: { managerId: 'Select a valid manager.' } });
      }
    }

    const existingEmployee = await client.query(
      'SELECT id FROM hr_employees WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [data.email]
    );
    if (existingEmployee.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'An employee with this email already exists.', errors: { email: 'Email already exists.' } });
    }

    const existingUser = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [data.email]
    );
    if (existingUser.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'A user account with this email already exists.', errors: { email: 'Email already exists.' } });
    }

    const userId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();
    const employeeCode = await createEmployeeCode(client);
    const username = await createUniqueUsername(client, data.username, data.email);
    const passwordHash = await bcrypt.hash(data.password, 12);

    /* Employees start as PENDING_VERIFICATION; HR/admin are pre-verified */
    const verificationStatus = ['hr', 'super_admin', 'admin', 'manager', 'support'].includes(data.accountRole)
      ? 'VERIFIED'
      : 'PENDING_VERIFICATION';

    await client.query(
      `INSERT INTO users (id, username, email, phone, password_hash, role, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, username, data.email, data.phone || null, passwordHash, data.accountRole, verificationStatus]
    );

    const employeeResult = await client.query(
      `INSERT INTO hr_employees (
        id, user_id, employee_code, name, email, phone, department, job_title,
        salary, joined_on, status, account_active, manager_id
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12)
       RETURNING id, user_id, employee_code, name, email, phone, department, job_title,
                 salary, joined_on::text AS joined_on, status, account_active, manager_id, created_at`,
      [
        employeeId,
        userId,
        employeeCode,
        data.name,
        data.email,
        data.phone || null,
        data.department,
        data.jobTitle,
        data.salary,
        data.joinedOn,
        data.status,
        data.managerId || null,
      ]
    );

    await client.query('COMMIT');
    bustEmployeeCache();

    return res.status(201).json({
      message: 'Employee account created successfully.',
      employee: toEmployee({ ...employeeResult.rows[0], username, account_role: data.accountRole }),
      account: {
        username,
        email: data.email,
        temporaryPassword: data.password,
      },
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

router.put('/:employeeCode', requireEmployeeManagement, async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { isValid, errors, data } = validateEmployeeUpdate(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    await client.query('BEGIN');

    const currentResult = await client.query(
      `SELECT id, user_id, employee_code
       FROM hr_employees
       WHERE employee_code = $1 OR id::text = $1
       LIMIT 1`,
      [req.params.employeeCode]
    );
    const current = currentResult.rows[0];

    if (!current) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Employee not found.' });
    }

    if (data.managerId === current.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'An employee cannot report to themselves.', errors: { managerId: 'Select a different manager.' } });
    }

    if (data.managerId) {
      const managerResult = await client.query('SELECT id FROM hr_employees WHERE id = $1 LIMIT 1', [data.managerId]);
      if (!managerResult.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Selected manager was not found.', errors: { managerId: 'Select a valid manager.' } });
      }
    }

    const existingEmployee = await client.query(
      `SELECT id FROM hr_employees
       WHERE LOWER(email) = LOWER($1) AND id <> $2
       LIMIT 1`,
      [data.email, current.id]
    );
    if (existingEmployee.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'An employee with this email already exists.', errors: { email: 'Email already exists.' } });
    }

    const existingUser = await client.query(
      `SELECT id FROM users
       WHERE LOWER(email) = LOWER($1) AND id <> $2
       LIMIT 1`,
      [data.email, current.user_id]
    );
    if (existingUser.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'A user account with this email already exists.', errors: { email: 'Email already exists.' } });
    }

    let username = data.username;
    if (username) {
      const existingUsername = await client.query(
        `SELECT id FROM users
         WHERE LOWER(username) = LOWER($1) AND id <> $2
         LIMIT 1`,
        [username, current.user_id]
      );
      if (existingUsername.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'That username is already in use.', errors: { username: 'Username already exists.' } });
      }
    } else {
      const usernameResult = await client.query('SELECT username FROM users WHERE id = $1', [current.user_id]);
      username = usernameResult.rows[0]?.username || usernameFromEmail(data.email);
    }

    if (current.user_id) {
      const userValues = [username, data.email, data.phone || null, data.accountRole, current.user_id];
      let userSql = `
        UPDATE users
        SET username = $1, email = $2, phone = $3, role = $4, updated_at = NOW()
        WHERE id = $5
      `;

      if (data.password) {
        const passwordHash = await bcrypt.hash(data.password, 12);
        userSql = `
          UPDATE users
          SET username = $1, email = $2, phone = $3, role = $4, updated_at = NOW(), password_hash = $6
          WHERE id = $5
        `;
        userValues.push(passwordHash);
      }

      await client.query(userSql, userValues);
    }

    const employeeResult = await client.query(
      `UPDATE hr_employees
       SET name = $1,
           email = $2,
           phone = $3,
           department = $4,
           job_title = $5,
           salary = $6,
           joined_on = $7,
           status = $8,
           manager_id = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING id, user_id, employee_code, name, email, phone, department, job_title,
                 salary, joined_on::text AS joined_on, status, account_active, manager_id, created_at`,
      [
        data.name,
        data.email,
        data.phone || null,
        data.department,
        data.jobTitle,
        data.salary,
        data.joinedOn,
        data.status,
        data.managerId || null,
        current.id,
      ]
    );

    await client.query('COMMIT');
    bustEmployeeCache();

    return res.json({
      message: 'Employee updated successfully.',
      employee: toEmployee({ ...employeeResult.rows[0], username, account_role: data.accountRole }),
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

router.delete('/:employeeCode', requireEmployeeManagement, async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query(
      `SELECT id, user_id, name
       FROM hr_employees
       WHERE employee_code = $1 OR id::text = $1
       LIMIT 1`,
      [req.params.employeeCode]
    );
    const current = currentResult.rows[0];

    if (!current) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Employee not found.' });
    }

    await client.query('DELETE FROM hr_employees WHERE id = $1', [current.id]);
    if (current.user_id) {
      await client.query("DELETE FROM users WHERE id = $1 AND role IN ('employee', 'manager', 'hr')", [current.user_id]);
    }

    await client.query('COMMIT');
    bustEmployeeCache();

    return res.json({ message: 'Employee removed successfully.', removedId: req.params.employeeCode });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

router.get('/:employeeCode/profile', async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const employeeCode = req.params.employeeCode;
    
    const empResult = await pool.query(`
      SELECT e.id, e.user_id, e.employee_code, e.name, e.email, e.phone, e.department, e.job_title,
             e.salary, e.joined_on::text AS joined_on, e.status, e.account_active, e.created_at,
             e.manager_id, m.name AS manager_name, u.username, u.role AS account_role
      FROM hr_employees e
      LEFT JOIN hr_employees m ON m.id = e.manager_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.employee_code = $1 OR e.id::text = $1
      LIMIT 1
    `, [employeeCode]);
    
    const empRow = empResult.rows[0];
    if (!empRow) return res.status(404).json({ message: 'Employee not found.' });
    
    const employee = toEmployee(empRow);
    
    const balResult = await pool.query(`
      SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 LIMIT 1
    `, [empRow.id, year]);
    
    let balances;
    if (balResult.rows.length > 0) {
      const r = balResult.rows[0];
      balances = {
        casual: { total: r.casual_total, used: r.casual_used, remaining: r.casual_total - r.casual_used },
        sick: { total: r.sick_total, used: r.sick_used, remaining: r.sick_total - r.sick_used },
        annual: { total: r.annual_total, used: r.annual_used, remaining: r.annual_total - r.annual_used },
        compOff: { total: r.comp_off_total, used: r.comp_off_used, remaining: r.comp_off_total - r.comp_off_used }
      };
    } else {
      balances = {
        casual: { total: 0, used: 0, remaining: 0 },
        sick: { total: 0, used: 0, remaining: 0 },
        annual: { total: 0, used: 0, remaining: 0 },
        compOff: { total: 0, used: 0, remaining: 0 }
      };
    }
    
    const month = new Date().getMonth() + 1;

    const monthlyResult = await pool.query(
      `SELECT COALESCE(SUM(days), 0)::int AS used
       FROM leave_requests
       WHERE employee_id = $1
         AND status <> 'rejected'
         AND EXTRACT(YEAR FROM from_date) = $2
         AND EXTRACT(MONTH FROM from_date) = $3`,
      [empRow.id, year, month]
    );

    const yearlyResult = await pool.query(
      `SELECT COALESCE(SUM(days), 0)::int AS used
       FROM leave_requests
       WHERE employee_id = $1
         AND status <> 'rejected'
         AND EXTRACT(YEAR FROM from_date) = $2`,
      [empRow.id, year]
    );

    const monthlyUsed = Number(monthlyResult.rows[0]?.used || 0);
    const yearlyUsed = Number(yearlyResult.rows[0]?.used || 0);
    
    const MONTHLY_LEAVE_ALLOWANCE = 2;
    const YEARLY_LEAVE_ALLOWANCE = MONTHLY_LEAVE_ALLOWANCE * 12;

    const policy = {
      monthly: {
        total: MONTHLY_LEAVE_ALLOWANCE,
        used: monthlyUsed,
        remaining: Math.max(MONTHLY_LEAVE_ALLOWANCE - monthlyUsed, 0),
      },
      yearly: {
        total: YEARLY_LEAVE_ALLOWANCE,
        used: yearlyUsed,
        remaining: Math.max(YEARLY_LEAVE_ALLOWANCE - yearlyUsed, 0),
      },
    };
    
    const leaveResult = await pool.query(`
      SELECT lr.*, 
             COALESCE(reviewer.username, reviewer.email) AS reviewed_by_name
      FROM leave_requests lr
      LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
      WHERE lr.employee_id = $1
      ORDER BY lr.applied_at DESC
    `, [empRow.id]);
    
    const leaves = leaveResult.rows.map(row => ({
      id: row.id,
      type: row.leave_type,
      from: row.from_date ? String(row.from_date).slice(0, 10) : '',
      to: row.to_date ? String(row.to_date).slice(0, 10) : '',
      days: Number(row.days || 1),
      reason: row.reason || '',
      status: row.status,
      applied: row.applied_at,
      reviewedByName: row.reviewed_by_name || '',
      reviewedAt: row.reviewed_at,
    }));
    
    return res.json({
      employee,
      balances,
      policy,
      leaves
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
