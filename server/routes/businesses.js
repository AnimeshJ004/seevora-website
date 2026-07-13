import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { getCache, setCache, clearCache } from '../utils/cache.js';

const router = express.Router();

const CACHE_BUSINESSES_LIST = 'admin_businesses_list';
const BUSINESSES_TTL = 60;

function bustBusinessesCache() {
  clearCache(CACHE_BUSINESSES_LIST);
}

router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const cached = getCache(CACHE_BUSINESSES_LIST);
    if (cached) return res.json(cached);

    const { rows } = await pool.query(`
      SELECT * FROM businesses 
      ORDER BY created_at DESC
    `);
    
    setCache(CACHE_BUSINESSES_LIST, rows, BUSINESSES_TTL);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, industry, website, contact_email, contact_phone, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Business name is required' });

    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO businesses (id, name, industry, website, contact_email, contact_phone, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, name, industry, website, contact_email, contact_phone, status || 'active']);

    res.status(201).json(rows[0]);
    bustBusinessesCache();
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, industry, website, contact_email, contact_phone, status } = req.body;
    
    const { rows } = await pool.query(`
      UPDATE businesses 
      SET name = COALESCE($1, name), 
          industry = COALESCE($2, industry), 
          website = COALESCE($3, website),
          contact_email = COALESCE($4, contact_email),
          contact_phone = COALESCE($5, contact_phone),
          status = COALESCE($6, status),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, industry, website, contact_email, contact_phone, status, id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    res.json(rows[0]);
    bustBusinessesCache();
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM businesses WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Business not found' });
    res.json({ message: 'Business deleted successfully' });
    bustBusinessesCache();
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
