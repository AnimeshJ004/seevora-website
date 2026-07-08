import React, { useState, useEffect } from 'react';

const API = '/api/sales-agent/admin/conversations';

/**
 * Admin component for viewing a single conversation with full message history.
 * @param {{ sessionId: string, onBack: () => void, token: string }} props
 */
export default function ConversationViewer({ sessionId, onBack, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    fetch(`${API}/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [sessionId, token]);

  if (loading) {
    return (
      <div className="sa-admin-loading">
        <div className="sa-spinner"></div>
        <p>Loading conversation…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="sa-admin-error">
        <p>{error || 'Conversation not found.'}</p>
        <button onClick={onBack} className="sa-admin-btn">← Back</button>
      </div>
    );
  }

  const { messages = [], lead, analytics, status, createdAt, endedAt } = data;

  return (
    <div className="sa-admin-conv">
      <div className="sa-admin-conv__header">
        <button onClick={onBack} className="sa-admin-back-btn" aria-label="Go back">
          ← Back to conversations
        </button>
        <div className="sa-admin-conv__meta">
          <span className={`sa-admin-badge sa-admin-badge--${status}`}>{status}</span>
          <span className="sa-admin-conv__time">Started: {new Date(createdAt).toLocaleString()}</span>
          {endedAt && <span className="sa-admin-conv__time">Ended: {new Date(endedAt).toLocaleString()}</span>}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="sa-admin-conv__stats">
        <div className="sa-admin-stat">
          <span className="sa-admin-stat__value">{analytics?.messageCount || messages.length}</span>
          <span className="sa-admin-stat__label">Messages</span>
        </div>
        <div className="sa-admin-stat">
          <span className="sa-admin-stat__value">{analytics?.duration ? `${Math.round(analytics.duration / 60)}m` : '—'}</span>
          <span className="sa-admin-stat__label">Duration</span>
        </div>
        <div className={`sa-admin-stat sa-admin-stat--${analytics?.conversionStatus === 'converted' ? 'success' : 'neutral'}`}>
          <span className="sa-admin-stat__value">{analytics?.conversionStatus === 'converted' ? '✓' : '—'}</span>
          <span className="sa-admin-stat__label">Lead</span>
        </div>
        {analytics?.servicesDiscussed?.length > 0 && (
          <div className="sa-admin-stat sa-admin-stat--wide">
            <span className="sa-admin-stat__label">Services Discussed</span>
            <div className="sa-admin-tags">
              {analytics.servicesDiscussed.map(s => (
                <span key={s} className="sa-admin-tag">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lead Info */}
      {lead && (
        <div className="sa-admin-lead-card">
          <h4 className="sa-admin-section-title">📋 Lead Captured</h4>
          <div className="sa-admin-lead-grid">
            <div><label>Name</label><span>{lead.name}</span></div>
            <div><label>Email</label><span>{lead.email}</span></div>
            {lead.phone && <div><label>Phone</label><span>{lead.phone}</span></div>}
            <div><label>Service</label><span>{lead.service_interest}</span></div>
            <div><label>Status</label><span className={`sa-admin-badge sa-admin-badge--${lead.status}`}>{lead.status}</span></div>
            <div><label>Captured</label><span>{new Date(lead.created_at).toLocaleString()}</span></div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="sa-admin-messages">
        <h4 className="sa-admin-section-title">💬 Conversation</h4>
        <div className="sa-admin-message-list">
          {messages.map(msg => (
            <div key={msg.id} className={`sa-admin-message sa-admin-message--${msg.sender}`}>
              <div className="sa-admin-message__header">
                <span className="sa-admin-message__sender">{msg.sender === 'user' ? '👤 Visitor' : '🤖 AI Agent'}</span>
                <span className="sa-admin-message__time">{new Date(msg.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="sa-admin-message__text">{msg.messageText}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
