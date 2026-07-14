import 'dotenv/config';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import express from 'express';
import authRoutes from './auth.js';
import { randomUUID } from 'node:crypto';
import { sendMail } from '../utils/mailer.js';

// We need supertest but since we just want to test the db interactions directly or mock req/res,
// wait, the project uses some HTTP framework or we can just unit test the routes by sending mock objects.
// Actually, I can use `node:test` to test the logic directly against the DB by mocking req and res.
// A better way is just to test the database changes since `auth.js` does the logic.
// Or we can just spin up a simple express app and use fetch if it's easier, or mock.
// I'll test it via the app instance directly if possible, or just test the DB logic.

const createMockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  res.set = () => res;
  res.cookie = () => res;
  res.clearCookie = () => res;
  return res;
};

describe('Password Reset Flow', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user
    const username = `testuser_${randomUUID().substring(0, 8)}`;
    const email = `${username}@example.com`;
    const passwordHash = await bcrypt.hash('oldPassword123!', 10);
    
    const result = await pool.query(
      `INSERT INTO users (id, username, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING *`,
      [randomUUID(), username, email, passwordHash]
    );
    testUser = result.rows[0];
  });

  afterEach(async () => {
    if (testUser) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
  });

  it('generates a reset token and stores it in the database', async () => {
    const req = {
      body: { email: testUser.email },
      socket: { remoteAddress: '127.0.0.1' },
      get: () => 'test-agent'
    };
    const res = createMockRes();
    const next = (err) => { throw err; };

    // Find the forgot-password route
    const forgotRoute = authRoutes.stack.find(
      layer => layer.route && layer.route.path === '/forgot-password'
    );

    // Call the handler directly
    await forgotRoute.route.stack[0].handle(req, res, next);

    assert.equal(res.body.message, 'If an account exists, a password reset link has been sent.');

    // Check DB for token
    const tokenResult = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL',
      [testUser.id]
    );

    assert.equal(tokenResult.rows.length, 1);
    const tokenRecord = tokenResult.rows[0];
    assert.ok(tokenRecord.token_hash);
    assert.ok(tokenRecord.expires_at > new Date());
  });

  it('resets the password given a valid token', async () => {
    // 1. Manually insert a token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    const tokenInsert = await pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [randomUUID(), testUser.id, tokenHash, expiresAt]
    );

    const req = {
      body: { token: rawToken, newPassword: 'newStrongPassword123!' },
    };
    const res = createMockRes();
    const next = (err) => { throw err; };

    // Find the reset-password route
    const resetRoute = authRoutes.stack.find(
      layer => layer.route && layer.route.path === '/reset-password'
    );

    // Call the handler
    await resetRoute.route.stack[0].handle(req, res, next);

    assert.equal(res.body.message, 'Password successfully reset.');

    // 2. Verify token is marked as used
    const tokenResult = await pool.query(
      'SELECT used_at FROM password_reset_tokens WHERE id = $1',
      [tokenInsert.rows[0].id]
    );
    assert.notEqual(tokenResult.rows[0].used_at, null);

    // 3. Verify password was updated
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [testUser.id]
    );
    
    const isMatch = await bcrypt.compare('newStrongPassword123!', userResult.rows[0].password_hash);
    assert.equal(isMatch, true);
  });
});
