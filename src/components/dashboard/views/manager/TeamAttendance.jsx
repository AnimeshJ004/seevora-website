import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Badge, StatsGrid } from '../shared';
import { hrApiFetch } from '../hr/hrApi';

const OFFICE_START = '10:00 AM';
const OFFICE_END = '6:30 PM';

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
    default:
      return { label: 'Absent', color: 'gray' };
  }
}

export default function TeamAttendance({ user }) {
  const [data, setData] = useState({ attendance: [], summary: null, officeHours: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadAttendance = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await hrApiFetch('/api/attendance/team');
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.message || 'Unable to load team attendance.');
        return;
      }

      setData({
        attendance: payload.attendance || [],
        summary: payload.summary || null,
        officeHours: payload.officeHours || null,
      });
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();

    const refresh = () => loadAttendance();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const stats = useMemo(() => ([
    { label: 'Team Size', value: data.summary?.total || 0, color: 'blue' },
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
        title="Team Attendance"
        meta={isLoading ? 'Loading today’s logs...' : `${data.attendance.length} team member records`}
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
                const isSelf = entry.userId && user?.id && entry.userId === user.id;
                return (
                  <tr key={entry.id}>
                    <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {entry.name}{isSelf ? ' (You)' : ''}
                      </div>
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
    </div>
  );
}
