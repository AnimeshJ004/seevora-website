import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Badge, StatsGrid } from '../shared';
import EmployeeAttendancePanel from '../EmployeeAttendancePanel';
import { hrApiFetch } from './hrApi';

const OFFICE_START = '10:00 AM';
const OFFICE_END = '6:00 PM';

function formatTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusMeta(status) {
  switch (status) {
    case 'full_day':
      return { label: 'Full Day', color: 'green' };
    case 'half_day':
      return { label: 'Half Day', color: 'orange' };
    case 'present':
      return { label: 'Present', color: 'cyan' };
    case 'leave':
      return { label: 'Leave', color: 'purple' };
    default:
      return { label: 'Absent', color: 'gray' };
  }
}

export default function Attendance() {
  const [data, setData] = useState({ attendance: [], summary: null, officeHours: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const loadAttendance = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await hrApiFetch('/api/hr/attendance/today');
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.message || 'Unable to load attendance.');
        return;
      }

      setData({
        attendance: payload.attendance || [],
        summary: payload.summary || null,
        officeHours: payload.officeHours || null,
      });
    } catch {
      setError('Unable to reach the HR server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();

    const refresh = () => loadAttendance();
    window.addEventListener('focus', refresh);
    window.addEventListener('seevora:hr-attendance-changed', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('seevora:hr-attendance-changed', refresh);
    };
  }, []);

  const stats = useMemo(() => ([
    { label: 'Total Employees', value: data.summary?.total || 0, color: 'blue' },
    { label: 'Present', value: data.summary?.present || 0, color: 'green' },
    { label: 'Full Day', value: data.summary?.fullDay || 0, color: 'purple' },
    { label: 'Half Day / Absent', value: (data.summary?.halfDay || 0) + (data.summary?.absent || 0), color: 'orange' },
  ]), [data.summary]);

  const filteredAttendance = useMemo(() => {
    return data.attendance.filter((entry) => {
      if (filterStatus === 'ALL') return true;
      return entry.status === filterStatus;
    });
  }, [data.attendance, filterStatus]);

  return (
    <div>
      <Panel
        title="Attendance"
        meta={isLoading ? 'Loading today’s logs...' : `${data.attendance.length} employee records`}
        style={{ marginBottom: 18 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>
            Office hours: <strong style={{ color: 'var(--text-primary)' }}>{OFFICE_START}</strong> to <strong style={{ color: 'var(--text-primary)' }}>{OFFICE_END}</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 100,
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-space)',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="present">Present (In Progress)</option>
              <option value="full_day">Full Day</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
            <button
              type="button"
              onClick={loadAttendance}
              style={{
                padding: '8px 14px',
                borderRadius: 100,
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-space)',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <StatsGrid cols={4} stats={stats} />

        {error && (
          <div style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employee', 'Department', 'Login Time', 'Logout Time', 'Hours', 'Status'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: 'left',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      padding: '0 10px 12px 0',
                      borderBottom: '1px solid var(--glass-border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!isLoading && filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                    No matching attendance records.
                  </td>
                </tr>
              )}
              {filteredAttendance.map((entry) => {
                const meta = statusMeta(entry.status);
                return (
                  <tr 
                    key={entry.id} 
                    onClick={() => setSelectedEmployee(entry)}
                    style={{ cursor: 'pointer' }}
                    className="hover-row"
                  >
                    <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{entry.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{entry.email}</div>
                    </td>
                    <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {entry.department}
                    </td>
                    <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {formatTime(entry.checkInAt)}
                    </td>
                    <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {formatTime(entry.checkOutAt)}
                    </td>
                    <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {entry.status === 'present' ? 'In progress' : `${entry.workedHours} hrs`}
                    </td>
                    <td style={{ padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <Badge label={meta.label} color={meta.color} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Attendance Rules">
        <div style={{ display: 'grid', gap: 10, color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.7 }}>
          <div>Login marks the employee as <strong style={{ color: 'var(--text-primary)' }}>Present</strong> with login time.</div>
          <div>Logout after <strong style={{ color: 'var(--text-primary)' }}>6:00 PM</strong> marks the day as <strong style={{ color: 'var(--text-primary)' }}>Full Day</strong>.</div>
          <div>Logout before office end marks the day as <strong style={{ color: 'var(--text-primary)' }}>Half Day</strong>.</div>
          <div>The table shows both login and logout timestamps for each employee.</div>
        </div>
      </Panel>
      
      {selectedEmployee && (
        <EmployeeAttendancePanel 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}
