import React, { useState, useEffect, useCallback } from 'react';

const API = (path, token, opts = {}) =>
  fetch(`/api/email-bot${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  }).then(r => r.json());

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won'];

export default function Campaigns() {
  const token = localStorage.getItem('seevoraAuthToken') || localStorage.getItem('seevora_token') || '';
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    status: 'draft',
    scheduledAt: '',
    tone: 'professional',
    language: 'english',
    senderPersona: 'Seevora Sales Team',
    campaignType: 'newsletter',
    targetSegment: 'all', // 'all', 'industry', 'stage'
    segmentValue: '',
    leadIds: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cRes, tRes, lRes] = await Promise.all([
      API('/campaigns', token),
      API('/templates', token),
      fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]);

    if (cRes.campaigns) setCampaigns(cRes.campaigns);
    if (tRes.templates) setTemplates(tRes.templates);
    if (lRes.leads) setLeads(lRes.leads);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.templateId) return;

    // Filter leads based on segments
    let selectedLeadIds = [];
    if (formData.targetSegment === 'all') {
      selectedLeadIds = leads.map(l => l.id);
    } else if (formData.targetSegment === 'stage') {
      selectedLeadIds = leads.filter(l => l.pipelineStage === formData.segmentValue).map(l => l.id);
    } else if (formData.targetSegment === 'industry') {
      selectedLeadIds = leads.filter(l => l.industry?.toLowerCase() === formData.segmentValue.toLowerCase()).map(l => l.id);
    }

    const payload = {
      ...formData,
      status: formData.scheduledAt ? 'scheduled' : 'draft',
      leadIds: selectedLeadIds
    };

    const res = await API('/campaigns', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.campaign) {
      alert(formData.scheduledAt ? 'Campaign scheduled successfully!' : 'Campaign created as draft.');
      setCampaigns(prev => [res.campaign, ...prev]);
      setShowAdd(false);
      setFormData({
        name: '',
        templateId: '',
        status: 'draft',
        scheduledAt: '',
        tone: 'professional',
        language: 'english',
        senderPersona: 'Seevora Sales Team',
        campaignType: 'newsletter',
        targetSegment: 'all',
        segmentValue: '',
        leadIds: []
      });
      fetchData();
    } else {
      alert(res.message || 'Failed to create campaign');
    }
  };

  const handleSendImmediately = async (id) => {
    if (!window.confirm('Send this campaign to all targets immediately?')) return;
    setSendingId(id);
    const res = await API(`/campaigns/${id}/send`, token, { method: 'POST' });
    setSendingId(null);
    alert(res.message || 'Dispatch completed.');
    fetchData();
  };


  const handlePublish = async (id) => {
    if (!window.confirm('Publish this campaign now? Scheduled campaigns will be queued for their delivery time.')) return;
    setSendingId(id);
    const res = await API(`/campaigns/${id}/publish`, token, { method: 'POST' });
    setSendingId(null);
    alert(res.message || 'Publish completed.');
    fetchData();
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    const res = await API(`/campaigns/${id}`, token, { method: 'DELETE' });
    if (res.message?.includes('deleted')) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
    }
  };

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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0f172a' }}>Email Campaigns</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Create, schedule, and launch bulk newsletters and sales sequences.</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+ New Campaign</button>
      </div>

      {/* Campaigns list */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading campaigns...</div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  {['Campaign Name', 'Template', 'Type', 'Status', 'Sent/Failed', 'Scheduled At', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: '#475569', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>{c.template_name || 'No template'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{(c.campaign_type || 'newsletter').replace('_', ' ')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
                        background: c.status === 'completed' ? 'rgba(16,185,129,0.1)' : c.status === 'scheduled' ? 'rgba(59,130,246,0.1)' : '#f1f5f9',
                        color: c.status === 'completed' ? '#10b981' : c.status === 'scheduled' ? '#2563eb' : '#64748b'
                      }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>
                      {c.status === 'completed' ? (
                        <span><strong style={{ color: '#10b981' }}>{c.sent_count}</strong> sent / <span style={{ color: '#ef4444' }}>{c.failed_count}</span> failed</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>{c.total_leads} targets</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : 'Not scheduled'}
                    </td>
                    <td style={{ padding: '12px 14px', display: 'flex', gap: 8 }}>
                      {c.status === 'draft' && (
                        <button disabled={sendingId === c.id} onClick={() => handlePublish(c.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                          {sendingId === c.id ? 'Publishing...' : 'Publish'}
                        </button>
                      )}
                      {c.status !== 'completed' && c.status !== 'sending' && (
                        <button disabled={sendingId === c.id} onClick={() => handleSendImmediately(c.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                          {sendingId === c.id ? 'Sending...' : 'Send Now'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.72rem' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No campaigns created yet.</div>}
          </div>
        )}
      </div>

      {/* Add Campaign Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#0e1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, width: 500, color: '#fff', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: "'Outfit', sans-serif" }}>Create Campaign</h3>
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Campaign Name *</label>
                <input placeholder="E.g. July Newsletter" required style={inp} value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Email Template *</label>
                <select required style={inp} value={formData.templateId} onChange={e => setFormData(f => ({ ...f, templateId: e.target.value }))}>
                  <option value="">Select Template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>


              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Campaign Type</label>
                <select style={inp} value={formData.campaignType} onChange={e => setFormData(f => ({ ...f, campaignType: e.target.value }))}>
                  <option value="newsletter">Newsletter</option>
                  <option value="bulk_email">Bulk Email</option>
                  <option value="promotional">Promotional Email</option>
                  <option value="service_announcement">Service Announcement</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Tone</label>
                  <select style={inp} value={formData.tone} onChange={e => setFormData(f => ({ ...f, tone: e.target.value }))}>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Language</label>
                  <select style={inp} value={formData.language} onChange={e => setFormData(f => ({ ...f, language: e.target.value }))}>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Sender Persona</label>
                <input placeholder="E.g. Seevora Growth Team" style={inp} value={formData.senderPersona} onChange={e => setFormData(f => ({ ...f, senderPersona: e.target.value }))} />
              </div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Audience Segment</label>
                  <select style={inp} value={formData.targetSegment} onChange={e => setFormData(f => ({ ...f, targetSegment: e.target.value, segmentValue: '' }))}>
                    <option value="all">All CRM Contacts ({leads.length})</option>
                    <option value="stage">Pipeline Stage</option>
                  </select>
                </div>
                {formData.targetSegment === 'stage' && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Select Stage</label>
                    <select style={inp} value={formData.segmentValue} onChange={e => setFormData(f => ({ ...f, segmentValue: e.target.value }))}>
                      <option value="">Select Stage</option>
                      {STAGES.map(s => <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 5 }}>Schedule Delivery Time (Optional)</label>
                <input type="datetime-local" style={inp} value={formData.scheduledAt} onChange={e => setFormData(f => ({ ...f, scheduledAt: e.target.value }))} />
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4, display: 'block' }}>Leave empty to send immediately or save as draft.</span>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


