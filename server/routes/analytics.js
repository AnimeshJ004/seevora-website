import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES } from '../utils/cacheNamespaces.js';

const router = express.Router();
const ANALYTICS_ROLES = ['admin', 'manager'];

function toInt(value) {
  return Number.parseInt(value || 0, 10);
}

function toFloat(value) {
  return Number.parseFloat(value || 0);
}

async function count(query, params = []) {
  const { rows } = await pool.query(query, params);
  return toInt(rows[0]?.count);
}

router.get('/manager', requireRole(ANALYTICS_ROLES), async (_req, res, next) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.analytics, { view: 'manager' });
    const payload = await getOrSetCache(cacheKey, 60, async () => {

    const [
      totals,
      leadStages,
      leadSources,
      appointmentsByStatus,
      taskStatus,
      taskPriority,
      emailSummary,
      recentLeads,
      upcomingAppointments,
      productivity,
      dailyLeads,
    ] = await Promise.all([
      Promise.all([
        count('SELECT COUNT(*) AS count FROM leads'),
        count("SELECT COUNT(*) AS count FROM leads WHERE pipeline_stage = 'closed'"),
        count("SELECT COUNT(*) AS count FROM leads WHERE next_follow_up_at IS NOT NULL AND next_follow_up_at <= NOW()"),
        count('SELECT COUNT(*) AS count FROM appointments'),
        count("SELECT COUNT(*) AS count FROM appointments WHERE scheduled_at >= NOW() AND status = 'scheduled'"),
        count("SELECT COUNT(*) AS count FROM appointments WHERE status = 'completed'"),
        count('SELECT COUNT(*) AS count FROM tasks'),
        count("SELECT COUNT(*) AS count FROM tasks WHERE status <> 'done'"),
        count("SELECT COUNT(*) AS count FROM projects WHERE status = 'active'"),
      ]),
      pool.query(`
        SELECT pipeline_stage AS label, COUNT(*) AS count
        FROM leads
        GROUP BY pipeline_stage
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT COALESCE(NULLIF(source, ''), 'unknown') AS label, COUNT(*) AS count
        FROM leads
        GROUP BY COALESCE(NULLIF(source, ''), 'unknown')
        ORDER BY count DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT status AS label, COUNT(*) AS count
        FROM appointments
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT status AS label, COUNT(*) AS count
        FROM tasks
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT priority AS label, COUNT(*) AS count
        FROM tasks
        GROUP BY priority
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'sent') AS sent,
          COUNT(*) FILTER (WHERE status = 'failed') AS failed,
          COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS opened,
          COUNT(*) FILTER (WHERE replied_at IS NOT NULL) AS replied
        FROM email_logs
        WHERE sent_at >= NOW() - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT id, name, company, email, source, pipeline_stage, score, next_follow_up_at, created_at
        FROM leads
        ORDER BY created_at DESC
        LIMIT 6
      `),
      pool.query(`
        SELECT id, title, client_name, client_email, scheduled_at, duration, status
        FROM appointments
        WHERE scheduled_at >= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 6
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(hours), 0) AS logged_hours,
          COUNT(DISTINCT employee_id) AS active_people,
          COUNT(DISTINCT project_id) AS active_projects
        FROM time_logs
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT TO_CHAR(day, 'YYYY-MM-DD') AS label, COUNT(l.id) AS count
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS day
        LEFT JOIN leads l ON l.created_at::date = day::date
        GROUP BY day
        ORDER BY day
      `),
    ]);

    const [
      leadsTotal,
      leadsClosed,
      followUpsDue,
      appointmentsTotal,
      appointmentsUpcoming,
      appointmentsCompleted,
      tasksTotal,
      tasksOpen,
      projectsActive,
    ] = totals;

    const email = emailSummary.rows[0] || {};
    const conversionRate = leadsTotal ? Math.round((leadsClosed / leadsTotal) * 100) : 0;
    const appointmentCompletionRate = appointmentsTotal
      ? Math.round((appointmentsCompleted / appointmentsTotal) * 100)
      : 0;
    const emailReplyRate = toInt(email.sent)
      ? Math.round((toInt(email.replied) / toInt(email.sent)) * 100)
      : 0;

    const data = {
      summary: {
        leadsTotal,
        leadsClosed,
        conversionRate,
        followUpsDue,
        appointmentsTotal,
        appointmentsUpcoming,
        appointmentCompletionRate,
        tasksTotal,
        tasksOpen,
        projectsActive,
        emailSent30d: toInt(email.sent),
        emailFailed30d: toInt(email.failed),
        emailOpened30d: toInt(email.opened),
        emailReplied30d: toInt(email.replied),
        emailReplyRate,
        loggedHours30d: Math.round(toFloat(productivity.rows[0]?.logged_hours) * 10) / 10,
        activePeople30d: toInt(productivity.rows[0]?.active_people),
        activeProjects30d: toInt(productivity.rows[0]?.active_projects),
      },
      charts: {
        leadStages: leadStages.rows.map((row) => ({ label: row.label || 'new', count: toInt(row.count) })),
        leadSources: leadSources.rows.map((row) => ({ label: row.label, count: toInt(row.count) })),
        appointmentsByStatus: appointmentsByStatus.rows.map((row) => ({ label: row.label || 'scheduled', count: toInt(row.count) })),
        taskStatus: taskStatus.rows.map((row) => ({ label: row.label || 'todo', count: toInt(row.count) })),
        taskPriority: taskPriority.rows.map((row) => ({ label: row.label || 'medium', count: toInt(row.count) })),
        dailyLeads: dailyLeads.rows.map((row) => ({ label: row.label, count: toInt(row.count) })),
      },
      recentLeads: recentLeads.rows.map((row) => ({
        id: row.id,
        name: row.name,
        company: row.company,
        email: row.email,
        source: row.source,
        pipelineStage: row.pipeline_stage,
        score: row.score,
        nextFollowUpAt: row.next_follow_up_at,
        createdAt: row.created_at,
      })),
      upcomingAppointments: upcomingAppointments.rows.map((row) => ({
        id: row.id,
        title: row.title,
        clientName: row.client_name,
        clientEmail: row.client_email,
        scheduledAt: row.scheduled_at,
        duration: row.duration,
        status: row.status,
      })),
    };

      return data;
    });
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
