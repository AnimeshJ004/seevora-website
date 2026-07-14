import express from 'express';
import pool from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';
import {
  computeDayStatus,
  computeWorkedMinutes,
  generateAttendanceId,
  getKolkataDateSql,
  isTrackedAttendanceRole,
  normalizeAttendanceRow,
  OFFICE_END_TIME,
  OFFICE_START_TIME,
} from '../utils/attendance.js';

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const attendanceHistoryGuard = requireRole('hr', 'manager', 'admin');

export async function recordLoginAttendance(client, user) {
  if (!isTrackedAttendanceRole(user?.role)) return null;

  const result = await client.query(
    `INSERT INTO attendance_records (
      id, user_id, work_date, check_in_at, last_login_at, office_start_time, office_end_time, status, updated_at
    )
     VALUES ($1, $2, ${getKolkataDateSql()}, NOW(), NOW(), $3, $4, 'present', NOW())
     ON CONFLICT (user_id, work_date)
     DO UPDATE SET
       check_in_at = COALESCE(attendance_records.check_in_at, EXCLUDED.check_in_at),
       last_login_at = NOW(),
       check_out_at = NULL,
       office_start_time = EXCLUDED.office_start_time,
       office_end_time = EXCLUDED.office_end_time,
       status = 'present',
       updated_at = NOW()
     RETURNING *`,
    [generateAttendanceId(), user.id, OFFICE_START_TIME, OFFICE_END_TIME]
  );

  invalidateCacheNamespaces(CACHE_NAMESPACES.attendanceToday, CACHE_NAMESPACES.dashboard);

  return result.rows[0] || null;
}

router.post('/clock-in', requireAuth, async (req, res, next) => {
  try {
    const record = await recordLoginAttendance(pool, req.user);
    if (!record) {
      return res.json({ message: 'Attendance is not tracked for this role.' });
    }

    return res.json({
      message: 'Login attendance marked successfully.',
      attendance: normalizeAttendanceRow(record),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/clock-out', requireAuth, async (req, res, next) => {
  try {
    if (!isTrackedAttendanceRole(req.user?.role)) {
      return res.json({ message: 'Attendance is not tracked for this role.' });
    }

    const currentResult = await pool.query(
      `SELECT *
       FROM attendance_records
       WHERE user_id = $1
         AND work_date = ${getKolkataDateSql()}
       LIMIT 1`,
      [req.user.id]
    );
    const current = currentResult.rows[0];

    if (!current) {
      return res.status(404).json({ message: 'No attendance entry was found for today.' });
    }

    const lastLoginAt = current.last_login_at || current.check_in_at;
    const sessionMinutes = computeWorkedMinutes(lastLoginAt, new Date());
    const totalMinutes = (current.worked_minutes || 0) + sessionMinutes;
    const status = computeDayStatus(new Date(), totalMinutes);

    const updated = await pool.query(
      `UPDATE attendance_records
       SET check_out_at = NOW(),
           status = $2,
           worked_minutes = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [current.id, status, totalMinutes]
    );

    invalidateCacheNamespaces(CACHE_NAMESPACES.attendanceToday, CACHE_NAMESPACES.dashboard);

    return res.json({
      message: status === 'full_day'
        ? 'Logout attendance marked as full day.'
        : 'Logout attendance marked as half day.',
      attendance: normalizeAttendanceRow(updated.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (!isTrackedAttendanceRole(req.user?.role)) {
      return res.json({ attendance: null });
    }

    const result = await pool.query(
      `SELECT *
       FROM attendance_records
       WHERE user_id = $1
         AND work_date = ${getKolkataDateSql()}
       LIMIT 1`,
      [req.user.id]
    );

    return res.json({ attendance: normalizeAttendanceRow(result.rows[0] || null) });
  } catch (error) {
    return next(error);
  }
});

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    if (!isTrackedAttendanceRole(req.user?.role)) {
      return res.json({ attendance: [] });
    }

    const result = await pool.query(
      `SELECT *
       FROM attendance_records
       WHERE user_id = $1
       ORDER BY work_date DESC
       LIMIT 30`,
      [req.user.id]
    );

    return res.json({ attendance: result.rows.map((row) => normalizeAttendanceRow(row)) });
  } catch (error) {
    return next(error);
  }
});

router.get('/team', requireAuth, async (req, res, next) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    if (role !== 'manager') {
      return res.status(403).json({ message: 'Manager access is required.' });
    }

    const managerResult = await pool.query(
      'SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    const managerEmployeeId = managerResult.rows[0]?.id || null;

    if (!managerEmployeeId) {
      return res.json({
        officeHours: {
          start: OFFICE_START_TIME,
          end: OFFICE_END_TIME,
          startLabel: '10:00 AM',
          endLabel: '6:00 PM',
        },
        summary: { total: 0, present: 0, fullDay: 0, halfDay: 0, absent: 0 },
        attendance: [],
      });
    }

    const result = await pool.query(`
      SELECT
        e.id,
        e.employee_code,
        e.user_id,
        e.name,
        e.email,
        e.department,
        e.job_title,
        e.status AS employee_status,
        u.role AS account_role,
        a.id AS attendance_id,
        a.work_date,
        a.check_in_at,
        a.last_login_at,
        a.check_out_at,
        a.status,
        a.worked_minutes,
        a.office_start_time,
        a.office_end_time,
        a.created_at,
        a.updated_at
      FROM hr_employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN attendance_records a
        ON a.user_id = e.user_id
       AND a.work_date = ${getKolkataDateSql()}
      WHERE e.id <> $1
        AND e.status IN ('active', 'probation')
        AND e.manager_id = $1
      ORDER BY e.name ASC
    `, [managerEmployeeId]);

    const now = new Date();
    const isPast6PM = now.getHours() >= 18;
    const isSunday = now.getDay() === 0;

    const attendance = result.rows.map((row) => {
      let finalStatus = row.attendance_id ? row.status : (isSunday ? 'leave' : 'absent');
      
      if (!isPast6PM && finalStatus !== 'leave') {
        if (!row.attendance_id) {
          finalStatus = 'pending';
        } else {
          finalStatus = 'present';
        }
      }

      return normalizeAttendanceRow({
        ...row,
        status: finalStatus,
        worked_minutes: row.worked_minutes || 0,
      });
    });

    const summary = attendance.reduce((acc, item) => {
      acc.total += 1;
      if (item.status === 'present') acc.present += 1;
      if (item.status === 'full_day') acc.fullDay += 1;
      if (item.status === 'half_day') acc.halfDay += 1;
      if (item.status === 'absent') acc.absent += 1;
      if (item.status === 'leave') acc.leave += 1;
      if (item.status === 'pending') acc.pending += 1;
      return acc;
    }, { total: 0, present: 0, fullDay: 0, halfDay: 0, absent: 0, leave: 0, pending: 0 });

    return res.json({
      officeHours: {
        start: OFFICE_START_TIME,
        end: OFFICE_END_TIME,
        startLabel: '10:00 AM',
        endLabel: '6:00 PM',
      },
      summary,
      attendance,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/team/employee/:id', requireAuth, async (req, res, next) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    if (role !== 'manager') {
      return res.status(403).json({ message: 'Manager access is required.' });
    }

    const managerResult = await pool.query(
      'SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    const managerEmployeeId = managerResult.rows[0]?.id || null;

    if (!managerEmployeeId) {
      return res.status(403).json({ message: 'Manager profile not found.' });
    }

    const { id } = req.params;

    // Check if employee exists and belongs to this manager
    const empResult = await pool.query(
      'SELECT id, user_id FROM hr_employees WHERE id = $1 AND manager_id = $2 LIMIT 1',
      [id, managerEmployeeId]
    );
    const employee = empResult.rows[0];

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found or not assigned to you.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM hr_employees WHERE id = $1', [employee.id]);
      if (employee.user_id) {
        await client.query("DELETE FROM users WHERE id = $1 AND role IN ('employee', 'manager', 'hr')", [employee.user_id]);
      }
      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

    invalidateCacheNamespaces(
      CACHE_NAMESPACES.hrEmployees,
      CACHE_NAMESPACES.users,
      CACHE_NAMESPACES.attendanceToday,
      CACHE_NAMESPACES.productivity,
      CACHE_NAMESPACES.dashboard,
      CACHE_NAMESPACES.payroll
    );

    return res.json({ message: 'Employee removed successfully.', removedId: id });
  } catch (error) {
    return next(error);
  }
});

router.get('/today', requireAuth, async (req, res, next) => {
  try {
    if (!['hr', 'admin'].includes(String(req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'HR access is required.' });
    }

    const cacheKey = buildCacheKey(CACHE_NAMESPACES.attendanceToday, { view: 'today' });
    const payload = await getOrSetCache(cacheKey, 30, async () => {
      const result = await pool.query(`
      SELECT
        e.id,
        e.employee_code,
        e.user_id,
        e.name,
        e.email,
        e.department,
        e.job_title,
        u.role AS account_role,
        a.id AS attendance_id,
        a.work_date,
        a.check_in_at,
        a.last_login_at,
        a.check_out_at,
        a.status,
        a.worked_minutes,
        a.office_start_time,
        a.office_end_time,
        a.created_at,
        a.updated_at
      FROM hr_employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN attendance_records a
        ON a.user_id = e.user_id
       AND a.work_date = ${getKolkataDateSql()}
      ORDER BY e.created_at DESC
    `);

      const now = new Date();
      const isPast6PM = now.getHours() >= 18;
      const isSunday = now.getDay() === 0;

      const attendance = result.rows.map((row) => {
      let finalStatus = row.attendance_id ? row.status : (isSunday ? 'leave' : 'absent');
      
      if (!isPast6PM && finalStatus !== 'leave') {
        if (!row.attendance_id) {
          finalStatus = 'pending';
        } else {
          finalStatus = 'present';
        }
      }

      return normalizeAttendanceRow({
        ...row,
        status: finalStatus,
        worked_minutes: row.worked_minutes || 0,
      });
    });

      const summary = attendance.reduce((acc, item) => {
      acc.total += 1;
      if (item.status === 'present') acc.present += 1;
      if (item.status === 'full_day') acc.fullDay += 1;
      if (item.status === 'half_day') acc.halfDay += 1;
      if (item.status === 'absent') acc.absent += 1;
      if (item.status === 'leave') acc.leave += 1;
      if (item.status === 'pending') acc.pending += 1;
      return acc;
    }, { total: 0, present: 0, fullDay: 0, halfDay: 0, absent: 0, leave: 0, pending: 0 });

      return {
        officeHours: {
          start: OFFICE_START_TIME,
          end: OFFICE_END_TIME,
          startLabel: '10:00 AM',
          endLabel: '6:00 PM',
        },
        summary,
        attendance,
      };
    });
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get('/employee/:userId/history', attendanceHistoryGuard, async (req, res, next) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    const { userId } = req.params;
    if (!UUID_PATTERN.test(String(userId || ''))) {
      return res.status(400).json({ message: 'A valid employee user ID is required.' });
    }

    let historyRows;
    if (role === 'manager') {
      const scopedResult = await pool.query(
        `WITH authorized_target AS (
           SELECT employee.user_id
           FROM hr_employees employee
           JOIN hr_employees manager ON manager.id = employee.manager_id
           WHERE employee.user_id = $1
             AND manager.user_id = $2
             AND employee.status IN ('active', 'probation')
           LIMIT 1
         )
         SELECT attendance.*
         FROM authorized_target target
         LEFT JOIN attendance_records attendance ON attendance.user_id = target.user_id
         ORDER BY attendance.work_date DESC`,
        [userId, req.user.id]
      );

      if (scopedResult.rows.length === 0) {
        console.warn(JSON.stringify({
          event: 'attendance_history_scope_denied',
          managerUserId: req.user.id,
          targetUserId: userId,
          path: req.originalUrl || req.url,
          timestamp: new Date().toISOString(),
        }));
        return res.status(404).json({ message: 'Employee attendance not found for your team.' });
      }

      historyRows = scopedResult.rows.filter((row) => row.id);
    } else {
      const historyResult = await pool.query(
        `SELECT * FROM attendance_records
         WHERE user_id = $1
         ORDER BY work_date DESC`,
        [userId]
      );
      historyRows = historyResult.rows;
    }

    const history = historyRows.map((row) => normalizeAttendanceRow(row));

    let totalFullDays = 0;
    history.forEach((record) => {
      if (record.status === 'full_day') totalFullDays++;
    });

    // compute current week availability
    const now = new Date();
    // JS getDay(): 0 = Sunday, 1 = Monday. We want Monday=0 to Sunday=6 for week calculation
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    let currentWeekDays = 0;
    history.forEach((record) => {
      const recDate = new Date(record.workDate);
      if (recDate >= startOfWeek && ['present', 'full_day', 'half_day'].includes(record.status)) {
        currentWeekDays++;
      }
    });

    return res.json({
      fullHistory: history,
      totalFullDays,
      currentWeekDays
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
