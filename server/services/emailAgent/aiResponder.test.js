import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../config/db.js';
import {
  getMaxReplies,
  UNSUB_KEYWORDS,
  ESCALATION_KEYWORDS,
  CONVERSION_KEYWORDS,
} from './aiResponder.js';

describe('aiResponder — getMaxReplies precedence', () => {
  let originalQuery;
  let originalEnvVal;

  before(() => {
    originalQuery = pool.query;
    originalEnvVal = process.env.MAX_AI_REPLIES_PER_THREAD;
  });

  after(() => {
    pool.query = originalQuery;
    process.env.MAX_AI_REPLIES_PER_THREAD = originalEnvVal;
  });

  it('uses system_settings value when set in DB', async () => {
    pool.query = async (text, params) => {
      if (text.includes('system_settings') && text.includes('max_ai_replies_per_thread')) {
        return { rows: [{ value: '8' }] };
      }
      return { rows: [] };
    };

    const max = await getMaxReplies();
    assert.equal(max, 8);
  });

  it('falls back to environment variable when system_settings is not set in DB', async () => {
    pool.query = async (text, params) => {
      return { rows: [] }; // no settings found
    };
    process.env.MAX_AI_REPLIES_PER_THREAD = '12';

    const max = await getMaxReplies();
    assert.equal(max, 12);
  });

  it('defaults to 5 when neither DB settings nor env variable are set', async () => {
    pool.query = async (text, params) => {
      return { rows: [] };
    };
    delete process.env.MAX_AI_REPLIES_PER_THREAD;

    const max = await getMaxReplies();
    assert.equal(max, 5);
  });

  it('ignores invalid DB setting and falls back to env variable', async () => {
    pool.query = async (text, params) => {
      if (text.includes('system_settings')) {
        return { rows: [{ value: 'invalid_number' }] };
      }
      return { rows: [] };
    };
    process.env.MAX_AI_REPLIES_PER_THREAD = '15';

    const max = await getMaxReplies();
    assert.equal(max, 15);
  });

  it('ignores invalid env variable and falls back to default 5', async () => {
    pool.query = async (text, params) => {
      return { rows: [] };
    };
    process.env.MAX_AI_REPLIES_PER_THREAD = 'invalid_env';

    const max = await getMaxReplies();
    assert.equal(max, 5);
  });
});

describe('aiResponder — keyword detection lists', () => {
  const checkPhrase = (text, keywords) => {
    const textLower = text.toLowerCase();
    return keywords.some(kw => textLower.includes(kw));
  };

  describe('escalation keywords', () => {
    const phrases = [
      'speak to a human',
      'talk to a person',
      'human agent',
      'real person',
      'contact a representative',
    ];

    phrases.forEach(phrase => {
      it(`should detect phrase: "${phrase}"`, () => {
        assert.ok(checkPhrase(phrase, ESCALATION_KEYWORDS));
        assert.ok(checkPhrase(`Please let me ${phrase} immediately.`, ESCALATION_KEYWORDS));
        assert.ok(checkPhrase(`I want to ${phrase.toUpperCase()}`, ESCALATION_KEYWORDS));
      });
    });
  });

  describe('unsubscribe keywords', () => {
    const phrases = [
      'unsubscribe',
      'stop emails',
      'remove me',
      'opt out',
    ];

    phrases.forEach(phrase => {
      it(`should detect phrase: "${phrase}"`, () => {
        assert.ok(checkPhrase(phrase, UNSUB_KEYWORDS));
        assert.ok(checkPhrase(`Please ${phrase} from this list.`, UNSUB_KEYWORDS));
        assert.ok(checkPhrase(`I would like to ${phrase.toUpperCase()}`, UNSUB_KEYWORDS));
      });
    });
  });

  describe('conversion keywords', () => {
    const phrases = [
      'book a call',
      'schedule a meeting',
      'interested in your services',
      'want to know more',
    ];

    phrases.forEach(phrase => {
      it(`should detect phrase: "${phrase}"`, () => {
        assert.ok(checkPhrase(phrase, CONVERSION_KEYWORDS));
        assert.ok(checkPhrase(`I want to ${phrase}.`, CONVERSION_KEYWORDS));
        assert.ok(checkPhrase(`We are ${phrase.toUpperCase()}`, CONVERSION_KEYWORDS));
      });
    });
  });
});
