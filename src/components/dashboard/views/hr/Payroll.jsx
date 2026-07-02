import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Avatar, Btn, Table, Tabs } from '../shared';
import { hrApiFetch } from './hrApi';

export default function Payroll() {
  const [tab, setTab] = useState('monthly');
  const [payroll, setPayroll] = useState([]);
  const [summary, setSummary] = useState({ totalRecords: 0, paid: 0, processing: 0, draft: 0, totalPayroll: '₹0', avgSalary: '₹0' });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = useCallback(async () => {
    try {
      const [payrollRes, summaryRes] = await Promise.all([
        hrApiFetch(`/api/hr/payroll?month=${currentMonth}`),
        hrApiFetch(`/api/hr/payroll/summary?month=${currentMonth}`),
      ]);
      const payrollData = await payrollRes.json().catch(() => ({}));
      const summaryData = await summaryRes.json().catch(() => ({}));

      if (payrollRes.ok) setPayroll(payrollData.payroll || []);
      if (summaryRes.ok) setSummary(summaryData);
    } catch {
      showToast('Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await hrApiFetch('/api/hr/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Payroll generated.');
        loadData();
      } else showToast(data.message || 'Failed to generate.');
    } catch { showToast('Server error.'); }
    finally { setIsGenerating(false); }
  };

  const handleProcess = async (id) => {
    try {
      const res = await hrApiFetch(`/api/hr/payroll/${id}/process`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Payroll processed.'); loadData(); }
      else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
  };

  const filtered = payroll.filter(p =>
    p.emp.toLowerCase().includes(search.toLowerCase()) ||
    p.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { draft: 'orange', processing: 'blue', paid: 'green' };

  const stats = [
    { label: `Total Payroll ${monthLabel.split(' ')[0]}`, value: summary.totalPayroll, color: 'green' },
    { label: 'Paid', value: summary.paid, color: 'cyan' },
    { label: 'Processing', value: summary.processing + (summary.draft || 0), color: 'orange' },
    { label: 'Avg Salary', value: summary.avgSalary, color: 'purple' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', zIndex: 9999, boxShadow: '0 8px 24px rgba(16,185,129,0.3)', maxWidth: 380 }}>{toast}</div>
      )}

      <PageHeader
        title="Payroll"
        sub="Manage monthly payroll, salaries and deductions"
        action={isGenerating ? 'Generating…' : 'Generate Payroll'}
        onAction={handleGenerate}
      />
      <StatsGrid stats={stats} />

      <Panel>
        <Tabs
          tabs={[
            { id: 'monthly', label: monthLabel },
            { id: 'history', label: 'History' },
          ]}
          active={tab}
          onChange={setTab}
        />

        <FilterBar onSearch={setSearch} filters={['All Status']} />

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>Loading payroll…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>No payroll records for {monthLabel}.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Click "Generate Payroll" to create records for all active employees.</p>
          </div>
        ) : (
          <Table
            cols={['#', 'Employee', 'ID', 'Basic', 'HRA', 'Allowance', 'Deductions', 'Net Pay', 'Month', 'Status', 'Actions']}
            rows={filtered.map((p, idx) => [
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{idx + 1}</span>,
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.emp}</span>,
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-teal)' }}>{p.employeeCode}</span>,
              p.basic,
              p.hra,
              p.allowance,
              <span style={{ color: 'var(--accent-pink)' }}>{p.deductions}</span>,
              <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{p.net}</span>,
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.month}</span>,
              <Badge label={p.status.toUpperCase()} color={statusColor[p.status] || 'gray'} />,
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn label="Slip" variant="ghost" size="sm" />
                {p.status !== 'paid' && (
                  <Btn label={p.status === 'draft' ? 'Process' : 'Mark Paid'} size="sm" onClick={() => handleProcess(p.id)} />
                )}
              </div>,
            ])}
          />
        )}
      </Panel>
    </div>
  );
}
