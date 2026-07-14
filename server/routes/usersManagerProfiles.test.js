import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../config/db.js';
import usersRouter from './users.js';

const originalConnect = pool.connect;

function routeHandler(method, path) {
  const route = usersRouter.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods[method]
  )?.route;
  assert.ok(route, `${method.toUpperCase()} ${path} route is missing`);
  return route.stack.at(-1).handle;
}

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
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

function makeClient(queryHandler) {
  const calls = [];
  let released = false;
  return {
    calls,
    async query(text, params = []) {
      const sql = String(text);
      calls.push({ sql, params });
      return queryHandler(sql, params);
    },
    release() {
      released = true;
    },
    wasReleased() {
      return released;
    },
  };
}

afterEach(() => {
  pool.connect = originalConnect;
});

describe('manager profile account mutations', () => {
  it('creates the user and manager employee profile in the same transaction', async () => {
    const client = makeClient((sql, params) => {
      if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [], rowCount: 0 };
      if (sql.includes('INSERT INTO users')) {
        return {
          rows: [{
            id: params[0],
            username: params[1],
            email: params[2],
            phone: params[3],
            role: params[4],
            verification_status: params[6],
            created_at: '2026-07-13T00:00:00.000Z',
            updated_at: '2026-07-13T00:00:00.000Z',
          }],
          rowCount: 1,
        };
      }
      if (sql.includes('WHERE user_id = $1')) return { rows: [], rowCount: 0 };
      if (sql.includes('LOWER(email)')) return { rows: [], rowCount: 0 };
      if (sql.includes('employee_code = $1')) return { rows: [], rowCount: 0 };
      if (sql.includes('INSERT INTO hr_employees')) {
        return { rows: [{ id: params[0], user_id: params[1], employee_code: params[2] }], rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    pool.connect = async () => client;
    const response = makeResponse();

    await routeHandler('post', '/')({
      body: {
        username: 'New Manager',
        email: 'New.Manager@Seevora.in',
        phone: '+91 90000 00003',
        role: 'manager',
        password: 'Temporary@123',
      },
    }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.role, 'manager');
    assert.equal(response.body.email, 'new.manager@seevora.in');
    assert.equal(response.body.verification_status, 'VERIFIED');
    assert.equal(client.calls.some(({ sql }) => sql.includes('INSERT INTO hr_employees')), true);
    assert.equal(client.calls.at(-1).sql, 'COMMIT');
    assert.equal(client.wasReleased(), true);
  });

  it('rolls back user creation when the manager profile belongs to another account', async () => {
    const client = makeClient((sql, params) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('INSERT INTO users')) {
        return {
          rows: [{
            id: params[0], username: params[1], email: params[2], phone: null,
            role: 'manager', created_at: '2026-07-13T00:00:00.000Z',
          }],
          rowCount: 1,
        };
      }
      if (sql.includes('WHERE user_id = $1')) return { rows: [], rowCount: 0 };
      if (sql.includes('LOWER(email)')) {
        return { rows: [{ id: 'profile-1', user_id: 'other-user' }], rowCount: 1 };
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    pool.connect = async () => client;
    const response = makeResponse();

    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      await routeHandler('post', '/')({
        body: {
          username: 'Conflicting Manager',
          email: 'conflict@seevora.in',
          role: 'manager',
          password: 'Temporary@123',
        },
      }, response);
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(response.statusCode, 409);
    assert.match(response.body.error, /already linked/);
    assert.equal(client.calls.at(-1).sql, 'ROLLBACK');
    assert.equal(client.calls.some(({ sql }) => sql === 'COMMIT'), false);
    assert.equal(client.wasReleased(), true);
  });

  it('rejects creating a user with a weak password before opening a transaction', async () => {
    let connected = false;
    pool.connect = async () => {
      connected = true;
      throw new Error('pool.connect should not be called');
    };
    const response = makeResponse();

    await routeHandler('post', '/')({
      body: {
        username: 'Weak User',
        email: 'weak@seevora.in',
        role: 'employee',
        password: 'password',
      },
    }, response);

    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /uppercase/i);
    assert.equal(connected, false);
  });

  it('rejects updating a user to a weak password and rolls back', async () => {
    const client = makeClient((sql) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('FROM users') && sql.includes('FOR UPDATE')) {
        return {
          rows: [{
            id: 'user-1', username: 'User', email: 'user@seevora.in',
            phone: null, role: 'employee', verification_status: 'PENDING_VERIFICATION',
            created_at: '2026-07-13T00:00:00.000Z',
          }],
          rowCount: 1,
        };
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    pool.connect = async () => client;
    const response = makeResponse();

    await routeHandler('put', '/:id')({
      params: { id: 'user-1' },
      body: { password: 'password' },
    }, response);

    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /uppercase/i);
    assert.equal(client.calls.at(-1).sql, 'ROLLBACK');
    assert.equal(client.calls.some(({ sql }) => sql.includes('UPDATE users')), false);
    assert.equal(client.wasReleased(), true);
  });

  it('blocks changing a manager role while direct reports remain assigned', async () => {
    const client = makeClient((sql) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('FROM users') && sql.includes('FOR UPDATE')) {
        return {
          rows: [{
            id: 'manager-1', username: 'Manager', email: 'manager@seevora.in',
            phone: null, role: 'manager', verification_status: 'VERIFIED',
            created_at: '2026-07-13T00:00:00.000Z',
          }],
          rowCount: 1,
        };
      }
      if (sql.includes('COUNT(report.id)')) return { rows: [{ count: 2 }], rowCount: 1 };
      throw new Error(`Unexpected query: ${sql}`);
    });
    pool.connect = async () => client;
    const response = makeResponse();

    await routeHandler('put', '/:id')({
      params: { id: 'manager-1' },
      body: { role: 'employee' },
    }, response);

    assert.equal(response.statusCode, 409);
    assert.match(response.body.error, /Reassign.*direct reports/);
    assert.equal(client.calls.at(-1).sql, 'ROLLBACK');
    assert.equal(client.wasReleased(), true);
  });

  it('blocks deleting a manager account while direct reports remain assigned', async () => {
    const client = makeClient((sql) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('SELECT id FROM users')) return { rows: [{ id: 'manager-1' }], rowCount: 1 };
      if (sql.includes('COUNT(report.id)')) return { rows: [{ count: 1 }], rowCount: 1 };
      throw new Error(`Unexpected query: ${sql}`);
    });
    pool.connect = async () => client;
    const response = makeResponse();

    await routeHandler('delete', '/:id')({
      params: { id: 'manager-1' },
      user: { id: 'admin-1' },
    }, response);

    assert.equal(response.statusCode, 409);
    assert.match(response.body.error, /Reassign.*direct reports/);
    assert.equal(client.calls.at(-1).sql, 'ROLLBACK');
    assert.equal(client.wasReleased(), true);
  });
});
