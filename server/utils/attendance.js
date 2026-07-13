import crypto from 'crypto';

export const OFFICE_START_TIME = '10:00:00';
export const OFFICE_END_TIME = '18:00:00';
export const TRACKED_ATTENDANCE_ROLES = new Set(['employee', 'manager', 'hr']);

export function isTrackedAttendanceRole(role) {
  return TRACKED_ATTENDANCE_ROLES.has(String(role || '').toLowerCase());
}

export function generateAttendanceId() {
  return crypto.randomUUID();
}

export function getKolkataDateSql() {
  return "timezone('Asia/Kolkata', NOW())::date";
}

export function formatKolkataDateTime(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

export function formatKolkataTime(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

export function computeDayStatus(checkOutAt, totalMinutes = 0) {
  if (!checkOutAt) return 'present';
  if (totalMinutes >= 480) return 'full_day';
  if (totalMinutes >= 240) return 'half_day';
  return 'absent';
}

export function computeWorkedMinutes(checkInAt, checkOutAt) {
  if (!checkInAt || !checkOutAt) return 0;
  const diff = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

export function normalizeAttendanceRow(row) {
  if (!row) return null;
  let liveMinutes = Number(row.worked_minutes || 0);
  if (row.status === 'present' && row.last_login_at) {
    liveMinutes += computeWorkedMinutes(row.last_login_at, new Date());
  }

  return {
    id: row.attendance_id || row.id,
    employeeCode: row.employee_code,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    department: row.department,
    jobTitle: row.job_title,
    employeeStatus: row.employee_status,
    accountRole: row.account_role || 'employee',
    workDate: row.work_date,
    checkInAt: row.check_in_at,
    lastLoginAt: row.last_login_at,
    checkOutAt: row.check_out_at,
    loginTime: formatKolkataTime(row.check_in_at),
    lastLoginTime: formatKolkataTime(row.last_login_at),
    logoutTime: formatKolkataTime(row.check_out_at),
    status: row.status || 'absent',
    workedMinutes: liveMinutes,
    workedHours: (liveMinutes / 60).toFixed(1),
    officeStartTime: row.office_start_time || OFFICE_START_TIME,
    officeEndTime: row.office_end_time || OFFICE_END_TIME,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
