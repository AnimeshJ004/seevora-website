import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupExpiredRateLimits, ensureRateLimitSchema } from './rateLimitMigration.js';

describe('rate-limit schema migration', () => {
  it('creates the persistent bucket table and expiry index idempotently', async () => {
    const queries = [];
    const database = {
      async query(sql) {
        queries.push(sql);
        return { rowCount: 0, rows: [] };
      },
    };

    await ensureRateLimitSchema(database);

    assert.equal(queries.length, 2);
    assert.match(queries[0], /CREATE TABLE IF NOT EXISTS rate_limit_buckets/);
    assert.match(queries[0], /PRIMARY KEY \(policy, subject_hash\)/);
    assert.match(queries[1], /CREATE INDEX IF NOT EXISTS rate_limit_buckets_expiry_idx/);
  });

  it('deletes only buckets expired for longer than the retention period', async () => {
    let query;
    const database = {
      async query(sql) {
        query = sql;
        return { rowCount: 7 };
      },
    };

    assert.equal(await cleanupExpiredRateLimits(database), 7);
    assert.match(query, /expires_at < NOW\(\) - INTERVAL '1 day'/);
  });
});
