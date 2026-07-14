import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import pool from '../../config/db.js';
import { clearAllCache } from '../../utils/cache.js';
import { getSalesSystemPrompt, invalidateSalesSystemPromptCache } from './systemPromptCache.js';

afterEach(() => {
  mock.restoreAll();
  clearAllCache();
});

describe('sales system-prompt cache', () => {
  it('shares one database result until explicitly invalidated', async () => {
    let value = 'First configured prompt';
    const query = mock.method(pool, 'query', async () => ({ rows: [{ value }] }));

    assert.equal(await getSalesSystemPrompt('fallback'), value);
    value = 'Updated configured prompt';
    assert.equal(await getSalesSystemPrompt('fallback'), 'First configured prompt');
    assert.equal(query.mock.callCount(), 1);

    invalidateSalesSystemPromptCache();
    assert.equal(await getSalesSystemPrompt('fallback'), value);
    assert.equal(query.mock.callCount(), 2);
  });

  it('uses the caller fallback when no configured prompt exists', async () => {
    mock.method(pool, 'query', async () => ({ rows: [] }));
    assert.equal(await getSalesSystemPrompt('safe fallback'), 'safe fallback');
  });

  it('uses the fallback when PostgreSQL cannot load the configured prompt', async () => {
    const originalError = console.error;
    console.error = () => {};
    try {
      mock.method(pool, 'query', async () => { throw new Error('database unavailable'); });
      assert.equal(await getSalesSystemPrompt('safe fallback'), 'safe fallback');
    } finally {
      console.error = originalError;
    }
  });
});
