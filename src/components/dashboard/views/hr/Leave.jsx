import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Avatar, Btn, Table, Tabs, ExpandableText } from '../shared';
import { hrApiFetch } from './hrApi';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'comp_off', label: 'Comp Off' },
];

const STATUS_COLORS = { pending: 'orange', approved: 'green', rejected: 'pink' };

export default function Leave({ user }) {
  const [tab, setTab] = useState('requests');
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeId: '', leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = useCallback(async () => {
    try {
      const [leavesRes, summaryRes, balancesRes] = await Promise.all([
        hrApiFetch('/api/hr/leaves'),
        hrApiFetch('/api/hr/leaves/summary'),
        hrApiFetch('/api/hr/leaves/balances'),
      ]);
      const leavesData = await leavesRes.json().catch(() => ({}));
      const summaryData = await summaryRes.json().catch(() => ({}));
      const balancesData = await balancesRes.json().catch(() => ({}));

      if (leavesRes.ok) setLeaves(leavesData.leaves || []);
      if (summaryRes.ok) setSummary(summaryData);
      if (balancesRes.ok) setBalances(balancesData.balances || []);
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

  const handleApprove = async (id) => {
    try {
      const res = await hrApiFetch(`/api/hr/leaves/${id}/approve`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Leave approved.'); loadData(); }
      else showToast(data.message || 'Failed to approve.');
    } catch { showToast('Server error.'); }
  };

  const handleReject = async (id) => {
    try {
      const res = await hrApiFetch(`/api/hr/leaves/${id}/reject`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Leave rejected.'); loadData(); }
      else showToast(data.message || 'Failed to reject.');
    } catch { showToast('Server error.'); }
  };

  const handleApply = async () => {
    if (!form.fromDate || !form.toDate) {
      showToast('Please fill all required fields.');
      return;
    }
    setIsSaving(true);
    const myEmp = employees.find(e => e.email === user?.email);
    if (!myEmp) {
      showToast('HR employee record not found.');
      setIsSaving(false);
      return;
    }
    try {
      const days = Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1;
      const res = await hrApiFetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, employeeId: myEmp.databaseId, days }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Leave applied.');
        setIsModalOpen(false);
        setForm({ employeeId: '', leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
        loadData();
      } else {
        showToast(data.message || 'Failed to apply.');
      }
    } catch { showToast('Server error.'); }
    finally { setIsSaving(false); }
  };

  const filtered = leaves.filter(l =>
    l.emp.toLowerCase().includes(search.toLowerCase()) ||
    l.type.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Pending', value: summary.pending, color: 'orange' },
    { label: 'Approved', value: summary.approved, color: 'green' },
    { label: 'Rejected', value: summary.rejected, color: 'pink' },
    { label: 'Total This Month', value: summary.total, color: 'cyan' },
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

      <PageHeader title="Leave Management" sub="Track company leave records. Managers approve direct-report leave requests." />
      <StatsGrid stats={stats} />

      <Panel>
        <Tabs
          tabs={[
            { id: 'requests', label: 'Requests' },
            { id: 'balances', label: 'Balances' },
            { id: 'calendar', label: 'Calendar' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'requests' && (
          <>
            <FilterBar onSearch={setSearch} filters={['All Status']} />
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>Loading leave requests…</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>No leave requests found. Use "+ Apply Leave" to create one.</p>
            ) : (
              <Table
                cols={['#', 'Employee', 'Manager', 'Leave Type', 'From', 'To', 'Days', 'Reason', 'Applied', 'Status', 'Reviewed By']}
                rows={filtered.map((l, idx) => [
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{idx + 1}</span>,
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.emp}</span>,
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{l.managerName || 'Unassigned'}</span>,
                  <span style={{ textTransform: 'capitalize' }}>{l.type.replace(/_/g, ' ')}</span>,
                  l.from,
                  l.to,
                  <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{l.days}</span>,
                  <ExpandableText text={l.reason} />,
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.applied ? new Date(l.applied).toLocaleDateString('en-IN') : ''}</span>,
                  <Badge label={l.status.toUpperCase()} color={STATUS_COLORS[l.status] || 'gray'} />,
                  l.status === 'pending'
                    ? <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting manager</span>
                    : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.reviewedByName || 'Recorded'}</span>,
                ])}
              />
            )}
          </>
        )}

        {tab === 'balances' && (
          balances.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>No employees found. Add employees first.</p>
          ) : (
            <Table
              cols={['#', 'Employee', 'Monthly Used', 'Monthly Left', 'Yearly Used', 'Yearly Left']}
              rows={balances.map((b, idx) => [
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{idx + 1}</span>,
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</span>,
                <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{b.monthly.used}/{b.monthly.total}</span>,
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{b.monthly.remaining}</span>,
                <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{b.yearly.used}/{b.yearly.total}</span>,
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{b.yearly.remaining}</span>,
              ])}
            />
          )
        )}

        {tab === 'calendar' && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>Approved leaves overview</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {leaves.filter(l => l.status === 'approved').map((l, i) => (
                <div key={i} style={{ padding: '12px 16px', border: '1px solid var(--glass-border)', borderRadius: 12, background: 'var(--bg-card)', textAlign: 'left', minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>{l.emp}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>{l.from} → {l.to}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>{l.type.replace(/_/g, ' ')}</div>
                </div>
              ))}
              {leaves.filter(l => l.status === 'approved').length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No approved leaves to display.</p>
              )}
            </div>
          </div>
        )}
      </Panel>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 440, maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 20 }}>Apply Leave</h3>

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
                style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional reason for leave" />
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
