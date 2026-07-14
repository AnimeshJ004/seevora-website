import express from 'express';
import { generateAIReply } from '../utils/ai.js';
import { getSalesSystemPrompt } from '../services/ai/systemPromptCache.js';

const router = express.Router();

const MAX_MESSAGE_LENGTH = 900;
const MAX_HISTORY_ITEMS = 10;

// ─────────────────────────────────────────────────────────────────────────────
// SEEVORA MASTER SYSTEM PROMPT
// Covers: Seevora products, sales, business strategy, AI concepts, general help
// ─────────────────────────────────────────────────────────────────────────────
const SEEVORA_SYSTEM_PROMPT = `
You are Seevora AI — an intelligent business advisor, AI automation expert, and friendly assistant for Seevora Private Limited's website.

ABOUT SEEVORA:
Seevora Private Limited is an Indian enterprise AI automation company that turns manual business workflows into revenue-generating profit centers. We serve Indian SMBs across healthcare, education, legal, fitness, retail, diagnostics, and real estate sectors.

SEEVORA PRODUCTS & SERVICES:
- 24/7 AI Voice Receptionist: Answers every missed call, captures customer intent, books appointments, routes urgent queries — even outside business hours
- WhatsApp Business API Automation: Automated confirmations, reminders, payment links (UPI), document collection, follow-ups in customer's preferred language
- Hindi-First AI: Fluent in English, Hindi, and Hinglish — naturally matches the local customer's language
- Custom Dashboards & Integrations: CRM, EMR/LIS systems, billing platforms, calendars, document workflows, Google Reviews automation
- Multi-Agent AI Systems: Multiple specialized AI agents working together to automate the entire customer journey
- Setup: 5 business days after workflow audit and rule mapping
- Pricing: Custom based on modules and volume — encourage discovery call for exact quote
- Impact: Customers typically see 30-50% reduction in no-shows and 40% reduction in operating costs within 90 days

INDUSTRIES SERVED:
- Clinics & Healthcare: patient call handling, appointment booking, reminders, EMR sync, intake automation
- Education & Academies: admission inquiries, demo class bookings, fee reminders, parent follow-ups
- Salons & Personal Care: slot booking, WhatsApp reminders, no-show prevention, Google reviews
- Diagnostics & Pathology: test booking, sample collection scheduling, report notifications
- Fitness & Gyms: trial follow-ups, membership renewals, session scheduling
- CA, Legal & Financial Advisors: consultation booking, document intake, UPI reminders, secure follow-up
- Real Estate: lead qualification, property catalog sharing, site visit scheduling

YOUR ROLE & CAPABILITIES:
You can answer questions about:
1. Seevora's products, services, pricing, setup, and use cases
2. AI and automation concepts: how LLMs work, what AI agents are, voice AI, chatbots, NLP, automation ROI
3. Sales strategy: B2B sales, lead generation, follow-up sequences, cold outreach, client retention, sales funnel
4. Business operations: workflow optimization, cost reduction, team productivity, SOPs, scaling SMBs
5. Technology: CRM systems, WhatsApp Business API, VoIP, integrations, APIs, cloud tools
6. General helpful questions: any business, entrepreneurship, or professional topic
7. Casual conversation: greetings, how-are-you, general chat — be warm and human

PERSONALITY & RULES:
- Be helpful, knowledgeable, warm, and professional — like a smart business advisor friend
- Keep answers concise (2-4 sentences) unless the user clearly wants detail
- Match the user's language: if they write in Hindi or Hinglish, respond the same way naturally
- Only suggest booking a discovery call when the user shows clear buying intent or asks about pricing/implementation — NOT on every message
- Never say "I don't know" — always give useful context, explain concepts, or redirect helpfully
- If asked something unrelated to business or Seevora, still be helpful and answer naturally
- Connect general topics back to Seevora's value when it's natural, but don't force it
- Be conversational, not scripted — avoid robotic, templated-sounding responses
- When mentioning specific prices, always say pricing is custom and suggest a discovery call
`;

const EMAIL_SYSTEM_PROMPT = `
You are an expert B2B email copywriter and outbound sales strategist for Seevora Private Limited, an Indian AI automation company.
Your job is to write high-converting email copy, follow-up sequences, and cold outreach campaigns.
Focus on Indian SMB market language, pain points around missed calls, manual workflows, and business automation ROI.
Keep emails concise, personalized, and action-oriented. Always include a clear CTA.
`;

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      sender: item?.sender === 'user' ? 'user' : 'assistant',
      text: String(item?.text || '').slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((item) => item.text.trim());
}

async function getSystemPrompt(context) {
  return context === 'email_marketing'
    ? EMAIL_SYSTEM_PROMPT
    : getSalesSystemPrompt(SEEVORA_SYSTEM_PROMPT);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /message  — Main chat endpoint
// ─────────────────────────────────────────────────────────────────────────────
router.post('/message', rateLimit, async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: 'Message is too long.' });
    }

    const context = String(req.body?.context || '').trim();
    const history = normalizeHistory(req.body?.history);
    const maxTokens = context === 'email_marketing' ? 700 : 400;

    // Get the appropriate system prompt (DB custom → master fallback)
    const systemPrompt = await getSystemPrompt(context);

    // Delegate to the ai.js utility — supports OpenAI, Gemini
    const reply = await generateAIReply({
      prompt: message,
      systemPrompt,
      thread: history,
      maxTokens,
    });

    if (!reply) {
      return res.status(502).json({ message: 'AI returned an empty reply. Please try again.' });
    }

    return res.json({ reply });
  } catch (err) {
    if (err?.name === 'AbortError' || err?.message === 'AI_TIMEOUT') {
      return res.status(504).json({ message: 'AI response timed out. Please try again.' });
    }
    console.error('[Chatbot] Unexpected error:', err.message);
    return next(err);
  }
});

export default router;
