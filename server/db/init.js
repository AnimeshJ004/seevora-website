import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/db.js';

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username VARCHAR(80) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(30),
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS users_email_idx ON users (LOWER(email));
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users (LOWER(username));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_idx ON password_reset_tokens (expires_at);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_requests (
      id UUID PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      email VARCHAR(255) NOT NULL,
      company VARCHAR(180),
      phone VARCHAR(40),
      message TEXT NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'new',
      response_body TEXT,
      email_status VARCHAR(40),
      email_error TEXT,
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS audit_requests_created_idx ON audit_requests (created_at DESC);
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(40) NOT NULL DEFAULT 'employee';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_employees (
      id UUID PRIMARY KEY,
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      employee_code VARCHAR(40) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(40),
      department VARCHAR(120) NOT NULL,
      job_title VARCHAR(140) NOT NULL,
      salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
      joined_on DATE NOT NULL DEFAULT CURRENT_DATE,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      account_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS hr_employees_created_idx ON hr_employees (created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS hr_employees_department_idx ON hr_employees (LOWER(department));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      work_date DATE NOT NULL,
      check_in_at TIMESTAMPTZ,
      check_out_at TIMESTAMPTZ,
      office_start_time TIME NOT NULL DEFAULT '10:00:00',
      office_end_time TIME NOT NULL DEFAULT '18:30:00',
      status VARCHAR(40) NOT NULL DEFAULT 'present',
      worked_minutes INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, work_date)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS attendance_records_work_date_idx ON attendance_records (work_date DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS attendance_records_user_idx ON attendance_records (user_id, work_date DESC);
  `);

  const adminHash = await bcrypt.hash('admin123', 12);
  const hrHash = await bcrypt.hash('hr123', 12);

  await pool.query(
    `INSERT INTO users (id, username, email, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [crypto.randomUUID(), 'admin', 'admin@seevora.in', '+91 90000 00001', adminHash]
  );

  await pool.query(
    `UPDATE users SET role = 'super_admin' WHERE LOWER(email) = LOWER($1)`,
    ['admin@seevora.in']
  );

  await pool.query(
    `INSERT INTO users (id, username, email, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [crypto.randomUUID(), 'hr', 'hr@seevora.in', '+91 90000 00002', hrHash]
  );

  await pool.query(
    `UPDATE users SET role = 'hr' WHERE LOWER(email) = LOWER($1)`,
    ['hr@seevora.in']
  );
}
