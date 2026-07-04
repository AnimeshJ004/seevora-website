import React, { useState, useEffect, useCallback } from 'react';

const API = (path, token, opts = {}) =>
  fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  }).then(r => r.json());

const STAGES = [
  { id: 'new',       label: 'New',        color: '#6366f1' },
  { id: 'contacted', label: 'Contacted',  color: '#f59e0b' },
  { id: 'qualified', label: 'Qualified',  color: '#3b82f6' },
  { id: 'proposal',  label: 'Proposal',   color: '#8b5cf6' },
  { id: 'closed',    label: 'Closed Won', color: '#10b981' },
];

const INDUSTRIES = ['Healthcare', 'Education', 'Fitness', 'Legal', 'Real Estate', 'Diagnostics', 'Wellness', 'Finance', 'Retail', 'Technology', 'Other'];
const SOURCES    = ['manual', 'website', 'referral', 'social_media', 'cold_outreach', 'import', 'whatsapp'];

export default function Leads() {
  const token = localStorage.getItem('seevora_token') || '';
  const [leads, setLeads]               = useState([]);
  const [search, setSearch]             = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStage, setFilterStage]   = useState('');
  const [loading, setLoading]           = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [importText, setImportText]     = useState('');
  const [formData, setFormData]         = useState({ name: '', email: '', phone: '', company: '', industry: '', designation: '', source: 'manual', notes: '' });

  // Email send states
  // sendState[id] = 'idle' | 'sending' | 'sent' | 'error'
  const [sendState, setSendState]           = useState({});
  const [bulkSendState, setBulkSendState]   = useState('idle'); // 'idle'|'sending'|'done'|'error'
  const [bulkResult, setBulkResult]         = useState(null);   // { sent, failed, total }

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let path = '/leads';
    const params = [];
    if (search)       params.push(`search=${encodeURIComponent(search)}`);
    if (filterSource) params.push(`source=${encodeURIComponent(filterSource)}`);
    if (filterStage)  params.push(`stage=${encodeURIComponent(filterStage)}`);
    if (params.length) path += `?${params.join('&')}`;
    const res = await API(path, token);
    if (res.leads) setLeads(res.leads);
    setLoading(false);
  }, [token, search, filterSource, filterStage]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  /* ── Create Lead ─────────────────────────────────────────────────── */
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    const res = await API('/leads', token, { method: 'POST', body: JSON.stringify(formData) });
    if (res.lead) {
      setLeads(prev => [res.lead, ...prev]);
      setShowAdd(false);
      setFormData({ name: '', email: '', phone: '', company: '', industry: '', designation: '', source: 'manual', notes: '' });
    } else {
      alert(res.message || 'Failed to create lead');
    }
  };

  /* ── Bulk CSV Import ─────────────────────────────────────────────── */
  const handleBulkImport = async () => {
    if (!importText.trim()) return;
    try {
      const lines = importText.split('\n');
      const importLeads = [];
      for (const line of lines) {
        const parts = line.split(',');
        if (parts[0] && parts[0].trim() !== 'name') {
          importLeads.push({
            name:     parts[0]?.trim(),
            email:    parts[1]?.trim() || '',
            phone:    parts[2]?.trim() || '',
            company:  parts[3]?.trim() || '',
            industry: parts[4]?.trim() || '',
            source: 'import'
          });
        }
      }
      const res = await API('/leads/bulk', token, { method: 'POST', body: JSON.stringify({ leads: importLeads }) });
      if (res.leads) {
        alert(`Successfully imported ${res.leads.length} leads.`);
        setLeads(prev => [...res.leads, ...prev]);
        setShowImport(false);
        setImportText('');
      } else {
        alert(res.message || 'Import failed.');
      }
    } catch {
      alert('Failed to parse input. Ensure comma-separated values.');
    }
  };

  /* ── Delete / Update ─────────────────────────────────────────────── */
  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    const res = await API(`/leads/${id}`, token, { method: 'DELETE' });
    if (res.message?.includes('deleted')) {
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    }
  };

  const handleUpdateLead = async (id, payload) => {
    const res = await API(`/leads/${id}`, token, { method: 'PATCH', body: JSON.stringify(payload) });
    if (res.lead) {
      setLeads(prev => prev.map(l => l.id === id ? res.lead : l));
      if (selectedLead?.id === id) setSelectedLead(res.lead);
    }
  };

  /* ── Send email to ONE lead ──────────────────────────────────────── */
  const handleSendEmail = async (lead, e) => {
    e.stopPropagation();
    if (!lead.email) { alert('This lead has no email address.'); return; }
    setSendState(prev => ({ ...prev, [lead.id]: 'sending' }));
    try {
      const res = await API(`/leads/${lead.id}/send-email`, token, { method: 'POST' });
      if (res.success) {
        setSendState(prev => ({ ...prev, [lead.id]: 'sent' }));
        setTimeout(() => setSendState(prev => ({ ...prev, [lead.id]: 'idle' })), 3000);
        // refresh last contacted
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lastContactedAt: new Date().toISOString() } : l));
      } else {
        setSendState(prev => ({ ...prev, [lead.id]: 'error' }));
        setTimeout(() => setSendState(prev => ({ ...prev, [lead.id]: 'idle' })), 4000);
        alert(res.message || 'Failed to send email. Check SMTP settings in .env');
      }
    } catch {
      setSendState(prev => ({ ...prev, [lead.id]: 'error' }));
      setTimeout(() => setSendState(prev => ({ ...prev, [lead.id]: 'idle' })), 4000);
    }
  };

  /* ── Bulk send email to ALL visible leads ────────────────────────── */
  const handleBulkSendEmail = async () => {
    const leadsWithEmail = leads.filter(l => l.email);
    if (!leadsWithEmail.length) { alert('None of the current leads have email addresses.'); return; }
    if (!window.confirm(`Send personalised emails to ${leadsWithEmail.length} leads? Each will receive an email with their own name and details.`)) return;

    setBulkSendState('sending');
    setBulkResult(null);
    try {
      const leadIds = leadsWithEmail.map(l => l.id);
      const res = await API('/leads/bulk-email', token, { method: 'POST', body: JSON.stringify({ leadIds }) });
      if (res.success) {
        setBulkSendState('done');
        setBulkResult({ sent: res.sent, failed: res.failed, total: res.total });
        setTimeout(() => { setBulkSendState('idle'); setBulkResult(null); }, 6000);
      } else {
        setBulkSendState('error');
        alert(res.message || 'Bulk send failed.');
        setTimeout(() => setBulkSendState('idle'), 4000);
      }
    } catch {
      setBulkSendState('error');
      setTimeout(() => setBulkSendState('idle'), 4000);
    }
  };

  /* ── Styles ──────────────────────────────────────────────────────── */
  const inp = {
    background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8,
    padding: '8px 12px', color: '#0f172a', fontSize: '0.85rem', outline: 'none',
    width: '100%', boxSizing: 'border-box'
  };

  const getSendBtn = (lead) => {
    const state = sendState[lead.id] || 'idle';
    const hasEmail = !!lead.email;
    const cfg = {
      idle:    { bg: hasEmail ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0', color: hasEmail ? '#fff' : '#94a3b8', label: '✉ Email', dis: !hasEmail },
      sending: { bg: '#94a3b8', color: '#fff', label: '…',        dis: true  },
      sent:    { bg: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', label: '✓ Sent', dis: true  },
      error:   { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', label: '✕ Err',  dis: true  },
    }[state];
    return (
      <button
        disabled={cfg.dis}
        title={!hasEmail ? 'No email address for this lead' : `Send email to ${lead.email}`}
        onClick={(e) => handleSendEmail(lead, e)}
        style={{
          padding: '3px 10px', borderRadius: 6, border: 'none',
          background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 700,
          cursor: cfg.dis ? 'not-allowed' : 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
          opacity: state === 'sending' ? 0.7 : 1,
        }}
      >
        {cfg.label}
      </button>
    );
  };

  const bulkBtnCfg = {
    idle:    { bg: 'linear-gradient(135deg,#14c9e1,#6366f1)', label: '📧 Send Mail in Bulk', dis: false },
    sending: { bg: '#94a3b8', label: '📧 Sending to all…',      dis: true  },
    done:    { bg: 'linear-gradient(135deg,#10b981,#059669)', label: '✓ All Mails Sent!',  dis: true  },
    error:   { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', label: '✕ Failed',           dis: true  },
  }[bulkSendState];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Title bar ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0f172a' }}>CRM Leads</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
            Manage, filter, and email your leads directly from the CRM.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Bulk Email button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button
              disabled={bulkBtnCfg.dis}
              onClick={handleBulkSendEmail}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: bulkBtnCfg.bg, color: '#fff', cursor: bulkBtnCfg.dis ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.85rem', opacity: bulkSendState === 'sending' ? 0.75 : 1,
                transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
              }}
            >
              {bulkBtnCfg.label}
            </button>
            {bulkResult && (
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                ✓ {bulkResult.sent} sent{bulkResult.failed > 0 ? ` · ${bulkResult.failed} failed` : ''}
              </span>
            )}
          </div>

          <button onClick={() => setShowImport(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Bulk Import</button>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+ Create Lead</button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ ...inp, width: 220 }} />
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ ...inp, width: 150 }}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ ...inp, width: 150 }}>
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#64748b' }}>
          <span>Total: <strong style={{ color: '#6366f1' }}>{leads.length}</strong></span>
          <span>·</span>
          <span>With Email: <strong style={{ color: '#10b981' }}>{leads.filter(l => l.email).length}</strong></span>
        </div>
      </div>

      {/* ── Table + Details ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedLead ? '1.2fr 1fr' : '1fr', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Table Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading leads…</div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    {['Name / Company', 'Email / Phone', 'Industry', 'Source', 'Stage', 'Score', 'Email Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 12px', color: '#475569', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.12s', background: selectedLead?.id === lead.id ? 'rgba(99,102,241,0.05)' : 'transparent' }}
                      onMouseEnter={e => { if (selectedLead?.id !== lead.id) e.currentTarget.style.background = '#fafbff'; }}
                      onMouseLeave={e => { if (selectedLead?.id !== lead.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{lead.name}</div>
                        <div style={{ fontSize: '0.71rem', color: '#64748b' }}>{lead.company || '—'}</div>
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ color: lead.email ? '#334155' : '#94a3b8', fontStyle: lead.email ? 'normal' : 'italic' }}>{lead.email || 'No email'}</div>
                        <div style={{ fontSize: '0.71rem', color: '#64748b' }}>{lead.phone || '—'}</div>
                      </td>
                      <td style={{ padding: '11px 12px', color: '#475569' }}>{lead.industry || '—'}</td>
                      <td style={{ padding: '11px 12px', color: '#475569' }}>{lead.source}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
                          background: (STAGES.find(s => s.id === lead.pipelineStage)?.color || '#94a3b8') + '18',
                          color: STAGES.find(s => s.id === lead.pipelineStage)?.color || '#94a3b8'
                        }}>
                          {STAGES.find(s => s.id === lead.pipelineStage)?.label || lead.pipelineStage}
                        </span>
                      </td>
                      <td style={{ padding: '11px 12px', fontWeight: 700, color: lead.score >= 70 ? '#10b981' : lead.score >= 40 ? '#f59e0b' : '#6b7280' }}>
                        {lead.score}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        {getSendBtn(lead)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No leads match the filters.</div>}
            </div>
          )}
        </div>

        {/* Details Panel */}
        {selectedLead && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", color: '#0f172a', fontWeight: 800 }}>Lead Details</h3>
              <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 10, display: 'grid', gap: 10, color: '#334155', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#0f172a' }}>Name:</strong> {selectedLead.name}</div>
              <div><strong style={{ color: '#0f172a' }}>Email:</strong> {selectedLead.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No email</span>}</div>
              <div><strong style={{ color: '#0f172a' }}>Phone:</strong> {selectedLead.phone || 'N/A'}</div>
              <div><strong style={{ color: '#0f172a' }}>Company:</strong> {selectedLead.company || 'N/A'}</div>
              <div><strong style={{ color: '#0f172a' }}>Industry:</strong> {selectedLead.industry || 'N/A'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong>Pipeline Stage:</strong>
                <select value={selectedLead.pipelineStage} onChange={e => handleUpdateLead(selectedLead.id, { pipelineStage: e.target.value })} style={{ ...inp, width: 'auto', display: 'inline-block' }}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>Score:</strong>
                <input type="range" min="0" max="100" value={selectedLead.score} onChange={e => handleUpdateLead(selectedLead.id, { score: parseInt(e.target.value) })} style={{ width: '55%', verticalAlign: 'middle' }} />
                <span style={{ fontWeight: 700, color: selectedLead.score >= 70 ? '#10b981' : selectedLead.score >= 40 ? '#f59e0b' : '#6b7280' }}>{selectedLead.score}</span>
              </div>
              {selectedLead.lastContactedAt && (
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Last emailed: {new Date(selectedLead.lastContactedAt).toLocaleString()}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>Internal Notes</label>
              <textarea value={selectedLead.notes || ''} onChange={e => handleUpdateLead(selectedLead.id, { notes: e.target.value })} style={{ ...inp, height: 100, resize: 'vertical' }} placeholder="No notes yet…" />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Quick send from detail panel too */}
              {selectedLead.email && (
                <button
                  onClick={(e) => handleSendEmail(selectedLead, e)}
                  disabled={(sendState[selectedLead.id] || 'idle') !== 'idle'}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: {
                      idle:    'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      sending: '#94a3b8', sent: 'linear-gradient(135deg,#10b981,#059669)',
                      error:   'linear-gradient(135deg,#ef4444,#dc2626)'
                    }[sendState[selectedLead.id] || 'idle'],
                    color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                  }}
                >
                  {{ idle: '✉ Send Email', sending: 'Sending…', sent: '✓ Sent!', error: '✕ Failed' }[sendState[selectedLead.id] || 'idle']}
                </button>
              )}
              <button onClick={() => handleDeleteLead(selectedLead.id)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete Lead</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Lead Modal ──────────────────────────────────────────── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, width: 460, color: '#0f172a', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 18px 0', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Create Lead</h3>
            <form onSubmit={handleCreateLead} style={{ display: 'grid', gap: 12 }}>
              <input placeholder="Name *" required style={inp} value={formData.name}        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Email"  type="email" style={inp} value={formData.email}   onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
              <input placeholder="Phone" style={inp} value={formData.phone}                 onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
              <input placeholder="Company" style={inp} value={formData.company}             onChange={e => setFormData(f => ({ ...f, company: e.target.value }))} />
              <select style={inp} value={formData.industry} onChange={e => setFormData(f => ({ ...f, industry: e.target.value }))}>
                <option value="">Select Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select style={inp} value={formData.source} onChange={e => setFormData(f => ({ ...f, source: e.target.value }))}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea placeholder="Notes…" style={{ ...inp, height: 75 }} value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'none', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk CSV Import Modal ───────────────────────────────────── */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, width: 560, color: '#0f172a', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Bulk Import Leads (CSV)</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#64748b' }}>Paste comma-separated rows: Name, Email, Phone, Company, Industry (one per line)</p>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Rahul Kumar, rahul@gmail.com, +91 99999 11111, Kumar & Co, Technology" style={{ ...inp, height: 200, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" onClick={() => setShowImport(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'none', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleBulkImport} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Import Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
