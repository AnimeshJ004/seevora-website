/**
 * Generate a reply using OpenAI based on configured environment variables.
 * @param {object} params
 * @param {string} params.prompt - Direct prompt for the AI.
 * @param {string} params.systemPrompt - System prompt to configure the agent's behavior.
 * @param {Array} params.thread - Optional conversation thread for chat history.
 * @returns {Promise<string>} Generated text reply.
 */
export async function generateAIReply({ prompt, systemPrompt = '', thread = [], maxTokens = 500, context = 'chatbot' }) {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (provider === 'anthropic' && process.env.ANTHROPIC_CHATBOT_API_KEY) {
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
          model: process.env.ANTHROPIC_CHATBOT_MODEL || 'claude-3-haiku-20240307',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const resultText = payload.content?.[0]?.text || '';
        return resultText;
      } else {
        const errorText = await response.text();
        console.warn('[AI Util] Anthropic request failed:', response.status, errorText);
      }
    } catch (err) {
      console.error('[AI Util] Error calling Anthropic:', err.message);
    }
  } else if (provider === 'groq') {
    const groqKey = context === 'email' ? process.env.GROQ_EMAIL_API_KEY : process.env.GROQ_CHATBOT_API_KEY;
    const groqModel = context === 'email' ? (process.env.GROQ_EMAIL_MODEL || 'llama-3.1-8b-instant') : (process.env.GROQ_CHATBOT_MODEL || 'llama-3.1-8b-instant');
    
    if (groqKey) {
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

      const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          max_tokens: maxTokens,
          messages
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const resultText = payload.choices?.[0]?.message?.content || '';
        return resultText;
      } else {
        const errorText = await response.text();
        console.warn('[AI Util] OpenAI/Groq request failed:', response.status, errorText);
      }
    } catch (err) {
      console.error('[AI Util] Error calling OpenAI/Groq:', err.message);
    }
    }
  }

  return '';
}
