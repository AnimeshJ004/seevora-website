import crypto from 'crypto';
import { getCache, setCache } from './cache.js';

/**
 * Generate a reply using Anthropic based on configured environment variables.
 * @param {object} params
 * @param {string} params.prompt - Direct prompt for the AI.
 * @param {string} params.systemPrompt - System prompt to configure the agent's behavior.
 * @param {Array} params.thread - Optional conversation thread for chat history.
 * @returns {Promise<string>} Generated text reply.
 */
export async function generateAIReply({ prompt, systemPrompt = '', thread = [], maxTokens = 500 }) {
  const payloadStr = JSON.stringify({ prompt, systemPrompt, thread, maxTokens });
  const hash = crypto.createHash('sha256').update(payloadStr).digest('hex');
  const cacheKey = `ai_reply_${hash}`;
  
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // 1. ANTHROPIC CLAUDE SUPPORT (Chatbot)
  if (process.env.ANTHROPIC_CHATBOT_API_KEY) {
    try {
      const messages = [];
      const historySlice = thread.slice(-10);
      for (const msg of historySlice) {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      }
      if (prompt) {
        messages.push({ role: 'user', content: prompt });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_CHATBOT_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_CHATBOT_MODEL || 'claude-haiku-4-5',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const resultText = payload.content?.[0]?.text || '';
        if (resultText) setCache(cacheKey, resultText, 3600 * 24); // Cache for 24 hours
        return resultText;
      } else {
        console.warn('[AI Util] Anthropic request failed:', await response.text());
      }
    } catch (err) {
      console.error('[AI Util] Error calling Anthropic:', err.message);
    }
  }

  return '';
}
