import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, setCsrfToken } from './api.js';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;

function storageStub() {
  return { removeItem() {} };
}

beforeEach(() => {
  globalThis.window = {
    dispatchEvent() {},
    history: { replaceState() {} },
    location: { pathname: '/dashboard' },
  };
  globalThis.localStorage = storageStub();
  globalThis.sessionStorage = storageStub();
  setCsrfToken('');
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.window = originalWindow;
  globalThis.localStorage = originalLocalStorage;
  globalThis.sessionStorage = originalSessionStorage;
  setCsrfToken('');
});

describe('apiFetch CSRF recovery', () => {
  it('refreshes the session and retries once when an unsafe request has a stale token', async () => {
    const calls = [];
    setCsrfToken('stale-token');
    globalThis.fetch = async (endpoint, options = {}) => {
      calls.push({ endpoint, options });

      if (calls.length === 1) {
        return Response.json({ message: 'CSRF validation failed.' }, { status: 403 });
      }
      if (endpoint === '/api/auth/session') {
        return Response.json({
          authenticated: true,
          user: { id: 'hr-1', role: 'hr' },
          csrfToken: 'fresh-token',
        });
      }
      return Response.json({ message: 'Employee account created successfully.' }, { status: 201 });
    };

    const response = await apiFetch('/api/hr/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    assert.equal(response.status, 201);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].options.headers.get('X-CSRF-Token'), 'stale-token');
    assert.equal(calls[1].endpoint, '/api/auth/session');
    assert.equal(calls[2].options.headers.get('X-CSRF-Token'), 'fresh-token');
  });

  it('restores a valid session before sending an unsafe request without a token', async () => {
    const calls = [];
    globalThis.fetch = async (endpoint, options = {}) => {
      calls.push({ endpoint, options });
      if (endpoint === '/api/auth/session') {
        return Response.json({
          authenticated: true,
          user: { id: 'admin-1', role: 'admin' },
          csrfToken: 'restored-token',
        });
      }
      return Response.json({ message: 'ok' });
    };

    const response = await apiFetch('/api/users', { method: 'DELETE' });

    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].endpoint, '/api/auth/session');
    assert.equal(calls[1].options.headers.get('X-CSRF-Token'), 'restored-token');
  });
});
