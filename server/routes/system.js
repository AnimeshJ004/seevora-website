import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['super_admin', 'admin']));

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

// ── System Settings ──────────────────────────────────────────────────────

router.get('/settings', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM system_settings`);
    // Convert array of key/value to an object
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // We will do upsert for each setting key
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO system_settings (key, value) 
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = NOW()
      `, [key, String(value)]);
    }
    
    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
