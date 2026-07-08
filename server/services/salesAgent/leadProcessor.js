import pool from '../../config/db.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate lead data.
 * @param {object} data
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateLeadData({ name, email, phone, serviceInterest }) {
  const errors = {};

  if (!name || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.trim().length > 200) {
    errors.name = 'Name must be 200 characters or less';
  }

  if (!email || email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (phone && phone.trim().length > 40) {
    errors.phone = 'Phone must be 40 characters or less';
  }

  if (!serviceInterest || serviceInterest.trim().length === 0) {
    errors.serviceInterest = 'Service interest is required';
  } else if (serviceInterest.trim().length > 200) {
    errors.serviceInterest = 'Service interest must be 200 characters or less';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Check if a lead already exists for this session.
 * @param {string} sessionUUID
 * @returns {Promise<boolean>}
 */
export async function leadExistsForSession(sessionUUID) {
  const { rows } = await pool.query(
    `SELECT id FROM sales_agent_leads WHERE session_id = $1 LIMIT 1`,
    [sessionUUID]
  );
  return rows.length > 0;
}

/**
 * Insert a new lead into the database.
 * @param {string} sessionUUID
 * @param {object} data
 * @returns {Promise<object>} Created lead row
 */
export async function createLead(sessionUUID, { name, email, phone, serviceInterest, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO sales_agent_leads
       (session_id, name, email, phone, service_interest, source, notes)
     VALUES ($1, $2, $3, $4, $5, 'sales_agent', $6)
     RETURNING *`,
    [
      sessionUUID,
      name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : null,
      serviceInterest.trim(),
      notes || null,
    ]
  );
  return rows[0];
}

/**
 * Link a lead to its session by updating the session record.
 * Sets lead_captured flag and lead_id reference.
 * @param {string} sessionUUID - The session UUID
 * @param {string} leadId - The lead UUID to link
 * @returns {Promise<void>}
 */
export async function linkLeadToSession(sessionUUID, leadId) {
  await pool.query(
    `UPDATE sales_agent_sessions
     SET lead_captured = true,
         lead_id = $2
     WHERE id = $1`,
    [sessionUUID, leadId]
  );
}
