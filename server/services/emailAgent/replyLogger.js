import pool from '../../config/db.js';

/**
 * Detect which AI model is configured for the email agent.
 * Priority: GEMINI_EMAIL_API_KEY → GEMINI_API_KEY → null
 * @returns {string|null}
 */
export function detectModelUsed() {
  if (process.env.GEMINI_EMAIL_API_KEY || process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_EMAIL_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }
  return null;
}

/**
 * Write a reply log entry to email_agent_reply_logs.
 * Non-throwing — catches and logs all errors internally.
 *
 * @param {object} params
 * @param {string} params.threadId
 * @param {string|null} params.inboundEmailId
 * @param {string} params.toEmail
 * @param {string} params.subject
 * @param {string} params.replyBodyHtml
 * @param {string} params.replyBodyText
 * @param {string|null} params.aiModelUsed
 * @param {'ai'|'admin_override'|'escalation'|'unsubscribe_confirm'} params.source
 * @param {'sent'|'failed'} params.status
 * @param {string|null} params.errorMessage
 * @param {string|null} params.escalationReason
 * @param {number|null} params.processingDurationMs
 * @returns {Promise<void>}
 */
export async function writeLog({
  threadId,
  inboundEmailId,
  toEmail,
  subject,
  replyBodyHtml,
  replyBodyText,
  aiModelUsed,
  source,
  status,
  errorMessage,
  escalationReason,
  processingDurationMs,
}) {
  try {
    await pool.query(
      `INSERT INTO email_agent_reply_logs (
        thread_id,
        inbound_email_id,
        to_email,
        subject,
        reply_body_html,
        reply_body_text,
        ai_model_used,
        source,
        status,
        error_message,
        escalation_reason,
        processing_duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        threadId,
        inboundEmailId ?? null,
        toEmail,
        subject,
        replyBodyHtml,
        replyBodyText,
        aiModelUsed ?? null,
        source,
        status,
        errorMessage ?? null,
        escalationReason ?? null,
        processingDurationMs ?? null,
      ]
    );
  } catch (err) {
    console.error('[replyLogger] Failed to write reply log:', err.message);
  }
}
