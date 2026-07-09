import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { detectModelUsed } from './replyLogger.js';

describe('replyLogger — detectModelUsed precedence', () => {
  let originalAnthropic;
  let originalOpenai;
  let originalGemini;

  before(() => {
    originalAnthropic = process.env.ANTHROPIC_API_KEY;
    originalOpenai = process.env.OPENAI_API_KEY;
    originalGemini = process.env.GEMINI_API_KEY;
  });

  after(() => {
    process.env.ANTHROPIC_API_KEY = originalAnthropic;
    process.env.OPENAI_API_KEY = originalOpenai;
    process.env.GEMINI_API_KEY = originalGemini;
  });

  it("returns 'claude-3-5-sonnet-20241022' when ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-123';
    process.env.OPENAI_API_KEY = 'sk-proj-123';
    process.env.GEMINI_API_KEY = 'AIzaSy123';

    const model = detectModelUsed();
    assert.equal(model, 'claude-3-5-sonnet-20241022');
  });



});
