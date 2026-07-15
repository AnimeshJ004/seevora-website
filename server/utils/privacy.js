import crypto from 'crypto';

const MIN_SALT_LENGTH = 16;

/**
 * Assert that ANALYTICS_SALT is configured securely.
 * - In production: throws an error if the salt is missing or too short, preventing server start.
 * - In development: logs a warning and allows the server to continue with a fallback.
 */
export function assertPrivacyConfiguration() {
  const salt = String(process.env.ANALYTICS_SALT || '');
  if (salt.length >= MIN_SALT_LENGTH) return;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `ANALYTICS_SALT must be at least ${MIN_SALT_LENGTH} characters in production. ` +
      'Set a strong random value in your environment variables.'
    );
  }

  console.warn(
    '[Privacy] ⚠️  ANALYTICS_SALT is not set or too short. ' +
    'IP addresses and User-Agents will be anonymized with an insecure fallback salt. ' +
    'Set ANALYTICS_SALT in your .env file before deploying to production.'
  );
}

/**
 * Anonymizes metadata using HMAC-SHA256 with a secret salt.
 * Ensures privacy for fields like IP address and User-Agent while
 * maintaining consistency for rate limiting and analytics.
 *
 * @param {string} value - The string to hash
 * @returns {string|null} The hashed hex string, or null if input is empty
 */
export function anonymizeMetadata(value) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const salt = String(process.env.ANALYTICS_SALT || '');

  if (salt.length < MIN_SALT_LENGTH) {
    if (process.env.NODE_ENV === 'production') {
      // Should never reach here if assertPrivacyConfiguration() was called at startup,
      // but guard defensively anyway.
      throw new Error('ANALYTICS_SALT is not configured. Cannot anonymize metadata in production.');
    }
    // Development-only fallback — clearly unsafe, warns at startup
    return crypto
      .createHmac('sha256', 'dev_fallback_salt_do_not_use_in_production')
      .update(value.trim())
      .digest('hex');
  }

  return crypto
    .createHmac('sha256', salt)
    .update(value.trim())
    .digest('hex');
}
