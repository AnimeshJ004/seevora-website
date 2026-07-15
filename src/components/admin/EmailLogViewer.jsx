import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { apiFetch } from '../../auth/api';

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

export default function EmailLogViewer({ logId, onBack }) {
  const [logEntry, setLogEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/email-agent/logs/${logId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setLogEntry(data);
    } catch (e) {
      setError('Failed to load log details: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontFamily: "'Segoe UI', sans-serif" }}>
        Loading log details…
      </div>
    );
  }

  const btnBase = {
    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    border: '1px solid #e2e8f0', cursor: 'pointer',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Back button + Header */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} style={{ ...btnBase, background: '#fff', marginBottom: '12px' }}>← Back</button>

        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
          {logEntry?.subject || '(no subject)'}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#475569' }}>
          <div><strong>To:</strong> {logEntry?.to_email}</div>
          <div><strong>Date:</strong> {new Date(logEntry?.sent_at).toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>Status:</strong> <StatusBadge label={logEntry?.status} type={logEntry?.status} />
            {logEntry?.source && (
              <>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <strong>Source:</strong> {logEntry.source}
              </>
            )}
            {logEntry?.ai_model_used && (
              <>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <strong>Model:</strong> <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{logEntry.ai_model_used}</code>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {logEntry?.status === 'failed' && logEntry?.error_message && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          <strong>Error Message:</strong> {logEntry.error_message}
        </div>
      )}

      {logEntry?.escalation_reason && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          <strong>Escalated:</strong> {logEntry.escalation_reason.replace('_', ' ')}
        </div>
      )}

      {/* Email Body Viewer */}
      <div style={{
        marginTop: '24px', background: '#fff', borderRadius: '12px',
        border: '1px solid #e2e8f0', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
          Email Body
        </div>
        <div style={{ padding: '24px', overflowX: 'auto', all: 'initial', fontFamily: 'inherit' }}>
          {logEntry?.reply_body_html ? (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(logEntry.reply_body_html, {
                  USE_PROFILES: { html: true },
                  FORBID_TAGS: ['script', 'object', 'embed', 'link', 'meta'],
                  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
                })
              }}
              style={{ all: 'revert' }}
            />
          ) : (
             <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#334155', fontFamily: 'monospace' }}>
               {logEntry?.reply_body_text || '(No content)'}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
