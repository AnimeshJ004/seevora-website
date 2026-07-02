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
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_VERIFICATION';
  `);

  /* HR and super_admin users are always considered verified */
  await pool.query(`
    UPDATE users SET verification_status = 'VERIFIED'
    WHERE role IN ('hr', 'super_admin', 'admin', 'manager', 'support')
      AND verification_status = 'PENDING_VERIFICATION';
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

  /* ── Leave Management ─────────────────────────────────────────────── */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id UUID PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      leave_type VARCHAR(40) NOT NULL DEFAULT 'casual',
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      days INTEGER NOT NULL DEFAULT 1,
      reason TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS leave_requests_employee_idx ON leave_requests (employee_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests (status);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_balances (
      id UUID PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      casual_total INTEGER NOT NULL DEFAULT 12,
      casual_used INTEGER NOT NULL DEFAULT 0,
      sick_total INTEGER NOT NULL DEFAULT 8,
      sick_used INTEGER NOT NULL DEFAULT 0,
      annual_total INTEGER NOT NULL DEFAULT 24,
      annual_used INTEGER NOT NULL DEFAULT 0,
      comp_off_total INTEGER NOT NULL DEFAULT 4,
      comp_off_used INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (employee_id, year)
    );
  `);

  /* ── Recruitment ───────────────────────────────────────────────────── */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_openings (
      id UUID PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      department VARCHAR(120) NOT NULL,
      type VARCHAR(60) NOT NULL DEFAULT 'full-time',
      experience VARCHAR(80),
      description TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'open',
      posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS job_openings_status_idx ON job_openings (status);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id UUID PRIMARY KEY,
      job_id UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
      name VARCHAR(160) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(40),
      experience VARCHAR(80),
      source VARCHAR(80) DEFAULT 'direct',
      current_stage VARCHAR(60) NOT NULL DEFAULT 'applied',
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS candidates_job_idx ON candidates (job_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS candidates_stage_idx ON candidates (current_stage);
  `);

  /* ── Payroll ───────────────────────────────────────────────────────── */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id UUID PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      month VARCHAR(10) NOT NULL,
      basic NUMERIC(12, 2) NOT NULL DEFAULT 0,
      hra NUMERIC(12, 2) NOT NULL DEFAULT 0,
      allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
      deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
      net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'draft',
      processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (employee_id, month)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS payroll_records_month_idx ON payroll_records (month DESC);
  `);

  /* ── Employee Documents ────────────────────────────────────────────── */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_documents (
      id UUID PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      doc_type VARCHAR(80) NOT NULL DEFAULT 'other',
      file_name VARCHAR(255) NOT NULL,
      file_path TEXT,
      file_url TEXT,
      file_size VARCHAR(40),
      verified BOOLEAN NOT NULL DEFAULT false,
      doc_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
      rejection_reason TEXT,
      verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
      verified_at TIMESTAMPTZ,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  /* Add new columns to existing installs */
  await pool.query(`ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS doc_status VARCHAR(40) NOT NULL DEFAULT 'PENDING';`);
  await pool.query(`ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`);
  await pool.query(`ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS file_url TEXT;`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS employee_documents_employee_idx ON employee_documents (employee_id);
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
