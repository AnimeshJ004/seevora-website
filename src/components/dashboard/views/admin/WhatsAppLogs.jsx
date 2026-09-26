import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../../../auth/api';

/* ── helpers ── */
const API = async (path, opts = {}) => {
  try {
    const res  = await apiFetch(`/api${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.message || data.error || `Error ${res.status}` };
    return data;
  } catch (e) { return { error: e.message || 'Network error' }; }
};

const fmt = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const now = new Date();
  const diffMs = now - dt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const fmtTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const avatar = (name, phone) => {
  const s = name || phone || '?';
  return s.trim()[0]?.toUpperCase() || '?';
};

const STAGE_COLORS = {
  new: '#0ea5e9', contacted: '#eab308', qualified: '#f97316',
  proposal: '#a855f7', closed: '#22c55e',
};

// ── Stat Card ──
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: "'Outfit',sans-serif", color: '#f1f5f9', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );
}

// ── Conversation List Item ──
function ConvItem({ conv, selected, onClick }) {
  const name = conv.contact_name || conv.contact_phone;
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer', transition: 'background 0.12s',
        background: selected ? 'rgba(37,211,102,0.08)' : 'transparent',
        borderLeft: selected ? '3px solid #25d366' : '3px solid transparent',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#25d366,#128c7e)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
        {avatar(conv.contact_name, conv.contact_phone)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{name}</span>
          <span style={{ fontSize: '0.68rem', color: '#475569', flexShrink: 0 }}>{fmt(conv.last_message_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
            {conv.last_message || 'No messages yet'}
          </span>
          {conv.unread_count > 0 && (
            <span style={{ background: '#25d366', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
        {conv.lead_stage && (
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: (STAGE_COLORS[conv.lead_stage] || '#64748b') + '22', color: STAGE_COLORS[conv.lead_stage] || '#94a3b8' }}>
              {conv.lead_stage?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message Bubble ──
function MsgBubble({ msg }) {
  const isOut = msg.direction === 'outbound';
  return (
    <div style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div style={{
        maxWidth: '70%', padding: '9px 13px', borderRadius: isOut ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isOut ? 'linear-gradient(135deg,#25d366,#128c7e)' : 'rgba(255,255,255,0.07)',
        color: isOut ? '#fff' : '#f1f5f9', fontSize: '0.85rem', lineHeight: 1.55,
        border: isOut ? 'none' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</div>
        <div style={{ fontSize: '0.65rem', marginTop: 4, opacity: 0.7, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {fmtTime(msg.sent_at)}
          {isOut && (
            <span style={{ fontSize: '0.7rem' }}>
              {msg.status === 'read' || msg.status === 'delivered' ? 'delivered' : 'sent'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create Lead Modal ──
function CreateLeadModal({ conv, onClose, onCreated }) {
  const [form, setForm] = useState({ name: conv.contact_name || '', company: '', industry: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inp = { background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' };

  const handleSave = async () => {
    setSaving(true); setError('');
    const res = await API(`/whatsapp/conversations/${conv.id}/create-lead`, { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    onCreated(res.lead);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#0f2744', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 460, color: '#f1f5f9' }}>
        <h3 style={{ margin: '0 0 20px', fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.1rem' }}>Create CRM Lead</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {[['name','Contact Name *'],['company','Company'],['industry','Industry']].map(([k,l]) => (
            <label key={k} style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {l}
              <input style={inp} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={l} />
            </label>
          ))}
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 5 }}>
            Notes
            <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes about this lead..." />
          </label>
        </div>
        {error && <div style={{ marginTop: 12, color: '#f87171', background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 10, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#25d366', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}>
            {saving ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Automation Panel ──
function AutomationPanel({ rules, onRefresh }) {
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ name: '', triggerType: 'keyword', triggerKeyword: '', responseTemplate: '' });

  const inp = { background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: '0.83rem', width: '100%', outline: 'none', boxSizing: 'border-box' };

  const toggleRule = async (rule) => {
    await API(`/whatsapp/automation/${rule.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !rule.is_active }) });
    onRefresh();
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Delete this automation rule?')) return;
    await API(`/whatsapp/automation/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleAdd = async () => {
    setSaving(true); setError('');
    const res = await API('/whatsapp/automation', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setForm({ name: '', triggerType: 'keyword', triggerKeyword: '', responseTemplate: '' });
    setShowAdd(false);
    onRefresh();
  };

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1rem', color: '#f1f5f9' }}>Automation Rules</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Auto-reply to inbound WhatsApp messages</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#25d366', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>+ Add Rule</button>
      </div>

      {showAdd && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
              Rule Name
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Welcome Message" />
            </label>
            <label style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
              Trigger Type
              <select style={inp} value={form.triggerType} onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))}>
                <option value="first_message">First Message (Welcome)</option>
                <option value="keyword">Keyword Match</option>
                <option value="all">All Messages</option>
              </select>
            </label>
            {form.triggerType === 'keyword' && (
              <label style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                Keyword
                <input style={inp} value={form.triggerKeyword} onChange={e => setForm(f => ({ ...f, triggerKeyword: e.target.value }))} placeholder="e.g. price, services, hello" />
              </label>
            )}
            <label style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
              Auto-Reply Message
              <textarea style={{ ...inp, height: 90, resize: 'vertical' }} value={form.responseTemplate} onChange={e => setForm(f => ({ ...f, responseTemplate: e.target.value }))} placeholder="What should Seevora reply?" />
            </label>
          </div>
          {error && <div style={{ marginTop: 8, color: '#f87171', fontSize: '0.78rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#25d366', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
              {saving ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: '#475569', fontSize: '0.82rem' }}>No automation rules yet. Add one above.</div>
        )}
        {rules.map(rule => (
          <div key={rule.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${rule.is_active ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#f1f5f9', marginBottom: 4 }}>{rule.name}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                    {rule.trigger_type === 'first_message' ? 'First Message' : rule.trigger_type === 'keyword' ? `Keyword: "${rule.trigger_keyword}"` : 'All Messages'}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: rule.is_active ? 'rgba(37,211,102,0.15)' : 'rgba(100,116,139,0.15)', color: rule.is_active ? '#25d366' : '#64748b' }}>
                    {rule.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleRule(rule)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${rule.is_active ? 'rgba(37,211,102,0.3)' : 'rgba(255,255,255,0.1)'}`, background: 'none', color: rule.is_active ? '#25d366' : '#64748b', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                  {rule.is_active ? 'Pause' : 'Enable'}
                </button>
                <button onClick={() => deleteRule(rule.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>Delete</button>
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.5 }}>
              "{rule.response_template?.slice(0, 120)}{rule.response_template?.length > 120 ? '...' : ''}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Right Panel: Contact Details ──
function ContactPanel({ conv, onCreateLead }) {
  if (!conv) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', textAlign: 'center', padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748b', marginBottom: 6 }}>Select a conversation</div>
      <div style={{ fontSize: '0.78rem', color: '#475569' }}>Click on any conversation to view details</div>
    </div>
  );

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Contact avatar */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#25d366,#128c7e)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', color: '#fff' }}>
          {avatar(conv.contact_name, conv.contact_phone)}
        </div>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9' }}>{conv.contact_name || 'Unknown'}</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{conv.contact_phone}</div>
      </div>

      {/* Info rows */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['Phone', conv.contact_phone],
          ['Last Message', fmt(conv.last_message_at)],
          ['Status', conv.status || 'open'],
          ['Unread', conv.unread_count > 0 ? `${conv.unread_count} unread` : 'All read'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 8, fontSize: '0.78rem' }}>
            <span style={{ color: '#475569', width: 80, flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'capitalize' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* CRM Link */}
      {conv.lead_id ? (
        <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#25d366', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>CRM Lead Linked</div>
          {conv.lead_name && <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f1f5f9' }}>{conv.lead_name}</div>}
          {conv.lead_stage && (
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: (STAGE_COLORS[conv.lead_stage] || '#64748b') + '22', color: STAGE_COLORS[conv.lead_stage] || '#94a3b8' }}>
                {conv.lead_stage?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <button onClick={onCreateLead} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25d366', cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
          + Create CRM Lead
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════
export default function WhatsAppLogs() {
  const [tab, setTab]                 = useState('inbox');
  const [conversations, setConvs]    = useState([]);
  const [rules, setRules]            = useState([]);
  const [stats, setStats]            = useState(null);
  const [selectedConvId, setSelId]   = useState(null);
  const [messages, setMessages]      = useState([]);
  const [loadingConvs, setLoadConvs] = useState(true);
  const [loadingMsgs, setLoadMsgs]   = useState(false);
  const [sending, setSending]        = useState(false);
  const [msgText, setMsgText]        = useState('');
  const [search, setSearch]          = useState('');
  const [showCreateLead, setShowCL]  = useState(false);
  const [sendError, setSendError]    = useState('');
  const messagesEndRef               = useRef(null);
  const inputRef                     = useRef(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || null;

  const loadConvs = useCallback(async () => {
    const res = await API(`/whatsapp/conversations${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    if (res.conversations) setConvs(res.conversations);
  }, [search]);

  const loadRules = useCallback(async () => {
    const res = await API('/whatsapp/automation');
    if (res.rules) setRules(res.rules);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await API('/whatsapp/stats');
    if (!res.error) setStats(res);
  }, []);

  useEffect(() => {
    setLoadConvs(true);
    Promise.all([loadConvs(), loadStats()]).finally(() => setLoadConvs(false));
  }, [loadConvs, loadStats]);

  useEffect(() => {
    if (tab === 'automation') loadRules();
  }, [tab, loadRules]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      loadConvs();
      if (selectedConvId) loadMessages(selectedConvId, false);
      loadStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadConvs, loadStats, selectedConvId]);

  const loadMessages = async (convId, showLoader = true) => {
    if (showLoader) setLoadMsgs(true);
    const res = await API(`/whatsapp/conversations/${convId}/messages`);
    if (res.messages) {
      setMessages(res.messages);
      setConvs(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
    }
    if (showLoader) setLoadMsgs(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConv = (conv) => {
    setSelId(conv.id);
    setMessages([]);
    setSendError('');
    loadMessages(conv.id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!msgText.trim() || !selectedConvId || sending) return;
    setSending(true); setSendError('');
    const text = msgText.trim();
    setMsgText('');

    const optimistic = { id: 'opt_' + Date.now(), direction: 'outbound', body: text, status: 'sending', sent_at: new Date().toISOString(), message_type: 'text' };
    setMessages(prev => [...prev, optimistic]);

    const res = await API(`/whatsapp/conversations/${selectedConvId}/send`, { method: 'POST', body: JSON.stringify({ text }) });
    setSending(false);

    if (res.error) {
      setSendError(res.error);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
    } else {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'sent', wamid: res.wamid } : m));
    }
    setTimeout(() => loadMessages(selectedConvId, false), 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleLeadCreated = (lead) => {
    setConvs(prev => prev.map(c => c.id === selectedConvId ? { ...c, lead_id: lead.id, lead_name: lead.name } : c));
  };

  const S = {
    container:   { height: '100%', display: 'flex', flexDirection: 'column', color: '#f1f5f9', fontFamily: "'Inter',sans-serif", overflow: 'hidden' },
    header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
    tabs:        { display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 },
    tab: (a) => ({ padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.15s', background: a ? 'rgba(37,211,102,0.2)' : 'transparent', color: a ? '#25d366' : '#64748b' }),
    statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 },
    panelsRow:   { display: 'grid', gridTemplateColumns: '280px 1fr 220px', flex: 1, gap: 0, minHeight: 0, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' },
    leftPanel:   { borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    centerPanel: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    rightPanel:  { borderLeft: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  };

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.5rem' }}>
            WhatsApp Hub
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#475569' }}>
            {stats ? `${stats.totalConversations} conversations · ${stats.unreadConversations} unread` : 'Loading...'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={S.tabs}>
            <button style={S.tab(tab === 'inbox')} onClick={() => setTab('inbox')}>Inbox</button>
            <button style={S.tab(tab === 'automation')} onClick={() => setTab('automation')}>Automation</button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={S.statsRow}>
        <StatCard label="Conversations" value={stats?.totalConversations ?? 0} color="#25d366" />
        <StatCard label="Unread" value={stats?.unreadConversations ?? 0} color="#f97316" />
        <StatCard label="Messages" value={stats?.totalMessages ?? 0} color="#0ea5e9" />
        <StatCard label="Auto-Rules" value={rules.length || 0} color="#8b5cf6" />
      </div>

      {/* Main Panels */}
      {tab === 'inbox' ? (
        <div style={S.panelsRow}>
          {/* LEFT: Conversation list */}
          <div style={S.leftPanel}>
            <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                style={{ width: '100%', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#f1f5f9', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingConvs ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#475569', fontSize: '0.82rem' }}>Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>No conversations yet</div>
                  <div style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>Messages will appear here once customers contact your WhatsApp Business number.</div>
                </div>
              ) : (
                conversations.map(conv => (
                  <ConvItem key={conv.id} conv={conv} selected={selectedConvId === conv.id} onClick={() => handleSelectConv(conv)} />
                ))
              )}
            </div>
          </div>

          {/* CENTER: Chat window */}
          <div style={S.centerPanel}>
            {!selectedConv ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#64748b' }}>Select a conversation</div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Choose a contact from the left to view messages</div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#25d366,#128c7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                    {avatar(selectedConv.contact_name, selectedConv.contact_phone)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{selectedConv.contact_name || 'Unknown Contact'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#475569' }}>{selectedConv.contact_phone}</div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                  {loadingMsgs ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.82rem' }}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.82rem', flexDirection: 'column', gap: 8 }}>
                      <div>No messages yet in this conversation.</div>
                      <div style={{ fontSize: '0.75rem', color: '#334155' }}>Send the first message below.</div>
                    </div>
                  ) : (
                    messages.map(msg => <MsgBubble key={msg.id} msg={msg} />)
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send box */}
                <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  {sendError && <div style={{ marginBottom: 6, fontSize: '0.75rem', color: '#f87171' }}>{sendError}</div>}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <textarea
                      ref={inputRef}
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Enter to send)"
                      rows={1}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: '0.84rem', outline: 'none', resize: 'none', minHeight: 38, maxHeight: 100, lineHeight: 1.5, fontFamily: 'inherit' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!msgText.trim() || sending}
                      style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: !msgText.trim() || sending ? 'rgba(37,211,102,0.3)' : '#25d366', color: '#fff', cursor: !msgText.trim() || sending ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, transition: 'all 0.15s' }}
                    >
                      {sending ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Contact Details */}
          <div style={S.rightPanel}>
            <ContactPanel conv={selectedConv} onCreateLead={() => setShowCL(true)} />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', minHeight: 0 }}>
          <AutomationPanel rules={rules} onRefresh={loadRules} />
        </div>
      )}

      {showCreateLead && selectedConv && (
        <CreateLeadModal
          conv={selectedConv}
          onClose={() => setShowCL(false)}
          onCreated={(lead) => { handleLeadCreated(lead); setShowCL(false); loadConvs(); }}
        />
      )}
    </div>
  );
}
