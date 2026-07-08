import pool from '../../config/db.js';

// Valid event types per the schema definition
const VALID_EVENT_TYPES = new Set([
  'session_start',
  'message_sent',
  'agent_response',
  'lead_capture_offered',
  'lead_captured',
  'session_end',
]);

/**
 * Log an analytics event for a session.
 * Inserts a row into sales_agent_analytics.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.5
 *
 * @param {string} sessionId - Internal session UUID (sales_agent_sessions.id)
 * @param {string} eventType - One of the valid event types
 * @param {object|null} [eventData] - Optional JSON payload for the event
 * @returns {Promise<object>} The created analytics row
 */
export async function logEvent(sessionId, eventType, eventData = null) {
  if (!sessionId) throw new Error('sessionId is required');
  if (!eventType) throw new Error('eventType is required');

  if (!VALID_EVENT_TYPES.has(eventType)) {
    console.warn(`[AnalyticsTracker] Unknown event type: ${eventType}`);
  }

  const { rows } = await pool.query(
    `INSERT INTO sales_agent_analytics (session_id, event_type, event_data)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [sessionId, eventType, eventData !== null ? JSON.stringify(eventData) : null]
  );

  return rows[0];
}

/**
 * Alias for logEvent — retained for backward compatibility.
 * @param {string} sessionUUID
 * @param {string} eventType
 * @param {object|null} [eventData]
 * @returns {Promise<void>}
 */
export async function trackEvent(sessionUUID, eventType, eventData = null) {
  try {
    await logEvent(sessionUUID, eventType, eventData);
  } catch (err) {
    console.error('[AnalyticsTracker] Failed to record event:', eventType, err.message);
  }
}

/**
 * Calculate conversation metrics for a single session.
 * Returns message count, conversation duration, conversion status, and services discussed.
 *
 * Requirements: 8.2, 8.4, 8.5
 *
 * @param {string} sessionId - Internal session UUID (sales_agent_sessions.id)
 * @returns {Promise<object>} Metrics object with the following shape:
 *   {
 *     messageCount: number,
 *     duration: number|null,       // seconds from session_start to session_end (or now)
 *     conversionStatus: string,    // 'converted' | 'pending' | 'no_conversion'
 *     servicesDiscussed: string[], // services mentioned during the session
 *     userMessageCount: number,
 *     agentMessageCount: number,
 *     leadCaptured: boolean,
 *     sessionStatus: string,
 *   }
 */
export async function calculateMetrics(sessionId) {
  if (!sessionId) throw new Error('sessionId is required');

  // Fetch session-level data
  const sessionResult = await pool.query(
    `SELECT
       message_count,
       lead_captured,
       services_discussed,
       status,
       created_at,
       ended_at
     FROM sales_agent_sessions
     WHERE id = $1
     LIMIT 1`,
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const session = sessionResult.rows[0];

  // Per-sender message breakdown
  const msgBreakdown = await pool.query(
    `SELECT sender, COUNT(*) AS cnt
     FROM sales_agent_messages
     WHERE session_id = $1
     GROUP BY sender`,
    [sessionId]
  );

  let userMessageCount = 0;
  let agentMessageCount = 0;
  for (const row of msgBreakdown.rows) {
    if (row.sender === 'user') userMessageCount = parseInt(row.cnt, 10);
    else if (row.sender === 'agent') agentMessageCount = parseInt(row.cnt, 10);
  }

  // Duration in seconds: from session start to end_at (or now for active sessions)
  const endTime = session.ended_at ? new Date(session.ended_at) : new Date();
  const startTime = new Date(session.created_at);
  const duration = Math.round((endTime - startTime) / 1000);

  // Conversion status (requirement 8.5)
  let conversionStatus;
  if (session.lead_captured) {
    conversionStatus = 'converted';
  } else if (session.status === 'active') {
    conversionStatus = 'pending';
  } else {
    conversionStatus = 'no_conversion';
  }

  return {
    messageCount: session.message_count || 0,
    userMessageCount,
    agentMessageCount,
    duration,
    conversionStatus,
    servicesDiscussed: session.services_discussed || [],
    leadCaptured: session.lead_captured || false,
    sessionStatus: session.status,
  };
}

/**
 * Track which services were discussed in a session.
 * Merges the supplied service names into the services_discussed array on the
 * sales_agent_sessions row, avoiding duplicates via PostgreSQL array operations.
 *
 * Requirements: 8.4
 *
 * @param {string} sessionId - Internal session UUID (sales_agent_sessions.id)
 * @param {string[]} services - Array of service name strings to record
 * @returns {Promise<string[]>} The updated services_discussed array
 */
export async function trackServiceDiscussion(sessionId, services) {
  if (!sessionId) throw new Error('sessionId is required');
  if (!Array.isArray(services) || services.length === 0) return [];

  // Filter out empty/non-string entries, then deduplicate against existing array
  const cleanServices = services
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim());

  if (cleanServices.length === 0) return [];

  // Use unnest + DISTINCT to merge new services with existing ones — no duplicates
  const { rows } = await pool.query(
    `UPDATE sales_agent_sessions
     SET services_discussed = ARRAY(
       SELECT DISTINCT elem
       FROM unnest(
         array_cat(
           COALESCE(services_discussed, ARRAY[]::TEXT[]),
           $2::TEXT[]
         )
       ) AS elem
     )
     WHERE id = $1
     RETURNING services_discussed`,
    [sessionId, cleanServices]
  );

  if (rows.length === 0) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  return rows[0].services_discussed || [];
}

/**
 * Compute dashboard-level metrics across all sessions.
 * Used by the admin dashboard endpoint.
 *
 * @param {object} [opts]
 * @param {string} [opts.startDate] - ISO date string for range start
 * @param {string} [opts.endDate]   - ISO date string for range end
 * @returns {Promise<object>} Aggregated dashboard metrics
 */
export async function getDashboardMetrics({ startDate, endDate } = {}) {
  const dateFilter = buildDateFilter(startDate, endDate);

  // Total and active conversations, lead counts, avg message count
  const sessionsResult = await pool.query(
    `SELECT
       COUNT(*) AS total_conversations,
       COUNT(*) FILTER (WHERE status = 'active') AS active_conversations,
       COUNT(*) FILTER (WHERE lead_captured = true) AS total_leads,
       AVG(message_count) AS avg_conversation_length
     FROM sales_agent_sessions
     ${dateFilter.clause}`,
    dateFilter.values
  );

  // Average response time (ms between consecutive user → agent messages)
  let avgResponseTime = 0;
  try {
    const rtResult = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (a.created_at - u.created_at)) * 1000) AS avg_ms
      FROM sales_agent_messages u
      JOIN LATERAL (
        SELECT created_at FROM sales_agent_messages a2
        WHERE a2.session_id = u.session_id
          AND a2.sender = 'agent'
          AND a2.created_at > u.created_at
        ORDER BY a2.created_at ASC LIMIT 1
      ) a ON true
      WHERE u.sender = 'user'
    `);
    avgResponseTime = Math.round(parseFloat(rtResult.rows[0]?.avg_ms || 0));
  } catch (_) { /* non-critical, skip on error */ }

  // Top services discussed across all sessions
  const topServicesResult = await pool.query(`
    SELECT elem AS service, COUNT(*) AS count
    FROM sales_agent_sessions, unnest(services_discussed) AS elem
    WHERE services_discussed IS NOT NULL
    GROUP BY elem
    ORDER BY count DESC
    LIMIT 10
  `);

  // Conversations grouped by day (last 30 days)
  const byDayResult = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM sales_agent_sessions
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  const row = sessionsResult.rows[0] || {};
  const totalConversations = parseInt(row.total_conversations || 0, 10);
  const totalLeads = parseInt(row.total_leads || 0, 10);

  return {
    totalConversations,
    activeConversations: parseInt(row.active_conversations || 0, 10),
    totalLeads,
    conversionRate: totalConversations > 0
      ? parseFloat(((totalLeads / totalConversations) * 100).toFixed(1))
      : 0,
    avgConversationLength: parseFloat(parseFloat(row.avg_conversation_length || 0).toFixed(1)),
    avgResponseTime,
    topServices: topServicesResult.rows.map((r) => ({
      service: r.service,
      count: parseInt(r.count, 10),
    })),
    conversationsByDay: byDayResult.rows.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
    })),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a parameterized WHERE clause for optional date-range filtering.
 * @param {string|undefined} startDate
 * @param {string|undefined} endDate
 * @returns {{ clause: string, values: any[] }}
 */
function buildDateFilter(startDate, endDate) {
  const conditions = [];
  const values = [];

  if (startDate) {
    values.push(startDate);
    conditions.push(`created_at >= $${values.length}`);
  }
  if (endDate) {
    values.push(endDate);
    conditions.push(`created_at <= $${values.length}`);
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}
