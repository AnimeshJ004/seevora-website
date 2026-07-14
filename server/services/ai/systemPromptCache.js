import pool from '../../config/db.js';
import { buildCacheKey, getOrSetCache } from '../../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../../utils/cacheNamespaces.js';

const SALES_PROMPT_NAMESPACE = `${CACHE_NAMESPACES.systemPrompt}:sales`;
const SALES_PROMPT_CACHE_KEY = buildCacheKey(SALES_PROMPT_NAMESPACE, {
  setting: 'ai_sales_agent_prompt',
});
const SALES_PROMPT_TTL_SECONDS = 5 * 60;

export async function getSalesSystemPrompt(fallback = '') {
  const configuredPrompt = await getOrSetCache(
    SALES_PROMPT_CACHE_KEY,
    SALES_PROMPT_TTL_SECONDS,
    async () => {
      try {
        const { rows } = await pool.query(
          "SELECT value FROM system_settings WHERE key = 'ai_sales_agent_prompt' LIMIT 1"
        );
        return rows[0]?.value || null;
      } catch (error) {
        console.error('[SystemPromptCache] Failed to load the sales prompt:', error.message);
        return null;
      }
    }
  );
  return configuredPrompt || fallback;
}

export function invalidateSalesSystemPromptCache() {
  invalidateCacheNamespaces(SALES_PROMPT_NAMESPACE);
}
