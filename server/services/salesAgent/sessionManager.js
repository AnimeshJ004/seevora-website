import pool from '../../config/db.js';
import { randomUUID } from 'crypto';
import { anonymizeMetadata } from '../../utils/privacy.js';

/**
 * Create a new chat session.
 * Generates a unique session_id (UUID) and stores hashed visitor metadata.
 * 
 * @param {object} opts
 * @param {string} [opts.visitorId] - Optional visitor tracking ID (cookie/fingerprint)
 * @param {string} [opts.ipAddress] - Client IP address
 * @param {string} [opts.userAgent] - Browser user agent string
 * @returns {Promise<object>} Created session record
 */
export async function createSession({ visitorId, ipAddress, userAgent } = {}) {
  const sessionId = randomUUID();
  
  const { rows } = await pool.query(
    `INSERT INTO sales_agent_sessions
       (session_id, visitor_id, ip_address, user_agent, status, last_activity_at)
     VALUES ($1, $2, $3, $4, 'active', NOW())
     RETURNING *`,
    [
      sessionId,
      anonymizeMetadata(visitorId) || null,
      anonymizeMetadata(ipAddress) || null,
      anonymizeMetadata(userAgent) || null,
    ]
  );
  
  return rows[0];
}

/**
 * Get a session by its public session_id.
 * 
 * @param {string} sessionId - The public session ID (UUID string)
 * @returns {Promise<object|null>} Session record or null if not found
 */
export async function getSessionBySessionId(sessionId) {
  const { rows } = await pool.query(
    `SELECT * FROM sales_agent_sessions WHERE session_id = $1 LIMIT 1`,
    [sessionId]
  );
  
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get a session by its internal database ID.
 * 
 * @param {string} id - Internal UUID primary key
 * @returns {Promise<object|null>} Session record or null if not found
 */
export async function getSessionById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM sales_agent_sessions WHERE id = $1 LIMIT 1`,
    [id]
  );
  
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Save a message to a session.
 * Updates the session's last_activity_at timestamp and increments message_count.
 * 
 * @param {string} sessionUUID - Internal session UUID (id, not session_id)
 * @param {string} sender - 'user' or 'agent'
 * @param {string} messageText - The message content
 * @param {object} [metadata] - Optional metadata (intent, confidence, etc.)
 * @returns {Promise<object>} Created message record
 */
export async function saveMessage(sessionUUID, sender, messageText, metadata = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert message
    const { rows } = await client.query(
      `INSERT INTO sales_agent_messages
         (session_id, sender, message_text, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sessionUUID, sender, messageText, metadata ? JSON.stringify(metadata) : null]
    );
    
    const message = rows[0];
    
    // Update session activity and message count
    await client.query(
      `UPDATE sales_agent_sessions
       SET last_activity_at = NOW(),
           message_count = message_count + 1
       WHERE id = $1`,
      [sessionUUID]
    );
    
    await client.query('COMMIT');
    
    return message;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieve all messages for a session in chronological order.
 * 
 * @param {string} sessionUUID - Internal session UUID
 * @param {number} [limit] - Optional limit on number of messages (default: all)
 * @returns {Promise<Array>} Array of message records
 */
export async function getMessages(sessionUUID, limit = null) {
  const query = limit
    ? `SELECT * FROM sales_agent_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC 
       LIMIT $2`
    : `SELECT * FROM sales_agent_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`;
  
  const params = limit ? [sessionUUID, limit] : [sessionUUID];
  const { rows } = await pool.query(query, params);
  
  return rows;
}

/**
 * Get the most recent N messages for a session.
 * Used for conversation context when generating AI responses.
 * 
 * @param {string} sessionUUID - Internal session UUID
 * @param {number} count - Number of recent messages to retrieve
 * @returns {Promise<Array>} Array of message records in chronological order
 */
export async function getRecentMessages(sessionUUID, count) {
  const { rows } = await pool.query(
    `SELECT * FROM sales_agent_messages 
     WHERE session_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [sessionUUID, count]
  );
  
  // Reverse to get chronological order (oldest to newest)
  return rows.reverse();
}

/**
 * Mark a session as having captured lead information.
 * Updates lead_captured flag and links the lead_id.
 * 
 * @param {string} sessionUUID - Internal session UUID
 * @param {string} leadId - The lead UUID to link
 * @returns {Promise<void>}
 */
export async function markLeadCaptured(sessionUUID, leadId) {
  await pool.query(
    `UPDATE sales_agent_sessions
     SET lead_captured = true,
         lead_id = $2
     WHERE id = $1`,
    [sessionUUID, leadId]
  );
}

/**
 * Update the services_discussed array for a session.
 * Merges new services with existing ones (no duplicates).
 * 
 * @param {string} sessionUUID - Internal session UUID
 * @param {Array<string>} services - Array of service names to add
 * @returns {Promise<void>}
 */
export async function updateServicesDiscussed(sessionUUID, services) {
  if (!services || services.length === 0) return;
  
  await pool.query(
    `UPDATE sales_agent_sessions
     SET services_discussed = ARRAY(
       SELECT DISTINCT unnest(
         COALESCE(services_discussed, ARRAY[]::TEXT[]) || $2::TEXT[]
       )
     )
     WHERE id = $1`,
    [sessionUUID, services]
  );
}

/**
 * End a session by setting status to 'ended' and recording end timestamp.
 * 
 * @param {string} sessionUUID - Internal session UUID
 * @returns {Promise<void>}
 */
export async function endSession(sessionUUID) {
  await pool.query(
    `UPDATE sales_agent_sessions
     SET status = 'ended',
         ended_at = NOW()
     WHERE id = $1`,
    [sessionUUID]
  );
}

/**
 * Archive sessions older than 24 hours.
 * Sets status to 'archived' and records archived_at timestamp.
 * Only archives sessions that are not already ended or archived.
 * 
 * @returns {Promise<number>} Number of sessions archived
 */
export async function archiveExpiredSessions() {
  const { rows } = await pool.query(
    `UPDATE sales_agent_sessions
     SET status = 'archived',
         archived_at = NOW()
     WHERE status = 'active'
       AND last_activity_at < NOW() - INTERVAL '24 hours'
     RETURNING id`
  );
  
  return rows.length;
}

/**
 * Get all active sessions (for monitoring or cleanup).
 * 
 * @returns {Promise<Array>} Array of active session records
 */
export async function getActiveSessions() {
  const { rows } = await pool.query(
    `SELECT * FROM sales_agent_sessions 
     WHERE status = 'active' 
     ORDER BY last_activity_at DESC`
  );
  
  return rows;
}

/**
 * Delete sessions and related data older than specified days (for GDPR compliance).
 * This is a destructive operation that should be run periodically.
 * 
 * @param {number} daysOld - Delete sessions older than this many days
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function deleteOldSessions(daysOld = 90) {
  const { rows } = await pool.query(
    `DELETE FROM sales_agent_sessions
     WHERE created_at < NOW() - INTERVAL '1 day' * $1
     RETURNING id`,
    [daysOld]
  );
  
  return rows.length;
}
