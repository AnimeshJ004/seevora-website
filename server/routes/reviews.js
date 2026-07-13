import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

export const reviewAdminGuard = requireRole('admin');

router.use(reviewAdminGuard);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM reviews 
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { reviewer_name, rating, comment, source, status } = req.body;
    if (!reviewer_name || !rating) return res.status(400).json({ error: 'Reviewer name and rating are required' });

    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO reviews (id, reviewer_name, rating, comment, source, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, reviewer_name, rating, comment || '', source || 'google', status || 'pending']);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_name, rating, comment, source, status, response } = req.body;
    
    const { rows } = await pool.query(`
      UPDATE reviews 
      SET reviewer_name = COALESCE($1, reviewer_name), 
          rating = COALESCE($2, rating), 
          comment = COALESCE($3, comment),
          source = COALESCE($4, source),
          status = COALESCE($5, status),
          response = COALESCE($6, response),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [reviewer_name, rating, comment, source, status, response, id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
