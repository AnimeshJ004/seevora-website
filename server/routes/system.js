import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireRole('admin'));

// ── Audit Logs ───────────────────────────────────────────────────────────

router.get('/audit-logs', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT al.*, u.username as user_name 
      FROM system_audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Security Events ──────────────────────────────────────────────────────

router.get('/security-events', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM security_events 
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
