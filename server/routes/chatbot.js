import express from 'express';

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

const SYSTEM_PROMPT = `
You are Seevora AI, the friendly website chatbot for Seevora.
Use the company context to answer questions clearly and conversationally.
Tone: warm, helpful, concise, professional, and lightly Indian-market aware.
You may use English, Hindi, or Hinglish if the user does.
Keep answers under 120 words unless the user asks for detail.
Do not invent exact prices, client names, legal guarantees, or unsupported claims.
If asked for a quote, complex implementation, partnership, or account-specific request, suggest booking a discovery call.
If the user asks unrelated questions, answer briefly if harmless, then connect back to how Seevora may help when appropriate.

Company context:
${COMPANY_CONTEXT}
`;

const recentRequests = new Map();

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 20;
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

    const input = [
      ...normalizeHistory(req.body?.history),
      { role: 'user', content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18_000);

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

    const reply = extractResponseText(payload);
    if (!reply) {
      return res.status(502).json({ message: 'Anthropic returned an empty reply.' });
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
