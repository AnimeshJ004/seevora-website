import React, { useEffect, useState } from 'react';
import { Panel, Badge, StatsGrid } from './shared';
import { hrApiFetch } from './hr/hrApi';

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
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusMeta(status) {
  switch (status) {
    case 'full_day': return { label: 'Full Day', color: 'green' };
    case 'half_day': return { label: 'Half Day', color: 'orange' };
    case 'present': return { label: 'Present', color: 'cyan' };
    case 'leave': return { label: 'Leave', color: 'purple' };
    case 'pending': return { label: 'Not Marked', color: 'gray' };
    default: return { label: 'Absent', color: 'gray' };
  }
}

export default function EmployeeAttendancePanel({ employee, onClose }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employee?.userId) return;
    setIsLoading(true);
    setError('');
    
    hrApiFetch(`/api/hr/attendance/employee/${employee.userId}/history`)
      .then(res => res.json())
      .then(payload => {
        if (payload.message && !payload.fullHistory) {
          setError(payload.message);
        } else {
          setData(payload);
        }
      })
      .catch(() => setError('Unable to reach server.'))
      .finally(() => setIsLoading(false));
  }, [employee]);

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 640,
      background: 'var(--bg-card)', zIndex: 99999, borderLeft: '1px solid var(--glass-border)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
    }}>
      <div style={{
        padding: '24px 32px', borderBottom: '1px solid var(--glass-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {employee.name}'s Attendance
          </h2>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            {employee.department} • {employee.email}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
            width: 40, height: 40, borderRadius: '50%', color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        {isLoading && <div style={{ color: 'var(--text-secondary)' }}>Loading history...</div>}
        {error && <div style={{ color: 'var(--accent-pink)' }}>{error}</div>}
        
        {!isLoading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <StatsGrid
              cols={2}
              stats={[
                { label: 'Available This Week', value: `${data.currentWeekDays} / 6`, color: 'blue' },
                { label: 'Total Full Working Days', value: data.totalFullDays, color: 'green' }
              ]}
            />

            <Panel title="Full History">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Date', 'Login', 'Logout', 'Hours', 'Status'].map(heading => (
                        <th key={heading} style={{
                          textAlign: 'left', fontSize: '0.72rem', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: 'var(--text-muted)', padding: '0 10px 12px 0',
                          borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap'
                        }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.fullHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                          No history found.
                        </td>
                      </tr>
                    ) : data.fullHistory.map(entry => {
                      const meta = statusMeta(entry.status);
                      return (
                        <tr key={entry.id}>
                          <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {formatDate(entry.workDate)}
                          </td>
                          <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            <div>{formatTime(entry.checkInAt)}</div>
                            {entry.lastLoginAt && entry.checkInAt !== entry.lastLoginAt && (
                              <div style={{ color: 'var(--accent-cyan)', fontSize: '0.72rem', marginTop: 2 }}>Re: {formatTime(entry.lastLoginAt)}</div>
                            )}
                          </td>
                          <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {formatTime(entry.checkOutAt)}
                          </td>
                          <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {entry.status === 'present' ? `${entry.workedHours} hrs (In progress)` : `${entry.workedHours} hrs`}
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
        )}
      </div>
    </div>
  );
}
