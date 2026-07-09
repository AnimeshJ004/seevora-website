import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getCache, setCache, clearCache } from '../utils/cache.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['super_admin', 'admin']));

router.get('/', async (req, res) => {
  try {
    const cachedUsers = getCache('users_list');
    if (cachedUsers) return res.json(cachedUsers);

    const { rows } = await pool.query(`
      SELECT id, username, email, phone, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    setCache('users_list', rows, 120); // Cache for 2 minutes
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, email, phone, role, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email and password are required' });

    // Ensure only super_admin can create super_admin
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super_admin can create another super_admin' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    
    const { rows } = await pool.query(`
      INSERT INTO users (id, username, email, phone, role, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, phone, role, created_at
    `, [id, username, email, phone, role || 'employee', password_hash]);

    clearCache('users_list');
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Email or username already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, role, password } = req.body;

    // Prevent non-super_admin from updating super_admin roles
    if (req.user.role !== 'super_admin') {
      const { rows: checkUser } = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
      if (checkUser.length > 0 && checkUser[0].role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot modify super_admin user' });
      }
      if (role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot set role to super_admin' });
      }
    }

    let query = `
      UPDATE users 
      SET username = COALESCE($1, username), 
          email = COALESCE($2, email), 
          phone = COALESCE($3, phone),
          role = COALESCE($4, role),
          updated_at = NOW()
    `;
    let values = [username, email, phone, role];
    let paramIndex = 5;

    if (password) {
      const password_hash = await bcrypt.hash(password, 12);
      query += `, password_hash = $${paramIndex}`;
      values.push(password_hash);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, username, email, phone, role, updated_at`;
    values.push(id);

    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    clearCache('users_list');
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Email or username already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    // Prevent non-super_admin from deleting super_admin
    if (req.user.role !== 'super_admin') {
      const { rows: checkUser } = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
      if (checkUser.length > 0 && checkUser[0].role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot delete super_admin user' });
      }
    }

    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    
    clearCache('users_list');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
