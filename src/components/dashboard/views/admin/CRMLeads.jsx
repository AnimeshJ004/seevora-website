import React, { useState, useEffect, useCallback } from 'react';

const API = (path, token, opts = {}) =>
  fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
    .then(r => r.json())
    .catch(err => ({ error: err.message || 'Network error' }));


const STAGES = [
  { id: 'new',        label: 'New',        color: '#0ea5e9', icon: '' },
  { id: 'contacted',  label: 'Contacted',  color: '#eab308', icon: '' },
  { id: 'qualified',  label: 'Qualified',  color: '#f97316', icon: '' },
  { id: 'proposal',   label: 'Proposal',   color: '#a855f7', icon: '' },
  { id: 'closed',     label: 'Closed Won', color: '#22c55e', icon: '' },
];

const INDUSTRIES = ['Healthcare', 'Education', 'Fitness', 'Legal', 'Real Estate', 'Diagnostics', 'Wellness', 'Finance', 'Retail', 'Technology', 'Other'];
const SOURCES = ['manual', 'website', 'referral', 'social_media', 'cold_outreach', 'import', 'whatsapp'];

const ScoreBadge = ({ score }) => {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#6b7280';
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 100, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700 }}>
      {score}
    </span>
  );
};

const StageBadge = ({ stage }) => {
  const s = STAGES.find(x => x.id === stage) || STAGES[0];
  return (
    <span style={{ background: s.color + '22', color: s.color, borderRadius: 100, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

function AddLeadModal({ onClose, onSave, token }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', industry: '', designation: '', source: 'manual', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    const res = await API('/leads', token, { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.lead) { onSave(res.lead); onClose(); }
    else setError(res.message || res.error || 'Failed to create lead');
  };

  const inp = { background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: 8, padding: '9px 12px', color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: 10, padding: 24, width: 540, maxHeight: '90vh', overflowY: 'auto', color: '#0f172a', boxShadow: '0 24px 80px rgba(15,23,42,0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.15rem' }}>Add New Lead</h3>
          <button onClick={onClose} style={{ border: '1px solid #dbe3ef', background: '#ffffff', color: '#64748b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}>Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[[ 'name','Name *' ],[ 'email','Email' ],[ 'phone','Phone' ],[ 'company','Company' ],[ 'designation','Designation' ]].map(([k, label]) => (
            <label key={k} style={labelStyle}>
              {label}
              <input style={inp} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={label} />
            </label>
          ))}
          <label style={labelStyle}>
            Industry
            <select style={inp} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Source
            <select style={inp} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </label>
        </div>

        <label style={{ ...labelStyle, marginTop: 14 }}>
          Notes
          <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this lead" />
        </label>

        {error && <div style={{ marginTop: 12, color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #dbe3ef', background: '#ffffff', color: '#334155', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#14b8a6', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.85rem', opacity: saving ? 0.75 : 1 }}>
            {saving ? 'Saving...' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
function LeadDetailDrawer({ lead, onClose, onUpdate, onQuickEmail, token }) {
  const [stage, setStage] = useState(lead.pipelineStage);
  const [score, setScore] = useState(lead.score);
  const [notes, setNotes] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await API(`/leads/${lead.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ pipelineStage: stage, score: parseInt(score), notes }),
    });
    setSaving(false);
    if (res.lead) onUpdate(res.lead);
  };

  const inp = { background: 'var(--bg-space,#0d1b2e)', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary,#f1f5f9)', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: 'var(--bg-card,#0f2744)', borderLeft: '1px solid var(--glass-border,rgba(255,255,255,0.08))', boxShadow: '-16px 0 60px rgba(0,0,0,0.4)', zIndex: 8000, overflowY: 'auto', color: 'var(--text-primary,#f1f5f9)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border,rgba(255,255,255,0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>{lead.name}</h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)', marginTop: 2 }}>{lead.company || '-'} - {lead.designation || 'No designation'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        {/* Contact info */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, display: 'grid', gap: 10 }}>
          {[['Email', 'Email', lead.email], ['Phone', 'Phone', lead.phone], ['Industry', 'Industry', lead.industry], ['Source', 'Source', lead.source]].map(([icon, label, val]) => val ? (
            <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.82rem' }}>
              <span>{icon}</span>
              <span style={{ color: 'var(--text-muted,#64748b)', width: 60, flexShrink: 0 }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{val}</span>
            </div>
          ) : null)}
        </div>

        {/* Stage */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Pipeline Stage</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STAGES.map(s => (
              <button key={s.id} onClick={() => setStage(s.id)} style={{ padding: '6px 14px', borderRadius: 100, border: `1px solid ${stage === s.id ? s.color : 'rgba(255,255,255,0.1)'}`, background: stage === s.id ? s.color + '33' : 'none', color: stage === s.id ? s.color : 'var(--text-muted,#64748b)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Score */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Lead Score: {score}</label>
          <input type="range" min={0} max={100} value={score} onChange={e => setScore(e.target.value)} style={{ width: '100%', accentColor: '#14b8a6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted,#64748b)', marginTop: 4 }}>
            <span>Cold (0)</span><span>Warm (50)</span><span>Hot (100)</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Notes</label>
          <textarea style={{ ...inp, height: 90, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this lead..." />
        </div>

        {/* Last contact */}
        {lead.lastContactedAt && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)' }}>
            Last contacted: {new Date(lead.lastContactedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: 20, borderTop: '1px solid var(--glass-border,rgba(255,255,255,0.08))', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => onQuickEmail(lead)} style={{ padding: '10px 14px', borderRadius: 6, border: 'none', background: '#14b8a6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Send AI Email
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary,#f1f5f9)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function QuickEmailModal({ lead, templates, token, onClose }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('english');
  const [senderName, setSenderName] = useState('Seevora Team');
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState(null);

  const inp = { background: 'var(--bg-space,#0d1b2e)', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary,#f1f5f9)', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' };

  const handlePreview = async () => {
    if (!templateId) return;
    setPreviewing(true);
    const res = await API('/email-bot/preview', token, {
      method: 'POST',
      body: JSON.stringify({ leadId: lead.id, templateId, tone, language, senderName }),
    });
    setPreviewing(false);
    if (res.subject) setPreview(res);
  };

  const handleSend = async () => {
    setSending(true);
    const res = await API('/email-bot/send-single', token, {
      method: 'POST',
      body: JSON.stringify({ leadId: lead.id, templateId, tone, language, senderName }),
    });
    setSending(false);
    setResult(res);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--bg-card,#0f2744)', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 20, padding: 28, width: 640, maxHeight: '90vh', overflowY: 'auto', color: 'var(--text-primary,#f1f5f9)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>AI Email to {lead.name}</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)', marginTop: 3 }}>{lead.email} - {lead.company || 'No company'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {result ? (
          <div>
            <div style={{ background: result.message?.includes('sent') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.message?.includes('sent') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: result.message?.includes('sent') ? '#10b981' : '#f87171', marginBottom: 8 }}>
                {result.message?.includes('sent') ? 'Sent Email Sent!' : 'Warning: ' + result.message}
              </div>
              {result.aiUsed && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)' }}>AI Personalized by OpenAI</div>}
            </div>
            {result.subject && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>Subject: {result.subject}</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: 'var(--text-muted,#94a3b8)', fontFamily: 'inherit', lineHeight: 1.6 }}>{result.body}</pre>
              </div>
            )}
            <button onClick={onClose} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Template</label>
                <select style={inp} value={templateId} onChange={e => { setTemplateId(e.target.value); setPreview(null); }}>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Tone</label>
                <select style={inp} value={tone} onChange={e => { setTone(e.target.value); setPreview(null); }}>
                  {[['professional','Professional'],['friendly','Friendly'],['urgent','Urgent']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Language</label>
                <select style={inp} value={language} onChange={e => { setLanguage(e.target.value); setPreview(null); }}>
                  {[['english','English'],['hindi','Hindi'],['hinglish','Hinglish']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Sender Name</label>
                <input style={inp} value={senderName} onChange={e => { setSenderName(e.target.value); setPreview(null); }} />
              </div>
            </div>

            {preview && (
              <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', color: '#14b8a6', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {preview.aiUsed ? 'AI Preview' : 'Template Preview'}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.88rem' }}>Subject: {preview.subject}</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.78rem', color: 'var(--text-muted,#94a3b8)', fontFamily: 'inherit', lineHeight: 1.7, maxHeight: 200, overflowY: 'auto' }}>{preview.body}</pre>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={handlePreview} disabled={previewing} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #475569', background: 'none', color: 'var(--text-primary,#f1f5f9)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                {previewing ? 'Generating...' : 'Preview AI'}
              </button>
              <button onClick={handleSend} disabled={sending || !lead.email} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#14b8a6', color: '#fff', cursor: sending || !lead.email ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: !lead.email ? 0.5 : 1 }}>
                {sending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
            {!lead.email && <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: 8, textAlign: 'right' }}>Warning: This lead has no email address</div>}
          </>
        )}
      </div>
    </div>
  );
}
export default function CRMLeads({ user }) {
  const token = localStorage.getItem('seevoraAuthToken') || localStorage.getItem('seevora_token') || '';
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [quickEmailLead, setQuickEmailLead] = useState(null);
  const [search, setSearch] = useState('');
  const [bulkSendState, setBulkSendState] = useState('idle'); // 'idle'|'sending'|'done'|'error'
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState('');

  const fetchLeads = useCallback(async () => {
    const res = await API(`/leads${search ? `?search=${encodeURIComponent(search)}` : ''}`, token);
    if (res.leads) setLeads(res.leads);
  }, [token, search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLeads(),
      API('/email-bot/templates', token).then(r => r.templates && setTemplates(r.templates)),
    ]).finally(() => setLoading(false));
  }, [fetchLeads, token]);

  const handleLeadUpdate = (updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    if (selectedLead?.id === updated.id) setSelectedLead(updated);
  };

  const handleBulkSend = async () => {
    const withEmail = leads.filter(l => l.email);
    if (!withEmail.length) { setBulkError('No leads have email addresses in CRM.'); return; }
    if (!window.confirm(`Send personalised emails to ${withEmail.length} lead${withEmail.length > 1 ? 's' : ''}?\n\nEach email will say "Hi [Name]" with their details.`)) return;
    setBulkSendState('sending');
    setBulkResult(null);
    setBulkError('');
    try {
      const leadIds = withEmail.map(l => l.id);
      const res = await API('/leads/bulk-email', token, { method: 'POST', body: JSON.stringify({ leadIds }) });
      if (res.error) {
        setBulkSendState('error');
        setBulkError(res.error);
        setTimeout(() => { setBulkSendState('idle'); setBulkError(''); }, 6000);
      } else if (res.success) {
        setBulkSendState('done');
        setBulkResult({ sent: res.sent, failed: res.failed });
        setTimeout(() => { setBulkSendState('idle'); setBulkResult(null); }, 6000);
      } else {
        setBulkSendState('error');
        setBulkError(res.message || 'Bulk send failed. Check SMTP settings in .env');
        setTimeout(() => { setBulkSendState('idle'); setBulkError(''); }, 6000);
      }
    } catch (err) {
      setBulkSendState('error');
      setBulkError(err.message || 'Bulk send failed. Check SMTP settings.');
      setTimeout(() => { setBulkSendState('idle'); setBulkError(''); }, 6000);
    }
  };

  const handleDeleteLead = async (e, leadId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await API(`/leads/${leadId}`, token, { method: 'DELETE' });
      if (res.error) {
        setBulkError(res.error || 'Failed to delete lead.');
        setTimeout(() => setBulkError(''), 5000);
      } else {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
      }
    } catch (err) {
      setBulkError(err.message || 'Failed to delete lead.');
      setTimeout(() => setBulkError(''), 5000);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL leads? This action cannot be undone.")) return;
    try {
      const res = await API('/leads/all', token, { method: 'DELETE' });
      if (res.error) {
        setBulkError(res.error || 'Failed to delete all leads.');
        setTimeout(() => setBulkError(''), 5000);
      } else {
        setLeads([]);
        setSelectedLead(null);
      }
    } catch (err) {
      setBulkError(err.message || 'Failed to delete all leads.');
      setTimeout(() => setBulkError(''), 5000);
    }
  };

  const stageGroups = STAGES.reduce((acc, s) => {
    acc[s.id] = leads.filter(l => l.pipelineStage === s.id);
    return acc;
  }, {});

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: 'var(--text-primary,#f1f5f9)', fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.5rem' }}>CRM Pipeline</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted,#64748b)' }}>{leads.length} leads - AI-powered outbound email bot</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', background: 'var(--bg-space,#0d1b2e)', color: 'var(--text-primary,#f1f5f9)', fontSize: '0.82rem', outline: 'none', width: 200 }} />
          {/* Send Mail in Bulk */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <button
              disabled={bulkSendState !== 'idle'}
              onClick={handleBulkSend}
              style={{
                padding: '8px 16px', borderRadius: 6, border: 'none', cursor: bulkSendState !== 'idle' ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '0.85rem', color: '#fff', transition: 'all 0.25s',
                background: bulkSendState === 'idle' ? '#14b8a6' :
                            bulkSendState === 'sending' ? '#475569' :
                            bulkSendState === 'done'    ? '#10b981' :
                                                         '#ef4444',
                opacity: bulkSendState === 'sending' ? 0.75 : 1,
              }}
            >
              {bulkSendState === 'idle'    ? '📧 Send Mail in Bulk' :
               bulkSendState === 'sending' ? '📧 Sending to all…' :
               bulkSendState === 'done'    ? '✓ All Mails Sent!' : '✕ Send Failed'}
            </button>
            {bulkResult && (
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                ✓ {bulkResult.sent} sent{bulkResult.failed > 0 ? ` · ${bulkResult.failed} failed` : ''}
              </span>
            )}
            {bulkError && (
              <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600, maxWidth: 280, textAlign: 'right', lineHeight: 1.4 }}>
                ✕ {bulkError}
              </span>
            )}
          </div>
          {leads.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              🗑 Delete All
            </button>
          )}
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#14b8a6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>+ Add Lead</button>
        </div>
      </div>

      {/* Stage summary pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {STAGES.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: s.color + '15', border: `1px solid ${s.color}33`, borderRadius: 100, padding: '5px 14px' }}>
            <span style={{ color: s.color, fontSize: '0.72rem', fontWeight: 700 }}>{s.label}</span>
            <span style={{ background: s.color, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{stageGroups[s.id]?.length || 0}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted,#64748b)' }}>Loading leads...</div>
      ) : (
        /* List View */
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Name', 'Company', 'Email', 'Industry', 'Stage', 'Score', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted,#64748b)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <td style={{ padding: '12px 14px' }} onClick={() => setSelectedLead(lead)}>
                    <div style={{ fontWeight: 700 }}>{lead.name}</div>
                    {lead.designation && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted,#64748b)' }}>{lead.designation}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted,#94a3b8)' }}>{lead.company || '-'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted,#94a3b8)' }}>{lead.email || '-'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted,#94a3b8)' }}>{lead.industry || '-'}</td>
                  <td style={{ padding: '12px 14px' }}><StageBadge stage={lead.pipelineStage} /></td>
                  <td style={{ padding: '12px 14px' }}><ScoreBadge score={lead.score} /></td>
                  <td style={{ padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setQuickEmailLead(lead)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(20,184,166,0.15)', color: '#14b8a6', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>AI Email</button>
                    <button
                      onClick={(e) => handleDeleteLead(e, lead.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted,#64748b)' }}>No leads found. Add your first lead to get started!</div>}
        </div>
      )}

      {/* Modals */}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSave={l => setLeads(prev => [l, ...prev])} token={token} />}
      {selectedLead && <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={handleLeadUpdate} onQuickEmail={setQuickEmailLead} token={token} />}
      {quickEmailLead && <QuickEmailModal lead={quickEmailLead} templates={templates} token={token} onClose={() => setQuickEmailLead(null)} />}
    </div>
  );
}



