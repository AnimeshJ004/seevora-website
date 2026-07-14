import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertRateLimitConfiguration,
  createPostgresRateLimiter,
  hashRateLimitSubject,
} from './rateLimit.js';

const TEST_SECRET = 'test-rate-limit-secret-at-least-32-characters';
const originalNodeEnv = process.env.NODE_ENV;
const originalRateLimitSecret = process.env.RATE_LIMIT_KEY_SECRET;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalRateLimitSecret === undefined) delete process.env.RATE_LIMIT_KEY_SECRET;
  else process.env.RATE_LIMIT_KEY_SECRET = originalRateLimitSecret;
});

function invoke(middleware) {
  return new Promise((resolve, reject) => {
    const headers = {};
    const req = {
      body: { identifier: 'User@Example.com' },
      ip: '198.51.100.10',
      method: 'POST',
      originalUrl: '/api/auth/login',
      url: '/api/auth/login',
    };
    const res = {
      headersSent: false,
      set(name, value) {
        if (typeof name === 'object') {
          for (const [header, headerValue] of Object.entries(name)) headers[header] = String(headerValue);
        } else {
          headers[name] = String(value);
        }
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.headersSent = true;
        resolve({ body, headers, statusCode: this.statusCode });
        return this;
      },
    };

    middleware(req, res, (error) => {
      if (error) reject(error);
      else resolve({ allowed: true, headers, statusCode: 200 });
    });
  });
}

describe('PostgreSQL rate-limit middleware', () => {
  it('creates stable, policy-isolated HMAC subjects', () => {
    const loginHash = hashRateLimitSubject('auth_login', 'user@example.com', TEST_SECRET);
    const repeatedHash = hashRateLimitSubject('auth_login', 'user@example.com', TEST_SECRET);
    const auditHash = hashRateLimitSubject('audit_submit', 'user@example.com', TEST_SECRET);

    assert.equal(loginHash, repeatedHash);
    assert.notEqual(loginHash, auditHash);
    assert.match(loginHash, /^[a-f0-9]{64}$/);
    assert.equal(loginHash.includes('user@example.com'), false);
  });

  it('returns the generic 429 contract and standard headers', async () => {
    const database = {
      async query() {
        return {
          rows: [{ hit_count: 2, expires_at: new Date(Date.now() + 60_000), retry_after: 60 }],
        };
      },
    };
    const limiter = createPostgresRateLimiter({
      policy: 'auth_login',
      max: 1,
      windowMs: 60_000,
      subject: (req) => req.body.identifier.toLowerCase(),
      database,
      keySecret: TEST_SECRET,
    });

    const response = await invoke(limiter);
    assert.equal(response.statusCode, 429);
    assert.equal(response.body.retryAfter, 60);
    assert.equal(response.headers['RateLimit-Limit'], '1');
    assert.equal(response.headers['RateLimit-Remaining'], '0');
    assert.equal(response.headers['Retry-After'], '60');
  });

  it('requires a dedicated strong secret in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.RATE_LIMIT_KEY_SECRET = 'short';
    assert.throws(() => assertRateLimitConfiguration(), /at least 32 characters/);

    process.env.RATE_LIMIT_KEY_SECRET = TEST_SECRET;
    assert.doesNotThrow(() => assertRateLimitConfiguration());
  });
});
