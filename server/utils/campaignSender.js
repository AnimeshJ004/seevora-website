import crypto from 'crypto';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from './cacheNamespaces.js';
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

      const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
      const systemPrompt = 'You are a B2B Sales outreach assistant for Seevora. Always respond with ONLY valid JSON containing keys "subject" and "body". No markdown, no extra text.';
      const prompt = `Personalize this outbound email for ${lead.name} at ${lead.company || 'their company'} in the ${lead.industry || 'industry'}. Keep it under 150 words.\nSubject: ${subject}\nBody: ${body}\n\nRespond with JSON: {"subject":"...","body":"..."}`;
      let finalSubject = subject;
      let finalBody = body;

      // AI-personalize each email via active provider
      if (provider === 'anthropic' && process.env.ANTHROPIC_EMAIL_API_KEY) {
        try {
          const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.ANTHROPIC_EMAIL_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: process.env.ANTHROPIC_EMAIL_MODEL || 'claude-3-haiku-20240307',
              max_tokens: 300,
              system: systemPrompt,
              messages: [{ role: 'user', content: prompt }]
            })
          });

          if (aiRes.ok) {
            const data = await aiRes.json();
            const text = data.content?.[0]?.text || '';
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              finalSubject = parsed.subject || finalSubject;
              finalBody = parsed.body || finalBody;
            }
          }
        } catch (err) {
          console.error(`[campaignSender] Anthropic personalization failed for ${lead.email}:`, err.message);
        }
      } else if (provider === 'groq' && process.env.GROQ_EMAIL_API_KEY) {
        try {
          const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
          const aiRes = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_EMAIL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: process.env.GROQ_EMAIL_MODEL || 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              response_format: { type: 'json_object' }
            })
          });

          if (aiRes.ok) {
            const data = await aiRes.json();
            const text = data.choices?.[0]?.message?.content || '';
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              finalSubject = parsed.subject || finalSubject;
              finalBody = parsed.body || finalBody;
            }
          }
        } catch (err) {
          console.error(`[campaignSender] OpenAI/Groq personalization failed for ${lead.email}:`, err.message);
        }
      }

      const logId = crypto.randomUUID();
      const openTracker = `<img src="${process.env.VITE_API_URL || 'http://localhost:4000'}/api/email-bot/track/open/${logId}" width="1" height="1" style="display:none;" />`;
      
      const wrapLink = (url) => {
        return `${process.env.VITE_API_URL || 'http://localhost:4000'}/api/email-bot/track/click/${logId}?url=${encodeURIComponent(url)}`;
      };

      finalBody = finalBody.replace(/href="([^"]+)"/g, (match, url) => `href="${wrapLink(url)}"`);
      finalBody = finalBody.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => `[${text}](${wrapLink(url)})`);

      const htmlBody = `<div style="font-family:sans-serif;color:#333;line-height:1.6;">${finalBody.replace(/\n/g, '<br/>')}</div>${openTracker}`;

      const r = await sendMail({
        to: lead.email,
        subject: finalSubject,
        html: htmlBody,
        text: finalBody
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

      invalidateCacheNamespaces(CACHE_NAMESPACES.analytics);
      
      // Delay 8 seconds to prevent Groq API rate limits (6000 TPM limit on free tier)
      await new Promise(resolve => setTimeout(resolve, 8000));
    }

    await pool.query(
      `UPDATE email_campaigns
       SET status = 'completed', completed_at = NOW(), sent_count = $2, failed_count = $3
       WHERE id = $1`,
      [campaignId, sent, failed]
    );

    invalidateCacheNamespaces(
      CACHE_NAMESPACES.analytics,
      CACHE_NAMESPACES.leads,
      `${CACHE_NAMESPACES.emailBot}:campaigns`
    );

    return { success: true, sent, failed };
  } catch (err) {
    console.error(`[CampaignSender] Failed sending campaign ${campaignId}:`, err.message);
    await pool.query("UPDATE email_campaigns SET status = 'failed' WHERE id = $1", [campaignId]).catch(() => {});
    invalidateCacheNamespaces(`${CACHE_NAMESPACES.emailBot}:campaigns`);
    return { success: false, error: err.message };
  }
}
