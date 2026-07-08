import crypto from 'crypto';
import pool from '../config/db.js';
import { sendMail } from './mailer.js';

export async function sendCampaign(campaignId) {
  try {
    const campaignRes = await pool.query('SELECT * FROM email_campaigns WHERE id = $1', [campaignId]);
    const campaign = campaignRes.rows[0];
    if (!campaign) throw new Error('Campaign not found.');

    const templateRes = await pool.query('SELECT * FROM email_templates WHERE id = $1', [campaign.template_id]);
    const template = templateRes.rows[0];
    if (!template) throw new Error('Template is missing or inactive.');

    // Fetch leads
    const leadsRes = await pool.query(`
      SELECT l.* FROM email_campaign_leads ecl
      JOIN leads l ON ecl.lead_id = l.id
      WHERE ecl.campaign_id = $1 AND ecl.status = 'pending'
    `, [campaignId]);

    const leads = leadsRes.rows;
    if (leads.length === 0) {
      const subsRes = await pool.query("SELECT * FROM subscribers WHERE status = 'active'");
      leads.push(...subsRes.rows.map(s => ({
        id: s.id,
        name: s.name || s.email.split('@')[0],
        email: s.email,
        company: 'Subscriber',
        industry: 'Marketing',
        isSubscriber: true
      })));
    }

    await pool.query("UPDATE email_campaigns SET status = 'sending', launched_at = NOW() WHERE id = $1", [campaignId]);

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      let subject = template.subject
        .replace(/\{\{name\}\}/g, lead.name || '')
        .replace(/\{\{company\}\}/g, lead.company || '')
        .replace(/\{\{industry\}\}/g, lead.industry || '')
        .replace(/\{\{sender_name\}\}/g, campaign.sender_persona || 'Seevora Team');

      let body = template.body
        .replace(/\{\{name\}\}/g, lead.name || '')
        .replace(/\{\{company\}\}/g, lead.company || '')
        .replace(/\{\{industry\}\}/g, lead.industry || '')
        .replace(/\{\{sender_name\}\}/g, campaign.sender_persona || 'Seevora Team');

      // AI-personalize each email via Anthropic
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
              max_tokens: 400,
              system: 'You are a B2B Sales outreach assistant for Seevora. Always respond with ONLY valid JSON containing keys "subject" and "body". No markdown, no extra text.',
              messages: [{
                role: 'user',
                content: `Personalize this outbound email for ${lead.name} at ${lead.company || 'their company'} in the ${lead.industry || 'industry'}. Keep it under 150 words.\nSubject: ${subject}\nBody: ${body}\n\nRespond with JSON: {"subject":"...","body":"..."}`
              }]
            })
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const raw = aiData.content?.[0]?.text || '';
            const m = raw.match(/\{[\s\S]*?\}/);
            if (m) {
              const parsed = JSON.parse(m[0]);
              if (parsed.subject && parsed.body) {
                subject = parsed.subject;
                body = parsed.body;
              }
            }
          }
        } catch (aiErr) {
          console.warn(`[CampaignSender] AI personalization failed for ${lead.email}:`, aiErr.message);
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
        sent++;
        await pool.query(
          `INSERT INTO email_logs (id, campaign_id, lead_id, template_id, to_email, to_name, subject, body, status, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent', NOW())`,
          [logId, campaignId, lead.isSubscriber ? null : lead.id, template.id, lead.email, lead.name, subject, body]
        );
        await pool.query(
          `UPDATE email_campaign_leads SET status = 'sent' WHERE campaign_id = $1 AND lead_id = $2`,
          [campaignId, lead.id]
        ).catch(() => {});
      } else {
        failed++;
        await pool.query(
          `INSERT INTO email_logs (id, campaign_id, lead_id, template_id, to_email, to_name, subject, body, status, error_message, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'failed', $9, NOW())`,
          [logId, campaignId, lead.isSubscriber ? null : lead.id, template.id, lead.email, lead.name, subject, body, r.error]
        );
        await pool.query(
          `UPDATE email_campaign_leads SET status = 'failed' WHERE campaign_id = $1 AND lead_id = $2`,
          [campaignId, lead.id]
        ).catch(() => {});
      }
    }

    await pool.query(
      `UPDATE email_campaigns
       SET status = 'completed', completed_at = NOW(), sent_count = $2, failed_count = $3
       WHERE id = $1`,
      [campaignId, sent, failed]
    );

    return { success: true, sent, failed };
  } catch (err) {
    console.error(`[CampaignSender] Failed sending campaign ${campaignId}:`, err.message);
    await pool.query("UPDATE email_campaigns SET status = 'failed' WHERE id = $1", [campaignId]).catch(() => {});
    return { success: false, error: err.message };
  }
}
