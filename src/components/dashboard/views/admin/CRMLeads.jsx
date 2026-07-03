import React, { useState, useEffect, useCallback } from 'react';

const API = (path, token, opts = {}) =>
  fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  }).then(r => r.json());

const STAGES = [
  { id: 'new',        label: 'New',        color: '#6366f1', icon: '✦' },
  { id: 'contacted',  label: 'Contacted',  color: '#f59e0b', icon: '📧' },
  { id: 'qualified',  label: 'Qualified',  color: '#3b82f6', icon: '⭐' },
  { id: 'proposal',   label: 'Proposal',   color: '#8b5cf6', icon: '📄' },
  { id: 'closed',     label: 'Closed Won', color: '#10b981', icon: '🏆' },
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
      {s.icon} {s.label}
    </span>
  );
};

function AddLeadModal({ onClose, onSave, token }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', industry: '', designation: '', source: 'manual', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name) { setError('Name is required.'); return; }
    setSaving(true);
    const res = await API('/leads', token, { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.lead) { onSave(res.lead); onClose(); }
    else setError(res.message || 'Failed to create lead');
  };

  const inp = { background: 'var(--bg-space,#0d1b2e)', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary,#f1f5f9)', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card,#0f2744)', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 20, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', color: 'var(--text-primary,#f1f5f9)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.15rem' }}>Add New Lead</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['name','Name *'],['email','Email'],['phone','Phone'],['company','Company'],['designation','Designation']].map(([k, label]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600 }}>{label}</label>
              <input style={inp} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={label} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600 }}>Industry</label>
            <select style={inp} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600 }}>Source</label>
            <select style={inp} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600 }}>Notes</label>
          <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this lead…" />
        </div>

        {error && <div style={{ marginTop: 12, color: '#f87171', fontSize: '0.8rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--glass-border,rgba(255,255,255,0.15))', background: 'none', color: 'var(--text-muted,#64748b)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            {saving ? 'Saving…' : 'Add Lead'}
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
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)', marginTop: 2 }}>{lead.company || '—'} · {lead.designation || 'No designation'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        {/* Contact info */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, display: 'grid', gap: 10 }}>
          {[['📧', 'Email', lead.email], ['📞', 'Phone', lead.phone], ['🏭', 'Industry', lead.industry], ['🌐', 'Source', lead.source]].map(([icon, label, val]) => val ? (
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
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Score */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Lead Score: {score}</label>
          <input type="range" min={0} max={100} value={score} onChange={e => setScore(e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted,#64748b)', marginTop: 4 }}>
            <span>Cold (0)</span><span>Warm (50)</span><span>Hot (100)</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Notes</label>
          <textarea style={{ ...inp, height: 90, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this lead…" />
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
        <button onClick={() => onQuickEmail(lead)} style={{ padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          ⚡ Send AI Email
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary,#f1f5f9)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          {saving ? 'Saving…' : '💾 Save Changes'}
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
            <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>⚡ AI Email to {lead.name}</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)', marginTop: 3 }}>{lead.email} · {lead.company || 'No company'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {result ? (
          <div>
            <div style={{ background: result.message?.includes('sent') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.message?.includes('sent') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: result.message?.includes('sent') ? '#10b981' : '#f87171', marginBottom: 8 }}>
                {result.message?.includes('sent') ? '✅ Email Sent!' : '⚠️ ' + result.message}
              </div>
              {result.aiUsed && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)' }}>✨ Personalized by Gemini AI</div>}
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
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {preview.aiUsed ? '✨ AI Preview' : 'Template Preview'}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.88rem' }}>Subject: {preview.subject}</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.78rem', color: 'var(--text-muted,#94a3b8)', fontFamily: 'inherit', lineHeight: 1.7, maxHeight: 200, overflowY: 'auto' }}>{preview.body}</pre>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={handlePreview} disabled={previewing} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                {previewing ? '⏳ Generating…' : '👁 AI Preview'}
              </button>
              <button onClick={handleSend} disabled={sending || !lead.email} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: sending || !lead.email ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem', opacity: !lead.email ? 0.5 : 1 }}>
                {sending ? '⏳ Sending…' : '⚡ Send Now'}
              </button>
            </div>
            {!lead.email && <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: 8, textAlign: 'right' }}>⚠️ This lead has no email address</div>}
          </>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, onClick, onQuickEmail, onStageChange, token }) {
  const stage = STAGES.find(s => s.id === lead.pipelineStage) || STAGES[0];
  const [moving, setMoving] = useState(false);

  const moveStage = async (dir, e) => {
    e.stopPropagation();
    const idx = STAGES.findIndex(s => s.id === lead.pipelineStage);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    setMoving(true);
    const res = await API(`/leads/${lead.id}`, token, {
      method: 'PATCH', body: JSON.stringify({ pipelineStage: STAGES[newIdx].id }),
    });
    setMoving(false);
    if (res.lead) onStageChange(res.lead);
  };

  return (
    <div onClick={onClick} style={{ background: 'var(--bg-card,#0f2744)', border: '1px solid var(--glass-border,rgba(255,255,255,0.07))', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', marginBottom: 10, position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${stage.color}44`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary,#f1f5f9)' }}>{lead.name}</div>
        <ScoreBadge score={lead.score} />
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)', marginBottom: 10 }}>
        {lead.company && <span>🏢 {lead.company}</span>}
        {lead.industry && <span style={{ marginLeft: 8 }}>· {lead.industry}</span>}
      </div>
      {lead.email && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted,#64748b)', marginBottom: 10 }}>📧 {lead.email}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={e => { e.stopPropagation(); onQuickEmail(lead); }} title="Send AI Email" style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.15)', color: '#6366f1', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>⚡ AI Email</button>
          <button onClick={e => moveStage(-1, e)} disabled={moving || lead.pipelineStage === 'new'} title="Move back" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: 'var(--text-muted,#64748b)', cursor: 'pointer', fontSize: '0.7rem' }}>←</button>
          <button onClick={e => moveStage(1, e)} disabled={moving || lead.pipelineStage === 'closed'} title="Move forward" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: 'var(--text-muted,#64748b)', cursor: 'pointer', fontSize: '0.7rem' }}>→</button>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted,#64748b)' }}>
          {new Date(lead.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default function CRMLeads({ user }) {
  const token = localStorage.getItem('seevora_token') || '';
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [quickEmailLead, setQuickEmailLead] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

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
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted,#64748b)' }}>{leads.length} leads · AI-powered outbound email bot</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', background: 'var(--bg-space,#0d1b2e)', color: 'var(--text-primary,#f1f5f9)', fontSize: '0.82rem', outline: 'none', width: 200 }} />
          <div style={{ display: 'flex', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 8, overflow: 'hidden' }}>
            {[['kanban','▤ Kanban'],['list','☰ List']].map(([v,l]) => (
              <button key={v} onClick={() => setViewMode(v)} style={{ padding: '8px 14px', border: 'none', background: viewMode === v ? 'rgba(99,102,241,0.2)' : 'none', color: viewMode === v ? '#6366f1' : 'var(--text-muted,#64748b)', cursor: 'pointer', fontWeight: viewMode === v ? 700 : 400, fontSize: '0.82rem' }}>{l}</button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+ Add Lead</button>
        </div>
      </div>

      {/* Stage summary pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {STAGES.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: s.color + '15', border: `1px solid ${s.color}33`, borderRadius: 100, padding: '5px 14px' }}>
            <span style={{ color: s.color, fontSize: '0.72rem', fontWeight: 700 }}>{s.icon} {s.label}</span>
            <span style={{ background: s.color, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{stageGroups[s.id]?.length || 0}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted,#64748b)' }}>Loading leads…</div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, flex: 1, minHeight: 0, overflowX: 'auto' }}>
          {STAGES.map(stage => (
            <div key={stage.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border,rgba(255,255,255,0.06))', borderRadius: 14, padding: '14px 12px', display: 'flex', flexDirection: 'column', minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${stage.color}44` }}>
                <span style={{ fontSize: '1rem' }}>{stage.icon}</span>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: stage.color }}>{stage.label}</span>
                <span style={{ marginLeft: 'auto', background: stage.color + '33', color: stage.color, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{stageGroups[stage.id]?.length || 0}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {stageGroups[stage.id]?.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted,#475569)', fontSize: '0.75rem', marginTop: 20, opacity: 0.5 }}>No leads</div>
                ) : (
                  stageGroups[stage.id].map(lead => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} onQuickEmail={setQuickEmailLead} onStageChange={handleLeadUpdate} token={token} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
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
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted,#94a3b8)' }}>{lead.company || '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted,#94a3b8)' }}>{lead.email || '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted,#94a3b8)' }}>{lead.industry || '—'}</td>
                  <td style={{ padding: '12px 14px' }}><StageBadge stage={lead.pipelineStage} /></td>
                  <td style={{ padding: '12px 14px' }}><ScoreBadge score={lead.score} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setQuickEmailLead(lead)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.15)', color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>⚡ AI Email</button>
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
