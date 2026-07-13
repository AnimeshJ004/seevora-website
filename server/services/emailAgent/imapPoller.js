import Imap from 'imap';
import { simpleParser } from 'mailparser';
import crypto from 'node:crypto';
import pool from '../../config/db.js';

/**
 * Start the IMAP polling loop. Called once from server/index.js.
 * Reads IMAP_POLL_INTERVAL_SECONDS (30-3600, default 60).
 */
export function startImapPoller() {
  // Check if IMAP credentials are configured
  if (!process.env.IMAP_HOST || !process.env.IMAP_USER || !process.env.IMAP_PASS) {
    console.warn('[ImapPoller] IMAP credentials not configured. Polling disabled.');
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

  console.log(`[ImapPoller] Starting with interval: ${intervalSeconds}s`);

  // Start polling loop
  setInterval(async () => {
    try {
      await pollOnce();
    } catch (err) {
      console.error('[ImapPoller] Unhandled error:', err.message);
      // Do NOT rethrow — poller must keep running
    }
  }, intervalSeconds * 1000);
}

/**
 * Single poll execution. Connects to IMAP, fetches UNSEEN messages,
 * saves to DB, marks as SEEN, disconnects.
 * @returns {Promise<{ fetched: number, saved: number, errors: string[] }>}
 */
async function pollOnce() {
  const result = { fetched: 0, saved: 0, errors: [] };

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST,
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 15000,
      authTimeout: 10000,
    });

    let boxClosed = false;

    const cleanup = () => {
      if (!boxClosed) {
        try {
          imap.end();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
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
          const processedUids = [];
          const messagePromises = [];

          fetch.on('message', (msg, seqno) => {
            let buffer = '';

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            const p = new Promise((resolveMsg) => {
              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);

                  // Extract email data
                  const fromEmail = parsed.from?.value?.[0]?.address || parsed.from?.text || '';
                  const fromName = parsed.from?.value?.[0]?.name || '';
                  const subject = parsed.subject || '';
                  const body = parsed.text || '';
                  const messageId = parsed.messageId || '';
                  const inReplyTo = parsed.inReplyTo || '';
                  const references = parsed.references || [];

                  // Derive thread ID
                  const threadId = deriveThreadId(parsed);

                  // Save to DB with retry
                  const savedId = await retryDbSave({
                    fromEmail,
                    fromName,
                    toEmail: process.env.IMAP_USER,
                    subject,
                    body,
                    source: 'imap',
                    threadId,
                    messageId,
                    inReplyTo,
                  });

                  if (savedId) {
                    // Upsert email_threads
                    try {
                      await pool.query(
                        `INSERT INTO email_threads (
                          thread_id, from_email, from_name, subject, source, total_messages, last_activity_at
                        ) VALUES ($1, $2, $3, $4, $5, 1, NOW())
                        ON CONFLICT (thread_id) DO UPDATE SET
                          total_messages = email_threads.total_messages + 1,
                          last_activity_at = NOW()`,
                        [threadId, fromEmail, fromName, subject, 'imap']
                      );
                    } catch (threadErr) {
                      console.error('[ImapPoller] Failed to upsert thread:', threadErr.message);
                    }

                    // Mark as SEEN only after successful DB save
                    processedUids.push(seqno);
                    result.saved++;

                    const inboundRow = {
                      id: savedId,
                      from_email: fromEmail,
                      from_name: fromName,
                      subject,
                      body,
                      thread_id: threadId,
                      source: 'imap',
                    };
                    
                    resolveMsg({ success: true, row: inboundRow });
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
            const successfulRows = results.filter(r => r.success).map(r => r.row);

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
                      console.error('[ImapPoller] AI responder error:', aiErr.message);
                    }
                  }
                } catch (aiImportErr) {
                  console.error('[ImapPoller] Failed to import aiResponder:', aiImportErr.message);
                }
              }
              resolve(result);
            };

            // Mark all successfully processed messages as SEEN
            if (processedUids.length > 0) {
              imap.addFlags(processedUids, ['\\Seen'], (flagErr) => {
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
      console.error('[ImapPoller] IMAP connection error:', err.message);
      console.log(
        JSON.stringify({
          event: 'imap_poll_error',
          error: err.message,
          timestamp: new Date().toISOString(),
        })
      );
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
 * Derive a stable thread_id from email headers.
 * Priority: References header last ID > In-Reply-To > sha256(from+subject).
 * @param {ParsedMail} parsed
 * @returns {string} thread_id
 */
export function deriveThreadId(parsed) {
  // Priority 1: Last ID in References header
  if (parsed.references && Array.isArray(parsed.references) && parsed.references.length > 0) {
    const lastRef = parsed.references[parsed.references.length - 1];
    if (lastRef && typeof lastRef === 'string') {
      return lastRef.trim();
    }
  }

  // Priority 2: In-Reply-To header
  if (parsed.inReplyTo && typeof parsed.inReplyTo === 'string') {
    const inReplyTo = parsed.inReplyTo.trim();
    if (inReplyTo) {
      return inReplyTo;
    }
  }

  // Priority 3: sha256(fromEmail + '::' + subject)
  const fromEmail = (parsed.from?.value?.[0]?.address || parsed.from?.text || '').trim().toLowerCase();
  const subject = (parsed.subject || '').trim();
  const input = `${fromEmail}::${subject}`;

  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * DB retry helper — tries to save to inbound_emails, retries up to 3 times with 5s delay.
 * @param {object} data
 * @returns {Promise<string|null>} Saved row ID or null on failure
 */
async function retryDbSave(data) {
  const maxAttempts = 3;
  const delayMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO inbound_emails (
          id, from_email, from_name, to_email, subject, body, source, thread_id, message_id, in_reply_to, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'received')
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
        ]
      );

      return rows[0].id;
    } catch (err) {
      console.error(`[ImapPoller] DB save attempt ${attempt}/${maxAttempts} failed:`, err.message);

      if (attempt < maxAttempts) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        // All attempts exhausted
        console.error(
          JSON.stringify({
            event: 'db_save_failed',
            error: err.message,
            from_email: data.fromEmail,
            subject: data.subject,
            timestamp: new Date().toISOString(),
          })
        );
        return null;
      }
    }
  }

  return null;
}
