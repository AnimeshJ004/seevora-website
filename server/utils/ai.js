import crypto from 'crypto';
import { getCache, setCache } from './cache.js';

/**
 * Generate a reply using Google Gemini based on configured environment variables.
 * @param {object} params
 * @param {string} params.prompt        - Direct prompt for the AI.
 * @param {string} params.systemPrompt  - System prompt to configure the agent's behavior.
 * @param {Array}  params.thread        - Optional conversation thread for chat history.
 * @param {number} params.maxTokens     - Maximum output tokens.
 * @param {string} [params.apiKey]      - Override API key (e.g. email-specific key). Falls back to GEMINI_API_KEY.
 * @param {string} [params.model]       - Override model. Falls back to GEMINI_MODEL or gemini-2.0-flash.
 * @returns {Promise<string>} Generated text reply.
 */
export async function generateAIReply({
  prompt,
  systemPrompt = '',
  thread = [],
  maxTokens = 500,
  apiKey,
  model,
}) {
  const payloadStr = JSON.stringify({ prompt, systemPrompt, thread, maxTokens, apiKey, model });
  const hash = crypto.createHash('sha256').update(payloadStr).digest('hex');
  const cacheKey = `ai_reply_${hash}`;

  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Resolve key + model (caller override → env fallback)
  const resolvedKey   = apiKey  || process.env.GEMINI_API_KEY;
  const resolvedModel = model   || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!resolvedKey) {
    console.error('[AI Util] No Gemini API key found. Set GEMINI_API_KEY (or pass apiKey).');
    return '';
  }

  try {
    // Build the conversation history in Gemini's "contents" format
    const contents = [];

    const historySlice = thread.slice(-10);
    for (const msg of historySlice) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    if (prompt) {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    const body = {
      contents,
      generationConfig: { maxOutputTokens: maxTokens },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${resolvedKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const payload = await response.json();
      const resultText = payload.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (resultText) setCache(cacheKey, resultText, 3600 * 24); // cache 24 h
      return resultText;
    } else {
      const errText = await response.text();
      console.warn('[AI Util] Gemini request failed:', errText);
    }
  } catch (err) {
    console.error('[AI Util] Error calling Gemini:', err.message);
  }

  return '';
}
