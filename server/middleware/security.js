import crypto from 'node:crypto';

const buckets = new Map();
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function configuredOrigins() {
  const origins = new Set(
    String(process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }

  return origins;
}

function requestOrigin(req) {
  const origin = String(req.get('origin') || '').trim();
  if (origin && origin !== 'null') return origin;

  const referer = String(req.get('referer') || '').trim();
  if (!referer) return '';
  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}

export function hasTrustedOrigin(req) {
  return configuredOrigins().has(requestOrigin(req));
}

export function requireTrustedOrigin(req, res, next) {
  if (!hasTrustedOrigin(req)) {
    console.warn(JSON.stringify({
      event: 'csrf_origin_rejected',
      method: req.method,
      path: req.originalUrl || req.url,
      timestamp: new Date().toISOString(),
    }));
    return res.status(403).json({ message: 'Request origin could not be verified.' });
  }
  return next();
}

export function validateAuthenticatedCsrf(req, session) {
  if (SAFE_METHODS.has(String(req.method || 'GET').toUpperCase())) {
    return { valid: true };
  }

  if (!hasTrustedOrigin(req)) return { valid: false, reason: 'origin' };

  const expected = Buffer.from(String(session?.csrfToken || ''));
  const supplied = Buffer.from(String(req.get('x-csrf-token') || ''));
  if (!expected.length || expected.length !== supplied.length) {
    return { valid: false, reason: 'token' };
  }

  return crypto.timingSafeEqual(expected, supplied)
    ? { valid: true }
    : { valid: false, reason: 'token' };
}

function getClientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function createRateLimiter({ windowMs = 60_000, max = 60, keyPrefix = 'global' } = {}) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${getClientKey(req)}`;
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now - entry.startedAt >= windowMs) {
      buckets.set(key, { count: 1, startedAt: now });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((windowMs - (now - entry.startedAt)) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        message: 'Too many requests. Please try again shortly.',
        retryAfter,
      });
    }

    entry.count += 1;
    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now - entry.startedAt > 60 * 60 * 1000) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

export function securityHeaders(req, res, next) {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;

  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });

  if (process.env.NODE_ENV === 'production') {
    res.set('Content-Security-Policy', [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      'upgrade-insecure-requests',
    ].join('; '));
  }

  if (req.secure || req.get('x-forwarded-proto') === 'https') {
    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  return next();
}
