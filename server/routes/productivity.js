import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

function realUserId(req) {
  return req.user?.id === '00000000-0000-0000-0000-000000000000'
    ? null
    : req.user?.id || null;
}

// ── Projects ─────────────────────────────────────────────────────────────

router.get('/projects', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, 
             u.username as created_by_name,
             (SELECT count(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
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
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Server error deleting project' });
  }
});

// ── Tasks ────────────────────────────────────────────────────────────────

router.get('/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, 
             p.name as project_name,
             e.name as assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN hr_employees e ON t.assigned_to = e.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { title, description, project_id, project_name, status, priority, category, assigned_to, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

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
      }
    }

    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO tasks (id, title, description, project_id, status, priority, category, assigned_to, due_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id, title, description, resolvedProjectId, 
      status || 'todo', priority || 'medium', category || 'general',
      assigned_to || null, due_date || null, realUserId(req)
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, project_id, status, priority, category, assigned_to, due_date } = req.body;
    
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
    `, [title, description, project_id, status, priority, category, assigned_to, due_date, id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

// ── Time Logs ────────────────────────────────────────────────────────────

router.get('/time-logs', async (req, res) => {
  try {
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
    res.json(rows);
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
    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Error deleting time log:', error);
    res.status(500).json({ error: 'Server error deleting time log' });
  }
});

export default router;
