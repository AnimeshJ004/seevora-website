import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate a reply using Anthropic, OpenAI, or Gemini based on configured environment variables.
 * @param {object} params
 * @param {string} params.prompt - Direct prompt for the AI.
 * @param {string} params.systemPrompt - System prompt to configure the agent's behavior.
 * @param {Array} params.thread - Optional conversation thread for chat history.
 * @returns {Promise<string>} Generated text reply.
 */
export async function generateAIReply({ prompt, systemPrompt = '', thread = [], maxTokens = 500 }) {
  // 1. ANTHROPIC CLAUDE SUPPORT
  if (process.env.ANTHROPIC_API_KEY) {
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
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages
        })
      });

      if (response.ok) {
        const payload = await response.json();
        return payload.content?.[0]?.text || '';
      } else {
        console.warn('[AI Util] Anthropic request failed:', await response.text());
      }
    } catch (err) {
      console.error('[AI Util] Error calling Anthropic:', err.message);
    }
  }

  // 2. OPENAI SUPPORT
  if (process.env.OPENAI_API_KEY) {
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          max_completion_tokens: maxTokens,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const payload = await response.json();
        return payload.choices?.[0]?.message?.content || '';
      } else {
        console.warn('[AI Util] OpenAI request failed:', await response.text());
      }
    } catch (err) {
      console.error('[AI Util] Error calling OpenAI:', err.message);
    }
  }

  // 3. GEMINI SUPPORT
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_key_if_not_provided') {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      let fullPrompt = systemPrompt ? `${systemPrompt}\n\n` : '';
      if (thread.length > 0) {
        fullPrompt += `History:\n${thread.map(t => `${t.sender}: ${t.text}`).join('\n')}\n\n`;
      }
      if (prompt) {
        fullPrompt += `User request: ${prompt}`;
      }

      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (err) {
      console.error('[AI Util] Gemini request failed:', err.message);
    }
  }

  return '';
}
