import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Avatar, Btn, Table } from '../shared';
import { hrApiFetch } from './hrApi';

const DOC_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'resume', label: 'Resume' },
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'bank_details', label: 'Bank Details' },
  { value: 'other', label: 'Other' },
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, verified: 0, pending: 0, employeesWithDocs: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Upload modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', docType: 'aadhaar', fileName: '', fileSize: '' });
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = useCallback(async () => {
    try {
      const [docsRes, summaryRes] = await Promise.all([
        hrApiFetch('/api/hr/documents'),
        hrApiFetch('/api/hr/documents/summary'),
      ]);
      const docsData = await docsRes.json().catch(() => ({}));
      const summaryData = await summaryRes.json().catch(() => ({}));

      if (docsRes.ok) setDocuments(docsData.documents || []);
      if (summaryRes.ok) setSummary(summaryData);
    } catch {
      showToast('Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await hrApiFetch('/api/hr/employees');
      const data = await res.json().catch(() => ({}));
      if (res.ok) setEmployees(data.employees || []);
    } catch {}
  }, []);

  useEffect(() => { loadData(); loadEmployees(); }, [loadData, loadEmployees]);

  const handleUpload = async () => {
    if (!form.employeeId || !form.fileName) {
      showToast('Employee and file name are required.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await hrApiFetch('/api/hr/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Document uploaded.');
        setIsModalOpen(false);
        setForm({ employeeId: '', docType: 'aadhaar', fileName: '', fileSize: '' });
        loadData();
      } else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
    finally { setIsSaving(false); }
  };

  const handleVerify = async (id) => {
    try {
      const res = await hrApiFetch(`/api/hr/documents/${id}/verify`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Document verified.'); loadData(); }
      else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await hrApiFetch(`/api/hr/documents/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Document removed.'); loadData(); }
      else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
  };

  const filtered = documents.filter(d =>
    d.emp.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase()) ||
    d.fileName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Documents', value: summary.total, color: 'cyan' },
    { label: 'Verified', value: summary.verified, color: 'green' },
    { label: 'Pending Review', value: summary.pending, color: 'orange' },
    { label: 'Employees with Docs', value: summary.employeesWithDocs, color: 'purple' },
  ];

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid var(--glass-border)',
    borderRadius: 10, fontSize: '0.85rem', background: 'var(--bg-space)',
    color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', zIndex: 9999, boxShadow: '0 8px 24px rgba(16,185,129,0.3)', maxWidth: 380 }}>{toast}</div>
      )}

      <PageHeader title="Employee Documents" sub="Manage and verify employee records and files" action="+ Upload Document" onAction={() => setIsModalOpen(true)} />
      <StatsGrid stats={stats} />

      <Panel>
        <FilterBar onSearch={setSearch} filters={['All Types']} />

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>Loading documents…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>No documents found. Click "+ Upload Document" to add one.</p>
        ) : (
          <Table
            cols={['Employee', 'Document Type', 'File Name', 'File Size', 'Uploaded On', 'Verified', 'Actions']}
            rows={filtered.map(d => [
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={d.emp} />
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.emp}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-teal)', marginLeft: 6 }}>{d.employeeCode}</span>
                </div>
              </div>,
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{d.type}</span>,
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{d.fileName}</span>,
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.size || '—'}</span>,
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.uploaded ? new Date(d.uploaded).toLocaleDateString('en-IN') : ''}</span>,
              d.verified
                ? <Badge label="Verified" color="green" />
                : <Badge label="Pending" color="orange" />,
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn label="View" variant="ghost" size="sm" />
                {!d.verified && <Btn label="Verify" size="sm" onClick={() => handleVerify(d.id)} />}
                <Btn label="Delete" variant="danger" size="sm" onClick={() => handleDelete(d.id)} />
              </div>,
            ])}
          />
        )}
      </Panel>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 440, maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 20 }}>Upload Document</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Employee *</label>
              <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} style={inputStyle}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.databaseId} value={e.databaseId}>{e.name} ({e.id})</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Document Type</label>
              <select value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))} style={inputStyle}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>File Name *</label>
              <input value={form.fileName} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))} placeholder="e.g. aadhaar_priya.pdf" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>File Size</label>
              <input value={form.fileSize} onChange={e => setForm(f => ({ ...f, fileSize: e.target.value }))} placeholder="e.g. 1.2 MB" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn label={isSaving ? 'Uploading…' : 'Upload'} onClick={handleUpload} />
              <Btn label="Cancel" variant="ghost" onClick={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
