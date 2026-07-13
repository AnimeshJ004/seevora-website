import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../auth/api';

export default function EmailThreadViewer({ threadId, onBack }) {
  const [thread, setThread]       = useState(null);
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [manualReply, setManualReply] = useState('');
  const [sending, setSending]     = useState(false);
  const [feedback, setFeedback]   = useState(null);
  const [toggling, setToggling]   = useState(false);
  const [converting, setConverting] = useState(false);
  const bottomRef = useRef(null);

  const fetchThread = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/email-agent/threads/${threadId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setThread(data.thread);
      setMessages(data.messages || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      setFeedback({ type: 'error', text: 'Failed to load thread: ' + e.message });
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => { fetchThread(); }, [fetchThread]);

  async function sendManualReply() {
    if (!manualReply.trim() || sending) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/api/email-agent/threads/${threadId}/manual-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: manualReply }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', text: data.message || 'Failed to send reply' });
      } else {
        setFeedback({ type: 'success', text: '✓ Reply sent successfully.' });
        setManualReply('');
        fetchThread();
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setSending(false);
    }
  }

  async function toggleAutoReply() {
    if (!thread || toggling) return;
    setToggling(true);
    try {
      await apiFetch(`/api/email-agent/threads/${threadId}/auto-reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !thread.auto_reply_enabled }),
      });
      fetchThread();
    } catch (e) {
      setFeedback({ type: 'error', text: 'Failed to toggle auto-reply: ' + e.message });
    } finally {
      setToggling(false);
    }
  }

  async function markConversion(type) {
    if (!thread || converting) return;
    setConverting(true);
    try {
      await apiFetch(`/api/email-agent/threads/${threadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversion_type: type }),
      });
      fetchThread();
    } catch (e) {
      setFeedback({ type: 'error', text: 'Failed to mark conversion: ' + e.message });
    } finally {
      setConverting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontFamily: "'Segoe UI', sans-serif" }}>
        Loading conversation…
      </div>
    );
  }

  const btnBase = {
    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    border: '1px solid #e2e8f0', cursor: 'pointer',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Back button + thread header */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} style={{ ...btnBase, background: '#fff', marginBottom: '12px' }}>← Back</button>

        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
          {thread?.subject || '(no subject)'}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          From: <strong>{thread?.from_name || thread?.from_email}</strong>
          {thread?.from_name && ` <${thread.from_email}>`}
          &nbsp;·&nbsp; AI Replies: <strong>{thread?.ai_reply_count}</strong>
          &nbsp;·&nbsp; Source: <strong>{thread?.source}</strong>
        </p>
      </div>

      {/* Action controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          onClick={toggleAutoReply}
          disabled={toggling}
          style={{ ...btnBase, background: thread?.auto_reply_enabled ? '#fff' : '#f0fdf4', color: thread?.auto_reply_enabled ? '#dc2626' : '#16a34a' }}
        >
          {thread?.auto_reply_enabled ? '⏸ Pause Auto-Reply' : '▶ Resume Auto-Reply'}
        </button>

        {!thread?.converted && (
          <>
            <button
              onClick={() => markConversion('booked_call')}
              disabled={converting}
              style={{ ...btnBase, background: '#0a0a0a', color: '#fff', border: 'none' }}
            >✓ Booked Call</button>
            <button
              onClick={() => markConversion('service_inquiry')}
              disabled={converting}
              style={{ ...btnBase, background: '#fff' }}
            >✓ Service Inquiry</button>
          </>
        )}

        {thread?.converted && (
          <span style={{
            padding: '8px 14px', background: '#dcfce7', color: '#166534',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          }}>
            ✓ Converted: {thread.conversion_type?.replace('_', ' ')}
          </span>
        )}

        {thread?.escalated && (
          <span style={{
            padding: '8px 14px', background: '#fef3c7', color: '#92400e',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          }}>
            ⚠ Escalated — {thread.escalation_reason?.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Message timeline */}
      <div style={{
        maxHeight: '450px', overflowY: 'auto', padding: '16px',
        background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0',
        marginBottom: '20px',
      }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No messages yet</p>
        ) : messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div style={{
              maxWidth: '75%', padding: '12px 16px', borderRadius: '10px',
              background: msg.direction === 'outbound' ? '#0a0a0a' : '#fff',
              color: msg.direction === 'outbound' ? '#fff' : '#0f172a',
              fontSize: '14px', lineHeight: 1.6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
              <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.6 }}>
                {new Date(msg.created_at).toLocaleString()}
                {msg.ai_model_used && ` · ${msg.ai_model_used}`}
                {msg.source && msg.source !== 'ai' && ` · ${msg.source}`}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Manual reply box */}
      <div>
        <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
          Send Manual Reply
        </label>
        <textarea
          rows={4}
          value={manualReply}
          onChange={e => setManualReply(e.target.value)}
          placeholder="Type a manual reply to override AI…"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '14px',
            resize: 'vertical', boxSizing: 'border-box', color: '#0f172a',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
          <button
            onClick={sendManualReply}
            disabled={sending || !manualReply.trim()}
            style={{
              ...btnBase,
              background: sending || !manualReply.trim() ? '#94a3b8' : '#0a0a0a',
              color: '#fff', border: 'none',
              cursor: sending || !manualReply.trim() ? 'default' : 'pointer',
            }}
          >
            {sending ? 'Sending…' : 'Send Override Reply'}
          </button>
          {feedback && (
            <span style={{ fontSize: '13px', color: feedback.type === 'success' ? '#16a34a' : '#dc2626' }}>
              {feedback.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
