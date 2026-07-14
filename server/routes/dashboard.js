import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES } from '../utils/cacheNamespaces.js';

const router = express.Router();

router.get('/stats', requireRole('admin', 'hr', 'manager'), async (_req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.dashboard, { view: 'stats' });
    const data = await getOrSetCache(cacheKey, 60, async () => {
      const [
        empRes,
        leadsCountRes,
        recentLeadsRes,
        recentBusinessesRes,
        projectsRes,
        tasksRes,
        apptCountRes,
        upcomingApptRes,
        attendanceRes,
        auditRequestRes,
        auditRes,
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM hr_employees WHERE status = $1', ['active']),
        pool.query('SELECT COUNT(*) as count FROM leads'),
        pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5'),
        pool.query('SELECT id, name, contact_email as email, created_at, status FROM businesses ORDER BY created_at DESC LIMIT 5'),
        pool.query('SELECT COUNT(*) as count FROM projects WHERE status = $1', ['active']),
        pool.query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status'),
        pool.query('SELECT COUNT(*) as count FROM appointments'),
        pool.query(`
          SELECT * FROM appointments
          WHERE scheduled_at >= CURRENT_DATE
          ORDER BY scheduled_at ASC
          LIMIT 5
        `),
        pool.query(`
          SELECT COUNT(*) as count FROM attendance_records
          WHERE work_date = CURRENT_DATE AND status = 'present'
        `),
        pool.query(`
          SELECT id, name, email, company, phone, message, status, created_at
          FROM audit_requests
          WHERE status IN ('new', 'user_replied')
          ORDER BY created_at DESC
          LIMIT 5
        `),
        pool.query(`
          SELECT a.*, u.username as user_name
          FROM system_audit_logs a
          LEFT JOIN users u ON a.user_id = u.id
          ORDER BY a.created_at DESC
          LIMIT 5
        `),
      ]);

      const taskStats = { todo: 0, in_progress: 0, done: 0 };
      tasksRes.rows.forEach((row) => {
        if (taskStats[row.status] !== undefined) taskStats[row.status] = Number(row.count);
      });

      return {
        employeesCount: Number(empRes.rows[0].count),
        leadsCount: Number(leadsCountRes.rows[0].count),
        recentLeads: recentLeadsRes.rows,
        recentBusinesses: recentBusinessesRes.rows,
        projectsCount: Number(projectsRes.rows[0].count),
        taskStats,
        appointmentsCount: Number(apptCountRes.rows[0].count),
        upcomingAppointments: upcomingApptRes.rows,
        presentToday: Number(attendanceRes.rows[0].count),
        auditRequestsCount: auditRequestRes.rows.length,
        recentAuditRequests: auditRequestRes.rows,
        recentAuditLogs: auditRes.rows,
      };
    });

    return res.json(data);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Server error fetching dashboard stats' });
  }
});

export default router;
