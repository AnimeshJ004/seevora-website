# Implementation Plan: Email AI Sales Agent

## Overview

Build a fully-automated inbound email handling system for Seevora. The implementation follows the architecture in the design document: DB schema additions → core background services → AI orchestrator → API layer → admin frontend → tests. Every step integrates with existing infrastructure (`generateAIReply`, `sendMail`, `pool`, `requireRole`) without introducing new auth or transport layers.

---

## Tasks

- [x] 1. Database schema — new tables and `inbound_emails` alterations
  - [x] 1.1 Add `email_threads` table and indexes to `server/db/init.js`
    - `CREATE TABLE IF NOT EXISTS email_threads` with all columns from design schema
    - Add four indexes: `idx_threads_from_email`, `idx_threads_thread_id`, `idx_threads_escalated`, `idx_threads_last_activity`
    - Wrap in `.catch(e => console.log(e.message))` consistent with existing pattern
    - _Requirements: 1.2, 1.3, 4.1, 5.1, 5.4_

  - [x] 1.2 Add `email_agent_reply_logs` table and indexes to `server/db/init.js`
    - `CREATE TABLE IF NOT EXISTS email_agent_reply_logs` with all columns from design schema
    - Add four indexes: `idx_reply_logs_thread_id`, `idx_reply_logs_to_email`, `idx_reply_logs_sent_at`, `idx_reply_logs_status`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 1.3 Apply `ALTER TABLE inbound_emails` additions in `server/db/init.js`
    - Add columns: `from_name`, `source` (default `'imap'`), `thread_id`, `message_id`, `in_reply_to`, `processed_at`, `processing_duration_ms`
    - Add indexes: `idx_inbound_emails_thread_id`, `idx_inbound_emails_status`, `idx_inbound_emails_from_email`
    - Use `ADD COLUMN IF NOT EXISTS` pattern; wrap each statement in `.catch(() => {})`
    - _Requirements: 1.2, 2.1, 3.6, 11.4_

- [x] 2. Install npm dependencies
  - [x] 2.1 Add `imap` and `mailparser` packages to `package.json`
    - Run `npm install imap mailparser` (exact versions pinned in package-lock)
    - Verify both packages appear under `dependencies` in `package.json`
    - _Requirements: 1.1_

- [ ] 3. Checkpoint — DB and dependencies ready
  - Verify `initDb()` runs without errors (start server locally, check console)
  - Verify `imap` and `mailparser` resolve without import errors
  - Ask the user if any questions arise before proceeding.

- [x] 4. Core services — foundation utilities
  - [x] 4.1 Implement `replyLogger.js` — `server/services/emailAgent/replyLogger.js`
    - Export `writeLog(params)`: inserts one row into `email_agent_reply_logs`; catches all errors internally and logs to `console.error` — never throws
    - Export `detectModelUsed()`: checks `process.env.ANTHROPIC_API_KEY`, then `OPENAI_API_KEY`, then `GEMINI_API_KEY`; returns model name string or `null`
    - Import `pool` from `../../config/db.js`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 4.2 Implement `escalationService.js` — `server/services/emailAgent/escalationService.js`
    - Export `escalateThread(thread, inboundEmail, reason)`:
      1. `UPDATE email_threads SET escalated=true, auto_reply_enabled=false, escalation_reason=$reason WHERE thread_id=$1`
      2. Build escalation email body from template in design doc; send via `sendMail`
      3. Call `writeLog(...)` with `source='escalation'`
      4. `UPDATE inbound_emails SET status='escalated' WHERE id=$1`
    - Import `pool`, `sendMail`, `writeLog`, `detectModelUsed`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.3 Implement `imapPoller.js` — `server/services/emailAgent/imapPoller.js`
    - Export `startImapPoller()`: validates `IMAP_POLL_INTERVAL_SECONDS` (30–3600, default 60 + warn), schedules `setInterval(pollOnce, intervalMs)`; catches all errors from `pollOnce` without crashing
    - Implement `pollOnce()`: opens IMAP INBOX, searches `UNSEEN`, fetches each message body, parses with `simpleParser`, calls `deriveThreadId(parsed)`, inserts into `inbound_emails` with `source='imap'`, upserts `email_threads`, marks IMAP message as `SEEN` only after successful DB save; returns `{ fetched, saved, errors[] }`
    - Implement `deriveThreadId(parsed)`: References last ID > In-Reply-To > `sha256(from+subject)` fallback
    - Retry DB saves up to 3 times with 5 s delay per Requirement 11.1
    - Emit structured log events: `email_received`, `imap_poll_error`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1, 11.3_

  - [x] 4.4 Implement `contactFormProcessor.js` — `server/services/emailAgent/contactFormProcessor.js`
    - Export `startContactFormProcessor()`: `setInterval(processNewContactForms, 60_000)`; catches errors without crashing
    - Implement `processNewContactForms()`: queries `inbound_emails` for `source='contact_form' AND status='received' AND processed_at IS NULL AND created_at >= NOW() - INTERVAL '10 minutes'` LIMIT 20; assigns `thread_id` via `deriveContactFormThreadId`; calls `processInboundEmail` for each row; returns `{ processed, errors }`
    - Implement `deriveContactFormThreadId(fromEmail, subject)`: `sha256(lowerCase(fromEmail) + '::' + normalised(subject))`; must be deterministic (Property 1)
    - Emit structured log event: `email_received`
    - _Requirements: 2.1, 2.2, 2.3, 11.3_

- [ ] 5. Core services checkpoint
  - Ensure all four service files exist and import cleanly
  - Ask the user if any questions arise before proceeding.

- [x] 6. Orchestration — AI Responder
  - [x] 6.1 Implement `aiResponder.js` — `server/services/emailAgent/aiResponder.js`
    - Export `processInboundEmail(inboundEmail)` implementing the full 12-step algorithm from design:
      1. Check `subscribers` table for `unsubscribed` status → return early
      2. Detect unsubscribe keywords → call `handleUnsubscribe`, return early
      3. Upsert `email_threads` row (`upsertThread`)
      4. Check `thread.escalated || !thread.auto_reply_enabled` → return early
      5. Call `getMaxReplies()`; detect escalation keywords OR `ai_reply_count >= max` → call `escalationService.escalateThread`
      6. Detect conversion keywords → `UPDATE email_threads SET converted=true`
      7. Call `buildThreadHistory(thread.thread_id)` — last 10 messages, `{ sender, text }` format (Property 8)
      8. Call `generateAIReply` with `SEEVORA_SALES_SYSTEM_PROMPT` from design (inline constant + system_settings override)
      9. Handle empty AI response → set `status='needs_review'`, return
      10. Call `buildReplyHtml`; set `Re:` subject prefix (Property 5)
      11. Call `sendMail`; on failure set `status='send_failed'`
      12. Call `replyLogger.writeLog`; update `inbound_emails.status` + `email_threads.ai_reply_count` (Property 4, Property 6)
    - Implement `buildThreadHistory(threadId)`: joins `inbound_emails` (direction `user`) + `email_agent_reply_logs` (direction `agent`), sorts `created_at ASC`, LIMIT 10
    - Implement `getMaxReplies()`: system_settings → env var → default 5; cache result 30 s (Property 9)
    - Implement `buildReplyHtml(inboundEmail, replyText)`: exact HTML template from design doc
    - Implement `handleUnsubscribe(inboundEmail)`: upsert `subscribers` → send confirmation email → log
    - Emit structured log events: `ai_reply_generated`, `reply_sent`, `reply_failed`, `thread_escalated`, `unsubscribe_processed`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 9.1, 10.1, 10.3, 11.2, 11.3, 11.4_

- [x] 7. API routes — `server/routes/emailAgent.js`
  - [x] 7.1 Implement all 7 admin endpoints in `server/routes/emailAgent.js`
    - `GET /threads` — paginated list; query params `page`, `limit` (max 50), `escalated`, `converted`, `source`
    - `GET /threads/:thread_id` — thread detail + merged/sorted messages from `inbound_emails` + `email_agent_reply_logs`
    - `POST /threads/:thread_id/manual-reply` — send override via `sendMail`; log with `source='admin_override'`; return `{ success, message }`
    - `PUT /threads/:thread_id/auto-reply` — toggle `auto_reply_enabled`; honour immediately
    - `POST /threads/:thread_id/convert` — set `converted`, `conversion_type`, `converted_at`, `confirmed_by`
    - `GET /metrics` — aggregate query returning `{ totalThreads, totalAiReplies, escalations, conversions, aiReplySuccessRate, avgRepliesPerThread, threadsBySource }`
    - `GET /logs` — paginated `email_agent_reply_logs`; filter by `thread_id`, `to_email`, `status`, `from_date`, `to_date`
    - All routes guarded with `requireRole('admin', 'super_admin')`
    - Return HTTP 403 for missing/invalid JWT (Property 10)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.2, 9.3_

- [x] 8. Mount routes and start workers in `server/index.js`
  - [x] 8.1 Add email agent route mount and worker startup to `server/index.js`
    - Add import and `app.use('/api/email-agent', emailAgentRoutes)` after existing route registrations
    - Add `import { startImapPoller } from './services/emailAgent/imapPoller.js'`
    - Add `import { startContactFormProcessor } from './services/emailAgent/contactFormProcessor.js'`
    - Call `startImapPoller()` and `startContactFormProcessor()` after `await initDb()` (already at bottom of file)
    - _Requirements: 1.1, 2.1, 8.7_

- [ ] 9. Integration checkpoint — backend wired
  - Start server; confirm `/api/health` still returns 200; confirm `[ImapPoller]` and `[ContactFormProcessor]` log lines appear
  - Confirm `GET /api/email-agent/metrics` returns 403 without token and 200 with admin token
  - Ask the user if any questions arise before proceeding.

- [x] 10. Admin frontend — `EmailAgentDashboard.jsx`
  - [x] 10.1 Create `src/components/admin/EmailAgentDashboard.jsx`
    - Implement tabbed layout (Overview | Threads | Reply Logs) using `sa-admin-*` CSS classes matching `SalesAgentDashboard.jsx`
    - Overview tab: `MetricCard` grid with all 6 KPIs from `GET /api/email-agent/metrics`
    - Threads tab: table with columns From, Subject, Source, AI Replies, Status badge, Last Activity; row click → `setSelectedThreadId`; pagination controls
    - Reply Logs tab: table with To, Subject, AI Model, Source, Status badge, Sent At
    - Render `<EmailThreadViewer>` when `selectedThreadId` is set
    - All fetches send `Authorization: Bearer {token}` header
    - _Requirements: 8.1, 8.6, 8.7_

- [x] 11. Admin frontend — `EmailThreadViewer.jsx`
  - [x] 11.1 Create `src/components/admin/EmailThreadViewer.jsx`
    - Fetch thread detail from `GET /api/email-agent/threads/:threadId` on mount and after any action
    - Render conversation history: inbound bubbles left-aligned (`#f1f5f9`), outbound right-aligned (`#0a0a0a` / white text); show `ai_model_used` and `source` sub-labels
    - Action controls: Pause/Resume Auto-Reply toggle (`PUT …/auto-reply`), Booked Call + Service Inquiry conversion buttons (`POST …/convert`), converted badge
    - Manual reply textarea + Send Override Reply button (`POST …/manual-reply`); show success/error feedback
    - Escalation warning banner when `thread.escalated === true`
    - Scroll to bottom of messages on load
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Frontend checkpoint — UI functional
  - Open admin dashboard in browser; confirm all three tabs load without console errors
  - Confirm thread viewer shows conversation bubbles and action buttons
  - Ask the user if any questions arise before proceeding.

- [ ] 13. Unit tests
  - [ ] 13.1 Write unit tests for `deriveThreadId` and `deriveContactFormThreadId`
    - Test `deriveThreadId`: References > In-Reply-To > hash fallback precedence (all three branches)
    - Test `deriveContactFormThreadId`: determinism — same inputs always return same output
    - Test: normalised subject produces same result regardless of surrounding whitespace
    - Place in `server/services/emailAgent/imapPoller.test.js` and `contactFormProcessor.test.js`
    - _Requirements: 1.3, 2.2_

  - [ ]* 13.2 Write property test for `deriveContactFormThreadId` determinism (Property 1)
    - **Property 1: Thread ID Determinism** — `∀ email, subject: fn(e, s) === fn(e, s)`
    - Use `fast-check`: `fc.property(fc.emailAddress(), fc.string(), (e, s) => fn(e, s) === fn(e, s))`
    - **Validates: Requirements 2.2**

  - [ ]* 13.3 Write property test for Subject Prefix Idempotency (Property 5)
    - **Property 5: Subject Prefix Idempotency** — `s.startsWith('Re:') → addRePrefix(s) === s`
    - Use `fast-check`: verify applying prefix to an already-prefixed subject does not double-prefix
    - **Validates: Requirements 4.3**

  - [ ] 13.4 Write unit tests for `getMaxReplies` precedence
    - Test: returns system_settings value when set
    - Test: falls back to env var when system_settings not set
    - Test: defaults to 5 when neither is set
    - Test: returned value is always a positive integer ≥ 1
    - Place in `server/services/emailAgent/aiResponder.test.js`
    - _Requirements: 10.1_

  - [ ]* 13.5 Write property test for `getMaxReplies` always returns positive integer (Property 9)
    - **Property 9: Max Replies Precedence** — result is always a positive integer ≥ 1 regardless of input
    - **Validates: Requirements 10.1**

  - [ ] 13.6 Write unit tests for `detectModelUsed`
    - Test: returns `'claude-3-5-sonnet-20241022'` when `ANTHROPIC_API_KEY` set
    - Test: returns `'gpt-4o-mini'` when only `OPENAI_API_KEY` set
    - Test: returns `'gemini-1.5-flash'` when only `GEMINI_API_KEY` set
    - Test: returns `null` when no keys set
    - Place in `server/services/emailAgent/replyLogger.test.js`
    - _Requirements: 7.3_

  - [ ] 13.7 Write unit tests for escalation and unsubscribe keyword detection
    - Test all 5 escalation phrases (case-insensitive): `speak to a human`, `talk to a person`, `human agent`, `real person`, `contact a representative`
    - Test all 4 unsubscribe phrases (case-insensitive): `unsubscribe`, `stop emails`, `remove me`, `opt out`
    - Test all 4 conversion phrases (case-insensitive): `book a call`, `schedule a meeting`, `interested in your services`, `want to know more`
    - Test: phrases embedded in longer sentences are still detected
    - Place in `server/services/emailAgent/aiResponder.test.js`
    - _Requirements: 5.1, 6.1, 9.1_

  - [ ]* 13.8 Write property test for escalation threshold logic (Property 3)
    - **Property 3: Escalation Threshold** — thread with `ai_reply_count < MAX` and no keyword → escalation returns false; `ai_reply_count >= MAX` → escalation returns true
    - Use `fast-check`: `fc.property(fc.integer({ min: 0 }), fc.integer({ min: 1 }), ...)`
    - **Validates: Requirements 5.2, 10.1**

  - [ ]* 13.9 Write property test for reply count monotonicity (Property 4)
    - **Property 4: Reply Count Monotonicity** — `ai_reply_count` never decrements; each successful send increments by exactly 1
    - **Validates: Requirements 5.2**

- [ ] 14. Integration tests — `server/services/emailAgent/aiResponder.integration.test.js`
  - [ ] 14.1 Write integration test: contact form → AI reply → status `replied`
    - Seed an `inbound_emails` row with `source='contact_form'`, `status='received'`
    - Mock `generateAIReply` to return deterministic text; mock `sendMail` to return `{ success: true }`
    - Call `processInboundEmail(row)`; assert `status='replied'`, one `email_agent_reply_logs` row created
    - _Requirements: 3.5, 3.6, 7.1_

  - [ ] 14.2 Write integration test: escalation path — 5th reply triggers escalation
    - Seed thread with `ai_reply_count = 4` (at limit), `auto_reply_enabled = true`, `escalated = false`
    - Call `processInboundEmail`; assert `escalated=true`, `auto_reply_enabled=false`, escalation email sent, log entry with `source='escalation'`
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 14.3 Write integration test: unsubscribe keyword → no AI reply
    - Seed inbound email body containing `"please unsubscribe me"`
    - Call `processInboundEmail`; assert no AI reply sent; `subscribers` row upserted with `status='unsubscribed'`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 14.4 Write integration test: admin manual-reply endpoint
    - Seed a thread; mock `sendMail` to return success
    - `POST /api/email-agent/threads/:id/manual-reply` with admin JWT and `{ body: "Hello" }`
    - Assert HTTP 200; one `email_agent_reply_logs` row with `source='admin_override'`
    - _Requirements: 8.3_

  - [ ] 14.5 Write integration test: auto-reply toggle is honoured
    - Seed thread with `auto_reply_enabled = true`
    - `PUT /api/email-agent/threads/:id/auto-reply` body `{ enabled: false }`
    - Call `processInboundEmail` for a new message on that thread; assert no reply sent
    - _Requirements: 8.4_

  - [ ]* 14.6 Write property test for `buildThreadHistory` length bound (Property 8)
    - **Property 8: Thread History Bound** — `buildThreadHistory(threadId)` returns at most 10 messages regardless of how many messages exist
    - Seed threads with 1–30 messages using `fc.integer({ min: 1, max: 30 })`
    - **Validates: Requirements 4.2_**

  - [ ]* 14.7 Write property test for No Reply to Unsubscribed (Property 2)
    - **Property 2: No Reply to Unsubscribed** — for any inbound email from an `unsubscribed` sender, `processInboundEmail` returns `{ sent: false }` without calling `sendMail`
    - **Validates: Requirements 6.2**

- [ ] 15. Final checkpoint — all tests pass
  - Run `npm test -- --run` (or equivalent); confirm all unit and integration tests pass
  - Confirm no TypeScript / lint errors (`npm run lint` if available)
  - Ask the user if any questions arise before finalising.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster initial delivery
- All services use ES module syntax (`import`/`export`) consistent with the rest of the codebase
- `imap` and `mailparser` are the only new runtime dependencies; everything else already exists
- Background workers (`startImapPoller`, `startContactFormProcessor`) are started after `await initDb()` in `server/index.js` — schema is guaranteed to exist before first poll
- The `system_settings` cache in `getMaxReplies()` uses a 30-second TTL; no server restart is needed when the value changes in DB
- `replyLogger.writeLog` is intentionally non-throwing — delivery is never blocked by a logging failure
- Property tests use `fast-check` which is already present in the project ecosystem

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "2.1"] },
    { "id": 1, "tasks": ["4.1", "4.2"] },
    { "id": 2, "tasks": ["4.3", "4.4"] },
    { "id": 3, "tasks": ["6.1"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["8.1"] },
    { "id": 6, "tasks": ["10.1", "11.1"] },
    { "id": 7, "tasks": ["13.1", "13.4", "13.6", "13.7"] },
    { "id": 8, "tasks": ["13.2", "13.3", "13.5", "13.8", "13.9", "14.1", "14.2", "14.3", "14.4", "14.5"] },
    { "id": 9, "tasks": ["14.6", "14.7"] }
  ]
}
```
