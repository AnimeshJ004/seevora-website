import { createPostgresRateLimiter } from '../middleware/rateLimit.js';

export const SALES_AGENT_RATE_LIMIT = 20;
export const SALES_AGENT_RATE_WINDOW_MS = 60_000;

export function createSalesAgentRateLimitMiddleware({ database, keySecret } = {}) {
  return createPostgresRateLimiter({
    windowMs: SALES_AGENT_RATE_WINDOW_MS,
    max: SALES_AGENT_RATE_LIMIT,
    policy: 'sales_session',
    subject: (req) => String(req.body?.sessionId || ''),
    skip: (req) => typeof req.body?.sessionId !== 'string' || !req.body.sessionId,
    database,
    keySecret,
    handler(_req, res, result) {
      res.set('Retry-After', String(result.retryAfter));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.retryAfter,
      });
    },
  });
}

export const rateLimitMiddleware = createSalesAgentRateLimitMiddleware();
