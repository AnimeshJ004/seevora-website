import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { detectModelUsed } from './replyLogger.js';

describe('replyLogger — detectModelUsed precedence', () => {
  let originalEmailApiKey;

  before(() => {
    originalEmailApiKey = process.env.ANTHROPIC_EMAIL_API_KEY;
  });

  after(() => {
    process.env.ANTHROPIC_EMAIL_API_KEY = originalEmailApiKey;
  });

  it("returns configured model when ANTHROPIC_EMAIL_API_KEY is set", () => {
    process.env.ANTHROPIC_EMAIL_API_KEY = 'sk-ant-123';

    const model = detectModelUsed();
    assert.equal(model, process.env.ANTHROPIC_EMAIL_MODEL || 'claude-haiku-4-5');
  });

  it("returns null when ANTHROPIC_EMAIL_API_KEY is not set", () => {
    delete process.env.ANTHROPIC_EMAIL_API_KEY;

    const model = detectModelUsed();
    assert.equal(model, null);
  });
});
