import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { sendMail } from '../utils/mailer.js';
import { sendCampaign } from '../utils/campaignSender.js';

const router = express.Router();

// Helper to check auth (similar to mockAuth in leads.js or requireAuth if token exists)
const getUserId = (req) => {
  return req.user?.id || null;
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   1. EMAIL TEMPLATES CRUD
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.get('/templates', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM email_templates ORDER BY created_at DESC');
    res.json({ templates: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/templates', async (req, res, next) => {
  try {
    const { name, category, subject, body, variables = ['name', 'company', 'industry', 'sender_name'], tone = 'professional' } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required.' });
    }
    const result = await pool.query(
      `INSERT INTO email_templates (id, name, category, subject, body, variables, tone, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [crypto.randomUUID(), name, category || 'outbound', subject, body, JSON.stringify(variables), tone, getUserId(req)]
    );
    res.status(201).json({ template: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/templates/:id', async (req, res, next) => {
  try {
    const { name, category, subject, body, variables, tone, is_active } = req.body;
    const existing = await pool.query('SELECT * FROM email_templates WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Template not found.' });

    const row = existing.rows[0];
    const result = await pool.query(
      `UPDATE email_templates
       SET name = $2, category = $3, subject = $4, body = $5, variables = $6, tone = $7, is_active = $8, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        req.params.id,
        name !== undefined ? name : row.name,
        category !== undefined ? category : row.category,
        subject !== undefined ? subject : row.subject,
        body !== undefined ? body : row.body,
        variables !== undefined ? JSON.stringify(variables) : JSON.stringify(row.variables),
        tone !== undefined ? tone : row.tone,
        is_active !== undefined ? is_active : row.is_active
      ]
    );
    res.json({ template: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/templates/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM email_templates WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Template not found.' });
    res.json({ message: 'Template deleted.' });
  } catch (err) {
    next(err);
  }
});


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   2. SUBSCRIBERS CRUD
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.get('/subscribers', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC');
    res.json({ subscribers: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/subscribers', async (req, res, next) => {
  try {
    const { email, name, status = 'active' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const result = await pool.query(
      `INSERT INTO subscribers (id, email, name, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, updated_at = NOW()
       RETURNING *`,
      [crypto.randomUUID(), email.trim().toLowerCase(), name || null, status]
    );
    res.status(201).json({ subscriber: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/subscribers/bulk', async (req, res, next) => {
  try {
    const { subscribers } = req.body;
    if (!Array.isArray(subscribers) || !subscribers.length) {
      return res.status(400).json({ message: 'Subscribers array is required.' });
    }
    const inserted = [];
    for (const s of subscribers) {
      if (!s.email) continue;
      const r = await pool.query(
        `INSERT INTO subscribers (id, email, name, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (email) DO UPDATE SET name = COALESCE(subscribers.name, EXCLUDED.name), updated_at = NOW()
         RETURNING *`,
        [crypto.randomUUID(), s.email.trim().toLowerCase(), s.name || null]
      );
      inserted.push(r.rows[0]);
    }
    res.status(201).json({ message: `${inserted.length} subscribers imported.`, subscribers: inserted });
  } catch (err) {
    next(err);
  }
});

router.put('/subscribers/:id', async (req, res, next) => {
  try {
    const { name, status } = req.body;
    const existing = await pool.query('SELECT * FROM subscribers WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Subscriber not found.' });

    const row = existing.rows[0];
    const unsubscribedAt = status === 'unsubscribed' && row.status !== 'unsubscribed' ? new Date() : row.unsubscribed_at;

    const result = await pool.query(
      `UPDATE subscribers
       SET name = $2, status = $3, unsubscribed_at = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id, name !== undefined ? name : row.name, status !== undefined ? status : row.status, unsubscribedAt]
    );
    res.json({ subscriber: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/subscribers/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM subscribers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Subscriber not found.' });
    res.json({ message: 'Subscriber deleted.' });
  } catch (err) {
    next(err);
  }
});

/* ── Send personalised email to a single subscriber ── */
router.post('/subscribers/:id/send-email', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM subscribers WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Subscriber not found.' });

    const sub = rows[0];
    const firstName = sub.name ? sub.name.split(' ')[0] : 'there';

    const subject = `Hey ${firstName}, a quick note from Seevora 👋`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Seevora</title>
<style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
  .header{background:#0a0a0a;padding:28px 36px;text-align:center;}
  .logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
  .logo span{color:#14c9e1;}
  .tagline{font-size:12px;color:#94a3b8;margin-top:4px;}
  .body{padding:36px 36px 28px;}
  .body h2{font-size:20px;font-weight:700;color:#0f172a;margin:0 0 12px;}
  .body p{font-size:15px;color:#475569;line-height:1.7;margin:0 0 14px;}
  .cta{display:inline-block;margin:20px 0;padding:13px 28px;background:#0a0a0a;color:#fff!important;text-decoration:none;border-radius:100px;font-size:14px;font-weight:700;}
  .detail-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:18px 0;}
  .footer{background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #e2e8f0;}
  .footer p{font-size:12px;color:#94a3b8;margin:0;line-height:1.8;}
  .footer a{color:#14c9e1;text-decoration:none;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Seevora<span>.</span></div>
    <div class="tagline">AI-Powered Business Automation</div>
  </div>
  <div class="body">
    <h2>Hi ${sub.name || 'there'} 👋</h2>
    <p>Thank you for being part of the <strong>Seevora</strong> community. We're building something exciting and wanted to personally reach out to you.</p>
    <div class="detail-box">
      <p style="margin:0;font-size:14px;color:#0f172a;">
        🚀 <strong>What we do:</strong> We help businesses automate their operations with AI — from customer communication to lead management, all in one platform.
      </p>
    </div>
    <p>We'd love to show you how Seevora can save your team hours every week. Book a free discovery call and let's talk:</p>
    <a href="https://seevora.in/book-a-call" class="cta">Book a Free Call →</a>
    <p style="font-size:13px;color:#94a3b8;">Questions? Just reply to this email — we read every one.</p>
  </div>
  <div class="footer">
    <p><strong>Seevora Private Limited</strong><br/>Indore, Madhya Pradesh, India<br/>
    <a href="tel:+918269297967">+91 82692 97967</a> &nbsp;|&nbsp;
    <a href="mailto:info@seevora.in">info@seevora.in</a><br/>
    <a href="https://seevora.in">seevora.in</a></p>
    <p style="margin-top:10px;font-size:11px;">
      This email was sent to ${sub.email}. &copy; ${new Date().getFullYear()} Seevora Private Limited.
    </p>
  </div>
</div>
</body>
</html>`;

    const text = `Hi ${sub.name || 'there'},\n\nThank you for being part of the Seevora community!\n\nWe help businesses automate their operations with AI.\n\nBook a free discovery call: https://seevora.in/book-a-call\n\nBest regards,\nThe Seevora Team\n+91 82692 97967`;

    const result2 = await sendMail({ to: sub.email, subject, html, text });

    if (result2.success) {
      return res.json({ message: `Email sent to ${sub.email} successfully.`, success: true });
    } else {
      return res.status(500).json({ message: `Failed to send email: ${result2.error}`, success: false });
    }
  } catch (err) {
    next(err);
  }
});


/* ──────────────────────────────────────────────────────────────────────────
   3. EMAIL CAMPAIGNS & SCHEDULING
   ────────────────────────────────────────────────────────────────────────── */
router.get('/campaigns', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT ec.*, et.name as template_name
      FROM email_campaigns ec
      LEFT JOIN email_templates et ON ec.template_id = et.id
      ORDER BY ec.created_at DESC
    `);
    res.json({ campaigns: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/campaigns', async (req, res, next) => {
  try {
    const { name, templateId, status = 'draft', scheduledAt, tone = 'professional', language = 'english', senderPersona, campaignType = 'newsletter', leadIds = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Campaign name is required.' });

    const campaignId = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO email_campaigns (id, name, template_id, status, tone, language, sender_persona, scheduled_at, total_leads, created_by, campaign_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [campaignId, name, templateId || null, status, tone, language, senderPersona || null, scheduledAt || null, leadIds.length, getUserId(req), campaignType]
    );

    // Save target leads mapping
    if (leadIds.length) {
      for (const leadId of leadIds) {
        await pool.query(
          `INSERT INTO email_campaign_leads (id, campaign_id, lead_id, status)
           VALUES ($1, $2, $3, 'pending') ON CONFLICT DO NOTHING`,
          [crypto.randomUUID(), campaignId, leadId]
        );
      }
    }

    res.status(201).json({ campaign: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/campaigns/:id', async (req, res, next) => {
  try {
    const { name, templateId, status, scheduledAt, tone, language, senderPersona, campaignType, leadIds } = req.body;
    const existing = await pool.query('SELECT * FROM email_campaigns WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Campaign not found.' });

    const row = existing.rows[0];
    const finalScheduledAt = scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : row.scheduled_at;

    const result = await pool.query(
      `UPDATE email_campaigns
       SET name = $2, template_id = $3, status = $4, scheduled_at = $5, tone = $6, language = $7, sender_persona = $8, total_leads = COALESCE($9, total_leads), campaign_type = $10, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        req.params.id,
        name !== undefined ? name : row.name,
        templateId !== undefined ? templateId : row.template_id,
        status !== undefined ? status : row.status,
        finalScheduledAt,
        tone !== undefined ? tone : row.tone,
        language !== undefined ? language : row.language,
        senderPersona !== undefined ? senderPersona : row.sender_persona,
        leadIds ? leadIds.length : null,
        campaignType !== undefined ? campaignType : row.campaign_type
      ]
    );

    if (leadIds && Array.isArray(leadIds)) {
      await pool.query('DELETE FROM email_campaign_leads WHERE campaign_id = $1', [req.params.id]);
      for (const leadId of leadIds) {
        await pool.query(
          `INSERT INTO email_campaign_leads (id, campaign_id, lead_id, status)
           VALUES ($1, $2, $3, 'pending') ON CONFLICT DO NOTHING`,
          [crypto.randomUUID(), req.params.id, leadId]
        );
      }
    }

    res.json({ campaign: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/campaigns/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM email_campaigns WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Campaign not found.' });
    res.json({ message: 'Campaign deleted.' });
  } catch (err) {
    next(err);
  }
});

router.post('/campaigns/:id/publish', async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM email_campaigns WHERE id = $1', [req.params.id]);
    const campaign = existing.rows[0];
    if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });

    if (campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date()) {
      const updated = await pool.query(
        `UPDATE email_campaigns SET status = 'scheduled', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [campaign.id]
      );
      return res.json({ message: 'Campaign scheduled for delivery.', campaign: updated.rows[0] });
    }

    const result = await sendCampaign(campaign.id);
    if (!result.success) return res.status(500).json({ message: result.error || 'Failed to publish campaign.' });
    return res.json({ message: `Campaign published and sent. ${result.sent} sent, ${result.failed} failed.`, sent: result.sent, failed: result.failed });
  } catch (err) {
    next(err);
  }
});

/* â”€â”€ 4. MANUAL CAMPAIGN SEND (DISPATCH IMMEDIATELY) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.post('/campaigns/:id/send', async (req, res, next) => {
  try {
    const campaignId = req.params.id;
    const result = await sendCampaign(campaignId);
    if (!result.success) {
      return res.status(500).json({ message: result.error || 'Failed to send campaign' });
    }
    res.json({ message: `Campaign sent. ${result.sent} successfully, ${result.failed} failed.`, sent: result.sent, failed: result.failed });
  } catch (err) {
    next(err);
  }
});



/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   5. EMAIL DISPATCH LOGS & HISTORY
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.get('/history', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT el.*, ec.name as campaign_name, et.name as template_name
      FROM email_logs el
      LEFT JOIN email_campaigns ec ON el.campaign_id = ec.id
      LEFT JOIN email_templates et ON el.template_id = et.id
      ORDER BY el.sent_at DESC
      LIMIT 150
    `);
    res.json({ logs: result.rows });
  } catch (err) {
    next(err);
  }
});


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   6. AI OUTBOUND PERSONALIZATION & PREVIEW
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.post('/preview', async (req, res, next) => {
  try {
    const { leadId, templateId, tone = 'professional', language = 'english', senderName = 'Seevora Team' } = req.body;
    if (!leadId || !templateId) {
      return res.status(400).json({ error: 'leadId and templateId are required.' });
    }

    const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    const lead = leadRes.rows[0];
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    if (!lead.email) return res.status(400).json({ message: 'This lead does not have an email address.' });

    const templateRes = await pool.query('SELECT * FROM email_templates WHERE id = $1', [templateId]);
    const template = templateRes.rows[0];
    if (!template) return res.status(404).json({ error: 'Template not found.' });

    // Build standard replacement
    let subject = template.subject
      .replace(/\{\{name\}\}/g, lead.name || '')
      .replace(/\{\{company\}\}/g, lead.company || '')
      .replace(/\{\{industry\}\}/g, lead.industry || 'your sector')
      .replace(/\{\{sender_name\}\}/g, senderName);

    let body = template.body
      .replace(/\{\{name\}\}/g, lead.name || '')
      .replace(/\{\{company\}\}/g, lead.company || '')
      .replace(/\{\{industry\}\}/g, lead.industry || 'your sector')
      .replace(/\{\{sender_name\}\}/g, senderName);

    // Call AI if configured, otherwise fallback to template output
    let aiUsed = false;
    if (process.env.OPENAI_API_KEY) {
      try {
        const systemPrompt = `You are a high-converting B2B Sales outreach assistant for Seevora.
Your task is to take the following email draft and refine it to match a "${tone}" tone and be written in "${language}" (could be English, Hindi, or Hinglish).
Ensure you maintain the placeholder values or already resolved values. Keep it crisp, personalized, and under 150 words.
Subject: ${subject}
Body: ${body}

Return JSON format:
{
  "subject": "refined subject",
  "body": "refined body text"
}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            max_tokens: 300,
            response_format: { type: "json_object" }
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        if (parsed.subject && parsed.body) {
          subject = parsed.subject;
          body = parsed.body;
          aiUsed = true;
        }
      } catch (e) {
        console.warn('AI Preview personalization failed, using standard template rendering:', e.message);
      }
    }

    res.json({ subject, body, aiUsed });
  } catch (err) {
    next(err);
  }
});

router.post('/send-single', async (req, res, next) => {
  try {
    const { leadId, templateId, tone, language, senderName } = req.body;
    if (!leadId || !templateId) {
      return res.status(400).json({ error: 'leadId and templateId are required.' });
    }

    const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    const lead = leadRes.rows[0];
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    if (!lead.email) return res.status(400).json({ message: 'This lead does not have an email address.' });

    const templateRes = await pool.query('SELECT * FROM email_templates WHERE id = $1', [templateId]);
    const template = templateRes.rows[0];
    if (!template) return res.status(404).json({ error: 'Template not found.' });

    // Call /preview logic internally to get the resolved email
    let subject = template.subject
      .replace(/\{\{name\}\}/g, lead.name || '')
      .replace(/\{\{company\}\}/g, lead.company || '')
      .replace(/\{\{industry\}\}/g, lead.industry || 'your sector')
      .replace(/\{\{sender_name\}\}/g, senderName || 'Seevora Team');

    let body = template.body
      .replace(/\{\{name\}\}/g, lead.name || '')
      .replace(/\{\{company\}\}/g, lead.company || '')
      .replace(/\{\{industry\}\}/g, lead.industry || 'your sector')
      .replace(/\{\{sender_name\}\}/g, senderName || 'Seevora Team');

    let aiUsed = false;
    if (process.env.OPENAI_API_KEY) {
      try {
        const systemPrompt = `You are a B2B Sales outreach assistant for Seevora.
Refine the following email to match a "${tone || 'professional'}" tone in "${language || 'english'}".
Keep it under 150 words.
Subject: ${subject}
Body: ${body}

Return JSON:
{
  "subject": "refined subject",
  "body": "refined body"
}`;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            max_tokens: 300,
            response_format: { type: "json_object" }
          }),
        });
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        if (parsed.subject && parsed.body) {
          subject = parsed.subject;
          body = parsed.body;
          aiUsed = true;
        }
      } catch (e) {
        console.warn('AI single outreach personalization failed:', e.message);
      }
    }

    const logId = crypto.randomUUID();
    const openTracker = `<img src="${process.env.VITE_API_URL || 'http://localhost:4000'}/api/email-bot/track/open/${logId}" width="1" height="1" style="display:none;" />`;
    const wrapLink = (url) => {
      return `${process.env.VITE_API_URL || 'http://localhost:4000'}/api/email-bot/track/click/${logId}?url=${encodeURIComponent(url)}`;
    };

    body = body.replace(/href="([^"]+)"/g, (match, url) => `href="${wrapLink(url)}"`);
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => `[${text}](${wrapLink(url)})`);

    const htmlBody = `<div style="font-family:sans-serif;color:#333;line-height:1.6;">${body.replace(/\n/g, '<br/>')}</div>${openTracker}`;

    const r = await sendMail({
      to: lead.email,
      subject,
      html: htmlBody,
      text: body
    });

    if (r.success) {
      await pool.query(
        `INSERT INTO email_logs (id, lead_id, template_id, to_email, to_name, subject, body, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', NOW())`,
        [logId, lead.id, template.id, lead.email, lead.name, subject, body]
      );
      // Update last contacted time
      await pool.query('UPDATE leads SET last_contacted_at = NOW() WHERE id = $1', [lead.id]).catch(() => { });
      res.json({ message: 'Email sent successfully!', subject, body, aiUsed });
    } else {
      await pool.query(
        `INSERT INTO email_logs (id, lead_id, template_id, to_email, to_name, subject, body, status, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'failed', $8, NOW())`,
        [logId, lead.id, template.id, lead.email, lead.name, subject, body, r.error]
      );
      res.status(500).json({ message: `Failed to send email: ${r.error}`, subject, body, aiUsed: false });
    }
  } catch (err) {
    next(err);
  }
});


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   7. OPEN & CLICK TRACKING ENDPOINTS
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
// 1x1 Pixel open tracker
router.get('/track/open/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    await pool.query('UPDATE email_logs SET opened_at = NOW() WHERE id = $1 AND opened_at IS NULL', [logId]);
  } catch (err) {
    console.error('Error tracking email open:', err.message);
  }
  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  res.end(pixel);
});

// Click redirection tracker
router.get('/track/click/:logId', async (req, res) => {
  const { logId } = req.params;
  const targetUrl = req.query.url;
  try {
    await pool.query('UPDATE email_logs SET clicked_at = NOW() WHERE id = $1 AND clicked_at IS NULL', [logId]);
  } catch (err) {
    console.error('Error tracking email click:', err.message);
  }
  if (targetUrl) {
    return res.redirect(targetUrl);
  }
  res.send('Redirect link invalid');
});

export default router;


