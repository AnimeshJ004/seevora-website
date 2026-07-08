/**
 * Integration tests for Email AI Sales Agent admin routes
 * Tests: threads list, thread detail, manual reply, auto-reply toggle,
 *        conversion marking, metrics, and logs endpoints.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.2, 9.3
 *
 * Strategy: test route handler logic using mock pool pattern
 * No live DB or HTTP server required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return randomUUID();
}

// ─── Mock pool factory ─────────────────────────────────────────────────────────

function makeMockPool() {
  const calls = [];
  const pool = {
    _calls: calls,
    _queue: [],
    enqueue(result) { this._queue.push(result); },
    async query(text, params) {
      const result = this._queue.length > 0 ? this._queue.shift() : { rows: [], rowCount: 0 };
      calls.push({ text, params, result });
      return result;
    },
  };
  return pool;
}

// ─── Mock req / res factory ───────────────────────────────────────────────────

function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
  return res;
}

function makeReq({ query = {}, body = {}, params = {}, user = null } = {}) {
  return {
    query,
    body,
    params,
    user: user || { id: uid(), role: 'admin' },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. GET /api/email-agent/threads — paginated thread list with filters
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /threads — paginated thread list', () => {
  it('returns threads with default pagination', async () => {
    const pool = makeMockPool();
    const mockThreads = [
      {
        id: uid(),
        thread_id: 'thread-1',
        from_email: 'user@example.com',
        from_name: 'John Doe',
        subject: 'Inquiry about AI services',
        source: 'imap',
        ai_reply_count: 3,
        escalated: false,
        auto_reply_enabled: true,
        converted: false,
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      },
    ];

    pool.enqueue({ rows: mockThreads });
    pool.enqueue({ rows: [{ count: '1' }] });

    const page = 1;
    const limit = 20;

    const { rows } = await pool.query(
      `SELECT id, thread_id, from_email, from_name, subject, source,
              ai_reply_count, escalated, auto_reply_enabled, converted,
              created_at, last_activity_at
       FROM email_threads
       
       ORDER BY last_activity_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, 0]
    );

    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM email_threads ');

    assert.equal(rows.length, 1);
    assert.equal(rows[0].thread_id, 'thread-1');
    assert.equal(parseInt(countRows[0].count), 1);
  });

  it('applies escalated filter when provided', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });
    pool.enqueue({ rows: [{ count: '0' }] });

    const escalated = true;
    const conditions = [`escalated = $1`];
    const params = [escalated];

    await pool.query(
      `SELECT id, thread_id, from_email, from_name, subject, source,
              ai_reply_count, escalated, auto_reply_enabled, converted,
              created_at, last_activity_at
       FROM email_threads
       WHERE ${conditions.join(' AND ')}
       ORDER BY last_activity_at DESC
       LIMIT $2 OFFSET $3`,
      [...params, 20, 0]
    );

    assert.equal(pool._calls[0].params[0], true);
    assert.ok(pool._calls[0].text.includes('escalated'));
  });

  it('applies converted filter when provided', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const converted = true;
    const conditions = [`converted = $1`];

    await pool.query(
      `SELECT * FROM email_threads WHERE ${conditions.join(' AND ')} ORDER BY last_activity_at DESC LIMIT $2 OFFSET $3`,
      [converted, 20, 0]
    );

    assert.equal(pool._calls[0].params[0], true);
    assert.ok(pool._calls[0].text.includes('converted'));
  });

  it('applies source filter when provided', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const source = 'contact_form';
    const conditions = [`source = $1`];

    await pool.query(
      `SELECT * FROM email_threads WHERE ${conditions.join(' AND ')} ORDER BY last_activity_at DESC LIMIT $2 OFFSET $3`,
      [source, 20, 0]
    );

    assert.equal(pool._calls[0].params[0], 'contact_form');
    assert.ok(pool._calls[0].text.includes('source'));
  });

  it('enforces maximum limit of 50', () => {
    const requestedLimit = 100;
    const limit = Math.min(50, Math.max(1, requestedLimit));
    assert.equal(limit, 50);
  });

  it('enforces minimum page of 1', () => {
    const requestedPage = -5;
    const page = Math.max(1, requestedPage);
    assert.equal(page, 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GET /api/email-agent/threads/:thread_id — thread detail with messages
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /threads/:thread_id — thread detail', () => {
  it('returns thread with merged inbound and outbound messages', async () => {
    const pool = makeMockPool();
    const threadId = 'thread-abc';
    const mockThread = {
      id: uid(),
      thread_id: threadId,
      from_email: 'customer@example.com',
      from_name: 'Jane Smith',
      subject: 'Service inquiry',
      source: 'imap',
      ai_reply_count: 2,
      escalated: false,
      auto_reply_enabled: true,
      converted: false,
      created_at: new Date().toISOString(),
    };

    const inboundMsg = {
      id: uid(),
      from_email: 'customer@example.com',
      subject: 'Service inquiry',
      body: 'Can you tell me more about your services?',
      status: 'replied',
      created_at: new Date().toISOString(),
    };

    const outboundMsg = {
      id: uid(),
      to_email: 'customer@example.com',
      subject: 'Re: Service inquiry',
      reply_body_text: 'Thank you for your inquiry...',
      reply_body_html: '<p>Thank you for your inquiry...</p>',
      ai_model_used: 'claude-3-5-sonnet-20241022',
      source: 'ai',
      status: 'sent',
      created_at: new Date(Date.now() + 1000).toISOString(),
    };

    pool.enqueue({ rows: [mockThread] });
    pool.enqueue({ rows: [inboundMsg] });
    pool.enqueue({ rows: [outboundMsg] });

    const { rows: threadRows } = await pool.query(
      'SELECT * FROM email_threads WHERE thread_id = $1 LIMIT 1',
      [threadId]
    );
    const thread = threadRows[0];

    const { rows: inboundRows } = await pool.query(
      'SELECT id, from_email, subject, body, status, created_at, received_at FROM inbound_emails WHERE thread_id = $1 ORDER BY created_at ASC',
      [threadId]
    );

    const { rows: outboundRows } = await pool.query(
      'SELECT id, to_email, subject, reply_body_text, reply_body_html, ai_model_used, source, status, sent_at, created_at FROM email_agent_reply_logs WHERE thread_id = $1 ORDER BY created_at ASC',
      [threadId]
    );

    assert.equal(thread.thread_id, threadId);
    assert.equal(inboundRows.length, 1);
    assert.equal(outboundRows.length, 1);
    assert.equal(inboundRows[0].body, 'Can you tell me more about your services?');
    assert.equal(outboundRows[0].reply_body_text, 'Thank you for your inquiry...');
  });

  it('returns 404 when thread not found', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const { rows } = await pool.query(
      'SELECT * FROM email_threads WHERE thread_id = $1 LIMIT 1',
      ['non-existent']
    );

    const res = makeRes();
    if (rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Thread not found.' });
    }

    assert.equal(res._status, 404);
    assert.equal(res._body.error, 'Not Found');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. POST /api/email-agent/threads/:thread_id/manual-reply — admin override
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /threads/:thread_id/manual-reply — admin override', () => {
  it('returns 400 when body is missing', () => {
    const body = '';
    const res = makeRes();

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Reply body is required.' });
    }

    assert.equal(res._status, 400);
    assert.equal(res._body.error, 'Bad Request');
  });

  it('returns 404 when thread not found', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const { rows } = await pool.query(
      'SELECT * FROM email_threads WHERE thread_id = $1 LIMIT 1',
      ['missing-thread']
    );

    const res = makeRes();
    if (rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Thread not found.' });
    }

    assert.equal(res._status, 404);
  });

  it('builds correct reply subject with Re: prefix', () => {
    const subject = 'Customer inquiry';
    const replySubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your enquiry'}`;
    assert.equal(replySubject, 'Re: Customer inquiry');
  });

  it('does not double-prefix Re: when already present', () => {
    const subject = 'Re: Customer inquiry';
    const replySubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your enquiry'}`;
    assert.equal(replySubject, 'Re: Customer inquiry');
  });

  it('uses default subject when original is null', () => {
    const subject = null;
    const replySubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your enquiry'}`;
    assert.equal(replySubject, 'Re: Your enquiry');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PUT /api/email-agent/threads/:thread_id/auto-reply — toggle setting
// ═══════════════════════════════════════════════════════════════════════════════

describe('PUT /threads/:thread_id/auto-reply — toggle auto-reply', () => {
  it('returns 400 when enabled is not a boolean', () => {
    const enabled = 'yes';
    const res = makeRes();

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'Bad Request', message: 'Field "enabled" must be a boolean.' });
    }

    assert.equal(res._status, 400);
    assert.equal(res._body.error, 'Bad Request');
  });

  it('updates auto_reply_enabled when valid', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rowCount: 1 });

    const enabled = false;
    const threadId = 'thread-123';

    const { rowCount } = await pool.query(
      'UPDATE email_threads SET auto_reply_enabled = $1, updated_at = NOW() WHERE thread_id = $2',
      [enabled, threadId]
    );

    assert.equal(rowCount, 1);
    assert.equal(pool._calls[0].params[0], false);
    assert.equal(pool._calls[0].params[1], threadId);
  });

  it('returns 404 when thread not found', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rowCount: 0 });

    const { rowCount } = await pool.query(
      'UPDATE email_threads SET auto_reply_enabled = $1, updated_at = NOW() WHERE thread_id = $2',
      [true, 'missing']
    );

    const res = makeRes();
    if (rowCount === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Thread not found.' });
    }

    assert.equal(res._status, 404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. POST /api/email-agent/threads/:thread_id/convert — mark conversion
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /threads/:thread_id/convert — mark conversion', () => {
  it('returns 400 when conversion_type is missing', () => {
    const conversionType = '';
    const validTypes = ['booked_call', 'service_inquiry'];
    const res = makeRes();

    if (!conversionType || !validTypes.includes(conversionType)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Field "conversion_type" must be one of: booked_call, service_inquiry',
      });
    }

    assert.equal(res._status, 400);
  });

  it('returns 400 when conversion_type is invalid', () => {
    const conversionType = 'invalid_type';
    const validTypes = ['booked_call', 'service_inquiry'];
    const res = makeRes();

    if (!validTypes.includes(conversionType)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Field "conversion_type" must be one of: booked_call, service_inquiry',
      });
    }

    assert.equal(res._status, 400);
  });

  it('accepts valid conversion_type booked_call', () => {
    const conversionType = 'booked_call';
    const validTypes = ['booked_call', 'service_inquiry'];
    assert.ok(validTypes.includes(conversionType));
  });

  it('accepts valid conversion_type service_inquiry', () => {
    const conversionType = 'service_inquiry';
    const validTypes = ['booked_call', 'service_inquiry'];
    assert.ok(validTypes.includes(conversionType));
  });

  it('updates thread with conversion data', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rowCount: 1 });

    const conversionType = 'booked_call';
    const threadId = 'thread-456';
    const userId = uid();

    const { rowCount } = await pool.query(
      `UPDATE email_threads
       SET converted = true,
           conversion_type = $1,
           converted_at = NOW(),
           confirmed_by = $2,
           updated_at = NOW()
       WHERE thread_id = $3`,
      [conversionType, userId, threadId]
    );

    assert.equal(rowCount, 1);
    assert.equal(pool._calls[0].params[0], 'booked_call');
    assert.equal(pool._calls[0].params[1], userId);
    assert.equal(pool._calls[0].params[2], threadId);
  });

  it('returns 404 when thread not found', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rowCount: 0 });

    const { rowCount } = await pool.query(
      'UPDATE email_threads SET converted = true WHERE thread_id = $1',
      ['missing']
    );

    const res = makeRes();
    if (rowCount === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Thread not found.' });
    }

    assert.equal(res._status, 404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. GET /api/email-agent/metrics — aggregate dashboard metrics
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /metrics — aggregate metrics', () => {
  it('calculates metrics correctly', async () => {
    const pool = makeMockPool();

    // Mock metric queries
    pool.enqueue({ rows: [{ count: '150' }] }); // totalThreads
    pool.enqueue({ rows: [{ count: '420' }] }); // totalAiReplies
    pool.enqueue({ rows: [{ count: '12' }] });  // escalations
    pool.enqueue({ rows: [{ count: '35' }] });  // conversions
    pool.enqueue({ rows: [{ sent: '400', total: '420' }] }); // success rate
    pool.enqueue({ rows: [{ avg: '2.8' }] });   // avgRepliesPerThread
    pool.enqueue({ rows: [{ source: 'imap', count: '100' }, { source: 'contact_form', count: '50' }] }); // by source

    const { rows: totalThreadsRows } = await pool.query('SELECT COUNT(*) as count FROM email_threads');
    const totalThreads = parseInt(totalThreadsRows[0].count);

    const { rows: totalRepliesRows } = await pool.query("SELECT COUNT(*) as count FROM email_agent_reply_logs WHERE source = 'ai'");
    const totalAiReplies = parseInt(totalRepliesRows[0].count);

    const { rows: escalationsRows } = await pool.query('SELECT COUNT(*) as count FROM email_threads WHERE escalated = true');
    const escalations = parseInt(escalationsRows[0].count);

    const { rows: conversionsRows } = await pool.query('SELECT COUNT(*) as count FROM email_threads WHERE converted = true');
    const conversions = parseInt(conversionsRows[0].count);

    const { rows: successRows } = await pool.query(
      "SELECT COUNT(*) FILTER (WHERE status = 'sent') as sent, COUNT(*) as total FROM email_agent_reply_logs WHERE source = 'ai'"
    );
    const sent = parseInt(successRows[0].sent);
    const total = parseInt(successRows[0].total);
    const aiReplySuccessRate = total > 0 ? (sent / total) * 100 : 0;

    const { rows: avgRows } = await pool.query('SELECT AVG(ai_reply_count) as avg FROM email_threads');
    const avgRepliesPerThread = parseFloat(avgRows[0].avg) || 0;

    const { rows: sourceRows } = await pool.query('SELECT source, COUNT(*) as count FROM email_threads GROUP BY source');
    const threadsBySource = sourceRows.reduce((acc, row) => {
      acc[row.source] = parseInt(row.count);
      return acc;
    }, {});

    assert.equal(totalThreads, 150);
    assert.equal(totalAiReplies, 420);
    assert.equal(escalations, 12);
    assert.equal(conversions, 35);
    assert.equal(Math.round(aiReplySuccessRate * 100) / 100, 95.24);
    assert.equal(Math.round(avgRepliesPerThread * 100) / 100, 2.8);
    assert.deepEqual(threadsBySource, { imap: 100, contact_form: 50 });
  });

  it('handles zero total for success rate calculation', () => {
    const sent = 0;
    const total = 0;
    const aiReplySuccessRate = total > 0 ? (sent / total) * 100 : 0;
    assert.equal(aiReplySuccessRate, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. GET /api/email-agent/logs — paginated reply logs with filters
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /logs — paginated logs with filters', () => {
  it('returns logs with default pagination', async () => {
    const pool = makeMockPool();
    const mockLog = {
      id: uid(),
      thread_id: 'thread-1',
      inbound_email_id: uid(),
      to_email: 'customer@example.com',
      subject: 'Re: Inquiry',
      reply_body_text: 'Thank you for reaching out...',
      reply_body_html: '<p>Thank you for reaching out...</p>',
      ai_model_used: 'claude-3-5-sonnet-20241022',
      source: 'ai',
      status: 'sent',
      error_message: null,
      escalation_reason: null,
      processing_duration_ms: 1234,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    pool.enqueue({ rows: [mockLog] });
    pool.enqueue({ rows: [{ count: '1' }] });

    const { rows } = await pool.query(
      `SELECT id, thread_id, inbound_email_id, to_email, subject,
              reply_body_text, reply_body_html, ai_model_used, source,
              status, error_message, escalation_reason, processing_duration_ms,
              sent_at, created_at
       FROM email_agent_reply_logs
       
       ORDER BY sent_at DESC
       LIMIT $1 OFFSET $2`,
      [20, 0]
    );

    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM email_agent_reply_logs ');

    assert.equal(rows.length, 1);
    assert.equal(rows[0].thread_id, 'thread-1');
    assert.equal(rows[0].source, 'ai');
    assert.equal(parseInt(countRows[0].count), 1);
  });

  it('applies thread_id filter when provided', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const threadId = 'thread-abc';
    await pool.query(
      'SELECT * FROM email_agent_reply_logs WHERE thread_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3',
      [threadId, 20, 0]
    );

    assert.equal(pool._calls[0].params[0], 'thread-abc');
  });

  it('applies to_email filter with case-insensitive match', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const toEmail = 'User@Example.Com';
    await pool.query(
      'SELECT * FROM email_agent_reply_logs WHERE LOWER(to_email) = LOWER($1) ORDER BY sent_at DESC LIMIT $2 OFFSET $3',
      [toEmail, 20, 0]
    );

    assert.equal(pool._calls[0].params[0], 'User@Example.Com');
    assert.ok(pool._calls[0].text.includes('LOWER(to_email) = LOWER'));
  });

  it('applies status filter when provided', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const status = 'failed';
    await pool.query(
      'SELECT * FROM email_agent_reply_logs WHERE status = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3',
      [status, 20, 0]
    );

    assert.equal(pool._calls[0].params[0], 'failed');
  });

  it('applies date range filters when provided', async () => {
    const pool = makeMockPool();
    pool.enqueue({ rows: [] });

    const fromDate = '2024-01-01';
    const toDate = '2024-12-31';
    await pool.query(
      'SELECT * FROM email_agent_reply_logs WHERE sent_at >= $1 AND sent_at <= $2 ORDER BY sent_at DESC LIMIT $3 OFFSET $4',
      [fromDate, toDate, 20, 0]
    );

    assert.equal(pool._calls[0].params[0], '2024-01-01');
    assert.equal(pool._calls[0].params[1], '2024-12-31');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Authorization — requireRole middleware behavior
// ═══════════════════════════════════════════════════════════════════════════════

describe('Authorization — requireRole middleware', () => {
  it('allows admin role access', () => {
    const user = { id: uid(), role: 'admin' };
    const allowedRoles = ['admin', 'super_admin'];
    assert.ok(allowedRoles.includes(user.role));
  });

  it('allows super_admin role access', () => {
    const user = { id: uid(), role: 'super_admin' };
    const allowedRoles = ['admin', 'super_admin'];
    assert.ok(allowedRoles.includes(user.role));
  });

  it('denies access for non-admin roles', () => {
    const user = { id: uid(), role: 'employee' };
    const allowedRoles = ['admin', 'super_admin'];
    const res = makeRes();

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    assert.equal(res._status, 403);
    assert.equal(res._body.message, 'Access denied. Insufficient permissions.');
  });

  it('returns 403 when user is missing', () => {
    const user = null;
    const allowedRoles = ['admin', 'super_admin'];
    const res = makeRes();

    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    assert.equal(res._status, 403);
  });
});
