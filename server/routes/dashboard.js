import express from 'express';
import pool from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getCache, setCache } from '../utils/cache.js';

const router = express.Router();

let fetchPromise = null;

router.get('/stats', requireAuth, requireRole('super_admin', 'admin', 'hr', 'manager'), async (req, res) => {
  try {
    const cachedStats = getCache('dashboard_stats');
    if (cachedStats) {
      return res.json(cachedStats);
    }

    if (fetchPromise) {
      const data = await fetchPromise;
      return res.json(data);
    }

    fetchPromise = (async () => {
      const data = {};

      // Run queries sequentially to prevent exhausting the database connection pool
      const empRes = await pool.query('SELECT COUNT(*) as count FROM hr_employees WHERE status = $1', ['active']);
      const leadsCountRes = await pool.query('SELECT COUNT(*) as count FROM leads');
      const recentLeadsRes = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5');
      const recentBusinessesRes = await pool.query('SELECT id, name, contact_email as email, created_at, status FROM businesses ORDER BY created_at DESC LIMIT 5');
      const projectsRes = await pool.query('SELECT COUNT(*) as count FROM projects WHERE status = $1', ['active']);
      const tasksRes = await pool.query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
      const apptCountRes = await pool.query('SELECT COUNT(*) as count FROM appointments');
      const upcomingApptRes = await pool.query(`
        SELECT * FROM appointments 
        WHERE scheduled_at >= CURRENT_DATE 
        ORDER BY scheduled_at ASC 
        LIMIT 5
      `);
      const attendanceRes = await pool.query(`
        SELECT COUNT(*) as count FROM attendance_records 
        WHERE work_date = CURRENT_DATE AND status = 'present'
      `);
      const auditRequestRes = await pool.query(`
        SELECT id, name, email, company, phone, message, status, created_at
        FROM audit_requests
        WHERE status IN ('new', 'user_replied')
        ORDER BY created_at DESC
        LIMIT 5
      `);
      const auditRes = await pool.query(`
        SELECT a.*, u.username as user_name 
        FROM system_audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC 
        LIMIT 5
      `);

    // 1. Employees count
    data.employeesCount = parseInt(empRes.rows[0].count);

    // 2. Leads count & Recent leads
    data.leadsCount = parseInt(leadsCountRes.rows[0].count);
    data.recentLeads = recentLeadsRes.rows;

    // 2b. Recent Businesses
    data.recentBusinesses = recentBusinessesRes.rows;

    // 3. Active Projects count
    data.projectsCount = parseInt(projectsRes.rows[0].count);

    // 4. Tasks by status
    data.taskStats = { todo: 0, in_progress: 0, done: 0 };
    tasksRes.rows.forEach(row => {
      if (data.taskStats[row.status] !== undefined) {
        data.taskStats[row.status] = parseInt(row.count);
      }
    });

    // 5. Appointments
    data.appointmentsCount = parseInt(apptCountRes.rows[0].count);
    data.upcomingAppointments = upcomingApptRes.rows;

    // 6. Attendance for today
    data.presentToday = parseInt(attendanceRes.rows[0].count);

    // 7. Client audit request messages
    data.auditRequestsCount = auditRequestRes.rows.length;
    data.recentAuditRequests = auditRequestRes.rows;

      // 8. Recent System Activity
      data.recentAuditLogs = auditRes.rows;

      setCache('dashboard_stats', data, 60); // 60 seconds TTL
      return data;
    })();

    const data = await fetchPromise;
    fetchPromise = null;
    res.json(data);
  } catch (error) {
    fetchPromise = null;
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error fetching dashboard stats' });
  }
});

export default router;
