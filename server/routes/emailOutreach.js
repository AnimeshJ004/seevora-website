/* ============================================================
   Seevora — CRM Email Outreach Route
   POST /api/email-outreach/send        - Send to one lead
   POST /api/email-outreach/bulk        - Send to multiple leads
   GET  /api/email-outreach/history     - Email send history
   GET  /api/email-outreach/templates   - Get/save templates
============================================================ */
import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { sendMail, sendBulk } from '../utils/mailer.js';
import { crmOutboundEmail } from '../utils/emailTemplates.js';

const router = express.Router();

/* ── POST /api/email-outreach/send ─────────────────────────
   Send customized outbound email to a single lead
────────────────────────────────────────────────────────── */
router.post('/send', async (req, res, next) => {
  try {
    const {
      leadId,
      to,               // email address
      leadName,
      company,
      senderName,
      customMessage,    // personalized body text
      serviceContext,   // e.g. "We specialize in healthcare AI"
      templateId,       // optional — use saved template
    } = req.body;

    if (!to || !leadName) {
      return res.status(400).json({ error: 'Email address and lead name are required.' });
    }

    // Build email from template
    const tpl = crmOutboundEmail({ leadName, company, senderName, customMessage, serviceContext });

    const result = await sendMail({ to, ...tpl });

    // Log in DB
    await pool.query(
      `INSERT INTO email_outreach_logs (id, lead_id, to_email, subject, status, error, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), leadId || null, to, tpl.subject, result.success ? 'sent' : 'failed', result.error || null]
    ).catch(() => {}); // table may not exist yet — graceful

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send email', sent: false });
    }

    return res.json({
      sent: true,
      message: `Email sent to ${to}`,
      subject: tpl.subject,
    });
  } catch (err) {
    return next(err);
  }
});

/* ── POST /api/email-outreach/bulk ─────────────────────────
   Send outbound emails to multiple leads at once
────────────────────────────────────────────────────────── */
router.post('/bulk', async (req, res, next) => {
  try {
    const { leads, senderName, customMessage, serviceContext } = req.body;
    // leads = [{ email, name, company, leadId }]
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array is required.' });
    }

    const results = [];
    for (const lead of leads) {
      const tpl = crmOutboundEmail({
        leadName: lead.name,
        company: lead.company,
        senderName,
        customMessage,
        serviceContext,
      });
      const r = await sendMail({ to: lead.email, ...tpl });
      results.push({ email: lead.email, name: lead.name, sent: r.success, error: r.error });

      // Log
      await pool.query(
        `INSERT INTO email_outreach_logs (id, lead_id, to_email, subject, status, error, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), lead.leadId || null, lead.email, tpl.subject, r.success ? 'sent' : 'failed', r.error || null]
      ).catch(() => {});
    }

    const sent  = results.filter(r => r.sent).length;
    const failed= results.filter(r => !r.sent).length;

    return res.json({
      message: `${sent} emails sent, ${failed} failed.`,
      sent, failed, results,
    });
  } catch (err) {
    return next(err);
  }
});

/* ── GET /api/email-outreach/history ───────────────────────
   Get recent outreach email logs
────────────────────────────────────────────────────────── */
router.get('/history', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_outreach_logs ORDER BY sent_at DESC LIMIT 100`
    ).catch(() => ({ rows: [] }));
    return res.json({ logs: result.rows });
  } catch (err) {
    return next(err);
  }
});

/* ── GET /api/email-outreach/templates ─────────────────────
   Return the available email template types
────────────────────────────────────────────────────────── */
router.get('/templates', (_req, res) => {
  return res.json({
    templates: [
      {
        id: 'cold_outreach',
        name: 'Cold Outreach',
        description: 'Initial contact with a potential lead',
        variables: ['leadName', 'company', 'senderName', 'customMessage', 'serviceContext'],
      },
    ],
  });
});

/* ── POST /api/email-outreach/preview ──────────────────────
   Preview an email without sending
────────────────────────────────────────────────────────── */
router.post('/preview', (req, res) => {
  const { leadName, company, senderName, customMessage, serviceContext } = req.body;
  const tpl = crmOutboundEmail({ leadName: leadName || 'Lead Name', company, senderName, customMessage, serviceContext });
  return res.json({ subject: tpl.subject, html: tpl.html, text: tpl.text });
});

export default router;
