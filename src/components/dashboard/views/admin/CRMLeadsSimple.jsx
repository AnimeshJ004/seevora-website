import React, { useCallback, useEffect, useMemo, useState } from 'react';

const STAGES = [
  { id: 'new', label: 'New', color: '#4f46e5' },
  { id: 'contacted', label: 'Contacted', color: '#d97706' },
  { id: 'qualified', label: 'Qualified', color: '#2563eb' },
  { id: 'proposal', label: 'Proposal', color: '#7c3aed' },
  { id: 'closed', label: 'Closed Won', color: '#059669' },
];

const INDUSTRIES = ['Healthcare', 'Education', 'Fitness', 'Legal', 'Real Estate', 'Diagnostics', 'Wellness', 'Finance', 'Retail', 'Technology', 'Other'];
const SOURCES = ['manual', 'website', 'audit_request', 'referral', 'social_media', 'cold_outreach', 'import', 'whatsapp'];

const theme = {
  page: '#f8fafc',
  card: '#ffffff',
  border: '#dbe3ef',
  text: '#0f172a',
  muted: '#64748b',
  soft: '#f1f5f9',
  primary: '#4f46e5',
  count: '#dc2626',
};

function request(path, token, opts = {}) {
  return fetch(`/api${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  });
}

function getToken(user) {
  return user?.token || localStorage.getItem('seevoraAuthToken') || localStorage.getItem('seevora_token') || '';
}

function stageFor(id) {
  return STAGES.find((stage) => stage.id === id) || STAGES[0];
}

function leadTemperature(score = 0) {
  if (Number(score) >= 70) return { label: 'Hot', color: '#dc2626' };
  if (Number(score) >= 40) return { label: 'Warm', color: '#d97706' };
  return { label: 'Cold', color: '#64748b' };
}

function formatDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatReadableDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isFollowUpDue(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}

function tomorrowAtTen() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function whatsappLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

function StageBadge({ stageId }) {
  const stage = stageFor(stageId);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '4px 10px', background: `${stage.color}14`, color: stage.color, fontSize: 12, fontWeight: 700 }}>
      {stage.label}
    </span>
  );
}

function ScoreBadge({ score = 0 }) {
  const temp = leadTemperature(score);
  return (
    <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 22, whiteSpace: 'nowrap', borderRadius: 999, padding: '3px 9px', background: `${temp.color}14`, color: temp.color, border: `1px solid ${temp.color}33`, fontSize: 12, lineHeight: 1, fontWeight: 700 }}>
      {temp.label} {score}
    </span>
  );
}

function EmptyState({ children }) {
  return <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', padding: '24px 8px' }}>{children}</div>;
}

function LeadCard({ lead, onOpen, onMove }) {
  const stage = stageFor(lead.pipelineStage);
  const stageIndex = STAGES.findIndex((item) => item.id === stage.id);

  return (
    <div
      onClick={() => onOpen(lead)}
      style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 14, cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,23,42,0.05)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: theme.text, fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
          <div style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>{lead.company || 'No company'}</div>
        </div>
        <ScoreBadge score={lead.score} />
      </div>
      <div style={{ color: theme.muted, fontSize: 12, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {lead.email || lead.phone || 'No contact details'}
      </div>
      {lead.nextFollowUpAt && (
        <div style={{ color: isFollowUpDue(lead.nextFollowUpAt) ? theme.count : theme.muted, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
          Follow-up: {formatReadableDate(lead.nextFollowUpAt)}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onMove(lead, STAGES[Math.max(0, stageIndex - 1)].id);
          }}
          disabled={stageIndex <= 0}
          style={smallButton(stageIndex <= 0)}
        >
          Back
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onMove(lead, STAGES[Math.min(STAGES.length - 1, stageIndex + 1)].id);
          }}
          disabled={stageIndex >= STAGES.length - 1}
          style={smallButton(stageIndex >= STAGES.length - 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function smallButton(disabled = false) {
  return {
    border: `1px solid ${theme.border}`,
    background: disabled ? '#f8fafc' : '#ffffff',
    color: disabled ? '#cbd5e1' : theme.text,
    borderRadius: 6,
    padding: '5px 9px',
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function AddLeadModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', industry: '', designation: '', source: 'manual', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      setError('Lead name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await request('/leads', token, { method: 'POST', body: JSON.stringify(form) });
      onCreated(result.lead);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: 18 }}>Add Lead</h3>
          <button onClick={onClose} style={iconButtonStyle}>Close</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Name *" value={form.name} onChange={(value) => update('name', value)} />
          <Field label="Email" value={form.email} onChange={(value) => update('email', value)} />
          <Field label="Phone" value={form.phone} onChange={(value) => update('phone', value)} />
          <Field label="Company" value={form.company} onChange={(value) => update('company', value)} />
          <Field label="Designation" value={form.designation} onChange={(value) => update('designation', value)} />
          <SelectField label="Industry" value={form.industry} onChange={(value) => update('industry', value)} options={['', ...INDUSTRIES]} />
          <SelectField label="Source" value={form.source} onChange={(value) => update('source', value)} options={SOURCES} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Notes" value={form.notes} onChange={(value) => update('notes', value)} multiline />
        </div>
        {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
          <button onClick={save} disabled={saving} style={primaryButtonStyle}>{saving ? 'Saving...' : 'Add Lead'}</button>
        </div>
      </div>
    </div>
  );
}

function LeadDrawer({ lead, token, onClose, onUpdated }) {
  const [form, setForm] = useState({
    pipelineStage: lead.pipelineStage || 'new',
    score: lead.score || 0,
    nextFollowUpAt: formatDateTimeLocal(lead.nextFollowUpAt),
    notes: lead.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await request(`/leads/${lead.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          score: Number(form.score),
          nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : null,
        }),
      });
      onUpdated(result.lead);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const scheduleAppointment = async () => {
    setSaving(true);
    setError('');
    setActionMessage('');
    try {
      const result = await request('/appointments', token, {
        method: 'POST',
        body: JSON.stringify({
          client_name: lead.name,
          client_email: lead.email || '',
          client_phone: lead.phone || '',
          scheduled_at: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : tomorrowAtTen(),
          duration: 30,
          notes: `Created from CRM lead: ${lead.name}`,
        }),
      });
      setActionMessage(`Appointment scheduled for ${formatReadableDate(result.scheduled_at)}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const mailHref = lead.email
    ? `mailto:${lead.email}?subject=${encodeURIComponent('Following up from Seevora')}&body=${encodeURIComponent(`Hi ${lead.name},\n\nI wanted to follow up with you.\n\nRegards,\nSeevora Team`)}`
    : '';
  const whatsAppHref = whatsappLink(lead.phone);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.2)', pointerEvents: 'auto' }} onClick={onClose} />
      <aside style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100%', background: theme.card, borderLeft: `1px solid ${theme.border}`, boxShadow: '-20px 0 50px rgba(15,23,42,0.16)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={modalHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, color: theme.text, fontSize: 18 }}>{lead.name}</h3>
            <p style={{ margin: '4px 0 0', color: theme.muted, fontSize: 13 }}>{lead.company || 'No company'} | {lead.designation || 'No designation'}</p>
          </div>
          <button onClick={onClose} style={iconButtonStyle}>Close</button>
        </div>
        <div style={{ padding: 20, display: 'grid', gap: 16, overflowY: 'auto' }}>
          <Info label="Email" value={lead.email} />
          <Info label="Phone" value={lead.phone} />
          <Info label="Industry" value={lead.industry} />
          <Info label="Source" value={lead.source} />
          <Info label="Last Contacted" value={formatReadableDate(lead.lastContactedAt) || '-'} />
          <SelectField label="Pipeline Stage" value={form.pipelineStage} onChange={(value) => setForm((current) => ({ ...current, pipelineStage: value }))} options={STAGES.map((stage) => stage.id)} labels={Object.fromEntries(STAGES.map((stage) => [stage.id, stage.label]))} />
          <Field label={`Lead Score: ${form.score}`} type="range" value={form.score} onChange={(value) => setForm((current) => ({ ...current, score: value }))} />
          <Field label="Next Follow-up" type="datetime-local" value={form.nextFollowUpAt} onChange={(value) => setForm((current) => ({ ...current, nextFollowUpAt: value }))} />
          <Field label="Notes" value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} multiline />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <a href={mailHref || undefined} style={{ ...secondaryButtonStyle, textAlign: 'center', textDecoration: 'none', opacity: mailHref ? 1 : 0.5, pointerEvents: mailHref ? 'auto' : 'none' }}>Email</a>
            <a href={whatsAppHref || undefined} target="_blank" rel="noreferrer" style={{ ...secondaryButtonStyle, textAlign: 'center', textDecoration: 'none', opacity: whatsAppHref ? 1 : 0.5, pointerEvents: whatsAppHref ? 'auto' : 'none' }}>WhatsApp</a>
            <button onClick={scheduleAppointment} disabled={saving} style={secondaryButtonStyle}>Appointment</button>
          </div>
          {actionMessage && <div style={{ color: '#059669', fontSize: 13, fontWeight: 700 }}>{actionMessage}</div>}
          {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
        </div>
        <div style={{ marginTop: 'auto', padding: 20, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={saving} style={{ ...primaryButtonStyle, width: '100%' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, type = 'text' }) {
  return (
    <label style={{ display: 'grid', gap: 6, color: theme.text, fontSize: 13, fontWeight: 700 }}>
      {label}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
      ) : (
        <input type={type} min={type === 'range' ? 0 : undefined} max={type === 'range' ? 100 : undefined} value={value} onChange={(event) => onChange(event.target.value)} style={type === 'range' ? { width: '100%', accentColor: theme.primary } : inputStyle} />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options, labels = {} }) {
  return (
    <label style={{ display: 'grid', gap: 6, color: theme.text, fontSize: 13, fontWeight: 700 }}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {options.map((option) => (
          <option key={option || 'blank'} value={option}>
            {labels[option] || (option ? option.replace(/_/g, ' ') : 'Select')}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ color: theme.muted, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color: theme.text, fontSize: 14 }}>{value || '-'}</div>
    </div>
  );
}

const inputStyle = {
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: '9px 11px',
  color: theme.text,
  background: '#ffffff',
  outline: 'none',
  fontSize: 14,
  boxSizing: 'border-box',
  width: '100%',
};

const primaryButtonStyle = {
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  background: theme.primary,
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 800,
};

const secondaryButtonStyle = {
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: '10px 16px',
  background: '#ffffff',
  color: theme.text,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
};

const iconButtonStyle = {
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: '7px 10px',
  background: '#ffffff',
  color: theme.muted,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 800,
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.35)',
  zIndex: 9000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalStyle = {
  width: 560,
  maxWidth: '100%',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: theme.card,
  border: `1px solid ${theme.border}`,
  borderRadius: 10,
  boxShadow: '0 24px 80px rgba(15,23,42,0.2)',
  padding: 20,
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: 20,
  borderBottom: `1px solid ${theme.border}`,
};

export default function CRMLeadsSimple({ user }) {
  const token = getToken(user);
  const [leads, setLeads] = useState([]);
  const [auditRequests, setAuditRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const result = await request(`/leads${query}`, token);
      setLeads(result.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  const loadAuditRequests = useCallback(async () => {
    try {
      const result = await request('/audit-requests', token);
      setAuditRequests((result.requests || []).filter((item) => item.status === 'new' || item.status === 'user_replied').slice(0, 4));
    } catch {
      setAuditRequests([]);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(loadLeads, 250);
    return () => window.clearTimeout(timer);
  }, [loadLeads]);

  useEffect(() => {
    loadAuditRequests();
  }, [loadAuditRequests]);

  const grouped = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = leads.filter((lead) => (lead.pipelineStage || 'new') === stage.id);
      return acc;
    }, {});
  }, [leads]);

  const summary = useMemo(() => {
    return [
      { label: 'Total Leads', value: leads.length },
      { label: 'New Leads', value: grouped.new?.length || 0 },
      { label: 'Hot Leads', value: leads.filter((lead) => Number(lead.score) >= 70).length },
      { label: 'Follow-ups Due', value: leads.filter((lead) => isFollowUpDue(lead.nextFollowUpAt)).length },
    ];
  }, [grouped, leads]);

  const updateLead = (updated) => {
    setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)));
  };

  const moveLead = async (lead, pipelineStage) => {
    if (lead.pipelineStage === pipelineStage) return;
    try {
      const result = await request(`/leads/${lead.id}`, token, { method: 'PATCH', body: JSON.stringify({ pipelineStage }) });
      updateLead(result.lead);
    } catch (err) {
      setError(err.message);
    }
  };

  const convertAuditRequest = async (requestItem) => {
    try {
      const result = await request(`/audit-requests/${requestItem.id}/convert-to-lead`, token, { method: 'POST' });
      setLeads((current) => {
        const exists = current.some((lead) => lead.id === result.lead.id);
        return exists
          ? current.map((lead) => (lead.id === result.lead.id ? result.lead : lead))
          : [result.lead, ...current];
      });
      setAuditRequests((current) => current.filter((item) => item.id !== requestItem.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: theme.text, background: theme.page, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, color: theme.text, fontSize: 24, fontWeight: 900 }}>CRM Pipeline</h2>
          <p style={{ margin: '5px 0 0', color: theme.muted, fontSize: 13 }}>{leads.length} leads | AI-powered outbound email bot</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads" style={{ ...inputStyle, width: 220 }} />
          <div style={{ display: 'flex', border: `1px solid ${theme.border}`, borderRadius: 8, overflow: 'hidden', background: '#ffffff' }}>
            {[
              ['kanban', 'Kanban'],
              ['list', 'List'],
            ].map(([value, label]) => (
              <button key={value} onClick={() => setViewMode(value)} style={{ border: 'none', padding: '9px 14px', background: viewMode === value ? theme.primary : '#ffffff', color: viewMode === value ? '#ffffff' : theme.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)} style={primaryButtonStyle}>+ Add Lead</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {STAGES.map((stage) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${theme.border}`, background: '#ffffff', borderRadius: 999, padding: '6px 11px' }}>
            <span style={{ color: theme.text, fontSize: 12, fontWeight: 800 }}>{stage.label}</span>
            <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: '#fee2e2', color: theme.count, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{grouped[stage.id]?.length || 0}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        {summary.map((item) => (
          <div key={item.label} style={{ border: `1px solid ${theme.border}`, background: theme.card, borderRadius: 8, padding: 14 }}>
            <div style={{ color: theme.muted, fontSize: 12, fontWeight: 800 }}>{item.label}</div>
            <div style={{ color: item.label === 'Follow-ups Due' ? theme.count : theme.text, fontSize: 24, fontWeight: 900, marginTop: 6 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 }}>{error}</div>}

      <section style={{ border: `1px solid ${theme.border}`, background: theme.card, borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: 15, fontWeight: 900 }}>Audit Requests</h3>
          <span style={{ minWidth: 22, height: 22, borderRadius: 999, background: '#fee2e2', color: theme.count, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
            {auditRequests.length}
          </span>
        </div>
        {auditRequests.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {auditRequests.map((requestItem) => (
              <div key={requestItem.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: 12, background: theme.soft }}>
                <div style={{ color: theme.text, fontSize: 14, fontWeight: 800 }}>{requestItem.name}</div>
                <div style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>{requestItem.company || requestItem.email}</div>
                <div style={{ color: theme.text, fontSize: 12, marginTop: 8, lineHeight: 1.45, maxHeight: 36, overflow: 'hidden' }}>{requestItem.message}</div>
                <button onClick={() => convertAuditRequest(requestItem)} style={{ ...secondaryButtonStyle, width: '100%', marginTop: 10, padding: '8px 10px', fontSize: 12 }}>
                  Convert to Lead
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: theme.muted, fontSize: 13 }}>No new audit requests.</div>
        )}
      </section>

      {loading ? (
        <EmptyState>Loading leads...</EmptyState>
      ) : viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 12, flex: 1, minHeight: 0, overflowX: 'auto' }}>
          {STAGES.map((stage) => (
            <section key={stage.id} style={{ border: `1px solid ${theme.border}`, background: theme.soft, borderRadius: 8, padding: 12, minWidth: 220, display: 'flex', flexDirection: 'column' }}>
              <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}`, paddingBottom: 10, marginBottom: 12 }}>
                <span style={{ color: theme.text, fontSize: 14, fontWeight: 900 }}>{stage.label}</span>
                <span style={{ color: theme.count, background: '#fee2e2', minWidth: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{grouped[stage.id]?.length || 0}</span>
              </header>
              <div style={{ display: 'grid', gap: 10, overflowY: 'auto' }}>
                {grouped[stage.id]?.length ? grouped[stage.id].map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onOpen={setSelectedLead} onMove={moveLead} />
                )) : <EmptyState>No leads</EmptyState>}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div style={{ border: `1px solid ${theme.border}`, background: theme.card, borderRadius: 8, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: theme.soft }}>
                {['Name', 'Company', 'Email', 'Industry', 'Stage', 'Score'].map((header) => (
                  <th key={header} style={{ textAlign: 'left', padding: '12px 14px', color: theme.muted, borderBottom: `1px solid ${theme.border}`, fontSize: 12, textTransform: 'uppercase' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '12px 14px', color: theme.text, fontWeight: 800 }}>{lead.name}</td>
                  <td style={{ padding: '12px 14px', color: theme.muted }}>{lead.company || '-'}</td>
                  <td style={{ padding: '12px 14px', color: theme.muted }}>{lead.email || '-'}</td>
                  <td style={{ padding: '12px 14px', color: theme.muted }}>{lead.industry || '-'}</td>
                  <td style={{ padding: '12px 14px' }}><StageBadge stageId={lead.pipelineStage} /></td>
                  <td style={{ padding: '12px 14px' }}><ScoreBadge score={lead.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length && <EmptyState>No leads found. Add your first lead to get started.</EmptyState>}
        </div>
      )}

      {showAdd && <AddLeadModal token={token} onClose={() => setShowAdd(false)} onCreated={(lead) => setLeads((current) => [lead, ...current])} />}
      {selectedLead && <LeadDrawer lead={selectedLead} token={token} onClose={() => setSelectedLead(null)} onUpdated={updateLead} />}
    </div>
  );
}
