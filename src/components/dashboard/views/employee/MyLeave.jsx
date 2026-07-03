import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, FilterBar, Badge, Btn, Table } from '../shared';
import { hrApiFetch } from '../hr/hrApi';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'comp_off', label: 'Comp Off' },
];

const STATUS_COLORS = { pending: 'orange', approved: 'green', rejected: 'pink' };

export default function MyLeave({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await hrApiFetch('/api/employee/leaves');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLeaves(data.leaves || []);
        setBalances(data.balances);
      } else {
        showToast(data.message || 'Failed to load leaves.');
      }
    } catch {
      showToast('Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApply = async () => {
    if (!form.fromDate || !form.toDate) {
      showToast('Please select from and to dates.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await hrApiFetch('/api/employee/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Leave applied successfully.');
        setIsModalOpen(false);
        setForm({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
        loadData();
      } else {
        showToast(data.message || 'Failed to apply.');
      }
    } catch { showToast('Server error.'); }
    finally { setIsSaving(false); }
  };

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

      <PageHeader title="My Leave" sub="Manage your leave requests and balances" action="+ Apply Leave" onAction={() => setIsModalOpen(true)} />

      {/* Balances Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { key: 'casual', label: 'Casual Leave' },
          { key: 'sick', label: 'Sick Leave' },
          { key: 'annual', label: 'Annual Leave' },
          { key: 'compOff', label: 'Comp Off' },
        ].map(({ key, label }) => {
          const bal = balances?.[key];
          const backendType = key === 'compOff' ? 'comp_off' : key;
          const requestCount = leaves.filter(l => l.type === backendType && l.status !== 'rejected').length;
          
          return (
            <div key={key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>
                {requestCount}
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: 8 }}>{label} (Requests)</div>
              <div style={{ color: '#10b981', fontSize: '0.74rem', fontWeight: 700, marginTop: 8 }}>
                {bal ? `Days Used: ${bal.used} / Remaining: ${bal.remaining}` : 'Loading...'}
              </div>
            </div>
          );
        })}
      </div>

      <Panel>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Leave History</h3>
        </div>
        
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>Loading your requests…</p>
        ) : leaves.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>No leave requests found. Use "+ Apply Leave" to request time off.</p>
        ) : (
          <Table
            cols={['#', 'Leave Type', 'From', 'To', 'Days', 'Reason', 'Applied On', 'Status']}
            rows={leaves.map((l, idx) => [
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{idx + 1}</span>,
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.type.replace(/_/g, ' ')}</span>,
              l.from,
              l.to,
              <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{l.days}</span>,
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 200, display: 'inline-block' }}>{l.reason || '-'}</span>,
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.applied ? new Date(l.applied).toLocaleDateString('en-IN') : ''}</span>,
              <Badge label={l.status.toUpperCase()} color={STATUS_COLORS[l.status] || 'gray'} />,
            ])}
          />
        )}
      </Panel>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 440, maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 20 }}>Apply for Leave</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Leave Type *</label>
              <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))} style={inputStyle}>
                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>From Date *</label>
                <input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>To Date *</label>
                <input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Reason</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} placeholder="Why do you need time off?" />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn label={isSaving ? 'Submitting…' : 'Submit Request'} onClick={handleApply} />
              <Btn label="Cancel" variant="ghost" onClick={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
