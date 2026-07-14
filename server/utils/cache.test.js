import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  CACHE_MAX_ENTRY_BYTES,
  CACHE_MAX_KEYS,
  buildCacheKey,
  clearAllCache,
  clearCacheNamespace,
  getCache,
  getCacheStats,
  getOrSetCache,
  setCache,
} from './cache.js';

afterEach(() => {
  clearAllCache();
});

describe('cache utility', () => {
  it('builds deterministic keys without exposing descriptor values', () => {
    const first = buildCacheKey('Leads List', { page: 1, filters: { stage: 'new', email: 'private@example.com' } });
    const reordered = buildCacheKey('Leads List', { filters: { email: 'private@example.com', stage: 'new' }, page: 1 });
    const anotherUser = buildCacheKey('Leads List', { page: 1, userId: 'another-user' });

    assert.equal(first, reordered);
    assert.notEqual(first, anotherUser);
    assert.match(first, /^leads_list:[a-f0-9]{64}$/);
    assert.doesNotMatch(first, /private@example\.com/);
  });

  it('deduplicates concurrent loads and records cache hits', async () => {
    const key = buildCacheKey('test', { id: 1 });
    let loads = 0;
    let resolveLoader;
    const loader = () => {
      loads += 1;
      return new Promise((resolve) => { resolveLoader = resolve; });
    };

    const first = getOrSetCache(key, 60, loader);
    const second = getOrSetCache(key, 60, loader);
    await new Promise((resolve) => setImmediate(resolve));
    resolveLoader({ value: 42 });

    assert.deepEqual(await first, { value: 42 });
    assert.deepEqual(await second, { value: 42 });
    assert.equal(loads, 1);
    assert.deepEqual(await getOrSetCache(key, 60, loader), { value: 42 });
    assert.equal(loads, 1);
    assert.ok(getCacheStats().hits >= 1);
  });

  it('does not cache a rejected loader', async () => {
    const key = buildCacheKey('test', { id: 2 });
    let loads = 0;
    const loader = async () => {
      loads += 1;
      if (loads === 1) throw new Error('database unavailable');
      return 'recovered';
    };

    await assert.rejects(getOrSetCache(key, 60, loader), /database unavailable/);
    assert.equal(await getOrSetCache(key, 60, loader), 'recovered');
    assert.equal(loads, 2);
  });

  it('expires entries and reloads them', async () => {
    const key = buildCacheKey('test', { id: 3 });
    let loads = 0;
    const loader = async () => ++loads;

    assert.equal(await getOrSetCache(key, 0.02, loader), 1);
    await new Promise((resolve) => setTimeout(resolve, 35));
    assert.equal(await getOrSetCache(key, 0.02, loader), 2);
  });

  it('clears every entry in a namespace without touching another namespace', () => {
    const first = buildCacheKey('documents', { page: 1 });
    const second = buildCacheKey('documents', { page: 2 });
    const other = buildCacheKey('users', {});
    setCache(first, 1);
    setCache(second, 2);
    setCache(other, 3);

    assert.equal(clearCacheNamespace('documents'), 2);
    assert.equal(getCache(first), undefined);
    assert.equal(getCache(second), undefined);
    assert.equal(getCache(other), 3);
  });

  it('skips oversized values instead of retaining them', () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      const key = buildCacheKey('large', {});
      assert.equal(setCache(key, 'x'.repeat(CACHE_MAX_ENTRY_BYTES + 1)), false);
      assert.equal(getCache(key), undefined);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('does not fail the request when the bounded cache is full', () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      for (let index = 0; index < CACHE_MAX_KEYS; index += 1) {
        assert.equal(setCache(`capacity:${index}`, index), true);
      }
      assert.equal(setCache('capacity:overflow', true), false);
      assert.equal(getCacheStats().keys, CACHE_MAX_KEYS);
    } finally {
      console.warn = originalWarn;
    }
  });
});
