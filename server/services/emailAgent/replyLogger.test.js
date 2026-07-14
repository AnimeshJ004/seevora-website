import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { detectModelUsed } from './replyLogger.js';

describe('replyLogger — detectModelUsed precedence', () => {
  let originalEmailApiKey;

  before(() => {
    originalEmailApiKey = process.env.OPENAI_EMAIL_API_KEY;
  });

  after(() => {
    process.env.OPENAI_EMAIL_API_KEY = originalEmailApiKey;
  });

  it("returns configured model when OPENAI_EMAIL_API_KEY is set", () => {
    process.env.OPENAI_EMAIL_API_KEY = 'sk-proj-123';

    const model = detectModelUsed();
    assert.equal(model, process.env.OPENAI_EMAIL_MODEL || 'gpt-4o-mini');
  });

  it("returns null when OPENAI_EMAIL_API_KEY is not set", () => {
    delete process.env.OPENAI_EMAIL_API_KEY;

    const model = detectModelUsed();
    assert.equal(model, null);
  });
});
