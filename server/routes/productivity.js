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

async function recordTaskActivity(taskId, actorId, actorName, actionType, details = {}) {
  if (!taskId) return;
  try {
    await pool.query(`
      INSERT INTO task_activities (id, task_id, actor_id, actor_name, action_type, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [crypto.randomUUID(), taskId, actorId || null, actorName || 'System', actionType, JSON.stringify(details)]);
  } catch (err) {
    console.error('Failed to record task activity:', err);
  }
}

async function notifyEmployee(employeeId, title, message, type, taskId) {
  if (!employeeId) return;
  try {
    const { rows } = await pool.query('SELECT user_id FROM hr_employees WHERE id = $1 LIMIT 1', [employeeId]);
    const userId = rows[0]?.user_id || null;
    await pool.query(`
      INSERT INTO task_notifications (id, user_id, employee_id, title, message, type, task_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [crypto.randomUUID(), userId, employeeId, title, message, type || 'task_assigned', taskId || null]);
  } catch (err) {
    console.error('Failed to insert task notification:', err);
  }
}

async function loadTask(id) {
  const { rows } = await pool.query(
    `SELECT t.*, p.name as project_name, 
            e.name as assigned_to_name, e.job_title as assigned_to_role, e.department as assigned_to_department,
            (SELECT COUNT(*) FROM task_checklists tc WHERE tc.task_id = t.id) as checklist_total,
            (SELECT COUNT(*) FROM task_checklists tc WHERE tc.task_id = t.id AND tc.is_completed = true) as checklist_completed,
            (SELECT COUNT(*) FROM task_comments tcomm WHERE tcomm.task_id = t.id) as comment_count
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
               e.name as assigned_to_name,
               e.job_title as assigned_to_role,
               e.department as assigned_to_department,
               (SELECT COUNT(*) FROM task_checklists tc WHERE tc.task_id = t.id) as checklist_total,
               (SELECT COUNT(*) FROM task_checklists tc WHERE tc.task_id = t.id AND tc.is_completed = true) as checklist_completed,
               (SELECT COUNT(*) FROM task_comments tcomm WHERE tcomm.task_id = t.id) as comment_count
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

// ── Workflow Summary Metrics ─────────────────────────────────────────────
router.get('/workflow-summary', async (req, res) => {
  try {
    const role = req.user?.role;
    let where = '';
    const values = [];

    if (role === 'employee') {
      const employeeId = await resolveEmployeeId(req.user?.id);
      if (!employeeId) {
        return res.json({ todo: 0, in_progress: 0, review: 0, done: 0, total: 0, overdue: 0, due_today: 0, high_priority: 0 });
      }
      values.push(employeeId);
      where = 'WHERE assigned_to = $1';
    }

    const { rows } = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'review' THEN 1 END) as review,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status <> 'done' THEN 1 END) as overdue,
        COUNT(CASE WHEN due_date = CURRENT_DATE AND status <> 'done' THEN 1 END) as due_today
      FROM tasks
      ${where}
    `, values);

    res.json(rows[0] || { todo: 0, in_progress: 0, review: 0, done: 0, total: 0, overdue: 0, due_today: 0, high_priority: 0 });
  } catch (error) {
    console.error('Error fetching workflow summary:', error);
    res.status(500).json({ error: 'Server error fetching workflow summary' });
  }
});

// ── Task Notifications ───────────────────────────────────────────────────
router.get('/notifications', async (req, res) => {
  try {
    const userId = realUserId(req);
    const empId = await resolveEmployeeId(req.user?.id);

    const conditions = [];
    const values = [];

    if (userId && empId) {
      values.push(userId, empId);
      conditions.push('(n.user_id = $1 OR n.employee_id = $2)');
    } else if (userId) {
      values.push(userId);
      conditions.push('n.user_id = $1');
    } else if (empId) {
      values.push(empId);
      conditions.push('n.employee_id = $1');
    } else {
      return res.json({ notifications: [], unreadCount: 0 });
    }

    const { rows } = await pool.query(`
      SELECT n.*, t.title as task_title, t.status as task_status, t.priority as task_priority
      FROM task_notifications n
      LEFT JOIN tasks t ON n.task_id = t.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
      LIMIT 40
    `, values);

    const unreadCount = rows.filter(r => !r.is_read).length;
    res.json({ notifications: rows, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE task_notifications SET is_read = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Server error updating notification' });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    const userId = realUserId(req);
    const empId = await resolveEmployeeId(req.user?.id);
    if (userId && empId) {
      await pool.query('UPDATE task_notifications SET is_read = true WHERE user_id = $1 OR employee_id = $2', [userId, empId]);
    } else if (userId) {
      await pool.query('UPDATE task_notifications SET is_read = true WHERE user_id = $1', [userId]);
    } else if (empId) {
      await pool.query('UPDATE task_notifications SET is_read = true WHERE employee_id = $1', [empId]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Server error updating notifications' });
  }
});

// ── GET /tasks/:id Single Task with Details ──────────────────────────────
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await loadTask(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const allowed = await canAccessTask(req, task);
    if (!allowed) return res.status(403).json({ error: 'You do not have access to this task.' });

    const [checklistsRes, commentsRes, activitiesRes] = await Promise.all([
      pool.query('SELECT * FROM task_checklists WHERE task_id = $1 ORDER BY sort_order ASC, created_at ASC', [id]),
      pool.query(`
        SELECT c.*, COALESCE(u.username, 'Unknown user') AS author_name, u.role AS author_role
        FROM task_comments c
        LEFT JOIN users u ON u.id = c.author_id
        WHERE c.task_id = $1 ORDER BY c.created_at ASC
      `, [id]),
      pool.query('SELECT * FROM task_activities WHERE task_id = $1 ORDER BY created_at DESC LIMIT 30', [id])
    ]);

    res.json({
      ...task,
      checklists: checklistsRes.rows,
      comments: commentsRes.rows,
      activities: activitiesRes.rows,
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: 'Server error fetching task details' });
  }
});

// ── POST /tasks Create Task ──────────────────────────────────────────────
router.post('/tasks', async (req, res) => {
  try {
    const {
      title, description, project_id, project_name, status, priority, category,
      assigned_to, due_date, estimated_hours, tags, checklists
    } = req.body;

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
    const actorName = req.user?.username || req.user?.name || 'User';

    const { rows } = await pool.query(`
      INSERT INTO tasks (
        id, title, description, project_id, status, priority, category,
        assigned_to, due_date, estimated_hours, tags, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      id, title, description, resolvedProjectId, 
      status || 'todo', priority || 'medium', category || 'general',
      nextAssignee, due_date || null, Number(estimated_hours) || 0,
      Array.isArray(tags) ? tags : [], realUserId(req)
    ]);

    // Record activity
    await recordTaskActivity(id, realUserId(req), actorName, 'created', {
      title, priority: priority || 'medium', status: status || 'todo'
    });

    // Handle initial checklists
    if (Array.isArray(checklists) && checklists.length > 0) {
      for (let i = 0; i < checklists.length; i++) {
        const item = checklists[i];
        const itemTitle = typeof item === 'string' ? item : item.title;
        if (itemTitle && itemTitle.trim()) {
          await pool.query(`
            INSERT INTO task_checklists (id, task_id, title, is_completed, sort_order)
            VALUES ($1, $2, $3, false, $4)
          `, [crypto.randomUUID(), id, itemTitle.trim(), i]);
        }
      }
    }

    // Send assignment notification
    if (nextAssignee) {
      await notifyEmployee(
        nextAssignee,
        'New Task Assigned',
        `${actorName} assigned you task "${title}".`,
        'task_assigned',
        id
      );
    }

    bustProductivityCache();
    const fullTask = await loadTask(id);
    res.status(201).json(fullTask || rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// ── PUT /tasks/:id Update Task ───────────────────────────────────────────
router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await loadTask(id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const role = req.user?.role;
    const canAccess = await canAccessTask(req, existing);
    if (!canAccess) return res.status(403).json({ error: 'You do not have access to this task.' });

    const actorName = req.user?.username || req.user?.name || 'User';

    if (role === 'employee') {
      const nextStatus = req.body.status !== undefined ? req.body.status : existing.status;
      const { rows } = await pool.query(`
        UPDATE tasks
        SET status = COALESCE($1, status), updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [req.body.status, id]);

      if (req.body.status && req.body.status !== existing.status) {
        await recordTaskActivity(id, realUserId(req), actorName, 'status_changed', {
          from: existing.status, to: req.body.status
        });
      }

      bustProductivityCache();
      const updated = await loadTask(id);
      return res.json(updated || rows[0]);
    }

    const {
      title, description, project_id, project_name, status, priority, category,
      assigned_to, due_date, estimated_hours, tags
    } = req.body;

    let nextAssignee = assigned_to !== undefined ? assigned_to : existing.assigned_to;

    if (role === 'manager' && assigned_to !== undefined) {
      if (!assigned_to) return res.status(400).json({ error: 'Managers must assign tasks to a direct report.' });
      const managerEmployeeId = await resolveEmployeeId(req.user?.id);
      const allowed = await canAssignToEmployee(managerEmployeeId, assigned_to);
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
           estimated_hours = COALESCE($9, estimated_hours),
           tags = COALESCE($10, tags),
           updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      title, description, resolvedProjectId, status, priority, category,
      nextAssignee, due_date, 
      estimated_hours !== undefined ? Number(estimated_hours) : null,
      tags !== undefined ? (Array.isArray(tags) ? tags : []) : null,
      id
    ]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    // Activity tracking & Notifications
    if (status && status !== existing.status) {
      await recordTaskActivity(id, realUserId(req), actorName, 'status_changed', {
        from: existing.status, to: status
      });
      if (existing.assigned_to) {
        await notifyEmployee(
          existing.assigned_to,
          'Task Status Updated',
          `Task "${existing.title}" changed status to "${status}".`,
          'status_changed',
          id
        );
      }
    }

    if (assigned_to !== undefined && assigned_to !== existing.assigned_to) {
      await recordTaskActivity(id, realUserId(req), actorName, 'assigned', {
        to: assigned_to
      });
      if (assigned_to) {
        await notifyEmployee(
          assigned_to,
          'Task Assigned to You',
          `${actorName} assigned you to "${existing.title}".`,
          'task_assigned',
          id
        );
      }
    }

    if (priority && priority !== existing.priority) {
      await recordTaskActivity(id, realUserId(req), actorName, 'priority_changed', {
        from: existing.priority, to: priority
      });
    }

    bustProductivityCache();
    const updated = await loadTask(id);
    res.json(updated || rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

// ── Checklists Endpoints ─────────────────────────────────────────────────
router.get('/tasks/:id/checklists', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT * FROM task_checklists 
      WHERE task_id = $1 
      ORDER BY sort_order ASC, created_at ASC
    `, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ error: 'Server error fetching checklists' });
  }
});

router.post('/tasks/:id/checklists', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Checklist item title is required' });
    }
    const itemId = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO task_checklists (id, task_id, title, is_completed)
      VALUES ($1, $2, $3, false)
      RETURNING *
    `, [itemId, id, title.trim()]);

    const actorName = req.user?.username || req.user?.name || 'User';
    await recordTaskActivity(id, realUserId(req), actorName, 'checklist_added', { title: title.trim() });
    bustProductivityCache();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding checklist item:', error);
    res.status(500).json({ error: 'Server error creating checklist item' });
  }
});

router.put('/tasks/:id/checklists/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { is_completed, title } = req.body;
    const { rows } = await pool.query(`
      UPDATE task_checklists
      SET 
        is_completed = COALESCE($1, is_completed),
        title = COALESCE($2, title)
      WHERE id = $3 AND task_id = $4
      RETURNING *
    `, [is_completed !== undefined ? Boolean(is_completed) : null, title ? title.trim() : null, itemId, id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Checklist item not found' });
    bustProductivityCache();
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({ error: 'Server error updating checklist item' });
  }
});

router.delete('/tasks/:id/checklists/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { rowCount } = await pool.query('DELETE FROM task_checklists WHERE id = $1 AND task_id = $2', [itemId, id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Checklist item not found' });
    bustProductivityCache();
    res.json({ message: 'Checklist item deleted' });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    res.status(500).json({ error: 'Server error deleting checklist item' });
  }
});

// ── Activities Endpoint ──────────────────────────────────────────────────
router.get('/tasks/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT * FROM task_activities 
      WHERE task_id = $1 
      ORDER BY created_at DESC
      LIMIT 40
    `, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching task activities:', error);
    res.status(500).json({ error: 'Server error fetching activities' });
  }
});

// ── DELETE /tasks/:id Delete Task ────────────────────────────────────────
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
