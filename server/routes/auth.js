import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { recordLoginAttendance } from './attendance.js';
import { validateForgotPassword, validateLogin, validateResetPassword } from '../utils/validation.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function createResetCode() {
  return crypto.randomBytes(24).toString('hex').toUpperCase();
}

function hashResetCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function toSafeUser(user) {
  const name = user.name || user.username;
  return {
    id: user.id,
    username: user.username,
    name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    verificationStatus: user.verification_status || 'PENDING_VERIFICATION',
    avatar: String(name || user.email || 'U')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U',
    createdAt: user.created_at,
  };
}

router.post('/login', async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateLogin(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.phone, u.role, u.verification_status, u.password_hash, u.created_at,
              COALESCE(e.name, u.username) AS name
       FROM users u
       LEFT JOIN hr_employees e ON e.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1) OR LOWER(u.username) = LOWER($1)
       LIMIT 1`,
      [data.identifier.toLowerCase()]
    );

    const user = result.rows[0];
    const passwordMatches = user ? await bcrypt.compare(data.password, user.password_hash) : false;
    if (!user || !passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    queueMicrotask(() => {
      recordLoginAttendance(pool, user).catch((attendanceError) => {
        console.error('Failed to record attendance login:', attendanceError);
      });
    });

    return res.json({
      message: 'Login successful.',
      token: createToken(user),
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { isValid, errors, data } = validateForgotPassword(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const userResult = await client.query(
      'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1',
      [data.identifier.toLowerCase()]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'We could not find an account for that username or email.' });
    }

    const resetCode = createResetCode();
    const tokenHash = hashResetCode(resetCode);

    await client.query('BEGIN');
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL', [user.id]);
    await client.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES ($3, $1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.id, tokenHash, crypto.randomUUID()]
    );
    await client.query('COMMIT');

    return res.json({
      message: 'Reset code generated. Use it below to set a new password.',
      resetCode,
      expiresInMinutes: 15,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
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

router.post('/reset-password', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { isValid, errors, data } = validateResetPassword(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const tokenHash = hashResetCode(data.resetCode);

    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.username, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    const tokenRow = tokenResult.rows[0];
    if (!tokenRow) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'The reset code is invalid or expired.' });
    }

    if (tokenRow.used_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'The reset code has already been used.' });
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'The reset code is invalid or expired.' });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, tokenRow.user_id]
    );

    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [tokenRow.user_id]
    );

    await client.query('COMMIT');

    return res.json({
      message: 'Password reset successful. You can now log in with your new password.',
      user: {
        id: tokenRow.user_id,
        username: tokenRow.username,
        email: tokenRow.email,
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

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.phone, u.role, u.verification_status, u.created_at,
              COALESCE(e.name, u.username) AS name
       FROM users u
       LEFT JOIN hr_employees e ON e.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user: toSafeUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
