import bcrypt from 'bcryptjs';
import express from 'express';
import pool from '../config/db.js';
import { requireAuth, resolveAuthSession } from '../middleware/auth.js';
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

router.post('/forgot-password', (req, res) => {
  return res.status(404).json({ message: 'Password reset is not available.' });
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

router.post('/reset-password', (req, res) => {
  return res.status(404).json({ message: 'Password reset is not available.' });
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
