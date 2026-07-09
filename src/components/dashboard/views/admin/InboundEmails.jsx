import React, { useState, useEffect, useCallback } from 'react';

const API = async (path, token, opts = {}) => {
  const response = await fetch(`/api/email-bot${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
};

const lightInput = {
  background: '#ffffff',
  border: '1px solid #dbe3ef',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#0f172a',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
};

export default function InboundEmails() {
  const token = localStorage.getItem('seevoraAuthToken') || localStorage.getItem('seevora_token') || '';
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API('/inbound', token);
      if (res.emails) {
        setEmails(res.emails);
        if (res.emails.length > 0) {
          setSelectedEmail(res.emails[0]);
          setReplyText(res.emails[0].ai_reply || '');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch inbound emails.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const selectEmail = (email) => {
    setSelectedEmail(email);
    setReplyText(email.ai_reply || '');
  };

  const handleGenerateAI = async () => {
    if (!selectedEmail) return;
    setGeneratingAI(true);
    try {
      const res = await API(`/inbound/${selectedEmail.id}/ai-suggest`, token, {
        method: 'POST'
      });
      if (res.aiResponse) {
        setReplyText(res.aiResponse);
        // Temporarily update local state in case user switches back and forth
        setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, ai_reply: res.aiResponse } : e));
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate AI suggestion.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await API(`/inbound/${selectedEmail.id}/reply`, token, {
        method: 'POST',
        body: JSON.stringify({ body: replyText })
      });
      showToast(res.message || 'Reply sent successfully!', 'success');
      // Update email status locally
      setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, status: 'replied', ai_reply: replyText } : e));
      setSelectedEmail(prev => ({ ...prev, status: 'replied', ai_reply: replyText }));
    } catch (err) {
      showToast(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.6rem' }}>Email Inbox (info@seevora.in)</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
          View incoming emails received at info@seevora.in, inspect automated AI drafts, and manually reply with AI support.
        </p>
      </div>

      {error && <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b' }}>
          Loading emails...
        </div>
      ) : emails.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          No inbound emails received yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, flex: 1, overflow: 'hidden' }}>
          
          {/* Email List Left Pane */}
          <div style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: 12, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {emails.map((email) => {
              const isSelected = selectedEmail && selectedEmail.id === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => selectEmail(email)}
                  style={{
                    padding: '16px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: isSelected ? '#f1f5f9' : 'transparent',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      {email.from_email}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: email.status === 'replied' ? '#d1fae5' : '#fed7aa',
                      color: email.status === 'replied' ? '#065f46' : '#9a3412',
                      textTransform: 'uppercase'
                    }}>
                      {email.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {email.subject || '(No Subject)'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {new Date(email.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Email Detail Right Pane */}
          {selectedEmail && (
            <div style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Header Details */}
              <div style={{ padding: 20, borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: "'Outfit', sans-serif" }}>
                      {selectedEmail.subject || '(No Subject)'}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                      From: <strong style={{ color: '#0f172a' }}>{selectedEmail.from_email}</strong> &nbsp;|&nbsp; To: <strong>{selectedEmail.to_email}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(selectedEmail.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div style={{ padding: 20, flex: 1, overflowY: 'auto', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedEmail.body}
                </div>
              </div>

              {/* Reply Area */}
              <div style={{ padding: 20, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Reply to Sender</span>
                  <button
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      opacity: generatingAI ? 0.7 : 1
                    }}
                  >
                    {generatingAI ? 'Generating Suggestion...' : '✨ Auto-Generate AI Reply'}
                  </button>
                </div>

                {/* Toast notification */}
                {toast && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                    background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: toast.type === 'success' ? '#065f46' : '#b91c1c',
                    border: `1px solid ${toast.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
                  }}>
                    {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
                  </div>
                )}

                <textarea
                  placeholder="Type your response here... Use the Auto-Generate button to let the AI draft a reply first."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    ...lightInput,
                    height: 120,
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#0f172a',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      opacity: (sending || !replyText.trim()) ? 0.6 : 1
                    }}
                  >
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
