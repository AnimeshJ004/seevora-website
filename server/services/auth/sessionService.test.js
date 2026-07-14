import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVELOPMENT_SESSION_COOKIE,
  NORMAL_SESSION_MS,
  PRODUCTION_SESSION_COOKIE,
  REMEMBERED_SESSION_MS,
  cleanupAuthSessions,
  clearSessionCookies,
  createAuthSession,
  findActiveAuthSession,
  hashSessionToken,
  readSessionToken,
  revokeSessionToken,
  revokeUserSessions,
  setSessionCookie,
} from './sessionService.js';

function makeDatabase(results = []) {
  return {
    calls: [],
    results: [...results],
    async query(text, params) {
      this.calls.push({ text, params });
      return this.results.shift() || { rows: [], rowCount: 0 };
    },
  };
}

const originalNodeEnv = process.env.NODE_ENV;
const originalClientOrigin = process.env.CLIENT_ORIGIN;
const originalSessionCookieSameSite = process.env.SESSION_COOKIE_SAMESITE;

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
});

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalClientOrigin === undefined) delete process.env.CLIENT_ORIGIN;
  else process.env.CLIENT_ORIGIN = originalClientOrigin;
  if (originalSessionCookieSameSite === undefined) delete process.env.SESSION_COOKIE_SAMESITE;
  else process.env.SESSION_COOKIE_SAMESITE = originalSessionCookieSameSite;
});

describe('server-side auth sessions', () => {
  it('stores only a hash of a 256-bit random session token', async () => {
    const database = makeDatabase();
    const now = new Date('2026-07-13T00:00:00.000Z');
    const session = await createAuthSession('user-1', { database, now });
    const insert = database.calls[0];

    assert.match(session.token, /^[A-Za-z0-9_-]{43}$/);
    assert.match(session.csrfToken, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(insert.params[2], hashSessionToken(session.token));
    assert.notEqual(insert.params[2], session.token);
    assert.equal(insert.params[3], session.csrfToken);
    assert.equal(insert.params[4], false);
    assert.equal(session.expiresAt.getTime() - now.getTime(), NORMAL_SESSION_MS);
  });

  it('uses a 30-day absolute expiry only for remembered sessions', async () => {
    const database = makeDatabase();
    const now = new Date('2026-07-13T00:00:00.000Z');
    const session = await createAuthSession('user-1', { remember: true, database, now });

    assert.equal(session.remembered, true);
    assert.equal(session.maxAge, REMEMBERED_SESSION_MS);
    assert.equal(session.expiresAt.getTime() - now.getTime(), REMEMBERED_SESSION_MS);
  });

  it('rejects malformed tokens without querying the database', async () => {
    const database = makeDatabase();
    assert.equal(await findActiveAuthSession('not-a-session', database), null);
    assert.equal(database.calls.length, 0);
  });

  it('treats structured cookie-parser values as missing credentials', () => {
    const cookieName = DEVELOPMENT_SESSION_COOKIE;
    assert.equal(readSessionToken({ cookies: { [cookieName]: { forged: true } } }), '');
  });

  it('loads an active session and its current database role', async () => {
    const database = makeDatabase([{
      rows: [{
        session_id: 'session-1',
        user_id: 'user-1',
        csrf_token: 'csrf',
        remembered: false,
        expires_at: new Date(Date.now() + NORMAL_SESSION_MS),
        last_used_at: new Date(),
        id: 'user-1',
        username: 'admin',
        email: 'admin@example.com',
        phone: null,
        role: 'admin',
        verification_status: 'VERIFIED',
      }],
      rowCount: 1,
    }]);
    const token = 'a'.repeat(43);
    const auth = await findActiveAuthSession(token, database);

    assert.equal(auth.session.id, 'session-1');
    assert.equal(auth.user.role, 'admin');
    assert.equal(database.calls[0].params[0], hashSessionToken(token));
  });

  it('revokes one token or every session belonging to a user', async () => {
    const database = makeDatabase([
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 3 },
    ]);
    const token = 'b'.repeat(43);

    assert.equal(await revokeSessionToken(token, 'logout', database), 1);
    assert.equal(await revokeUserSessions('user-1', 'logout_all', database), 3);
    assert.equal(database.calls[0].params[0], hashSessionToken(token));
    assert.deepEqual(database.calls[1].params, ['user-1', 'logout_all']);
  });

  it('cleans expired and old revoked sessions', async () => {
    const database = makeDatabase([{ rows: [], rowCount: 4 }]);
    assert.equal(await cleanupAuthSessions(database), 4);
    assert.match(database.calls[0].text, /DELETE FROM auth_sessions/);
  });
});

describe('session cookie policy', () => {
  it('uses an HttpOnly Strict localhost cookie during development', () => {
    const calls = [];
    const response = { cookie: (...args) => calls.push(args) };
    setSessionCookie(response, 'token', NORMAL_SESSION_MS);

    assert.equal(calls[0][0], DEVELOPMENT_SESSION_COOKIE);
    assert.deepEqual(calls[0][2], {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: NORMAL_SESSION_MS,
    });
  });

  it('uses a Secure __Host cookie for an HTTPS deployment', () => {
    process.env.CLIENT_ORIGIN = 'https://seevora.in';
    const calls = [];
    const response = { cookie: (...args) => calls.push(args) };
    setSessionCookie(response, 'token', REMEMBERED_SESSION_MS);

    assert.equal(calls[0][0], PRODUCTION_SESSION_COOKIE);
    assert.equal(calls[0][2].secure, true);
    assert.equal(calls[0][2].sameSite, 'strict');
    assert.equal(calls[0][2].path, '/');
    assert.equal('domain' in calls[0][2], false);
  });

  it('supports SameSite=None secure cookies for cross-site frontend/backend deployments', () => {
    process.env.CLIENT_ORIGIN = 'https://seevora.in';
    process.env.SESSION_COOKIE_SAMESITE = 'none';
    const calls = [];
    const response = { cookie: (...args) => calls.push(args) };
    setSessionCookie(response, 'token', NORMAL_SESSION_MS);

    assert.equal(calls[0][0], PRODUCTION_SESSION_COOKIE);
    assert.equal(calls[0][2].secure, true);
    assert.equal(calls[0][2].sameSite, 'none');
    assert.equal(calls[0][2].httpOnly, true);
  });

  it('clears both production and development cookie names', () => {
    const calls = [];
    const response = { clearCookie: (...args) => calls.push(args) };
    clearSessionCookies(response);

    assert.deepEqual(calls.map(([name]) => name), [
      PRODUCTION_SESSION_COOKIE,
      DEVELOPMENT_SESSION_COOKIE,
    ]);
  });
});
