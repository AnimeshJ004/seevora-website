/**
 * @fileoverview JSDoc type definitions for the AI Sales Agent feature.
 * Import these types in JSDoc @param / @returns annotations across components and services.
 */

/**
 * A single chat message exchanged in a conversation.
 * @typedef {Object} Message
 * @property {string} id - Unique message UUID
 * @property {string} sessionId - The session this message belongs to
 * @property {'user'|'agent'} sender - Who sent the message
 * @property {string} messageText - The message content
 * @property {Record<string, any>} [metadata] - Optional intent/sentiment metadata
 * @property {string} createdAt - ISO 8601 timestamp
 */

/**
 * A chat session representing a visitor's conversation.
 * @typedef {Object} Session
 * @property {string} id - Internal UUID primary key
 * @property {string} sessionId - Public-facing session identifier
 * @property {string} [visitorId] - Optional visitor tracking cookie/fingerprint
 * @property {'active'|'ended'|'archived'} status - Current session state
 * @property {boolean} leadCaptured - Whether contact info was collected
 * @property {string} [leadId] - UUID of the captured lead, if any
 * @property {number} messageCount - Total messages exchanged
 * @property {string[]} servicesDiscussed - Services mentioned during the session
 * @property {string} lastActivityAt - ISO 8601 timestamp of last message
 * @property {string} createdAt - ISO 8601 session start timestamp
 * @property {string} [endedAt] - ISO 8601 session end timestamp
 */

/**
 * A captured lead — visitor contact information collected during a chat.
 * @typedef {Object} Lead
 * @property {string} id - Unique lead UUID
 * @property {string} sessionId - The session that generated this lead
 * @property {string} name - Lead's full name
 * @property {string} email - Lead's email address (validated)
 * @property {string} [phone] - Optional phone number
 * @property {string} serviceInterest - Service the lead is interested in
 * @property {string} source - Always 'sales_agent'
 * @property {'new'|'contacted'|'qualified'|'converted'} status - Lead pipeline stage
 * @property {string} [notes] - Additional context from the conversation
 * @property {string} createdAt - ISO 8601 lead capture timestamp
 * @property {string} updatedAt - ISO 8601 last-modified timestamp
 */

/**
 * An analytics event recorded during a chat session.
 * @typedef {Object} AnalyticsEvent
 * @property {string} id - Unique event UUID
 * @property {string} sessionId - The session this event belongs to
 * @property {'session_start'|'message_sent'|'agent_response'|'lead_capture_offered'|'lead_captured'|'session_end'} eventType - Type of event
 * @property {Record<string, any>} [eventData] - Optional JSON payload for the event
 * @property {string} createdAt - ISO 8601 event timestamp
 */

/**
 * Lead form data submitted by a visitor.
 * @typedef {Object} LeadFormData
 * @property {string} name - Visitor's full name
 * @property {string} email - Visitor's email address
 * @property {string} [phone] - Optional phone number
 * @property {string} serviceInterest - Selected service of interest
 */

/**
 * Dashboard-level analytics aggregated across all sessions.
 * @typedef {Object} DashboardAnalytics
 * @property {number} totalConversations - Total number of sessions
 * @property {number} activeConversations - Currently active sessions
 * @property {number} totalLeads - Total leads captured
 * @property {number} conversionRate - Lead conversion rate as a percentage
 * @property {number} avgConversationLength - Average messages per session
 * @property {number} avgResponseTime - Average AI response time in milliseconds
 * @property {Array<{service: string, count: number}>} topServices - Most discussed services
 * @property {Array<{date: string, count: number}>} conversationsByDay - Conversations grouped by day
 */

export {};
