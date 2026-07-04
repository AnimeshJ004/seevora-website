import React, { useCallback, useEffect, useMemo, useState } from 'react';

const theme = {
  page: '#f8fafc',
  card: '#ffffff',
  border: '#dbe3ef',
  text: '#0f172a',
  muted: '#64748b',
  soft: '#f1f5f9',
  primary: '#f97316',
  blue: '#2563eb',
  green: '#059669',
  red: '#dc2626',
  purple: '#7c3aed',
};

function getToken(user) {
  return user?.token || localStorage.getItem('seevoraAuthToken') || localStorage.getItem('seevora_token') || '';
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0)}%`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function titleize(value) {
  return String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function SummaryCard({ label, value, note, color = theme.primary }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 16, minHeight: 104 }}>
      <div style={{ color: theme.muted, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ color: theme.text, fontSize: 28, fontWeight: 900, marginTop: 8, lineHeight: 1 }}>{value}</div>
      {note && <div style={{ color, fontSize: 12, fontWeight: 800, marginTop: 10 }}>{note}</div>}
    </div>
  );
}

function Panel({ title, children, meta }) {
  return (
    <section style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 18, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: theme.text, fontSize: 15, fontWeight: 900 }}>{title}</h3>
        {meta && <span style={{ color: theme.muted, fontSize: 12, fontWeight: 700 }}>{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function BarList({ rows, color = theme.primary, empty = 'No data yet.' }) {
  const max = useMemo(() => Math.max(...rows.map((row) => Number(row.count || 0)), 0), [rows]);
  if (!rows.length || max === 0) {
    return <div style={{ color: theme.muted, fontSize: 13, padding: '18px 0' }}>{empty}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {rows.map((row) => {
        const pct = Math.max(4, Math.round((Number(row.count || 0) / max) * 100));
        return (
          <div key={row.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ color: theme.text, fontSize: 13, fontWeight: 800 }}>{titleize(row.label)}</span>
              <span style={{ color: theme.muted, fontSize: 12, fontWeight: 800 }}>{formatNumber(row.count)}</span>
            </div>
            <div style={{ height: 8, background: theme.soft, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyBars({ rows }) {
  const max = Math.max(...rows.map((row) => Number(row.count || 0)), 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(42px, 1fr))', gap: 10, alignItems: 'end', height: 170 }}>
      {rows.map((row) => {
        const height = Math.max(10, Math.round((Number(row.count || 0) / max) * 118));
        const label = new Date(`${row.label}T00:00:00`).toLocaleDateString([], { weekday: 'short' });
        return (
          <div key={row.label} style={{ display: 'grid', gap: 8, alignItems: 'end', justifyItems: 'center' }}>
            <div style={{ color: theme.text, fontSize: 12, fontWeight: 900 }}>{formatNumber(row.count)}</div>
            <div style={{ width: '100%', maxWidth: 34, height, background: theme.primary, borderRadius: '6px 6px 2px 2px' }} />
            <div style={{ color: theme.muted, fontSize: 11, fontWeight: 800 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function DataTable({ columns, rows, empty }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={{ textAlign: 'left', padding: '0 12px 10px 0', color: theme.muted, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${theme.border}` }}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      {!rows.length && <div style={{ color: theme.muted, fontSize: 13, padding: 20, textAlign: 'center' }}>{empty}</div>}
    </div>
  );
}

export default function Analytics({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = getToken(user);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/analytics/manager', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Failed to load analytics.');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recentLeads = data?.recentLeads || [];
  const upcomingAppointments = data?.upcomingAppointments || [];

  return (
    <div style={{ minHeight: '100%', background: theme.page, color: theme.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, color: theme.text, fontSize: 24, fontWeight: 900 }}>Manager Analytics</h2>
          <p style={{ margin: '5px 0 0', color: theme.muted, fontSize: 13 }}>Live CRM, appointment, email, and productivity metrics from the backend.</p>
        </div>
        <button onClick={loadAnalytics} disabled={loading} style={{ border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, borderRadius: 8, padding: '9px 13px', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#991b1b', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 28, color: theme.muted, fontSize: 14 }}>
          Loading analytics...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <SummaryCard label="Total Leads" value={formatNumber(summary.leadsTotal)} note={`${formatPercent(summary.conversionRate)} conversion`} color={theme.green} />
            <SummaryCard label="Follow-ups Due" value={formatNumber(summary.followUpsDue)} note="Need attention" color={summary.followUpsDue ? theme.red : theme.green} />
            <SummaryCard label="Upcoming Meetings" value={formatNumber(summary.appointmentsUpcoming)} note={`${formatPercent(summary.appointmentCompletionRate)} completed`} color={theme.blue} />
            <SummaryCard label="Open Tasks" value={formatNumber(summary.tasksOpen)} note={`${formatNumber(summary.projectsActive)} active projects`} color={theme.purple} />
            <SummaryCard label="Email Replies" value={formatNumber(summary.emailReplied30d)} note={`${formatPercent(summary.emailReplyRate)} reply rate`} color={theme.green} />
            <SummaryCard label="Logged Hours" value={formatNumber(summary.loggedHours30d)} note="Last 30 days" color={theme.primary} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
            <Panel title="Lead Creation Trend" meta="Last 7 days">
              <DailyBars rows={charts.dailyLeads || []} />
            </Panel>
            <Panel title="Pipeline Stages">
              <BarList rows={charts.leadStages || []} color={theme.primary} />
            </Panel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            <Panel title="Lead Sources">
              <BarList rows={charts.leadSources || []} color={theme.blue} />
            </Panel>
            <Panel title="Appointments">
              <BarList rows={charts.appointmentsByStatus || []} color={theme.green} />
            </Panel>
            <Panel title="Task Status">
              <BarList rows={charts.taskStatus || []} color={theme.purple} />
            </Panel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Panel title="Recent Leads">
              <DataTable
                columns={['Lead', 'Stage', 'Score', 'Created']}
                empty="No leads found."
                rows={recentLeads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '12px 12px 12px 0' }}>
                      <div style={{ color: theme.text, fontSize: 13, fontWeight: 900 }}>{lead.name}</div>
                      <div style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>{lead.company || lead.email || 'No company'}</div>
                    </td>
                    <td style={{ padding: '12px 12px 12px 0', color: theme.text, fontSize: 13, fontWeight: 800 }}>{titleize(lead.pipelineStage)}</td>
                    <td style={{ padding: '12px 12px 12px 0', color: Number(lead.score) >= 70 ? theme.red : theme.muted, fontSize: 13, fontWeight: 900 }}>{lead.score || 0}</td>
                    <td style={{ padding: '12px 0', color: theme.muted, fontSize: 13 }}>{formatDateTime(lead.createdAt)}</td>
                  </tr>
                ))}
              />
            </Panel>

            <Panel title="Upcoming Appointments">
              <DataTable
                columns={['Client', 'When', 'Status']}
                empty="No upcoming appointments."
                rows={upcomingAppointments.map((appointment) => (
                  <tr key={appointment.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '12px 12px 12px 0' }}>
                      <div style={{ color: theme.text, fontSize: 13, fontWeight: 900 }}>{appointment.clientName}</div>
                      <div style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>{appointment.clientEmail || `${appointment.duration || 30} mins`}</div>
                    </td>
                    <td style={{ padding: '12px 12px 12px 0', color: theme.text, fontSize: 13, fontWeight: 800 }}>{formatDateTime(appointment.scheduledAt)}</td>
                    <td style={{ padding: '12px 0', color: theme.green, fontSize: 13, fontWeight: 900 }}>{titleize(appointment.status)}</td>
                  </tr>
                ))}
              />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
