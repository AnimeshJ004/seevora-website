import crypto from 'node:crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function normalizeOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null') return '';

  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).origin;
  } catch {
    return '';
  }
}

/**
 * Given a normalized origin string, return both www and non-www variants.
 * e.g. "https://seevora.in"     → ["https://seevora.in", "https://www.seevora.in"]
 *      "https://www.seevora.in" → ["https://www.seevora.in", "https://seevora.in"]
 */
function wwwAliases(origin) {
  if (!origin) return [];
  try {
    const url = new URL(origin);
    const aliases = [origin];
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      aliases.push(url.origin);
    } else {
      url.hostname = `www.${url.hostname}`;
      aliases.push(url.origin);
    }
    return aliases;
  } catch {
    return [origin];
  }
}

function originValuesFromEnv() {
  const values = String(process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

  if (process.env.VERCEL_URL) values.push(process.env.VERCEL_URL);
  return values;
}

export function configuredOrigins() {
  const base = originValuesFromEnv()
    .map(normalizeOrigin)
    .filter(Boolean);

  // Auto-expand each entry to include both www and non-www variants
  const origins = new Set();
  for (const origin of base) {
    for (const alias of wwwAliases(origin)) {
      origins.add(alias);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    // Add explicitly, though the isTrustedOrigin check will also pass any localhost port.
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }

  return origins;
}

function requestOrigin(req) {
  const origin = String(req.get('origin') || '').trim();
  if (origin && origin !== 'null') return normalizeOrigin(origin);

  const referer = String(req.get('referer') || '').trim();
  if (!referer) return '';
  return normalizeOrigin(referer);
}

/**
 * When a reverse proxy (e.g. Nginx, Hostinger, Vercel) terminates TLS and
 * forwards the request, the Origin header is sometimes stripped or absent.
 * In that case fall back to Host / X-Forwarded-Host to determine the request
 * origin so legitimate same-site requests are never rejected.
 */
function resolveRequestOrigin(req) {
  const direct = requestOrigin(req);
  if (direct) return direct;

  // Fallback: reconstruct origin from forwarded host headers
  const forwardedHost = req.get('x-forwarded-host') || req.get('host') || '';
  if (!forwardedHost) return '';

  // Use x-forwarded-proto if available; otherwise check req.secure
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  return normalizeOrigin(`${proto}://${forwardedHost.split(',')[0].trim()}`);
}

export function hasTrustedOrigin(req) {
  const origin = resolveRequestOrigin(req);
  if (process.env.NODE_ENV !== 'production' && origin) {
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  }
  return configuredOrigins().has(origin);
}

export function isTrustedOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (process.env.NODE_ENV !== 'production' && normalized) {
    if (normalized.startsWith('http://localhost:') || normalized.startsWith('http://127.0.0.1:')) return true;
  }
  return Boolean(normalized && configuredOrigins().has(normalized));
}

export function requireTrustedOrigin(req, res, next) {
  if (!hasTrustedOrigin(req)) {
    const origin = resolveRequestOrigin(req);
    console.warn(JSON.stringify({
      event: 'csrf_origin_rejected',
      method: req.method,
      path: req.originalUrl || req.url,
      resolvedOrigin: origin || null,
      directOrigin: requestOrigin(req) || null,
      host: req.get('host') || null,
      forwardedHost: req.get('x-forwarded-host') || null,
      configuredOrigins: Array.from(configuredOrigins()),
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

export function configureTrustedProxy(app) {
  app.set('trust proxy', 'loopback');
}

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
