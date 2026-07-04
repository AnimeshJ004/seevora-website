import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
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

export async function recordLoginAttendance(client, user) {
  if (!isTrackedAttendanceRole(user?.role)) return null;

  const result = await client.query(
    `INSERT INTO attendance_records (
      id, user_id, work_date, check_in_at, office_start_time, office_end_time, status, updated_at
    )
     VALUES ($1, $2, ${getKolkataDateSql()}, NOW(), $3, $4, 'present', NOW())
     ON CONFLICT (user_id, work_date)
     DO UPDATE SET
       check_in_at = COALESCE(attendance_records.check_in_at, EXCLUDED.check_in_at),
       office_start_time = EXCLUDED.office_start_time,
       office_end_time = EXCLUDED.office_end_time,
       status = CASE
         WHEN attendance_records.check_out_at IS NULL THEN 'present'
         ELSE attendance_records.status
       END,
       updated_at = NOW()
     RETURNING *`,
    [generateAttendanceId(), user.id, OFFICE_START_TIME, OFFICE_END_TIME]
  );

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

    if (current.check_out_at) {
      return res.json({
        message: 'Attendance already finalized for today.',
        attendance: normalizeAttendanceRow(current),
      });
    }

    const status = computeDayStatus(new Date());
    const workedMinutes = computeWorkedMinutes(current.check_in_at, new Date());

    const updated = await pool.query(
      `UPDATE attendance_records
       SET check_out_at = NOW(),
           status = $2,
           worked_minutes = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [current.id, status, workedMinutes]
    );

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
          endLabel: '6:30 PM',
        },
        summary: { total: 0, present: 0, fullDay: 0, halfDay: 0, absent: 0 },
        attendance: [],
      });
    }

    const directReportsResult = await pool.query(
      'SELECT 1 FROM hr_employees WHERE manager_id = $1 LIMIT 1',
      [managerEmployeeId]
    );
    const directReportsExist = directReportsResult.rowCount > 0;

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
      WHERE e.status = 'active'
        AND (
          e.id = $1
          OR (
            COALESCE(u.role, 'employee') = 'employee'
            AND (e.manager_id = $1 OR ($2 = false AND e.manager_id IS NULL))
          )
        )
      ORDER BY (e.id = $1) DESC, e.name ASC
    `, [managerEmployeeId, directReportsExist]);

    const attendance = result.rows.map((row) => normalizeAttendanceRow({
      ...row,
      status: row.attendance_id ? row.status : 'absent',
      worked_minutes: row.worked_minutes || 0,
    }));

    const summary = attendance.reduce((acc, item) => {
      acc.total += 1;
      if (item.status === 'present') acc.present += 1;
      if (item.status === 'full_day') acc.fullDay += 1;
      if (item.status === 'half_day') acc.halfDay += 1;
      if (item.status === 'absent') acc.absent += 1;
      return acc;
    }, { total: 0, present: 0, fullDay: 0, halfDay: 0, absent: 0 });

    return res.json({
      officeHours: {
        start: OFFICE_START_TIME,
        end: OFFICE_END_TIME,
        startLabel: '10:00 AM',
        endLabel: '6:30 PM',
      },
      summary,
      attendance,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/today', requireAuth, async (req, res, next) => {
  try {
    if (!['hr', 'super_admin'].includes(String(req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'HR access is required.' });
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
        u.role AS account_role,
        a.id AS attendance_id,
        a.work_date,
        a.check_in_at,
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

    const attendance = result.rows.map((row) => normalizeAttendanceRow({
      ...row,
      status: row.attendance_id ? row.status : 'absent',
      worked_minutes: row.worked_minutes || 0,
    }));

    const summary = attendance.reduce((acc, item) => {
      acc.total += 1;
      if (item.status === 'present') acc.present += 1;
      if (item.status === 'full_day') acc.fullDay += 1;
      if (item.status === 'half_day') acc.halfDay += 1;
      if (item.status === 'absent') acc.absent += 1;
      return acc;
    }, { total: 0, present: 0, fullDay: 0, halfDay: 0, absent: 0 });

    return res.json({
      officeHours: {
        start: OFFICE_START_TIME,
        end: OFFICE_END_TIME,
        startLabel: '10:00 AM',
        endLabel: '6:30 PM',
      },
      summary,
      attendance,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
