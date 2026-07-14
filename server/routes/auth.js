import bcrypt from 'bcryptjs';
import express from 'express';
import pool from '../config/db.js';
import crypto from 'crypto';
import { requireAuth, resolveAuthSession } from '../middleware/auth.js';
import { sendMail } from '../utils/mailer.js';
import { recordLoginAttendance } from './attendance.js';
import { validateLogin } from '../utils/validation.js';
import { requireTrustedOrigin } from '../middleware/security.js';
import { createPostgresRateLimiter } from '../middleware/rateLimit.js';
import { normalizeRole } from '../middleware/auth.js';
import {
  clearSessionCookies,
  createAuthSession,
  readSessionToken,
  revokeSessionToken,
  revokeUserSessions,
  setSessionCookie,
} from '../services/auth/sessionService.js';

const router = express.Router();
const loginLimiter = createPostgresRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  policy: 'auth_login',
  subject: (req) => String(req.body?.identifier || '').trim().toLowerCase() || 'missing',
});

function toSafeUser(user) {
  const name = user.name || user.username;
  return {
    id: user.id,
    username: user.username,
    name,
    email: user.email,
    phone: user.phone,
    role: normalizeRole(user.role),
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

router.post('/login', requireTrustedOrigin, loginLimiter, async (req, res, next) => {
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

    const session = await createAuthSession(user.id, { remember: req.body?.remember === true });
    setSessionCookie(res, session.token, session.maxAge);
    res.set('Cache-Control', 'no-store');

    console.info(JSON.stringify({
      event: 'auth_session_login',
      sessionId: session.id,
      userId: user.id,
      remembered: session.remembered,
      timestamp: new Date().toISOString(),
    }));

    queueMicrotask(() => {
      recordLoginAttendance(pool, user).catch((attendanceError) => {
        console.error('Failed to record attendance login:', attendanceError);
      });
    });

    return res.json({
      message: 'Login successful.',
      user: toSafeUser(user),
      csrfToken: session.csrfToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Valid email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Look up user by email
    const userResult = await pool.query(
      `SELECT id, username, email FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    // If user not found, return success anyway to prevent enumeration
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If an account exists, a password reset link has been sent.' });
    }

    const user = userResult.rows[0];

    // 2. Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Store token with 1 hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // 4. Send email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
    
    // Log the link to the terminal so the user can test it if SMTP fails (e.g. hPanel blocking)
    console.log('\n[DEBUG] Password Reset Link generated:', resetLink, '\n');

    await sendMail({
      to: user.email,
      subject: 'Seevora Password Reset Request',
      text: `Hello ${user.username || 'User'},\n\nYou requested a password reset. Please use the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nThis link will expire in 1 hour.`,
      html: `<p>Hello <strong>${user.username || 'User'}</strong>,</p>
             <p>You requested a password reset. Please click the link below to reset your password:</p>
             <p><a href="${resetLink}">Reset Password</a></p>
             <p>If you did not request this, please ignore this email.</p>
             <p>This link will expire in 1 hour.</p>`,
    });

    return res.json({ message: 'If an account exists, a password reset link has been sent.' });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await revokeSessionToken(readSessionToken(req), 'logout');
    clearSessionCookies(res);
    res.set({
      'Cache-Control': 'no-store',
      'Clear-Site-Data': '"cache", "cookies", "storage"',
    });
    console.info(JSON.stringify({
      event: 'auth_session_logout',
      sessionId: req.authSession.id,
      userId: req.user.id,
      timestamp: new Date().toISOString(),
    }));
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout-all', requireAuth, async (req, res, next) => {
  try {
    const revoked = await revokeUserSessions(req.user.id, 'logout_all');
    clearSessionCookies(res);
    res.set({
      'Cache-Control': 'no-store',
      'Clear-Site-Data': '"cache", "cookies", "storage"',
    });
    console.info(JSON.stringify({
      event: 'auth_sessions_logout_all',
      userId: req.user.id,
      revoked,
      timestamp: new Date().toISOString(),
    }));
    return res.json({ message: 'All sessions were logged out.', revoked });
  } catch (error) {
    return next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing token.' });
    }
    
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 1. Verify token
    const tokenResult = await pool.query(
      `SELECT id, user_id FROM password_reset_tokens 
       WHERE token_hash = $1 
         AND expires_at > NOW() 
         AND used_at IS NULL`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }

    const { id: tokenId, user_id: userId } = tokenResult.rows[0];

    // 2. Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 3. Update user's password
      await client.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [passwordHash, userId]
      );

      // 4. Mark token as used
      await client.query(
        `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
        [tokenId]
      );

      // 5. Invalidate all sessions for the user to ensure security
      await client.query(
        `UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Since we revoked all sessions, we should clear the session cookie on this response if one exists
    clearSessionCookies(res);

    return res.json({ message: 'Password successfully reset.' });
  } catch (error) {
    return next(error);
  }
});

router.get('/session', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const auth = await resolveAuthSession(req, res);
    if (!auth) {
      return res.json({ authenticated: false, user: null });
    }

    return res.json({
      authenticated: true,
      user: toSafeUser(req.user),
      csrfToken: req.authSession.csrfToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: toSafeUser(req.user),
    csrfToken: req.authSession.csrfToken,
  });
});

export default router;
