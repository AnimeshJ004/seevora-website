import React, { useState, useEffect } from 'react';
import logoIcon from '../../assets/logo-icon.png';
import { PERMISSIONS, ROLE_META, hasPermission } from '../../auth/roles';
import { apiFetch } from '../../auth/api';
import './Dashboard.css';

// Admin views
import AdminDashboard from './views/admin/AdminDashboard';
import Businesses from './views/platform/Businesses';
import Users from './views/platform/Users';
import SupportTickets from './views/admin/SupportTickets';
import CRMLeads from './views/admin/CRMLeads';
import Appointments from './views/operations/Appointments';
import AIVoiceLogs from './views/admin/AIVoiceLogs';
import WhatsAppLogs from './views/admin/WhatsAppLogs';
import Subscribers from './views/admin/Subscribers';
import Campaigns from './views/admin/Campaigns';
import EmailTemplates from './views/admin/EmailTemplates';
import InboundEmails from './views/admin/InboundEmails';
import Reviews from './views/operations/Reviews';
import AuditLogs from './views/admin/AuditLogs';
import SecurityCenter from './views/system/SecurityCenter';
import Analytics from './views/admin/Analytics';
import EmailAgentDashboard from '../admin/EmailAgentDashboard';

import CreateAccount from './views/admin/CreateAccount';

// HR views
import HRDashboard from './views/hr/HRDashboard';
import Employees from './views/hr/Employees';
import Attendance from './views/hr/Attendance';
import Leave from './views/hr/Leave';
import Recruitment from './views/hr/Recruitment';
import Payroll from './views/hr/Payroll';
import Documents from './views/hr/Documents';
import DocumentVerifications from './views/hr/DocumentVerifications';

// Employee views
import DocumentUpload from './views/employee/DocumentUpload';
import VerificationStatus from './views/employee/VerificationStatus';
import MyTasks from './views/employee/MyTasks';
import MyAttendance from './views/employee/MyAttendance';
import TeamTasks from './views/manager/TeamTasks';
import TeamAttendance from './views/manager/TeamAttendance';
import TeamLeave from './views/manager/TeamLeave';
import ProjectManagement from './views/productivity/ProjectManagement';
import TaskManagement from './views/productivity/TaskManagement';
import TimeTracking from './views/productivity/TimeTracking';

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
  dashboard: <Ic d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
  businesses: <Ic d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
  users: <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />,
  'create-account': <Ic d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 8v6 M17 11h6" />,
  'support-tickets': <Ic d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  leads: <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />,
  appointments: <Ic d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18" />,
  'ai-voice-logs': <Ic d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" />,
  'whatsapp-logs': <Ic d="M21 11.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0z" />,
  subscribers: <Ic d="M4 4h16v16H4z M22 6l-10 7L2 6" />,
  campaigns: <Ic d="M3 11l18-8-8 18-2-7-8-3z" />,
  'email-templates': <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5" />,
  reviews: <Ic d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />,
  'audit-logs': <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4" />,
  'security-center': <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  'email-bot': <Ic d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6" />,
  'inbound-emails': <Ic d="M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />,
  'email-ai-agent': <Ic d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />,
  analytics: <Ic d="M18 20V10 M12 20V4 M6 20v-6 M2 20h20" />,
  employees: <Ic d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
  attendance: <Ic d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01" />,
  leave: <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  recruitment: <Ic d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />,
  payroll: <Ic d="M12 2v20 M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />,
  documents: <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8" />,
  'document-verifications': <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  'my-attendance': <Ic d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01" />,
  'my-leave': <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  'my-documents': <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8" />,
  'my-tasks': <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  'team-tasks': <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  'team-leave': <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  'document-upload': <Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />,
  'verification-status': <Ic d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" />,
  'task-management': <Ic d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  'project-management': <Ic d="M3 3h18v18H3z M9 3v18 M15 3v18" />,
  'time-tracking': <Ic d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2" />,
  'team-attendance': <Ic d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01" />,
};

/* ── Nav structure ── */
const NAV = {
  admin: [
    { label: 'Platform', items: [{ id: 'dashboard', label: 'Dashboard' }, { id: 'businesses', label: 'Businesses' }, { id: 'users', label: 'Users & Roles' }] },
    { label: 'Operations', items: [{ id: 'leads', label: 'CRM / Leads' }, { id: 'appointments', label: 'Appointments' }, { id: 'ai-voice-logs', label: 'AI Voice Agent' }, { id: 'whatsapp-logs', label: 'WhatsApp Marketing' }] },
    { label: 'Email Bot', items: [{ id: 'email-templates', label: 'Email Templates' }, { id: 'campaigns', label: 'Campaigns' }, { id: 'inbound-emails', label: 'Email Inbox' }, { id: 'email-ai-agent', label: 'Email AI Agent' }] },
    { label: 'Productivity', items: [{ id: 'task-management', label: 'Task Management' }, { id: 'project-management', label: 'Project Management' }, { id: 'time-tracking', label: 'Time Tracking' }] },
    { label: 'System', items: [{ id: 'audit-logs', label: 'Audit Logs' }, { id: 'security-center', label: 'Security Center' }] },
    { label: 'HR Module', items: [{ id: 'employees', label: 'Employees' }, { id: 'attendance', label: 'Attendance' }, { id: 'payroll', label: 'Payroll' }, { id: 'documents', label: 'Documents' }, { id: 'document-verifications', label: 'Doc Verifications' }] },
  ],
  hr: [
    { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard' }] },
    { label: 'People', items: [{ id: 'employees', label: 'Employees' }, { id: 'attendance', label: 'Attendance' }, { id: 'leave', label: 'Leave Management' }] },
    { label: 'Talent & Finance', items: [{ id: 'payroll', label: 'Payroll' }, { id: 'documents', label: 'Documents' }] },
    { label: 'Verification', items: [{ id: 'document-verifications', label: 'Doc Verifications' }] },
  ],
  employee: [
    { label: 'Workspace', items: [{ id: 'dashboard', label: 'Dashboard' }] },
    { label: 'Verification', items: [{ id: 'verification-status', label: 'Verification Status' }] },
    { label: 'Self Service', items: [{ id: 'my-attendance', label: 'My Attendance' }, { id: 'my-leave', label: 'My Leave' }, { id: 'my-documents', label: 'My Documents' }, { id: 'my-tasks', label: 'My Tasks' }] },
  ],
  manager: [
    { label: 'Work', items: [{ id: 'dashboard', label: 'Dashboard' }, { id: 'team-tasks', label: 'Team Tasks' }, { id: 'team-attendance', label: 'Team Attendance' }, { id: 'team-leave', label: 'Team Leave' }, { id: 'leads', label: 'Leads' }, { id: 'appointments', label: 'Appointments' }, { id: 'analytics', label: 'Analytics' }] },
    { label: 'Email Bot', items: [{ id: 'email-templates', label: 'Email Templates' }, { id: 'campaigns', label: 'Campaigns' }, { id: 'inbound-emails', label: 'Email Inbox' }, { id: 'email-ai-agent', label: 'Email AI Agent' }] },
  ],
  support: [
    { label: 'Work', items: [{ id: 'dashboard', label: 'Dashboard' }, { id: 'support-tickets', label: 'Support Tickets' }, { id: 'audit-logs', label: 'Audit Requests' }] },
  ],
};

const TITLES = {
  dashboard: 'Dashboard', businesses: 'Businesses', users: 'Users & Roles', 'create-account': 'Create Account',
  'support-tickets': 'Support Tickets', leads: 'CRM / Leads', appointments: 'Appointments',
  'ai-voice-logs': 'AI Voice Agent', 'whatsapp-logs': 'WhatsApp Marketing', reviews: 'Reputation', 'audit-logs': 'Audit Requests', 'security-center': 'Security Center', analytics: 'Analytics',
  subscribers: 'Subscribers', campaigns: 'Email Campaigns', 'email-templates': 'Email Templates', 'inbound-emails': 'Email Inbox', 'email-ai-agent': 'Email AI Agent',
  employees: 'Employees', attendance: 'Attendance', leave: 'Leave Management',
  recruitment: 'Recruitment', payroll: 'Payroll', documents: 'Employee Documents',
  'document-verifications': 'Document Verifications',
  'my-attendance': 'My Attendance', 'my-leave': 'My Leave', 'my-documents': 'My Documents',
  'my-tasks': 'My Tasks', 'team-tasks': 'Team Tasks', 'team-attendance': 'Team Attendance', 'team-leave': 'Team Leave',
  'document-upload': 'Document Upload', 'verification-status': 'Verification Status',
  'task-management': 'Task Management', 'project-management': 'Project Management', 'time-tracking': 'Time Tracking',
};

const ACCENT = {
  admin: { c: '#4f8ef7', bg: 'rgba(79,142,247,0.15)' },
  hr: { c: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  employee: { c: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  manager: { c: '#f97316', bg: 'rgba(249,115,21,0.15)' },
  support: { c: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
};

/* ── Verification status set — always accessible even if not verified ── */
const ALWAYS_ALLOWED_EMPLOYEE = new Set(['document-upload', 'verification-status']);

function employeeNeedsVerification(role, verificationStatus) {
  if (role !== 'employee') return false;
  return verificationStatus !== 'VERIFIED';
}

function getView(id, role, user, onNavigate, canNavigate) {
  // Employee-specific new views
  if (role === 'employee' && id === 'document-upload') return <DocumentUpload user={user} />;
  if (role === 'employee' && id === 'verification-status') return <VerificationStatus user={user} />;

  if (id === 'dashboard' && role === 'employee') return <EmployeeDashboard user={user} onNavigate={onNavigate} />;
  if (id === 'dashboard' && role === 'manager') return <ManagerDashboard user={user} onNavigate={onNavigate} canNavigate={canNavigate} />;
  if (role === 'employee' && id === 'my-attendance') return <MyAttendance user={user} />;
  if (role === 'employee' && id === 'my-leave') return <EmployeeLeaveView user={user} />;
  if (role === 'employee' && id === 'my-documents') return <EmployeeDocumentsView user={user} onNavigate={onNavigate} />;
  if (role === 'employee' && id === 'my-tasks') return <MyTasks user={user} />;
  if (role === 'manager' && id === 'team-tasks') return <TeamTasks user={user} />;
  if (role === 'manager' && id === 'team-attendance') return <TeamAttendance user={user} />;
  if (role === 'manager' && id === 'team-leave') return <TeamLeave user={user} />;
  if (id === 'dashboard') return role === 'hr' ? <HRDashboard user={user} onNavigate={onNavigate} canNavigate={canNavigate} /> : <AdminDashboard user={user} onNavigate={onNavigate} canNavigate={canNavigate} />;
  // HR verification view
  if (id === 'document-verifications') return <DocumentVerifications />;

  const map = {
    businesses: <Businesses user={user} />, users: <Users user={user} />, 'create-account': <CreateAccount user={user} />, 'support-tickets': <SupportTickets />,
    leads: <CRMLeads user={user} />, appointments: <Appointments user={user} />, 'ai-voice-logs': <AIVoiceLogs />,
    'whatsapp-logs': <WhatsAppLogs />, subscribers: <Subscribers />, campaigns: <Campaigns />, 'email-templates': <EmailTemplates />, 'inbound-emails': <InboundEmails />,
    'email-ai-agent': <EmailAgentDashboard />,
    reviews: <Reviews user={user} />, 'audit-logs': <AuditLogs user={user} />,
    'security-center': <SecurityCenter user={user} />, analytics: <Analytics />,
    employees: <Employees user={user} />, attendance: <Attendance />, leave: <Leave />,
    recruitment: <Recruitment />, payroll: <Payroll />, documents: <Documents />,
    'project-management': <ProjectManagement user={user} />, 'task-management': <TaskManagement user={user} />, 'time-tracking': <TimeTracking user={user} />
  };
  return map[id] || <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>View coming soon.</div>;
}

function ManagerDashboard({ user, onNavigate, canNavigate }) {
  const name = user?.name || user?.username || 'Manager';
  const [summary, setSummary] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const [response, leaveResponse] = await Promise.all([
          apiFetch('/api/analytics/manager'),
          apiFetch('/api/manager/leaves/summary'),
        ]);
        const result = await response.json().catch(() => ({}));
        const leaveResult = await leaveResponse.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || 'Unable to load manager analytics.');
        if (!leaveResponse.ok) throw new Error(leaveResult.message || 'Unable to load team leave summary.');
        if (!cancelled) {
          setSummary(result.summary || {});
          setLeaveSummary(leaveResult || {});
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = [
    { label: 'Leads', value: summary?.leadsTotal ?? '...', note: `${summary?.followUpsDue ?? 0} follow-ups due`, target: 'leads' },
    { label: 'Appointments', value: summary?.appointmentsUpcoming ?? '...', note: 'Upcoming client meetings', target: 'appointments' },
    { label: 'Team Tasks', value: summary?.tasksOpen ?? '...', note: 'Open operational follow-ups', target: 'team-tasks' },
    { label: 'Team Leave', value: leaveSummary?.pending ?? '...', note: `${leaveSummary?.onLeaveToday ?? 0} on leave today`, target: 'team-leave' },
  ];
  const navigateIfAllowed = (target) => canNavigate?.(target) ? () => onNavigate?.(target) : undefined;

  return (
    <div style={{ color: '#475569', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.7rem', color: '#0f172a', marginBottom: 4 }}>
          Manager Workspace
        </h2>
        <p style={{ fontSize: '0.9rem' }}>Welcome, {name}. Review team activity, leads, appointments, and performance from one place.</p>
      </div>
      {error && (
        <div style={{ marginBottom: 14, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '10px 12px', fontSize: '0.82rem', fontWeight: 700 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 18 }}>
        {metrics.map((metric) => (
          <RoleMetricCard key={metric.label} {...metric} color="#f97316" onClick={navigateIfAllowed(metric.target)} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <RolePanel
          title="Operational Focus"
          items={[
            { label: 'Lead follow-ups pending manager review', target: 'leads' },
            { label: 'Appointments needing confirmation', target: 'appointments' },
            { label: 'Pending leave requests awaiting your review', target: 'team-leave' },
          ]}
          onNavigate={onNavigate}
          canNavigate={canNavigate}
        />
        <RolePanel
          title="Manager Access"
          items={[
            { label: 'CRM / Leads', target: 'leads' },
            { label: 'Appointments', target: 'appointments' },
            { label: 'Team Leave', target: 'team-leave' },
            { label: 'Analytics', target: 'analytics' },
            { label: 'Email AI Agent', target: 'email-ai-agent' },
          ]}
          onNavigate={onNavigate}
          canNavigate={canNavigate}
        />
      </div>
    </div>
  );
}

function EmployeeDashboard({ user, onNavigate }) {
  const name = user?.name || user?.username || 'Employee';
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const response = await apiFetch('/api/productivity/tasks');
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load tasks.');
        }
        if (!cancelled) {
          setTasks(Array.isArray(data) ? data : []);
          setTaskError('');
        }
      } catch (err) {
        if (!cancelled) {
          setTaskError(err.message || 'Failed to load tasks');
          setTasks([]);
        }
      } finally {
        if (!cancelled) setIsLoadingTasks(false);
      }
    }

    loadTasks();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate task metrics
  const todoTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === 'todo').length : 0;
  const inProgressTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === 'in_progress').length : 0;
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;

  // Get recent tasks (max 5, sorted by due date and priority)
  const recentTasks = Array.isArray(tasks) && tasks.length > 0 ? [...tasks]
    .sort((a, b) => {
      // Priority sorting: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (earliest first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 5) : [];

  const handleTaskClick = () => {
    if (onNavigate) {
      onNavigate('my-tasks');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'low': return '#10b981';
      default: return '#f59e0b';
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ color: '#475569', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
        <RoleMetricCard label="Attendance" value="0" note="Records available after HR sync" color="#10b981" onClick={() => onNavigate?.('my-attendance')} />
        <RoleMetricCard label="Leave Balance" value="0" note="Balances managed by HR" color="#10b981" onClick={() => onNavigate?.('my-leave')} />
        <RoleMetricCard label="Documents" value="0" note="Uploaded documents" color="#10b981" onClick={() => onNavigate?.('my-documents')} />
        <RoleMetricCard 
          label="My Tasks" 
          value={isLoadingTasks ? '...' : String(totalTasks)} 
          note={isLoadingTasks ? 'Loading...' : `${todoTasks} to do, ${inProgressTasks} in progress`} 
          color="#6366f1" 
          onClick={handleTaskClick}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 16, marginBottom: 18 }}>
        {/* Recent Tasks Panel */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', margin: 0 }}>
              Recent Tasks
            </h3>
            <button
              onClick={handleTaskClick}
              style={{
                background: 'none',
                border: '1px solid #e2e8f0',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#6366f1',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.target.style.background = '#f1f5f9'; }}
              onMouseOut={(e) => { e.target.style.background = 'none'; }}
            >
              View All Tasks →
            </button>
          </div>

          {isLoadingTasks ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>
              Loading your tasks...
            </div>
          ) : taskError ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444', fontSize: '0.85rem' }}>
              {taskError}
            </div>
          ) : recentTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>No tasks assigned yet</div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 4 }}>New tasks will appear here</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={handleTaskClick}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 16px',
                    background: '#fafbfc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fafbfc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 4 }}>
                        {task.title}
                      </div>
                      {task.project_name && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>
                          📁 {task.project_name}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        background: getPriorityColor(task.priority),
                        color: '#fff',
                        fontSize: '0.65rem',
                        padding: '3px 8px',
                        borderRadius: 6,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        marginLeft: 10,
                        flexShrink: 0,
                      }}
                    >
                      {task.priority || 'medium'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                    <span style={{ color: '#64748b' }}>
                      {formatDueDate(task.due_date)}
                    </span>
                    <span
                      style={{
                        background: task.status === 'done' ? '#10b981' : task.status === 'in_progress' ? '#f59e0b' : '#94a3b8',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {task.status === 'todo' ? 'To Do' : task.status === 'in_progress' ? 'In Progress' : 'Done'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Welcome Panel */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', marginBottom: 10 }}>
            Employee Workspace
          </div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.5rem', color: '#0f172a', marginBottom: 12 }}>
            Welcome, {name}
          </h2>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#64748b', marginBottom: 20 }}>
            Your employee account is active. Track your tasks, attendance, and documents from your workspace.
          </p>
          
          <div style={{ display: 'grid', gap: 8 }}>
            <QuickLink label="My Tasks" icon="✓" onClick={handleTaskClick} />
            <QuickLink label="My Attendance" icon="📅" onClick={() => onNavigate && onNavigate('my-attendance')} />
            <QuickLink label="My Documents" icon="📄" onClick={() => onNavigate && onNavigate('my-documents')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#f1f5f9';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = '#f8fafc';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      {label}
    </button>
  );
}

const EMPLOYEE_LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave', key: 'casual', color: '#6366f1' },
  { value: 'sick', label: 'Sick Leave', key: 'sick', color: '#10b981' },
  { value: 'annual', label: 'Annual Leave', key: 'annual', color: '#f97316' },
  { value: 'comp_off', label: 'Comp Off', key: 'compOff', color: '#8b5cf6' },
];

const EMPLOYEE_MONTHLY_LEAVE_ALLOWANCE = 2;
const EMPLOYEE_YEARLY_LEAVE_ALLOWANCE = EMPLOYEE_MONTHLY_LEAVE_ALLOWANCE * 12;

const EMPLOYEE_LEAVE_STATUS = {
  pending: { label: 'Pending', bg: 'rgba(249,115,22,0.12)', color: '#c2410c' },
  approved: { label: 'Approved', bg: 'rgba(16,185,129,0.12)', color: '#047857' },
  rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.12)', color: '#b91c1c' },
};

function EmployeeLeaveView({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });

  const showToast = (value) => {
    setToast(value);
    setTimeout(() => setToast(''), 3500);
  };

  const loadLeaves = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/employee/leaves');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to load leave details.');
      setLeaves(Array.isArray(data.leaves) ? data.leaves : []);
      setPolicy(data.policy || null);
      setMessage(data.message || '');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load leave details.');
      setLeaves([]);
      setPolicy(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const calculateDays = () => {
    if (!form.fromDate || !form.toDate) return 0;
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    return Math.ceil((to - from) / 86400000) + 1;
  };

  const handleApply = async (event) => {
    event.preventDefault();
    const days = calculateDays();
    if (!form.fromDate || !form.toDate || days < 1) {
      showToast('Select a valid leave date range.');
      return;
    }
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    if (from.getFullYear() !== to.getFullYear() || from.getMonth() !== to.getMonth()) {
      showToast('Please apply leave within a single month.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch('/api/employee/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to submit leave request.');
      showToast(data.message || 'Leave request submitted.');
      setForm({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
      await loadLeaves();
    } catch (err) {
      showToast(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSaving(false);
    }
  };

  const visiblePolicy = policy || {
    monthly: { entitlement: EMPLOYEE_MONTHLY_LEAVE_ALLOWANCE, used: 0, remaining: EMPLOYEE_MONTHLY_LEAVE_ALLOWANCE },
    yearly: { entitlement: EMPLOYEE_YEARLY_LEAVE_ALLOWANCE, used: 0, remaining: EMPLOYEE_YEARLY_LEAVE_ALLOWANCE },
  };

  const statusCounts = leaves.reduce((acc, leave) => {
    acc[leave.status] = (acc[leave.status] || 0) + 1;
    return acc;
  }, {});

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: 10, fontSize: '0.84rem', color: '#0f172a',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ color: '#475569', fontFamily: "'Inter',sans-serif", position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#0f172a', color: '#fff', borderRadius: 10, padding: '12px 16px', fontSize: '0.84rem', fontWeight: 700, boxShadow: '0 12px 30px rgba(15,23,42,0.22)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0f172a', marginBottom: 4 }}>
            My Leave
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{user?.name || user?.username || 'Employee'} · Track balances and leave requests.</p>
        </div>
        {policy && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <LeaveSummaryPill label="Pending" value={statusCounts.pending || 0} color="#f97316" />
            <LeaveSummaryPill label="Approved" value={statusCounts.approved || 0} color="#10b981" />
            <LeaveSummaryPill label="Monthly Left" value={visiblePolicy.monthly.remaining} color="#6366f1" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, textAlign: 'center', color: '#94a3b8' }}>
          Loading leave details...
        </div>
      ) : error ? (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: 20, color: '#9a3412', fontSize: '0.88rem', fontWeight: 700 }}>
          {error}
        </div>
      ) : (
        <>
          {message && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, color: '#1d4ed8', fontSize: '0.84rem', fontWeight: 700, marginBottom: 18 }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 18 }}>
            <EmployeeLeavePolicyCard
              label="Monthly Leave"
              value={visiblePolicy.monthly.remaining}
              note={`${visiblePolicy.monthly.used}/${visiblePolicy.monthly.entitlement} used this month`}
              color="#6366f1"
            />
            <EmployeeLeavePolicyCard
              label="Monthly Allowance"
              value={visiblePolicy.monthly.entitlement}
              note="Company policy per month"
              color="#10b981"
            />
            <EmployeeLeavePolicyCard
              label="Yearly Leave"
              value={visiblePolicy.yearly.remaining}
              note={`${visiblePolicy.yearly.used}/${visiblePolicy.yearly.entitlement} used this year`}
              color="#f97316"
            />
            <EmployeeLeavePolicyCard
              label="Yearly Allowance"
              value={visiblePolicy.yearly.entitlement}
              note="2 leaves x 12 months"
              color="#8b5cf6"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.8fr)', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 14 }}>Leave Requests</h3>
              {leaves.length === 0 ? (
                <div style={{ padding: '34px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem', border: '1px dashed #cbd5e1', borderRadius: 12 }}>
                  No leave requests yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {leaves.map((leave) => {
                    const status = EMPLOYEE_LEAVE_STATUS[leave.status] || { label: leave.status || 'Unknown', bg: '#f1f5f9', color: '#64748b' };
                    return (
                      <div key={leave.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '13px 14px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', textTransform: 'capitalize' }}>
                              {String(leave.type || '').replace(/_/g, ' ')}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 3 }}>
                              {leave.from} to {leave.to} · {leave.days} day{leave.days === 1 ? '' : 's'}
                            </div>
                          </div>
                          <span style={{ borderRadius: 999, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 800, background: status.bg, color: status.color, whiteSpace: 'nowrap' }}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleApply} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 14 }}>Apply Leave</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>
                  Leave Type
                  <select value={form.leaveType} onChange={(event) => setForm((prev) => ({ ...prev, leaveType: event.target.value }))} style={inputStyle}>
                    {EMPLOYEE_LEAVE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'grid', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>
                    From
                    <input type="date" value={form.fromDate} onChange={(event) => setForm((prev) => ({ ...prev, fromDate: event.target.value }))} style={inputStyle} />
                  </label>
                  <label style={{ display: 'grid', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>
                    To
                    <input type="date" value={form.toDate} onChange={(event) => setForm((prev) => ({ ...prev, toDate: event.target.value }))} style={inputStyle} />
                  </label>
                </div>
                <label style={{ display: 'grid', gap: 6, fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>
                  Reason
                  <textarea value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} rows={4} placeholder="Optional reason" style={{ ...inputStyle, resize: 'vertical' }} />
                </label>
                <button type="submit" disabled={isSaving} style={{ marginTop: 4, padding: '10px 16px', border: 'none', borderRadius: 999, background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.82rem', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.72 : 1 }}>
                  {isSaving ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function LeaveSummaryPill({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
      <span style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 700 }}>{label}</span>
      <span style={{ color: '#0f172a', fontSize: '0.82rem', fontWeight: 900 }}>{value}</span>
    </div>
  );
}

function EmployeeLeavePolicyCard({ label, value, note, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: 8 }}>{label}</div>
      <div style={{ color, fontSize: '0.74rem', fontWeight: 700, marginTop: 8 }}>{note}</div>
    </div>
  );
}

const EMPLOYEE_DOCUMENT_STATUS = {
  PENDING: { label: 'Pending Review', bg: 'rgba(234,179,8,0.12)', color: '#ca8a04' },
  VERIFIED: { label: 'Verified', bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  REJECTED: { label: 'Rejected', bg: 'rgba(239,68,68,0.12)', color: '#dc2626' },
};

function EmployeeDocumentsView({ user, onNavigate }) {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        const response = await apiFetch('/api/employee/documents/my-documents');
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Unable to load documents.');
        if (!cancelled) {
          setDocuments(Array.isArray(data.documents) ? data.documents : []);
          setMessage(data.message || '');
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load documents.');
          setDocuments([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = documents.reduce((acc, doc) => {
    const status = doc.status || 'PENDING';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ color: '#475569', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0f172a', marginBottom: 4 }}>
            My Documents
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{user?.name || user?.username || 'Employee'} · View uploaded documents and HR verification status.</p>
        </div>
        <button
          onClick={() => onNavigate?.('document-upload')}
          style={{ padding: '9px 18px', border: 'none', borderRadius: 999, background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Upload Documents
        </button>
      </div>

      {isLoading ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, textAlign: 'center', color: '#94a3b8' }}>
          Loading documents...
        </div>
      ) : error ? (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: 20, color: '#9a3412', fontSize: '0.88rem', fontWeight: 700 }}>
          {error}
        </div>
      ) : (
        <>
          {message && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, color: '#1d4ed8', fontSize: '0.84rem', fontWeight: 700, marginBottom: 18 }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 18 }}>
            <EmployeeDocumentStat label="Uploaded" value={documents.length} note="Total documents" color="#6366f1" />
            <EmployeeDocumentStat label="Verified" value={counts.VERIFIED || 0} note="Approved by HR" color="#10b981" />
            <EmployeeDocumentStat label="Pending" value={counts.PENDING || 0} note="Awaiting review" color="#f97316" />
            <EmployeeDocumentStat label="Rejected" value={counts.REJECTED || 0} note="Needs re-upload" color="#ef4444" />
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 14 }}>Uploaded Documents</h3>
            {documents.length === 0 ? (
              <div style={{ padding: '34px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem', border: '1px dashed #cbd5e1', borderRadius: 12 }}>
                <div style={{ fontWeight: 800, color: '#64748b', marginBottom: 6 }}>No documents uploaded yet.</div>
                <button
                  onClick={() => onNavigate?.('document-upload')}
                  style={{ marginTop: 10, padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 999, background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Upload Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {documents.map((doc) => {
                  const status = EMPLOYEE_DOCUMENT_STATUS[doc.status] || EMPLOYEE_DOCUMENT_STATUS.PENDING;
                  return (
                    <div key={doc.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '13px 14px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', textTransform: 'capitalize' }}>
                          {String(doc.docType || 'document').replace(/_/g, ' ')}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 3, overflowWrap: 'anywhere' }}>
                          {doc.fileName || 'Uploaded file'}
                          {doc.uploadedAt ? ` · ${new Date(doc.uploadedAt).toLocaleDateString('en-IN')}` : ''}
                          {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                        </div>
                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <div style={{ marginTop: 8, color: '#b91c1c', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '7px 10px', fontSize: '0.76rem', lineHeight: 1.45 }}>
                            {doc.rejectionReason}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ borderRadius: 999, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 800, background: status.bg, color: status.color, whiteSpace: 'nowrap' }}>
                          {status.label}
                        </span>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', border: '1px solid #e2e8f0', borderRadius: 999, padding: '5px 12px', color: '#0f172a', background: '#fff', fontSize: '0.76rem', fontWeight: 800 }}
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmployeeDocumentStat({ label, value, note, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: 8 }}>{label}</div>
      <div style={{ color, fontSize: '0.74rem', fontWeight: 700, marginTop: 8 }}>{note}</div>
    </div>
  );
}

function formatFileSize(size) {
  const bytes = Number(size || 0);
  if (!bytes) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
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

function RoleMetricCard({ label, value, note, color, onClick }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        outline: 'none',
      }}
    >
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: 8 }}>{label}</div>
      <div style={{ color, fontSize: '0.74rem', fontWeight: 700, marginTop: 8 }}>{note}</div>
    </div>
  );
}

function RolePanel({ title, items, onNavigate, canNavigate }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 14 }}>{title}</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => {
          const label = typeof item === 'string' ? item : item.label;
          const itemTarget = typeof item === 'string' ? null : item.target;
          const target = itemTarget && (!canNavigate || canNavigate(itemTarget)) ? itemTarget : null;
          return (
          <div
            key={label}
            role={target ? 'button' : undefined}
            tabIndex={target ? 0 : undefined}
            onClick={() => target && onNavigate?.(target)}
            onKeyDown={(event) => {
              if (target && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onNavigate?.(target);
              }
            }}
            style={{
              border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 12px',
              color: '#475569', fontSize: '0.84rem', background: '#f8fafc',
              cursor: target ? 'pointer' : 'default', outline: 'none',
            }}
          >
            {label}
          </div>
        )})}
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
      <p>You don't have permission to view <strong style={{ color: '#e2e8f0' }}>{TITLES[id]}</strong>.<br />Contact your Admin.</p>
    </div>
  );
}

/* ── Verification Restriction Banner ── */
function VerificationBanner({ status, onNavigate }) {
  const configs = {
    PENDING_VERIFICATION: {
      bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.35)', color: '#b45309',
      icon: '⏳', title: 'Account Not Verified Yet',
      msg: 'Your account is not verified by HR yet. Please upload your documents and wait for approval.',
      cta: 'Upload Documents', ctaTarget: 'document-upload',
    },
    DOCUMENT_SUBMITTED: {
      bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.35)', color: '#1d4ed8',
      icon: '📋', title: 'Verification In Progress',
      msg: 'Your documents have been submitted. HR is currently reviewing them. Please check back soon.',
      cta: 'View Status', ctaTarget: 'verification-status',
    },
    REJECTED: {
      bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', color: '#b91c1c',
      icon: '❌', title: 'Documents Rejected',
      msg: 'Your documents were rejected by HR. Please check the reason and upload again.',
      cta: 'Re-upload Documents', ctaTarget: 'document-upload',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 14, padding: '14px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{cfg.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: cfg.color, fontSize: '0.9rem', marginBottom: 2 }}>{cfg.title}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cfg.msg}</div>
      </div>
      <button
        onClick={() => onNavigate(cfg.ctaTarget)}
        style={{
          padding: '8px 18px', borderRadius: 100, border: 'none',
          background: cfg.color, color: '#fff',
          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {cfg.cta}
      </button>
    </div>
  );
}

export default function DashboardShell({ user, onLogout }) {
  const role = user?.role === 'super_admin' ? 'admin' : (user?.role || 'admin');
  const meta = ROLE_META[role] || ROLE_META.admin;
  const accent = ACCENT[role] || ACCENT.admin;
  const allowed = PERMISSIONS[role] || [];
  const navGroups = NAV[role] || NAV.admin;
  const verificationStatus = user?.verificationStatus || 'PENDING_VERIFICATION';
  const needsVerification = employeeNeedsVerification(role, verificationStatus);

  const defaultView = allowed[0] || 'dashboard';
  const [active, setActive] = useState(defaultView);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Document Verification', body: 'Vashu uploaded Aadhaar Card for verification.', time: '10 mins ago', unread: true },
    { id: 2, title: 'Leave Application', body: 'Animesh Jain requested annual leave for 3 days.', time: '2 hours ago', unread: true },
    { id: 3, title: 'System Notice', body: 'Database maintenance scheduled for Sunday.', time: '1 day ago', unread: true },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = (e) => {
    e.stopPropagation();
    setShowProfileMenu(prev => !prev);
    setShowNotifications(false);
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleNavClick = (id) => {
    if (allowed.includes(id)) {
      setActive(id);
      setIsMobileNavOpen(false);
    }
  };

  /* Determine what to render in the content area */
  const renderContent = () => {
    if (!allowed.includes(active)) return <AccessDenied id={active} />;

    return getView(active, role, user, handleNavClick, (id) => allowed.includes(id));
  };

  return (
    <div className={`ds-layout${isMobileNavOpen ? ' ds-layout--nav-open' : ''}`}>

      {/* ── Sidebar ── */}
      {isMobileNavOpen && <button className="ds-mobile-backdrop" aria-label="Close navigation" onClick={() => setIsMobileNavOpen(false)} />}
      <aside className="ds-sidebar">
        {/* Logo */}
        <div className="ds-sidebar-logo">
          <img src={logoIcon} alt="Seevora" />
          <div>
            <span className="ds-sidebar-logo-text">Seevora</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="ds-nav">
          {navGroups.map(({ label, items }) => (
            <React.Fragment key={label}>
              <span className="ds-nav-group-label">{label}</span>
              {items.map(({ id, label: lbl, badge }) => {
                const isAllowed = allowed.includes(id);
                const isActive = active === id;
                const isLocked = !isAllowed;
                return (
                  <button key={id}
                    className={`ds-nav-item${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`}
                    onClick={() => handleNavClick(id)}
                    title={isLocked ? `No access for ${meta.label}` : lbl}
                    style={{ background: isActive ? '#1e3a5f' : 'none', color: isActive ? accent.c : undefined }}
                  >
                    {NAVICONS[id] || <span style={{ width: 16 }} />}
                    {lbl}
                    {badge && isAllowed && <span className="ds-nav-badge">{badge}</span>}
                    {isLocked && (
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

          <button 
            className="ds-logout-btn" 
            disabled={isLoggingOut}
            style={{ opacity: isLoggingOut ? 0.7 : 1, cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
            onClick={async (e) => {
              if (isLoggingOut) return;
              setIsLoggingOut(true);
              try {
                await onLogout();
              } finally {
                setIsLoggingOut(false);
              }
            }}
          >
            {isLoggingOut ? (
              <span style={{ display: 'inline-block', width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin3d 1s linear infinite' }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ds-main">
        {/* Header */}
        <header className="ds-header">
          <button
            className="ds-hamburger"
            type="button"
            aria-label="Open navigation"
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen(true)}
          >
            <span />
            <span />
            <span />
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
          <div style={{ position: 'relative' }}>
            <button className="ds-icon-btn" onClick={toggleNotifications}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="ds-notif-count">{unreadCount}</span>}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute', top: 48, right: 0, width: 320,
                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                borderRadius: 14, boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
                zIndex: 1000, overflow: 'hidden', color: 'var(--text-primary)',
              }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', fontFamily: "'Outfit', sans-serif" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No new notifications.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--glass-border)',
                        background: n.unread ? 'rgba(16,185,129,0.03)' : 'none',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.unread ? 'var(--accent-green)' : 'transparent', marginTop: 6, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{n.body}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <button className="ds-icon-btn" onClick={() => setShowHelpModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {/* Profile */}
          <div className="ds-header-profile" style={{ cursor: 'default' }}>
            <div className="ds-avatar" style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${accent.c}, #0f172a)`, fontSize: '0.72rem' }}>
              {user?.avatar || 'U'}
            </div>
            <div>
              <div className="ds-header-profile-name">{user?.name}</div>
              <div className="ds-header-profile-role">{meta.label}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="ds-content">
          {/* Support & Chat Modal */}
          {showChatModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(3px)',
            }} onClick={() => setShowChatModal(false)}>
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--glass-border)',
                width: 400, height: 460, display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 64px rgba(0,0,0,0.3)', color: 'var(--text-primary)', overflow: 'hidden',
              }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, var(--accent-green), #0f172a)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '0.92rem', fontWeight: 800 }}>Seevora Assistant</h4>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>Online · Ready to Help</span>
                  </div>
                  <button onClick={() => setShowChatModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ flex: 1, padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'var(--bg-space)', border: '1px solid var(--glass-border)', borderRadius: '12px 12px 12px 0px', padding: 12, fontSize: '0.8rem', maxWidth: '85%', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Hi <strong>{user?.name || 'there'}</strong>! Welcome to Seevora support desk. How can I help you today?
                  </div>
                  <div style={{ background: 'var(--bg-space)', border: '1px solid var(--glass-border)', borderRadius: '12px 12px 12px 0px', padding: 12, fontSize: '0.8rem', maxWidth: '85%', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    You can inquire about:
                    <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
                      • Document Upload status
                      • Attendance tracking guidelines
                      • Payroll & leaves info
                    </div>
                  </div>
                </div>
                <div style={{ padding: 12, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10, background: 'var(--bg-card)' }}>
                  <input placeholder="Type your message..." style={{ flex: 1, padding: '8px 14px', border: '1px solid var(--glass-border)', borderRadius: 100, fontSize: '0.8rem', outline: 'none', background: 'var(--bg-space)', color: 'var(--text-primary)' }} />
                  <button style={{ padding: '8px 18px', background: 'var(--text-primary)', color: '#fff', border: 'none', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => alert('Support message sent successfully!')}>Send</button>
                </div>
              </div>
            </div>
          )}

          {/* Help Center Modal */}
          {showHelpModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(3px)',
            }} onClick={() => setShowHelpModal(false)}>
              <div style={{
                background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--glass-border)',
                width: 460, padding: 26, boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>Support & FAQ Center</h4>
                  <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'grid', gap: 16, lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Q: How do I verify my account?</strong>
                    <div style={{ marginTop: 2 }}>Go to "My Documents", use the upload button, and click "Submit & Upload Rest Later". HR will verify it within 1-2 business days.</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Q: How are leaves calculated?</strong>
                    <div style={{ marginTop: 2 }}>Annual, Sick, and Casual leaves are automatically calculated based on attendance records and updated monthly.</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Q: Who can I contact for issues?</strong>
                    <div style={{ marginTop: 2 }}>Use the Support icon next to help in the header to contact Seevora support instantly.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Restricted employee banner on every page */}
          {needsVerification && active !== 'document-upload' && active !== 'verification-status' && (
            <VerificationBanner status={verificationStatus} onNavigate={(id) => setActive(id)} />
          )}
          {renderContent()}
        </div>

        {/* Footer */}
        <div style={{ background: '#0d1b2e', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: '#334155' }}>
            2026 Seevora Pvt Ltd. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/privacy-policy" style={{ fontSize: '0.72rem', color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Privacy Policy</a>
            <a href="/terms-and-conditions" style={{ fontSize: '0.72rem', color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Terms of Service</a>
            <a href="/faqs" style={{ fontSize: '0.72rem', color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Support</a>
          </div>
        </div>
      </main>
    </div>
  );
}

