import crypto from 'crypto';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';
import { sendEmail } from '../utils/email.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const ADMIN_ROLES = ['super_admin', 'admin', 'manager'];

/* ── Gemini Setup ────────────────────────────────────────────────────── */
function getGenAI() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/* ── AI Email Personalization ────────────────────────────────────────── */
async function personalizeEmailWithAI({ lead, template, tone, language, senderName }) {
  const genAI = getGenAI();

  // Replace basic template variables first
  const baseSubject = template.subject
    .replace(/\{\{name\}\}/g, lead.name || '')
    .replace(/\{\{company\}\}/g, lead.company || 'your company')
    .replace(/\{\{industry\}\}/g, lead.industry || 'your industry')
    .replace(/\{\{sender_name\}\}/g, senderName || 'Seevora Team');

  const baseBody = template.body
    .replace(/\{\{name\}\}/g, lead.name || '')
    .replace(/\{\{company\}\}/g, lead.company || 'your company')
    .replace(/\{\{industry\}\}/g, lead.industry || 'your industry')
    .replace(/\{\{sender_name\}\}/g, senderName || 'Seevora Team');

  if (!genAI) {
    // Fallback: use template as-is without AI enhancement
    return { subject: baseSubject, body: baseBody, aiUsed: false };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a senior B2B sales copywriter for Seevora, an Indian AI automation company.
Your task is to PERSONALIZE and ENHANCE the following outbound email for a specific lead.

Lead Details:
- Name: ${lead.name}
- Company: ${lead.company || 'N/A'}
- Industry: ${lead.industry || 'N/A'}
- Designation: ${lead.designation || 'N/A'}
- Pipeline Stage: ${lead.pipelineStage || lead.pipeline_stage || 'new'}
- Notes: ${lead.notes || 'None'}

Email Template (subject + body):
SUBJECT: ${baseSubject}
BODY:
${baseBody}

Instructions:
- Keep the structure and core message of the template intact
- Naturally weave in specifics about their company, industry, or designation where it feels genuine
- Tone: ${tone || 'professional'} — ${tone === 'friendly' ? 'warm and conversational, like a colleague' : tone === 'urgent' ? 'create a sense of FOMO and urgency without being pushy' : 'polished, confident, value-first'}
- Language: ${language === 'hindi' ? 'Write in Hindi (Devanagari)' : language === 'hinglish' ? 'Mix Hindi and English naturally (Hinglish)' : 'Write in clear, professional English'}
- Keep total email under 200 words
- Do NOT invent fake statistics or client names
- End with a soft single CTA

Respond ONLY in this exact JSON format:
{
  "subject": "the enhanced subject line",
  "body": "the complete personalized email body"
}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || baseSubject,
        body: parsed.body || baseBody,
        aiUsed: true,
        prompt,
      };
    }
  } catch (err) {
    console.error('AI personalization failed, using template fallback:', err.message);
  }

  return { subject: baseSubject, body: baseBody, aiUsed: false };
}

/* ═══════════════════════════════════════════════════════════════════════
   TEMPLATES
══════════════════════════════════════════════════════════════════════ */

/* GET /api/email-bot/templates */
router.get('/templates', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM email_templates WHERE is_active = true ORDER BY created_at ASC'
    );
    res.json({ templates: result.rows });
  } catch (err) { next(err); }
});

/* GET /api/email-bot/templates/:id */
router.get('/templates/:id', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM email_templates WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Template not found.' });
    res.json({ template: result.rows[0] });
  } catch (err) { next(err); }
});

/* POST /api/email-bot/templates */
router.post('/templates', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const { name, category = 'outbound', subject, body, variables = [], tone = 'professional' } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required.' });
    }
    const result = await pool.query(
      `INSERT INTO email_templates (id, name, category, subject, body, variables, tone, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [crypto.randomUUID(), name, category, subject, body, JSON.stringify(variables), tone, req.user.id]
    );
    res.status(201).json({ message: 'Template created.', template: result.rows[0] });
  } catch (err) { next(err); }
});

/* PUT /api/email-bot/templates/:id */
router.put('/templates/:id', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const { name, category, subject, body, variables, tone } = req.body;
    const existing = await pool.query('SELECT * FROM email_templates WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Template not found.' });
    const row = existing.rows[0];

    const result = await pool.query(
      `UPDATE email_templates SET
         name=$2, category=$3, subject=$4, body=$5, variables=$6, tone=$7, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [
        req.params.id,
        name ?? row.name,
        category ?? row.category,
        subject ?? row.subject,
        body ?? row.body,
        JSON.stringify(variables ?? row.variables),
        tone ?? row.tone,
      ]
    );
    res.json({ message: 'Template updated.', template: result.rows[0] });
  } catch (err) { next(err); }
});

/* DELETE /api/email-bot/templates/:id */
router.delete('/templates/:id', requireRole(['super_admin', 'admin']), async (req, res, next) => {
  try {
    await pool.query('UPDATE email_templates SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Template deactivated.' });
  } catch (err) { next(err); }
});

/* ═══════════════════════════════════════════════════════════════════════
   CAMPAIGNS
══════════════════════════════════════════════════════════════════════ */

/* GET /api/email-bot/campaigns */
router.get('/campaigns', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT c.*, t.name AS template_name,
        (SELECT COUNT(*) FROM email_campaign_leads cl WHERE cl.campaign_id = c.id) AS total_leads_actual,
        (SELECT COUNT(*) FROM email_logs l WHERE l.campaign_id = c.id AND l.status = 'sent') AS delivered,
        (SELECT COUNT(*) FROM email_logs l WHERE l.campaign_id = c.id AND l.status = 'failed') AS failed
      FROM email_campaigns c
      LEFT JOIN email_templates t ON t.id = c.template_id
      ORDER BY c.created_at DESC
    `);
    res.json({ campaigns: result.rows });
  } catch (err) { next(err); }
});

/* POST /api/email-bot/campaigns — create campaign */
router.post('/campaigns', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const {
      name, templateId, leadIds = [], tone = 'professional',
      language = 'english', senderPersona, scheduledAt,
    } = req.body;

    if (!name || !templateId) {
      return res.status(400).json({ message: 'Campaign name and template are required.' });
    }
    if (!leadIds.length) {
      return res.status(400).json({ message: 'At least one lead is required.' });
    }

    // Create the campaign
    const campaign = await pool.query(
      `INSERT INTO email_campaigns
         (id, name, template_id, tone, language, sender_persona, scheduled_at, total_leads, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        crypto.randomUUID(), name, templateId, tone, language,
        senderPersona || null,
        scheduledAt ? new Date(scheduledAt) : null,
        leadIds.length, req.user.id,
      ]
    );
    const campaignId = campaign.rows[0].id;

    // Link leads
    for (const leadId of leadIds) {
      await pool.query(
        `INSERT INTO email_campaign_leads (id, campaign_id, lead_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), campaignId, leadId]
      );
    }

    res.status(201).json({ message: 'Campaign created.', campaign: campaign.rows[0] });
  } catch (err) { next(err); }
});

/* POST /api/email-bot/campaigns/:id/launch — launch campaign */
router.post('/campaigns/:id/launch', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const campaignResult = await pool.query(
      `SELECT c.*, t.subject AS t_subject, t.body AS t_body, t.name AS t_name
       FROM email_campaigns c
       JOIN email_templates t ON t.id = c.template_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!campaignResult.rowCount) return res.status(404).json({ message: 'Campaign not found.' });

    const campaign = campaignResult.rows[0];
    if (campaign.status === 'launched' || campaign.status === 'completed') {
      return res.status(400).json({ message: `Campaign is already ${campaign.status}.` });
    }

    // Mark as launching
    await pool.query(
      `UPDATE email_campaigns SET status='launched', launched_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [campaign.id]
    );

    // Get all pending leads for campaign
    const leadsResult = await pool.query(
      `SELECT l.* FROM leads l
       JOIN email_campaign_leads cl ON cl.lead_id = l.id
       WHERE cl.campaign_id = $1 AND cl.status = 'pending' AND l.email IS NOT NULL`,
      [campaign.id]
    );

    const template = { subject: campaign.t_subject, body: campaign.t_body };
    const senderName = campaign.sender_persona || 'Seevora Team';
    let sentCount = 0;
    let failedCount = 0;

    // Fire and forget — respond immediately, process in background
    res.json({ message: `Campaign launched. Processing ${leadsResult.rows.length} leads.`, campaignId: campaign.id });

    // Process emails in background
    for (const lead of leadsResult.rows) {
      try {
        const { subject, body, aiUsed, prompt } = await personalizeEmailWithAI({
          lead,
          template,
          tone: campaign.tone,
          language: campaign.language,
          senderName,
        });

        const emailResult = await sendEmail({ to: lead.email, subject, text: body, html: body.replace(/\n/g, '<br>') });

        await pool.query(
          `INSERT INTO email_logs
             (id, campaign_id, lead_id, template_id, to_email, to_name, subject, body, ai_prompt, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            crypto.randomUUID(), campaign.id, lead.id, campaign.template_id,
            lead.email, lead.name, subject, body,
            prompt || null,
            emailResult ? 'sent' : 'failed',
          ]
        );

        // Update lead's last contacted time and campaign lead status
        await pool.query(
          `UPDATE leads SET last_contacted_at=NOW(), updated_at=NOW() WHERE id=$1`, [lead.id]
        );
        await pool.query(
          `UPDATE email_campaign_leads SET status='sent' WHERE campaign_id=$1 AND lead_id=$2`,
          [campaign.id, lead.id]
        );

        emailResult ? sentCount++ : failedCount++;
      } catch (leadErr) {
        console.error(`Failed to process lead ${lead.id}:`, leadErr.message);
        failedCount++;
        await pool.query(
          `UPDATE email_campaign_leads SET status='failed' WHERE campaign_id=$1 AND lead_id=$2`,
          [campaign.id, lead.id]
        );
      }
    }

    // Mark campaign completed
    await pool.query(
      `UPDATE email_campaigns SET status='completed', completed_at=NOW(), sent_count=$2, failed_count=$3, updated_at=NOW() WHERE id=$1`,
      [campaign.id, sentCount, failedCount]
    );
  } catch (err) { next(err); }
});

/* ═══════════════════════════════════════════════════════════════════════
   SINGLE SEND (quick-action from lead card)
══════════════════════════════════════════════════════════════════════ */
router.post('/send-single', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const { leadId, templateId, tone = 'professional', language = 'english', senderName = 'Seevora Team' } = req.body;
    if (!leadId || !templateId) {
      return res.status(400).json({ message: 'leadId and templateId are required.' });
    }

    const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (!leadResult.rowCount) return res.status(404).json({ message: 'Lead not found.' });

    const templateResult = await pool.query('SELECT * FROM email_templates WHERE id = $1', [templateId]);
    if (!templateResult.rowCount) return res.status(404).json({ message: 'Template not found.' });

    const lead = leadResult.rows[0];
    const template = templateResult.rows[0];

    if (!lead.email) return res.status(400).json({ message: 'This lead has no email address.' });

    const { subject, body, aiUsed, prompt } = await personalizeEmailWithAI({
      lead: { ...lead, pipelineStage: lead.pipeline_stage },
      template,
      tone,
      language,
      senderName,
    });

    const emailResult = await sendEmail({
      to: lead.email,
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;">${body.replace(/\n/g, '<br>')}</div>`,
    });

    // Log the send
    await pool.query(
      `INSERT INTO email_logs
         (id, lead_id, template_id, to_email, to_name, subject, body, ai_prompt, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        crypto.randomUUID(), lead.id, template.id,
        lead.email, lead.name, subject, body, prompt || null,
        emailResult ? 'sent' : 'failed',
      ]
    );

    await pool.query('UPDATE leads SET last_contacted_at=NOW(), updated_at=NOW() WHERE id=$1', [lead.id]);

    res.json({
      message: emailResult ? `Email sent to ${lead.email}` : 'Email queued (SMTP not configured)',
      subject,
      body,
      aiUsed,
    });
  } catch (err) { next(err); }
});

/* ═══════════════════════════════════════════════════════════════════════
   EMAIL LOGS
══════════════════════════════════════════════════════════════════════ */
router.get('/logs', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const { campaignId, leadId, limit = 50, offset = 0 } = req.query;
    const conditions = [];
    const values = [];

    if (campaignId) { values.push(campaignId); conditions.push(`l.campaign_id = $${values.length}`); }
    if (leadId) { values.push(leadId); conditions.push(`l.lead_id = $${values.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(
      `SELECT l.*, ld.name AS lead_name, ld.company AS lead_company, c.name AS campaign_name
       FROM email_logs l
       LEFT JOIN leads ld ON ld.id = l.lead_id
       LEFT JOIN email_campaigns c ON c.id = l.campaign_id
       ${where}
       ORDER BY l.sent_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM email_logs l ${where}`,
      values.slice(0, -2)
    );

    res.json({ logs: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) { next(err); }
});

/* ── AI Preview — preview personalized email without sending ─────────── */
router.post('/preview', requireRole(ADMIN_ROLES), async (req, res, next) => {
  try {
    const { leadId, templateId, tone = 'professional', language = 'english', senderName = 'Seevora Team' } = req.body;
    if (!leadId || !templateId) return res.status(400).json({ message: 'leadId and templateId are required.' });

    const [leadRes, tmplRes] = await Promise.all([
      pool.query('SELECT * FROM leads WHERE id = $1', [leadId]),
      pool.query('SELECT * FROM email_templates WHERE id = $1', [templateId]),
    ]);

    if (!leadRes.rowCount) return res.status(404).json({ message: 'Lead not found.' });
    if (!tmplRes.rowCount) return res.status(404).json({ message: 'Template not found.' });

    const lead = leadRes.rows[0];
    const template = tmplRes.rows[0];

    const { subject, body, aiUsed } = await personalizeEmailWithAI({
      lead: { ...lead, pipelineStage: lead.pipeline_stage },
      template,
      tone,
      language,
      senderName,
    });

    res.json({ subject, body, aiUsed });
  } catch (err) { next(err); }
});

/* ── Campaign scheduler (check every 60 seconds for scheduled campaigns) */
setInterval(async () => {
  try {
    const due = await pool.query(
      `SELECT id FROM email_campaigns WHERE status='draft' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()`
    );
    for (const row of due.rows) {
      console.log(`[Email Bot Scheduler] Launching scheduled campaign ${row.id}`);
      // Trigger internal launch by updating status; actual send loop runs on next API call or can be triggered here
      await pool.query(
        `UPDATE email_campaigns SET status='launching', updated_at=NOW() WHERE id=$1`, [row.id]
      );
    }
  } catch (err) {
    console.error('[Email Bot Scheduler] Error:', err.message);
  }
}, 60_000);

export default router;
