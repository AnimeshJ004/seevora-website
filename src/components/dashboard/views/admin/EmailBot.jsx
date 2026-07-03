import React, { useState, useEffect, useCallback } from 'react';

const API = (path, token, opts = {}) =>
  fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  }).then(r => r.json());

/* ── Small reusable UI ───────────────────────────────────────────────── */
const inp = {
  background: 'var(--bg-space,#0d1b2e)',
  border: '1px solid var(--glass-border,rgba(255,255,255,0.1))',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'var(--text-primary,#f1f5f9)',
  fontSize: '0.85rem',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

const btn = (variant = 'primary') => ({
  padding: '9px 20px',
  borderRadius: 8,
  border: variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.12)',
  background: variant === 'primary' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : variant === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
  color: variant === 'danger' ? '#f87171' : '#f1f5f9',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.84rem',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

function Card({ children, title, action, style = {} }) {
  return (
    <div style={{ background: 'var(--bg-card,#0f2744)', border: '1px solid var(--glass-border,rgba(255,255,255,0.07))', borderRadius: 16, padding: 22, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          {title && <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '0.95rem' }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function StatPill({ label, value, color = '#6366f1', icon }) {
  return (
    <div style={{ background: color + '15', border: `1px solid ${color}33`, borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', fontFamily: "'Outfit',sans-serif", fontWeight: 900, color }}>{icon} {value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const CATEGORY_COLORS = { outbound: '#6366f1', 'follow-up': '#f59e0b', proposal: '#8b5cf6', reengagement: '#3b82f6', welcome: '#10b981' };
const TONES = [['professional', '💼 Professional'], ['friendly', '😊 Friendly'], ['urgent', '🔥 Urgent']];
const LANGS = [['english', '🇬🇧 English'], ['hindi', '🇮🇳 Hindi'], ['hinglish', '🤝 Hinglish']];

/* ══════════════════════════════════════════════════════════════════════
   TEMPLATE EDITOR
══════════════════════════════════════════════════════════════════════ */
function TemplateEditor({ template, onClose, onSave, token }) {
  const isNew = !template;
  const [form, setForm] = useState({
    name: template?.name || '',
    category: template?.category || 'outbound',
    subject: template?.subject || '',
    body: template?.body || '',
    tone: template?.tone || 'professional',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const insertVar = (v) => setForm(f => ({ ...f, body: f.body + `{{${v}}}` }));

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.body) { setError('Name, subject and body are all required.'); return; }
    setSaving(true);
    const url = isNew ? '/email-bot/templates' : `/email-bot/templates/${template.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await API(url, token, { method, body: JSON.stringify(form) });
    setSaving(false);
    if (res.template) { onSave(res.template); onClose(); }
    else setError(res.message || 'Save failed');
  };

  const VARS = ['name', 'company', 'industry', 'designation', 'sender_name'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--bg-card,#0f2744)', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 20, padding: 28, width: 660, maxHeight: '92vh', overflowY: 'auto', color: 'var(--text-primary,#f1f5f9)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.15rem' }}>
            {isNew ? '+ New Template' : '✏️ Edit Template'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Template Name *</label>
            <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cold Outreach — Healthcare" />
          </div>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Category</label>
            <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {['outbound', 'follow-up', 'proposal', 'reengagement', 'welcome'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Tone</label>
            <select style={inp} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
              {TONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Variable quick-insert */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Insert Variable →</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VARS.map(v => (
              <button key={v} onClick={() => insertVar(v)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)', color: '#818cf8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Subject Line *</label>
          <input style={inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Quick question for {{company}}" />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email Body *</label>
          <textarea style={{ ...inp, height: 240, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
            value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Hi {{name}},&#10;&#10;Write your email template here. Use {{variable}} placeholders for AI personalization.&#10;&#10;Best,&#10;{{sender_name}}" />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted,#64748b)', marginTop: 6 }}>
            💡 Gemini AI will enhance this template with lead-specific context at send time
          </div>
        </div>

        {error && <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: 12 }}>⚠️ {error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btn('ghost'), padding: '9px 20px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btn(), padding: '9px 22px' }}>
            {saving ? '⏳ Saving…' : '💾 Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CAMPAIGN BUILDER
══════════════════════════════════════════════════════════════════════ */
function CampaignBuilder({ templates, token, onClose, onCreated }) {
  const [step, setStep] = useState(1); // 1: config, 2: select leads, 3: review
  const [form, setForm] = useState({
    name: '',
    templateId: templates[0]?.id || '',
    tone: 'professional',
    language: 'english',
    senderPersona: 'Seevora Team',
    scheduledAt: '',
  });
  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [stageFilter, setStageFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'closed'];

  useEffect(() => {
    API(`/leads${stageFilter !== 'all' ? `?stage=${stageFilter}` : ''}`, token)
      .then(r => r.leads && setLeads(r.leads));
  }, [stageFilter, token]);

  const toggleLead = (id) => setSelectedLeadIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const toggleAll = () => setSelectedLeadIds(
    selectedLeadIds.length === leads.length ? [] : leads.map(l => l.id)
  );

  const handleCreate = async () => {
    if (!form.name || !form.templateId) { setError('Campaign name and template required.'); return; }
    if (!selectedLeadIds.length) { setError('Select at least one lead.'); return; }
    setCreating(true);
    const res = await API('/email-bot/campaigns', token, {
      method: 'POST',
      body: JSON.stringify({ ...form, leadIds: selectedLeadIds }),
    });
    setCreating(false);
    if (res.campaign) { onCreated(res.campaign); onClose(); }
    else setError(res.message || 'Failed to create campaign');
  };

  const selectedTemplate = templates.find(t => t.id === form.templateId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--bg-card,#0f2744)', border: '1px solid var(--glass-border,rgba(255,255,255,0.1))', borderRadius: 20, width: 700, maxHeight: '92vh', display: 'flex', flexDirection: 'column', color: 'var(--text-primary,#f1f5f9)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>🚀 New Campaign</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[['1', 'Configure'], ['2', 'Select Leads'], ['3', 'Review']].map(([s, label]) => (
            <button key={s} onClick={() => parseInt(s) <= step && setStep(parseInt(s))} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', color: step >= parseInt(s) ? '#6366f1' : 'var(--text-muted,#64748b)', borderBottom: `2px solid ${step === parseInt(s) ? '#6366f1' : 'transparent'}`, cursor: 'pointer', fontSize: '0.82rem', fontWeight: step === parseInt(s) ? 800 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: step >= parseInt(s) ? '#6366f1' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: step >= parseInt(s) ? '#fff' : 'var(--text-muted,#64748b)' }}>{s}</span>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
          {/* Step 1 — Config */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Campaign Name *</label>
                <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Q3 Healthcare Cold Outreach" />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Select Template *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {templates.map(t => {
                    const catColor = CATEGORY_COLORS[t.category] || '#6366f1';
                    return (
                      <div key={t.id} onClick={() => setForm(f => ({ ...f, templateId: t.id }))} style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${form.templateId === t.id ? '#6366f1' : 'rgba(255,255,255,0.07)'}`, background: form.templateId === t.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 3 }}>{t.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)' }}>Subject: {t.subject.substring(0, 60)}…</div>
                          </div>
                          <span style={{ background: catColor + '22', color: catColor, borderRadius: 100, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{t.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Tone</label>
                  <select style={inp} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                    {TONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Language</label>
                  <select style={inp} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Sender Name</label>
                  <input style={inp} value={form.senderPersona} onChange={e => setForm(f => ({ ...f, senderPersona: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Schedule (optional — leave blank to send manually)</label>
                <input style={inp} type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Step 2 — Select Leads */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={toggleAll} style={{ ...btn('ghost'), padding: '6px 14px', fontSize: '0.78rem' }}>
                    {selectedLeadIds.length === leads.length ? '☐ Deselect All' : '☑ Select All'}
                  </button>
                  <select style={{ ...inp, width: 'auto', padding: '6px 12px', fontSize: '0.78rem' }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                    <option value="all">All Stages</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 700 }}>
                  {selectedLeadIds.length} selected
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
                {leads.filter(l => l.email).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted,#64748b)', fontSize: '0.85rem' }}>
                    No leads with email addresses found.
                  </div>
                )}
                {leads.filter(l => l.email).map(lead => {
                  const selected = selectedLeadIds.includes(lead.id);
                  return (
                    <div key={lead.id} onClick={() => toggleLead(lead.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1px solid ${selected ? '#6366f1' : 'rgba(255,255,255,0.06)'}`, background: selected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.12s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? '#6366f1' : 'rgba(255,255,255,0.2)'}`, background: selected ? '#6366f1' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selected && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{lead.name}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted,#64748b)' }}>{lead.email} · {lead.company || '—'} · {lead.industry || '—'}</div>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted,#64748b)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 100 }}>{lead.pipelineStage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 18 }}>
                <h4 style={{ margin: '0 0 12px', fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>Campaign Summary</h4>
                {[
                  ['Name', form.name],
                  ['Template', selectedTemplate?.name],
                  ['Tone', form.tone],
                  ['Language', form.language],
                  ['Sender', form.senderPersona],
                  ['Schedule', form.scheduledAt || 'Manual (launch later)'],
                  ['Leads Selected', `${selectedLeadIds.length} leads`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted,#64748b)', width: 120, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

              {selectedTemplate && (
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)', fontWeight: 600, marginBottom: 8 }}>Template Preview (Gemini will personalize for each lead)</div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.85rem' }}>📧 {selectedTemplate.subject}</div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.78rem', color: 'var(--text-muted,#94a3b8)', fontFamily: 'inherit', lineHeight: 1.6, maxHeight: 160, overflowY: 'auto' }}>
                      {selectedTemplate.body}
                    </pre>
                  </div>
                </div>
              )}

              {error && <div style={{ color: '#f87171', fontSize: '0.82rem' }}>⚠️ {error}</div>}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} style={{ ...btn('ghost'), padding: '9px 20px' }}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!form.name || !form.templateId)} style={{ ...btn(), padding: '9px 24px', opacity: step === 1 && (!form.name || !form.templateId) ? 0.5 : 1 }}>
              Next → 
            </button>
          ) : (
            <button onClick={handleCreate} disabled={creating} style={{ ...btn(), padding: '9px 24px' }}>
              {creating ? '⏳ Creating…' : '✅ Create Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   EMAIL LOG DRAWER
══════════════════════════════════════════════════════════════════════ */
function LogPreviewDrawer({ log, onClose }) {
  if (!log) return null;
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, background: 'var(--bg-card,#0f2744)', borderLeft: '1px solid var(--glass-border,rgba(255,255,255,0.08))', boxShadow: '-16px 0 60px rgba(0,0,0,0.5)', zIndex: 8000, overflowY: 'auto', color: 'var(--text-primary,#f1f5f9)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 4 }}>📧 Email Preview</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)' }}>To: {log.to_name} &lt;{log.to_email}&gt;</div>
          {log.campaign_name && <div style={{ fontSize: '0.73rem', color: '#6366f1', marginTop: 2 }}>Campaign: {log.campaign_name}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted,#64748b)', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ padding: 24, flex: 1 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted,#64748b)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Subject</div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{log.subject}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted,#64748b)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Email Body</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: 'var(--text-muted,#94a3b8)', fontFamily: 'inherit', lineHeight: 1.7 }}>{log.body}</pre>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Status', log.status === 'sent' ? '✅ Sent' : '❌ Failed'],
            ['Sent At', new Date(log.sent_at).toLocaleString()],
            ['Opened', log.opened_at ? new Date(log.opened_at).toLocaleString() : 'Not tracked'],
            ['Replied', log.replied_at ? new Date(log.replied_at).toLocaleString() : 'No reply tracked'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted,#64748b)', fontWeight: 700, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {log.ai_prompt && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>✨ AI Prompt Used</div>
            <pre style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: 12, fontSize: '0.7rem', color: 'var(--text-muted,#64748b)', fontFamily: 'inherit', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', margin: 0 }}>{log.ai_prompt}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function EmailBot({ user }) {
  const token = localStorage.getItem('seevora_token') || '';
  const [activeTab, setActiveTab] = useState('campaigns');
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [launching, setLaunching] = useState(null);
  const [launchResult, setLaunchResult] = useState({});

  const fetchAll = useCallback(async () => {
    const [tmplRes, campRes, logRes] = await Promise.all([
      API('/email-bot/templates', token),
      API('/email-bot/campaigns', token),
      API('/email-bot/logs?limit=50', token),
    ]);
    if (tmplRes.templates) setTemplates(tmplRes.templates);
    if (campRes.campaigns) setCampaigns(campRes.campaigns);
    if (logRes.logs) { setLogs(logRes.logs); setTotalLogs(logRes.total); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLaunch = async (campaignId) => {
    setLaunching(campaignId);
    const res = await API(`/email-bot/campaigns/${campaignId}/launch`, token, { method: 'POST' });
    setLaunching(null);
    setLaunchResult(prev => ({ ...prev, [campaignId]: res.message }));
    // Refresh after a moment
    setTimeout(fetchAll, 2000);
  };

  const handleTemplateDelete = async (id) => {
    if (!window.confirm('Deactivate this template?')) return;
    await API(`/email-bot/templates/${id}`, token, { method: 'DELETE' });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Stats from logs
  const sentCount = logs.filter(l => l.status === 'sent').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'launched').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;

  const TABS = [
    { id: 'campaigns', label: '🚀 Campaigns' },
    { id: 'templates', label: '📋 Templates' },
    { id: 'logs', label: `📊 Email Logs ${totalLogs > 0 ? `(${totalLogs})` : ''}` },
  ];

  return (
    <div style={{ color: 'var(--text-primary,#f1f5f9)', fontFamily: "'Inter',sans-serif", height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.5rem' }}>⚡ Email Marketing Bot</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted,#64748b)' }}>AI-powered outbound email engine for CRM leads</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setEditingTemplate(null); setShowTemplateEditor(true); }} style={{ ...btn('ghost'), padding: '9px 18px' }}>+ Template</button>
          <button onClick={() => setShowCampaignBuilder(true)} style={{ ...btn(), padding: '9px 18px' }}>🚀 New Campaign</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatPill icon="📧" label="Total Emails Sent" value={sentCount} color="#6366f1" />
        <StatPill icon="🚀" label="Active Campaigns" value={activeCampaigns} color="#f59e0b" />
        <StatPill icon="✅" label="Completed Campaigns" value={completedCampaigns} color="#10b981" />
        <StatPill icon="📋" label="Templates Available" value={templates.length} color="#8b5cf6" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 20px', border: 'none', background: 'none', color: activeTab === tab.id ? '#6366f1' : 'var(--text-muted,#64748b)', borderBottom: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`, cursor: 'pointer', fontWeight: activeTab === tab.id ? 800 : 500, fontSize: '0.85rem', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted,#64748b)' }}>Loading…</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── CAMPAIGNS ── */}
          {activeTab === 'campaigns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {campaigns.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted,#64748b)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>No campaigns yet</div>
                  <div style={{ fontSize: '0.85rem' }}>Create your first campaign to start sending AI-personalized outbound emails</div>
                </div>
              )}
              {campaigns.map(c => {
                const statusColor = { draft: '#6b7280', launched: '#f59e0b', completed: '#10b981', failed: '#ef4444' }[c.status] || '#6b7280';
                const total = parseInt(c.total_leads_actual) || 0;
                const delivered = parseInt(c.delivered) || 0;
                const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

                return (
                  <Card key={c.id} style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{c.name}</span>
                          <span style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 100, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>{c.status}</span>
                        </div>
                        {c.template_name && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted,#64748b)', marginBottom: 8 }}>📋 {c.template_name} · {c.tone} · {c.language}</div>}
                        {/* Progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 100, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted,#64748b)', flexShrink: 0 }}>{delivered}/{total} sent</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                          {[
                            ['Total', total, '#6366f1'],
                            ['Sent', delivered, '#10b981'],
                            ['Failed', parseInt(c.failed) || 0, '#ef4444'],
                          ].map(([label, val, color]) => (
                            <div key={label} style={{ fontSize: '0.75rem', color: 'var(--text-muted,#64748b)' }}>
                              <span style={{ color, fontWeight: 700 }}>{val}</span> {label}
                            </div>
                          ))}
                          {c.scheduled_at && <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>🕒 {new Date(c.scheduled_at).toLocaleString()}</div>}
                        </div>
                        {launchResult[c.id] && <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: 8 }}>✅ {launchResult[c.id]}</div>}
                      </div>

                      {(c.status === 'draft' || c.status === 'launching') && (
                        <button onClick={() => handleLaunch(c.id)} disabled={launching === c.id} style={{ ...btn(), padding: '10px 20px', flexShrink: 0, opacity: launching === c.id ? 0.7 : 1 }}>
                          {launching === c.id ? '⏳ Launching…' : '🚀 Launch'}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── TEMPLATES ── */}
          {activeTab === 'templates' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
              {templates.map(t => {
                const catColor = CATEGORY_COLORS[t.category] || '#6366f1';
                return (
                  <Card key={t.id} style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ background: catColor + '22', color: catColor, border: `1px solid ${catColor}44`, borderRadius: 100, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 700 }}>{t.category}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingTemplate(t); setShowTemplateEditor(true); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'var(--text-muted,#64748b)', cursor: 'pointer', fontSize: '0.72rem' }}>✏️ Edit</button>
                        <button onClick={() => handleTemplateDelete(t.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.72rem' }}>🗑</button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 6 }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6366f1', marginBottom: 8 }}>📧 {t.subject}</div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: 'var(--text-muted,#64748b)', fontFamily: 'inherit', lineHeight: 1.6, maxHeight: 100, overflowY: 'auto' }}>{t.body.substring(0, 200)}…</pre>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted,#64748b)' }}>
                      <span>💼 {t.tone}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </Card>
                );
              })}
              {templates.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted,#64748b)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
                  <div style={{ fontWeight: 700 }}>No templates yet</div>
                  <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Create your first email template to get started</div>
                </div>
              )}
            </div>
          )}

          {/* ── LOGS ── */}
          {activeTab === 'logs' && (
            <div>
              <div style={{ marginBottom: 14, fontSize: '0.82rem', color: 'var(--text-muted,#64748b)' }}>
                Showing {logs.length} of {totalLogs} emails · Click any row to preview the full email
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Recipient', 'Subject', 'Campaign', 'Status', 'AI', 'Sent At'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted,#64748b)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted,#64748b)' }}>No emails sent yet</td></tr>
                    )}
                    {logs.map(log => (
                      <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontWeight: 700 }}>{log.to_name || log.to_email}</div>
                          {log.lead_company && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted,#64748b)' }}>{log.lead_company}</div>}
                        </td>
                        <td style={{ padding: '11px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted,#94a3b8)' }}>{log.subject}</td>
                        <td style={{ padding: '11px 14px', color: 'var(--text-muted,#64748b)', fontSize: '0.78rem' }}>{log.campaign_name || 'Single Send'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ color: log.status === 'sent' ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '0.78rem' }}>
                            {log.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ color: log.ai_prompt ? '#8b5cf6' : 'var(--text-muted,#475569)', fontSize: '0.78rem', fontWeight: 600 }}>
                            {log.ai_prompt ? '✨ AI' : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: 'var(--text-muted,#64748b)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      {showTemplateEditor && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => { setShowTemplateEditor(false); setEditingTemplate(null); }}
          onSave={tmpl => setTemplates(prev => editingTemplate ? prev.map(t => t.id === tmpl.id ? tmpl : t) : [tmpl, ...prev])}
          token={token}
        />
      )}
      {showCampaignBuilder && (
        <CampaignBuilder
          templates={templates}
          token={token}
          onClose={() => setShowCampaignBuilder(false)}
          onCreated={camp => setCampaigns(prev => [camp, ...prev])}
        />
      )}
      {selectedLog && <LogPreviewDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
