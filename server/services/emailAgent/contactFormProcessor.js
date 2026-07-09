import crypto from 'node:crypto';
import pool from '../../config/db.js';

// ─── Public exports ──────────────────────────────────────────────────────────

/**
 * Start the contact form polling loop. Called once from server/index.js.
 * Runs processNewContactForms immediately (after 5 s) then every 60 s.
 */
export function startContactFormProcessor() {
  // Immediate run after a short delay so DB init can finish
  setTimeout(() => {
    processNewContactForms().catch((err) =>
      console.error('[ContactFormProcessor] Startup run error:', err.message)
    );
  }, 5_000);

  setInterval(() => {
    processNewContactForms().catch((err) =>
      console.error('[ContactFormProcessor] Interval run error:', err.message)
    );
  }, 60_000);
}

/**
 * Derive a stable thread_id for a contact form submission.
 * sha256(normalised_email + '::' + normalised_subject) — deterministic.
 *
 * @param {string} fromEmail
 * @param {string} subject
 * @returns {string} hex thread_id
 */
export function deriveContactFormThreadId(fromEmail, subject) {
  const normalised =
    fromEmail.toLowerCase().trim() +
    '::' +
    (subject || '').toLowerCase().trim().replace(/\s+/g, ' ');

  return crypto.createHash('sha256').update(normalised).digest('hex');
}

// ─── Internal ─────────────────────────────────────────────────────────────────

/**
 * Single processing pass.
 * Queries for unprocessed contact-form rows, assigns thread_ids,
 * upserts email_threads, then hands each row to aiResponder.
 *
 * @returns {Promise<{ processed: number, errors: number }>}
 */
async function processNewContactForms() {
  const { rows } = await pool.query(`
    SELECT *
    FROM inbound_emails
    WHERE source = 'contact_form'
      AND status = 'received'
      AND processed_at IS NULL
      AND created_at >= NOW() - INTERVAL '10 minutes'
    ORDER BY created_at ASC
    LIMIT 20
  `);

  if (rows.length === 0) return { processed: 0, errors: 0 };

  // Lazy import to avoid circular dependency with aiResponder.js
  const { processInboundEmail } = await import('./aiResponder.js');

  let processed = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const threadId = deriveContactFormThreadId(row.from_email, row.subject);

      // Assign thread_id on the inbound_emails row if not already set
      if (!row.thread_id) {
        await pool.query(
          `UPDATE inbound_emails SET thread_id = $1 WHERE id = $2`,
          [threadId, row.id]
        );
      }

      // Upsert the email_threads record
      await pool.query(
        `INSERT INTO email_threads
           (thread_id, from_email, from_name, subject, source, total_messages)
         VALUES ($1, $2, $3, $4, 'contact_form', 1)
         ON CONFLICT (thread_id) DO UPDATE
           SET total_messages   = email_threads.total_messages + 1,
               last_activity_at = NOW()`,
        [threadId, row.from_email, row.from_name ?? null, row.subject ?? null]
      );

      // Build the enriched row that aiResponder expects
      const updatedRow = { ...row, thread_id: threadId };

      await processInboundEmail(updatedRow);

      console.log(
        JSON.stringify({
          event: 'email_received',
          source: 'contact_form',
          thread_id: threadId,
          from_email: row.from_email,
          inbound_email_id: row.id,
          timestamp: new Date().toISOString(),
        })
      );

      processed += 1;
    } catch (err) {
      console.error(
        `[ContactFormProcessor] Error processing inbound_email id=${row.id}:`,
        err.message
      );
      errors += 1;
    }
  }

  return { processed, errors };
}
