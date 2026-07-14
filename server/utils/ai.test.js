import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { generateAIReply } from './ai.js';
import { clearAllCache, getCacheStats } from './cache.js';

const originalFetch = globalThis.fetch;
const originalProvider = process.env.AI_PROVIDER;
const originalGroqKey = process.env.GROQ_CHATBOT_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalProvider === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = originalProvider;
  if (originalGroqKey === undefined) delete process.env.GROQ_CHATBOT_API_KEY;
  else process.env.GROQ_CHATBOT_API_KEY = originalGroqKey;
  clearAllCache();
});

describe('AI response privacy', () => {
  it('does not retain generated conversation replies in the application cache', async () => {
    process.env.AI_PROVIDER = 'groq';
    process.env.GROQ_CHATBOT_API_KEY = 'test-key';
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return {
        ok: true,
        async json() {
          return { choices: [{ message: { content: 'Private generated reply' } }] };
        },
      };
    };

    const input = {
      prompt: 'My private customer question',
      systemPrompt: 'Help the customer.',
      thread: [{ sender: 'user', text: 'Private conversation history' }],
    };
    assert.equal(await generateAIReply(input), 'Private generated reply');
    assert.equal(await generateAIReply(input), 'Private generated reply');
    assert.equal(calls, 2);
    assert.equal(getCacheStats().keys, 0);
  });
});
