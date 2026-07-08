import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { sendMail } from '../utils/mailer.js';
import { writeLog, detectModelUsed } from '../services/emailAgent/replyLogger.js';

const router = express.Router();

// All routes require admin or super_admin role
const guard = requireRole('admin', 'super_admin');

// ─── GET /api/email-agent/threads ────────────────────────────────────────────
// Paginated thread list with optional filters
router.get('/threads', guard, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    if (req.query.escalated !== undefined) {
      values.push(req.query.escalated === 'true');
      conditions.push(`escalated = $${values.length}`);
    }
    if (req.query.converted !== undefined) {
      values.push(req.query.converted === 'true');
      conditions.push(`converted = $${values.length}`);
    }
    if (req.query.source) {
      values.push(req.query.source);
      conditions.push(`source = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM email_threads ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit);
    values.push(offset);
    const rows = await pool.query(
      `SELECT id, thread_id, from_email, from_name, subject, source,
              ai_reply_count, total_messages, escalated, escalation_reason,
              auto_reply_enabled, converted, conversion_type,
              created_at, last_activity_at
       FROM email_threads
       ${where}
       ORDER BY last_activity_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return res.json({ threads: rows.rows, total, page, limit });
  } catch (err) {
    console.error('[emailAgent] GET /threads error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── GET /api/email-agent/threads/:thread_id ──────────────────────────────────
// Thread detail + merged message history
router.get('/threads/:thread_id', guard, async (req, res) => {
  try {
    const { thread_id } = req.params;

    const threadResult = await pool.query(
      `SELECT * FROM email_threads WHERE thread_id = $1 LIMIT 1`,
      [thread_id]
    );
    if (!threadResult.rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Thread not found' });
    }
    const thread = threadResult.rows[0];

    // Merge inbound messages + outbound replies, sorted by created_at ASC
    const messagesResult = await pool.query(
      `SELECT id, 'inbound' AS direction, body AS body, created_at,
              NULL::VARCHAR AS ai_model_used, NULL::VARCHAR AS source
       FROM inbound_emails
       WHERE thread_id = $1

       UNION ALL

       SELECT id, 'outbound' AS direction, reply_body_text AS body, created_at,
              ai_model_used, source
       FROM email_agent_reply_logs
       WHERE thread_id = $1

       ORDER BY created_at ASC`,
      [thread_id]
    );

    return res.json({ thread, messages: messagesResult.rows });
  } catch (err) {
    console.error('[emailAgent] GET /threads/:id error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── POST /api/email-agent/threads/:thread_id/manual-reply ───────────────────
// Admin sends a manual override reply
router.post('/threads/:thread_id/manual-reply', guard, async (req, res) => {
  try {
    const { thread_id } = req.params;
    const { body: replyBody } = req.body;

    if (!replyBody || !replyBody.trim()) {
      return res.status(400).json({ error: 'Bad Request', message: 'Reply body is required' });
    }

    const threadResult = await pool.query(
      `SELECT * FROM email_threads WHERE thread_id = $1 LIMIT 1`,
      [thread_id]
    );
    if (!threadResult.rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Thread not found' });
    }
    const thread = threadResult.rows[0];

    const subject = thread.subject?.startsWith('Re:')
      ? thread.subject
      : `Re: ${thread.subject || 'Your enquiry'}`;

    const replyHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><style>
body{margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;}
.wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
.header{background:#0a0a0a;padding:28px 36px;text-align:center;}
.logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
.logo span{color:#14c9e1;}
.body{padding:36px;}
.body p{font-size:15px;color:#475569;line-height:1.7;margin:0 0 14px;}
.footer{background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #e2e8f0;}
.footer p{font-size:12px;color:#94a3b8;margin:0;line-height:1.8;}
.footer a{color:#14c9e1;text-decoration:none;}
</style></head>
<body><div class="wrapper">
<div class="header"><div class="logo">Seevora<span>.</span></div></div>
<div class="body"><p>${replyBody.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')}</p></div>
<div class="footer"><p><strong>Seevora Private Limited</strong><br/>
<a href="mailto:info@seevora.in">info@seevora.in</a> | <a href="https://seevora.in">seevora.in</a></p></div>
</div></body></html>`;

    const mailResult = await sendMail({
      to: thread.from_email,
      subject,
      html: replyHtml,
      text: replyBody,
    });

    await writeLog({
      threadId: thread_id,
      inboundEmailId: null,
      toEmail: thread.from_email,
      subject,
      replyBodyHtml: replyHtml,
      replyBodyText: replyBody,
      aiModelUsed: null,
      source: 'admin_override',
      status: mailResult.success ? 'sent' : 'failed',
      errorMessage: mailResult.error || null,
      escalationReason: null,
      processingDurationMs: null,
    });

    if (!mailResult.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${mailResult.error}`,
      });
    }

    return res.json({ success: true, message: `Reply sent to ${thread.from_email}` });
  } catch (err) {
    console.error('[emailAgent] POST /threads/:id/manual-reply error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── PUT /api/email-agent/threads/:thread_id/auto-reply ──────────────────────
// Toggle auto_reply_enabled for a thread
router.put('/threads/:thread_id/auto-reply', guard, async (req, res) => {
  try {
    const { thread_id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Bad Request', message: '`enabled` must be a boolean' });
    }

    const result = await pool.query(
      `UPDATE email_threads
       SET auto_reply_enabled = $2, updated_at = NOW()
       WHERE thread_id = $1
       RETURNING thread_id, auto_reply_enabled`,
      [thread_id, enabled]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Thread not found' });
    }

    return res.json({ success: true, thread_id, auto_reply_enabled: enabled });
  } catch (err) {
    console.error('[emailAgent] PUT /threads/:id/auto-reply error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── POST /api/email-agent/threads/:thread_id/convert ────────────────────────
// Mark a thread as a conversion event
router.post('/threads/:thread_id/convert', guard, async (req, res) => {
  try {
    const { thread_id } = req.params;
    const { conversion_type } = req.body;

    if (!['booked_call', 'service_inquiry'].includes(conversion_type)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'conversion_type must be "booked_call" or "service_inquiry"',
      });
    }

    const result = await pool.query(
      `UPDATE email_threads
       SET converted = true,
           conversion_type = $2,
           converted_at = NOW(),
           confirmed_by = $3,
           updated_at = NOW()
       WHERE thread_id = $1
       RETURNING thread_id, converted, conversion_type, converted_at`,
      [thread_id, conversion_type, req.user?.id || null]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Thread not found' });
    }

    return res.json({ success: true, ...result.rows[0] });
  } catch (err) {
    console.error('[emailAgent] POST /threads/:id/convert error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── GET /api/email-agent/metrics ────────────────────────────────────────────
// Aggregate dashboard metrics
router.get('/metrics', guard, async (req, res) => {
  try {
    const [threadsResult, repliesResult, threadsBySourceResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                          AS total_threads,
          COUNT(*) FILTER (WHERE escalated = true)         AS escalations,
          COUNT(*) FILTER (WHERE converted = true)         AS conversions,
          COALESCE(AVG(ai_reply_count), 0)                 AS avg_replies_per_thread
        FROM email_threads
      `),
      pool.query(`
        SELECT
          COUNT(*)                                          AS total_ai_replies,
          COUNT(*) FILTER (WHERE status = 'sent')          AS sent,
          COUNT(*) FILTER (WHERE status = 'failed')        AS failed
        FROM email_agent_reply_logs
        WHERE source = 'ai'
      `),
      pool.query(`
        SELECT source, COUNT(*) AS count
        FROM email_threads
        GROUP BY source
      `),
    ]);

    const t = threadsResult.rows[0];
    const r = repliesResult.rows[0];
    const totalSent   = parseInt(r.sent,   10);
    const totalFailed = parseInt(r.failed, 10);
    const total       = totalSent + totalFailed;
    const aiReplySuccessRate = total > 0
      ? parseFloat(((totalSent / total) * 100).toFixed(1))
      : 100;

    const threadsBySource = {};
    for (const row of threadsBySourceResult.rows) {
      threadsBySource[row.source] = parseInt(row.count, 10);
    }

    return res.json({
      totalThreads:        parseInt(t.total_threads, 10),
      totalAiReplies:      parseInt(r.total_ai_replies, 10),
      escalations:         parseInt(t.escalations, 10),
      conversions:         parseInt(t.conversions, 10),
      aiReplySuccessRate,
      avgRepliesPerThread: parseFloat(parseFloat(t.avg_replies_per_thread).toFixed(1)),
      threadsBySource,
    });
  } catch (err) {
    console.error('[emailAgent] GET /metrics error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── GET /api/email-agent/logs ────────────────────────────────────────────────
// Paginated reply logs with filters
router.get('/logs', guard, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    if (req.query.thread_id) {
      values.push(req.query.thread_id);
      conditions.push(`thread_id = $${values.length}`);
    }
    if (req.query.to_email) {
      values.push(req.query.to_email.toLowerCase());
      conditions.push(`LOWER(to_email) = $${values.length}`);
    }
    if (req.query.status) {
      values.push(req.query.status);
      conditions.push(`status = $${values.length}`);
    }
    if (req.query.from_date) {
      values.push(req.query.from_date);
      conditions.push(`sent_at >= $${values.length}`);
    }
    if (req.query.to_date) {
      values.push(req.query.to_date);
      conditions.push(`sent_at <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM email_agent_reply_logs ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit);
    values.push(offset);
    const logsResult = await pool.query(
      `SELECT id, thread_id, inbound_email_id, to_email, subject,
              ai_model_used, source, status, error_message,
              escalation_reason, processing_duration_ms, sent_at
       FROM email_agent_reply_logs
       ${where}
       ORDER BY sent_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return res.json({ logs: logsResult.rows, total, page, limit });
  } catch (err) {
    console.error('[emailAgent] GET /logs error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, _next) => {
  console.error('[emailAgent] Unhandled error:', err);
  return res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
});

export default router;
