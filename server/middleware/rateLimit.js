import crypto from 'node:crypto';
import pool from '../config/db.js';

const STORE_RETRY_AFTER_SECONDS = 5;
const STORE_ERROR_LOG_INTERVAL_MS = 30_000;
const MIN_SECRET_LENGTH = 32;

let lastStoreErrorLogAt = 0;

const CONSUME_RATE_LIMIT_SQL = `
  WITH request_clock AS (
    SELECT clock_timestamp() AS now
  )
  INSERT INTO rate_limit_buckets AS bucket (
    policy,
    subject_hash,
    hit_count,
    window_started_at,
    expires_at,
    updated_at
  )
  SELECT
    $1,
    $2,
    1,
    request_clock.now,
    request_clock.now + ($3::double precision * INTERVAL '1 millisecond'),
    request_clock.now
  FROM request_clock
  ON CONFLICT (policy, subject_hash) DO UPDATE SET
    hit_count = CASE
      WHEN bucket.expires_at <= EXCLUDED.window_started_at THEN 1
      ELSE bucket.hit_count + 1
    END,
    window_started_at = CASE
      WHEN bucket.expires_at <= EXCLUDED.window_started_at THEN EXCLUDED.window_started_at
      ELSE bucket.window_started_at
    END,
    expires_at = CASE
      WHEN bucket.expires_at <= EXCLUDED.window_started_at THEN EXCLUDED.expires_at
      ELSE bucket.expires_at
    END,
    updated_at = EXCLUDED.updated_at
  RETURNING
    hit_count,
    expires_at,
    GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (expires_at - clock_timestamp())))
    )::integer AS retry_after
`;

function configuredSecret(override) {
  if (override) return String(override);

  const dedicated = String(process.env.RATE_LIMIT_KEY_SECRET || '');
  if (dedicated) return dedicated;

  if (process.env.NODE_ENV !== 'production') {
    const developmentFallback = String(process.env.JWT_SECRET || '');
    if (developmentFallback) return developmentFallback;
  }

  return '';
}

export function assertRateLimitConfiguration() {
  const secret = configuredSecret();
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`RATE_LIMIT_KEY_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
}

export function hashRateLimitSubject(policy, subject, keySecret) {
  const secret = configuredSecret(keySecret);
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error('Rate limit key secret is not configured securely.');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(`${policy}\0${String(subject)}`)
    .digest('hex');
}

export async function consumeRateLimit({
  database = pool,
  policy,
  subject,
  windowMs,
  max,
  keySecret,
}) {
  const subjectHash = hashRateLimitSubject(policy, subject, keySecret);
  const { rows } = await database.query(CONSUME_RATE_LIMIT_SQL, [policy, subjectHash, windowMs]);
  const row = rows[0];
  if (!row) throw new Error('Rate limit store returned no counter.');

  const used = Number(row.hit_count);
  const retryAfter = Math.max(1, Number(row.retry_after) || Math.ceil(windowMs / 1000));
  return {
    allowed: used <= max,
    limit: max,
    used,
    remaining: Math.max(0, max - used),
    resetTime: new Date(row.expires_at),
    retryAfter,
  };
}

function setRateLimitHeaders(res, result, windowMs) {
  res.set({
    'RateLimit-Policy': `${result.limit};w=${Math.ceil(windowMs / 1000)}`,
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(result.retryAfter),
  });
}

function defaultLimitHandler(_req, res, result) {
  res.set('Retry-After', String(result.retryAfter));
  return res.status(429).json({
    message: 'Too many requests. Please try again shortly.',
    retryAfter: result.retryAfter,
  });
}

function storeUnavailable(error, policy, req, res, next) {
  const now = Date.now();
  if (now - lastStoreErrorLogAt >= STORE_ERROR_LOG_INTERVAL_MS) {
    lastStoreErrorLogAt = now;
    console.error(JSON.stringify({
      event: 'rate_limit_store_unavailable',
      policy,
      method: req.method,
      path: req.originalUrl || req.url,
      message: error?.message || 'Unknown rate limit store error',
      timestamp: new Date(now).toISOString(),
    }));
  }

  if (res.headersSent) return next(error);
  res.set('Retry-After', String(STORE_RETRY_AFTER_SECONDS));
  return res.status(503).json({
    message: 'Rate limiting service is temporarily unavailable. Please try again shortly.',
    retryAfter: STORE_RETRY_AFTER_SECONDS,
  });
}

export function createPostgresRateLimiter({
  policy,
  windowMs = 60_000,
  max = 60,
  subject,
  skip,
  handler = defaultLimitHandler,
  database = pool,
  keySecret,
}) {
  if (!policy || typeof subject !== 'function') {
    throw new TypeError('Rate limit policy and subject resolver are required.');
  }

  return async (req, res, next) => {
    try {
      if (skip?.(req)) return next();

      const resolvedSubject = await subject(req);
      if (resolvedSubject === undefined || resolvedSubject === null || resolvedSubject === '') {
        throw new Error(`Rate limit subject is missing for policy ${policy}.`);
      }

      const result = await consumeRateLimit({
        database,
        policy,
        subject: resolvedSubject,
        windowMs,
        max,
        keySecret,
      });
      setRateLimitHeaders(res, result, windowMs);

      if (!result.allowed) return handler(req, res, result);
      return next();
    } catch (error) {
      return storeUnavailable(error, policy, req, res, next);
    }
  };
}
