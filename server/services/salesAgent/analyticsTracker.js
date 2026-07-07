import pool from '../../config/db.js';

/**
 * Record an analytics event for a session.
 * @param {string} sessionUUID - Internal session UUID
 * @param {string} eventType - e.g. 'session_start', 'message_sent', 'agent_response', 'lead_captured', 'session_end'
 * @param {object} [eventData] - Optional JSON payload
 */
export async function trackEvent(sessionUUID, eventType, eventData = null) {
  try {
    await pool.query(
      `INSERT INTO sales_agent_analytics (session_id, event_type, event_data)
       VALUES ($1, $2, $3)`,
      [sessionUUID, eventType, eventData ? JSON.stringify(eventData) : null]
    );
  } catch (err) {
    console.error('[AnalyticsTracker] Failed to record event:', eventType, err.message);
  }
}

/**
 * Compute dashboard metrics for the admin panel.
 * @param {object} [opts]
 * @param {string} [opts.startDate]
 * @param {string} [opts.endDate]
 * @returns {Promise<object>}
 */
export async function getDashboardMetrics({ startDate, endDate } = {}) {
  const dateFilter = buildDateFilter(startDate, endDate);

  // Total and active conversations
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

  // Average response time (milliseconds between user and agent messages)
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
  } catch (_) { /* non-critical */ }

  // Top services discussed
  const topServicesResult = await pool.query(`
    SELECT elem AS service, COUNT(*) AS count
    FROM sales_agent_sessions, unnest(services_discussed) AS elem
    WHERE services_discussed IS NOT NULL
    GROUP BY elem
    ORDER BY count DESC
    LIMIT 10
  `);

  // Conversations by day (last 30 days)
  const byDayResult = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM sales_agent_sessions
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  const row = sessionsResult.rows[0] || {};
  const totalConversations = parseInt(row.total_conversations || 0);
  const totalLeads = parseInt(row.total_leads || 0);

  return {
    totalConversations,
    activeConversations: parseInt(row.active_conversations || 0),
    totalLeads,
    conversionRate: totalConversations > 0
      ? parseFloat(((totalLeads / totalConversations) * 100).toFixed(1))
      : 0,
    avgConversationLength: parseFloat(parseFloat(row.avg_conversation_length || 0).toFixed(1)),
    avgResponseTime,
    topServices: topServicesResult.rows.map(r => ({
      service: r.service,
      count: parseInt(r.count),
    })),
    conversationsByDay: byDayResult.rows.map(r => ({
      date: r.date,
      count: parseInt(r.count),
    })),
  };
}

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
