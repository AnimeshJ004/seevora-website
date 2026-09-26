import crypto from 'crypto';

function managerProfileConflict(message) {
  const error = new Error(message);
  error.code = 'MANAGER_PROFILE_CONFLICT';
  return error;
}

function accountCreationDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}

export async function createEmployeeCode(client) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `EMP-${crypto.randomInt(1000, 9999)}`;
    const result = await client.query(
      'SELECT id FROM hr_employees WHERE employee_code = $1 LIMIT 1',
      [code]
    );
    if (result.rowCount === 0) return code;
  }

  return `EMP-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

export async function ensureEmployeeProfile(client, user, details = {}) {
  const userId = String(user?.id || '').trim();
  const username = String(user?.username || '').trim();
  const email = String(user?.email || '').trim().toLowerCase();
  const phone = String(user?.phone || '').trim() || null;
  const role = user?.role || 'employee';

  if (!userId || !email) {
    throw new TypeError('A user id and email are required.');
  }

  const linkedResult = await client.query(
    `SELECT id, user_id, employee_code
     FROM hr_employees
     WHERE user_id = $1
     LIMIT 1
     FOR UPDATE`,
    [userId]
  );

  if (linkedResult.rowCount > 0) {
    return { profile: linkedResult.rows[0], created: false, linked: false };
  }

  const emailMatchResult = await client.query(
    `SELECT id, user_id, employee_code
     FROM hr_employees
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1
     FOR UPDATE`,
    [email]
  );
  const emailMatch = emailMatchResult.rows[0];

  if (emailMatch) {
    if (emailMatch.user_id && emailMatch.user_id !== userId) {
      throw managerProfileConflict('The email is already linked to another employee account.');
    }

    const linked = await client.query(
      `UPDATE hr_employees
       SET user_id = $1,
           account_active = true,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, employee_code`,
      [userId, emailMatch.id]
    );
    return { profile: linked.rows[0], created: false, linked: true };
  }

  const employeeCode = await createEmployeeCode(client);
  const profileId = crypto.randomUUID();
  const displayName = username || email.split('@')[0];
  const dept = details.department || (
    role === 'manager' ? 'Management' :
    role === 'developer' ? 'Engineering' :
    role === 'sales' ? 'Sales' :
    role === 'telecaller' ? 'Telecalling' :
    role === 'sales_developer' ? 'Sales & Tech' :
    role === 'hr' ? 'Human Resources' :
    role === 'support' ? 'Support' : 'General'
  );
  const title = details.jobTitle || (role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '));

  const created = await client.query(
    `INSERT INTO hr_employees (
       id, user_id, employee_code, name, email, phone, department, job_title,
       salary, joined_on, status, account_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', true)
     RETURNING id, user_id, employee_code`,
    [
      profileId,
      userId,
      employeeCode,
      displayName,
      email,
      phone,
      dept,
      title,
      details.salary || 0,
      accountCreationDate(user.created_at),
    ]
  );

  return { profile: created.rows[0], created: true, linked: false };
}

export async function ensureManagerEmployeeProfile(client, user) {
  const userId = String(user?.id || '').trim();
  const username = String(user?.username || '').trim();
  const email = String(user?.email || '').trim().toLowerCase();
  const phone = String(user?.phone || '').trim() || null;

  if (!userId || !email) {
    throw new TypeError('A manager user id and email are required.');
  }

  const linkedResult = await client.query(
    `SELECT id, user_id, employee_code
     FROM hr_employees
     WHERE user_id = $1
     LIMIT 1
     FOR UPDATE`,
    [userId]
  );

  if (linkedResult.rowCount > 0) {
    return { profile: linkedResult.rows[0], created: false, linked: false };
  }

  const emailMatchResult = await client.query(
    `SELECT id, user_id, employee_code
     FROM hr_employees
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1
     FOR UPDATE`,
    [email]
  );
  const emailMatch = emailMatchResult.rows[0];

  if (emailMatch) {
    if (emailMatch.user_id && emailMatch.user_id !== userId) {
      throw managerProfileConflict('The manager email is already linked to another employee account.');
    }

    const linked = await client.query(
      `UPDATE hr_employees
       SET user_id = $1,
           account_active = true,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, employee_code`,
      [userId, emailMatch.id]
    );
    return { profile: linked.rows[0], created: false, linked: true };
  }

  const employeeCode = await createEmployeeCode(client);
  const profileId = crypto.randomUUID();
  const displayName = username || email.split('@')[0];
  const created = await client.query(
    `INSERT INTO hr_employees (
       id, user_id, employee_code, name, email, phone, department, job_title,
       salary, joined_on, status, account_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'Management', 'Manager', 0, $7, 'active', true)
     RETURNING id, user_id, employee_code`,
    [
      profileId,
      userId,
      employeeCode,
      displayName,
      email,
      phone,
      accountCreationDate(user.created_at),
    ]
  );

  return { profile: created.rows[0], created: true, linked: false };
}

export async function backfillManagerEmployeeProfiles(database, { logger = console } = {}) {
  const client = await database.connect();

  try {
    await client.query('BEGIN');
    const managers = await client.query(`
      SELECT u.id, u.username, u.email, u.phone, u.created_at
      FROM users u
      LEFT JOIN hr_employees e ON e.user_id = u.id
      WHERE LOWER(u.role) = 'manager'
        AND e.id IS NULL
      ORDER BY u.created_at ASC, u.id ASC
      FOR UPDATE OF u
    `);

    let created = 0;
    let linked = 0;
    for (const manager of managers.rows) {
      const result = await ensureManagerEmployeeProfile(client, manager);
      if (result.created) created += 1;
      if (result.linked) linked += 1;
    }

    await client.query('COMMIT');

    if (managers.rowCount > 0) {
      logger.info?.('[HR] Manager employee profiles backfilled', {
        managers: managers.rowCount,
        created,
        linked,
      });
    }

    return { managers: managers.rowCount, created, linked };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    throw error;
  } finally {
    client.release();
  }
}
