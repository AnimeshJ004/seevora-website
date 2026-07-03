import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token || token === 'undefined' || token === 'null') {
    // Demo Mode Bypass: If token is missing/invalid due to demo login, use standard demo admin
    req.user = { id: '00000000-0000-0000-0000-000000000000', role: 'super_admin', email: 'demo@seevora.com', username: 'demo_admin' };
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }
    req.user = rows[0];
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

/* Middleware: require specific roles */
export function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      const flatRoles = roles.flat();
      console.log('requireRole check - user:', req.user, 'allowed:', flatRoles);
      if (!flatRoles.includes(req.user?.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      return next();
    },
  ];
}

/* Middleware: require HR or super_admin */
export function requireHR(req, res, next) {
  return requireRole('hr', 'super_admin', 'admin')(req, res, next);
}

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
