import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasTrustedOrigin,
  requireTrustedOrigin,
  securityHeaders,
  validateAuthenticatedCsrf,
} from './security.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalClientOrigin = process.env.CLIENT_ORIGIN;

function makeRequest({ method = 'POST', origin = '', referer = '', csrf = '' } = {}) {
  const headers = { origin, referer, 'x-csrf-token': csrf };
  return {
    method,
    originalUrl: '/api/test',
    get(name) {
      return headers[String(name).toLowerCase()] || '';
    },
  };
}

function makeResponse() {
  return {
    locals: {},
    statusCode: 200,
    body: null,
    headers: {},
    set(name, value) {
      if (typeof name === 'object') Object.assign(this.headers, name);
      else this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
});

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalClientOrigin === undefined) delete process.env.CLIENT_ORIGIN;
  else process.env.CLIENT_ORIGIN = originalClientOrigin;
});

describe('CSRF request validation', () => {
  it('accepts only the exact configured browser origin', () => {
    assert.equal(hasTrustedOrigin(makeRequest({ origin: 'http://localhost:5173' })), true);
    assert.equal(hasTrustedOrigin(makeRequest({ origin: 'https://attacker.example' })), false);
  });

  it('rejects login requests with a missing or untrusted origin', () => {
    for (const origin of ['', 'https://attacker.example']) {
      const response = makeResponse();
      let nextCalled = false;
      requireTrustedOrigin(makeRequest({ origin }), response, () => {
        nextCalled = true;
      });
      assert.equal(nextCalled, false);
      assert.equal(response.statusCode, 403);
    }
  });

  it('requires a matching session-bound token for unsafe methods', () => {
    const session = { csrfToken: 'csrf-value' };
    assert.equal(validateAuthenticatedCsrf(
      makeRequest({ origin: 'http://localhost:5173', csrf: 'csrf-value' }),
      session
    ).valid, true);
    assert.equal(validateAuthenticatedCsrf(
      makeRequest({ origin: 'http://localhost:5173', csrf: 'wrong' }),
      session
    ).valid, false);
  });

  it('does not require a CSRF token for safe methods', () => {
    assert.equal(validateAuthenticatedCsrf(
      makeRequest({ method: 'GET', origin: 'https://attacker.example' }),
      { csrfToken: 'csrf-value' }
    ).valid, true);
  });
});

describe('production content security policy', () => {
  it('uses a per-request nonce and blocks inline scripts without it', () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_ORIGIN = 'https://seevora.in';
    const response = makeResponse();
    let nextCalled = false;

    securityHeaders(makeRequest({ method: 'GET' }), response, () => {
      nextCalled = true;
    });

    const policy = response.headers['Content-Security-Policy'];
    assert.equal(nextCalled, true);
    assert.ok(response.locals.cspNonce);
    assert.equal(
      policy.includes(`script-src 'self' 'nonce-${response.locals.cspNonce}'`),
      true
    );
    assert.doesNotMatch(policy.split(';')[1], /unsafe-inline/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /base-uri 'self'/);
  });
});
