import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Panel, Badge, StatsGrid } from '../shared';
import { hrApiFetch } from '../hr/hrApi';

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

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

export default function MyAttendance({ user }) {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const lastFetchedRef = useRef(0);

  const loadAttendance = async () => {
    setIsLoading(true);
    setError('');
    lastFetchedRef.current = Date.now();

    try {
      const [todayRes, historyRes] = await Promise.all([
        hrApiFetch('/api/attendance/me'),
        hrApiFetch('/api/attendance/history'),
      ]);
      const todayPayload = await todayRes.json().catch(() => ({}));
      const historyPayload = await historyRes.json().catch(() => ({}));

      if (!todayRes.ok || !historyRes.ok) {
        setError(todayPayload.message || historyPayload.message || 'Unable to load attendance.');
        return;
      }

      setToday(todayPayload.attendance || null);
      setHistory(historyPayload.attendance || []);
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();

    const refresh = () => loadAttendance();
    const handleFocus = () => {
      if (Date.now() - lastFetchedRef.current > 60_000) {
        loadAttendance();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const stats = useMemo(() => {
    const meta = today ? statusMeta(today.status) : statusMeta('absent');
    return [
      { label: 'Today\'s Status', value: today ? meta.label : 'Not marked yet', color: today ? meta.color : 'gray' },
      { label: 'Login Time', value: formatTime(today?.checkInAt), color: 'blue' },
      { label: 'Logout Time', value: formatTime(today?.checkOutAt), color: 'purple' },
      { label: 'Hours Worked', value: today ? `${today.workedHours} hrs` : '0.0 hrs', color: 'orange' },
    ];
  }, [today]);

  return (
    <div>
      <Panel
        title="My Attendance"
        meta={isLoading ? 'Loading your attendance...' : `${user?.name || user?.username || 'Employee'}'s attendance`}
        style={{ marginBottom: 18 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>
            Office hours: <strong style={{ color: 'var(--text-primary)' }}>{OFFICE_START}</strong> to <strong style={{ color: 'var(--text-primary)' }}>{OFFICE_END}</strong>
          </div>
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

        {error && (
          <div style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <StatsGrid cols={4} stats={stats} />
      </Panel>

      <Panel
        title="Recent Attendance History"
        meta={`${history.length} recorded day${history.length === 1 ? '' : 's'}`}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Login Time', 'Logout Time', 'Hours', 'Status'].map((heading) => (
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
              {!isLoading && history.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                    No attendance records yet.
                  </td>
                </tr>
              )}
              {history.map((entry) => {
                const meta = statusMeta(entry.status);
                return (
                  <tr key={entry.id}>
                    <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {formatDate(entry.workDate)}
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
