import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { buildCacheKey, getCacheStats, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES } from '../utils/cacheNamespaces.js';

const router = express.Router();

router.use(requireRole('admin'));

router.get('/cache-stats', (_req, res) => {
  return res.json(getCacheStats());
});

// ── Audit Logs ───────────────────────────────────────────────────────────

router.get('/audit-logs', async (req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.systemEvents, { view: 'audit-logs' });
    const logs = await getOrSetCache(cacheKey, 15, async () => {
      const { rows } = await pool.query(`
        SELECT al.*, u.username as user_name
        FROM system_audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 100
      `);
      return rows;
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Security Events ──────────────────────────────────────────────────────

router.get('/security-events', async (req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.systemEvents, { view: 'security-events' });
    const events = await getOrSetCache(cacheKey, 15, async () => {
      const { rows } = await pool.query(`
        SELECT * FROM security_events
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return rows;
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
