import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Panel } from '../shared';
import { apiFetch } from '../../../../auth/api';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusBadge(status) {
  if (status === 'responded') return <Badge label="Responded" color="green" />;
  if (status === 'response_saved') return <Badge label="Saved" color="orange" />;
  return <Badge label="New" color="blue" />;
}

export default function AuditLogs() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMode, setSelectedMode] = useState('active');
  const [responseBody, setResponseBody] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingResponse, setEditingResponse] = useState(false);

  const activeRequests = useMemo(
    () => requests.filter((request) => request.status === 'new' || request.status === 'user_replied'),
    [requests]
  );

  const historyRequests = useMemo(
    () => requests.filter((request) => request.status !== 'new' && request.status !== 'user_replied'),
    [requests]
  );

  const selected = useMemo(
    () => requests.find((request) => request.id === selectedId)
      || (selectedMode === 'history' ? historyRequests[0] : activeRequests[0])
      || historyRequests[0],
    [activeRequests, historyRequests, requests, selectedId, selectedMode]
  );

  const loadRequests = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await apiFetch('/api/audit-requests');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ type: 'error', text: data.message || 'Unable to load audit requests.' });
        return;
      }
      setRequests(data.requests || []);
      const firstActive = data.requests?.find((request) => !request.responseBody);
      const firstHistory = data.requests?.find((request) => request.responseBody);
      if (!selectedId && (firstActive || firstHistory)) {
        setSelectedMode(firstActive ? 'active' : 'history');
        setSelectedId((firstActive || firstHistory).id);
      }
    } catch {
      setStatus({ type: 'error', text: 'Unable to reach the audit request server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    setResponseBody(selectedMode === 'history' ? selected?.responseBody || '' : '');
    setEditingResponse(false);
  }, [selected?.id]);

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!responseBody.trim()) {
      setStatus({ type: 'error', text: 'Write a response before sending.' });
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      const response = await apiFetch(`/api/audit-requests/${selected.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseBody }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ type: 'error', text: data.message || 'Unable to send the response.' });
        return;
      }

      const wasEditing = Boolean(selected?.responseBody);
      setRequests((current) => {
        const updatedRequests = current.map((request) => (
          request.id === data.request.id ? data.request : request
        ));
        const nextActive = updatedRequests.find((request) => !request.responseBody && request.id !== data.request.id);
        setSelectedMode(wasEditing ? 'history' : nextActive ? 'active' : 'history');
        setSelectedId(wasEditing ? data.request.id : (nextActive || data.request).id);
        return updatedRequests;
      });
      setResponseBody('');
      setEditingResponse(false);
      setStatus({ type: data.request.emailStatus === 'sent' ? 'success' : 'warning', text: data.message });
    } catch {
      setStatus({ type: 'error', text: 'Unable to reach the audit request server.' });
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selected || !window.confirm('Are you sure you want to clear the conversation history? This cannot be undone.')) return;
    setStatus(null);
    try {
      const response = await apiFetch(`/api/audit-requests/${selected.id}/thread`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ type: 'error', text: data.message || 'Unable to clear history.' });
        return;
      }
      setRequests((current) => current.map((req) => (req.id === data.request.id ? data.request : req)));
      setSelectedMode('active');
      setSelectedId(data.request.id);
      setStatus({ type: 'success', text: 'Conversation history cleared.' });
    } catch {
      setStatus({ type: 'error', text: 'Unable to reach the server.' });
    }
  };

  const handleDeleteRequest = async () => {
    if (!selected || !window.confirm('Are you sure you want to permanently delete this audit request? This cannot be undone.')) return;
    setStatus(null);
    try {
      const response = await apiFetch(`/api/audit-requests/${selected.id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ type: 'error', text: data.message || 'Unable to delete audit request.' });
        return;
      }
      setRequests((current) => {
        const filtered = current.filter((req) => req.id !== selected.id);
        const firstActive = filtered.find((req) => !req.responseBody);
        const firstHistory = filtered.find((req) => req.responseBody);
        if (firstActive || firstHistory) {
          setSelectedMode(firstActive ? 'active' : 'history');
          setSelectedId((firstActive || firstHistory).id);
        } else {
          setSelectedId(null);
        }
        return filtered;
      });
      setStatus({ type: 'success', text: 'Audit request deleted successfully.' });
    } catch {
      setStatus({ type: 'error', text: 'Unable to reach the server.' });
    }
  };

  return (
    <div>
      <Panel
        title="Audit Logs"
        meta={loading ? 'Loading...' : `${activeRequests.length} active · ${historyRequests.length} history`}
        style={{ marginBottom: 16 }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 18 }}>
          Book a Call audit requests appear here. Active cards clear after response, and completed conversations remain in history.
        </p>

        {status && (
          <div style={{
            padding: '12px 14px',
            marginBottom: 16,
            borderRadius: 10,
            fontSize: '0.84rem',
            fontWeight: 600,
            color: status.type === 'error' ? '#dc2626' : status.type === 'warning' ? '#b45309' : '#15803d',
            background: status.type === 'error' ? 'rgba(239,68,68,0.08)' : status.type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.1)',
            border: status.type === 'error' ? '1px solid rgba(239,68,68,0.18)' : status.type === 'warning' ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(34,197,94,0.18)',
          }}>
            {status.text}
          </div>
        )}

        {requests.length === 0 && !loading ? (
          <div style={{
            padding: 28,
            border: '1px dashed var(--glass-border)',
            borderRadius: 14,
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}>
            No audit requests yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 0.95fr) minmax(320px, 1.25fr)', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <ListTitle title="Active Requests" count={activeRequests.length} />
                {activeRequests.length === 0 ? (
                  <EmptyList text="No active audit requests." />
                ) : (
                  <RequestList
                    requests={activeRequests}
                    selected={selected}
                    mode="active"
                    onSelect={(request) => {
                      setSelectedMode('active');
                      setSelectedId(request.id);
                      setStatus(null);
                    }}
                  />
                )}
              </div>

              <div>
                <ListTitle title="Response History" count={historyRequests.length} />
                {historyRequests.length === 0 ? (
                  <EmptyList text="No responses sent yet." />
                ) : (
                  <RequestList
                    requests={historyRequests}
                    selected={selected}
                    mode="history"
                    onSelect={(request) => {
                      setSelectedMode('history');
                      setSelectedId(request.id);
                      setStatus(null);
                    }}
                  />
                )}
              </div>
            </div>

            {selected && (
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 14, padding: 18, background: 'var(--bg-space)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{selected.name}</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{selected.email}</p>
                  </div>
                  {statusBadge(selected.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
                  <Info label="Company" value={selected.company || '-'} />
                  <Info label="Phone" value={selected.phone || '-'} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>USER MESSAGE</div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.9rem' }}>{selected.message}</p>
                </div>

                {(selectedMode === 'history' || selected.thread?.length > 1 || selected.responseBody) && !editingResponse ? (
                  <>
                    <ConversationHistory
                      request={selected}
                      onEdit={() => {
                        setResponseBody('');
                        setEditingResponse(true);
                        setStatus(null);
                      }}
                    />
                    <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setResponseBody('');
                          setEditingResponse(true);
                          setStatus(null);
                        }}
                        style={{
                          background: 'var(--brand-olive)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      >
                        Reply
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        style={{
                          background: '#fff',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 8,
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        Clear History
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteRequest}
                        style={{
                          background: '#fff',
                          color: '#dc2626',
                          border: '1px solid rgba(220,38,38,0.3)',
                          borderRadius: 8,
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          marginLeft: 'auto'
                        }}
                      >
                        Delete Request
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleRespond}>
                    <label htmlFor="auditResponse" style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>
                      {editingResponse ? 'Edit response to user' : 'Response to user'}
                    </label>
                    <textarea
                      id="auditResponse"
                      value={responseBody}
                      onChange={(e) => setResponseBody(e.target.value)}
                      placeholder="Write your response. This will be sent to the user's email when SMTP is configured."
                      style={{
                        width: '100%',
                        minHeight: 130,
                        resize: 'vertical',
                        padding: 12,
                        borderRadius: 12,
                        border: '1px solid var(--glass-border)',
                        background: '#fff',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        lineHeight: 1.55,
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      style={{
                        marginTop: 12,
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: 999,
                        background: 'var(--text-primary)',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: sending ? 'not-allowed' : 'pointer',
                        opacity: sending ? 0.7 : 1,
                      }}
                    >
                      {sending ? 'Sending...' : editingResponse ? 'Save Updated Response' : 'Send Response'}
                    </button>
                    {editingResponse && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingResponse(false);
                          setResponseBody(selected.responseBody || '');
                          setStatus(null);
                        }}
                        style={{
                          marginTop: 12,
                          marginLeft: 10,
                          padding: '10px 18px',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 999,
                          background: '#fff',
                          color: 'var(--text-secondary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleDeleteRequest}
                      style={{
                        marginTop: 12,
                        marginLeft: editingResponse ? 10 : 10,
                        padding: '10px 18px',
                        border: '1px solid rgba(220,38,38,0.3)',
                        borderRadius: 999,
                        background: '#fff',
                        color: '#dc2626',
                        fontWeight: 700,
                        cursor: 'pointer',
                        float: 'right'
                      }}
                    >
                      Delete Request
                    </button>
                    <div style={{ clear: 'both' }} />
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ padding: 10, border: '1px solid var(--glass-border)', borderRadius: 10, background: '#fff' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function ListTitle({ title, count }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 800 }}>{title}</h3>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>{count}</span>
    </div>
  );
}

function EmptyList({ text }) {
  return (
    <div style={{
      padding: 14,
      border: '1px dashed var(--glass-border)',
      borderRadius: 12,
      color: 'var(--text-muted)',
      fontSize: '0.82rem',
      textAlign: 'center',
    }}>
      {text}
    </div>
  );
}

function RequestList({ requests, selected, mode, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {requests.map((request) => {
        const isSelected = request.id === selected?.id;
        return (
          <button
            key={request.id}
            type="button"
            onClick={() => onSelect(request)}
            style={{
              padding: 14,
              borderRadius: 12,
              border: isSelected ? '1px solid rgba(156, 163, 175,0.44)' : '1px solid var(--glass-border)',
              background: isSelected ? 'rgba(156, 163, 175,0.08)' : 'var(--bg-space)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{request.name}</strong>
              {statusBadge(request.status)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 4 }}>{request.email}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
              {mode === 'history' ? `Responded ${formatDate(request.respondedAt)}` : formatDate(request.createdAt)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ConversationHistory({ request, onEdit }) {
  const thread = Array.isArray(request.thread) && request.thread.length > 0 
    ? request.thread 
    : [
        { sender: 'user', text: request.message, timestamp: request.createdAt },
        ...(request.responseBody ? [{ sender: 'admin', text: request.responseBody, timestamp: request.respondedAt }] : [])
      ];

  return (
    <div>
      <div style={{ display: 'grid', gap: 12 }}>
        {thread.map((msg, i) => (
          <TranscriptBlock
            key={msg.id || i}
            label={msg.sender === 'user' ? "User sent" : "Admin sent"}
            meta={formatDate(msg.timestamp)}
            body={msg.text}
          />
        ))}
      </div>
    </div>
  );
}

function TranscriptBlock({ label, meta, body, action }) {
  return (
    <div style={{ padding: 12, borderRadius: 12, background: '#fff', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'right' }}>
          {action}
          <span>{meta}</span>
        </div>
      </div>
      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.58, fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>{body}</p>
    </div>
  );
}
