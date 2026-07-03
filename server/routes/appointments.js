import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM appointments
      ORDER BY scheduled_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      client_name,
      client_email,
      client_phone,
      scheduled_at,
      date,
      duration,
      status,
      notes,
    } = req.body;
    const appointmentTime = scheduled_at || date;
    if (!client_name || !appointmentTime) {
      return res.status(400).json({ error: 'Client name and date are required' });
    }

    const id = crypto.randomUUID();
    const createdBy = req.user?.id === '00000000-0000-0000-0000-000000000000'
      ? null
      : req.user?.id || null;
    const { rows } = await pool.query(`
      INSERT INTO appointments (id, title, client_name, client_email, client_phone, scheduled_at, duration, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id,
      title || `Appointment with ${client_name}`,
      client_name,
      client_email || '',
      client_phone || '',
      appointmentTime,
      Number(duration) || 30,
      status || 'scheduled',
      notes || '',
      createdBy,
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, client_name, client_email, client_phone, scheduled_at, date, duration, status, notes } = req.body;
    const appointmentTime = scheduled_at || date;
    
    const { rows } = await pool.query(`
      UPDATE appointments 
      SET title = COALESCE($1, title),
          client_name = COALESCE($2, client_name), 
          client_email = COALESCE($3, client_email), 
          client_phone = COALESCE($4, client_phone),
          scheduled_at = COALESCE($5, scheduled_at),
          duration = COALESCE($6, duration),
          status = COALESCE($7, status),
          notes = COALESCE($8, notes),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, client_name, client_email, client_phone, appointmentTime, duration, status, notes, id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
