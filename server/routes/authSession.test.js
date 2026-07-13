import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import authRouter from './auth.js';
import { requireAuth } from '../middleware/auth.js';

function findRoute(method, path) {
  return authRouter.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods[method]
  )?.route;
}

function makeResponse() {
  return {
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

describe('authentication session bootstrap', () => {
  it('returns a quiet unauthenticated result when no session cookie exists', async () => {
    const route = findRoute('get', '/session');
    assert.ok(route, 'GET /session route is missing');

    const response = makeResponse();
    const request = { cookies: {}, get: () => '' };
    let forwardedError = null;

    await route.stack[0].handle(request, response, (error) => {
      forwardedError = error;
    });

    assert.equal(forwardedError, null);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { authenticated: false, user: null });
    assert.equal(response.headers['Cache-Control'], 'no-store');
  });

  it('keeps the explicit current-user endpoint authentication-protected', () => {
    const route = findRoute('get', '/me');
    assert.ok(route, 'GET /me route is missing');
    assert.equal(route.stack[0].handle, requireAuth);
  });
});
