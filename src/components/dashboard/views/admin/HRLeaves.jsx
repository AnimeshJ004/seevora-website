import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, FilterBar, Badge, Btn, Table, Tabs } from '../shared';
import { hrApiFetch } from '../hr/hrApi';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'comp_off', label: 'Comp Off' },
];

export default function HRLeaves() {
  const [activeTab, setActiveTab] = useState('requests');
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeId: '', leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'requests') {
        const url = statusFilter === 'all' ? '/api/admin/leaves' : `/api/admin/leaves?status=${statusFilter}`;
        const [lRes, sRes] = await Promise.all([
          hrApiFetch(url),
          hrApiFetch('/api/admin/leaves/summary')
        ]);
        const lData = await lRes.json().catch(() => ({}));
        const sData = await sRes.json().catch(() => ({}));
        setLeaves(lData.leaves || []);
        setSummary(sData || { total: 0, pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
      } else {
        const res = await hrApiFetch('/api/admin/leaves/balances');
        const data = await res.json().catch(() => ({}));
        setBalances(data.balances || []);
      }
    } catch {
      showToast('Error loading data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (isModalOpen && employees.length === 0) {
      hrApiFetch('/api/hr/employees').then(res => res.json()).then(data => {
        setEmployees(data.employees ? data.employees.filter(e => e.accountRole === 'hr') : []);
      }).catch(console.error);
    }
  }, [isModalOpen, employees.length]);

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this leave?`)) return;
    try {
      const res = await hrApiFetch(`/api/admin/leaves/${id}/${action}`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(`Leave ${action}d.`); loadData(); }
      else showToast(data.message || `Failed to ${action}.`);
    } catch { showToast('Server error.'); }
  };

  const handleApply = async () => {
    if (!form.employeeId || !form.fromDate || !form.toDate) { showToast('Fill required fields.'); return; }
    setIsSaving(true);
    try {
      const res = await hrApiFetch('/api/admin/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Leave applied successfully.');
        setIsModalOpen(false);
        setForm({ employeeId: '', leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
        loadData();
      } else {
        showToast(data.message || 'Failed to apply.');
      }
    } catch { showToast('Server error.'); }
    finally { setIsSaving(false); }
  };

  const statusColors = { pending: 'orange', approved: 'green', rejected: 'pink' };

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', zIndex: 9999 }}>{toast}</div>
      )}

      <PageHeader title="HR Leave Management" sub="Manage leave requests and balances for the HR team." action="+ Apply Leave" onAction={() => setIsModalOpen(true)} />

      {activeTab === 'requests' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
          {[
            { label: 'Total Requests', val: summary.total },
            { label: 'Pending', val: summary.pending, color: '#f59e0b' },
            { label: 'On Leave Today', val: summary.onLeaveToday, color: '#10b981' },
            { label: 'Rejected', val: summary.rejected, color: '#f43f5e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '2rem', color: s.color || '#0f172a' }}>{s.val}</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'requests', label: 'HR Leave Requests' },
          { id: 'balances', label: 'HR Leave Balances' },
        ]}
      />

      <Panel>
        {activeTab === 'requests' && (
          <>
            <FilterBar
              filters={[
                { key: 'status', label: 'Status', options: [{value:'all',label:'All Statuses'},{value:'pending',label:'Pending'},{value:'approved',label:'Approved'},{value:'rejected',label:'Rejected'}] }
              ]}
              values={{ status: statusFilter }}
              onChange={(k, v) => setStatusFilter(v)}
            />
            {isLoading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div> : (
              <Table
                cols={['Employee', 'Leave Type', 'Duration', 'Reason', 'Applied', 'Status', 'Actions']}
                rows={leaves.map(l => [
                  <div>
                    <div style={{ fontWeight: 700 }}>{l.emp}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{l.employeeCode}</div>
                  </div>,
                  <span style={{ textTransform: 'capitalize' }}>{l.type.replace('_',' ')}</span>,
                  <div style={{ fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{l.days} Days</div>
                    <div style={{ color: 'var(--text-muted)' }}>{l.from} - {l.to}</div>
                  </div>,
                  <div style={{ fontSize: '0.8rem', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.reason}>{l.reason || '-'}</div>,
                  <div style={{ fontSize: '0.78rem' }}>{new Date(l.applied).toLocaleDateString('en-IN')}</div>,
                  <Badge label={l.status.toUpperCase()} color={statusColors[l.status]} />,
                  l.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn label="Approve" size="sm" onClick={() => handleAction(l.id, 'approve')} />
                      <Btn label="Reject" size="sm" variant="ghost" onClick={() => handleAction(l.id, 'reject')} />
                    </div>
                  ) : <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Reviewed</span>
                ])}
              />
            )}
          </>
        )}
        {activeTab === 'balances' && (
          <div style={{ padding: '20px 0' }}>
            {isLoading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div> : (
              <Table
                cols={['Employee', 'Casual Leave', 'Sick Leave', 'Annual Leave', 'Comp Off', 'Total Taken']}
                rows={balances.map(b => [
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{b.employeeCode}</div>
                  </div>,
                  <span style={{ fontSize: '0.8rem' }}>{b.casual.used} / {b.casual.total}</span>,
                  <span style={{ fontSize: '0.8rem' }}>{b.sick.used} / {b.sick.total}</span>,
                  <span style={{ fontSize: '0.8rem' }}>{b.annual.used} / {b.annual.total}</span>,
                  <span style={{ fontSize: '0.8rem' }}>{b.compOff.used} / {b.compOff.total}</span>,
                  <span style={{ fontWeight: 800, color: '#f43f5e' }}>{b.totalUsed} Days</span>
                ])}
              />
            )}
          </div>
        )}
      </Panel>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if(e.target===e.currentTarget) setIsModalOpen(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 440, border: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: 20 }}>Apply Leave for HR</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display:'block', fontSize:'0.78rem', marginBottom:6 }}>HR Employee *</label>
              <select value={form.employeeId} onChange={e=>setForm(f=>({...f, employeeId: e.target.value}))} style={{ width:'100%', padding:'10px', borderRadius:10 }}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display:'block', fontSize:'0.78rem', marginBottom:6 }}>Leave Type *</label>
              <select value={form.leaveType} onChange={e=>setForm(f=>({...f, leaveType: e.target.value}))} style={{ width:'100%', padding:'10px', borderRadius:10 }}>
                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ display:'block', fontSize:'0.78rem', marginBottom:6 }}>From *</label>
                <input type="date" value={form.fromDate} onChange={e=>setForm(f=>({...f, fromDate: e.target.value}))} style={{ width:'100%', padding:'10px', borderRadius:10 }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.78rem', marginBottom:6 }}>To *</label>
                <input type="date" value={form.toDate} onChange={e=>setForm(f=>({...f, toDate: e.target.value}))} style={{ width:'100%', padding:'10px', borderRadius:10 }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display:'block', fontSize:'0.78rem', marginBottom:6 }}>Reason</label>
              <textarea value={form.reason} onChange={e=>setForm(f=>({...f, reason: e.target.value}))} rows={3} style={{ width:'100%', padding:'10px', borderRadius:10 }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <Btn label={isSaving ? 'Saving...' : 'Apply Leave'} onClick={handleApply} />
              <Btn label="Cancel" variant="ghost" onClick={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
