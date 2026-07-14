import crypto from 'node:crypto';
import pool from '../../config/db.js';

export const NORMAL_SESSION_MS = 12 * 60 * 60 * 1000;
export const REMEMBERED_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
export const PRODUCTION_SESSION_COOKIE = '__Host-seevora_session';
export const DEVELOPMENT_SESSION_COOKIE = 'seevora_session';

const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function usesSecureSessionCookie() {
  return process.env.NODE_ENV === 'production'
    || String(process.env.CLIENT_ORIGIN || '').startsWith('https://');
}

export function getSessionCookieName() {
  return usesSecureSessionCookie()
    ? PRODUCTION_SESSION_COOKIE
    : DEVELOPMENT_SESSION_COOKIE;
}

function configuredSameSite() {
  const value = String(process.env.SESSION_COOKIE_SAMESITE || 'strict').toLowerCase();
  return ['strict', 'lax', 'none'].includes(value) ? value : 'strict';
}

export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function readSessionToken(req) {
  const token = req.cookies?.[getSessionCookieName()];
  return typeof token === 'string' ? token : '';
}

function sessionCookieOptions(maxAge) {
  const sameSite = configuredSameSite();
  const options = {
    httpOnly: true,
    secure: sameSite === 'none' ? true : usesSecureSessionCookie(),
    sameSite,
    path: '/',
  };

  if (maxAge) options.maxAge = maxAge;
  return options;
}

export function setSessionCookie(res, token, maxAge) {
  res.cookie(getSessionCookieName(), token, sessionCookieOptions(maxAge));
}

export function clearSessionCookies(res) {
  const sameSite = configuredSameSite();
  const common = { httpOnly: true, sameSite, path: '/' };
  res.clearCookie(PRODUCTION_SESSION_COOKIE, { ...common, secure: true });
  res.clearCookie(DEVELOPMENT_SESSION_COOKIE, { ...common, secure: false });
}

export async function createAuthSession(
  userId,
  { remember = false, database = pool, now = new Date() } = {}
) {
  const token = crypto.randomBytes(32).toString('base64url');
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  const maxAge = remember ? REMEMBERED_SESSION_MS : NORMAL_SESSION_MS;
  const expiresAt = new Date(now.getTime() + maxAge);
  const id = crypto.randomUUID();

  await database.query(
    `INSERT INTO auth_sessions
       (id, user_id, token_hash, csrf_token, remembered, expires_at, last_used_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, hashSessionToken(token), csrfToken, remember, expiresAt, now]
  );

  return { id, token, csrfToken, expiresAt, maxAge, remembered: remember };
}

export async function findActiveAuthSession(token, database = pool) {
  if (!SESSION_TOKEN_PATTERN.test(token)) return null;

  const { rows } = await database.query(
    `SELECT
       s.id AS session_id,
       s.user_id,
       s.csrf_token,
       s.remembered,
       s.expires_at,
       s.last_used_at,
       u.id,
       u.username,
       u.email,
       u.phone,
       u.role,
       u.verification_status,
       u.created_at,
       COALESCE(e.name, u.username) AS name
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN hr_employees e ON e.user_id = u.id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
     LIMIT 1`,
    [hashSessionToken(token)]
  );

  const row = rows[0];
  if (!row) return null;

  if (!row.last_used_at || Date.now() - new Date(row.last_used_at).getTime() >= 5 * 60 * 1000) {
    await database.query(
      'UPDATE auth_sessions SET last_used_at = NOW() WHERE id = $1',
      [row.session_id]
    );
  }

  return {
    session: {
      id: row.session_id,
      userId: row.user_id,
      csrfToken: row.csrf_token,
      remembered: row.remembered,
      expiresAt: row.expires_at,
    },
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      phone: row.phone,
      role: row.role,
      verification_status: row.verification_status,
      created_at: row.created_at,
      name: row.name,
    },
  };
}

export async function revokeSessionToken(token, reason = 'logout', database = pool) {
  if (!SESSION_TOKEN_PATTERN.test(token)) return 0;
  const result = await database.query(
    `UPDATE auth_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()), revoked_reason = COALESCE(revoked_reason, $2)
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashSessionToken(token), reason]
  );
  return result.rowCount || 0;
}

export async function revokeUserSessions(userId, reason = 'account_changed', database = pool) {
  const result = await database.query(
    `UPDATE auth_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()), revoked_reason = COALESCE(revoked_reason, $2)
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason]
  );
  return result.rowCount || 0;
}

export async function cleanupAuthSessions(database = pool) {
  const result = await database.query(
    `DELETE FROM auth_sessions
     WHERE expires_at < NOW() - INTERVAL '7 days'
        OR revoked_at < NOW() - INTERVAL '7 days'`
  );
  return result.rowCount || 0;
}
