import pool from '../../config/db.js';
import { generateAIReply } from '../../utils/ai.js';

// Cache the system prompt in memory to avoid repeated DB queries
let cachedSystemPrompt = null;
let promptCachedAt = null;
const PROMPT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch the system prompt from the database (with in-memory caching).
 * @returns {Promise<string>}
 */
async function getSystemPrompt() {
  const now = Date.now();
  if (cachedSystemPrompt && promptCachedAt && now - promptCachedAt < PROMPT_CACHE_TTL_MS) {
    return cachedSystemPrompt;
  }

  try {
    const { rows } = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'ai_sales_agent_prompt' LIMIT 1`
    );
    if (rows.length > 0) {
      cachedSystemPrompt = rows[0].value;
      promptCachedAt = now;
      return cachedSystemPrompt;
    }
  } catch (err) {
    console.error('[ResponseGenerator] Failed to load system prompt:', err.message);
  }

  // Fallback minimal prompt
  return `You are a helpful AI Sales Agent for Seevora, an Indian AI automation company. Help visitors learn about our services and book consultations. Keep responses concise and professional.`;
}

/**
 * Invalidate the system prompt cache so next call fetches fresh from DB.
 */
export function invalidatePromptCache() {
  cachedSystemPrompt = null;
  promptCachedAt = null;
}

/**
 * Generate an AI response for the given user message and conversation context.
 * @param {object} opts
 * @param {string} opts.userMessage - The current user message
 * @param {Array<{sender: string, message_text: string}>} opts.history - Last N messages
 * @param {number} [opts.timeoutMs=5000] - Timeout in milliseconds (default 5 seconds as per requirements)
 * @returns {Promise<string>} The AI-generated response
 */
export async function generateResponse({ userMessage, history = [], timeoutMs = 5000 }) {
  const systemPrompt = await getSystemPrompt();

  // Build thread in the format expected by generateAIReply
  const thread = history.map(msg => ({
    sender: msg.sender === 'agent' ? 'assistant' : 'user',
    text: msg.message_text,
  }));

  // Race the AI call against a timeout
  const aiPromise = generateAIReply({
    prompt: userMessage,
    systemPrompt,
    thread,
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs)
  );

  let response = '';
  try {
    response = await Promise.race([aiPromise, timeoutPromise]);
  } catch (err) {
    if (err.message === 'AI_TIMEOUT') {
      throw err; // propagate timeout specifically
    }
    // Retry once on network errors
    console.warn('[ResponseGenerator] First attempt failed, retrying:', err.message);
    try {
      response = await Promise.race([
        generateAIReply({ prompt: userMessage, systemPrompt, thread }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs)),
      ]);
    } catch (retryErr) {
      throw retryErr;
    }
  }

  return response || "I'm having trouble responding right now. Please try again in a moment, or contact us directly at contact@seevora.in.";
}

/**
 * Detect whether the AI response contains a lead capture signal.
 * Heuristic: check for lead capture keywords or intent phrases.
 * @param {string} responseText
 * @param {string} userMessage
 * @returns {boolean}
 */
export function shouldOfferLeadCapture(responseText, userMessage) {
  const combined = `${responseText} ${userMessage}`.toLowerCase();
  const triggers = [
    'consultation', 'contact', 'get in touch', 'reach out', 'book',
    'schedule', 'demo', 'pricing', 'quote', 'implementation',
    'interested in', 'tell me more', 'sign up',
  ];
  return triggers.some(t => combined.includes(t));
}

/**
 * Extract service keywords mentioned in a text.
 * @param {string} text
 * @returns {string[]}
 */
export function extractMentionedServices(text) {
  const lower = text.toLowerCase();
  const services = [];
  if (lower.includes('voice') || lower.includes('receptionist')) services.push('AI Voice Receptionist');
  if (lower.includes('whatsapp')) services.push('WhatsApp Automation');
  if (lower.includes('hindi') || lower.includes('hinglish') || lower.includes('multilingual')) services.push('Multi-language Support');
  if (lower.includes('integrat') || lower.includes('crm') || lower.includes('calendar')) services.push('Custom Integrations');
  if (lower.includes('payroll') || lower.includes('billing')) services.push('Billing Integration');
  return [...new Set(services)];
}
