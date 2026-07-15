import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import emailBotRouter from './emailBot.js';
import pool from '../config/db.js';

const clickRoute = emailBotRouter.stack.find(
  (layer) => layer.route?.path === '/track/click/:logId'
)?.route;

const originalQuery = pool.query;

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    redirectedTo: '',
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    redirect(url) {
      this.redirectedTo = url;
      return this;
    },
  };
}

async function callClickRoute({ logId, url }) {
  const response = makeResponse();
  await clickRoute.stack[0].handle(
    { params: { logId }, query: { url } },
    response
  );
  return response;
}

afterEach(() => {
  pool.query = originalQuery;
});

describe('email click tracking route', () => {
  it('updates click state and redirects for an approved target', async () => {
    const calls = [];
    pool.query = async (...args) => {
      calls.push(args);
      return { rows: [], rowCount: 1 };
    };

    const response = await callClickRoute({
      logId: '11111111-1111-4111-8111-111111111111',
      url: 'https://seevora.in/book-a-call',
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.redirectedTo, 'https://seevora.in/book-a-call');
    assert.equal(calls.length, 1);
    assert.match(calls[0][0], /UPDATE email_logs SET clicked_at/);
  });

  it('rejects unsafe targets before updating click state', async () => {
    const calls = [];
    pool.query = async (...args) => {
      calls.push(args);
      return { rows: [], rowCount: 1 };
    };

    const response = await callClickRoute({
      logId: '11111111-1111-4111-8111-111111111111',
      url: 'https://evil.example/phish',
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body, 'Redirect link invalid');
    assert.equal(response.redirectedTo, '');
    assert.equal(calls.length, 0);
  });

  it('rejects invalid log IDs before updating click state', async () => {
    let queryCalled = false;
    pool.query = async () => {
      queryCalled = true;
      return { rows: [], rowCount: 1 };
    };

    const response = await callClickRoute({
      logId: 'not-a-uuid',
      url: 'https://seevora.in/book-a-call',
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body, 'Redirect link invalid');
    assert.equal(queryCalled, false);
  });
});
