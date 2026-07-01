import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Avatar, Btn, Table, Tabs } from '../shared';
import { hrApiFetch } from './hrApi';

const PIPELINE_STAGES = ['applied', 'screening', 'technical', 'hr_round', 'offer', 'hired'];
const STAGE_COLORS = {
  applied: 'var(--accent-teal, #14c9e1)',
  screening: 'var(--accent-blue, #3b82f6)',
  technical: 'var(--accent-purple, #8b5cf6)',
  hr_round: 'var(--accent-orange, #f97316)',
  offer: 'var(--accent-green, #10b981)',
  hired: 'var(--accent-green, #10b981)',
};
const STAGE_BADGE = {
  applied: 'cyan', screening: 'blue', technical: 'purple',
  hr_round: 'orange', offer: 'green', hired: 'green', rejected: 'pink',
};

export default function Recruitment() {
  const [tab, setTab] = useState('pipeline');
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState({ openPositions: 0, totalApplicants: 0, shortlisted: 0, hired: 0, pipeline: [] });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Job modal
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', department: '', type: 'full-time', experience: '', description: '' });
  const [isSavingJob, setIsSavingJob] = useState(false);

  // Candidate modal
  const [isCandModalOpen, setIsCandModalOpen] = useState(false);
  const [candForm, setCandForm] = useState({ jobId: '', name: '', email: '', phone: '', experience: '', source: 'LinkedIn' });
  const [isSavingCand, setIsSavingCand] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = useCallback(async () => {
    try {
      const [candRes, jobsRes, summaryRes] = await Promise.all([
        hrApiFetch('/api/hr/recruitment/candidates'),
        hrApiFetch('/api/hr/recruitment/jobs'),
        hrApiFetch('/api/hr/recruitment/summary'),
      ]);
      const candData = await candRes.json().catch(() => ({}));
      const jobsData = await jobsRes.json().catch(() => ({}));
      const summaryData = await summaryRes.json().catch(() => ({}));

      if (candRes.ok) setCandidates(candData.candidates || []);
      if (jobsRes.ok) setJobs(jobsData.jobs || []);
      if (summaryRes.ok) setSummary(summaryData);
    } catch {
      showToast('Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePostJob = async () => {
    if (!jobForm.title || !jobForm.department) { showToast('Title and department are required.'); return; }
    setIsSavingJob(true);
    try {
      const res = await hrApiFetch('/api/hr/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Job posted.');
        setIsJobModalOpen(false);
        setJobForm({ title: '', department: '', type: 'full-time', experience: '', description: '' });
        loadData();
      } else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
    finally { setIsSavingJob(false); }
  };

  const handleAddCandidate = async () => {
    if (!candForm.jobId || !candForm.name || !candForm.email) { showToast('Job, name and email are required.'); return; }
    setIsSavingCand(true);
    try {
      const res = await hrApiFetch('/api/hr/recruitment/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Candidate added.');
        setIsCandModalOpen(false);
        setCandForm({ jobId: '', name: '', email: '', phone: '', experience: '', source: 'LinkedIn' });
        loadData();
      } else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
    finally { setIsSavingCand(false); }
  };

  const handleMoveStage = async (candidateId, currentStage) => {
    const idx = PIPELINE_STAGES.indexOf(currentStage);
    if (idx === -1 || idx >= PIPELINE_STAGES.length - 1) { showToast('Candidate is at the final stage.'); return; }
    const nextStage = PIPELINE_STAGES[idx + 1];
    try {
      const res = await hrApiFetch(`/api/hr/recruitment/candidates/${candidateId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || `Moved to ${nextStage}.`); loadData(); }
      else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
  };

  const handleCloseJob = async (jobId) => {
    try {
      const res = await hrApiFetch(`/api/hr/recruitment/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Job closed.'); loadData(); }
      else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
  };

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  const pipelineData = PIPELINE_STAGES.map(stage => {
    const found = summary.pipeline?.find(p => p.stageKey === stage);
    return { stage: stage.replace(/_/g, ' '), stageKey: stage, count: found?.count || 0, color: STAGE_COLORS[stage] };
  });
  const maxPipelineCount = Math.max(...pipelineData.map(p => p.count), 1);

  const stats = [
    { label: 'Open Positions', value: summary.openPositions, color: 'cyan' },
    { label: 'Total Applicants', value: summary.totalApplicants, color: 'purple' },
    { label: 'Shortlisted', value: summary.shortlisted, color: 'orange' },
    { label: 'Hired', value: summary.hired, color: 'green' },
  ];

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid var(--glass-border)',
    borderRadius: 10, fontSize: '0.85rem', background: 'var(--bg-space)',
    color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  };

  const posted = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', zIndex: 9999, boxShadow: '0 8px 24px rgba(16,185,129,0.3)', maxWidth: 380 }}>{toast}</div>
      )}

      <PageHeader title="Recruitment" sub="Track candidates and open positions" action="+ Post Job" onAction={() => setIsJobModalOpen(true)} />
      <StatsGrid stats={stats} />

      {/* Pipeline Funnel */}
      <Panel title="Hiring Pipeline" meta="Active roles" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
          {pipelineData.map(p => (
            <div key={p.stageKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.count}</div>
              <div style={{ width: '100%', height: `${(p.count / maxPipelineCount) * 60}px`, background: p.color, borderRadius: '4px 4px 0 0', opacity: 0.75, minHeight: 2 }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', textTransform: 'capitalize' }}>{p.stage}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <Tabs
          tabs={[
            { id: 'pipeline', label: 'Candidates' },
            { id: 'jobs', label: 'Job Openings' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'pipeline' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <FilterBar onSearch={setSearch} />
              <Btn label="+ Add Candidate" size="sm" onClick={() => setIsCandModalOpen(true)} />
            </div>
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>Loading…</p>
            ) : filteredCandidates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>No candidates found. Post a job and add candidates.</p>
            ) : (
              <Table
                cols={['Candidate', 'Role', 'Experience', 'Source', 'Applied', 'Current Round', 'Status', 'Actions']}
                rows={filteredCandidates.map(c => [
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={c.name} gradient="linear-gradient(135deg,#9e3cec,#3b82f6)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                  </div>,
                  <span style={{ fontWeight: 500 }}>{c.role}</span>,
                  c.exp,
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.source}</span>,
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.applied ? new Date(c.applied).toLocaleDateString('en-IN') : ''}</span>,
                  <span style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{c.round}</span>,
                  <Badge label={c.stage.replace(/_/g, ' ').toUpperCase()} color={STAGE_BADGE[c.stage] || 'gray'} />,
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn label="View" variant="ghost" size="sm" />
                    {c.stage !== 'hired' && c.stage !== 'rejected' && (
                      <Btn label="Move Stage" size="sm" onClick={() => handleMoveStage(c.id, c.stage)} />
                    )}
                  </div>,
                ])}
              />
            )}
          </>
        )}

        {tab === 'jobs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {jobs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40, gridColumn: '1/-1' }}>No job openings yet. Click "+ Post Job" to create one.</p>
            ) : jobs.map(j => (
              <div key={j.id} style={{ border: '1px solid var(--glass-border)', borderRadius: 12, padding: 18, background: 'var(--bg-card)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>{j.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>{j.department} · {j.type} · {j.experience}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-teal)' }}>{j.applicants} applicants</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{posted(j.posted)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge label={j.status.toUpperCase()} color={j.status === 'open' ? 'green' : 'gray'} />
                  {j.status === 'open' && <Btn label="Close" variant="danger" size="sm" onClick={() => handleCloseJob(j.id)} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Post Job Modal */}
      {isJobModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsJobModalOpen(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 440, maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 20 }}>Post New Job</h3>

            {[
              { label: 'Job Title *', key: 'title', placeholder: 'e.g. Full Stack Developer' },
              { label: 'Department *', key: 'department', placeholder: 'e.g. Engineering' },
              { label: 'Experience', key: 'experience', placeholder: 'e.g. 3-5 yrs' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{f.label}</label>
                <input value={jobForm[f.key]} onChange={e => setJobForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Type</label>
              <select value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Description</label>
              <textarea value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Job description..." />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn label={isSavingJob ? 'Posting…' : 'Post Job'} onClick={handlePostJob} />
              <Btn label="Cancel" variant="ghost" onClick={() => setIsJobModalOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {isCandModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsCandModalOpen(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 440, maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 20 }}>Add Candidate</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Job Opening *</label>
              <select value={candForm.jobId} onChange={e => setCandForm(p => ({ ...p, jobId: e.target.value }))} style={inputStyle}>
                <option value="">Select Job</option>
                {jobs.filter(j => j.status === 'open').map(j => <option key={j.id} value={j.id}>{j.title} — {j.department}</option>)}
              </select>
            </div>

            {[
              { label: 'Name *', key: 'name', placeholder: 'Full name' },
              { label: 'Email *', key: 'email', placeholder: 'candidate@email.com', type: 'email' },
              { label: 'Phone', key: 'phone', placeholder: '+91 ...' },
              { label: 'Experience', key: 'experience', placeholder: 'e.g. 3 years' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type || 'text'} value={candForm[f.key]} onChange={e => setCandForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Source</label>
              <select value={candForm.source} onChange={e => setCandForm(p => ({ ...p, source: e.target.value }))} style={inputStyle}>
                {['LinkedIn', 'Indeed', 'Referral', 'Career Page', 'Naukri', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn label={isSavingCand ? 'Adding…' : 'Add Candidate'} onClick={handleAddCandidate} />
              <Btn label="Cancel" variant="ghost" onClick={() => setIsCandModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
