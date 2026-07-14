import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../config/db.js';
import attendanceRouter, { attendanceHistoryGuard } from './attendance.js';

const MANAGER_USER_ID = '11111111-1111-4111-8111-111111111111';
const TARGET_USER_ID = '22222222-2222-4222-8222-222222222222';
const ATTENDANCE_ID = '33333333-3333-4333-8333-333333333333';
const originalQuery = pool.query;
const originalWarn = console.warn;

function historyRoute() {
  const route = attendanceRouter.stack.find(
    (layer) => layer.route?.path === '/employee/:userId/history' && layer.route.methods.get
  )?.route;
  assert.ok(route, 'GET /employee/:userId/history route is missing');
  return route;
}

function historyHandler() {
  return historyRoute().stack.at(-1).handle;
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

function makeRequest({ role = 'manager', userId = TARGET_USER_ID } = {}) {
  return {
    user: { id: MANAGER_USER_ID, role },
    params: { userId },
    originalUrl: `/api/hr/attendance/employee/${userId}/history`,
  };
}

function attendanceRecord() {
  return {
    id: ATTENDANCE_ID,
    user_id: TARGET_USER_ID,
    work_date: '2026-07-13',
    check_in_at: '2026-07-13T04:30:00.000Z',
    last_login_at: '2026-07-13T04:30:00.000Z',
    check_out_at: '2026-07-13T12:30:00.000Z',
    status: 'full_day',
    worked_minutes: 480,
    office_start_time: '10:00:00',
    office_end_time: '18:00:00',
  };
}

async function callHistory(request = makeRequest()) {
  const response = makeResponse();
  let nextError = null;
  await historyHandler()(request, response, (error) => {
    nextError = error || null;
  });
  assert.equal(nextError, null);
  return response;
}

afterEach(() => {
  pool.query = originalQuery;
  console.warn = originalWarn;
});

describe('attendance history object-level authorization', () => {
  it('wires authentication and the attendance history role guard before the handler', () => {
    const route = historyRoute();
    assert.equal(route.stack.some((layer) => layer.handle === attendanceHistoryGuard[0]), true);
    assert.equal(route.stack.some((layer) => layer.handle === attendanceHistoryGuard[1]), true);
  });

  it('allows only HR, admin, and manager roles through the route guard', () => {
    for (const role of ['hr', 'admin', 'manager']) {
      const response = makeResponse();
      let nextCalled = false;
      attendanceHistoryGuard[1]({ user: { role } }, response, () => { nextCalled = true; });
      assert.equal(nextCalled, true, `${role} should be allowed`);
    }

    for (const role of ['employee', 'support']) {
      const response = makeResponse();
      let nextCalled = false;
      attendanceHistoryGuard[1]({ user: { role } }, response, () => { nextCalled = true; });
      assert.equal(nextCalled, false, `${role} should be denied`);
      assert.equal(response.statusCode, 403);
    }
  });

  it('rejects malformed employee user IDs before querying the database', async () => {
    let queryCount = 0;
    pool.query = async () => {
      queryCount += 1;
      return { rows: [] };
    };

    const response = await callHistory(makeRequest({ userId: 'not-a-uuid' }));

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.message, 'A valid employee user ID is required.');
    assert.equal(queryCount, 0);
  });

  it('returns attendance only when the target is an active direct report', async () => {
    let queryCall;
    pool.query = async (sql, params) => {
      queryCall = { sql: String(sql), params };
      return { rows: [attendanceRecord()], rowCount: 1 };
    };

    const response = await callHistory();

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.fullHistory.length, 1);
    assert.equal(response.body.fullHistory[0].userId, TARGET_USER_ID);
    assert.deepEqual(queryCall.params, [TARGET_USER_ID, MANAGER_USER_ID]);
    assert.match(queryCall.sql, /manager\.id = employee\.manager_id/);
    assert.match(queryCall.sql, /manager\.user_id = \$2/);
    assert.match(queryCall.sql, /employee\.status IN \('active', 'probation'\)/);
  });

  it('returns an empty history for an authorized report without attendance records', async () => {
    pool.query = async () => ({ rows: [{ id: null }], rowCount: 1 });

    const response = await callHistory();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.fullHistory, []);
    assert.equal(response.body.totalFullDays, 0);
    assert.equal(response.body.currentWeekDays, 0);
  });

  it('uses the same generic 404 for cross-team, inactive, nonexistent, and self-selected targets', async () => {
    pool.query = async () => ({ rows: [], rowCount: 0 });
    console.warn = () => {};

    for (const userId of [
      TARGET_USER_ID,
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555',
      MANAGER_USER_ID,
    ]) {
      const response = await callHistory(makeRequest({ userId }));
      assert.equal(response.statusCode, 404);
      assert.equal(response.body.message, 'Employee attendance not found for your team.');
    }
  });

  it('records a structured security event for denied manager lookups', async () => {
    pool.query = async () => ({ rows: [], rowCount: 0 });
    let warning;
    console.warn = (value) => { warning = JSON.parse(value); };

    await callHistory();

    assert.equal(warning.event, 'attendance_history_scope_denied');
    assert.equal(warning.managerUserId, MANAGER_USER_ID);
    assert.equal(warning.targetUserId, TARGET_USER_ID);
    assert.ok(warning.timestamp);
  });

  it('preserves organization-wide attendance access for HR and admin', async () => {
    for (const role of ['hr', 'admin']) {
      let queryCall;
      pool.query = async (sql, params) => {
        queryCall = { sql: String(sql), params };
        return { rows: [attendanceRecord()], rowCount: 1 };
      };

      const response = await callHistory(makeRequest({ role }));

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.fullHistory.length, 1);
      assert.deepEqual(queryCall.params, [TARGET_USER_ID]);
      assert.doesNotMatch(queryCall.sql, /authorized_target/);
    }
  });
});
