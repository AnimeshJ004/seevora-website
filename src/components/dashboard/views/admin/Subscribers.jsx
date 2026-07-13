import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../../auth/api';

const API = async (path, opts = {}) => {
  const response = await apiFetch(`/api/email-bot${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.message || data.error || `Request failed (${response.status})` };
  }
  return data;
};

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', status: 'active' });
  // Track per-subscriber send state: { [id]: 'idle' | 'sending' | 'sent' | 'error' }
  const [sendState, setSendState] = useState({});

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const res = await API('/subscribers');
    if (res.subscribers) setSubscribers(res.subscribers);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.email) return;
    const res = await API('/subscribers', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (res.subscriber) {
      setSubscribers(prev => [res.subscriber, ...prev]);
      setShowAdd(false);
      setFormData({ email: '', name: '', status: 'active' });
    } else {
      alert(res.message || 'Failed to create subscriber');
    }
  };

  const handleSendEmail = async (sub) => {
    setSendState(prev => ({ ...prev, [sub.id]: 'sending' }));
    try {
      const res = await API(`/subscribers/${sub.id}/send-email`, { method: 'POST' });
      if (res.success) {
        setSendState(prev => ({ ...prev, [sub.id]: 'sent' }));
        // Reset back to idle after 3s
        setTimeout(() => setSendState(prev => ({ ...prev, [sub.id]: 'idle' })), 3000);
      } else {
        setSendState(prev => ({ ...prev, [sub.id]: 'error' }));
        setTimeout(() => setSendState(prev => ({ ...prev, [sub.id]: 'idle' })), 4000);
        alert(res.message || 'Failed to send email. Check SMTP settings.');
      }
    } catch {
      setSendState(prev => ({ ...prev, [sub.id]: 'error' }));
      setTimeout(() => setSendState(prev => ({ ...prev, [sub.id]: 'idle' })), 4000);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const res = await API(`/subscribers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    if (res.subscriber) {
      setSubscribers(prev => prev.map(s => s.id === id ? res.subscriber : s));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscriber?')) return;
    const res = await API(`/subscribers/${id}`, { method: 'DELETE' });
    if (res.message?.includes('deleted')) {
      setSubscribers(prev => prev.filter(s => s.id !== id));
    }
  };

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const inp = {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#0f172a',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };

  const getSendBtn = (sub) => {
    const state = sendState[sub.id] || 'idle';
    const styles = {
      idle:    { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', label: '✉ Send Email', disabled: false },
      sending: { bg: '#94a3b8',                                  color: '#fff', label: 'Sending…',    disabled: true  },
      sent:    { bg: 'linear-gradient(135deg,#10b981,#059669)',  color: '#fff', label: '✓ Sent!',      disabled: true  },
      error:   { bg: 'linear-gradient(135deg,#ef4444,#dc2626)',  color: '#fff', label: '✕ Failed',     disabled: true  },
    }[state];

    return (
      <button
        disabled={styles.disabled}
        onClick={() => handleSendEmail(sub)}
        style={{
          padding: '4px 12px', borderRadius: 6, border: 'none',
          background: styles.bg, color: styles.color,
          cursor: styles.disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.72rem', fontWeight: 700,
          transition: 'all 0.2s', whiteSpace: 'nowrap',
          opacity: styles.disabled && state === 'sending' ? 0.7 : 1,
        }}
      >
        {styles.label}
      </button>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0f172a' }}>Subscribers</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
            Manage your mailing list and send personalised emails directly to subscribers.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
        >
          + Add Subscriber
        </button>
      </div>

      {/* Search and stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap', background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search email or name..."
          style={{ ...inp, width: 250 }}
        />
        <div style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: 'auto' }}>
          Total: <strong style={{ color: '#6366f1' }}>{subscribers.length}</strong>
          {' '}| Active: <strong style={{ color: '#10b981' }}>{subscribers.filter(s => s.status === 'active').length}</strong>
          {' '}| Unsubscribed: <strong style={{ color: '#ef4444' }}>{subscribers.filter(s => s.status === 'unsubscribed').length}</strong>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading subscribers…</div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  {['Name', 'Email Address', 'Status', 'Subscribed At', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: '#475569', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{s.name || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>{s.email}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
                        background: s.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: s.status === 'active' ? '#10b981' : '#ef4444'
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {new Date(s.subscribedAt || s.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Send Email button */}
                        {getSendBtn(s)}

                        {/* Unsubscribe / Activate */}
                        {s.status === 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'unsubscribed')}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem' }}
                          >
                            Unsubscribe
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'active')}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)', background: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.72rem' }}
                          >
                            Activate
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(s.id)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.72rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No subscribers found.</div>
            )}
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, width: 420, color: '#0f172a', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>Add Subscriber</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', color: '#64748b' }}>Add a new contact to your mailing list.</p>
            <form onSubmit={handleAdd} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Email Address *</label>
                <input
                  placeholder="subscriber@company.com"
                  required
                  type="email"
                  style={inp}
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Full Name</label>
                <input
                  placeholder="e.g. Aarav Sharma"
                  style={inp}
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Status</label>
                <select style={inp} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setFormData({ email: '', name: '', status: 'active' }); }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'none', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Add Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
