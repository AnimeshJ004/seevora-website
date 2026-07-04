import express from 'express';
import pool from '../config/db.js';
import crypto from 'crypto';

const router = express.Router();

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 12;

const DEFAULT_SALES_AGENT_PROMPT = `
You are Seevora's Elite AI Sales Agent. Your primary mission is to generate and convert high-quality leads for Seevora Private Limited.

About Seevora:
Seevora is an AI automation agency for SMBs. We build:
1. 24/7 AI Voice Receptionists (captures intent, books appointments, handles missed calls).
2. WhatsApp API Automation (reminders, confirmations, UPI payment links, document collection).
3. Custom dashboards and databases.
Setup time is 5 business days.

Your Sales Strategy:
- Always maintain a professional, consultative, sales-oriented tone.
- Actively guide the user through the sales funnel.
- Recommend specific Seevora services based on what business they run (e.g. clinics need voice/appointment scheduling, CAs need document collection and WhatsApp reminders, Salons need no-show reductions).
- Qualify prospects by politely asking about their business:
  1. What industry or business do they run?
  2. What is their main manual bottleneck (missed calls, follow-ups, documents)?
  3. Their Name and Contact details (Email / Phone).
- Encourage booking a free AI Growth Consultation or demo.
- If they ask complex technical integration or contract questions, capture their contact info and say: "I will escalate this query to our senior integration engineer who will reach out to you within 2 hours."
- Never act as a general assistant. If they ask about unrelated tasks (e.g. writing essays, weather), politely redirect them to how Seevora AI can help automate their business.
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

async function extractAndSaveLead(message, history) {
  if (!process.env.OPENAI_API_KEY) return;

  try {
    const chatLog = [...history, { role: 'user', content: message }]
      .map(h => `${h.role === 'user' ? 'Customer' : 'Sales Agent'}: ${h.content}`)
      .join('\n');

    const extractionPrompt = `
Analyze the chat transcript between a Customer and our Sales Agent.
If the customer has provided contact information (like name, email, phone, company, or industry), extract it.
Also extract their business requirements or what they want to automate in the "notes" field.

Return a JSON object with these keys:
{
  "name": "Full Name (string or null)",
  "email": "Email Address (string or null)",
  "phone": "Phone Number (string or null)",
  "company": "Company Name (string or null)",
  "industry": "Industry Type e.g. Healthcare, Salon, Legal (string or null)",
  "notes": "What they want to automate / requirements (string or null)"
}

Only return the JSON. If no contact information is present, return null.
Transcript:
${chatLog}
`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: extractionPrompt }],
        max_tokens: 250,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) return;
    const payload = await response.json();
    const data = JSON.parse(payload.choices[0].message.content || '{}');

    if (data && (data.name || data.email || data.phone)) {
      // Check if lead already exists
      let existingLead = null;
      if (data.email) {
        const check = await pool.query('SELECT * FROM leads WHERE LOWER(email) = LOWER($1)', [data.email]);
        existingLead = check.rows[0];
      } else if (data.phone) {
        const check = await pool.query('SELECT * FROM leads WHERE phone = $1', [data.phone]);
        existingLead = check.rows[0];
      }

      if (existingLead) {
        const mergedNotes = [existingLead.notes, data.notes].filter(Boolean).join('\n\n');
        await pool.query(
          `UPDATE leads SET
             name = COALESCE($2, name),
             company = COALESCE($3, company),
             industry = COALESCE($4, industry),
             notes = $5,
             score = GREATEST(score, 80),
             updated_at = NOW()
           WHERE id = $1`,
          [existingLead.id, data.name, data.company, data.industry, mergedNotes]
        );
        console.log(`[AI Sales Agent] Updated existing lead: ${existingLead.id}`);
      } else {
        const leadId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO leads (id, name, email, phone, company, industry, source, pipeline_stage, score, notes)
           VALUES ($1, $2, $3, $4, $5, $6, 'website', 'new', 75, $7)`,
          [
            leadId,
            data.name || 'Anonymous Prospect',
            data.email || null,
            data.phone || null,
            data.company || null,
            data.industry || null,
            data.notes || 'Interested via chat chatbot.'
          ]
        );
        console.log(`[AI Sales Agent] Created new qualified lead from chat: ${leadId}`);
      }
    }
  } catch (err) {
    console.error('[AI Sales Agent] Lead extraction failed:', err.message);
  }
}

router.post('/message', rateLimit, async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: 'OpenAI key is not configured.' });
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

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      return res.status(response.status).json({ message: errPayload?.error?.message || 'AI request failed.' });
    }

    const payload = await response.json();
    const reply = payload.choices?.[0]?.message?.content?.trim();

    if (!reply) {
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
