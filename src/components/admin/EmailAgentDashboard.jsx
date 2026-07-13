import React, { useState, useEffect, useCallback } from 'react';
import EmailThreadViewer from './EmailThreadViewer';
import { apiFetch } from '../../auth/api';

const TABS = ['Overview', 'Threads', 'Reply Logs'];

function MetricCard({ label, value, icon }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <span style={{ fontSize: '24px' }} aria-hidden="true">{icon}</span>
      <span style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{value ?? '—'}</span>
      <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
    </div>
  );
}

function StatusBadge({ label, type }) {
  const colors = {
    escalated:  { bg: '#fef3c7', color: '#92400e' },
    converted:  { bg: '#dcfce7', color: '#166534' },
    active:     { bg: '#dbeafe', color: '#1e40af' },
    sent:       { bg: '#dcfce7', color: '#166534' },
    failed:     { bg: '#fee2e2', color: '#991b1b' },
    imap:       { bg: '#f3e8ff', color: '#7c3aed' },
    contact_form: { bg: '#e0f2fe', color: '#0369a1' },
  };
  const style = colors[type] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
    }}>{label}</span>
  );
}

export default function EmailAgentDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [threadsTotal, setThreadsTotal] = useState(0);
  const [threadsPage, setThreadsPage] = useState(1);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await apiFetch('/api/email-agent/metrics');
      if (!res.ok) throw new Error(`${res.status}`);
      setMetrics(await res.json());
    } catch (e) {
      setError('Failed to load metrics: ' + e.message);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchThreads = useCallback(async (page = 1) => {
    setThreadsLoading(true);
    try {
      const res = await apiFetch(`/api/email-agent/threads?page=${page}&limit=20`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setThreads(data.threads || []);
      setThreadsTotal(data.total || 0);
    } catch (e) {
      setError('Failed to load threads: ' + e.message);
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await apiFetch(`/api/email-agent/logs?page=${page}&limit=50`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (e) {
      setError('Failed to load logs: ' + e.message);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { if (activeTab === 'Threads') fetchThreads(threadsPage); }, [activeTab, threadsPage]);
  useEffect(() => { if (activeTab === 'Reply Logs') fetchLogs(logsPage); }, [activeTab, logsPage]);

  if (selectedThreadId) {
    return (
      <EmailThreadViewer
        threadId={selectedThreadId}
        onBack={() => { setSelectedThreadId(null); fetchThreads(threadsPage); }}
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Email AI Sales Agent
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
          Monitor and manage automated email conversations
        </p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600,
              color: activeTab === tab ? '#0a0a0a' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #0a0a0a' : '2px solid transparent',
              marginBottom: '-2px',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div role="tabpanel">
          {metricsLoading ? (
            <p style={{ color: '#64748b' }}>Loading metrics…</p>
          ) : metrics ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <MetricCard label="Total Conversations" value={metrics.totalThreads} icon="✉️" />
                <MetricCard label="AI Replies Sent" value={metrics.totalAiReplies} icon="🤖" />
                <MetricCard label="Escalations" value={metrics.escalations} icon="🔔" />
                <MetricCard label="Conversions" value={metrics.conversions} icon="🎯" />
                <MetricCard label="AI Success Rate" value={`${metrics.aiReplySuccessRate}%`} icon="✅" />
                <MetricCard label="Avg Replies/Thread" value={metrics.avgRepliesPerThread} icon="📊" />
              </div>
              {metrics.threadsBySource && Object.keys(metrics.threadsBySource).length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>By Source</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {Object.entries(metrics.threadsBySource).map(([source, count]) => (
                      <div key={source} style={{ padding: '10px 20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <strong>{source}</strong>: {count}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#64748b' }}>No metrics available.</p>
          )}
        </div>
      )}

      {/* Threads */}
      {activeTab === 'Threads' && (
        <div role="tabpanel">
          {threadsLoading ? (
            <p style={{ color: '#64748b' }}>Loading threads…</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['From', 'Subject', 'Source', 'AI Replies', 'Status', 'Last Activity'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {threads.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No threads yet</td></tr>
                    ) : threads.map(t => (
                      <tr
                        key={t.thread_id}
                        onClick={() => setSelectedThreadId(t.thread_id)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.from_name || t.from_email}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t.from_name ? t.from_email : ''}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.subject || '(no subject)'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <StatusBadge label={t.source} type={t.source} />
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>{t.ai_reply_count}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {t.escalated
                            ? <StatusBadge label="Escalated" type="escalated" />
                            : t.converted
                              ? <StatusBadge label="Converted" type="converted" />
                              : <StatusBadge label="Active" type="active" />}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '13px' }}>
                          {new Date(t.last_activity_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {threadsTotal} total threads
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setThreadsPage(p => Math.max(1, p - 1))}
                    disabled={threadsPage === 1}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: threadsPage === 1 ? '#f8fafc' : '#fff', cursor: threadsPage === 1 ? 'default' : 'pointer', fontSize: '13px' }}
                  >← Prev</button>
                  <span style={{ padding: '6px 10px', fontSize: '13px', color: '#64748b' }}>
                    Page {threadsPage} of {Math.max(1, Math.ceil(threadsTotal / 20))}
                  </span>
                  <button
                    onClick={() => setThreadsPage(p => p + 1)}
                    disabled={threadsPage * 20 >= threadsTotal}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: threadsPage * 20 >= threadsTotal ? '#f8fafc' : '#fff', cursor: threadsPage * 20 >= threadsTotal ? 'default' : 'pointer', fontSize: '13px' }}
                  >Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reply Logs */}
      {activeTab === 'Reply Logs' && (
        <div role="tabpanel">
          {logsLoading ? (
            <p style={{ color: '#64748b' }}>Loading logs…</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['To', 'Subject', 'AI Model', 'Source', 'Status', 'Sent At'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No reply logs yet</td></tr>
                    ) : logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', color: '#0f172a' }}>{l.to_email}</td>
                        <td style={{ padding: '10px 14px', color: '#475569', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.subject}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {l.ai_model_used || '—'}
                          </code>
                        </td>
                        <td style={{ padding: '10px 14px' }}>{l.source}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <StatusBadge label={l.status} type={l.status} />
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '13px' }}>
                          {new Date(l.sent_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{logsTotal} total log entries</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                    disabled={logsPage === 1}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: logsPage === 1 ? '#f8fafc' : '#fff', cursor: logsPage === 1 ? 'default' : 'pointer', fontSize: '13px' }}
                  >← Prev</button>
                  <span style={{ padding: '6px 10px', fontSize: '13px', color: '#64748b' }}>
                    Page {logsPage} of {Math.max(1, Math.ceil(logsTotal / 50))}
                  </span>
                  <button
                    onClick={() => setLogsPage(p => p + 1)}
                    disabled={logsPage * 50 >= logsTotal}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: logsPage * 50 >= logsTotal ? '#f8fafc' : '#fff', cursor: logsPage * 50 >= logsTotal ? 'default' : 'pointer', fontSize: '13px' }}
                  >Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
