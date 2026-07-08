import React, { useState, useEffect } from 'react';
import logoIcon from '../../assets/logo-icon.png';
import './HRPage.css';

/* ─── Role Auth Context ──────────────────────────────────────────────────── */
// Simple in-memory role store — swap with real auth (JWT/context) later
export const ROLES = { ADMIN: 'admin', HR: 'hr' };

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Ic = ({ d, size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const IcDashboard   = () => <Ic d={['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z']} />;
const IcPeople      = () => <Ic d={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0']} />;
const IcCalendar    = () => <Ic d={['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18','M8 14h.01','M12 14h.01','M16 14h.01','M8 18h.01','M12 18h.01']} />;
const IcLeave       = () => <Ic d={['M9 11l3 3L22 4','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']} />;
const IcRecruit     = () => <Ic d={['M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0','M10 10l2 2 4-4']} />;
const IcPayroll     = () => <Ic d={['M12 2v20','M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6']} />;
const IcDocs        = () => <Ic d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8']} />;
const IcBell        = () => <Ic d={['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0']} />;
const IcTrend       = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

/* ─── Shared helpers ─────────────────────────────────────────────────────── */
function fmt() {
  const n = new Date();
  return n.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    + ' · ' + n.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function PageHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h2>
        {sub && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      {action && <button className="hr-btn-primary" onClick={onAction}>{action}</button>}
    </div>
  );
}

function FilterBar({ onSearch }) {
  return (
    <div className="hr-filter-bar">
      <input type="search" placeholder="Search..." onChange={e => onSearch && onSearch(e.target.value)} />
      <select><option>All Departments</option><option>Engineering</option><option>Sales</option><option>Operations</option><option>Finance</option><option>HR</option></select>
      <select><option>All Status</option><option>Active</option><option>Inactive</option><option>On Leave</option></select>
      <button className="hr-btn-secondary">Export CSV</button>
    </div>
  );
}

function Avatar({ name, color = 'linear-gradient(135deg,#10b981,#3b82f6)' }) {
  return (
    <div className="hr-avatar" style={{ background: color }}>{name?.[0]?.toUpperCase()}</div>
  );
}

/* ─── Static data ────────────────────────────────────────────────────────── */
const employees = [];
const attendanceData = [];
const leaveRequests = [];
const candidates = [];
const payrollData = [];
const documents = [];

/* ─── Nav structure ──────────────────────────────────────────────────────── */
const navGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: IcDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'employees',   label: 'Employees',          Icon: IcPeople },
      { id: 'attendance',  label: 'Attendance',         Icon: IcCalendar },
      { id: 'leave',       label: 'Leave Management',   Icon: IcLeave },
    ],
  },
  {
    label: 'Talent',
    items: [
      { id: 'recruitment', label: 'Recruitment',        Icon: IcRecruit },
    ],
  },
  {
    label: 'Finance & Docs',
    items: [
      { id: 'payroll',     label: 'Payroll',            Icon: IcPayroll },
      { id: 'documents',   label: 'Employee Documents', Icon: IcDocs },
    ],
  },
];

const pageTitles = {
  dashboard:   'HR Dashboard',
  employees:   'Employees',
  attendance:  'Attendance',
  leave:       'Leave Management',
  recruitment: 'Recruitment',
  payroll:     'Payroll',
  documents:   'Employee Documents',
};

/* ═══════════════════════════════════════════════════════════
   VIEW COMPONENTS
════════════════════════════════════════════════════════════ */

/* ── Dashboard ── */
function ViewHRDashboard() {
  const stats = [
    { label: 'Total Employees', value: 0, sub: '',  color: 'green',  Icon: IcPeople },
    { label: 'Present Today',   value: 0, sub: '', color: 'cyan',   Icon: IcCalendar },
    { label: 'On Leave Today',  value: 0,  sub: '', color: 'orange', Icon: IcLeave },
    { label: 'Open Positions',  value: 0,  sub: '',  color: 'purple', Icon: IcRecruit },
    { label: 'Payroll This Month', value: '₹0', sub: '', color: 'green', Icon: IcPayroll },
    { label: 'Late Today',      value: 0,  sub: '',          color: 'pink',   Icon: IcCalendar },
    { label: 'Pending Leaves',  value: 0,  sub: '', color: 'orange', Icon: IcLeave },
    { label: 'Docs Unverified', value: 0,  sub: '',   color: 'blue',   Icon: IcDocs },
  ];

  return (
    <div>
      <PageHeader title="HR Dashboard" sub={`Welcome back, Anita — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`} />

      {/* KPI grid */}
      <div className="hr-stats-grid" style={{ marginBottom: 24 }}>
        {stats.map(({ label, value, sub, color, Icon }) => (
          <div key={label} className={`hr-stat-card ${color}`}>
            <div className="hr-stat-icon"><Icon /></div>
            <div className="hr-stat-value">{value}</div>
            <div className="hr-stat-label">{label}</div>
            <div className="hr-stat-sub"><IcTrend /> {sub}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="hr-row" style={{ marginBottom: 24 }}>
        {/* Today's attendance summary */}
        <div className="hr-panel">
          <div className="hr-panel-title">Today's Attendance <span className="hr-panel-meta">Live</span></div>
          <table className="hr-table">
            <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {attendanceData.slice(0, 5).map((a, i) => (
                <tr key={i}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={a.emp} /><span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.emp}</span></div></td>
                  <td>{a.checkIn}</td>
                  <td>{a.checkOut}</td>
                  <td>{a.hours}</td>
                  <td><span className={`hr-badge ${a.status}`}>{a.status.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending leaves */}
        <div className="hr-panel">
          <div className="hr-panel-title">Pending Leave Requests</div>
          {leaveRequests.filter(l => l.status === 'pending').map((l, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={l.emp} /><strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{l.emp}</strong></div>
                <span className="hr-badge pending">PENDING</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{l.type} · {l.from} → {l.to} ({l.days} days)</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>"{l.reason}"</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="hr-btn-primary" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>Approve</button>
                <button className="hr-action-btn danger">Reject</button>
              </div>
            </div>
          ))}

          {/* Dept breakdown */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Headcount by Dept</div>
            {[{ dept: 'Engineering', count: 0, pct: 0 }, { dept: 'Sales', count: 0, pct: 0 }, { dept: 'Operations', count: 0, pct: 0 }, { dept: 'Finance', count: 0, pct: 0 }, { dept: 'HR', count: 0, pct: 0 }].map(d => (
              <div key={d.dept} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 90, fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{d.dept}</span>
                <div className="hr-progress-track"><div className="hr-progress-fill" style={{ width: `${d.pct}%` }} /></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', width: 20, textAlign: 'right' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="hr-row equal">
        {/* Recent hires */}
        <div className="hr-panel">
          <div className="hr-panel-title">Recent Hires <span className="hr-panel-meta">Last 90 days</span></div>
          {employees.slice(0, 4).map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
              <Avatar name={e.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.role} · {e.dept}</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.joined}</div>
            </div>
          ))}
        </div>

        {/* Open positions */}
        <div className="hr-panel">
          <div className="hr-panel-title">Open Positions <span className="hr-panel-meta">0 active</span></div>
          {candidates.filter(c => c.status === 'open' || c.status === 'shortlisted').map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.role}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.round}</div>
              </div>
              <span className={`hr-badge ${c.status}`}>{c.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Employees ── */
function ViewEmployees({ refreshKey, onAddAccount }) {
  const [search, setSearch] = useState('');
  const [employeesData, setEmployeesData] = useState(employees);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/hr/employees', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.employees) setEmployeesData(data.employees);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [refreshKey]);

  const filtered = employeesData.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.dept || e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <PageHeader title="Employees" sub={`${employeesData.length} total employees`} action="+ Add Account" onAction={onAddAccount} />
      <div className="hr-stats-grid" style={{ marginBottom: 24 }}>
        {[{ label: 'Total', value: employeesData.length, color: 'green' }, { label: 'Active', value: employeesData.filter(e => e.status==='active').length, color: 'cyan' }, { label: 'Inactive', value: employeesData.filter(e => e.status==='inactive').length, color: 'orange' }, { label: 'On Probation', value: employeesData.filter(e => e.status==='probation').length, color: 'purple' }].map(s => (
          <div key={s.label} className={`hr-stat-card ${s.color}`} style={{ padding: '18px 20px' }}>
            <div className="hr-stat-value" style={{ fontSize: '1.8rem' }}>{s.value}</div>
            <div className="hr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hr-panel">
        <FilterBar onSearch={setSearch} />
        <table className="hr-table">
          <thead><tr><th>Employee</th><th>ID</th><th>Department</th><th>Role</th><th>Salary</th><th>Joined</th><th>Status</th><th>Account</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={i}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={e.name} /><div><div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{e.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.email}</div></div></div></td>
                <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{e.id || e.employee_code}</td>
                <td>{e.dept || e.department}</td>
                <td>{e.role || e.job_title}</td>
                <td style={{ fontWeight: 600 }}>{e.salary}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.joined || e.joined_on}</td>
                <td><span className={`hr-badge ${e.status}`}>{e.status}</span></td>
                <td>
                  {e.hasAccount || e.account_active
                    ? <span className="hr-badge active">Active</span>
                    : <span className="hr-badge" style={{ background: 'rgba(148,163,184,0.12)', color: 'var(--text-muted)' }}>No Account</span>}
                </td>
                <td>
                  <button className="hr-action-btn">View</button>
                  <button className="hr-action-btn">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Attendance ── */
function ViewAttendance() {
  const [tab, setTab] = useState('today');
  const summary = [
    { label: 'Present', value: 39, color: 'green' },
    { label: 'Absent', value: 4, color: 'pink' },
    { label: 'Late', value: 3, color: 'orange' },
    { label: 'WFH', value: 2, color: 'blue' },
  ];
  return (
    <div>
      <PageHeader title="Attendance" sub="Track daily check-ins, check-outs and WFH" action="Download Report" />
      <div className="hr-stats-grid" style={{ marginBottom: 24 }}>
        {summary.map(s => (
          <div key={s.label} className={`hr-stat-card ${s.color}`} style={{ padding: '18px 20px' }}>
            <div className="hr-stat-value" style={{ fontSize: '1.8rem' }}>{s.value}</div>
            <div className="hr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hr-panel">
        <div className="hr-tabs">
          {['today', 'weekly', 'monthly'].map(t => (
            <button key={t} className={`hr-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <FilterBar />
        <table className="hr-table">
          <thead><tr><th>Employee</th><th>ID</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {attendanceData.map((a, i) => (
              <tr key={i}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={a.emp} /><span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.emp}</span></div></td>
                <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{a.id}</td>
                <td style={{ fontSize: '0.82rem' }}>{a.date}</td>
                <td style={{ fontWeight: 600, color: a.checkIn === '—' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{a.checkIn}</td>
                <td style={{ color: a.checkOut === '—' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{a.checkOut}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{a.hours}</td>
                <td><span className={`hr-badge ${a.status}`}>{a.status.toUpperCase()}</span></td>
                <td><button className="hr-action-btn">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Weekly heatmap */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>This Week — Attendance Rate</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 70 }}>
            {[{ day: 'Mon', pct: 95 }, { day: 'Tue', pct: 88 }, { day: 'Wed', pct: 91 }, { day: 'Thu', pct: 85 }, { day: 'Fri', pct: 83 }, { day: 'Sat', pct: 40 }, { day: 'Sun', pct: 0 }].map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.pct}%</div>
                <div style={{ width: '100%', height: `${d.pct * 0.5}px`, background: d.pct > 80 ? 'var(--accent-green)' : d.pct > 40 ? 'var(--accent-orange)' : 'var(--border-color)', borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Leave Management ── */
function ViewLeave() {
  const [tab, setTab] = useState('requests');
  return (
    <div>
      <PageHeader title="Leave Management" sub="Manage leave requests and balances" action="+ Apply Leave" />
      <div className="hr-stats-grid" style={{ marginBottom: 24 }}>
        {[{ label: 'Pending', value: 2, color: 'orange' }, { label: 'Approved', value: 8, color: 'green' }, { label: 'Rejected', value: 3, color: 'pink' }, { label: 'Total This Month', value: 13, color: 'cyan' }].map(s => (
          <div key={s.label} className={`hr-stat-card ${s.color}`} style={{ padding: '18px 20px' }}>
            <div className="hr-stat-value" style={{ fontSize: '1.8rem' }}>{s.value}</div>
            <div className="hr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hr-panel">
        <div className="hr-tabs">
          {['requests', 'balances', 'calendar'].map(t => (
            <button key={t} className={`hr-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'requests' && (
          <>
            <FilterBar />
            <table className="hr-table">
              <thead><tr><th>Employee</th><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {leaveRequests.map((l, i) => (
                  <tr key={i}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={l.emp} /><span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{l.emp}</span></div></td>
                    <td>{l.type}</td>
                    <td style={{ fontSize: '0.82rem' }}>{l.from}</td>
                    <td style={{ fontSize: '0.82rem' }}>{l.to}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{l.days}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 140 }}>{l.reason}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.applied}</td>
                    <td><span className={`hr-badge ${l.status}`}>{l.status.toUpperCase()}</span></td>
                    <td>
                      {l.status === 'pending' && <><button className="hr-btn-primary" style={{ fontSize: '0.72rem', padding: '4px 12px', marginRight: 4 }}>Approve</button><button className="hr-action-btn danger">Reject</button></>}
                      {l.status !== 'pending' && <button className="hr-action-btn">View</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'balances' && (
          <table className="hr-table">
            <thead><tr><th>Employee</th><th>Casual Leave</th><th>Sick Leave</th><th>Annual Leave</th><th>Comp Off</th><th>Used</th><th>Remaining</th></tr></thead>
            <tbody>
              {employees.slice(0, 6).map((e, i) => {
                const used = Math.floor(Math.random() * 8) + 2;
                return (
                  <tr key={i}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={e.name} /><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</span></div></td>
                    <td style={{ fontWeight: 600 }}>6/12</td>
                    <td style={{ fontWeight: 600 }}>2/8</td>
                    <td style={{ fontWeight: 600 }}>5/24</td>
                    <td style={{ fontWeight: 600 }}>1/4</td>
                    <td style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>{used}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{48 - used}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === 'calendar' && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Leave calendar view — integrate with Google Calendar API or a date-picker library for full implementation.
            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {leaveRequests.filter(l => l.status === 'approved').map((l, i) => (
                <div key={i} style={{ padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--panel-bg)', textAlign: 'left', minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>{l.emp}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>{l.from} → {l.to}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{l.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Recruitment ── */
function ViewRecruitment() {
  const [tab, setTab] = useState('pipeline');
  const pipeline = [
    { stage: 'Applied', count: 24, color: 'var(--accent-teal)' },
    { stage: 'Screening', count: 14, color: 'var(--accent-blue)' },
    { stage: 'Technical', count: 8, color: 'var(--accent-purple)' },
    { stage: 'HR Round', count: 4, color: 'var(--accent-orange)' },
    { stage: 'Offer', count: 2, color: 'var(--accent-green)' },
  ];
  return (
    <div>
      <PageHeader title="Recruitment" sub="Track candidates and open positions" action="+ Post Job" />
      <div className="hr-stats-grid" style={{ marginBottom: 24 }}>
        {[{ label: 'Open Positions', value: 6, color: 'cyan' }, { label: 'Total Applicants', value: 52, color: 'purple' }, { label: 'Shortlisted', value: 14, color: 'orange' }, { label: 'Hired This Month', value: 3, color: 'green' }].map(s => (
          <div key={s.label} className={`hr-stat-card ${s.color}`} style={{ padding: '18px 20px' }}>
            <div className="hr-stat-value" style={{ fontSize: '1.8rem' }}>{s.value}</div>
            <div className="hr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <div className="hr-panel" style={{ marginBottom: 24 }}>
        <div className="hr-panel-title">Hiring Pipeline <span className="hr-panel-meta">Active roles</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
          {pipeline.map(p => (
            <div key={p.stage} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.count}</div>
              <div style={{ width: '100%', height: `${(p.count / 24) * 60}px`, background: p.color, borderRadius: '4px 4px 0 0', opacity: 0.75 }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>{p.stage}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="hr-panel">
        <div className="hr-tabs">
          {['pipeline', 'jobs'].map(t => (
            <button key={t} className={`hr-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'pipeline' ? 'Candidates' : 'Job Openings'}
            </button>
          ))}
        </div>

        {tab === 'pipeline' && (
          <>
            <FilterBar />
            <table className="hr-table">
              <thead><tr><th>Candidate</th><th>Role</th><th>Experience</th><th>Source</th><th>Applied</th><th>Current Round</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={i}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={c.name} color="linear-gradient(135deg,#9e3cec,#3b82f6)" /><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span></div></td>
                    <td style={{ fontWeight: 500 }}>{c.role}</td>
                    <td>{c.exp}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.source}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.applied}</td>
                    <td style={{ fontSize: '0.82rem' }}>{c.round}</td>
                    <td><span className={`hr-badge ${c.status}`}>{c.status.toUpperCase()}</span></td>
                    <td>
                      <button className="hr-action-btn">View</button>
                      <button className="hr-btn-primary" style={{ fontSize: '0.72rem', padding: '4px 12px' }}>Move Stage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'jobs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { title: 'Full Stack Developer', dept: 'Engineering', type: 'Full-time', exp: '3-5 yrs', applicants: 18, posted: '5 days ago', status: 'open' },
              { title: 'Product Manager', dept: 'Product', type: 'Full-time', exp: '5+ yrs', applicants: 11, posted: '8 days ago', status: 'open' },
              { title: 'Data Analyst', dept: 'Analytics', type: 'Full-time', exp: '2-4 yrs', applicants: 9, posted: '10 days ago', status: 'open' },
              { title: 'UI/UX Designer', dept: 'Design', type: 'Contract', exp: '3+ yrs', applicants: 7, posted: '12 days ago', status: 'open' },
              { title: 'DevOps Engineer', dept: 'Engineering', type: 'Full-time', exp: '4-6 yrs', applicants: 5, posted: '15 days ago', status: 'open' },
              { title: 'HR Executive', dept: 'HR', type: 'Full-time', exp: '1-3 yrs', applicants: 2, posted: '2 days ago', status: 'open' },
            ].map((j, i) => (
              <div key={i} style={{ border: '1px solid var(--border-color-darker)', borderRadius: 12, padding: 18, background: 'var(--panel-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>{j.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>{j.dept} · {j.type} · {j.exp}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-teal)' }}>{j.applicants} applicants</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{j.posted}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="hr-btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '7px 0' }}>View</button>
                  <button className="hr-action-btn">Close</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payroll ── */
function ViewPayroll() {
  const [tab, setTab] = useState('monthly');
  const total = payrollData.reduce((s, p) => s + parseInt(p.net.replace(/[₹,]/g, '')), 0);
  return (
    <div>
      <PageHeader title="Payroll" sub="Manage monthly payroll, salaries and deductions" action="Process Payroll" />
      <div className="hr-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Payroll Jun', value: '₹5.61L', color: 'green' },
          { label: 'Processed', value: 5, color: 'cyan' },
          { label: 'Processing', value: 2, color: 'orange' },
          { label: 'Avg Salary', value: '₹74K', color: 'purple' },
        ].map(s => (
          <div key={s.label} className={`hr-stat-card ${s.color}`} style={{ padding: '18px 20px' }}>
            <div className="hr-stat-value" style={{ fontSize: '1.6rem' }}>{s.value}</div>
            <div className="hr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hr-panel">
        <div className="hr-tabs">
          {['monthly', 'history'].map(t => (
            <button key={t} className={`hr-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'monthly' ? 'June 2026' : 'History'}
            </button>
          ))}
        </div>
        <FilterBar />
        <table className="hr-table">
          <thead><tr><th>Employee</th><th>ID</th><th>Basic</th><th>HRA</th><th>Allowance</th><th>Deductions</th><th>Net Pay</th><th>Month</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {payrollData.map((p, i) => (
              <tr key={i}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={p.emp} /><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.emp}</span></div></td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-teal)' }}>{p.id}</td>
                <td>{p.basic}</td>
                <td>{p.hra}</td>
                <td>{p.allowance}</td>
                <td style={{ color: 'var(--accent-pink)' }}>{p.deductions}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{p.net}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.month}</td>
                <td><span className={`hr-badge ${p.status}`}>{p.status.toUpperCase()}</span></td>
                <td>
                  <button className="hr-action-btn">Slip</button>
                  {p.status === 'processing' && <button className="hr-btn-primary" style={{ fontSize: '0.72rem', padding: '4px 12px' }}>Process</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Documents ── */
function ViewDocuments() {
  const [search, setSearch] = useState('');
  const filtered = documents.filter(d =>
    d.emp.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <PageHeader title="Employee Documents" sub="Manage and verify employee records and files" action="+ Upload Document" />
      <div className="hr-stats-grid" style={{ marginBottom: 24 }}>
        {[{ label: 'Total Documents', value: 34, color: 'cyan' }, { label: 'Verified', value: 29, color: 'green' }, { label: 'Pending Review', value: 5, color: 'orange' }, { label: 'Employees with Docs', value: 8, color: 'purple' }].map(s => (
          <div key={s.label} className={`hr-stat-card ${s.color}`} style={{ padding: '18px 20px' }}>
            <div className="hr-stat-value" style={{ fontSize: '1.8rem' }}>{s.value}</div>
            <div className="hr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hr-panel">
        <FilterBar onSearch={setSearch} />
        <table className="hr-table">
          <thead><tr><th>Employee</th><th>Document Type</th><th>Uploaded On</th><th>File Size</th><th>Verified</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={i}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={d.emp} /><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.emp}</span><span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-teal)', marginLeft: 4 }}>{d.id}</span></div></td>
                <td style={{ fontWeight: 500 }}>{d.type}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.uploaded}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.size}</td>
                <td>
                  {d.verified
                    ? <span className="hr-badge active">Verified</span>
                    : <span className="hr-badge pending">Pending</span>}
                </td>
                <td>
                  <button className="hr-action-btn">View</button>
                  <button className="hr-action-btn">Download</button>
                  {!d.verified && <button className="hr-btn-primary" style={{ fontSize: '0.72rem', padding: '4px 12px' }}>Verify</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN HR PAGE COMPONENT
════════════════════════════════════════════════════════════ */
export default function HRPage() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [dateTime, setDateTime] = useState(fmt);
  const [refreshKey, setRefreshKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: 'Engineering', jobTitle: '', salary: '', status: 'active', accountRole: 'employee'
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Error adding account');
      } else {
        showToast(`Account created for ${formData.name}.`);
        setShowAddModal(false);
        setFormData({ name: '', email: '', phone: '', department: 'Engineering', jobTitle: '', salary: '', status: 'active', accountRole: 'employee' });
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      showToast('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setInterval(() => setDateTime(fmt()), 60000);
    return () => clearInterval(id);
  }, []);

  const viewMap = {
    dashboard:   <ViewHRDashboard />,
    employees:   <ViewEmployees refreshKey={refreshKey} onAddAccount={() => setShowAddModal(true)} />,
    attendance:  <ViewAttendance />,
    leave:       <ViewLeave />,
    recruitment: <ViewRecruitment />,
    payroll:     <ViewPayroll />,
    documents:   <ViewDocuments />,
  };

  return (
    <div className="hr-layout">
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          background: 'var(--accent-green)', color: '#fff',
          padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: '0.85rem',
          zIndex: 9999, boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
          maxWidth: 380,
        }}>{toast}</div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0d0f26', padding: 32, borderRadius: 20, width: '100%', maxWidth: 540, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: '1.2rem', color: '#fff' }}>Add Employee Account</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>Full Name *</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>Email *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>Phone</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>Department *</label>
                <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#11132f', color: '#fff' }}>
                  <option>Engineering</option><option>Sales</option><option>Operations</option><option>HR</option><option>Finance</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>Job Title *</label>
                <input required value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>Salary *</label>
                <input required type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, color: '#94a3b8' }}>Role</label>
                <select value={formData.accountRole} onChange={e => setFormData({...formData, accountRole: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#11132f', color: '#fff' }}>
                  <option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="hr-sidebar">
        <div className="hr-sidebar-logo">
          <img src={logoIcon} alt="Seevora" className="hr-sidebar-logo-img" />
          <span className="hr-sidebar-logo-text">Seevora</span>
          <span className="hr-sidebar-role-badge">HR</span>
        </div>

        <nav className="hr-nav" aria-label="HR navigation">
          <div style={{ padding: '0 20px', marginBottom: 20 }}>
            <button className="hr-btn-primary" style={{ width: '100%', padding: '10px 0' }} onClick={() => setShowAddModal(true)}>+ Add Account</button>
          </div>
          {navGroups.map(({ label, items }) => (
            <React.Fragment key={label}>
              <span className="hr-nav-section-label">{label}</span>
              {items.map(({ id, label: lbl, Icon, badge }) => (
                <button
                  key={id}
                  className={`hr-nav-item${activeNav === id ? ' active' : ''}`}
                  onClick={() => setActiveNav(id)}
                  aria-current={activeNav === id ? 'page' : undefined}
                >
                  <Icon />
                  {lbl}
                  {badge && <span className="hr-nav-badge">{badge}</span>}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="hr-sidebar-user">
          <div className="hr-sidebar-avatar">AJ</div>
          <div>
            <div className="hr-sidebar-user-name">Anita Joshi</div>
            <div className="hr-sidebar-user-role">HR Executive</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="hr-main">
        <header className="hr-header">
          <div>
            <h1 className="hr-header-title">{pageTitles[activeNav]}</h1>
            <div className="hr-header-date">{dateTime}</div>
          </div>
          <div className="hr-header-right">
            <input className="hr-search" type="search" placeholder="Search…" aria-label="Search" />
            <button className="hr-icon-btn" aria-label="Notifications">
              <IcBell />
              <span className="hr-notif-dot" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="hr-content">
          {viewMap[activeNav] || <ViewHRDashboard />}
        </div>
      </main>
    </div>
  );
}
