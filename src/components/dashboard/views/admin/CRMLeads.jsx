import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../../auth/api';

const API = async (path, opts = {}) => {
  try {
    const response = await apiFetch(`/api${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { error: data.message || data.error || `Request failed (${response.status})` };
    return data;
  } catch (err) {
    return { error: err.message || 'Network error' };
  }
};

const STAGES = [
  { id: 'new',       label: 'Enquiry',        color: '#6366f1', light: 'rgba(99,102,241,0.12)',  next: 'contacted' },
  { id: 'contacted', label: 'Qualified',       color: '#0ea5e9', light: 'rgba(14,165,233,0.12)', next: 'qualified' },
  { id: 'qualified', label: 'Booked',          color: '#f59e0b', light: 'rgba(245,158,11,0.12)', next: 'proposal'  },
  { id: 'proposal',  label: 'Confirmed Lead',  color: '#10b981', light: 'rgba(16,185,129,0.12)', next: 'closed'    },
  { id: 'closed',    label: 'Client (Paid)',   color: '#a855f7', light: 'rgba(168,85,247,0.12)', next: null        },
];

const INDUSTRIES = ['Healthcare','Education','Fitness','Legal','Real Estate','Diagnostics','Wellness','Finance','Retail','Technology','Other'];
const SOURCES    = ['manual','website','referral','social_media','cold_outreach','import','whatsapp'];
const SOURCE_LABELS = { manual:'Manual', website:'Website', referral:'Referral', social_media:'Meta Ads', cold_outreach:'Cold Outreach', import:'Import', whatsapp:'WhatsApp' };

function getTemp(score) {
  if (score >= 70) return { label: 'Hot',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (score >= 40) return { label: 'Warm', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return               { label: 'Cold', color: '#64748b', bg: 'rgba(100,116,139,0.12)' };
}

function fmt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* ─── ADD LEAD MODAL ─── */
function AddLeadModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', industry:'', designation:'', source:'manual', notes:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    const res = await API('/leads', { method:'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.lead) { onSave(res.lead); onClose(); }
    else setError(res.message || res.error || 'Failed to create lead');
  };

  const inp = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'9px 12px', color:'var(--text-primary,#f1f5f9)', fontSize:'0.85rem', width:'100%', outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:'0.75rem', color:'var(--text-muted,#94a3b8)', fontWeight:700, display:'flex', flexDirection:'column', gap:5 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', padding:20 }}>
      <div style={{ background:'var(--bg-card,#0f2744)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:560, maxHeight:'90vh', overflowY:'auto', color:'var(--text-primary,#f1f5f9)', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h3 style={{ margin:0, fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:'1.15rem' }}>+ Add New Lead</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-muted,#64748b)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:800, fontSize:12 }}>✕ Close</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[['name','Name *'],['email','Email'],['phone','Phone'],['company','Company'],['designation','Designation']].map(([k,label]) => (
            <label key={k} style={lbl}>{label}<input style={inp} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={label} /></label>
          ))}
          <label style={lbl}>Industry
            <select style={inp} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <label style={lbl}>Source
            <select style={inp} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>)}
            </select>
          </label>
        </div>
        <label style={{ ...lbl, marginTop:14 }}>Notes
          <textarea style={{ ...inp, height:80, resize:'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this lead" />
        </label>
        {error && <div style={{ marginTop:12, color:'#f87171', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:10, fontSize:13 }}>{error}</div>}
        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'none', color:'var(--text-primary,#f1f5f9)', cursor:'pointer', fontSize:'0.85rem', fontWeight:700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', cursor:saving?'not-allowed':'pointer', fontWeight:800, fontSize:'0.85rem', opacity:saving?0.75:1 }}>
            {saving ? 'Saving...' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── LEAD DETAIL DRAWER ─── */
function LeadDetailDrawer({ lead, onClose, onUpdate, onQuickEmail }) {
  const [stage, setStage] = useState(lead.pipelineStage);
  const [score, setScore] = useState(lead.score);
  const [notes, setNotes] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await API(`/leads/${lead.id}`, { method:'PATCH', body: JSON.stringify({ pipelineStage:stage, score:parseInt(score), notes }) });
    setSaving(false);
    if (res.lead) onUpdate(res.lead);
  };

  const inp = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'var(--text-primary,#f1f5f9)', fontSize:'0.85rem', width:'100%', outline:'none', boxSizing:'border-box' };
  const temp = getTemp(score);

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:440, background:'var(--bg-card,#0f2744)', borderLeft:'1px solid rgba(255,255,255,0.08)', boxShadow:'-20px 0 80px rgba(0,0,0,0.5)', zIndex:8000, overflowY:'auto', color:'var(--text-primary,#f1f5f9)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg,${getTemp(lead.score).color},${STAGES.find(s=>s.id===lead.pipelineStage)?.color||'#6366f1'})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', fontWeight:900, color:'#fff', flexShrink:0 }}>
            {initials(lead.name)}
          </div>
          <div>
            <h3 style={{ margin:0, fontSize:'1.05rem', fontFamily:"'Outfit',sans-serif", fontWeight:800 }}>{lead.name}</h3>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted,#64748b)', marginTop:2 }}>{lead.company || '–'} {lead.designation ? `· ${lead.designation}` : ''}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-muted,#64748b)', fontSize:'1rem', cursor:'pointer', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>

      <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20, flex:1 }}>
        {/* Contact Info */}
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:16, display:'grid', gap:10 }}>
          {[['📧','Email',lead.email],['📞','Phone',lead.phone],['🏭','Industry',lead.industry],['🔗','Source',SOURCE_LABELS[lead.source]||lead.source]].map(([icon,label,val]) => val ? (
            <div key={label} style={{ display:'flex', gap:10, alignItems:'center', fontSize:'0.82rem' }}>
              <span style={{ fontSize:'0.9rem' }}>{icon}</span>
              <span style={{ color:'var(--text-muted,#64748b)', width:65, flexShrink:0 }}>{label}</span>
              <span style={{ fontWeight:600 }}>{val}</span>
            </div>
          ) : null)}
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'3px 10px', borderRadius:100, background:temp.bg, color:temp.color, border:`1px solid ${temp.color}44` }}>{temp.label}</span>
            {lead.score !== undefined && <span style={{ fontSize:'0.72rem', color:'var(--text-muted,#64748b)' }}>Score: {lead.score}</span>}
          </div>
        </div>

        {/* Stage Selector */}
        <div>
          <label style={{ fontSize:'0.75rem', color:'var(--text-muted,#64748b)', fontWeight:700, display:'block', marginBottom:10 }}>Pipeline Stage</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {STAGES.map(s => (
              <button key={s.id} onClick={() => setStage(s.id)} style={{ padding:'6px 14px', borderRadius:100, border:`1px solid ${stage===s.id ? s.color : 'rgba(255,255,255,0.1)'}`, background:stage===s.id ? s.light : 'none', color:stage===s.id ? s.color : 'var(--text-muted,#64748b)', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, transition:'all 0.15s' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Score Slider */}
        <div>
          <label style={{ fontSize:'0.75rem', color:'var(--text-muted,#64748b)', fontWeight:700, display:'block', marginBottom:8 }}>
            Lead Score: <span style={{ color:temp.color }}>{score} · {temp.label}</span>
          </label>
          <input type="range" min={0} max={100} value={score} onChange={e => setScore(e.target.value)} style={{ width:'100%', accentColor:temp.color }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.68rem', color:'var(--text-muted,#64748b)', marginTop:4 }}>
            <span>Cold (0)</span><span>Warm (50)</span><span>Hot (100)</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize:'0.75rem', color:'var(--text-muted,#64748b)', fontWeight:700, display:'block', marginBottom:8 }}>Notes</label>
          <textarea style={{ ...inp, height:90, resize:'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this lead..." />
        </div>

        {lead.lastContactedAt && (
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted,#64748b)' }}>
            Last contacted: {fmt(lead.lastContactedAt)}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ padding:20, borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={() => onQuickEmail(lead)} style={{ padding:'10px 14px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#14b8a6,#0ea5e9)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          📧 Send AI Email
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary,#f1f5f9)', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
}

/* ─── QUICK EMAIL MODAL ─── */
function QuickEmailModal({ lead, templates, onClose }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [tone, setTone]             = useState('professional');
  const [language, setLanguage]     = useState('english');
  const [senderName, setSenderName] = useState('Seevora Team');
  const [preview, setPreview]       = useState(null);
  const [sending, setSending]       = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult]         = useState(null);

  const inp = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'8px 12px', color:'var(--text-primary,#f1f5f9)', fontSize:'0.85rem', width:'100%', outline:'none', boxSizing:'border-box' };

  const handlePreview = async () => {
    if (!templateId) return;
    setPreviewing(true);
    const res = await API('/email-bot/preview', { method:'POST', body: JSON.stringify({ leadId:lead.id, templateId, tone, language, senderName }) });
    setPreviewing(false);
    if (res.subject) setPreview(res);
  };

  const handleSend = async () => {
    setSending(true);
    const res = await API('/email-bot/send-single', { method:'POST', body: JSON.stringify({ leadId:lead.id, templateId, tone, language, senderName }) });
    setSending(false);
    setResult(res);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)' }}>
      <div style={{ background:'var(--bg-card,#0f2744)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:28, width:640, maxHeight:'90vh', overflowY:'auto', color:'var(--text-primary,#f1f5f9)', boxShadow:'0 40px 100px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h3 style={{ margin:0, fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.1rem' }}>📧 AI Email → {lead.name}</h3>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted,#64748b)', marginTop:3 }}>{lead.email} · {lead.company || 'No company'}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-muted,#64748b)', fontSize:'1rem', cursor:'pointer', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {result ? (
          <div>
            <div style={{ background:result.message?.includes('sent')?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${result.message?.includes('sent')?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ fontWeight:700, color:result.message?.includes('sent')?'#10b981':'#f87171', marginBottom:8 }}>
                {result.message?.includes('sent') ? '✓ Email Sent Successfully!' : '✕ ' + result.message}
              </div>
              {result.aiUsed && <div style={{ fontSize:'0.78rem', color:'var(--text-muted,#64748b)' }}>AI-personalized by OpenAI</div>}
            </div>
            {result.subject && (
              <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:16 }}>
                <div style={{ fontWeight:700, marginBottom:8, fontSize:'0.9rem' }}>Subject: {result.subject}</div>
                <pre style={{ margin:0, whiteSpace:'pre-wrap', fontSize:'0.8rem', color:'var(--text-muted,#94a3b8)', fontFamily:'inherit', lineHeight:1.6 }}>{result.body}</pre>
              </div>
            )}
            <button onClick={onClose} style={{ marginTop:16, padding:'10px 24px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', cursor:'pointer', fontWeight:700 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              {[['Template', <select style={inp} value={templateId} onChange={e=>{setTemplateId(e.target.value);setPreview(null);}}>
                {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>],
              ['Tone', <select style={inp} value={tone} onChange={e=>{setTone(e.target.value);setPreview(null);}}>
                {[['professional','Professional'],['friendly','Friendly'],['urgent','Urgent']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>],
              ['Language', <select style={inp} value={language} onChange={e=>{setLanguage(e.target.value);setPreview(null);}}>
                {[['english','English'],['hindi','Hindi'],['hinglish','Hinglish']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>],
              ['Sender Name', <input style={inp} value={senderName} onChange={e=>{setSenderName(e.target.value);setPreview(null);}} />],
              ].map(([label, el]) => (
                <div key={label}>
                  <label style={{ fontSize:'0.75rem', color:'var(--text-muted,#64748b)', fontWeight:700, display:'block', marginBottom:6 }}>{label}</label>
                  {el}
                </div>
              ))}
            </div>
            {preview && (
              <div style={{ background:'rgba(20,184,166,0.06)', border:'1px solid rgba(20,184,166,0.2)', borderRadius:12, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:'0.72rem', color:'#14b8a6', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  {preview.aiUsed ? '🤖 AI Preview' : '📄 Template Preview'}
                </div>
                <div style={{ fontWeight:700, marginBottom:8, fontSize:'0.88rem' }}>Subject: {preview.subject}</div>
                <pre style={{ margin:0, whiteSpace:'pre-wrap', fontSize:'0.78rem', color:'var(--text-muted,#94a3b8)', fontFamily:'inherit', lineHeight:1.7, maxHeight:200, overflowY:'auto' }}>{preview.body}</pre>
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={handlePreview} disabled={previewing} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.05)', color:'var(--text-primary,#f1f5f9)', cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                {previewing ? 'Generating...' : '👁 Preview'}
              </button>
              <button onClick={handleSend} disabled={sending||!lead.email} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#14b8a6,#0ea5e9)', color:'#fff', cursor:sending||!lead.email?'not-allowed':'pointer', fontWeight:700, fontSize:'0.85rem', opacity:!lead.email?0.5:1 }}>
                {sending ? 'Sending...' : '📤 Send Now'}
              </button>
            </div>
            {!lead.email && <div style={{ fontSize:'0.78rem', color:'#f87171', marginTop:8, textAlign:'right' }}>⚠ This lead has no email address</div>}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── LEAD CARD ─── */
function LeadCard({ lead, stage, onOpen, onQuickEmail, onDelete, onMoveNext }) {
  const [hovering, setHovering] = useState(false);
  const [moving, setMoving]     = useState(false);
  const temp = getTemp(lead.score);
  const nextStage = STAGES.find(s => s.id === stage.next);

  const handleMoveNext = async (e) => {
    e.stopPropagation();
    if (!nextStage || moving) return;
    setMoving(true);
    const res = await API(`/leads/${lead.id}`, { method:'PATCH', body: JSON.stringify({ pipelineStage: nextStage.id }) });
    setMoving(false);
    if (res.lead) onMoveNext(res.lead);
  };

  return (
    <div
      onClick={() => onOpen(lead)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: hovering ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${hovering ? stage.color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderLeft: `3px solid ${stage.color}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        position: 'relative',
        boxShadow: hovering ? `0 4px 20px rgba(0,0,0,0.25)` : 'none',
      }}
    >
      {/* Top row: name + action icons */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flex:1, minWidth:0 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${temp.color},${stage.color})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:900, color:'#fff', flexShrink:0 }}>
            {initials(lead.name)}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary,#f1f5f9)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lead.name}</div>
            {lead.designation && <div style={{ fontSize:'0.72rem', color:'var(--text-muted,#64748b)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lead.designation}</div>}
          </div>
        </div>
        {/* Action icons */}
        <div onClick={e => e.stopPropagation()} style={{ display:'flex', gap:6, flexShrink:0, marginLeft:8 }}>
          <button onClick={() => onQuickEmail(lead)} title="AI Email" style={{ background:'rgba(20,184,166,0.12)', border:'none', borderRadius:6, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.75rem', color:'#14b8a6' }}>✉</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }} title="Delete" style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:6, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.75rem', color:'#ef4444' }}>✕</button>
        </div>
      </div>

      {/* Phone */}
      {lead.phone && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
          <span style={{ fontSize:'0.8rem' }}>📞</span>
          <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary,#e2e8f0)', letterSpacing:'0.02em' }}>{lead.phone}</span>
        </div>
      )}

      {/* Temp + Source row */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'2px 9px', borderRadius:100, background:temp.bg, color:temp.color }}>{temp.label}</span>
        {lead.source && (
          <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#60a5fa' }}>· {SOURCE_LABELS[lead.source] || lead.source}</span>
        )}
      </div>

      {/* Lead notes / company */}
      <div style={{ fontSize:'0.73rem', color:'var(--text-muted,#64748b)', marginBottom:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {lead.notes ? `${lead.notes.slice(0, 52)}${lead.notes.length > 52 ? '…' : ''}` : lead.company ? `Company: ${lead.company}` : 'No notes added'}
        {lead.createdAt && (
          <span style={{ float:'right', color:'var(--text-muted,#475569)', whiteSpace:'nowrap' }}>{fmt(lead.createdAt)}</span>
        )}
      </div>

      {/* Move to next stage button */}
      {nextStage && (
        <button
          onClick={handleMoveNext}
          disabled={moving}
          style={{ width:'100%', padding:'7px', borderRadius:8, border:`1px solid rgba(255,255,255,0.1)`, background:'rgba(255,255,255,0.04)', color:`${nextStage.color}`, cursor:moving?'not-allowed':'pointer', fontWeight:700, fontSize:'0.75rem', textAlign:'center', transition:'all 0.15s', marginTop:4 }}
          onMouseEnter={e => { e.currentTarget.style.background = nextStage.light; e.currentTarget.style.borderColor = nextStage.color + '66'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          {moving ? '…' : `→ ${nextStage.label}`}
        </button>
      )}
    </div>
  );
}

/* ─── KANBAN COLUMN ─── */
function KanbanColumn({ stage, leads, onOpen, onQuickEmail, onDelete, onMoveNext, onAddLead }) {
  return (
    <div style={{ minWidth:280, maxWidth:300, flex:'0 0 280px', display:'flex', flexDirection:'column', gap:0 }}>
      {/* Column header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'rgba(255,255,255,0.03)', borderRadius:'12px 12px 0 0', border:`1px solid rgba(255,255,255,0.08)`, borderBottom:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:stage.color, boxShadow:`0 0 8px ${stage.color}88` }} />
          <span style={{ fontWeight:800, fontSize:'0.92rem', color:'var(--text-primary,#f1f5f9)' }}>{stage.label}</span>
          <span style={{ background:stage.light, color:stage.color, borderRadius:100, padding:'2px 9px', fontSize:'0.72rem', fontWeight:800, border:`1px solid ${stage.color}44` }}>
            {leads.length}
          </span>
        </div>
        <button onClick={onAddLead} title="Add lead" style={{ background:'none', border:'none', color:stage.color, cursor:'pointer', fontSize:'1.1rem', lineHeight:1, padding:0 }}>+</button>
      </div>

      {/* Cards */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, padding:'10px 0', border:'1px solid rgba(255,255,255,0.06)', borderTop:'none', borderRadius:'0 0 12px 12px', paddingInline:0, maxHeight:'calc(100vh - 260px)' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 10px', overflowY:'auto', maxHeight:'calc(100vh - 260px)' }}>
          {leads.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--text-muted,#475569)' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:8, opacity:0.4 }}>📭</div>
              <div style={{ fontSize:'0.78rem' }}>No leads here</div>
            </div>
          ) : (
            leads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                stage={stage}
                onOpen={onOpen}
                onQuickEmail={onQuickEmail}
                onDelete={onDelete}
                onMoveNext={onMoveNext}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function CRMLeads({ user: _user, onNavigate }) {
  const [leads, setLeads]             = useState([]);
  const [templates, setTemplates]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [quickEmailLead, setQuickEmailLead] = useState(null);
  const [search, setSearch]           = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [bulkSendState, setBulkSendState] = useState('idle');
  const [bulkResult, setBulkResult]   = useState(null);
  const [bulkError, setBulkError]     = useState('');
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await API(`/leads${params.toString() ? '?' + params.toString() : ''}`);
    if (res.leads) setLeads(res.leads);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLeads(),
      API('/email-bot/templates').then(r => r.templates && setTemplates(r.templates)),
    ]).finally(() => setLoading(false));
  }, [fetchLeads]);

  const handleLeadUpdate = (updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    if (selectedLead?.id === updated.id) setSelectedLead(updated);
  };

  const handleMoveNext = (updated) => {
    handleLeadUpdate(updated);
    const nextStage = STAGES.find(s => s.id === updated.pipelineStage);
    notify(`${updated.name} moved to ${nextStage?.label || updated.pipelineStage}`);
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm('Delete this lead?')) return;
    const res = await API(`/leads/${leadId}`, { method:'DELETE' });
    if (res.error) { notify(res.error, 'error'); return; }
    setLeads(prev => prev.filter(l => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);
    notify('Lead deleted');
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL leads? This cannot be undone.')) return;
    const res = await API('/leads/all', { method:'DELETE' });
    if (res.error) { notify(res.error, 'error'); return; }
    setLeads([]); setSelectedLead(null);
    notify('All leads deleted');
  };

  const handleBulkSend = async () => {
    const withEmail = leads.filter(l => l.email);
    if (!withEmail.length) { notify('No leads with email addresses.', 'error'); return; }
    if (!window.confirm(`Send personalised AI emails to ${withEmail.length} lead${withEmail.length > 1 ? 's' : ''}?`)) return;
    setBulkSendState('sending'); setBulkResult(null); setBulkError('');
    const res = await API('/leads/bulk-email', { method:'POST', body: JSON.stringify({ leadIds: withEmail.map(l => l.id) }) });
    if (res.error || !res.success) {
      setBulkSendState('error');
      setBulkError(res.error || res.message || 'Bulk send failed.');
      setTimeout(() => { setBulkSendState('idle'); setBulkError(''); }, 6000);
    } else {
      setBulkSendState('done');
      setBulkResult({ sent: res.sent, failed: res.failed });
      setTimeout(() => { setBulkSendState('idle'); setBulkResult(null); }, 6000);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(l => {
    if (sourceFilter && l.source !== sourceFilter) return false;
    return true;
  });

  // Group by stage
  const stageGroups = STAGES.reduce((acc, s) => {
    acc[s.id] = filteredLeads.filter(l => l.pipelineStage === s.id);
    return acc;
  }, {});

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', color:'var(--text-primary,#f1f5f9)', fontFamily:"'Inter',sans-serif", overflow:'hidden' }}>

      {/* ── Toast Notification ── */}
      {notification && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:99999, padding:'12px 20px', borderRadius:10, background:notification.type==='error'?'rgba(239,68,68,0.95)':'rgba(16,185,129,0.95)', color:'#fff', fontWeight:700, fontSize:'0.85rem', boxShadow:'0 8px 30px rgba(0,0,0,0.4)', backdropFilter:'blur(8px)', animation:'fadeInDown 0.2s ease' }}>
          {notification.type==='error' ? '✕ ' : '✓ '}{notification.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <h2 style={{ margin:0, fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:'1.45rem' }}>CRM / Lead Pipeline</h2>
              <span style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'3px 12px', fontSize:'0.75rem', fontWeight:800 }}>
                {leads.length} Total Leads
              </span>
            </div>
            <p style={{ margin:'3px 0 0', fontSize:'0.78rem', color:'var(--text-muted,#64748b)' }}>AI-powered outbound email pipeline</p>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:'0.8rem', color:'var(--text-muted,#475569)' }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone..."
              style={{ padding:'8px 12px 8px 32px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'var(--text-primary,#f1f5f9)', fontSize:'0.82rem', outline:'none', width:210 }}
            />
          </div>

          {/* Source Filter */}
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'var(--text-primary,#f1f5f9)', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}>
            <option value="">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </select>

          {/* Bulk send */}
          <button disabled={bulkSendState!=='idle'} onClick={handleBulkSend}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', cursor:bulkSendState!=='idle'?'not-allowed':'pointer', fontWeight:700, fontSize:'0.82rem', color:'#fff', transition:'all 0.2s',
              background: bulkSendState==='idle'?'rgba(99,102,241,0.8)': bulkSendState==='sending'?'#475569': bulkSendState==='done'?'#10b981':'#ef4444',
              opacity: bulkSendState==='sending'?0.75:1 }}>
            {bulkSendState==='idle'?'📧 Send Mail in Bulk': bulkSendState==='sending'?'📧 Sending…': bulkSendState==='done'?`✓ ${bulkResult?.sent||0} Sent`:'✕ Failed'}
          </button>

          {/* Delete All */}
          {leads.length > 0 && (
            <button onClick={handleDeleteAll} style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(239,68,68,0.25)', background:'rgba(239,68,68,0.08)', color:'#ef4444', cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}>
              🗑 Delete All
            </button>
          )}

          {/* Add Lead */}
          <button onClick={() => setShowAdd(true)} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', cursor:'pointer', fontWeight:800, fontSize:'0.85rem', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
            + Add Lead
          </button>
        </div>
      </div>

      {/* Bulk error */}
      {bulkError && (
        <div style={{ marginBottom:12, padding:'8px 14px', borderRadius:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:'0.8rem', flexShrink:0 }}>✕ {bulkError}</div>
      )}

      {/* ── Kanban Board ── */}
      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted,#64748b)', flexDirection:'column', gap:16 }}>
          <div style={{ width:36, height:36, border:'3px solid rgba(99,102,241,0.3)', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <span style={{ fontSize:'0.85rem' }}>Loading pipeline...</span>
        </div>
      ) : (
        <div style={{ flex:1, overflowX:'auto', overflowY:'hidden', paddingBottom:12 }}>
          <div style={{ display:'flex', gap:14, height:'100%', minWidth:'max-content', alignItems:'flex-start', paddingRight:4 }}>
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={stageGroups[stage.id] || []}
                onOpen={setSelectedLead}
                onQuickEmail={setQuickEmailLead}
                onDelete={handleDelete}
                onMoveNext={handleMoveNext}
                onAddLead={() => setShowAdd(true)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd        && <AddLeadModal onClose={() => setShowAdd(false)} onSave={l => { setLeads(prev => [l, ...prev]); notify(`${l.name} added to pipeline`); }} />}
      {selectedLead   && <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={handleLeadUpdate} onQuickEmail={setQuickEmailLead} />}
      {quickEmailLead && <QuickEmailModal lead={quickEmailLead} templates={templates} onClose={() => setQuickEmailLead(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
