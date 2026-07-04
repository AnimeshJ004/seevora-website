import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { sendMail } from '../utils/mailer.js';

const router = express.Router();

// Temporarily bypass auth for testing from frontend demo login
const mockAuth = (req, res, next) => {
  req.user = { id: null, role: 'admin', email: 'demo@seevora.com' };
  next();
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
function normalizeLead(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    industry: row.industry,
    designation: row.designation,
    source: row.source,
    pipelineStage: row.pipeline_stage,
    score: row.score,
    notes: row.notes,
    nextFollowUpAt: row.next_follow_up_at,
    auditRequestId: row.audit_request_id,
    lastContactedAt: row.last_contacted_at,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ── GET /api/leads — list all leads ────────────────────────────────── */
router.get('/', mockAuth, async (req, res, next) => {
  try {
    const { stage, source, search } = req.query;
    const conditions = [];
    const values = [];

    if (stage) {
      values.push(stage);
      conditions.push(`pipeline_stage = $${values.length}`);
    }
    if (source) {
      values.push(source);
      conditions.push(`source = $${values.length}`);
    }
    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length} OR LOWER(company) LIKE $${values.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM leads ${where} ORDER BY created_at DESC`,
      values
    );
    res.json({ leads: result.rows.map(normalizeLead) });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/leads/:id ──────────────────────────────────────────────── */
router.get('/:id', mockAuth, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Lead not found.' });
    res.json({ lead: normalizeLead(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/leads — create lead ──────────────────────────────────── */
router.post('/', mockAuth, async (req, res, next) => {
  try {
    const {
      name, email, phone, company, industry, designation,
      source = 'manual', pipelineStage = 'new', score = 0, notes, nextFollowUpAt, auditRequestId,
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Lead name is required.' });

    const result = await pool.query(
      `INSERT INTO leads
         (id, name, email, phone, company, industry, designation, source, pipeline_stage, score, notes, next_follow_up_at, audit_request_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        crypto.randomUUID(), name, email || null, phone || null,
        company || null, industry || null, designation || null,
        source, pipelineStage, score, notes || null, nextFollowUpAt || null, auditRequestId || null, req.user.id,
      ]
    );
    res.status(201).json({ message: 'Lead created.', lead: normalizeLead(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

/* ── PATCH /api/leads/:id — update lead / move stage ────────────────── */
router.patch('/:id', mockAuth, async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Lead not found.' });

    const row = existing.rows[0];
    const {
      name = row.name,
      email = row.email,
      phone = row.phone,
      company = row.company,
      industry = row.industry,
      designation = row.designation,
      source = row.source,
      pipelineStage = row.pipeline_stage,
      score = row.score,
      notes = row.notes,
      nextFollowUpAt = row.next_follow_up_at,
    } = req.body;

    const updated = await pool.query(
      `UPDATE leads SET
         name=$2, email=$3, phone=$4, company=$5, industry=$6, designation=$7,
         source=$8, pipeline_stage=$9, score=$10, notes=$11, next_follow_up_at=$12, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id, name, email, phone, company, industry, designation, source, pipelineStage, score, notes, nextFollowUpAt || null]
    );
    res.json({ message: 'Lead updated.', lead: normalizeLead(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});

/* ── DELETE /api/leads/:id ───────────────────────────────────────────── */
router.delete('/:id', mockAuth, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Lead not found.' });
    res.json({ message: 'Lead deleted.' });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/leads/bulk — bulk import leads ───────────────────────── */
router.post('/bulk', mockAuth, async (req, res, next) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || !leads.length) {
      return res.status(400).json({ message: 'Leads array is required.' });
    }

    const inserted = [];
    for (const l of leads) {
      if (!l.name) continue;
      const r = await pool.query(
        `INSERT INTO leads (id, name, email, phone, company, industry, source, pipeline_stage, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'new',$8) RETURNING *`,
        [
          crypto.randomUUID(), l.name, l.email || null, l.phone || null,
          l.company || null, l.industry || null, l.source || 'import', req.user.id,
        ]
      );
      inserted.push(normalizeLead(r.rows[0]));
    }

    res.status(201).json({ message: `${inserted.length} leads imported.`, leads: inserted });
  } catch (err) {
    next(err);
  }
});


/* ── Helper: build branded HTML email for a lead ──────────────────── */
function buildLeadEmail(lead) {
  const firstName = lead.name ? lead.name.split(' ')[0] : 'there';
  const companyLine = lead.company ? ` at <strong>${lead.company}</strong>` : '';

  const subject = `Hey ${firstName}, let's connect — Seevora 👋`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Seevora</title>
<style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
  .header{background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);padding:30px 36px;text-align:center;}
  .logo{font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;}
  .logo span{color:#14c9e1;}
  .tagline{font-size:12px;color:#94a3b8;margin-top:5px;letter-spacing:0.04em;}
  .body{padding:36px 36px 28px;}
  .body h2{font-size:21px;font-weight:700;color:#0f172a;margin:0 0 14px;}
  .body p{font-size:15px;color:#475569;line-height:1.75;margin:0 0 14px;}
  .highlight{background:linear-gradient(135deg,rgba(99,102,241,0.07),rgba(139,92,246,0.07));border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;margin:18px 0;}
  .highlight p{margin:0;font-size:14px;color:#334155;}
  .cta{display:inline-block;margin:22px 0 8px;padding:14px 30px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff!important;text-decoration:none;border-radius:100px;font-size:14px;font-weight:700;letter-spacing:0.02em;}
  .footer{background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #e2e8f0;}
  .footer p{font-size:12px;color:#94a3b8;margin:0;line-height:1.9;}
  .footer a{color:#6366f1;text-decoration:none;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Seevora<span>.</span></div>
    <div class="tagline">AI-Powered B2B Automation</div>
  </div>
  <div class="body">
    <h2>Hi ${lead.name || 'there'} 👋</h2>
    <p>I noticed your profile${companyLine} and wanted to reach out personally. At <strong>Seevora</strong>, we help businesses like yours automate operations and grow faster using AI.</p>
    <div class="highlight">
      <p>🚀 <strong>What we can do for you:</strong><br/>
      Automate customer communication, manage leads intelligently, generate AI-driven insights — all in one platform built for modern B2B teams.</p>
    </div>
    <p>I'd love to show you exactly how this could work for ${lead.company || 'your business'}. Would you be open to a quick 20-minute discovery call?</p>
    <a href="https://seevora.in/book-a-call" class="cta">Book a Free Discovery Call →</a>
    <p style="font-size:13px;color:#94a3b8;margin-top:8px;">No sales pressure — just a genuine conversation about your needs.</p>
  </div>
  <div class="footer">
    <p><strong>Seevora Private Limited</strong><br/>Indore, Madhya Pradesh, India<br/>
    <a href="tel:+918269297967">+91 82692 97967</a> &nbsp;|&nbsp;
    <a href="mailto:info@seevora.in">info@seevora.in</a> &nbsp;|&nbsp;
    <a href="https://seevora.in">seevora.in</a></p>
    <p style="margin-top:10px;font-size:11px;">
      This email was sent to ${lead.email}. &copy; ${new Date().getFullYear()} Seevora Private Limited.
    </p>
  </div>
</div>
</body>
</html>`;

  const text = `Hi ${lead.name || 'there'},\n\nI wanted to reach out personally from Seevora. We help businesses automate their operations with AI.\n\nWould you be open to a quick 20-minute discovery call?\n\nBook here: https://seevora.in/book-a-call\n\nBest regards,\nThe Seevora Team\n+91 82692 97967 | info@seevora.in`;

  return { subject, html, text };
}

/* ── POST /api/leads/:id/send-email — send to one lead ──────────────── */
router.post('/:id/send-email', mockAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Lead not found.' });

    const lead = normalizeLead(rows[0]);
    if (!lead.email) return res.status(400).json({ message: 'This lead has no email address.' });

    const { subject, html, text } = buildLeadEmail(lead);
    const result = await sendMail({ to: lead.email, subject, html, text });

    if (result.success) {
      // Update last_contacted_at
      await pool.query('UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = $1', [lead.id]);
      return res.json({ success: true, message: `Email sent to ${lead.email}` });
    } else {
      return res.status(500).json({ success: false, message: result.error || 'Failed to send email.' });
    }
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/leads/bulk-email — send to all leads with emails ──────── */
router.post('/bulk-email', mockAuth, async (req, res, next) => {
  try {
    // Optional: filter by stage or specific ids
    const { leadIds } = req.body; // if provided, send only to these; otherwise all with emails
    let query;
    if (Array.isArray(leadIds) && leadIds.length) {
      query = await pool.query(
        `SELECT * FROM leads WHERE id = ANY($1::uuid[]) AND email IS NOT NULL AND email != ''`,
        [leadIds]
      );
    } else {
      query = await pool.query(`SELECT * FROM leads WHERE email IS NOT NULL AND email != '' ORDER BY created_at DESC`);
    }

    const rows = query.rows;
    if (!rows.length) return res.status(400).json({ message: 'No leads with email addresses found.' });

    const results = [];
    for (const row of rows) {
      const lead = normalizeLead(row);
      const { subject, html, text } = buildLeadEmail(lead);
      const r = await sendMail({ to: lead.email, subject, html, text });
      results.push({ name: lead.name, email: lead.email, success: r.success, error: r.error });
      if (r.success) {
        await pool.query('UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = $1', [lead.id]);
      }
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    return res.json({ success: true, sent, failed, total: rows.length, results });
  } catch (err) {
    next(err);
  }
});

export default router;
