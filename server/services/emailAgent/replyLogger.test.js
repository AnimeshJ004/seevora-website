import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { detectModelUsed } from './replyLogger.js';

describe('replyLogger — detectModelUsed precedence', () => {
  let originalEmailApiKey;

  beforeEach(() => {
    originalEmailApiKey = process.env.GROQ_EMAIL_API_KEY;
    delete process.env.GROQ_EMAIL_API_KEY;
  });

  afterEach(() => {
    process.env.GROQ_EMAIL_API_KEY = originalEmailApiKey;
  });

  it("returns configured model when GROQ_EMAIL_API_KEY is set", () => {
    process.env.GROQ_EMAIL_API_KEY = 'sk-groq-123';
    process.env.AI_PROVIDER = 'groq';
    const model = detectModelUsed();
    assert.equal(model, process.env.GROQ_EMAIL_MODEL || 'llama-3.1-8b-instant');
  });

  it("returns null when GROQ_EMAIL_API_KEY is not set", () => {
    delete process.env.GROQ_EMAIL_API_KEY;
    process.env.AI_PROVIDER = 'groq';
    const model = detectModelUsed();
    assert.equal(model, null);
  });
});
