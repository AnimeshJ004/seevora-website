import pool from '../config/db.js';

const MIGRATION_LOCK_ID = 742019451;
const DELETE_BATCH_SIZE = 5000;
export const INBOUND_EMAIL_UNIQUE_INDEX = 'idx_inbound_emails_imap_message_id_unique';

function writeMigrationLog(logger, event, details = {}) {
  const payload = JSON.stringify({
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
  const writer = logger?.info || logger?.log || console.log;
  writer.call(logger || console, payload);
}

/**
 * Repair historical IMAP duplication and enforce the storage invariants used by
 * the secure poller. Every destructive operation is covered by one transaction.
 */
export async function repairInboundEmailSecurity(
  database = pool,
  { ownAddress = process.env.IMAP_USER || '', logger = console } = {}
) {
  const client = await database.connect();
  const startedAt = Date.now();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK_ID]);
    await client.query('LOCK TABLE inbound_emails IN SHARE ROW EXCLUSIVE MODE');

    await client.query(`
      ALTER TABLE inbound_emails
      ADD COLUMN IF NOT EXISTS quarantine_reason VARCHAR(80)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reply_logs_inbound_email_id
      ON email_agent_reply_logs(inbound_email_id)
    `);

    await client.query(`
      CREATE TEMP TABLE inbound_email_duplicate_map ON COMMIT DROP AS
      WITH candidates AS (
        SELECT
          id,
          LOWER(BTRIM(message_id)) AS normalized_message_id,
          CASE
            WHEN status IN ('replied', 'unsubscribed') THEN 0
            WHEN status IN ('needs_review', 'send_failed') THEN 1
            WHEN status = 'quarantined' THEN 2
            WHEN status = 'received' THEN 3
            ELSE 4
          END AS status_priority,
          processed_at IS NULL AS is_unprocessed,
          created_at
        FROM inbound_emails
        WHERE source = 'imap'
          AND NULLIF(BTRIM(message_id), '') IS NOT NULL
      ), ranked AS (
        SELECT
          id AS duplicate_id,
          FIRST_VALUE(id) OVER canonical_order AS canonical_id,
          ROW_NUMBER() OVER canonical_order AS duplicate_rank
        FROM candidates
        WINDOW canonical_order AS (
          PARTITION BY normalized_message_id
          ORDER BY status_priority, is_unprocessed, created_at, id
        )
      )
      SELECT duplicate_id, canonical_id
      FROM ranked
      WHERE duplicate_rank > 1
    `);

    await client.query(`
      CREATE INDEX inbound_email_duplicate_map_id_idx
      ON inbound_email_duplicate_map(duplicate_id)
    `);

    const duplicateCountResult = await client.query(`
      SELECT COUNT(1)::int AS count
      FROM inbound_email_duplicate_map
    `);
    const duplicateCount = duplicateCountResult.rows[0]?.count || 0;

    const relinkResult = await client.query(`
      UPDATE email_agent_reply_logs AS logs
      SET inbound_email_id = duplicate_map.canonical_id
      FROM inbound_email_duplicate_map AS duplicate_map
      WHERE logs.inbound_email_id = duplicate_map.duplicate_id
    `);

    let duplicatesDeleted = 0;
    while (true) {
      const deleteBatchResult = await client.query(
        `WITH delete_batch AS (
           DELETE FROM inbound_email_duplicate_map
           WHERE duplicate_id IN (
             SELECT duplicate_id
             FROM inbound_email_duplicate_map
             LIMIT $1
           )
           RETURNING duplicate_id
         )
         DELETE FROM inbound_emails AS inbound
         USING delete_batch
         WHERE inbound.id = delete_batch.duplicate_id`,
        [DELETE_BATCH_SIZE]
      );

      const batchDeleted = deleteBatchResult.rowCount || 0;
      duplicatesDeleted += batchDeleted;
      if (batchDeleted < DELETE_BATCH_SIZE) break;

      if (duplicatesDeleted % 25000 === 0) {
        writeMigrationLog(logger, 'inbound_email_duplicate_cleanup_progress', {
          duplicatesDeleted,
          duplicatesFound: duplicateCount,
        });
      }
    }

    await client.query(`
      UPDATE inbound_emails
      SET message_id = LOWER(BTRIM(message_id))
      WHERE source = 'imap'
        AND NULLIF(BTRIM(message_id), '') IS NOT NULL
        AND message_id IS DISTINCT FROM LOWER(BTRIM(message_id))
    `);

    const quarantineResult = await client.query(
      `UPDATE inbound_emails
       SET status = 'quarantined',
           quarantine_reason = CASE
             WHEN $1 <> '' AND LOWER(from_email) = LOWER($1) THEN 'mail_loop'
             ELSE 'automated_sender'
           END,
           processed_at = COALESCE(processed_at, NOW())
       WHERE source = 'imap'
         AND status IN ('received', 'needs_review', 'send_failed')
         AND (
           ($1 <> '' AND LOWER(from_email) = LOWER($1))
           OR LOWER(SPLIT_PART(from_email, '@', 1))
             ~ '^(no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer[-_.]?daemon|postmaster)([+._-].*)?$'
         )`,
      [ownAddress]
    );

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ${INBOUND_EMAIL_UNIQUE_INDEX}
      ON inbound_emails (LOWER(BTRIM(message_id)))
      WHERE source = 'imap'
        AND NULLIF(BTRIM(message_id), '') IS NOT NULL
    `);

    await client.query(`
      WITH inbound_counts AS (
        SELECT thread_id, COUNT(1)::int AS message_count
        FROM inbound_emails
        WHERE source = 'imap'
          AND thread_id IS NOT NULL
        GROUP BY thread_id
      )
      UPDATE email_threads AS threads
      SET total_messages = inbound_counts.message_count,
          updated_at = NOW()
      FROM inbound_counts
      WHERE threads.thread_id = inbound_counts.thread_id
        AND threads.source = 'imap'
    `);

    const invariantResult = await client.query(`
      SELECT COUNT(1)::int AS count
      FROM (
        SELECT LOWER(BTRIM(message_id))
        FROM inbound_emails
        WHERE source = 'imap'
          AND NULLIF(BTRIM(message_id), '') IS NOT NULL
        GROUP BY LOWER(BTRIM(message_id))
        HAVING COUNT(1) > 1
      ) AS duplicate_groups
    `);

    if ((invariantResult.rows[0]?.count || 0) !== 0) {
      throw new Error('Duplicate IMAP message identifiers remain after cleanup');
    }

    await client.query('ANALYZE inbound_emails');
    await client.query('COMMIT');

    const result = {
      duplicatesFound: duplicateCount,
      duplicatesDeleted,
      replyLogsRelinked: relinkResult.rowCount || 0,
      messagesQuarantined: quarantineResult.rowCount || 0,
      durationMs: Date.now() - startedAt,
    };
    writeMigrationLog(logger, 'inbound_email_security_repair_complete', result);
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    writeMigrationLog(logger, 'inbound_email_security_repair_failed', {
      error: error.message,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  } finally {
    client.release();
  }
}

export async function assertInboundEmailSecuritySchema(database = pool) {
  const { rows } = await database.query(
    `SELECT
       EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'inbound_emails'
           AND column_name = 'quarantine_reason'
       ) AS has_quarantine_reason,
       EXISTS (
         SELECT 1
         FROM pg_indexes
         WHERE schemaname = 'public'
           AND tablename = 'inbound_emails'
           AND indexname = $1
       ) AS has_unique_index`,
    [INBOUND_EMAIL_UNIQUE_INDEX]
  );

  if (!rows[0]?.has_quarantine_reason || !rows[0]?.has_unique_index) {
    throw new Error('Secure inbound email schema is not ready; IMAP polling remains disabled');
  }

  return true;
}
