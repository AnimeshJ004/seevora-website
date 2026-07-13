import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  backfillManagerEmployeeProfiles,
  ensureManagerEmployeeProfile,
} from './employeeProfileService.js';

function queuedClient(results) {
  return {
    calls: [],
    results: [...results],
    async query(text, params = []) {
      this.calls.push({ text: String(text), params });
      return this.results.shift() || { rows: [], rowCount: 0 };
    },
  };
}

const manager = {
  id: 'manager-user-1',
  username: 'Sambandh Jain',
  email: 'Manager@Seevora.in',
  phone: '+91 90000 00000',
  created_at: '2026-07-10T20:30:00.000Z',
};

describe('ensureManagerEmployeeProfile', () => {
  it('is idempotent when the manager already has an employee profile', async () => {
    const profile = { id: 'employee-1', user_id: manager.id, employee_code: 'EMP-1001' };
    const client = queuedClient([{ rows: [profile], rowCount: 1 }]);

    const result = await ensureManagerEmployeeProfile(client, manager);

    assert.deepEqual(result, { profile, created: false, linked: false });
    assert.equal(client.calls.length, 1);
  });

  it('links an unassigned employee profile with the same normalized email', async () => {
    const client = queuedClient([
      { rows: [], rowCount: 0 },
      { rows: [{ id: 'employee-2', user_id: null, employee_code: 'EMP-1002' }], rowCount: 1 },
      { rows: [{ id: 'employee-2', user_id: manager.id, employee_code: 'EMP-1002' }], rowCount: 1 },
    ]);

    const result = await ensureManagerEmployeeProfile(client, manager);

    assert.equal(result.linked, true);
    assert.equal(result.created, false);
    assert.deepEqual(client.calls[1].params, ['manager@seevora.in']);
    assert.deepEqual(client.calls[2].params, [manager.id, 'employee-2']);
    assert.match(client.calls[2].text, /account_active = true/);
  });

  it('creates a manager profile with the required defaults', async () => {
    const client = queuedClient([
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [{ id: 'employee-3', user_id: manager.id, employee_code: 'EMP-1234' }], rowCount: 1 },
    ]);

    const result = await ensureManagerEmployeeProfile(client, manager);
    const insert = client.calls[3];

    assert.equal(result.created, true);
    assert.match(insert.text, /'Management', 'Manager', 0/);
    assert.match(insert.text, /'active', true/);
    assert.equal(insert.params[1], manager.id);
    assert.match(insert.params[2], /^EMP-/);
    assert.equal(insert.params[3], manager.username);
    assert.equal(insert.params[4], 'manager@seevora.in');
    assert.equal(insert.params[5], manager.phone);
    assert.equal(insert.params[6], '2026-07-10');
  });

  it('rejects an email profile already linked to another user', async () => {
    const client = queuedClient([
      { rows: [], rowCount: 0 },
      { rows: [{ id: 'employee-4', user_id: 'another-user' }], rowCount: 1 },
    ]);

    await assert.rejects(
      ensureManagerEmployeeProfile(client, manager),
      (error) => error.code === 'MANAGER_PROFILE_CONFLICT'
    );
    assert.equal(client.calls.length, 2);
  });
});

describe('backfillManagerEmployeeProfiles', () => {
  it('creates missing profiles in one transaction and releases the client', async () => {
    const client = queuedClient([
      { rows: [], rowCount: 0 },
      { rows: [manager], rowCount: 1 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [{ id: 'employee-5', user_id: manager.id, employee_code: 'EMP-1005' }], rowCount: 1 },
      { rows: [], rowCount: 0 },
    ]);
    let released = false;
    client.release = () => { released = true; };
    const database = { connect: async () => client };
    const logCalls = [];

    const result = await backfillManagerEmployeeProfiles(database, {
      logger: { info: (...args) => logCalls.push(args) },
    });

    assert.deepEqual(result, { managers: 1, created: 1, linked: 0 });
    assert.equal(client.calls[0].text, 'BEGIN');
    assert.match(client.calls[1].text, /LOWER\(u\.role\) = 'manager'/);
    assert.equal(client.calls.at(-1).text, 'COMMIT');
    assert.equal(logCalls.length, 1);
    assert.equal(released, true);
  });

  it('rolls back and releases the client when a profile cannot be backfilled', async () => {
    let released = false;
    const calls = [];
    const client = {
      async query(text) {
        const sql = String(text);
        calls.push(sql);
        if (sql === 'BEGIN') return { rows: [], rowCount: 0 };
        if (sql.includes('FROM users u')) return { rows: [manager], rowCount: 1 };
        if (sql.includes('WHERE user_id = $1')) return { rows: [], rowCount: 0 };
        if (sql.includes('LOWER(email)')) {
          return { rows: [{ id: 'employee-6', user_id: 'another-user' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
      release() { released = true; },
    };

    await assert.rejects(
      backfillManagerEmployeeProfiles({ connect: async () => client }),
      /already linked/
    );

    assert.equal(calls.at(-1), 'ROLLBACK');
    assert.equal(calls.includes('COMMIT'), false);
    assert.equal(released, true);
  });
});
