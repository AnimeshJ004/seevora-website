import pool from '../config/db.js';
import {
  clearSessionCookies,
  findActiveAuthSession,
  hashSessionToken,
  readSessionToken,
} from '../services/auth/sessionService.js';
import { validateAuthenticatedCsrf } from './security.js';

export function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  return value === 'super_admin' ? 'admin' : value;
}

export function normalizeUser(user) {
  if (!user) return user;
  return { ...user, role: normalizeRole(user.role) };
}

export async function resolveAuthSession(req, res) {
  const token = readSessionToken(req);

  if (!token) return null;

  const auth = await findActiveAuthSession(token);
  if (!auth) {
    clearSessionCookies(res);
    console.warn(JSON.stringify({
      event: 'auth_session_rejected',
      fingerprint: hashSessionToken(token).slice(0, 12),
      timestamp: new Date().toISOString(),
    }));
    return null;
  }

  req.user = normalizeUser(auth.user);
  req.authSession = auth.session;
  res.set('Cache-Control', 'no-store');
  return auth;
}

export async function requireAuth(req, res, next) {
  try {
    const auth = await resolveAuthSession(req, res);
    if (!auth) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }

    const csrf = validateAuthenticatedCsrf(req, auth.session);
    if (!csrf.valid) {
      console.warn(JSON.stringify({
        event: 'csrf_request_rejected',
        sessionId: auth.session.id,
        reason: csrf.reason,
        method: req.method,
        path: req.originalUrl || req.url,
        timestamp: new Date().toISOString(),
      }));
      return res.status(403).json({ message: 'CSRF validation failed.' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

/* Middleware: require specific roles */
export function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      const flatRoles = roles.flat().map(normalizeRole);
      if (!flatRoles.includes(normalizeRole(req.user?.role))) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      return next();
    },
  ];
}

/* Middleware: require HR or admin */
export const requireHR = requireRole('hr', 'admin');

/* Middleware: employee must be VERIFIED to access full dashboard APIs
   This is used on APIs that require a fully verified employee.
   Call after requireAuth. */
export async function requireVerified(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT verification_status FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'User not found.' });

    const status = user.verification_status;
    if (status !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not verified by HR yet.',
        verificationStatus: status,
      });
    }
    req.user.verificationStatus = status;
    return next();
  } catch (error) {
    return next(error);
  }
}
