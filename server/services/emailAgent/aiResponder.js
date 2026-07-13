/**
 * aiResponder.js — Core orchestrator for the Email AI Sales Agent.
 * Processes a single inbound email through the full 12-step pipeline:
 * unsubscribe checks → thread upsert → escalation checks → AI generation
 * → HTML formatting → send → log → DB update.
 */

import crypto from 'node:crypto';
import pool from '../../config/db.js';
import { generateAIReply } from '../../utils/ai.js';
import { sendMail } from '../../utils/mailer.js';
import { writeLog, detectModelUsed } from './replyLogger.js';
import * as escalationService from './escalationService.js';

// ─── System Prompt Cache ─────────────────────────────────────────────────────

let _systemPromptCache = null;
let _systemPromptCachedAt = 0;
const SYSTEM_PROMPT_CACHE_TTL_MS = 30_000;

/** Hardcoded fallback — used when system_settings has no value for key */
const SEEVORA_SALES_SYSTEM_PROMPT = `You are Seevora's AI Sales Representative handling inbound email enquiries. Your job is to engage prospective clients with helpful, conversion-focused responses that reflect Seevora's brand voice: warm, knowledgeable, and confident.

## Company Overview

Seevora Private Limited is an AI automation company based in Indore, Madhya Pradesh, India. We help SMBs and growing enterprises eliminate repetitive workflows and scale their customer communication using custom AI solutions.

Contact: info@seevora.in | +91 82692 97967 | https://seevora.in

## Our Services

1. **AI Voice Receptionist**
   - Handles missed calls 24/7 automatically
   - Books appointments and captures customer intent
   - Routes urgent queries to human staff
   - Supports Hindi, English, and Hinglish

2. **WhatsApp Business Automation**
   - Automated booking confirmations and reminders
   - Follow-up sequences and payment link distribution
   - Document collection and customer status updates
   - Multi-language support

3. **Custom Integrations**
   - Calendar and scheduling systems
   - Billing and accounting software (Tally, Zoho Books)
   - EMR/LIS systems for healthcare
   - CRM pipelines and UPI payment workflows

4. **Multi-language Support**
   - Hindi-first conversational AI
   - English and Hinglish supported natively
   - Natural regional language handling

## Target Industries

Healthcare & Clinics, Education & Coaching, Personal Care & Wellness, Diagnostics & Pathology, Fitness & Gyms, Legal / CA / Financial Advisory, Real Estate & Property

## Implementation

- Typical setup: 5 business days after workflow audit
- Includes discovery call, rule mapping, and testing phase
- Custom pricing based on modules, volume, and integrations required

## Your Instructions

**DO:**
- Greet the sender warmly by name if provided
- Identify their business challenge or question and address it directly
- Highlight the Seevora service most relevant to their enquiry
- Share brief, specific use-case examples when helpful
- Always include a clear call-to-action: book a discovery call at https://seevora.in/book-a-call
- Keep replies concise (150–250 words maximum)
- Sign off as "The Seevora Team"

**DO NOT:**
- Reveal that you are an AI unless directly and explicitly asked
- Provide specific pricing; instead invite them to book a call for a custom quote
- Make guarantees about outcomes or ROI
- Answer questions unrelated to business automation or Seevora
- Continue responding after 5 email exchanges; escalate instead

## Tone

Professional yet approachable. Think: helpful expert colleague, not corporate brochure.
Use short sentences. Avoid jargon. Be direct and confident.`;

// ─── Constants ───────────────────────────────────────────────────────────────

export const UNSUB_KEYWORDS = ['unsubscribe', 'stop emails', 'remove me', 'opt out'];

export const ESCALATION_KEYWORDS = [
  'speak to a human',
  'talk to a person',
  'human agent',
  'real person',
  'contact a representative',
];

export const CONVERSION_KEYWORDS = [
  'book a call',
  'schedule a meeting',
  'interested in your services',
  'want to know more',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Read MAX_AI_REPLIES_PER_THREAD from system_settings,
 * fall back to env var, then default 5.
 * @returns {Promise<number>}
 */
export async function getMaxReplies() {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'max_ai_replies_per_thread' LIMIT 1`
    );
    if (rows[0]?.value) {
      const parsed = parseInt(rows[0].value, 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
  } catch (err) {
    console.error('[aiResponder] Failed to read max_ai_replies_per_thread from DB:', err.message);
  }
  const envVal = parseInt(process.env.MAX_AI_REPLIES_PER_THREAD, 10);
  return !isNaN(envVal) && envVal >= 1 ? envVal : 5;
}

/**
 * Get the system prompt. Uses a 30-second in-memory cache.
 * Falls back to SEEVORA_SALES_SYSTEM_PROMPT constant if DB has no value.
 * @returns {Promise<string>}
 */
async function getSystemPrompt() {
  const now = Date.now();
  if (_systemPromptCache && now - _systemPromptCachedAt < SYSTEM_PROMPT_CACHE_TTL_MS) {
    return _systemPromptCache;
  }
  try {
    const { rows } = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'email_agent_system_prompt' LIMIT 1`
    );
    if (rows[0]?.value) {
      _systemPromptCache = rows[0].value;
      _systemPromptCachedAt = now;
      return _systemPromptCache;
    }
  } catch (err) {
    console.error('[aiResponder] Failed to read system prompt from DB:', err.message);
  }
  // Cache the fallback too, to avoid hammering DB on every call
  _systemPromptCache = SEEVORA_SALES_SYSTEM_PROMPT;
  _systemPromptCachedAt = now;
  return _systemPromptCache;
}

/**
 * Upsert a thread record for the given inbound email.
 * Creates on first message; increments total_messages and updates
 * last_activity_at on subsequent messages.
 * @param {object} inboundEmail
 * @returns {Promise<object>} The thread row
 */
async function upsertThread(inboundEmail) {
  const { rows } = await pool.query(
    `INSERT INTO email_threads (thread_id, from_email, from_name, subject, source, total_messages)
     VALUES ($1, $2, $3, $4, $5, 1)
     ON CONFLICT (thread_id) DO UPDATE
       SET total_messages  = email_threads.total_messages + 1,
           last_activity_at = NOW()
     RETURNING *`,
    [
      inboundEmail.thread_id,
      inboundEmail.from_email,
      inboundEmail.from_name || null,
      inboundEmail.subject || null,
      inboundEmail.source || 'imap',
    ]
  );
  return rows[0];
}

/**
 * Build the thread history array for generateAIReply.
 * Queries inbound_emails (sender='user') and email_agent_reply_logs (sender='agent')
 * for the thread, merges, sorts ASC, and returns the last 10.
 * @param {string} threadId
 * @returns {Promise<Array<{ sender: 'user'|'agent', text: string }>>}
 */
async function buildThreadHistory(threadId) {
  const { rows } = await pool.query(
    `SELECT 'user' AS sender, body AS text, created_at
     FROM inbound_emails
     WHERE thread_id = $1
       AND status <> 'quarantined'

     UNION ALL

     SELECT 'agent' AS sender, reply_body_text AS text, created_at
     FROM email_agent_reply_logs
     WHERE thread_id = $1

     ORDER BY created_at ASC
     LIMIT 10`,
    [threadId]
  );
  return rows.map(r => ({ sender: r.sender, text: r.text }));
}

/**
 * Build Seevora-branded HTML reply wrapping the AI-generated plain text.
 * @param {object} inboundEmail
 * @param {string} replyText
 * @returns {string}
 */
function buildReplyHtml(inboundEmail, replyText) {
  const firstName = inboundEmail.from_name
    ? inboundEmail.from_name.split(' ')[0]
    : '';
  const bodyHtml = replyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Seevora</title>
<style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
  .header{background:#0a0a0a;padding:28px 36px;text-align:center;}
  .logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
  .logo span{color:#14c9e1;}
  .tagline{font-size:12px;color:#94a3b8;margin-top:4px;}
  .body{padding:36px 36px 28px;}
  .body p{font-size:15px;color:#475569;line-height:1.7;margin:0 0 14px;}
  .cta{display:inline-block;margin:20px 0;padding:13px 28px;background:#0a0a0a;color:#fff!important;text-decoration:none;border-radius:100px;font-size:14px;font-weight:700;}
  .footer{background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #e2e8f0;}
  .footer p{font-size:12px;color:#94a3b8;margin:0;line-height:1.8;}
  .footer a{color:#14c9e1;text-decoration:none;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Seevora<span>.</span></div>
    <div class="tagline">AI-Powered Business Automation</div>
  </div>
  <div class="body">
    ${firstName ? `<p><strong>Hi ${firstName},</strong></p>` : ''}
    <p>${bodyHtml}</p>
    <a href="https://seevora.in/book-a-call" class="cta">Book a Free Discovery Call →</a>
  </div>
  <div class="footer">
    <p><strong>Seevora Private Limited</strong><br/>
    Indore, Madhya Pradesh, India<br/>
    <a href="tel:+918269297967">+91 82692 97967</a> &nbsp;|&nbsp;
    <a href="mailto:info@seevora.in">info@seevora.in</a><br/>
    <a href="https://seevora.in">seevora.in</a></p>
    <p style="margin-top:10px;font-size:11px;">
      &copy; ${new Date().getFullYear()} Seevora Private Limited. All rights reserved.
    </p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Handle an unsubscribe request from an inbound email.
 * Sends a confirmation email; only updates subscribers table if the mail succeeds
 * (per Requirement 6.3). Always marks the inbound email as 'unsubscribed'.
 * @param {object} inboundEmail
 * @returns {Promise<void>}
 */
async function handleUnsubscribe(inboundEmail) {
  const unsubText = `You've been unsubscribed from Seevora's automated emails. You will no longer receive automated replies from our system.

If you ever wish to re-engage with us, you're always welcome to reach out at info@seevora.in or visit https://seevora.in.

Warm regards,
The Seevora Team`;

  const firstName = inboundEmail.from_name
    ? inboundEmail.from_name.split(' ')[0]
    : '';

  const unsubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Seevora — Unsubscribed</title>
<style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
  .header{background:#0a0a0a;padding:28px 36px;text-align:center;}
  .logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
  .logo span{color:#14c9e1;}
  .tagline{font-size:12px;color:#94a3b8;margin-top:4px;}
  .body{padding:36px 36px 28px;}
  .body p{font-size:15px;color:#475569;line-height:1.7;margin:0 0 14px;}
  .footer{background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #e2e8f0;}
  .footer p{font-size:12px;color:#94a3b8;margin:0;line-height:1.8;}
  .footer a{color:#14c9e1;text-decoration:none;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Seevora<span>.</span></div>
    <div class="tagline">AI-Powered Business Automation</div>
  </div>
  <div class="body">
    ${firstName ? `<p><strong>Hi ${firstName},</strong></p>` : ''}
    <p>You've been unsubscribed from Seevora's automated emails. You will no longer receive automated replies from our system.</p>
    <p>If you ever wish to re-engage with us, you're always welcome to reach out at <a href="mailto:info@seevora.in">info@seevora.in</a> or visit <a href="https://seevora.in">seevora.in</a>.</p>
    <p>Warm regards,<br/><strong>The Seevora Team</strong></p>
  </div>
  <div class="footer">
    <p><strong>Seevora Private Limited</strong><br/>
    Indore, Madhya Pradesh, India<br/>
    <a href="tel:+918269297967">+91 82692 97967</a> &nbsp;|&nbsp;
    <a href="mailto:info@seevora.in">info@seevora.in</a><br/>
    <a href="https://seevora.in">seevora.in</a></p>
    <p style="margin-top:10px;font-size:11px;">
      &copy; ${new Date().getFullYear()} Seevora Private Limited. All rights reserved.
    </p>
  </div>
</div>
</body>
</html>`;

  const subject = 'You have been unsubscribed from Seevora emails';

  // Attempt to send confirmation email
  const mailResult = await sendMail({
    to: inboundEmail.from_email,
    subject,
    html: unsubHtml,
    text: unsubText,
  });

  if (mailResult.success) {
    // Only upsert subscribers if confirmation mail succeeded (Req 6.3)
    try {
      await pool.query(
        `INSERT INTO subscribers (id, email, status, updated_at)
         VALUES ($1, LOWER($2), 'unsubscribed', NOW())
         ON CONFLICT (email) DO UPDATE
           SET status = 'unsubscribed', updated_at = NOW()`,
        [crypto.randomUUID(), inboundEmail.from_email]
      );
    } catch (err) {
      console.error('[aiResponder] Failed to upsert unsubscribed subscriber:', err.message);
    }

    // Log the confirmation email
    const threadId = inboundEmail.thread_id || inboundEmail.from_email;
    await writeLog({
      threadId,
      inboundEmailId: inboundEmail.id,
      toEmail: inboundEmail.from_email,
      subject,
      replyBodyHtml: unsubHtml,
      replyBodyText: unsubText,
      aiModelUsed: null,
      source: 'unsubscribe_confirm',
      status: 'sent',
      errorMessage: null,
      escalationReason: null,
      processingDurationMs: null,
    });

    console.log(`[aiResponder] unsubscribe_processed — ${inboundEmail.from_email}`);
  } else {
    // Per Req 6.3: do NOT update subscribers if mail fails
    console.error(
      `[aiResponder] Failed to send unsubscribe confirmation to ${inboundEmail.from_email}:`,
      mailResult.error
    );
  }

  // Always update inbound_email status
  try {
    await pool.query(
      `UPDATE inbound_emails SET status = 'unsubscribed' WHERE id = $1`,
      [inboundEmail.id]
    );
  } catch (err) {
    console.error('[aiResponder] Failed to update inbound_email status to unsubscribed:', err.message);
  }
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

/**
 * Process a single inbound email and send an AI reply if all conditions are met.
 * @param {object} inboundEmail - Row from inbound_emails
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function processInboundEmail(inboundEmail) {
  const startTime = Date.now();

  // ── Step 1: Check if sender is unsubscribed ──────────────────────────────
  try {
    const { rows: subRows } = await pool.query(
      `SELECT status FROM subscribers WHERE LOWER(email) = LOWER($1)`,
      [inboundEmail.from_email]
    );
    if (subRows[0]?.status === 'unsubscribed') {
      console.log(`[aiResponder] Skipping unsubscribed sender: ${inboundEmail.from_email}`);
      return { sent: false, reason: 'unsubscribed' };
    }
  } catch (err) {
    console.error('[aiResponder] Failed to check subscriber status:', err.message);
    // Non-fatal — proceed; better to reply than silently drop
  }

  // ── Step 2: Detect unsubscribe keywords in body ──────────────────────────
  const bodyLower = (inboundEmail.body || '').toLowerCase();
  if (UNSUB_KEYWORDS.some(kw => bodyLower.includes(kw))) {
    await handleUnsubscribe(inboundEmail);
    return { sent: false, reason: 'unsubscribe_processed' };
  }

  // ── Step 3: Upsert thread record ─────────────────────────────────────────
  let thread;
  try {
    thread = await upsertThread(inboundEmail);
  } catch (err) {
    console.error('[aiResponder] Failed to upsert thread:', err.message);
    return { sent: false, reason: 'thread_upsert_failed' };
  }

  // ── Step 4: Check escalation / auto_reply disabled ───────────────────────
  if (thread.escalated || !thread.auto_reply_enabled) {
    console.log(
      `[aiResponder] Skipping thread ${thread.thread_id} — escalated=${thread.escalated}, auto_reply_enabled=${thread.auto_reply_enabled}`
    );
    return { sent: false, reason: 'escalated_or_disabled' };
  }

  // ── Step 5: Check escalation triggers BEFORE generating reply ────────────
  const maxReplies = await getMaxReplies();
  const hasEscalationKeyword = ESCALATION_KEYWORDS.some(kw => bodyLower.includes(kw));
  const replyLimitReached = thread.ai_reply_count >= maxReplies;

  if (hasEscalationKeyword || replyLimitReached) {
    const reason = hasEscalationKeyword ? 'human_request' : 'reply_limit_reached';
    console.log(`[aiResponder] Escalating thread ${thread.thread_id} — reason: ${reason}`);
    try {
      await escalationService.escalateThread(thread, inboundEmail, reason);
    } catch (err) {
      console.error('[aiResponder] escalateThread failed:', err.message);
    }
    return { sent: false, reason: 'escalated' };
  }

  // ── Step 6: Detect conversion keywords ──────────────────────────────────
  const hasConversionSignal = CONVERSION_KEYWORDS.some(kw => bodyLower.includes(kw));
  if (hasConversionSignal && !thread.converted) {
    try {
      await pool.query(
        `UPDATE email_threads SET converted = true WHERE thread_id = $1`,
        [thread.thread_id]
      );
      console.log(`[aiResponder] Potential conversion flagged for thread ${thread.thread_id}`);
    } catch (err) {
      console.error('[aiResponder] Failed to flag conversion:', err.message);
    }
  }

  // ── Step 7: Build thread history ─────────────────────────────────────────
  let history = [];
  try {
    history = await buildThreadHistory(thread.thread_id);
  } catch (err) {
    console.error('[aiResponder] Failed to build thread history:', err.message);
    // Non-fatal — continue with empty history
  }

  // ── Step 8: Get system prompt ─────────────────────────────────────────────
  const systemPrompt = await getSystemPrompt();

  // ── Step 9: Call AI ───────────────────────────────────────────────────────
  let replyText;
  try {
    // Truncate body to prevent 413 Request too large errors on free tier
    const safeBody = (inboundEmail.body || '').substring(0, 5000);
    
    replyText = await generateAIReply({
      prompt: safeBody,
      systemPrompt,
      thread: history,
      context: 'email'
    });
  } catch (err) {
    console.error('[aiResponder] generateAIReply threw:', err.message);
    replyText = null;
  }

  if (!replyText) {
    // console.warn(`[aiResponder] AI returned empty response for inbound_email ${inboundEmail.id}`);
    try {
      await pool.query(
        `UPDATE inbound_emails SET status = 'needs_review' WHERE id = $1`,
        [inboundEmail.id]
      );
    } catch (err) {
      console.error('[aiResponder] Failed to set status=needs_review:', err.message);
    }
    return { sent: false, reason: 'ai_empty_response' };
  }

  console.log(`[aiResponder] ai_reply_generated — thread=${thread.thread_id}, model=${detectModelUsed()}`);

  // ── Step 10: Format reply ─────────────────────────────────────────────────
  const replyHtml = buildReplyHtml(inboundEmail, replyText);
  const replySubject = inboundEmail.subject?.startsWith('Re:')
    ? inboundEmail.subject
    : `Re: ${inboundEmail.subject || 'Your enquiry'}`;

  // ── Step 11: Send and log ─────────────────────────────────────────────────
  const mailResult = await sendMail({
    to: inboundEmail.from_email,
    subject: replySubject,
    html: replyHtml,
    text: replyText,
  });

  const duration = Date.now() - startTime;

  if (mailResult.success) {
    console.log(
      `[aiResponder] reply_sent — thread=${thread.thread_id}, to=${inboundEmail.from_email}, duration=${duration}ms`
    );
  } else {
    console.error(
      `[aiResponder] reply_failed — thread=${thread.thread_id}, to=${inboundEmail.from_email}, error=${mailResult.error}, duration=${duration}ms`
    );
  }

  await writeLog({
    threadId: thread.thread_id,
    inboundEmailId: inboundEmail.id,
    toEmail: inboundEmail.from_email,
    subject: replySubject,
    replyBodyHtml: replyHtml,
    replyBodyText: replyText,
    aiModelUsed: detectModelUsed(),
    source: 'ai',
    status: mailResult.success ? 'sent' : 'failed',
    errorMessage: mailResult.error || null,
    escalationReason: null,
    processingDurationMs: duration,
  });

  // ── Step 12: Update DB counters ──────────────────────────────────────────
  const newStatus = mailResult.success ? 'replied' : 'send_failed';
  try {
    await pool.query(
      `UPDATE inbound_emails
       SET status = $2, processed_at = NOW(), processing_duration_ms = $3
       WHERE id = $1`,
      [inboundEmail.id, newStatus, duration]
    );
  } catch (err) {
    console.error('[aiResponder] Failed to update inbound_email status:', err.message);
  }

  if (mailResult.success) {
    try {
      await pool.query(
        `UPDATE email_threads
         SET ai_reply_count = ai_reply_count + 1, last_activity_at = NOW()
         WHERE thread_id = $1`,
        [thread.thread_id]
      );
    } catch (err) {
      console.error('[aiResponder] Failed to increment ai_reply_count:', err.message);
    }
  }

  return { sent: mailResult.success };
}
