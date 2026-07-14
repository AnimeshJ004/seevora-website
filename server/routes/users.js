import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { normalizeRole, requireRole } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';
import { revokeUserSessions } from '../services/auth/sessionService.js';
import { ensureManagerEmployeeProfile } from '../services/hr/employeeProfileService.js';

const router = express.Router();
const USER_ROLES = new Set(['admin', 'hr', 'manager', 'support', 'employee']);
const PREVERIFIED_ROLES = new Set(['admin', 'hr', 'manager', 'support']);

router.use(requireRole('admin'));

function normalizeUserRow(row) {
  return row ? { ...row, role: normalizeRole(row.role) } : row;
}

function clearUserAndEmployeeCaches() {
  invalidateCacheNamespaces(
    CACHE_NAMESPACES.users,
    CACHE_NAMESPACES.hrEmployees,
    CACHE_NAMESPACES.productivity,
    CACHE_NAMESPACES.dashboard,
    CACHE_NAMESPACES.payroll
  );
}

async function directReportCount(client, userId) {
  const result = await client.query(
    `SELECT COUNT(report.id)::int AS count
     FROM hr_employees manager
     LEFT JOIN hr_employees report ON report.manager_id = manager.id
     WHERE manager.user_id = $1`,
    [userId]
  );
  return Number(result.rows[0]?.count || 0);
}

function directReportsConflict(res, action) {
  return res.status(409).json({
    error: `Reassign this manager's direct reports before ${action}.`,
  });
}

function validatePassword(password) {
  const value = String(password || '');

  if (value !== value.trim()) return 'Password must not start or end with spaces.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 128) return 'Password must be 128 characters or fewer.';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a special character.';

  return '';
}

router.get('/', async (req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.users, { view: 'list' });
    const users = await getOrSetCache(cacheKey, 120, async () => {
      const { rows } = await pool.query(`
        SELECT u.id, u.username, u.email, u.phone, u.role, u.created_at, u.updated_at, h.joined_on::text AS joined_on
        FROM users u
        LEFT JOIN hr_employees h ON u.id = h.user_id
        ORDER BY u.created_at DESC
      `);
      return rows.map(normalizeUserRow);
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  let client;
  try {
    const { username, email, phone, role, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email and password are required' });

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const nextRole = normalizeRole(role || 'employee');
    if (!USER_ROLES.has(nextRole)) {
      return res.status(400).json({ error: 'Select a valid account role' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();
    const normalizedPhone = String(phone || '').trim() || null;
    const verificationStatus = PREVERIFIED_ROLES.has(nextRole)
      ? 'VERIFIED'
      : 'PENDING_VERIFICATION';

    client = await pool.connect();
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO users (id, username, email, phone, role, password_hash, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, email, phone, role, verification_status, created_at, updated_at
    `, [
      id,
      normalizedUsername,
      normalizedEmail,
      normalizedPhone,
      nextRole,
      password_hash,
      verificationStatus,
    ]);

    if (nextRole === 'manager') {
      await ensureManagerEmployeeProfile(client, rows[0]);
    }

    await client.query('COMMIT');
    clearUserAndEmployeeCaches();
    res.status(201).json(normalizeUserRow(rows[0]));
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    console.error('Error creating user:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Email or username already exists' });
    if (error.code === 'MANAGER_PROFILE_CONFLICT') return res.status(409).json({ error: error.message });
    res.status(500).json({ error: 'Server error' });
  } finally {
    client?.release();
  }
});

router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { username, email, phone, role, password } = req.body;

    await client.query('BEGIN');
    const currentResult = await client.query(
      `SELECT id, username, email, phone, role, verification_status, created_at
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );
    const current = currentResult.rows[0];

    if (!current) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const roleProvided = Object.prototype.hasOwnProperty.call(req.body, 'role');
    const nextRole = roleProvided ? normalizeRole(role) : normalizeRole(current.role);
    if (!USER_ROLES.has(nextRole)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Select a valid account role' });
    }

    const nextUsername = username === undefined ? current.username : String(username).trim();
    const nextEmail = email === undefined ? current.email : String(email).trim().toLowerCase();
    const nextPhone = phone === undefined ? current.phone : (String(phone || '').trim() || null);
    if (!nextUsername || !nextEmail) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const passwordChanged = typeof password === 'string' && password.length > 0;
    if (passwordChanged) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: passwordError });
      }
    }

    if (nextRole !== 'manager' && (await directReportCount(client, id)) > 0) {
      await client.query('ROLLBACK');
      return directReportsConflict(res, 'changing their role');
    }

    const passwordHash = passwordChanged ? await bcrypt.hash(password, 12) : null;
    const verificationStatus = PREVERIFIED_ROLES.has(nextRole)
      ? 'VERIFIED'
      : current.verification_status;
    const { rows } = await client.query(
      `UPDATE users
       SET username = $1,
           email = $2,
           phone = $3,
           role = $4,
           verification_status = $5,
           password_hash = COALESCE($6, password_hash),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, username, email, phone, role, verification_status, created_at, updated_at`,
      [nextUsername, nextEmail, nextPhone, nextRole, verificationStatus, passwordHash, id]
    );

    if (nextRole === 'manager') {
      await ensureManagerEmployeeProfile(client, rows[0]);
    }

    // Sync updates to hr_employees if the user has an HR profile
    const joinedOnDate = req.body.joined_on || null;
    await client.query(
      `UPDATE hr_employees 
       SET name = $1, 
           email = $2, 
           phone = $3, 
           joined_on = COALESCE($4, joined_on),
           updated_at = NOW() 
       WHERE user_id = $5`,
      [nextUsername, nextEmail, nextPhone, joinedOnDate, id]
    );

    const roleChanged = normalizeRole(current.role) !== nextRole;
    if (roleChanged || passwordChanged) {
      await revokeUserSessions(id, 'password_or_role_changed', client);
    }

    await client.query('COMMIT');

    clearUserAndEmployeeCaches();
    res.json(normalizeUserRow(rows[0]));
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error('Error updating user:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Email or username already exists' });
    if (error.code === 'MANAGER_PROFILE_CONFLICT') return res.status(409).json({ error: error.message });
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  let client;
  try {
    const { id } = req.params;

    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    client = await pool.connect();
    await client.query('BEGIN');
    const currentResult = await client.query(
      'SELECT id FROM users WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (currentResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    if (await directReportCount(client, id) > 0) {
      await client.query('ROLLBACK');
      return directReportsConflict(res, 'deleting their account');
    }

    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');

    clearUserAndEmployeeCaches();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client?.release();
  }
});

export default router;
