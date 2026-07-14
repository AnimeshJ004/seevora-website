import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';

const router = express.Router();

router.use(requireAuth);

const PRODUCTIVITY_TTL = 30;

function bustProductivityCache() {
  invalidateCacheNamespaces(
    CACHE_NAMESPACES.productivity,
    CACHE_NAMESPACES.dashboard,
    CACHE_NAMESPACES.analytics
  );
}

function scopedCacheDescriptor(req, view) {
  return {
    view,
    userId: req.user?.id || '',
    role: req.user?.role || '',
  };
}

function realUserId(req) {
  return req.user?.id === '00000000-0000-0000-0000-000000000000'
    ? null
    : req.user?.id || null;
}

async function resolveEmployeeId(userId) {
  if (!userId) return null;
  const { rows } = await pool.query('SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1', [userId]);
  return rows[0]?.id || null;
}

async function canAssignToEmployee(managerEmployeeId, employeeId) {
  if (!managerEmployeeId || !employeeId) return false;
  const { rowCount } = await pool.query(
    `SELECT 1
     FROM hr_employees e
     LEFT JOIN users u ON u.id = e.user_id
     WHERE e.id = $1
       AND e.id <> $2
       AND e.status IN ('active', 'probation')
       AND e.manager_id = $2
     LIMIT 1`,
    [employeeId, managerEmployeeId]
  );
  return rowCount > 0;
}

function isAdminRole(role) {
  return role === 'admin' || role === 'super_admin';
}

async function loadTask(id) {
  const { rows } = await pool.query(
    `SELECT t.*, p.name as project_name, e.name as assigned_to_name
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     LEFT JOIN hr_employees e ON t.assigned_to = e.id
     WHERE t.id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function canAccessTask(req, task) {
  const role = req.user?.role;
  if (isAdminRole(role) || !['employee', 'manager'].includes(role)) return true;

  const ownEmployeeId = await resolveEmployeeId(req.user?.id);
  if (role === 'employee') {
    return Boolean(ownEmployeeId && task.assigned_to === ownEmployeeId);
  }

  return canAssignToEmployee(ownEmployeeId, task.assigned_to);
}

async function resolveProjectId({ project_id, project_name, req }) {
  let resolvedProjectId = project_id || null;
  const cleanProjectName = String(project_name || '').trim();
  if (!resolvedProjectId && cleanProjectName) {
    const existing = await pool.query(
      'SELECT id FROM projects WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [cleanProjectName]
    );
    if (existing.rowCount) {
      resolvedProjectId = existing.rows[0].id;
    } else {
      const projectResult = await pool.query(
        `INSERT INTO projects (id, name, description, status, created_by)
         VALUES ($1, $2, '', 'active', $3)
         RETURNING id`,
        [crypto.randomUUID(), cleanProjectName, realUserId(req)]
      );
      resolvedProjectId = projectResult.rows[0].id;
      bustProductivityCache();
    }
  }
  return resolvedProjectId;
}

// ── Projects ─────────────────────────────────────────────────────────────

router.get('/projects', async (req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.productivity, scopedCacheDescriptor(req, 'projects'));
    const projects = await getOrSetCache(cacheKey, PRODUCTIVITY_TTL, async () => {
      const { rows } = await pool.query(`
        SELECT p.*,
               u.username as created_by_name,
               (SELECT count(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `);
      return rows;
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Server error fetching projects' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO projects (id, name, description, status, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, name, description, status || 'active', realUserId(req)]);

    bustProductivityCache();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server error creating project' });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    
    const { rows } = await pool.query(`
      UPDATE projects 
      SET name = COALESCE($1, name), 
          description = COALESCE($2, description), 
          status = COALESCE($3, status),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [name, description, status, id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    bustProductivityCache();
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Server error updating project' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Project not found' });
    bustProductivityCache();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Server error deleting project' });
  }
});

// ── Tasks ────────────────────────────────────────────────────────────────

router.get('/my-team', async (req, res) => {
  try {
    if (!['manager', 'admin', 'super_admin'].includes(req.user?.role)) {
      return res.status(403).json({ error: 'Only managers can view direct reports.' });
    }

    const cacheKey = buildCacheKey(CACHE_NAMESPACES.productivity, scopedCacheDescriptor(req, 'my-team'));
    const team = await getOrSetCache(cacheKey, PRODUCTIVITY_TTL, async () => {
      if (isAdminRole(req.user?.role)) {
        const { rows } = await pool.query(`
          SELECT e.id, e.employee_code, e.name, e.email, e.department, e.job_title,
                 u.role AS account_role
          FROM hr_employees e
          LEFT JOIN users u ON u.id = e.user_id
          WHERE e.status IN ('active', 'probation')
          ORDER BY e.name ASC
        `);
        return rows;
      }

      const managerEmployeeId = await resolveEmployeeId(req.user?.id);
      if (!managerEmployeeId) return [];

      const { rows } = await pool.query(`
        SELECT e.id, e.employee_code, e.name, e.email, e.department, e.job_title,
               u.role AS account_role
        FROM hr_employees e
        LEFT JOIN users u ON u.id = e.user_id
        WHERE e.id <> $1
          AND e.status IN ('active', 'probation')
          AND e.manager_id = $1
        ORDER BY e.name ASC
      `, [managerEmployeeId]);
      return rows;
    });

    return res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({ error: 'Server error fetching team' });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.productivity, scopedCacheDescriptor(req, 'tasks'));
    const tasks = await getOrSetCache(cacheKey, PRODUCTIVITY_TTL, async () => {
      const role = req.user?.role;
      const values = [];
      let where = '';

      if (role === 'employee') {
        const employeeId = await resolveEmployeeId(req.user?.id);
        if (!employeeId) return [];
        values.push(employeeId);
        where = 'WHERE t.assigned_to = $1';
      } else if (role === 'manager') {
        const managerEmployeeId = await resolveEmployeeId(req.user?.id);
        if (managerEmployeeId) {
          values.push(managerEmployeeId);
          where = `WHERE (t.assigned_to = $1 OR t.assigned_to IN (
            SELECT e.id
            FROM hr_employees e
            WHERE e.id <> $1
              AND e.status IN ('active', 'probation')
              AND e.manager_id = $1
          ))`;
        } else {
          where = 'WHERE 1=0';
        }
      }

      const { rows } = await pool.query(`
        SELECT t.*,
               p.name as project_name,
               e.name as assigned_to_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN hr_employees e ON t.assigned_to = e.id
        ${where}
        ORDER BY t.created_at DESC
      `, values);
      return rows;
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { title, description, project_id, project_name, status, priority, category, assigned_to, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    let nextAssignee = assigned_to || null;

    if (req.user?.role === 'employee') {
      const employeeId = await resolveEmployeeId(req.user?.id);
      if (!employeeId) return res.status(400).json({ error: 'Your employee profile is not linked to this login.' });
      nextAssignee = employeeId;
    }

    if (req.user?.role === 'manager') {
      if (!nextAssignee) return res.status(400).json({ error: 'Assign this task to a direct report.' });
      const managerEmployeeId = await resolveEmployeeId(req.user?.id);
      const allowed = await canAssignToEmployee(managerEmployeeId, nextAssignee);
      if (!allowed) return res.status(400).json({ error: 'Managers can only assign tasks to direct reports.' });
    }

    const resolvedProjectId = await resolveProjectId({ project_id, project_name, req });
    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO tasks (id, title, description, project_id, status, priority, category, assigned_to, due_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id, title, description, resolvedProjectId, 
      status || 'todo', priority || 'medium', category || 'general',
      nextAssignee, due_date || null, realUserId(req)
    ]);

    bustProductivityCache();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await loadTask(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const role = req.user?.role;
    const canAccess = await canAccessTask(req, existing);
    if (!canAccess) return res.status(403).json({ error: 'You do not have access to this task.' });

    if (role === 'employee') {
      const { rows } = await pool.query(`
        UPDATE tasks
        SET status = COALESCE($1, status), updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [req.body.status, id]);
      bustProductivityCache();
      return res.json(rows[0]);
    }

    const { title, description, project_id, project_name, status, priority, category, assigned_to, due_date } = req.body;
    let nextAssignee = assigned_to;

    if (role === 'manager' && nextAssignee !== undefined) {
      if (!nextAssignee) return res.status(400).json({ error: 'Managers must assign tasks to a direct report.' });
      const managerEmployeeId = await resolveEmployeeId(req.user?.id);
      const allowed = await canAssignToEmployee(managerEmployeeId, nextAssignee);
      if (!allowed) return res.status(400).json({ error: 'Managers can only assign tasks to direct reports.' });
    }

    const resolvedProjectId = project_name ? await resolveProjectId({ project_id, project_name, req }) : project_id;
    const { rows } = await pool.query(`
      UPDATE tasks 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
          project_id = COALESCE($3, project_id),
          status = COALESCE($4, status),
          priority = COALESCE($5, priority),
          category = COALESCE($6, category),
          assigned_to = COALESCE($7, assigned_to),
          due_date = COALESCE($8, due_date),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, description, resolvedProjectId, status, priority, category, nextAssignee, due_date, id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    bustProductivityCache();
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'employee') {
      return res.status(403).json({ error: 'Employees cannot delete tasks.' });
    }

    const existing = await loadTask(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const canAccess = await canAccessTask(req, existing);
    if (!canAccess) return res.status(403).json({ error: 'You do not have access to this task.' });

    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Task not found' });
    bustProductivityCache();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

router.get('/tasks/:id/comments', async (req, res) => {
  try {
    const task = await loadTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const allowed = await canAccessTask(req, task);
    if (!allowed) return res.status(403).json({ error: 'You do not have access to this task.' });

    const { rows } = await pool.query(`
      SELECT c.id, c.task_id, c.author_id, c.body, c.created_at,
             COALESCE(u.username, 'Unknown user') AS author_name,
             u.role AS author_role
      FROM task_comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    return res.status(500).json({ error: 'Server error fetching task comments' });
  }
});

router.post('/tasks/:id/comments', async (req, res) => {
  try {
    const task = await loadTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const allowed = await canAccessTask(req, task);
    if (!allowed) return res.status(403).json({ error: 'You do not have access to this task.' });

    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Comment is required.' });

    const authorId = realUserId(req);
    const { rows } = await pool.query(`
      INSERT INTO task_comments (id, task_id, author_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING id, task_id, author_id, body, created_at
    `, [crypto.randomUUID(), req.params.id, authorId, body]);

    return res.status(201).json({
      ...rows[0],
      author_name: req.user?.username || req.user?.email || 'You',
      author_role: req.user?.role || '',
    });
  } catch (error) {
    console.error('Error creating task comment:', error);
    return res.status(500).json({ error: 'Server error creating task comment' });
  }
});

// ── Time Logs ────────────────────────────────────────────────────────────

router.get('/time-logs', async (req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.productivity, scopedCacheDescriptor(req, 'time-logs'));
    const logs = await getOrSetCache(cacheKey, PRODUCTIVITY_TTL, async () => {
      const { rows } = await pool.query(`
        SELECT tl.*,
               t.title as task_title,
               p.name as project_name,
               e.name as employee_name
        FROM time_logs tl
        LEFT JOIN tasks t ON tl.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN hr_employees e ON tl.employee_id = e.id
        ORDER BY tl.date DESC, tl.created_at DESC
      `);
      return rows;
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching time logs:', error);
    res.status(500).json({ error: 'Server error fetching time logs' });
  }
});

router.post('/time-logs', async (req, res) => {
  try {
    const { task_id, employee_id, hours, date, description } = req.body;
    if (!task_id || !hours) return res.status(400).json({ error: 'Task ID and hours are required' });
    if (!employee_id) return res.status(400).json({ error: 'Employee is required' });

    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO time_logs (id, task_id, employee_id, hours, date, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, task_id, employee_id || null, hours, date || new Date().toISOString(), description]);

    bustProductivityCache();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating time log:', error);
    res.status(500).json({ error: 'Server error creating time log' });
  }
});

router.delete('/time-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM time_logs WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Time log not found' });
    bustProductivityCache();
    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Error deleting time log:', error);
    res.status(500).json({ error: 'Server error deleting time log' });
  }
});

export default router;
