import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../../../auth/api';

const API = async (path, opts = {}) => {
  const response = await apiFetch(`/api/email-bot${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
};

const statusStyles = {
  replied: { background: '#d1fae5', color: '#065f46', border: '#a7f3d0', label: 'Replied' },
  quarantined: { background: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'Quarantined' },
  send_failed: { background: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'Failed' },
  needs_review: { background: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Review' },
  received: { background: '#ffedd5', color: '#9a3412', border: '#fed7aa', label: 'Received' },
};

const quarantineReasonLabels = {
  message_too_large: 'Message exceeded the safe 1 MiB processing limit.',
  invalid_sender: 'The sender address is missing or invalid.',
  empty_body: 'The message does not contain a readable plain-text body.',
  mail_loop: 'The message originated from this mailbox and could create a mail loop.',
  automated_sender: 'The sender is an automated or non-reply mailbox.',
  automated_message: 'Automated-message headers were detected.',
  bulk_message: 'Bulk-mail or mailing-list headers were detected.',
  mail_parse_failed: 'The message could not be parsed safely.',
};

function quarantineReasonText(reason) {
  return quarantineReasonLabels[reason] || 'The message did not pass automatic email safety checks.';
}

const AVATAR_PALETTES = [
  { bg: '#fee2e2', text: '#b91c1c' }, // red
  { bg: '#fef3c7', text: '#b45309' }, // amber
  { bg: '#dcfce7', text: '#15803d' }, // green
  { bg: '#e0e7ff', text: '#4338ca' }, // indigo
  { bg: '#f3e8ff', text: '#7e22ce' }, // purple
  { bg: '#e0f2fe', text: '#0369a1' }, // sky
  { bg: '#fce7f3', text: '#be185d' }, // pink
  { bg: '#ffedd5', text: '#c2410c' }, // orange
  { bg: '#ccfbf1', text: '#0f766e' }, // teal
];

function getAvatarStyle(str = '') {
  if (!str) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getSenderInitials(sender = '') {
  if (!sender) return '?';
  const clean = sender.split('@')[0].replace(/[._-]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (sender[0] || '?').toUpperCase();
}

function formatGmailDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export default function InboundEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API('/inbound');
      if (res.emails) {
        setEmails(res.emails);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch inbound emails.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Compute filtered emails based on search query and status filter
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      if (statusFilter !== 'all' && email.status !== statusFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (email.from_email && email.from_email.toLowerCase().includes(term)) ||
        (email.subject && email.subject.toLowerCase().includes(term)) ||
        (email.body && email.body.toLowerCase().includes(term)) ||
        (email.to_email && email.to_email.toLowerCase().includes(term)) ||
        (email.status && email.status.toLowerCase().includes(term))
      );
    });
  }, [emails, searchTerm, statusFilter]);

  // Auto-sync selection on desktop
  useEffect(() => {
    if (filteredEmails.length > 0) {
      if (!selectedEmail || !filteredEmails.some(e => e.id === selectedEmail.id)) {
        if (window.innerWidth > 768) {
          setSelectedEmail(filteredEmails[0]);
          setReplyText(filteredEmails[0].ai_reply || '');
        }
      }
    } else {
      setSelectedEmail(null);
    }
  }, [filteredEmails, selectedEmail]);

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    setReplyText(email.ai_reply || '');
    setIsMobileDetailOpen(true);
    setShowReplyBox(false); // keep reply box collapsed initially
  };

  const handleBackToList = () => {
    setIsMobileDetailOpen(false);
    setShowReplyBox(false);
  };

  const handleOpenReply = () => {
    setShowReplyBox(true);
  };

  const handleOpenAIReply = async () => {
    setShowReplyBox(true);
    if (!selectedEmail) return;
    if (!replyText.trim()) {
      handleGenerateAI();
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedEmail) return;
    setGeneratingAI(true);
    try {
      const res = await API(`/inbound/${selectedEmail.id}/ai-suggest`, {
        method: 'POST'
      });
      if (res.aiResponse) {
        setReplyText(res.aiResponse);
        setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, ai_reply: res.aiResponse } : e));
        setSelectedEmail(prev => prev ? { ...prev, ai_reply: res.aiResponse } : prev);
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
      const res = await API(`/inbound/${selectedEmail.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: replyText })
      });
      showToast(res.message || 'Reply sent successfully!', 'success');
      setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, status: 'replied', ai_reply: replyText } : e));
      setSelectedEmail(prev => ({ ...prev, status: 'replied', ai_reply: replyText }));
      setShowReplyBox(false);
    } catch (err) {
      showToast(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { all: emails.length, received: 0, replied: 0, quarantined: 0 };
    emails.forEach(e => {
      if (counts[e.status] !== undefined) counts[e.status]++;
    });
    return counts;
  }, [emails]);

  return (
    <div className="gmail-inbox-wrapper">
      <style>{`
        .gmail-inbox-wrapper {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
          max-height: calc(100vh - 120px);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          box-sizing: border-box;
          position: relative;
        }

        @keyframes gmailSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .gmail-spin-icon {
          animation: gmailSpin 1s linear infinite;
        }

        /* Container grid layout */
        .gmail-main-container {
          display: grid;
          grid-template-columns: 370px 1fr;
          gap: 16px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .gmail-list-pane {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .gmail-detail-pane {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          position: relative;
        }

        /* Gmail-like Email Row */
        .gmail-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background-color 0.15s ease, border-left-color 0.15s ease;
          position: relative;
          background: #ffffff;
          -webkit-tap-highlight-color: transparent;
        }

        .gmail-row:hover {
          background: #f8fafc;
        }

        .gmail-row.is-active {
          background: #f1f5f9;
          border-left: 4px solid #4f46e5;
          padding-left: 10px;
        }

        .gmail-row:active {
          background: #e2e8f0;
        }

        .gmail-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.88rem;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          user-select: none;
        }

        .gmail-row-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .gmail-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .gmail-sender {
          font-size: 0.86rem;
          font-weight: 700;
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gmail-date {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .gmail-subject {
          font-size: 0.82rem;
          font-weight: 600;
          color: #1e293b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gmail-snippet {
          font-size: 0.76rem;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.35;
        }

        /* Filter Chips */
        .gmail-chips-bar {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 2px 2px 6px 2px;
          scrollbar-width: none;
        }
        .gmail-chips-bar::-webkit-scrollbar {
          display: none;
        }

        .gmail-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .gmail-chip:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .gmail-chip.is-active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .gmail-chip-badge {
          font-size: 0.65rem;
          padding: 1px 5px;
          border-radius: 10px;
          background: rgba(0,0,0,0.07);
        }
        .gmail-chip.is-active .gmail-chip-badge {
          background: rgba(255,255,255,0.25);
          color: #ffffff;
        }

        /* Search Bar */
        .gmail-search-box {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .gmail-search-input {
          width: 100%;
          background: #f1f5f9;
          border: 1px solid transparent;
          border-radius: 24px;
          padding: 9px 36px 9px 38px;
          color: #0f172a;
          font-size: 0.84rem;
          outline: none;
          transition: all 0.15s ease;
          box-sizing: border-box;
        }

        .gmail-search-input:focus {
          background: #ffffff;
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        /* Mobile full-screen view switching */
        @media (max-width: 768px) {
          .gmail-inbox-wrapper {
            height: calc(100vh - 100px);
            max-height: calc(100vh - 100px);
          }

          .gmail-desktop-header {
            display: none !important;
          }

          .gmail-main-container {
            display: flex;
            flex-direction: column;
            gap: 0;
            width: 100%;
            height: 100%;
          }

          .gmail-list-pane {
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            height: 100%;
            flex: 1;
          }

          .gmail-detail-pane {
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            height: 100%;
            flex: 1;
          }

          /* Show only list when mobile detail is closed */
          .gmail-main-container.view-list .gmail-list-pane {
            display: flex !important;
          }
          .gmail-main-container.view-list .gmail-detail-pane {
            display: none !important;
          }

          /* Show only detail when mobile detail is open */
          .gmail-main-container.view-detail .gmail-list-pane {
            display: none !important;
          }
          .gmail-main-container.view-detail .gmail-detail-pane {
            display: flex !important;
          }
        }
      `}</style>

      {/* Desktop Header */}
      <div className="gmail-desktop-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        flexShrink: 0
      }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.4rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Email Inbox</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>
              info@seevora.in
            </span>
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Inspect incoming messages, AI draft responses, and reply to client inquiries.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={fetchEmails}
            disabled={loading}
            title="Refresh Inbox"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 20,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s'
            }}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={loading ? 'gmail-spin-icon' : ''}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      <div className={`gmail-main-container ${isMobileDetailOpen && selectedEmail ? 'view-detail' : 'view-list'}`}>
        
        {/* Left Pane: Email List (Gmail Style) */}
        <div className="gmail-list-pane">
          
          {/* Top Search & Filter Bar */}
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f1f5f9', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            
            {/* Mobile Header Title & Refresh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                    Inbox
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: 6 }}>
                    ({filteredEmails.length})
                  </span>
                </div>
              </div>

              <button
                onClick={fetchEmails}
                disabled={loading}
                title="Refresh"
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'gmail-spin-icon' : ''}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>
            </div>

            {/* Gmail-style Search Bar */}
            <div className="gmail-search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search in emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gmail-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                    padding: 4
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="gmail-chips-bar">
              {[
                { id: 'all', label: 'All' },
                { id: 'received', label: 'Received' },
                { id: 'replied', label: 'Replied' },
                { id: 'quarantined', label: 'Quarantined' }
              ].map((chip) => {
                const isActive = statusFilter === chip.id;
                const count = statusCounts[chip.id] ?? 0;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setStatusFilter(chip.id)}
                    className={`gmail-chip ${isActive ? 'is-active' : ''}`}
                  >
                    <span>{chip.label}</span>
                    <span className="gmail-chip-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Item List */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loading && emails.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, color: '#64748b', gap: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" className="gmail-spin-icon">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Loading messages...</span>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>No messages found</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 14 }}>
                  {searchTerm ? `No results for "${searchTerm}"` : `No ${statusFilter} messages in inbox`}
                </div>
                {(searchTerm || statusFilter !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmail && selectedEmail.id === email.id;
                const statusStyle = statusStyles[email.status] || statusStyles.received;
                const avatarPalette = getAvatarStyle(email.from_email);
                const initials = getSenderInitials(email.from_email);
                const dateText = formatGmailDate(email.created_at);

                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`gmail-row ${isSelected ? 'is-active' : ''}`}
                  >
                    {/* Sender Avatar Circle */}
                    <div
                      className="gmail-avatar"
                      style={{ background: avatarPalette.bg, color: avatarPalette.text }}
                    >
                      {initials}
                    </div>

                    {/* Content Details */}
                    <div className="gmail-row-content">
                      <div className="gmail-row-top">
                        <span className="gmail-sender">
                          {email.from_email}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: statusStyle.background,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            flexShrink: 0
                          }}>
                            {statusStyle.label}
                          </span>
                          <span className="gmail-date">
                            {dateText}
                          </span>
                        </div>
                      </div>

                      <div className="gmail-subject">
                        {email.subject || '(No Subject)'}
                      </div>

                      <div className="gmail-snippet">
                        {email.body ? email.body.slice(0, 100) : 'No message content preview'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Email Detail & Reply View */}
        {selectedEmail ? (
          <div className="gmail-detail-pane">
            
            {/* Detail Top Header with Back Navigation for Mobile */}
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                {/* Mobile Back Button */}
                <button
                  onClick={handleBackToList}
                  title="Back to inbox"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.15s ease'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                </button>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedEmail.subject || '(No Subject)'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {new Date(selectedEmail.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>

              {/* Status pill in header */}
              {(() => {
                const s = statusStyles[selectedEmail.status] || statusStyles.received;
                return (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: s.background,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                    textTransform: 'uppercase',
                    flexShrink: 0
                  }}>
                    {s.label}
                  </span>
                );
              })()}
            </div>

            {/* Message Body & Sender Card */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Email Subject Title Heading */}
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif", wordBreak: 'break-word', lineHeight: 1.35 }}>
                {selectedEmail.subject || '(No Subject)'}
              </div>

              {/* Sender Details Box */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                <div
                  className="gmail-avatar"
                  style={{
                    width: 42,
                    height: 42,
                    fontSize: '0.95rem',
                    ...getAvatarStyle(selectedEmail.from_email)
                  }}
                >
                  {getSenderInitials(selectedEmail.from_email)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {selectedEmail.from_email}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                    <span>to </span>
                    <strong style={{ color: '#334155', fontWeight: 600 }}>{selectedEmail.to_email || 'info@seevora.in'}</strong>
                    <span style={{ margin: '0 6px', color: '#cbd5e1' }}>•</span>
                    <span>{new Date(selectedEmail.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Quarantine Reason Notice if any */}
              {selectedEmail.status === 'quarantined' && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  color: '#991b1b',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 2 }}>Auto-reply held for security</strong>
                    {quarantineReasonText(selectedEmail.quarantine_reason)} You can review the content below and reply manually if safe.
                  </div>
                </div>
              )}

              {/* Email Plain Text Body */}
              <div style={{
                fontSize: '0.9rem',
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.65,
                padding: '4px 0 16px'
              }}>
                {selectedEmail.body || '(Empty email body)'}
              </div>

              {/* Toast alert inside detail */}
              {toast && (
                <div style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: toast.type === 'success' ? '#065f46' : '#b91c1c',
                  border: `1px solid ${toast.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
                </div>
              )}
            </div>

            {/* Bottom Actions / Reply Section (Gmail Mobile Style) */}
            {!showReplyBox ? (
              /* Compact Bottom Action Bar */
              <div style={{
                padding: '12px 16px',
                background: '#ffffff',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0
              }}>
                {/* Reply Button Pill */}
                <button
                  onClick={handleOpenReply}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 24,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                  </svg>
                  <span>Reply</span>
                </button>

                {/* AI Draft Reply Button Pill */}
                <button
                  onClick={handleOpenAIReply}
                  disabled={generatingAI}
                  style={{
                    flex: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 24,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: generatingAI ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {generatingAI ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gmail-spin-icon">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                      </svg>
                      <span>Drafting...</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"/>
                      </svg>
                      <span>AI Draft Reply</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Expanded Reply Note / Composer */
              <div style={{
                padding: '12px 16px 14px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flexShrink: 0,
                boxShadow: '0 -4px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                    </svg>
                    <span>Replying to {selectedEmail.from_email}</span>
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={handleGenerateAI}
                      disabled={generatingAI}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#ffffff',
                        cursor: generatingAI ? 'not-allowed' : 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        opacity: generatingAI ? 0.75 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Generate new draft"
                    >
                      {generatingAI ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gmail-spin-icon">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                          </svg>
                          Drafting...
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"/>
                          </svg>
                          AI Draft
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowReplyBox(false)}
                      title="Close reply note"
                      style={{
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        lineHeight: 1
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <textarea
                  placeholder="Type your reply note here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    minHeight: 80,
                    maxHeight: 180,
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {replyText ? (
                    <button
                      onClick={() => setReplyText('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear
                    </button>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setShowReplyBox(false)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 18,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replyText.trim()}
                      style={{
                        padding: '6px 18px',
                        borderRadius: 18,
                        border: 'none',
                        background: (sending || !replyText.trim()) ? '#cbd5e1' : '#0f172a',
                        color: (sending || !replyText.trim()) ? '#64748b' : '#ffffff',
                        cursor: (sending || !replyText.trim()) ? 'not-allowed' : 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: (sending || !replyText.trim()) ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.25)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {sending ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <span>Send</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        ) : (
          <div className="gmail-detail-pane" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '0.86rem',
            padding: 30
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: 2 }}>No email selected</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Select a conversation from the left to read and reply.</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
