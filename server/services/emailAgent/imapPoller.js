import Imap from 'imap';
import { simpleParser } from 'mailparser';
import crypto from 'node:crypto';
import pool from '../../config/db.js';
import {
  MAX_RAW_MESSAGE_BYTES,
  hashMessageIdentity,
  prepareInboundMessage,
  prepareMalformedMessage,
} from './inboundSecurity.js';

export { deriveThreadId } from './inboundSecurity.js';

function writeStructuredLog(level, event, details = {}) {
  const payload = JSON.stringify({
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
  const writer = console[level] || console.log;
  writer(payload);
}

export function createImapConfig(env = process.env) {
  const host = String(env.IMAP_HOST || '').trim();
  const user = String(env.IMAP_USER || '').trim();
  const password = String(env.IMAP_PASS || '');
  const port = Number(env.IMAP_PORT || 993);
  const secureSetting = String(env.IMAP_SECURE ?? 'true').trim().toLowerCase();

  if (!host || !user || !password) {
    throw new Error('IMAP credentials are not configured');
  }
  if (port !== 993 || secureSetting !== 'true') {
    throw new Error('IMAP must use TLS on port 993');
  }

  return {
    user,
    password,
    host,
    port,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: true,
      servername: host,
    },
    connTimeout: 15000,
    authTimeout: 10000,
  };
}

export function markSequenceNumbersSeen(imap, sequenceNumbers, callback) {
  return imap.seq.addFlags(sequenceNumbers, ['\\Seen'], callback);
}

/**
 * Start the IMAP polling loop. Called once from server/index.js.
 * Reads IMAP_POLL_INTERVAL_SECONDS (30-3600, default 60).
 */
export function startImapPoller() {
  let config;
  try {
    config = createImapConfig();
  } catch (error) {
    writeStructuredLog('error', 'imap_configuration_rejected', { error: error.message });
    return;
  }

  // Validate and set poll interval
  const rawInterval = parseInt(process.env.IMAP_POLL_INTERVAL_SECONDS, 10);
  const intervalSeconds = Number.isInteger(rawInterval) && rawInterval >= 30 && rawInterval <= 3600
    ? rawInterval
    : 60;

  if (!Number.isInteger(rawInterval) || rawInterval < 30 || rawInterval > 3600) {
    console.warn(
      `[ImapPoller] Invalid IMAP_POLL_INTERVAL_SECONDS: ${process.env.IMAP_POLL_INTERVAL_SECONDS}. Using default: 60s`
    );
  }

  writeStructuredLog('log', 'imap_poller_started', { interval_seconds: intervalSeconds });

  let pollInProgress = false;
  const runPoll = async () => {
    if (pollInProgress) {
      writeStructuredLog('warn', 'imap_poll_skipped', { reason: 'previous_poll_running' });
      return;
    }

    pollInProgress = true;
    try {
      await pollOnce(config);
    } catch (err) {
      writeStructuredLog('error', 'imap_poll_failed', { error: err.message });
    } finally {
      pollInProgress = false;
    }
  };

  void runPoll();
  return setInterval(runPoll, intervalSeconds * 1000);
}

/**
 * Single poll execution. Connects to IMAP, fetches UNSEEN messages,
 * saves to DB, marks as SEEN, disconnects.
 * @returns {Promise<{ fetched: number, saved: number, errors: string[] }>}
 */
export async function pollOnce(config = createImapConfig()) {
  const result = { fetched: 0, saved: 0, quarantined: 0, duplicates: 0, errors: [] };

  return new Promise((resolve) => {
    const imap = new Imap(config);

    let boxClosed = false;

    const cleanup = () => {
      if (!boxClosed) {
        try {
          imap.end();
        } catch {
          // Ignore cleanup errors
        }
      }
    };

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, _box) => {
        if (err) {
          console.error('[ImapPoller] Failed to open INBOX:', err.message);
          result.errors.push(err.message);
          cleanup();
          return resolve(result);
        }

        // Search for UNSEEN messages
        imap.search(['UNSEEN'], async (searchErr, uids) => {
          if (searchErr) {
            console.error('[ImapPoller] Search error:', searchErr.message);
            result.errors.push(searchErr.message);
            cleanup();
            return resolve(result);
          }

          if (!uids || uids.length === 0) {
            console.log('[ImapPoller] No new messages');
            cleanup();
            return resolve(result);
          }

          result.fetched = uids.length;
          console.log(`[ImapPoller] Found ${uids.length} unseen message(s)`);

          const fetch = imap.fetch(uids, { bodies: '' });
          const processedSequenceNumbers = [];
          const messagePromises = [];

          fetch.on('message', (msg, seqno) => {
            const chunks = [];
            let retainedBytes = 0;
            let rawBytes = 0;

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                rawBytes += data.length;

                const remaining = MAX_RAW_MESSAGE_BYTES - retainedBytes;
                if (remaining > 0) {
                  const retained = data.subarray(0, remaining);
                  chunks.push(retained);
                  retainedBytes += retained.length;
                }
              });
            });

            const p = new Promise((resolveMsg) => {
              msg.once('end', async () => {
                try {
                  const rawMessage = Buffer.concat(chunks);
                  let inbound;
                  try {
                    const parsed = await simpleParser(rawMessage);
                    inbound = prepareInboundMessage(parsed, {
                      rawBytes,
                      mailboxAddress: config.user,
                      smtpUser: process.env.SMTP_USER,
                      smtpFrom: process.env.SMTP_FROM,
                    });
                  } catch (parseError) {
                    inbound = prepareMalformedMessage(rawMessage, rawBytes, config.user);
                    writeStructuredLog('warn', 'imap_message_parse_failed', {
                      error: parseError.message,
                      identity: hashMessageIdentity(inbound.messageId),
                    });
                  }

                  const saveResult = await saveInboundEmail(inbound);

                  if (saveResult.status === 'saved') {
                    processedSequenceNumbers.push(seqno);
                    result.saved++;

                    if (inbound.quarantineReason) {
                      result.quarantined++;
                      writeStructuredLog('warn', 'imap_message_quarantined', {
                        inbound_email_id: saveResult.id,
                        reason: inbound.quarantineReason,
                        identity: hashMessageIdentity(inbound.messageId),
                      });
                      resolveMsg({ success: true, row: null });
                      return;
                    }

                    const inboundRow = {
                      id: saveResult.id,
                      from_email: inbound.fromEmail,
                      from_name: inbound.fromName,
                      subject: inbound.subject,
                      body: inbound.body,
                      thread_id: inbound.threadId,
                      source: 'imap',
                    };

                    resolveMsg({ success: true, row: inboundRow });
                  } else if (saveResult.status === 'duplicate') {
                    processedSequenceNumbers.push(seqno);
                    result.duplicates++;
                    writeStructuredLog('log', 'imap_message_duplicate', {
                      identity: hashMessageIdentity(inbound.messageId),
                    });
                    resolveMsg({ success: true, row: null });
                  } else {
                    result.errors.push(`Failed to save message ${seqno} after retries`);
                    resolveMsg({ success: false });
                  }
                } catch (parseErr) {
                  console.error('[ImapPoller] Parse error:', parseErr.message);
                  result.errors.push(parseErr.message);
                  resolveMsg({ success: false });
                }
              });
            });
            messagePromises.push(p);
          });

          fetch.once('error', (fetchErr) => {
            console.error('[ImapPoller] Fetch error:', fetchErr.message);
            result.errors.push(fetchErr.message);
          });

          fetch.once('end', async () => {
            // Wait for all messages to finish DB saves and parsing
            const results = await Promise.all(messagePromises);
            const successfulRows = results.filter(r => r.success && r.row).map(r => r.row);

            const completePoll = async () => {
              cleanup();
              
              // 🔑 Trigger AI auto-reply pipeline SEQUENTIALLY to prevent network overload
              if (successfulRows.length > 0) {
                console.log(`[ImapPoller] Processing ${successfulRows.length} AI replies sequentially...`);
                try {
                  const { processInboundEmail } = await import('./aiResponder.js');
                  for (const row of successfulRows) {
                    try {
                      await processInboundEmail(row);
                      // Wait 8 seconds between emails to respect Groq's 6000 TPM limit on free tier
                      await new Promise(resolve => setTimeout(resolve, 8000));
                    } catch (aiErr) {
                      writeStructuredLog('error', 'imap_ai_processing_failed', {
                        inbound_email_id: row.id,
                        error: aiErr.message,
                      });
                    }
                  }
                } catch (aiImportErr) {
                  writeStructuredLog('error', 'imap_ai_module_load_failed', { error: aiImportErr.message });
                }
              }
              resolve(result);
            };

            // Mark all successfully processed messages as SEEN
            if (processedSequenceNumbers.length > 0) {
              markSequenceNumbersSeen(imap, processedSequenceNumbers, (flagErr) => {
                if (flagErr) {
                  console.error('[ImapPoller] Failed to mark as SEEN:', flagErr.message);
                }
                completePoll();
              });
            } else {
              completePoll();
            }
          });
        });
      });
    });

    imap.once('error', (err) => {
      writeStructuredLog('error', 'imap_poll_error', { error: err.message });
      result.errors.push(err.message);
      cleanup();
      resolve(result);
    });

    imap.once('end', () => {
      boxClosed = true;
    });

    imap.connect();
  });
}

/**
 * DB retry helper — tries to save to inbound_emails, retries up to 3 times with 5s delay.
 * @param {object} data
 * @returns {Promise<{status: 'saved'|'duplicate'|'failed', id?: string}>}
 */
export async function saveInboundEmail(data, query = pool.query.bind(pool)) {
  const maxAttempts = 3;
  const delayMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { rows } = await query(
        `INSERT INTO inbound_emails (
          id, from_email, from_name, to_email, subject, body, source, thread_id,
          message_id, in_reply_to, status, quarantine_reason, processed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11::VARCHAR(40), $12::VARCHAR(80),
          CASE WHEN $11::VARCHAR(40) = 'quarantined' THEN NOW() ELSE NULL END
        )
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          crypto.randomUUID(),
          data.fromEmail,
          data.fromName,
          data.toEmail,
          data.subject,
          data.body,
          data.source,
          data.threadId,
          data.messageId,
          data.inReplyTo,
          data.status,
          data.quarantineReason,
        ]
      );

      if (!rows[0]) return { status: 'duplicate' };
      return { status: 'saved', id: rows[0].id };
    } catch (err) {
      writeStructuredLog('error', 'imap_db_save_retry', {
        attempt,
        max_attempts: maxAttempts,
        error: err.message,
      });

      if (attempt < maxAttempts) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        // All attempts exhausted
        writeStructuredLog('error', 'imap_db_save_failed', { error: err.message });
        return { status: 'failed' };
      }
    }
  }

  return { status: 'failed' };
}
