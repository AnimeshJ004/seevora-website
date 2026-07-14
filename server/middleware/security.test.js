import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  configuredOrigins,
  configureTrustedProxy,
  hasTrustedOrigin,
  isTrustedOrigin,
  requireTrustedOrigin,
  securityHeaders,
  validateAuthenticatedCsrf,
} from './security.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalClientOrigin = process.env.CLIENT_ORIGIN;
const originalVercelUrl = process.env.VERCEL_URL;

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
  if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = originalVercelUrl;
});

describe('CSRF request validation', () => {
  it('accepts only the exact configured browser origin', () => {
    assert.equal(hasTrustedOrigin(makeRequest({ origin: 'http://localhost:5173' })), true);
    assert.equal(hasTrustedOrigin(makeRequest({ origin: 'https://attacker.example' })), false);
  });

  it('normalizes configured origins with trailing slashes and paths', () => {
    process.env.CLIENT_ORIGIN = 'https://seevora.in/, https://www.seevora.in/login';

    assert.deepEqual(Array.from(configuredOrigins()).sort(), [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'https://seevora.in',
      'https://www.seevora.in',
    ]);
    assert.equal(hasTrustedOrigin(makeRequest({ origin: 'https://seevora.in' })), true);
    assert.equal(hasTrustedOrigin(makeRequest({ origin: 'https://www.seevora.in' })), true);
  });

  it('trusts the exact Vercel deployment URL when VERCEL_URL is present', () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_ORIGIN = 'https://seevora.in';
    process.env.VERCEL_URL = 'seevora-app-git-main-seevo.vercel.app';

    assert.equal(isTrustedOrigin('https://seevora-app-git-main-seevo.vercel.app'), true);
    assert.equal(hasTrustedOrigin(makeRequest({
      origin: 'https://seevora-app-git-main-seevo.vercel.app',
    })), true);
    assert.equal(isTrustedOrigin('https://attacker.vercel.app'), false);
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

describe('trusted reverse proxy configuration', () => {
  it('trusts only loopback proxy connections', () => {
    const app = express();
    configureTrustedProxy(app);
    const trust = app.get('trust proxy fn');

    assert.equal(trust('127.0.0.1'), true);
    assert.equal(trust('::1'), true);
    assert.equal(trust('10.0.0.5'), false);
    assert.equal(trust('203.0.113.5'), false);
  });

  it('ignores a spoofed leftmost forwarded address', async () => {
    const app = express();
    configureTrustedProxy(app);
    app.get('/ip', (req, res) => res.json({ ip: req.ip, ips: req.ips }));

    const server = await new Promise((resolve) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });

    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/ip`, {
        headers: {
          'X-Forwarded-For': '198.51.100.99, 203.0.113.20',
        },
      });
      const body = await response.json();

      assert.equal(body.ip, '203.0.113.20');
      assert.deepEqual(body.ips, ['203.0.113.20']);
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  });
});
