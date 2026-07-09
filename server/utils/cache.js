import NodeCache from 'node-cache';

// Initialize cache with a standard TTL of 60 seconds and a check period of 120 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Get a value from the cache
 * @param {string} key 
 * @returns {any} The cached value, or undefined if not found
 */
export function getCache(key) {
  return cache.get(key);
}

/**
 * Set a value in the cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl (Optional) Time to live in seconds
 */
export function setCache(key, value, ttl) {
  if (ttl) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

/**
 * Clear a specific key from the cache
 * @param {string} key 
 */
export function clearCache(key) {
  cache.del(key);
}

/**
 * Clear all cache entries
 */
export function clearAllCache() {
  cache.flushAll();
}

/**
 * Clear cache entries that start with a specific prefix
 * @param {string} prefix 
 */
export function clearCachePrefix(prefix) {
  const keys = cache.keys();
  const keysToDelete = keys.filter(k => k.startsWith(prefix));
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
  }
}

export default cache;
