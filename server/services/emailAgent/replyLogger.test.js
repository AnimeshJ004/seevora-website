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

  it("returns 'gpt-4o-mini' when only OPENAI_API_KEY is set (and ANTHROPIC_API_KEY is missing)", () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-proj-123';
    process.env.GEMINI_API_KEY = 'AIzaSy123';

    const model = detectModelUsed();
    assert.equal(model, 'gpt-4o-mini');
  });

  it("returns 'gemini-1.5-flash' when only GEMINI_API_KEY is set (and both ANTHROPIC_API_KEY and OPENAI_API_KEY are missing)", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = 'AIzaSy123';

    const model = detectModelUsed();
    assert.equal(model, 'gemini-1.5-flash');
  });

  it('returns null when no API keys are set', () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const model = detectModelUsed();
    assert.equal(model, null);
  });
});
