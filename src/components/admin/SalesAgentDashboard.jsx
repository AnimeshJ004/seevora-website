import React, { useState, useEffect } from 'react';
import ConversationViewer from './ConversationViewer';
import PromptEditor from './PromptEditor';

const TABS = ['Overview', 'Conversations', 'System Prompt'];

/**
 * Admin Sales Agent Dashboard — metrics overview, conversation list, and prompt editor.
 * @param {{ token: string }} props
 */
export default function SalesAgentDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [metrics, setMetrics] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [convsTotal, setConvsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [convsLoading, setConvsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'Conversations') fetchConversations(page);
  }, [activeTab, page]);

  async function fetchMetrics() {
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/sales-agent/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Dashboard metrics error:', err);
    } finally {
      setMetricsLoading(false);
    }
  }

  async function fetchConversations(p = 1) {
    setConvsLoading(true);
    try {
      const res = await fetch(`/api/sales-agent/admin/conversations?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data.conversations || []);
      setConvsTotal(data.total || 0);
    } catch (err) {
      console.error('Conversations list error:', err);
    } finally {
      setConvsLoading(false);
    }
  }

  // ── Conversation viewer sub-view ─────────────────────────────────────────
  if (selectedSession) {
    return (
      <div className="sa-admin-panel">
        <ConversationViewer
          sessionId={selectedSession}
          token={token}
          onBack={() => setSelectedSession(null)}
        />
      </div>
    );
  }

  return (
    <div className="sa-admin-panel">
      <div className="sa-admin-panel__header">
        <h2 className="sa-admin-panel__title">AI Sales Agent</h2>
        <p className="sa-admin-panel__subtitle">Monitor conversations and manage the AI agent</p>
      </div>

      {/* Tabs */}
      <div className="sa-admin-tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`sa-admin-tab ${activeTab === tab ? 'sa-admin-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="sa-admin-overview" role="tabpanel">
          {metricsLoading ? (
            <div className="sa-admin-loading"><div className="sa-spinner"></div></div>
          ) : metrics ? (
            <>
              {/* KPI Cards */}
              <div className="sa-admin-kpi-grid">
                <MetricCard label="Total Conversations" value={metrics.totalConversations} icon="💬" />
                <MetricCard label="Active Sessions" value={metrics.activeConversations} icon="🟢" />
                <MetricCard label="Leads Captured" value={metrics.totalLeads} icon="📋" />
                <MetricCard label="Conversion Rate" value={`${metrics.conversionRate}%`} icon="🎯" />
                <MetricCard label="Avg. Messages" value={metrics.avgConversationLength} icon="📊" />
                <MetricCard
                  label="Avg. Response Time"
                  value={metrics.avgResponseTime > 0 ? `${(metrics.avgResponseTime / 1000).toFixed(1)}s` : '—'}
                  icon="⚡"
                />
              </div>

              {/* Top Services */}
              {metrics.topServices?.length > 0 && (
                <div className="sa-admin-section">
                  <h3 className="sa-admin-section-title">Top Services Discussed</h3>
                  <div className="sa-admin-services-list">
                    {metrics.topServices.map((s, i) => (
                      <div key={s.service} className="sa-admin-service-row">
                        <span className="sa-admin-service-rank">#{i + 1}</span>
                        <span className="sa-admin-service-name">{s.service}</span>
                        <span className="sa-admin-service-count">{s.count} mention{s.count !== 1 ? 's' : ''}</span>
                        <div className="sa-admin-service-bar">
                          <div
                            className="sa-admin-service-bar__fill"
                            style={{ width: `${Math.min(100, (s.count / (metrics.topServices[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations by Day */}
              {metrics.conversationsByDay?.length > 0 && (
                <div className="sa-admin-section">
                  <h3 className="sa-admin-section-title">Conversations (Last 30 Days)</h3>
                  <div className="sa-admin-bar-chart">
                    {metrics.conversationsByDay.map(d => {
                      const max = Math.max(...metrics.conversationsByDay.map(x => x.count));
                      const pct = max > 0 ? (d.count / max) * 100 : 0;
                      return (
                        <div key={d.date} className="sa-admin-bar-col" title={`${d.date}: ${d.count}`}>
                          <div className="sa-admin-bar" style={{ height: `${Math.max(4, pct)}%` }} />
                          <span className="sa-admin-bar-label">
                            {new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="sa-admin-empty">Could not load metrics.</p>
          )}
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'Conversations' && (
        <div role="tabpanel">
          {convsLoading ? (
            <div className="sa-admin-loading"><div className="sa-spinner"></div></div>
          ) : conversations.length === 0 ? (
            <p className="sa-admin-empty">No conversations yet.</p>
          ) : (
            <>
              <div className="sa-admin-table-wrap">
                <table className="sa-admin-table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Status</th>
                      <th>Messages</th>
                      <th>Lead</th>
                      <th>Started</th>
                      <th>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map(conv => (
                      <tr
                        key={conv.session_id}
                        className="sa-admin-table__row"
                        onClick={() => setSelectedSession(conv.session_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="sa-admin-table__id" title={conv.session_id}>
                          {conv.session_id.substring(0, 8)}…
                        </td>
                        <td><span className={`sa-admin-badge sa-admin-badge--${conv.status}`}>{conv.status}</span></td>
                        <td>{conv.message_count}</td>
                        <td>{conv.lead_captured ? <span className="sa-admin-badge sa-admin-badge--success">✓</span> : '—'}</td>
                        <td>{new Date(conv.created_at).toLocaleString()}</td>
                        <td>{new Date(conv.last_activity_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="sa-admin-pagination">
                <button
                  className="sa-admin-btn sa-admin-btn--secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span>Page {page} of {Math.ceil(convsTotal / 20)}</span>
                <button
                  className="sa-admin-btn sa-admin-btn--secondary"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= convsTotal}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* System Prompt Tab */}
      {activeTab === 'System Prompt' && (
        <div role="tabpanel">
          <PromptEditor token={token} />
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="sa-admin-kpi">
      <span className="sa-admin-kpi__icon" aria-hidden="true">{icon}</span>
      <span className="sa-admin-kpi__value">{value ?? '—'}</span>
      <span className="sa-admin-kpi__label">{label}</span>
    </div>
  );
}
