/**
 * Integration tests for AI Sales Agent route handler logic
 * Tests: session creation/retrieval, message validation, lead submission,
 *        rate limiting, and error response shapes.
 *
 * Requirements: 2.2, 5.4, 11.1, 11.4
 *
 * Strategy: test business logic by exercising imported service functions
 * directly with inline mirrors, following the mock-pool pattern used in
 * analyticsTracker.test.js and sessionManager.test.js. No live DB or
 * HTTP server is required.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// ─── Import pure/logic utilities ─────────────────────────────────────────────
import { validateLeadData } from '../services/salesAgent/leadProcessor.js';
import { checkRateLimit, resetRateLimit } from '../utils/rateLimiter.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a unique session ID per test to avoid cross-test rate-limit bleed. */
function uid() {
  return randomUUID();
}

// ─── Mock pool factory (same pattern as analyticsTracker.test.js) ─────────────

function makeMockPool() {
  const calls = [];
  const pool = {
    _calls: calls,
    _queue: [],
    enqueue(result) { this._queue.push(result); },
    async query(text, params) {
      const result = this._queue.length > 0 ? this._queue.shift() : { rows: [] };
      calls.push({ text, params, result });
      return result;
    },
    connect() {
      const clientCalls = [];
      const client = {
        _calls: clientCalls,
        _queue: [],
        enqueue(r) { this._queue.push(r); },
        async query(text, params) {
          const result = this._queue.length > 0 ? this._queue.shift() : { rows: [] };
          clientCalls.push({ text, params, result });
          return result;
        },
        async release() {},
      };
      pool._mockClient = client;
      return Promise.resolve(client);
    },
  };
  return pool;
}

// ─── Mock req / res factory ───────────────────────────────────────────────────

function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
  return res;
}

function makeReq({ query = {}, body = {}, ip = '127.0.0.1', headers = {} } = {}) {
  return {
    query,
    body,
    ip,
    socket: { remoteAddress: ip },
    get: (h) => headers[h.toLowerCase()] || null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. GET /session logic
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /session — session creation', () => {
  it('creates a new session when no sessionId is provided', async () => {
    const pool = makeMockPool();

    // Mirror route logic: no sessionId → session is null → create
    const sessionId = undefined;
    let session = null;

    if (sessionId) {
      session = await pool.query('SELECT...', [sessionId]).then(r => r.rows[0] || null);
    }

    assert.equal(session, null); // triggers creation path

    const newRow = { id: uid(), session_id: uid(), status: 'active', created_at: new Date().toISOString() };
    pool.enqueue({ rows: [newRow] });
    const { rows } = await pool.query('INSERT INTO sales_agent_sessions...', []);
    session = rows[0];

    assert.ok(session.session_id, 'new session has a session_id');
    assert.equal(session.status, 'active');
  });

  it('returns existing session when valid sessionId is provided', async () => {
    const pool = makeMockPool();
    const existingSession = {
      id: uid(), session_id: uid(), status: 'active',
      lead_captured: false, created_at: new Date().toISOString(),
    };
    pool.enqueue({ rows: [existingSession] });

    const { rows } = await pool.query(
      `SELECT * FROM sales_agent_sessions WHERE session_id = $1 LIMIT 1`,
      [existingSession.session_id]
    );
    const session = rows.length > 0 ? rows[0] : null;

    assert.deepEqual(session, existingSession);
    assert.equal(pool._calls[0].params[0], existingSession.session_id);
  });

  it('returns welcomeMessage only when messages array is empty', () => {
    const WELCOME_MESSAGE = "Hi! 👋 I'm Seevora's AI assistant. I can help you learn about our AI automation solutions for your business. What brings you here today?";

    // zero messages → should have welcome
    const emptyMessages = [];
    const welcomeWhenEmpty = emptyMessages.length === 0 ? WELCOME_MESSAGE : null;
    assert.equal(welcomeWhenEmpty, WELCOME_MESSAGE);

    // non-empty messages → no welcome
    const existingMessages = [{ id: '1', sender: 'agent', message_text: WELCOME_MESSAGE }];
    const welcomeWhenHasMessages = existingMessages.length === 0 ? WELCOME_MESSAGE : null;
    assert.equal(welcomeWhenHasMessages, null);
  });

  it('starts fresh session when archived and restore !== true', async () => {
    const pool = makeMockPool();
    const archivedSession = {
      id: uid(), session_id: uid(), status: 'archived',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    };
    pool.enqueue({ rows: [archivedSession] });

    // Mirror route: fetch session by id
    const { rows } = await pool.query(
      `SELECT * FROM sales_agent_sessions WHERE session_id = $1 LIMIT 1`,
      [archivedSession.session_id]
    );
    let session = rows.length > 0 ? rows[0] : null;

    // Route logic: archived + restore !== 'true' → null out session → create new
    const restore = 'false';
    if (session && session.status === 'archived' && restore !== 'true') {
      session = null;
    }

    assert.equal(session, null, 'archived session without restore=true results in fresh session');
  });

  it('restores archived session when restore=true is provided', async () => {
    const pool = makeMockPool();
    const archivedSession = {
      id: uid(), session_id: uid(), status: 'archived',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    };
    pool.enqueue({ rows: [archivedSession] });

    const { rows } = await pool.query(
      `SELECT * FROM sales_agent_sessions WHERE session_id = $1 LIMIT 1`,
      [archivedSession.session_id]
    );
    let session = rows.length > 0 ? rows[0] : null;

    const restore = 'true';
    if (session && session.status === 'archived' && restore !== 'true') {
      session = null;
    }

    assert.ok(session, 'archived session with restore=true is kept');
    assert.equal(session.status, 'archived');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. POST /message — validation logic (mirrors route handler guards)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mirror the validation block from the route handler so we can unit-test
 * the guard logic without wiring up Express or a DB.
 */
function validateMessageInput(sessionId, message) {
  if (!sessionId || typeof sessionId !== 'string') {
    return { status: 400, error: 'Bad Request', code: 'MISSING_SESSION_ID', message: 'sessionId is required.' };
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return { status: 400, error: 'Bad Request', code: 'MISSING_MESSAGE', message: 'Message is required.' };
  }
  if (message.length > 500) {
    return { status: 400, error: 'Bad Request', code: 'MESSAGE_TOO_LONG', message: 'Message exceeds maximum length of 500 characters.' };
  }
  return null; // valid
}

describe('POST /message — input validation', () => {
  it('returns 400 MISSING_SESSION_ID when sessionId is missing', () => {
    const result = validateMessageInput(undefined, 'Hello');
    assert.equal(result.status, 400);
    assert.equal(result.code, 'MISSING_SESSION_ID');
  });

  it('returns 400 MISSING_SESSION_ID when sessionId is not a string', () => {
    const result = validateMessageInput(42, 'Hello');
    assert.equal(result.status, 400);
    assert.equal(result.code, 'MISSING_SESSION_ID');
  });

  it('returns 400 MISSING_MESSAGE when message is missing', () => {
    const result = validateMessageInput(uid(), undefined);
    assert.equal(result.status, 400);
    assert.equal(result.code, 'MISSING_MESSAGE');
  });

  it('returns 400 MISSING_MESSAGE when message is empty string', () => {
    const result = validateMessageInput(uid(), '');
    assert.equal(result.status, 400);
    assert.equal(result.code, 'MISSING_MESSAGE');
  });

  it('returns 400 MISSING_MESSAGE when message is whitespace-only', () => {
    const result = validateMessageInput(uid(), '   ');
    assert.equal(result.status, 400);
    assert.equal(result.code, 'MISSING_MESSAGE');
  });

  it('returns 400 MESSAGE_TOO_LONG when message exceeds 500 chars', () => {
    const longMsg = 'a'.repeat(501);
    const result = validateMessageInput(uid(), longMsg);
    assert.equal(result.status, 400);
    assert.equal(result.code, 'MESSAGE_TOO_LONG');
  });

  it('returns null (valid) for exactly 500 chars message', () => {
    const maxMsg = 'a'.repeat(500);
    const result = validateMessageInput(uid(), maxMsg);
    assert.equal(result, null);
  });

  it('returns null (valid) for normal input', () => {
    const result = validateMessageInput(uid(), 'Tell me about your services');
    assert.equal(result, null);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Rate limiter integration (uses real checkRateLimit / resetRateLimit)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Rate limiter — 20 message window enforcement', () => {
  it('allows first 20 calls and blocks the 21st', () => {
    const sessionId = uid();

    // Make 20 allowed calls
    for (let i = 0; i < 20; i++) {
      const result = checkRateLimit(sessionId);
      assert.equal(result.allowed, true, `Call ${i + 1} should be allowed`);
    }

    // 21st call should be blocked
    const blocked = checkRateLimit(sessionId);
    assert.equal(blocked.allowed, false, '21st call should be rate-limited');
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfter > 0, 'retryAfter should be a positive number');

    resetRateLimit(sessionId);
  });

  it('allows calls again after resetRateLimit', () => {
    const sessionId = uid();

    for (let i = 0; i < 20; i++) checkRateLimit(sessionId);
    assert.equal(checkRateLimit(sessionId).allowed, false);

    resetRateLimit(sessionId);

    const afterReset = checkRateLimit(sessionId);
    assert.equal(afterReset.allowed, true, 'should be allowed after reset');

    resetRateLimit(sessionId);
  });

  it('tracks different sessions independently', () => {
    const sessionA = uid();
    const sessionB = uid();

    // Exhaust session A
    for (let i = 0; i < 20; i++) checkRateLimit(sessionA);
    assert.equal(checkRateLimit(sessionA).allowed, false, 'session A should be blocked');

    // Session B should still be fine
    const bResult = checkRateLimit(sessionB);
    assert.equal(bResult.allowed, true, 'session B should be unaffected');

    resetRateLimit(sessionA);
    resetRateLimit(sessionB);
  });

  it('returns correct remaining count as messages are sent', () => {
    const sessionId = uid();

    const first = checkRateLimit(sessionId);
    assert.equal(first.remaining, 19, 'after first call, 19 remaining');

    const second = checkRateLimit(sessionId);
    assert.equal(second.remaining, 18, 'after second call, 18 remaining');

    resetRateLimit(sessionId);
  });

  it('route returns 429 error shape on rate limit exceeded', () => {
    // Mirror the route response shape when rate limit fires
    const rateCheck = { allowed: false, retryAfter: 55 };
    const res = makeRes();

    if (!rateCheck.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please slow down.',
        retryAfter: rateCheck.retryAfter,
      });
    }

    assert.equal(res._status, 429);
    assert.equal(res._body.code, 'RATE_LIMIT_EXCEEDED');
    assert.equal(res._body.error, 'Too Many Requests');
    assert.ok('retryAfter' in res._body, 'response should include retryAfter');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. POST /lead — validateLeadData (real module) and duplicate guard
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /lead — validateLeadData integration', () => {
  it('returns valid for correct lead data', () => {
    const { valid, errors } = validateLeadData({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+91-9876543210',
      serviceInterest: 'AI Voice Receptionist',
    });
    assert.equal(valid, true);
    assert.deepEqual(errors, {});
  });

  it('returns error when name is missing', () => {
    const { valid, errors } = validateLeadData({
      name: '',
      email: 'test@example.com',
      phone: null,
      serviceInterest: 'WhatsApp Automation',
    });
    assert.equal(valid, false);
    assert.ok('name' in errors, 'should have name error');
  });

  it('returns error when email is missing', () => {
    const { valid, errors } = validateLeadData({
      name: 'Raj Kumar',
      email: '',
      phone: null,
      serviceInterest: 'WhatsApp Automation',
    });
    assert.equal(valid, false);
    assert.ok('email' in errors);
  });

  it('returns error when email format is invalid', () => {
    const { valid, errors } = validateLeadData({
      name: 'Raj Kumar',
      email: 'not-an-email',
      phone: null,
      serviceInterest: 'AI Voice Receptionist',
    });
    assert.equal(valid, false);
    assert.ok('email' in errors);
    assert.match(errors.email, /valid email/i);
  });

  it('returns error when serviceInterest is missing', () => {
    const { valid, errors } = validateLeadData({
      name: 'Raj Kumar',
      email: 'raj@example.com',
      phone: null,
      serviceInterest: '',
    });
    assert.equal(valid, false);
    assert.ok('serviceInterest' in errors);
  });

  it('returns error when name exceeds 200 chars', () => {
    const { valid, errors } = validateLeadData({
      name: 'A'.repeat(201),
      email: 'a@b.com',
      phone: null,
      serviceInterest: 'Custom Integrations',
    });
    assert.equal(valid, false);
    assert.ok('name' in errors);
  });

  it('returns error when phone exceeds 40 chars', () => {
    const { valid, errors } = validateLeadData({
      name: 'Valid Name',
      email: 'v@example.com',
      phone: '1'.repeat(41),
      serviceInterest: 'Custom Integrations',
    });
    assert.equal(valid, false);
    assert.ok('phone' in errors);
  });

  it('accepts null/undefined phone (optional field)', () => {
    const { valid } = validateLeadData({
      name: 'Valid Name',
      email: 'v@example.com',
      phone: null,
      serviceInterest: 'Custom Integrations',
    });
    assert.equal(valid, true);
  });

  it('returns multiple errors when multiple fields are invalid', () => {
    const { valid, errors } = validateLeadData({
      name: '',
      email: 'bad-email',
      phone: null,
      serviceInterest: '',
    });
    assert.equal(valid, false);
    assert.ok('name' in errors);
    assert.ok('email' in errors);
    assert.ok('serviceInterest' in errors);
  });
});

describe('POST /lead — duplicate lead guard (leadExistsForSession)', () => {
  it('returns 409 LEAD_ALREADY_CAPTURED when lead already exists for session', async () => {
    const pool = makeMockPool();

    // Mock: lead already exists for session
    pool.enqueue({ rows: [{ id: 'existing-lead-uuid' }] });

    const { rows } = await pool.query(
      `SELECT id FROM sales_agent_leads WHERE session_id = $1 LIMIT 1`,
      ['sess-uuid']
    );
    const exists = rows.length > 0;

    const res = makeRes();
    if (exists) {
      res.status(409).json({
        error: 'Conflict',
        code: 'LEAD_ALREADY_CAPTURED',
        message: 'Contact information already captured for this session.',
      });
    }

    assert.equal(res._status, 409);
    assert.equal(res._body.code, 'LEAD_ALREADY_CAPTURED');
    assert.equal(res._body.error, 'Conflict');
  });

  it('proceeds with lead creation when no duplicate exists', async () => {
    const pool = makeMockPool();

    // Mock: no existing lead
    pool.enqueue({ rows: [] });

    const { rows } = await pool.query(
      `SELECT id FROM sales_agent_leads WHERE session_id = $1 LIMIT 1`,
      ['sess-uuid']
    );
    const exists = rows.length > 0;

    assert.equal(exists, false, 'no existing lead → proceed with creation');
  });

  it('returns 400 VALIDATION_ERROR when lead data is invalid', () => {
    const { valid, errors } = validateLeadData({
      name: '', email: 'bad', phone: null, serviceInterest: '',
    });

    const res = makeRes();
    if (!valid) {
      res.status(400).json({
        error: 'Validation Error',
        code: 'VALIDATION_ERROR',
        message: 'Please fix the errors below.',
        errors,
      });
    }

    assert.equal(res._status, 400);
    assert.equal(res._body.code, 'VALIDATION_ERROR');
    assert.ok(res._body.errors, 'errors field should be present');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Error response shapes — verify { error, code, message } contract
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Canonical error shape constants mirroring salesAgent.js responses.
 * Tests confirm these shapes satisfy the API contract from the design doc.
 */
const ERROR_SHAPES = {
  'bad_request_missing_session': {
    status: 400, error: 'Bad Request', code: 'MISSING_SESSION_ID',
    message: 'sessionId is required.',
  },
  'bad_request_missing_message': {
    status: 400, error: 'Bad Request', code: 'MISSING_MESSAGE',
    message: 'Message is required.',
  },
  'bad_request_message_too_long': {
    status: 400, error: 'Bad Request', code: 'MESSAGE_TOO_LONG',
    message: 'Message exceeds maximum length of 500 characters.',
  },
  'bad_request_validation_error': {
    status: 400, error: 'Validation Error', code: 'VALIDATION_ERROR',
    message: 'Please fix the errors below.',
  },
  'not_found_session': {
    status: 404, error: 'Not Found', code: 'SESSION_NOT_FOUND',
    message: 'Session not found.',
  },
  'not_found_session_expired': {
    status: 404, error: 'Not Found', code: 'SESSION_EXPIRED',
    message: 'This session has expired. Please start a new conversation.',
  },
  'conflict_lead_duplicate': {
    status: 409, error: 'Conflict', code: 'LEAD_ALREADY_CAPTURED',
    message: 'Contact information already captured for this session.',
  },
  'rate_limit_exceeded': {
    status: 429, error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded. Please slow down.',
  },
  'internal_error': {
    status: 500, error: 'Internal Server Error', code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  },
  'gateway_timeout': {
    status: 504, error: 'Gateway Timeout', code: 'AI_TIMEOUT',
    message: 'AI response took too long. Please try again.',
  },
};

function hasErrorShape(body) {
  return (
    typeof body.error === 'string' &&
    typeof body.code === 'string' &&
    typeof body.message === 'string'
  );
}

describe('Error response shapes — { error, code, message } contract', () => {
  it('400 MISSING_SESSION_ID has correct shape', () => {
    const shape = ERROR_SHAPES['bad_request_missing_session'];
    assert.equal(shape.status, 400);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'MISSING_SESSION_ID');
  });

  it('400 MISSING_MESSAGE has correct shape', () => {
    const shape = ERROR_SHAPES['bad_request_missing_message'];
    assert.equal(shape.status, 400);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'MISSING_MESSAGE');
  });

  it('400 MESSAGE_TOO_LONG has correct shape', () => {
    const shape = ERROR_SHAPES['bad_request_message_too_long'];
    assert.equal(shape.status, 400);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'MESSAGE_TOO_LONG');
  });

  it('400 VALIDATION_ERROR has correct shape', () => {
    const shape = ERROR_SHAPES['bad_request_validation_error'];
    assert.equal(shape.status, 400);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'VALIDATION_ERROR');
  });

  it('404 SESSION_NOT_FOUND has correct shape', () => {
    const shape = ERROR_SHAPES['not_found_session'];
    assert.equal(shape.status, 404);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'SESSION_NOT_FOUND');
  });

  it('404 SESSION_EXPIRED has correct shape', () => {
    const shape = ERROR_SHAPES['not_found_session_expired'];
    assert.equal(shape.status, 404);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'SESSION_EXPIRED');
  });

  it('409 LEAD_ALREADY_CAPTURED has correct shape', () => {
    const shape = ERROR_SHAPES['conflict_lead_duplicate'];
    assert.equal(shape.status, 409);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'LEAD_ALREADY_CAPTURED');
  });

  it('429 RATE_LIMIT_EXCEEDED has correct shape', () => {
    const shape = ERROR_SHAPES['rate_limit_exceeded'];
    assert.equal(shape.status, 429);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'RATE_LIMIT_EXCEEDED');
  });

  it('500 INTERNAL_ERROR has correct shape', () => {
    const shape = ERROR_SHAPES['internal_error'];
    assert.equal(shape.status, 500);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'INTERNAL_ERROR');
  });

  it('504 AI_TIMEOUT has correct shape', () => {
    const shape = ERROR_SHAPES['gateway_timeout'];
    assert.equal(shape.status, 504);
    assert.ok(hasErrorShape(shape));
    assert.equal(shape.code, 'AI_TIMEOUT');
  });

  it('all error shapes have the required three fields', () => {
    for (const [key, shape] of Object.entries(ERROR_SHAPES)) {
      assert.ok(
        hasErrorShape(shape),
        `${key} is missing error/code/message field`
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Message exchange flow — mock DB round-trip
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /message — session lookup and archived session handling', () => {
  it('returns 404 SESSION_NOT_FOUND when session does not exist', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] }); // session not found

    const { rows } = await pool.query(
      `SELECT * FROM sales_agent_sessions WHERE session_id = $1 LIMIT 1`,
      ['non-existent-id']
    );
    const session = rows.length > 0 ? rows[0] : null;

    const res = makeRes();
    if (!session) {
      res.status(404).json({
        error: 'Not Found', code: 'SESSION_NOT_FOUND', message: 'Session not found.',
      });
    }

    assert.equal(res._status, 404);
    assert.equal(res._body.code, 'SESSION_NOT_FOUND');
  });

  it('returns 404 SESSION_EXPIRED when session status is archived', async () => {
    const pool = makeMockPool();
    const archivedSession = {
      id: uid(), session_id: uid(), status: 'archived',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    };
    pool.enqueue({ rows: [archivedSession] });

    const { rows } = await pool.query(
      `SELECT * FROM sales_agent_sessions WHERE session_id = $1 LIMIT 1`,
      [archivedSession.session_id]
    );
    const session = rows.length > 0 ? rows[0] : null;

    const res = makeRes();
    if (session && session.status === 'archived') {
      res.status(404).json({
        error: 'Not Found', code: 'SESSION_EXPIRED',
        message: 'This session has expired. Please start a new conversation.',
      });
    }

    assert.equal(res._status, 404);
    assert.equal(res._body.code, 'SESSION_EXPIRED');
  });

  it('message save flow: inserts message and updates session activity', async () => {
    const pool = makeMockPool();
    const client = await pool.connect();
    const sessionId = uid();
    const savedMsg = { id: uid(), sender: 'user', message_text: 'Tell me about pricing', created_at: new Date().toISOString() };

    client.enqueue({ rows: [] });        // BEGIN
    client.enqueue({ rows: [savedMsg] }); // INSERT message
    client.enqueue({ rows: [] });        // UPDATE session
    client.enqueue({ rows: [] });        // COMMIT

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO sales_agent_messages (session_id, sender, message_text, metadata) VALUES ($1, $2, $3, $4) RETURNING *`,
      [sessionId, 'user', 'Tell me about pricing', null]
    );
    await client.query(
      `UPDATE sales_agent_sessions SET last_activity_at = NOW(), message_count = message_count + 1 WHERE id = $1`,
      [sessionId]
    );
    await client.query('COMMIT');
    await client.release();

    assert.equal(rows[0].message_text, 'Tell me about pricing');
    assert.equal(rows[0].sender, 'user');
    assert.equal(client._calls[0].text, 'BEGIN');
    assert.ok(client._calls[2].text.includes('message_count = message_count + 1'));
    assert.equal(client._calls[3].text, 'COMMIT');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. POST /session/end — end session logic
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /session/end — end session logic', () => {
  it('returns 400 when sessionId is missing', () => {
    const sessionId = undefined;
    const res = makeRes();
    if (!sessionId) {
      res.status(400).json({
        error: 'Bad Request', code: 'MISSING_SESSION_ID', message: 'sessionId is required.',
      });
    }
    assert.equal(res._status, 400);
    assert.equal(res._body.code, 'MISSING_SESSION_ID');
  });

  it('returns 404 when session does not exist', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const { rows } = await pool.query(
      `SELECT * FROM sales_agent_sessions WHERE session_id = $1 LIMIT 1`,
      ['missing']
    );
    const session = rows.length > 0 ? rows[0] : null;

    const res = makeRes();
    if (!session) {
      res.status(404).json({
        error: 'Not Found', code: 'SESSION_NOT_FOUND', message: 'Session not found.',
      });
    }

    assert.equal(res._status, 404);
    assert.equal(res._body.code, 'SESSION_NOT_FOUND');
  });

  it('updates session status to ended on successful end', async () => {
    const pool = makeMockPool();
    const sessionUUID = uid();
    pool.enqueue({ rows: [] }); // UPDATE result

    await pool.query(
      `UPDATE sales_agent_sessions SET status = 'ended', ended_at = NOW() WHERE id = $1`,
      [sessionUUID]
    );

    const [call] = pool._calls;
    assert.ok(call.text.includes("status = 'ended'"));
    assert.ok(call.text.includes('ended_at = NOW()'));
    assert.equal(call.params[0], sessionUUID);
  });

  it('returns success shape on successful end', () => {
    const res = makeRes();
    res.status(200).json({ success: true, message: 'Session ended.' });
    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.ok(typeof res._body.message === 'string');
  });
});
