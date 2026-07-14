import crypto from 'crypto';

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

  const salt = process.env.ANALYTICS_SALT || 'fallback_default_salt_2026';

  return crypto
    .createHmac('sha256', salt)
    .update(value.trim())
    .digest('hex');
}
