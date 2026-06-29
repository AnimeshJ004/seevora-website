import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateLogin, validateSignup } from '../utils/validation.js';

const router = express.Router();
const saltRounds = 12;

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function toSafeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    createdAt: user.created_at,
  };
}

router.post('/signup', async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateSignup(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [data.email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.', errors: { email: 'Email is already registered.' } });
    }

    const passwordHash = await bcrypt.hash(data.password, saltRounds);
    const result = await pool.query(
      `INSERT INTO users (id, username, email, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, phone, created_at`,
      [randomUUID(), data.username, data.email, data.phone, passwordHash]
    );

    const user = result.rows[0];
    return res.status(201).json({
      message: 'Account created successfully.',
      token: createToken(user),
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateLogin(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const result = await pool.query(
      'SELECT id, username, email, phone, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1)',
      [data.email]
    );

    const user = result.rows[0];
    const passwordMatches = user ? await bcrypt.compare(data.password, user.password_hash) : false;
    if (!user || !passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({
      message: 'Login successful.',
      token: createToken(user),
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user: toSafeUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
