import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { sendMail } from '../utils/mailer.js';
import { callBookingConfirmation, contactAdminNotification, contactThreadReply, aiContactReply } from '../utils/emailTemplates.js';
import { generateAIReply } from '../utils/ai.js';
import { requireRole } from '../middleware/auth.js';
import { createPostgresRateLimiter } from '../middleware/rateLimit.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';

const router = express.Router();
const publicSubmitLimiter = createPostgresRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  policy: 'audit_submit',
  subject: (req) => String(req.body?.email || '').trim().toLowerCase() || 'missing',
});
const adminGuard = requireRole('admin');

function bustAuditRequestCache({ leadsChanged = false } = {}) {
  const namespaces = [CACHE_NAMESPACES.auditRequests, CACHE_NAMESPACES.dashboard];
  if (leadsChanged) namespaces.push(CACHE_NAMESPACES.leads, CACHE_NAMESPACES.analytics);
  invalidateCacheNamespaces(...namespaces);
}

function normalizeRequest(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    phone: row.phone,
    message: row.message,
    status: row.status,
    responseBody: row.response_body,
    emailStatus: row.email_status,
    emailError: row.email_error,
    thread: row.thread || [],
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

function validateAuditRequest(body) {
  const errors = {};
  const data = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    company: String(body.company || '').trim(),
    phone: String(body.phone || '').trim(),
    message: String(body.message || '').trim(),
  };

  if (!data.name) errors.name = 'Full name is required.';
  if (!data.email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!data.message) errors.message = 'Message is required.';

  return { isValid: Object.keys(errors).length === 0, errors, data };
}

function validateResponse(body) {
  const responseBody = String(body.responseBody || body.message || '').trim();
  if (!responseBody) {
    return {
      isValid: false,
      errors: { responseBody: 'Response message is required.' },
      data: { responseBody },
    };
  }
  return { isValid: true, errors: {}, data: { responseBody } };
}


async function sendEnquiryBotEmails(requestId, data) {
  let bookingTpl = null;

  try {
    const systemPrompt = 'You are Seevora\'s AI Sales & Support Agent. Seevora is an AI-powered B2B automation company that helps businesses automate operations, communication, and workflows.\n\nGenerate a professional, friendly email response to a new inquiry. Introduce yourself briefly, directly address the client\'s message, highlight how Seevora\'s automation can assist them, and gently suggest booking a free discovery call at https://seevora.in/book-a-call.\n\nKeep the email natural and concise. Do NOT use any placeholders (like [Your Name] or [Date]). Sign off as "The Seevora Team".';
    const prompt = `Client Name: ${data.name}\nCompany: ${data.company || 'N/A'}\nMessage: ${data.message}`;

    const aiResponse = await generateAIReply({ prompt, systemPrompt });
    if (aiResponse) {
      bookingTpl = aiContactReply({ name: data.name, aiResponse });
    }
  } catch (err) {
    console.error('[AI Enquiry Reply] Error generating AI reply:', err.message);
  }

  if (!bookingTpl) {
    // Fallback to static email
    bookingTpl = callBookingConfirmation({ name: data.name, email: data.email, company: data.company, phone: data.phone, message: data.message });
  }

  const customerResult = await sendMail({ to: data.email, ...bookingTpl });

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  let adminResult = null;
  if (adminEmail) {
    const adminTpl = contactAdminNotification({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      message: data.message,
    });
    adminResult = await sendMail({ to: adminEmail, ...adminTpl });
  }

  const status = customerResult.success ? 'sent' : 'failed';
  const error = customerResult.success
    ? null
    : customerResult.error || 'Unable to send customer auto-reply';

  await pool.query(
    `UPDATE audit_requests
     SET email_status = $2,
         email_error = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [requestId, status, error]
  );

  return { customer: customerResult, admin: adminResult, status, error };
}
router.post('/', publicSubmitLimiter, async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateAuditRequest(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const initialThread = [{
      id: crypto.randomUUID(),
      sender: 'user',
      text: data.message,
      timestamp: new Date().toISOString()
    }];

    const result = await pool.query(
      `INSERT INTO audit_requests (id, name, email, company, phone, message, thread)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING *`,
      [crypto.randomUUID(), data.name, data.email, data.company || null, data.phone || null, data.message, JSON.stringify(initialThread)]
    );

    const requestId = result.rows[0].id;
    bustAuditRequestCache();

    // Dispatch the email generation/sending as a background task
    sendEnquiryBotEmails(requestId, data)
      .then(() => bustAuditRequestCache())
      .catch((err) => console.error('[Audit Request Background Email] Error:', err.message));

    return res.status(201).json({
      message: 'Message received. We will get back to you shortly.',
      request: normalizeRequest(result.rows[0]),
    });
  } catch (error) {
    console.error('[Audit Request] Error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({ message: 'Database schema is not initialized. Please ensure migrations are run.' });
    }
    return res.status(500).json({ message: 'Internal server error while processing request.', error: error.message });
  }
});

router.get('/', adminGuard, async (_req, res, next) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.auditRequests, { view: 'admin-list' });
    const payload = await getOrSetCache(cacheKey, 30, async () => {
      const result = await pool.query('SELECT * FROM audit_requests ORDER BY created_at DESC');
      return { requests: result.rows.map(normalizeRequest) };
    });
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/convert-to-lead', adminGuard, async (req, res, next) => {
  try {
    const requestResult = await pool.query('SELECT * FROM audit_requests WHERE id = $1', [req.params.id]);
    const auditRequest = requestResult.rows[0];
    if (!auditRequest) return res.status(404).json({ message: 'Audit request not found.' });

    const existingLead = await pool.query(
      'SELECT * FROM leads WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1',
      [auditRequest.email]
    );

    let lead = existingLead.rows[0];
    if (lead) {
      const notes = [lead.notes, `Audit request: ${auditRequest.message}`].filter(Boolean).join('\n\n');
      const updatedLead = await pool.query(
        `UPDATE leads
         SET source = 'audit_request',
             company = COALESCE(company, $2),
             phone = COALESCE(phone, $3),
             notes = $4,
             audit_request_id = $5,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [lead.id, auditRequest.company || null, auditRequest.phone || null, notes, auditRequest.id]
      );
      lead = updatedLead.rows[0];
    } else {
      const insertedLead = await pool.query(
        `INSERT INTO leads
           (id, name, email, phone, company, source, pipeline_stage, score, notes, audit_request_id)
         VALUES ($1,$2,$3,$4,$5,'audit_request','new',70,$6,$7)
         RETURNING *`,
        [
          crypto.randomUUID(),
          auditRequest.name,
          auditRequest.email,
          auditRequest.phone || null,
          auditRequest.company || null,
          auditRequest.message || null,
          auditRequest.id,
        ]
      );
      lead = insertedLead.rows[0];
    }

    bustAuditRequestCache({ leadsChanged: true });

    const updatedRequest = await pool.query(
      `UPDATE audit_requests
       SET status = 'converted', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [auditRequest.id]
    );
    bustAuditRequestCache({ leadsChanged: true });

    return res.json({
      message: 'Audit request converted to lead.',
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        industry: lead.industry,
        designation: lead.designation,
        source: lead.source,
        pipelineStage: lead.pipeline_stage,
        score: lead.score,
        notes: lead.notes,
        nextFollowUpAt: lead.next_follow_up_at,
        auditRequestId: lead.audit_request_id,
        lastContactedAt: lead.last_contacted_at,
        assignedTo: lead.assigned_to,
        createdBy: lead.created_by,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      },
      request: normalizeRequest(updatedRequest.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/respond', adminGuard, async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateResponse(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const requestResult = await pool.query('SELECT * FROM audit_requests WHERE id = $1', [req.params.id]);
    const request = requestResult.rows[0];
    if (!request) return res.status(404).json({ message: 'Audit request not found.' });

    const emailResult = await sendMail({ to: request.email, ...contactThreadReply({ toName: request.name, responseBody: data.responseBody, originalMessage: request.message }) });
    emailResult.status = emailResult.success ? 'sent' : 'failed';
    emailResult.error = emailResult.error || null;

    const currentThread = request.thread || [];
    const newReply = {
      id: crypto.randomUUID(),
      sender: 'admin',
      text: data.responseBody,
      timestamp: new Date().toISOString()
    };
    const updatedThread = [...currentThread, newReply];

    const updated = await pool.query(
      `UPDATE audit_requests
       SET status = $2,
           response_body = $3,
           email_status = $4,
           email_error = $5,
           thread = $6::jsonb,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        request.id,
        emailResult.status === 'sent' ? 'responded' : 'response_saved',
        data.responseBody,
        emailResult.status,
        emailResult.error,
        JSON.stringify(updatedThread)
      ]
    );
    bustAuditRequestCache();

    return res.json({
      message: emailResult.status === 'sent'
        ? 'Response sent to the user email.'
        : 'Response saved. Configure SMTP to send emails automatically.',
      request: normalizeRequest(updated.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id/thread', adminGuard, async (req, res, next) => {
  try {
    const requestResult = await pool.query('SELECT * FROM audit_requests WHERE id = $1', [req.params.id]);
    const request = requestResult.rows[0];
    if (!request) return res.status(404).json({ message: 'Audit request not found.' });

    // Keep only the first message (from the user)
    const currentThread = request.thread || [];
    const firstMessage = currentThread.find(m => m.sender === 'user') || {
      id: crypto.randomUUID(),
      sender: 'user',
      text: request.message,
      timestamp: request.created_at
    };

    const updated = await pool.query(
      `UPDATE audit_requests
       SET thread = $2::jsonb,
           status = 'new',
           response_body = NULL,
           email_status = NULL,
           email_error = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [request.id, JSON.stringify([firstMessage])]
    );

    bustAuditRequestCache();
    return res.json({
      message: 'Conversation history cleared.',
      request: normalizeRequest(updated.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', adminGuard, async (req, res, next) => {
  try {
    const requestResult = await pool.query('SELECT * FROM audit_requests WHERE id = $1', [req.params.id]);
    if (requestResult.rows.length === 0) return res.status(404).json({ message: 'Audit request not found.' });

    await pool.query('DELETE FROM audit_requests WHERE id = $1', [req.params.id]);
    bustAuditRequestCache();
    
    return res.json({ message: 'Audit request deleted successfully.' });
  } catch (error) {
    return next(error);
  }
});

export default router;
