import express from 'express';
import pool from '../config/db.js';
import crypto from 'crypto';

const router = express.Router();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620';
const MAX_MESSAGE_LENGTH = 900;
const MAX_HISTORY_ITEMS = 10;

const COMPANY_CONTEXT = `
Seevora Private Limited is an Indian AI automation company focused on SMBs.
Core offer: custom Enterprise AI automation that turns manual business workflows into profit centers.
Main capabilities:
- 24/7 AI Voice Receptionist for missed calls, appointment booking, customer intent capture, and urgent query routing.
- WhatsApp Business API automation for confirmations, reminders, follow-ups, payment links, document collection, and customer updates.
- Hindi-first customer experience with English, Hindi, and Hinglish support.
- Custom dashboards and integrations for calendars, billing, EMR/LIS systems, CRMs, UPI workflows, document workflows, and business databases.
- Typical setup time is 5 business days after workflow audit and rule mapping.
Industries served:
- Healthcare and clinics: patient calls, appointment scheduling, reminders, intake, EMR sync.
- Education and academies: admission enquiries, demo class bookings, fee reminders, parent/student follow-ups.
- Personal care and wellness: slot booking, no-show reminders, repeat bookings, Google reviews, social workflows.
- Diagnostics and pathology: test booking, sample collection scheduling, report-ready notifications.
- Fitness and gyms: trial follow-ups, renewals, session scheduling, engagement.
- Legal, CA, and financial advisory: consultation booking, document intake, reminders, secure follow-up.
- Property and real estate: lead qualification, catalog sharing, property visit scheduling.
Pricing is custom based on modules, integrations, and volume. Encourage users to book a discovery call for an exact quote.
`;

const EMAIL_SYSTEM_PROMPT = `
You are an expert B2B email copywriter and outbound sales strategist.
Your job is to write high-converting email copy, follow-ups, and sequences for Seevora.
`;

const recentRequests = new Map();

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 30;
  const bucket = recentRequests.get(key) || [];
  const active = bucket.filter((timestamp) => now - timestamp < windowMs);

  if (active.length >= maxRequests) {
    return res.status(429).json({ message: 'Too many chat messages. Please try again shortly.' });
  }

  active.push(now);
  recentRequests.set(key, active);
  return next();
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item?.sender === 'user' ? 'user' : 'assistant',
      content: String(item?.text || '').slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((item) => item.content.trim());
}

function extractResponseText(payload) {
  if (payload?.content?.[0]?.text) {
    return payload.content[0].text.trim();
  }
  return '';
}

router.post('/message', rateLimit, async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: 'Anthropic key is not configured.' });
    }

    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: 'Message is too long.' });
    }

    const context = String(req.body?.context || '').trim();

    // Check if custom sales agent prompt is saved in settings
    let systemPrompt = DEFAULT_SALES_AGENT_PROMPT;
    if (context === 'email_marketing') {
      systemPrompt = EMAIL_SYSTEM_PROMPT;
    } else {
      try {
        const settingsRes = await pool.query("SELECT value FROM system_settings WHERE key = 'ai_sales_agent_prompt'");
        if (settingsRes.rowCount > 0 && settingsRes.rows[0].value) {
          systemPrompt = settingsRes.rows[0].value;
        }
      } catch (err) {
        console.warn('Could not read custom system prompt:', err.message);
      }
    }

    const maxTokens = context === 'email_marketing' ? 700 : 350;
    const history = normalizeHistory(req.body?.history);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        system: SYSTEM_PROMPT,
        messages: input,
        max_tokens: 260,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const messageText = payload?.error?.message || 'Anthropic request failed.';
      return res.status(response.status).json({ message: messageText });
    }

    const reply = payload.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ message: 'Anthropic returned an empty reply.' });
      return res.status(502).json({ message: 'AI returned an empty reply.' });
    }

    // Trigger lead parsing & CRM saving asynchronously
    if (context !== 'email_marketing') {
      extractAndSaveLead(message, history).catch(() => {});
    }

    return res.json({ reply });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ message: 'AI response timed out. Please try again.' });
    }
    return next(err);
  }
});

export default router;
