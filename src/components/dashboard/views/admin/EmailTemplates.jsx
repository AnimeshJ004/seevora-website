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

const CATEGORIES = ['outbound', 'follow-up', 'newsletter', 'welcome', 'promotional', 'announcement'];
const TONES = ['professional', 'friendly', 'urgent', 'casual'];

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

export default function EmailTemplates() {
  const token = localStorage.getItem('seevoraAuthToken') || localStorage.getItem('seevora_token') || '';
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', category: 'outbound', subject: '', body: '', tone: 'professional' });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API('/templates', token);
      if (res.templates) setTemplates(res.templates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      setError('Template name, subject, and body are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await API('/templates', token, {
        method: 'POST',
        body: JSON.stringify({ ...formData, variables: ['name', 'company', 'industry', 'sender_name'] }),
      });

      if (res.template) {
        setTemplates(prev => [res.template, ...prev]);
        setShowAdd(false);
        setFormData({ name: '', category: 'outbound', subject: '', body: '', tone: 'professional' });
      }
    } catch (err) {
      setError(err.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      const res = await API(`/templates/${id}`, token, { method: 'DELETE' });
      if (res.message?.includes('deleted')) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete template');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.6rem' }}>Email Templates</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Design and manage reusable templates for personalized outbound CRM emails and campaigns.</p>
        </div>
        <button onClick={() => { setError(''); setShowAdd(true); }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+ New Template</button>
      </div>

      {error && !showAdd && <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b', gridColumn: '1/-1' }}>Loading templates...</div>
        ) : (
          templates.map(t => (
            <div key={t.id} style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(15,23,42,0.05)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700, background: '#eef2ff', color: '#4f46e5', textTransform: 'uppercase' }}>{t.category}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Tone: {t.tone}</span>
                </div>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '1rem', fontFamily: "'Outfit', sans-serif", color: '#0f172a' }}>{t.name}</h3>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic', marginBottom: 8 }}>Sub: {t.subject}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'pre-wrap', maxHeight: 110, overflowY: 'auto', background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                  {t.body.length > 180 ? t.body.slice(0, 180) + '...' : t.body}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button onClick={() => handleDelete(t.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)', padding: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: 10, padding: 24, width: 620, color: '#0f172a', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(15,23,42,0.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.15rem' }}>Create Template</h3>
              <button type="button" onClick={() => setShowAdd(false)} style={{ border: '1px solid #dbe3ef', background: '#ffffff', color: '#64748b', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}>Close</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'grid', gap: 5, fontWeight: 700 }}>
                  Template Name *
                  <input placeholder="E.g. Cold Outreach" required style={lightInput} value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                </label>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'grid', gap: 5, fontWeight: 700 }}>
                  Category
                  <select style={lightInput} value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>

              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'grid', gap: 5, fontWeight: 700 }}>
                Email Subject Line *
                <input placeholder="Transforming {{industry}} with AI automation" required style={lightInput} value={formData.subject} onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))} />
              </label>

              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'grid', gap: 5, fontWeight: 700 }}>
                Body Content *
                <textarea placeholder="Hi {{name}},\n\nI was looking at {{company}}..." required style={{ ...lightInput, height: 180, resize: 'vertical' }} value={formData.body} onChange={e => setFormData(f => ({ ...f, body: e.target.value }))} />
              </label>

              <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', padding: 12, borderRadius: 8, fontSize: '0.75rem', color: '#334155' }}>
                <strong>Variables:</strong> Use <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code>, <code>{"{{industry}}"}</code>, and <code>{"{{sender_name}}"}</code> to personalize emails.
              </div>

              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'grid', gap: 5, fontWeight: 700, maxWidth: 260 }}>
                Tone
                <select style={lightInput} value={formData.tone} onChange={e => setFormData(f => ({ ...f, tone: e.target.value }))}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              {error && <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, fontSize: 13 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #dbe3ef', background: '#ffffff', color: '#334155', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 800, opacity: saving ? 0.75 : 1 }}>{saving ? 'Saving...' : 'Save Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

