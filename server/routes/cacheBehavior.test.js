import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import pool from '../config/db.js';
import productivityRouter from './productivity.js';
import recruitmentRouter from './recruitment.js';
import systemRouter from './system.js';
import {
  buildCacheKey,
  clearAllCache,
  getCache,
  setCache,
} from '../utils/cache.js';
import { CACHE_NAMESPACES } from '../utils/cacheNamespaces.js';

const originalQuery = pool.query;

function routeHandler(router, method, path) {
  const route = router.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods[method]
  )?.route;
  assert.ok(route, `${method.toUpperCase()} ${path} route is missing`);
  return route.stack.at(-1).handle;
}

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

afterEach(() => {
  pool.query = originalQuery;
  clearAllCache();
});

describe('route cache behavior', () => {
  it('deduplicates repeated recruitment job reads', async () => {
    let queries = 0;
    pool.query = async () => {
      queries += 1;
      return { rows: [{ id: 'job-1', title: 'Engineer', applicant_count: 2 }] };
    };
    const handler = routeHandler(recruitmentRouter, 'get', '/jobs');

    const first = response();
    const second = response();
    await handler({}, first, assert.fail);
    await handler({}, second, assert.fail);

    assert.deepEqual(second.body, first.body);
    assert.equal(queries, 1);
  });

  it('invalidates recruitment entries only after a successful write', async () => {
    const handler = routeHandler(recruitmentRouter, 'post', '/jobs');
    const key = buildCacheKey(CACHE_NAMESPACES.recruitment, { view: 'jobs' });
    setCache(key, { jobs: ['cached'] });
    pool.query = async () => ({
      rows: [{ id: 'job-2', title: 'Designer', department: 'Product' }],
      rowCount: 1,
    });

    await handler(
      { body: { title: 'Designer', department: 'Product' } },
      response(),
      assert.fail
    );
    assert.equal(getCache(key), undefined);

    setCache(key, { jobs: ['still-valid'] });
    pool.query = async () => { throw new Error('database failed'); };
    let forwardedError;
    await handler(
      { body: { title: 'Designer', department: 'Product' } },
      response(),
      (error) => { forwardedError = error; }
    );
    assert.match(forwardedError.message, /database failed/);
    assert.deepEqual(getCache(key), { jobs: ['still-valid'] });
  });

  it('isolates productivity task caches by authenticated identity', async () => {
    let queries = 0;
    pool.query = async (sql, params) => {
      queries += 1;
      if (String(sql).includes('SELECT id FROM hr_employees')) {
        return { rows: [{ id: `employee-${params[0]}` }], rowCount: 1 };
      }
      return { rows: [{ id: `task-for-${params[0]}` }], rowCount: 1 };
    };
    const handler = routeHandler(productivityRouter, 'get', '/tasks');
    const firstReq = { user: { id: 'user-1', role: 'employee' } };
    const secondReq = { user: { id: 'user-2', role: 'employee' } };

    const first = response();
    const repeated = response();
    const second = response();
    await handler(firstReq, first);
    await handler(firstReq, repeated);
    await handler(secondReq, second);

    assert.deepEqual(repeated.body, first.body);
    assert.notDeepEqual(second.body, first.body);
    assert.equal(queries, 4);
  });

  it('reports cache metrics without exposing cached keys or values', () => {
    const secretKey = buildCacheKey('private-data', { email: 'private@example.com' });
    setCache(secretKey, { token: 'do-not-expose' });
    const handler = routeHandler(systemRouter, 'get', '/cache-stats');
    const res = response();

    handler({}, res);

    assert.equal(res.body.keys, 1);
    assert.equal(typeof res.body.hits, 'number');
    assert.equal(JSON.stringify(res.body).includes(secretKey), false);
    assert.equal(JSON.stringify(res.body).includes('do-not-expose'), false);
  });
});
