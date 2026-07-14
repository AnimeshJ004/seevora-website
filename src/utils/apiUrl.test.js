import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiUrl, resolveApiUrl } from './apiUrl.js';

const originalWindow = global.window;

afterEach(() => {
  if (originalWindow === undefined) delete global.window;
  else global.window = originalWindow;
});

describe('apiUrl', () => {
  it('keeps relative API paths unchanged outside the browser', () => {
    delete global.window;
    assert.equal(apiUrl('/api/auth/login'), '/api/auth/login');
  });

  it('keeps localhost API requests on the Vite proxy origin', () => {
    global.window = {
      location: {
        hostname: 'localhost',
        port: '5173',
      },
    };

    assert.equal(
      resolveApiUrl('/api/auth/login', {
        apiOrigin: 'https://seevora.in/api',
        location: global.window.location,
      }),
      '/api/auth/login'
    );
  });

  it('keeps 127.0.0.1 API requests on the Vite proxy origin', () => {
    global.window = {
      location: {
        hostname: '127.0.0.1',
        port: '5173',
      },
    };

    assert.equal(apiUrl('/api/auth/session'), '/api/auth/session');
  });

  it('keeps non-API paths relative on localhost', () => {
    global.window = {
      location: {
        hostname: 'localhost',
        port: '5173',
      },
    };

    assert.equal(apiUrl('/favicon.ico'), '/favicon.ico');
  });

  it('uses the configured API origin for a deployed frontend', () => {
    assert.equal(
      resolveApiUrl('/api/auth/login', {
        apiOrigin: 'https://seevora.in/api/',
        location: { hostname: 'seevora.in', port: '' },
      }),
      'https://seevora.in/api/auth/login'
    );
  });
});
