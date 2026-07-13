import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import * as sessionManager from '../services/salesAgent/sessionManager.js';
import { generateResponse, shouldOfferLeadCapture, extractMentionedServices, invalidatePromptCache } from '../services/salesAgent/responseGenerator.js';
import { validateLeadData, leadExistsForSession, createLead, linkLeadToSession } from '../services/salesAgent/leadProcessor.js';
import { logEvent, trackEvent, calculateMetrics, trackServiceDiscussion, getDashboardMetrics } from '../services/salesAgent/analyticsTracker.js';
import { checkRateLimit } from '../utils/rateLimiter.js';

const router = express.Router();

const WELCOME_MESSAGE = "Hi! 👋 I'm Seevora's AI assistant. I can help you learn about our AI automation solutions for your business. What brings you here today?";

// ─── GET /api/sales-agent/session ──────────────────────────────────────────
// Create or restore a chat session.
router.get('/session', async (req, res) => {
  try {
    const { sessionId, restore } = req.query;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get('user-agent');

    let session = null;

    if (sessionId) {
      session = await sessionManager.getSessionBySessionId(sessionId);

      // If archived and restore requested, allow viewing history but don't reactivate
      if (session && session.status === 'archived' && restore !== 'true') {
        // Expired — don't restore, start fresh
        session = null;
      }
    }

    if (!session) {
      // Create new session
      session = await sessionManager.createSession({ ipAddress, userAgent });
      await trackEvent(session.id, 'session_start', {
        ipAddress,
        userAgent: userAgent?.substring(0, 200),
      });
    }

    // Fetch conversation history
    const messages = await sessionManager.getMessages(session.id);

    return res.json({
      sessionId: session.session_id,
      messages: messages.map(formatMessage),
      welcomeMessage: messages.length === 0 ? WELCOME_MESSAGE : null,
      createdAt: session.created_at,
      status: session.status,
    });
  } catch (err) {
    console.error('[SalesAgent] GET /session error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR', message: 'Failed to initialize chat session.' });
  }
});

// ─── POST /api/sales-agent/message ─────────────────────────────────────────
// Send a user message and receive an AI response.
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    // Validate input
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Bad Request', code: 'MISSING_SESSION_ID', message: 'sessionId is required.' });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Bad Request', code: 'MISSING_MESSAGE', message: 'Message is required.' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'Bad Request', code: 'MESSAGE_TOO_LONG', message: 'Message exceeds maximum length of 500 characters.' });
    }

    // Rate limit check
    const rateCheck = checkRateLimit(sessionId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please slow down.',
        retryAfter: rateCheck.retryAfter,
      });
    }

    // Get session
    const session = await sessionManager.getSessionBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Not Found', code: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }
    if (session.status === 'archived') {
      return res.status(404).json({ error: 'Not Found', code: 'SESSION_EXPIRED', message: 'This session has expired. Please start a new conversation.' });
    }

    const userMsg = message.trim();

    // Save user message (catch DB full errors so chat still works)
    try {
      await sessionManager.saveMessage(session.id, 'user', userMsg);
      await trackEvent(session.id, 'message_sent', { messageLength: userMsg.length });
    } catch (dbErr) {
      console.warn('[DB] Could not save user message:', dbErr.message);
    }

    // Get last 10 messages for context
    const history = await sessionManager.getRecentMessages(session.id, 10);

    // Generate AI response
    let agentText;
    try {
      agentText = await generateResponse({ userMessage: userMsg, history });
    } catch (err) {
      if (err.message === 'AI_TIMEOUT') {
        return res.status(504).json({
          error: 'Gateway Timeout',
          code: 'AI_TIMEOUT',
          message: 'AI response took too long. Please try again.',
        });
      }
      // Service unavailable
      return res.status(503).json({
        error: 'Service Unavailable',
        code: 'SERVICE_UNAVAILABLE',
        message: 'AI service is temporarily unavailable. Please contact us at contact@seevora.in.',
      });
    }

    // Save agent response
    let agentMsg = null;
    try {
      agentMsg = await sessionManager.saveMessage(session.id, 'agent', agentText);
      await trackEvent(session.id, 'agent_response', { responseLength: agentText.length });
    } catch (dbErr) {
      console.warn('[DB] Could not save agent message:', dbErr.message);
    }

    // Track mentioned services
    const services = extractMentionedServices(`${userMsg} ${agentText}`);
    if (services.length > 0) {
      await sessionManager.updateServicesDiscussed(session.id, services);
    }

    // Detect if we should offer lead capture
    const offerLead = !session.lead_captured && shouldOfferLeadCapture(agentText, userMsg);
    if (offerLead) {
      await trackEvent(session.id, 'lead_capture_offered', {});
    }

    return res.json({
      messageId: agentMsg ? agentMsg.id : `fallback-${Date.now()}`,
      agentResponse: agentText,
      timestamp: agentMsg ? agentMsg.created_at : new Date().toISOString(),
      conversationEnded: false,
      leadCapturePrompt: offerLead,
    });
  } catch (err) {
    console.error('[SalesAgent] POST /message error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
  }
});

// ─── POST /api/sales-agent/lead ─────────────────────────────────────────────
// Submit lead contact information.
router.post('/lead', async (req, res) => {
  try {
    const { sessionId, name, email, phone, serviceInterest } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Bad Request', code: 'MISSING_SESSION_ID', message: 'sessionId is required.' });
    }

    // Validate fields
    const { valid, errors } = validateLeadData({ name, email, phone, serviceInterest });
    if (!valid) {
      return res.status(400).json({ error: 'Validation Error', code: 'VALIDATION_ERROR', message: 'Please fix the errors below.', errors });
    }

    // Get session
    const session = await sessionManager.getSessionBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Not Found', code: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }

    // Duplicate check
    const exists = await leadExistsForSession(session.id);
    if (exists) {
      return res.status(409).json({ error: 'Conflict', code: 'LEAD_ALREADY_CAPTURED', message: 'Contact information already captured for this session.' });
    }

    // Create lead
    const lead = await createLead(session.id, { name, email, phone, serviceInterest });

    // Update session
    await sessionManager.markLeadCaptured(session.id, lead.id);
    await trackEvent(session.id, 'lead_captured', { leadId: lead.id, serviceInterest });

    return res.json({
      leadId: lead.id,
      message: "Thank you! Our team will reach out to you shortly. In the meantime, feel free to ask any questions.",
      success: true,
    });
  } catch (err) {
    console.error('[SalesAgent] POST /lead error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR', message: 'Failed to save contact information.' });
  }
});

// ─── POST /api/sales-agent/session/end ─────────────────────────────────────
// End a chat session.
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Bad Request', code: 'MISSING_SESSION_ID', message: 'sessionId is required.' });
    }

    const session = await sessionManager.getSessionBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Not Found', code: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }

    await sessionManager.endSession(session.id);
    await trackEvent(session.id, 'session_end', { messageCount: session.message_count });

    return res.json({ success: true, message: 'Session ended.' });
  } catch (err) {
    console.error('[SalesAgent] POST /session/end error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR', message: 'Failed to end session.' });
  }
});

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

// GET /api/sales-agent/admin/dashboard
router.get('/admin/dashboard', requireRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await getDashboardMetrics({ startDate, endDate });
    return res.json(metrics);
  } catch (err) {
    console.error('[SalesAgent] GET /admin/dashboard error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/sales-agent/admin/conversations/:sessionId
router.get('/admin/conversations/:sessionId', requireRole('admin'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionManager.getSessionBySessionId(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Not Found', code: 'SESSION_NOT_FOUND' });
    }

    const messages = await sessionManager.getMessages(session.id, 200);

    // Get lead if captured
    let lead = null;
    if (session.lead_captured && session.lead_id) {
      const { rows } = await pool.query(
        `SELECT * FROM sales_agent_leads WHERE id = $1 LIMIT 1`,
        [session.lead_id]
      );
      lead = rows[0] || null;
    }

    return res.json({
      sessionId: session.session_id,
      status: session.status,
      messages: messages.map(formatMessage),
      lead,
      analytics: {
        messageCount: session.message_count,
        servicesDiscussed: session.services_discussed || [],
        conversionStatus: session.lead_captured ? 'converted' : 'not_converted',
        duration: session.ended_at
          ? Math.round((new Date(session.ended_at) - new Date(session.created_at)) / 1000)
          : null,
      },
      createdAt: session.created_at,
      endedAt: session.ended_at,
    });
  } catch (err) {
    console.error('[SalesAgent] GET /admin/conversations/:id error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/sales-agent/admin/conversations (list)
router.get('/admin/conversations', requireRole('admin'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || 1));
    const limit = Math.min(50, parseInt(req.query.limit || 20));
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT session_id, status, lead_captured, message_count,
              services_discussed, created_at, ended_at, last_activity_at
       FROM sales_agent_sessions
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM sales_agent_sessions`);

    return res.json({
      conversations: rows,
      total: parseInt(countRows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error('[SalesAgent] GET /admin/conversations error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/sales-agent/admin/prompt
router.put('/admin/prompt', requireRole('admin'), async (req, res) => {
  try {
    const { systemPrompt } = req.body;
    if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length < 50) {
      return res.status(400).json({ error: 'Bad Request', code: 'INVALID_PROMPT', message: 'System prompt must be at least 50 characters.' });
    }

    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('ai_sales_agent_prompt', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [systemPrompt.trim()]
    );

    // Invalidate cache so new prompt is used immediately
    invalidatePromptCache();

    return res.json({ success: true, message: 'System prompt updated successfully.' });
  } catch (err) {
    console.error('[SalesAgent] PUT /admin/prompt error:', err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
});

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatMessage(row) {
  return {
    id: row.id,
    sender: row.sender,
    messageText: row.message_text,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

// ─── Error Handling Middleware ───────────────────────────────────────────────
// Catches any errors passed via next(err) within this router.
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, _next) => {
  console.error('[SalesAgent] Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  });
});

export default router;
