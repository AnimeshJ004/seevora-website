import React, { useState, useEffect } from 'react';
import logoIcon from '../../assets/logo-icon.png';
import { logout, PERMISSIONS, ROLE_META, hasPermission } from '../../auth/roles';
import './Dashboard.css';

// Admin views
import AdminDashboard  from './views/admin/AdminDashboard';
import Businesses      from './views/admin/Businesses';
import Users           from './views/admin/Users';
import SupportTickets  from './views/admin/SupportTickets';
import Leads           from './views/admin/Leads';
import Appointments    from './views/admin/Appointments';
import AIVoiceLogs     from './views/admin/AIVoiceLogs';
import WhatsAppLogs    from './views/admin/WhatsAppLogs';
import Reviews         from './views/admin/Reviews';
import AuditLogs       from './views/admin/AuditLogs';
import SecurityCenter  from './views/admin/SecurityCenter';
import Analytics       from './views/admin/Analytics';
import Settings        from './views/admin/Settings';

// HR views
import HRDashboard     from './views/hr/HRDashboard';
import Employees       from './views/hr/Employees';
import Attendance      from './views/hr/Attendance';
import Leave           from './views/hr/Leave';
import Recruitment     from './views/hr/Recruitment';
import Payroll         from './views/hr/Payroll';
import Documents       from './views/hr/Documents';

/* ── SVG icon helper ── */
function Ic({ d, size = 16 }) {
  const paths = typeof d === 'string' ? d.split(' M ').map((p, i) => (i === 0 ? p : 'M ' + p)) : d;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      width={size} height={size}>
      {(Array.isArray(paths) ? paths : [paths]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

/* ── Nav icons ── */
const NAVICONS = {
  dashboard:         <Ic d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
  businesses:        <Ic d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
  users:             <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />,
  'support-tickets': <Ic d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  leads:             <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />,
  appointments:      <Ic d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18" />,
  'ai-voice-logs':   <Ic d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" />,
  'whatsapp-logs':   <Ic d="M21 11.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0z" />,
  reviews:           <Ic d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />,
  'audit-logs':      <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4" />,
  'security-center': <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  analytics:         <Ic d="M18 20V10 M12 20V4 M6 20v-6 M2 20h20" />,
  settings:          <Ic d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
  employees:         <Ic d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
  attendance:        <Ic d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01" />,
  leave:             <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  recruitment:       <Ic d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />,
  payroll:           <Ic d="M12 2v20 M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />,
  documents:         <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8" />,
  'my-attendance':   <Ic d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01" />,
  'my-leave':        <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  'my-documents':    <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8" />,
};

/* ── Nav structure ── */
const NAV = {
  super_admin: [
    { label: 'Platform',    items: [{id:'dashboard',label:'Dashboard'},{id:'businesses',label:'Businesses'},{id:'users',label:'Users & Roles'},{id:'support-tickets',label:'Support'}] },
    { label: 'Operations',  items: [{id:'leads',label:'CRM / Leads'},{id:'appointments',label:'Appointments'},{id:'ai-voice-logs',label:'AI Voice Agent'},{id:'whatsapp-logs',label:'WhatsApp Marketing'},{id:'reviews',label:'Reputation'}] },
    { label: 'System',      items: [{id:'audit-logs',label:'Audit Logs'},{id:'security-center',label:'Security Center'},{id:'analytics',label:'Analytics'},{id:'settings',label:'Settings'}] },
    { label: 'HR Module',   items: [{id:'employees',label:'Employees'},{id:'attendance',label:'Attendance'},{id:'leave',label:'Leave'},{id:'recruitment',label:'Recruitment'},{id:'payroll',label:'Payroll'},{id:'documents',label:'Documents'}] },
  ],
  admin: [
    { label: 'Platform',    items: [{id:'dashboard',label:'Dashboard'},{id:'businesses',label:'Businesses'},{id:'users',label:'Users & Roles'},{id:'support-tickets',label:'Support'}] },
    { label: 'Operations',  items: [{id:'leads',label:'CRM / Leads'},{id:'appointments',label:'Appointments'},{id:'ai-voice-logs',label:'AI Voice Agent'},{id:'whatsapp-logs',label:'WhatsApp Marketing'},{id:'reviews',label:'Reputation'},{id:'analytics',label:'Analytics'},{id:'settings',label:'Settings'}] },
  ],
  hr: [
    { label: 'Overview',         items: [{id:'dashboard',label:'Dashboard'}] },
    { label: 'People',           items: [{id:'employees',label:'Employees'},{id:'attendance',label:'Attendance'},{id:'leave',label:'Leave Management'}] },
    { label: 'Talent & Finance', items: [{id:'recruitment',label:'Recruitment'},{id:'payroll',label:'Payroll'},{id:'documents',label:'Documents'}] },
  ],
  employee: [
    { label: 'Workspace', items: [{id:'dashboard',label:'Dashboard'}] },
    { label: 'Self Service', items: [{id:'my-attendance',label:'My Attendance'},{id:'my-leave',label:'My Leave'},{id:'my-documents',label:'My Documents'}] },
  ],
  manager: [
    { label: 'Work', items: [{id:'dashboard',label:'Dashboard'},{id:'leads',label:'Leads'},{id:'appointments',label:'Appointments'},{id:'analytics',label:'Analytics'}] },
  ],
  support: [
    { label: 'Work', items: [{id:'dashboard',label:'Dashboard'},{id:'support-tickets',label:'Support Tickets'},{id:'audit-logs',label:'Audit Logs'}] },
  ],
};

const TITLES = {
  dashboard:'Dashboard', businesses:'Businesses', users:'Users & Roles',
  'support-tickets':'Support Tickets', leads:'CRM / Leads', appointments:'Appointments',
  'ai-voice-logs':'AI Voice Agent', 'whatsapp-logs':'WhatsApp Marketing', reviews:'Reputation',
  'audit-logs':'Audit Logs', 'security-center':'Security Center', analytics:'Analytics', settings:'Settings',
  employees:'Employees', attendance:'Attendance', leave:'Leave Management',
  recruitment:'Recruitment', payroll:'Payroll', documents:'Employee Documents',
  'my-attendance':'My Attendance', 'my-leave':'My Leave', 'my-documents':'My Documents',
};

const ACCENT = {
  super_admin: { c:'#9e3cec', bg:'rgba(158,60,236,0.15)' },
  admin:       { c:'#4f8ef7', bg:'rgba(79,142,247,0.15)' },
  hr:          { c:'#10b981', bg:'rgba(16,185,129,0.15)' },
  employee:    { c:'#10b981', bg:'rgba(16,185,129,0.15)' },
  manager:     { c:'#f97316', bg:'rgba(249,115,21,0.15)' },
  support:     { c:'#3b82f6', bg:'rgba(59,130,246,0.15)' },
};

function getView(id, role, user) {
  if (id === 'dashboard' && role === 'employee') return <EmployeeDashboard user={user} />;
  if (id === 'dashboard' && role === 'manager') return <ManagerDashboard user={user} />;
  if (role === 'employee' && id === 'my-attendance') return <EmployeeSelfService user={user} type="attendance" />;
  if (role === 'employee' && id === 'my-leave') return <EmployeeSelfService user={user} type="leave" />;
  if (role === 'employee' && id === 'my-documents') return <EmployeeSelfService user={user} type="documents" />;
  if (id === 'dashboard') return role === 'hr' ? <HRDashboard user={user} /> : <AdminDashboard user={user} />;
  const map = {
    businesses: <Businesses />, users: <Users />, 'support-tickets': <SupportTickets />,
    leads: <Leads />, appointments: <Appointments />, 'ai-voice-logs': <AIVoiceLogs />,
    'whatsapp-logs': <WhatsAppLogs />, reviews: <Reviews />, 'audit-logs': <AuditLogs />,
    'security-center': <SecurityCenter />, analytics: <Analytics />, settings: <Settings />,
    employees: <Employees />, attendance: <Attendance />, leave: <Leave />,
    recruitment: <Recruitment />, payroll: <Payroll />, documents: <Documents />,
  };
  return map[id] || <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>View coming soon.</div>;
}

function ManagerDashboard({ user }) {
  const name = user?.name || user?.username || 'Manager';
  const metrics = [
    { label: 'Assigned Leads', value: '0', note: 'Pipeline owned by your team' },
    { label: 'Appointments', value: '0', note: 'Upcoming client meetings' },
    { label: 'Team Tasks', value: '0', note: 'Open operational follow-ups' },
    { label: 'Conversion', value: '0%', note: 'Current reporting period' },
  ];

  return (
    <div style={{ color: '#475569', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.7rem', color: '#0f172a', marginBottom: 4 }}>
          Manager Workspace
        </h2>
        <p style={{ fontSize: '0.9rem' }}>Welcome, {name}. Review team activity, leads, appointments, and performance from one place.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {metrics.map((metric) => (
          <RoleMetricCard key={metric.label} {...metric} color="#f97316" />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <RolePanel title="Operational Focus" items={['Lead follow-ups pending manager review', 'Appointments needing confirmation', 'Team performance report ready for weekly review']} />
        <RolePanel title="Manager Access" items={['CRM / Leads', 'Appointments', 'Analytics']} />
      </div>
    </div>
  );
}

function EmployeeDashboard({ user }) {
  const name = user?.name || user?.username || 'Employee';
  return (
    <div style={{ color: '#475569', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        <RoleMetricCard label="Attendance" value="0" note="Records available after HR sync" color="#10b981" />
        <RoleMetricCard label="Leave Balance" value="0" note="Balances managed by HR" color="#10b981" />
        <RoleMetricCard label="Documents" value="0" note="Uploaded documents" color="#10b981" />
      </div>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', marginBottom: 10 }}>
          Employee Workspace
        </div>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>
          Welcome, {name}
        </h2>
        <p style={{ maxWidth: 620, fontSize: '0.95rem', lineHeight: 1.7 }}>
          Your employee account is active. HR can manage your profile, attendance, leave, payroll, and documents from the HR panel.
        </p>
      </div>
    </div>
  );
}

function EmployeeSelfService({ type, user }) {
  const config = {
    attendance: {
      title: 'My Attendance',
      subtitle: 'Your attendance records will appear here after HR starts syncing attendance data.',
      rows: ['Today: Not marked yet', 'This week: 0 recorded days', 'Late marks: 0'],
    },
    leave: {
      title: 'My Leave',
      subtitle: 'Track leave balance and requests from your employee workspace.',
      rows: ['Casual leave: 0 available', 'Sick leave: 0 available', 'Pending requests: 0'],
    },
    documents: {
      title: 'My Documents',
      subtitle: 'Employee documents assigned or uploaded by HR will be listed here.',
      rows: ['Offer letter: Not uploaded', 'ID proof: Not uploaded', 'Payroll documents: Not uploaded'],
    },
  }[type];

  return (
    <div style={{ color: '#475569', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0f172a', marginBottom: 4 }}>
          {config.title}
        </h2>
        <p style={{ fontSize: '0.9rem' }}>{user?.name || user?.username || 'Employee'} · {config.subtitle}</p>
      </div>
      <RolePanel title={config.title} items={config.rows} />
    </div>
  );
}

function RoleMetricCard({ label, value, note, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: 8 }}>{label}</div>
      <div style={{ color, fontSize: '0.74rem', fontWeight: 700, marginTop: 8 }}>{note}</div>
    </div>
  );
}

function RolePanel({ title, items }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 14 }}>{title}</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => (
          <div key={item} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 12px', color: '#475569', fontSize: '0.84rem', background: '#f8fafc' }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessDenied({ id }) {
  return (
    <div className="ds-access-denied">
      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48" style={{ opacity: 0.5 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
      </svg>
      <h2>Access Restricted</h2>
      <p>You don't have permission to view <strong style={{ color: '#e2e8f0' }}>{TITLES[id]}</strong>.<br />Contact your Super Admin.</p>
    </div>
  );
}

export default function DashboardShell({ user, onLogout }) {
  const role     = user?.role || 'admin';
  const meta     = ROLE_META[role] || ROLE_META.admin;
  const accent   = ACCENT[role]  || ACCENT.admin;
  const allowed  = PERMISSIONS[role] || [];
  const navGroups = NAV[role] || NAV.admin;

  const [active, setActive] = useState(allowed[0] || 'dashboard');

  return (
    <div className="ds-layout">

      {/* ── Sidebar ── */}
      <aside className="ds-sidebar">
        {/* Logo */}
        <div className="ds-sidebar-logo">
          <img src={logoIcon} alt="Seevora" />
          <div>
            <span className="ds-sidebar-logo-text">Seevora AI</span>
            <span className="ds-sidebar-logo-sub">AI-Powered Growth Platform</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="ds-nav">
          {navGroups.map(({ label, items }) => (
            <React.Fragment key={label}>
              <span className="ds-nav-group-label">{label}</span>
              {items.map(({ id, label: lbl, badge }) => {
                const isAllowed = allowed.includes(id);
                const isActive  = active === id;
                return (
                  <button key={id}
                    className={`ds-nav-item${isActive ? ' active' : ''}${!isAllowed ? ' locked' : ''}`}
                    onClick={() => isAllowed && setActive(id)}
                    title={!isAllowed ? `No access for ${meta.label}` : lbl}
                    style={{ background: isActive ? '#1e3a5f' : 'none', color: isActive ? accent.c : undefined }}
                  >
                    {NAVICONS[id] || <span style={{ width: 16 }} />}
                    {lbl}
                    {badge && isAllowed && <span className="ds-nav-badge">{badge}</span>}
                    {!isAllowed && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" style={{ marginLeft: 'auto', opacity: 0.3 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom */}
        <div className="ds-sidebar-bottom">
          {/* User */}
          <div className="ds-sidebar-user">
            <div className="ds-avatar" style={{ background: `linear-gradient(135deg, ${accent.c}, #0f172a)` }}>
              {user?.avatar || user?.name?.[0] || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ds-user-name">{user?.name}</div>
              <div className="ds-user-role">{user?.email}</div>
            </div>
          </div>

          <button className="ds-logout-btn" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ds-main">
        {/* Header */}
        <header className="ds-header">
          <button className="ds-hamburger">
            <span /><span /><span />
          </button>

          <div className="ds-search-wrap">
            <svg className="ds-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="ds-search" type="search" placeholder="Search anything..." />
            <span className="ds-search-kbd">Ctrl + /</span>
          </div>

          <div className="ds-header-spacer" />

          {/* Notification */}
          <button className="ds-icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="ds-notif-count">4</span>
          </button>

          {/* WhatsApp */}
          <button className="ds-icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>

          {/* Help */}
          <button className="ds-icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {/* Profile */}
          <div className="ds-header-profile">
            <div className="ds-avatar" style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${accent.c}, #0f172a)`, fontSize: '0.72rem' }}>
              {user?.avatar || 'U'}
            </div>
            <div>
              <div className="ds-header-profile-name">{user?.name}</div>
              <div className="ds-header-profile-role">{meta.label}</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{ color: '#64748b' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </header>

        {/* Content */}
        <div className="ds-content">
          {allowed.includes(active)
            ? getView(active, role, user)
            : <AccessDenied id={active} />}
        </div>

        {/* Footer */}
        <div style={{ background: '#0d1b2e', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: '#334155' }}>
            2026 Seevora Pvt Ltd. All rights reserved.
          </span>
          <span style={{ fontSize: '0.72rem', color: '#334155' }}>
            Made with love in Indore, India
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Privacy Policy', 'Terms of Service', 'Support'].map(l => (
              <span key={l} style={{ fontSize: '0.72rem', color: '#475569', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
