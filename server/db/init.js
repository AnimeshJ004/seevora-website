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
    ALTER TABLE audit_requests
    ADD COLUMN IF NOT EXISTS thread JSONB NOT NULL DEFAULT '[]'::jsonb;
  `).catch(e => console.log(e.message));

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(40) NOT NULL DEFAULT 'employee';
  `).catch(e => console.log("Index error:", e.message));

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

  /* ── Newsletter ────────────────────────────────────────────────────── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id UUID PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      unsubscribed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers (LOWER(email));
  `);

  /* ── CRM Leads ──────────────────────────────────────────────────────── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      company VARCHAR(200),
      industry VARCHAR(120),
      designation VARCHAR(140),
      source VARCHAR(80) NOT NULL DEFAULT 'manual',
      pipeline_stage VARCHAR(60) NOT NULL DEFAULT 'new',
      score INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      next_follow_up_at TIMESTAMPTZ,
      audit_request_id UUID,
      last_contacted_at TIMESTAMPTZ,
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS industry VARCHAR(120),
    ADD COLUMN IF NOT EXISTS designation VARCHAR(140),
    ADD COLUMN IF NOT EXISTS source VARCHAR(80) NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(60) NOT NULL DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS audit_request_id UUID,
    ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
  `).catch(err => console.error('leads alter table error:', err));

  await pool.query(`
    CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads (pipeline_stage);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);
  `);

  /* ── Email Templates ────────────────────────────────────────────────── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id UUID PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(80) NOT NULL DEFAULT 'outbound',
      subject VARCHAR(400) NOT NULL,
      body TEXT NOT NULL,
      variables JSONB NOT NULL DEFAULT '[]',
      tone VARCHAR(60) NOT NULL DEFAULT 'professional',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  /* ── Email Campaigns ────────────────────────────────────────────────── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id UUID PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'draft',
      campaign_type VARCHAR(60) NOT NULL DEFAULT 'newsletter',
      tone VARCHAR(60) NOT NULL DEFAULT 'professional',
      language VARCHAR(40) NOT NULL DEFAULT 'english',
      sender_persona VARCHAR(200),
      scheduled_at TIMESTAMPTZ,
      launched_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      total_leads INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON email_campaigns (status);
  `);
  await pool.query(`
    ALTER TABLE email_campaigns
    ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(60) NOT NULL DEFAULT 'newsletter';
  `).catch(() => {});

  /* ── Campaign Leads (many-to-many) ─────────────────────────────────── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_campaign_leads (
      id UUID PRIMARY KEY,
      campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      UNIQUE (campaign_id, lead_id)
    );
  `);

  /* ── Email Logs ─────────────────────────────────────────────────────── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id UUID PRIMARY KEY,
      campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
      to_email VARCHAR(255) NOT NULL,
      to_name VARCHAR(200),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      ai_prompt TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'sent',
      error_message TEXT,
      opened_at TIMESTAMPTZ,
      clicked_at TIMESTAMPTZ,
      replied_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;`).catch(() => {});
  await pool.query(`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS name VARCHAR(200);`).catch(() => {});

  /* ── Inbound Emails ─────────────────────────────────────────────────── */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inbound_emails (
      id UUID PRIMARY KEY,
      from_email VARCHAR(255) NOT NULL,
      to_email VARCHAR(255) NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      ai_reply TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'received',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS email_logs_campaign_idx ON email_logs (campaign_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS email_logs_lead_idx ON email_logs (lead_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS email_logs_sent_idx ON email_logs (sent_at DESC);
  `);

  /* ── Seed default email templates ───────────────────────────────────── */
  const templates = [
    {
      name: 'Cold Outreach — Value Proposition',
      category: 'outbound',
      subject: 'Transforming {{industry}} businesses with AI automation — {{company}}',
      body: `Hi {{name}},

I came across {{company}} and was impressed by what you're building in the {{industry}} space.

At Seevora, we help businesses like yours automate the repetitive workflows that slow teams down — from missed call handling and appointment scheduling to WhatsApp follow-ups and CRM syncing — all powered by AI.

Our clients typically see a 40% reduction in manual follow-up time within the first 30 days.

Would it make sense to jump on a 15-minute discovery call this week to see if there's a fit?

Warm regards,
{{sender_name}}
Seevora — AI Automation for Growing Businesses`,
      tone: 'professional',
    },
    {
      name: 'Follow-Up #1 — Gentle Nudge',
      category: 'follow-up',
      subject: 'Quick follow-up — Seevora × {{company}}',
      body: `Hi {{name}},

Just wanted to follow up on my earlier note. I know inboxes get busy!

I genuinely believe the kind of AI automation Seevora offers could make a real difference for {{company}}, especially in {{industry}}.

Happy to share a quick 2-minute case study relevant to your space — no call needed.

Would that be helpful?

Best,
{{sender_name}}`,
      tone: 'friendly',
    },
    {
      name: 'Follow-Up #2 — Urgency + Social Proof',
      category: 'follow-up',
      subject: 'Last note — how [Client in {{industry}}] saved 20 hrs/week',
      body: `Hi {{name}},

This will be my last follow-up — I don't want to clutter your inbox.

A quick data point: a {{industry}} business we onboarded last quarter automated their entire inbound call and WhatsApp flow with Seevora. They reclaimed 20+ hours per week for their team and increased lead conversion by 28%.

If this resonates, I'd love to show you exactly how in a 20-minute demo.

If the timing isn't right, no worries — feel free to reach out whenever it is.

Best,
{{sender_name}}
Seevora`,
      tone: 'professional',
    },
    {
      name: 'Proposal Sent — CTA to Book Call',
      category: 'proposal',
      subject: 'Your custom Seevora proposal — next steps for {{company}}',
      body: `Hi {{name}},

As discussed, I've put together a tailored proposal for {{company}} based on your specific needs in {{industry}}.

Key highlights:
• AI Voice Receptionist for 24/7 call handling
• WhatsApp automation for follow-ups & confirmations
• Custom dashboard integration with your existing tools

The next step is a quick 30-minute call to walk through it together and answer any questions.

👉 [Book a Call with Seevora](https://seevora.in/book-a-call)

Looking forward to it!

{{sender_name}}
Seevora`,
      tone: 'professional',
    },
    {
      name: 'Re-engagement — Cold/Dead Lead',
      category: 'reengagement',
      subject: 'Still thinking about AI for {{company}}?',
      body: `Hi {{name}},

It's been a while — hope things are going well at {{company}}!

A lot has changed on our end since we last connected. We've launched new modules for {{industry}} businesses that are getting some great results.

If AI automation has been on your radar recently, this might be the right time to reconnect.

Would a 15-minute catch-up make sense?

Cheers,
{{sender_name}}
Seevora`,
      tone: 'friendly',
    },
    {
      name: 'Welcome — New Qualified Lead',
      category: 'welcome',
      subject: 'Welcome to Seevora, {{name}}! Here\'s what\'s next',
      body: `Hi {{name}},

Welcome! We're excited to have {{company}} in the Seevora family.

Based on our conversation, here's a quick summary of what we're building together:
• Automated workflows tailored for {{industry}}
• Onboarding within 5 business days after workflow audit

Your dedicated account manager will be in touch within 24 hours to kick off the discovery session.

In the meantime, feel free to reply with any questions.

Warmly,
{{sender_name}}
Seevora — AI-Powered Growth`,
      tone: 'friendly',
    },
  ];

  for (const tmpl of templates) {
    await pool.query(
      `INSERT INTO email_templates (id, name, category, subject, body, variables, tone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        crypto.randomUUID(),
        tmpl.name,
        tmpl.category,
        tmpl.subject,
        tmpl.body,
        JSON.stringify(['name', 'company', 'industry', 'sender_name']),
        tmpl.tone,
      ]
    );
  }

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      client_name VARCHAR(160) NOT NULL,
      client_email VARCHAR(255) NOT NULL,
      client_phone VARCHAR(40),
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration INTEGER NOT NULL DEFAULT 30,
      status VARCHAR(40) NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  const defaultProjects = [
    ['11111111-1111-4111-8111-111111111111', 'Client Delivery', 'Client implementation and delivery tasks'],
    ['22222222-2222-4222-8222-222222222222', 'Sales Pipeline', 'Lead follow-up and revenue operations'],
    ['33333333-3333-4333-8333-333333333333', 'Marketing', 'Campaigns, content, and growth tasks'],
    ['44444444-4444-4444-8444-444444444444', 'Product Development', 'Feature development and product improvements'],
    ['55555555-5555-4555-8555-555555555555', 'Internal Operations', 'Admin, finance, HR, and process tasks'],
  ];

  for (const project of defaultProjects) {
    await pool.query(
      `INSERT INTO projects (id, name, description, status, created_by)
       VALUES ($1, $2, $3, 'active', NULL)
       ON CONFLICT (id) DO NOTHING`,
      project
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      status VARCHAR(40) NOT NULL DEFAULT 'todo',
      priority VARCHAR(40) NOT NULL DEFAULT 'medium',
      category VARCHAR(80) NOT NULL DEFAULT 'general',
      assigned_to UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
      due_date DATE,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'general';
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY,
      reviewer_name VARCHAR(160) NOT NULL,
      reviewer_email VARCHAR(255),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS time_logs (
      id UUID PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      hours NUMERIC(5,2) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_events (
      id UUID PRIMARY KEY,
      event_type VARCHAR(100) NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      industry VARCHAR(100),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(40),
      address TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id UUID PRIMARY KEY,
      level VARCHAR(20) NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_verifications (
      id UUID PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
      document_type VARCHAR(100) NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      notes TEXT,
      verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45),
      details TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch(e => console.log(e.message));
}
