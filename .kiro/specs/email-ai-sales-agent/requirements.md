# Requirements Document

## Introduction

The Email AI Sales Agent is an automated, AI-powered inbound email handler for Seevora Private Limited. It monitors two sources of inbound emails — direct IMAP emails to Seevora's mailbox and contact form submissions stored in the `inbound_emails` database table — and autonomously replies using a sales-focused AI prompt. The agent continues the conversation across multiple reply threads, tracks escalation thresholds, respects opt-out requests, and provides an admin dashboard for oversight. It builds on Seevora's existing `generateAIReply`, `sendMail`, and `inbound_emails` infrastructure.

## Glossary

- **Email_Agent**: The automated system that polls for, processes, and replies to inbound emails on behalf of Seevora.
- **Thread**: A group of emails sharing the same `thread_id`, representing a continuous back-and-forth conversation with a single sender.
- **IMAP_Poller**: The background service that connects to Seevora's IMAP mailbox and fetches new inbound emails at a configured interval.
- **AI_Responder**: The component that calls `generateAIReply` with the sales system prompt and thread history to produce a reply.
- **Admin_Dashboard**: The protected admin UI page for viewing, filtering, overriding, and disabling AI conversations.
- **Escalation**: The state in which a thread is handed off to a human agent and AI auto-reply is disabled for that thread.
- **Conversion_Event**: A recorded outcome indicating the email conversation led to a booked call or service inquiry.
- **Reply_Log**: A database record capturing each AI-generated reply, its timestamp, and the AI model used.
- **Unsubscribe_Request**: An explicit opt-out from email communication detected in the sender's message.
- **Rate_Limit**: The maximum number of AI auto-replies allowed per thread before escalation is triggered.
- **System_Prompt**: The sales-focused instruction set embedded in every AI call, describing Seevora's services, tone, and goals.
- **Contact_Form_Submission**: An inbound email record created by the website contact form and saved to the `inbound_emails` table.

---

## Requirements

### Requirement 1: IMAP Email Polling

**User Story:** As the Email_Agent, I want to poll Seevora's IMAP mailbox at a regular interval, so that new inbound emails are detected and processed without manual intervention.

#### Acceptance Criteria

1. WHEN the IMAP_Poller interval elapses, THE Email_Agent SHALL connect to the IMAP server using credentials from environment variables `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, and `IMAP_PASS`.
2. WHEN the IMAP_Poller fetches new messages from the INBOX, THE Email_Agent SHALL save each unseen message to the `inbound_emails` table with fields `from_email`, `from_name`, `subject`, `body`, `source` (value: `imap`), and `thread_id`.
3. WHEN a fetched IMAP message has an `In-Reply-To` or `References` header matching an existing `thread_id`, THE Email_Agent SHALL associate the new message with that Thread rather than creating a new Thread.
4. IF the IMAP connection fails, THEN THE Email_Agent SHALL log the error with a timestamp and retry after the next configured polling interval without crashing. IF the retry mechanism itself encounters an error or if logging fails, THEN THE Email_Agent SHALL continue operating and attempt the next poll at the next interval without crashing.
5. THE Email_Agent SHALL poll the IMAP mailbox no more frequently than once every 60 seconds and no less frequently than once every 120 seconds, with the interval configurable via the `IMAP_POLL_INTERVAL_SECONDS` environment variable.

---

### Requirement 2: Contact Form Email Ingestion

**User Story:** As the Email_Agent, I want to detect new Contact_Form_Submissions in the `inbound_emails` table, so that website enquiries are handled the same way as direct IMAP emails.

#### Acceptance Criteria

1. WHEN a new record appears in the `inbound_emails` table with `source` value `contact_form` and `status` value `new`, THE Email_Agent SHALL treat it as an inbound email eligible for AI auto-reply.
2. WHEN a Contact_Form_Submission is processed, THE Email_Agent SHALL assign a `thread_id` derived from the sender's `from_email` and the record's `subject` if no existing Thread exists for that sender.
3. THE Email_Agent SHALL process Contact_Form_Submissions within 2 minutes of their `created_at` timestamp.

---

### Requirement 3: AI Auto-Reply Generation

**User Story:** As a prospective client, I want to receive an immediate, intelligent reply to my email, so that I get a helpful response from Seevora without waiting for a human to respond.

#### Acceptance Criteria

1. WHEN a new inbound email arrives and the Thread is not escalated and `auto_reply_enabled` is `true` for the Thread, THE AI_Responder SHALL call `generateAIReply` with the Thread's message history (up to the last 10 messages) and the System_Prompt.
2. THE System_Prompt SHALL include Seevora's company description, all four service categories (AI Voice Receptionist, WhatsApp Automation, Custom Integrations, Multi-language Support), target industries, a persuasive and conversion-focused tone instruction, and a call to action to book a discovery call at `https://seevora.in/book-a-call`.
3. WHEN `generateAIReply` returns a non-empty response, THE AI_Responder SHALL format the reply as professional HTML using Seevora's brand colours and typography consistent with the template in `emailBot.js`.
4. WHEN `generateAIReply` returns an empty response or throws an error, THE AI_Responder SHALL log the failure and place the inbound email in a `needs_review` status without sending any reply.
5. THE Email_Agent SHALL send the AI-generated reply via `sendMail` within 2 minutes of the inbound email's `created_at` timestamp, where a reply sent at exactly 2 minutes satisfies this requirement.
6. WHEN the reply is sent successfully and the reply text is stored in the `ai_reply` column without error, THE Email_Agent SHALL update the inbound email's `status` to `replied`. IF storing the reply text in the `ai_reply` column fails after the reply is sent, THEN THE Email_Agent SHALL update the inbound email's `status` to `needs_review` instead of `replied`.

---

### Requirement 4: Thread-Aware Conversation Continuity

**User Story:** As a prospective client, I want the AI to remember my previous messages when I reply, so that the conversation feels contextual and I do not have to repeat myself.

#### Acceptance Criteria

1. WHEN a reply email arrives from a sender whose `from_email` matches an existing Thread's `thread_id`, THE Email_Agent SHALL retrieve all prior messages for that Thread ordered by `created_at` ascending before calling `generateAIReply`.
2. THE AI_Responder SHALL pass the last 10 messages of the Thread as the `thread` parameter to `generateAIReply`, with each message formatted as `{ sender: 'user' | 'agent', text: string }`.
3. THE Email_Agent SHALL set the outgoing reply's email `Subject` header to `Re: {original_subject}` when replying within an existing Thread and the subject does not already begin with `Re:`.
4. THE Email_Agent SHALL include the original sender's email address in the `In-Reply-To` SMTP header of all thread replies.

---

### Requirement 5: Escalation to Human Agent

**User Story:** As a Seevora team member, I want the AI to stop auto-replying when a client asks to speak to a human or when the conversation reaches a reply limit, so that complex or sensitive enquiries are handled personally.

#### Acceptance Criteria

1. WHEN an inbound email body contains any of the phrases "speak to a human", "talk to a person", "human agent", "real person", or "contact a representative" (case-insensitive), THE Email_Agent SHALL mark the Thread as escalated and set `auto_reply_enabled` to `false`.
2. WHEN the count of AI-generated replies for a Thread reaches the value of the `MAX_AI_REPLIES_PER_THREAD` configuration (default: 5), THE Email_Agent SHALL mark the Thread as escalated and set `auto_reply_enabled` to `false`.
3. WHEN a Thread is escalated, THE Email_Agent SHALL send one final reply to the sender acknowledging the request and informing them that a Seevora team member will be in touch, using a pre-defined escalation message template.
4. WHEN a Thread is escalated, THE Email_Agent SHALL log the escalation event with the reason (`human_request` or `reply_limit_reached`) and timestamp.
5. WHILE a Thread is in escalated status, THE Email_Agent SHALL NOT send any AI-generated replies to messages in that Thread.

---

### Requirement 6: Unsubscribe Handling

**User Story:** As a sender, I want my opt-out request to be respected immediately, so that I do not receive further emails from Seevora's automated system.

#### Acceptance Criteria

1. WHEN an inbound email body contains "unsubscribe", "stop emails", "remove me", or "opt out" (case-insensitive), THE Email_Agent SHALL set the sender's `from_email` status to `unsubscribed` in the `subscribers` table, creating a record if one does not exist.
2. WHEN a sender's `from_email` is marked `unsubscribed`, THE Email_Agent SHALL NOT send any further AI-generated or automated replies to that email address.
3. WHEN an Unsubscribe_Request is processed, THE Email_Agent SHALL attempt to send one final reply confirming the opt-out. IF the confirmation email sends successfully, THEN THE Email_Agent SHALL update the sender's `from_email` status to `unsubscribed` in the `subscribers` table. IF the confirmation email fails to send, THEN THE Email_Agent SHALL NOT update the subscription status to `unsubscribed` and SHALL log the failure.
4. WHEN an admin manually sets a sender's subscription status back to `active` via the Admin_Dashboard, THE Email_Agent SHALL resume processing inbound emails from that address.

---

### Requirement 7: Reply Logging

**User Story:** As a Seevora admin, I want every AI-generated reply to be logged with full metadata, so that I can audit the AI's behaviour and diagnose issues.

#### Acceptance Criteria

1. WHEN the Email_Agent sends an AI-generated reply, THE Email_Agent SHALL attempt to write a Reply_Log entry recording: `thread_id`, `inbound_email_id`, `to_email`, `subject`, `reply_body_html`, `reply_body_text`, `ai_model_used`, `sent_at`, and `status` (`sent` or `failed`). IF the Reply_Log write fails, THE Email_Agent SHALL still send the reply and log the logging failure to the application error log without blocking email delivery.
2. WHEN `sendMail` returns a failure for an AI reply, THE Reply_Log SHALL record `status` as `failed` and include the error message in an `error_message` field.
3. THE Email_Agent SHALL record the name of the AI model used (e.g., `claude-3-5-sonnet-20241022`, `gpt-4o-mini`, `gemini-1.5-flash`) in every Reply_Log entry.
4. THE Reply_Log SHALL be queryable by `thread_id`, `to_email`, `sent_at` range, and `status`.

---

### Requirement 8: Admin Dashboard

**User Story:** As a Seevora admin, I want a dashboard to view all AI email conversations, override replies, and control auto-reply settings, so that I have full oversight of the agent's activity.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a paginated list of all Threads, showing `from_email`, `from_name`, `subject`, latest message timestamp, total reply count, escalation status, and conversion status.
2. WHEN an admin selects a Thread, THE Admin_Dashboard SHALL display the full conversation history with alternating sender/agent formatting.
3. WHEN an admin submits a manual reply override for a Thread via the Admin_Dashboard, THE Email_Agent SHALL send that override reply via `sendMail` and provide immediate feedback on the email delivery status. IF `sendMail` returns a failure, THE Admin_Dashboard SHALL display the error message and mark the override as failed in the Reply_Log. WHEN the override reply sends successfully, THE Email_Agent SHALL log it in the Reply_Log with `source` value `admin_override`.
4. WHEN an admin toggles the `auto_reply_enabled` flag for a Thread in the Admin_Dashboard, THE Email_Agent SHALL immediately honour the new setting for all subsequent messages in that Thread.
5. WHEN an admin marks a Thread as a Conversion_Event via the Admin_Dashboard, THE Email_Agent SHALL record the conversion with a `conversion_type` (`booked_call` or `service_inquiry`) and the timestamp.
6. THE Admin_Dashboard SHALL display aggregate metrics: total conversations, total AI replies sent, escalation count, conversion count, and AI reply success rate.
7. THE Admin_Dashboard SHALL be accessible only to users with the `admin` or `super_admin` role, enforced by the `requireRole` middleware.

---

### Requirement 9: Conversion Tracking

**User Story:** As a Seevora manager, I want to know which email conversations resulted in a booked call or service inquiry, so that I can measure the AI agent's sales effectiveness.

#### Acceptance Criteria

1. WHEN an inbound email body contains "book a call", "schedule a meeting", "interested in your services", or "want to know more" (case-insensitive), THE Email_Agent SHALL automatically flag the Thread with a `potential_conversion` indicator.
2. WHEN an admin confirms a Conversion_Event for a Thread, THE Email_Agent SHALL record `conversion_type`, `confirmed_by` (admin user ID), and `converted_at` timestamp in the Thread record.
3. THE Admin_Dashboard SHALL display the conversion rate as the percentage of total Threads with at least one confirmed Conversion_Event out of all Threads with two or more messages.

---

### Requirement 10: Rate Limiting and Configuration

**User Story:** As a Seevora admin, I want to configure the AI reply limit per thread and other agent settings, so that the system behaves predictably and does not over-engage unresponsive leads.

#### Acceptance Criteria

1. THE Email_Agent SHALL read `MAX_AI_REPLIES_PER_THREAD` from the `system_settings` table, falling back to the environment variable `MAX_AI_REPLIES_PER_THREAD`, and finally defaulting to `5` if neither is set.
2. THE Email_Agent SHALL read `IMAP_POLL_INTERVAL_SECONDS` from environment variables and validate that its value is an integer between `30` and `3600` inclusive; IF the value is outside this range, THEN THE Email_Agent SHALL default to `60` and log a warning.
3. WHEN `MAX_AI_REPLIES_PER_THREAD` is updated via the `system_settings` table and the update is confirmed in the database, THE Email_Agent SHALL apply the new value to all subsequent reply count evaluations without requiring a server restart.

---

### Requirement 11: Error Resilience and Observability

**User Story:** As a developer, I want the Email_Agent to handle failures gracefully and emit structured logs, so that issues can be diagnosed without manual inspection of raw email data.

#### Acceptance Criteria

1. IF the database is unavailable when the Email_Agent attempts to save an inbound email, THEN THE Email_Agent SHALL retry the save operation up to 3 times with a 5-second delay between attempts before logging a `db_save_failed` error.
2. IF `sendMail` fails for an AI-generated reply, THEN THE Email_Agent SHALL update the inbound email's `status` to `send_failed` and log the error with `inbound_email_id`, error message, and timestamp.
3. THE Email_Agent SHALL emit structured log entries for each of the following events: `email_received`, `ai_reply_generated`, `reply_sent`, `reply_failed`, `thread_escalated`, `unsubscribe_processed`, and `imap_poll_error`.
4. WHEN the Email_Agent processes an inbound email, THE Email_Agent SHALL record the end-to-end processing duration in milliseconds in the structured log entry for `reply_sent` or `reply_failed`.
