/**
 * In-memory rate limiter for the AI Sales Agent chat.
 * Tracks message counts per session per minute.
 */

const RATE_LIMIT = 20; // messages per minute
const WINDOW_MS = 60 * 1000; // 1 minute

// Map<sessionId, { count: number, windowStart: number }>
const requestMap = new Map();

// Clean up old entries every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestMap.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 2) {
      requestMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
cleanupInterval.unref?.();

/**
 * Check if the given session is rate-limited.
 * @param {string} sessionId - The public session_id string
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export function checkRateLimit(sessionId) {
  const now = Date.now();
  const entry = requestMap.get(sessionId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // Start a new window
    requestMap.set(sessionId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1, retryAfter: 0 };
  }

  if (entry.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, retryAfter: 0 };
}

/**
 * Reset the rate limit for a session (e.g. for testing).
 * @param {string} sessionId
 */
export function resetRateLimit(sessionId) {
  requestMap.delete(sessionId);
}

/**
 * Express middleware that enforces the session-based rate limit.
 * Reads sessionId from req.body.sessionId.
 *
 * On limit exceeded, responds with 429 and the standard error shape:
 * {
 *   "error": "Too Many Requests",
 *   "message": "Rate limit exceeded. Please slow down.",
 *   "code": "RATE_LIMIT_EXCEEDED",
 *   "retryAfter": <seconds>
 * }
 */
export function rateLimitMiddleware(req, res, next) {
  const sessionId = req.body?.sessionId;

  if (!sessionId) {
    // No sessionId — let the route handler deal with the missing field
    return next();
  }

  const result = checkRateLimit(sessionId);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: result.retryAfter,
    });
  }

  return next();
}
