import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createSalesAgentRateLimitMiddleware } from './rateLimiter.js';

const TEST_SECRET = 'test-rate-limit-secret-at-least-32-characters';

class SharedRateLimitDatabase {
  constructor(entries, { fail = false } = {}) {
    this.entries = entries;
    this.fail = fail;
    this.calls = [];
  }

  async query(sql, params) {
    if (this.fail) throw new Error('Simulated PostgreSQL outage');

    this.calls.push({ sql, params });
    const [policy, subjectHash, windowMs] = params;
    const key = `${policy}:${subjectHash}`;
    const now = Date.now();
    let entry = this.entries.get(key);

    if (!entry || entry.expiresAt <= now) {
      entry = { hitCount: 1, expiresAt: now + Number(windowMs) };
      this.entries.set(key, entry);
    } else {
      entry.hitCount += 1;
    }

    return {
      rows: [{
        hit_count: entry.hitCount,
        expires_at: new Date(entry.expiresAt),
        retry_after: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
      }],
    };
  }
}

function invoke(middleware, sessionId = randomUUID(), forwardedFor = '203.0.113.10') {
  return new Promise((resolve, reject) => {
    const headers = new Map();
    const req = {
      body: sessionId === null ? {} : { sessionId },
      headers: { 'x-forwarded-for': forwardedFor },
      ip: forwardedFor,
      method: 'POST',
      originalUrl: '/api/sales-agent/message',
      url: '/api/sales-agent/message',
    };
    const res = {
      headersSent: false,
      statusCode: 200,
      set(name, value) {
        if (typeof name === 'object') {
          for (const [header, headerValue] of Object.entries(name)) {
            headers.set(header.toLowerCase(), String(headerValue));
          }
        } else {
          headers.set(String(name).toLowerCase(), String(value));
        }
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.headersSent = true;
        resolve({ allowed: false, body, headers, statusCode: this.statusCode });
        return this;
      },
    };

    try {
      middleware(req, res, (error) => {
        if (error) reject(error);
        else resolve({ allowed: true, headers, statusCode: res.statusCode });
      });
    } catch (error) {
      reject(error);
    }
  });
}

let entries;

beforeEach(() => {
  entries = new Map();
});

describe('PostgreSQL-backed sales-agent rate limiting', () => {
  it('allows 20 messages and blocks the 21st with the existing response shape', async () => {
    const database = new SharedRateLimitDatabase(entries);
    const limiter = createSalesAgentRateLimitMiddleware({ database, keySecret: TEST_SECRET });
    const sessionId = randomUUID();

    for (let index = 0; index < 20; index += 1) {
      assert.equal((await invoke(limiter, sessionId)).allowed, true);
    }

    const blocked = await invoke(limiter, sessionId);
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.body.error, 'Too Many Requests');
    assert.equal(blocked.body.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(blocked.body.retryAfter > 0);
    assert.equal(blocked.headers.get('ratelimit-limit'), '20');
    assert.equal(blocked.headers.get('ratelimit-remaining'), '0');
    assert.ok(blocked.headers.has('retry-after'));
  });

  it('shares counters across limiter instances and simulated Node restarts', async () => {
    const firstInstance = createSalesAgentRateLimitMiddleware({
      database: new SharedRateLimitDatabase(entries),
      keySecret: TEST_SECRET,
    });
    const secondInstance = createSalesAgentRateLimitMiddleware({
      database: new SharedRateLimitDatabase(entries),
      keySecret: TEST_SECRET,
    });
    const sessionId = randomUUID();

    for (let index = 0; index < 10; index += 1) await invoke(firstInstance, sessionId);
    for (let index = 0; index < 10; index += 1) await invoke(secondInstance, sessionId);

    assert.equal((await invoke(firstInstance, sessionId)).statusCode, 429);
  });

  it('keeps sessions isolated and ignores changing forwarded IP headers', async () => {
    const limiter = createSalesAgentRateLimitMiddleware({
      database: new SharedRateLimitDatabase(entries),
      keySecret: TEST_SECRET,
    });
    const firstSession = randomUUID();
    const secondSession = randomUUID();

    for (let index = 0; index < 20; index += 1) {
      await invoke(limiter, firstSession, `198.51.100.${index + 1}`);
    }

    assert.equal((await invoke(limiter, firstSession, '192.0.2.50')).statusCode, 429);
    assert.equal((await invoke(limiter, secondSession, '192.0.2.50')).allowed, true);
  });

  it('stores only an HMAC subject rather than the raw session ID', async () => {
    const database = new SharedRateLimitDatabase(entries);
    const limiter = createSalesAgentRateLimitMiddleware({ database, keySecret: TEST_SECRET });
    const sessionId = randomUUID();

    await invoke(limiter, sessionId);

    assert.equal(database.calls.length, 1);
    assert.equal(database.calls[0].params[0], 'sales_session');
    assert.match(database.calls[0].params[1], /^[a-f0-9]{64}$/);
    assert.equal(database.calls[0].params.includes(sessionId), false);
    assert.match(database.calls[0].sql, /ON CONFLICT \(policy, subject_hash\) DO UPDATE/);
  });

  it('does not consume quota when session validation has not succeeded', async () => {
    const database = new SharedRateLimitDatabase(entries);
    const limiter = createSalesAgentRateLimitMiddleware({ database, keySecret: TEST_SECRET });

    assert.equal((await invoke(limiter, null)).allowed, true);
    assert.equal(database.calls.length, 0);
  });

  it('fails closed with 503 when PostgreSQL is unavailable', async () => {
    const limiter = createSalesAgentRateLimitMiddleware({
      database: new SharedRateLimitDatabase(entries, { fail: true }),
      keySecret: TEST_SECRET,
    });

    const response = await invoke(limiter);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.retryAfter, 5);
    assert.equal(response.headers.get('retry-after'), '5');
  });
});
