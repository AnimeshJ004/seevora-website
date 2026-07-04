import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Btn, Table, Tabs } from '../shared';
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

  const handleDeductionUpdate = async (record, value) => {
    if (record.status === 'paid') return;

    const deductions = Number(value || 0);
    if (!Number.isFinite(deductions) || deductions < 0) {
      showToast('Enter a valid deduction amount.');
      return;
    }
    if (deductions === Number(record.deductionsRaw || 0)) return;

    try {
      const res = await hrApiFetch(`/api/hr/payroll/${record.id}/deduction`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deductions }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Deduction updated.');
        loadData();
      } else {
        showToast(data.message || 'Unable to update deduction.');
      }
    } catch {
      showToast('Server error.');
    }
  };

  const handleSlip = (record) => {
    const slipWindow = window.open('', '_blank', 'width=760,height=900');
    if (!slipWindow) {
      showToast('Allow popups to view the salary slip.');
      return;
    }

    const escapeHtml = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const safeRecord = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, escapeHtml(value)])
    );

    slipWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Payslip - ${safeRecord.employeeCode}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
            .slip { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #dbe3ef; padding: 32px; }
            .top { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 24px; }
            h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: 0; }
            .muted { color: #64748b; font-size: 13px; line-height: 1.5; }
            .badge { display: inline-block; padding: 5px 10px; border-radius: 999px; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 12px; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 24px; }
            .label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-weight: 700; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
            th { background: #f1f5f9; color: #334155; font-size: 12px; text-transform: uppercase; }
            td:last-child, th:last-child { text-align: right; }
            .net { margin-top: 22px; padding: 18px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; justify-content: space-between; align-items: center; }
            .net strong { font-size: 22px; color: #047857; }
            .footer { margin-top: 28px; color: #64748b; font-size: 12px; line-height: 1.6; }
            .actions { max-width: 720px; margin: 16px auto 0; text-align: right; }
            button { padding: 10px 16px; border: 0; border-radius: 999px; background: #0f172a; color: #fff; font-weight: 700; cursor: pointer; }
            @media print {
              body { background: #fff; padding: 0; }
              .slip { border: 0; max-width: none; }
              .actions { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="slip">
            <div class="top">
              <div>
                <h1>Seevora Payslip</h1>
                <div class="muted">Salary slip for ${safeRecord.month}<br />Generated on ${escapeHtml(generatedOn)}</div>
              </div>
              <div><span class="badge">${safeRecord.status}</span></div>
            </div>

            <div class="grid">
              <div>
                <div class="label">Employee</div>
                <div class="value">${safeRecord.emp}</div>
              </div>
              <div>
                <div class="label">Employee ID</div>
                <div class="value">${safeRecord.employeeCode}</div>
              </div>
              <div>
                <div class="label">Payroll Month</div>
                <div class="value">${safeRecord.month}</div>
              </div>
              <div>
                <div class="label">Payroll Status</div>
                <div class="value">${escapeHtml(record.status.toUpperCase())}</div>
              </div>
              <div>
                <div class="label">Monthly Salary</div>
                <div class="value">${safeRecord.monthlySalary}</div>
              </div>
              <div>
                <div class="label">Annual LPA</div>
                <div class="value">${safeRecord.lpa}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr><th>Earnings / Deductions</th><th>Amount</th></tr>
              </thead>
              <tbody>
                <tr><td>Monthly Salary</td><td>${safeRecord.monthlySalary}</td></tr>
                <tr><td>Basic</td><td>${safeRecord.basic}</td></tr>
                <tr><td>HRA</td><td>${safeRecord.hra}</td></tr>
                <tr><td>Allowance</td><td>${safeRecord.allowance}</td></tr>
                <tr><td>Manual Deductions</td><td>${safeRecord.deductions}</td></tr>
              </tbody>
            </table>

            <div class="net">
              <span>Net Pay</span>
              <strong>${safeRecord.net}</strong>
            </div>

            <div class="footer">
              This is a system-generated payslip from Seevora HR. No signature is required.
            </div>
          </div>
          <div class="actions">
            <button onclick="window.print()">Print / Save PDF</button>
          </div>
        </body>
      </html>
    `);
    slipWindow.document.close();
    slipWindow.focus();
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
            cols={['#', 'Employee', 'ID', 'Monthly Salary', 'LPA', 'Basic', 'HRA', 'Allowance', 'Deductions', 'Net Pay', 'Month', 'Status', 'Actions']}
            rows={filtered.map((p, idx) => [
              <span key="idx" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{idx + 1}</span>,
              <span key="employee" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.emp}</span>,
              <span key="code" style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-teal)' }}>{p.employeeCode}</span>,
              <span key="monthly-salary" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.monthlySalary}</span>,
              <span key="lpa" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{p.lpa}</span>,
              p.basic,
              p.hra,
              p.allowance,
              <input
                key="deductions"
                type="number"
                min="0"
                defaultValue={p.deductionsRaw || 0}
                disabled={p.status === 'paid'}
                onBlur={(event) => handleDeductionUpdate(p, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
                style={{
                  width: 92,
                  padding: '5px 8px',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  background: p.status === 'paid' ? 'rgba(148,163,184,0.08)' : 'var(--bg-space)',
                  color: 'var(--accent-pink)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              />,
              <span key="net" style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{p.net}</span>,
              <span key="month" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.month}</span>,
              <Badge key="status" label={p.status.toUpperCase()} color={statusColor[p.status] || 'gray'} />,
              <div key="actions" style={{ display: 'flex', gap: 4 }}>
                <Btn label="Slip" variant="ghost" size="sm" onClick={() => handleSlip(p)} />
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
