import crypto from 'crypto';
import NodeCache from 'node-cache';

export const DEFAULT_CACHE_TTL_SECONDS = 60;
export const CACHE_MAX_KEYS = 2_000;
export const CACHE_MAX_ENTRY_BYTES = 1024 * 1024;

const cache = new NodeCache({
  stdTTL: DEFAULT_CACHE_TTL_SECONDS,
  checkperiod: 120,
  maxKeys: CACHE_MAX_KEYS,
});
const inFlightLoads = new Map();
const warningTimes = new Map();
const WARNING_INTERVAL_MS = 60_000;

function warnThrottled(code, message) {
  const now = Date.now();
  if (now - (warningTimes.get(code) || 0) < WARNING_INTERVAL_MS) return;
  warningTimes.set(code, now);
  console.warn(`[Cache] ${message}`);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        if (value[key] !== undefined) result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  return value;
}

function estimateValueBytes(value) {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? 0 : Buffer.byteLength(serialized, 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function normalizeNamespace(namespace) {
  const normalized = String(namespace || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '_')
    .replace(/^:+|:+$/g, '');
  if (!normalized) throw new TypeError('A cache namespace is required.');
  return normalized;
}

export function buildCacheKey(namespace, descriptor = {}) {
  const prefix = normalizeNamespace(namespace);
  const canonical = JSON.stringify(canonicalize(descriptor));
  const digest = crypto.createHash('sha256').update(canonical).digest('hex');
  return `${prefix}:${digest}`;
}

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value, ttl) {
  if (value === undefined) return false;

  const valueBytes = estimateValueBytes(value);
  if (valueBytes > CACHE_MAX_ENTRY_BYTES) {
    warnThrottled('entry-too-large', `Skipped an entry larger than ${CACHE_MAX_ENTRY_BYTES} bytes.`);
    return false;
  }

  try {
    return ttl === undefined ? cache.set(key, value) : cache.set(key, value, ttl);
  } catch (error) {
    warnThrottled('set-failed', `Skipped an entry because the cache is unavailable or full: ${error.message}`);
    return false;
  }
}

export async function getOrSetCache(key, ttl, loader) {
  const cached = getCache(key);
  if (cached !== undefined) return cached;

  if (inFlightLoads.has(key)) return inFlightLoads.get(key);

  const loadPromise = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (value !== undefined) setCache(key, value, ttl);
      return value;
    })
    .finally(() => {
      inFlightLoads.delete(key);
    });

  inFlightLoads.set(key, loadPromise);
  return loadPromise;
}

export function clearCache(key) {
  return cache.del(key);
}

export function clearCachePrefix(prefix) {
  const keysToDelete = cache.keys().filter((key) => key.startsWith(prefix));
  return keysToDelete.length > 0 ? cache.del(keysToDelete) : 0;
}

export function clearCacheNamespace(namespace) {
  const prefix = normalizeNamespace(namespace);
  const keys = cache.keys().filter((key) => key === prefix || key.startsWith(`${prefix}:`));
  return keys.length > 0 ? cache.del(keys) : 0;
}

export function getCacheStats() {
  const stats = cache.getStats();
  return {
    hits: stats.hits,
    misses: stats.misses,
    keys: stats.keys,
    keyBytes: stats.ksize,
    valueBytes: stats.vsize,
    inFlightLoads: inFlightLoads.size,
    maxKeys: CACHE_MAX_KEYS,
    maxEntryBytes: CACHE_MAX_ENTRY_BYTES,
  };
}

export function clearAllCache() {
  cache.flushAll();
  cache.flushStats();
  inFlightLoads.clear();
  warningTimes.clear();
}

export default cache;
