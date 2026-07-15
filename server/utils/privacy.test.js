import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { anonymizeMetadata, assertPrivacyConfiguration } from './privacy.js';

describe('privacy utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null for empty or invalid inputs', () => {
    assert.equal(anonymizeMetadata(null), null);
    assert.equal(anonymizeMetadata(undefined), null);
    assert.equal(anonymizeMetadata(''), null);
    assert.equal(anonymizeMetadata('   '), null);
    assert.equal(anonymizeMetadata(123), null);
  });

  it('should hash a valid string consistently', () => {
    process.env.ANALYTICS_SALT = 'test-salt-that-is-long-enough';
    const input = '192.168.1.1';
    
    const hash1 = anonymizeMetadata(input);
    const hash2 = anonymizeMetadata(input);
    
    assert.notEqual(hash1, null);
    assert.equal(hash1.length, 64);
    assert.equal(hash1, hash2);
    assert.notEqual(hash1, input);
  });

  it('should hash differently with a different salt', () => {
    const input = '192.168.1.1';

    process.env.ANALYTICS_SALT = 'salt-1-that-is-long-enough-ok';
    const hash1 = anonymizeMetadata(input);

    process.env.ANALYTICS_SALT = 'salt-2-that-is-long-enough-ok';
    const hash2 = anonymizeMetadata(input);

    assert.notEqual(hash1, hash2);
  });

  describe('assertPrivacyConfiguration', () => {
    it('should not throw when ANALYTICS_SALT is set and long enough', () => {
      process.env.ANALYTICS_SALT = 'a-strong-salt-that-is-32-chars!!';
      assert.doesNotThrow(() => assertPrivacyConfiguration());
    });

    it('should throw in production when ANALYTICS_SALT is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ANALYTICS_SALT;
      assert.throws(
        () => assertPrivacyConfiguration(),
        /ANALYTICS_SALT must be at least/
      );
    });

    it('should throw in production when ANALYTICS_SALT is too short', () => {
      process.env.NODE_ENV = 'production';
      process.env.ANALYTICS_SALT = 'tooshort';
      assert.throws(
        () => assertPrivacyConfiguration(),
        /ANALYTICS_SALT must be at least/
      );
    });

    it('should not throw in development when ANALYTICS_SALT is missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.ANALYTICS_SALT;
      assert.doesNotThrow(() => assertPrivacyConfiguration());
    });
  });
});
