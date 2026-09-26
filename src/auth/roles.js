/* ============================================================
/* ============================================================
   SEEVORA — Role-Based Access Control (RBAC)
   Add new roles here. The dashboard shell reads this to
   build nav and guard views automatically.
============================================================ */

export const ROLES = {
  ADMIN:            'admin',
  HR:               'hr',
  EMPLOYEE:         'employee',
  MANAGER:          'manager',
  SUPPORT:          'support',
  SALES_DEVELOPER:  'sales_developer',
  DEVELOPER:        'developer',
  SALES:            'sales',
  TELECALLER:       'telecaller',
};

/* ── Permission keys (match nav item IDs in Dashboard) ── */
export const PERMISSIONS = {
  admin: [
    'dashboard',
    'businesses', 'users', 'create-account',
    'leads', 'crm', 'appointments', 'ai-voice-logs', 'whatsapp-logs', 'reviews',
    'subscribers', 'campaigns', 'email-templates', 'scheduled-campaigns', 'email-history', 'ai-agent-config', 'inbound-emails', 'email-ai-agent',
    'task-management', 'project-management', 'time-tracking',
    'audit-logs', 'system-logs', 'security-center',
    'employees', 'attendance', 'leave', 'hr-leave', 'payroll', 'documents',
    'document-verifications',
  ],
  hr: [
    'dashboard',
    'employees', 'attendance', 'leave', 'payroll', 'documents',
    'document-verifications',
  ],
  employee: [
    'dashboard',
    'my-attendance', 'my-leave', 'my-documents',
    'my-tasks', 'document-upload', 'verification-status',
  ],
  manager: [
    'dashboard',
    'team-tasks', 'team-attendance', 'team-leave', 'leads', 'appointments', 'analytics',
    'email-templates', 'campaigns', 'inbound-emails', 'email-ai-agent'
  ],
  support: [
    'dashboard',
    'support-tickets', 'audit-logs', 'system-logs',
  ],
  sales_developer: [
    'dashboard',
    'leads', 'crm', 'appointments', 'ai-voice-logs', 'whatsapp-logs', 'reviews',
    'subscribers', 'campaigns', 'email-templates', 'inbound-emails', 'email-ai-agent',
    'task-management', 'project-management', 'time-tracking',
    'my-attendance', 'my-leave', 'my-documents', 'my-tasks', 'team-tasks', 'verification-status',
  ],
  developer: [
    'dashboard',
    'task-management', 'project-management', 'time-tracking',
    'my-attendance', 'my-leave', 'my-documents', 'my-tasks',
  ],
  sales: [
    'dashboard',
    'leads', 'appointments', 'whatsapp-logs',
    'campaigns', 'email-templates', 'inbound-emails', 'email-ai-agent',
    'my-attendance', 'my-leave', 'my-documents', 'my-tasks',
  ],
  telecaller: [
    'dashboard',
    'leads', 'appointments', 'whatsapp-logs',
    'my-attendance', 'my-leave', 'my-documents', 'my-tasks',
  ],
};

/* ── Role metadata (label, color, badge) ── */
export const ROLE_META = {
  admin:           { label: 'Admin',             color: '#14c9e1', bg: 'rgba(20,201,225,0.1)' },
  hr:              { label: 'HR',                color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  employee:        { label: 'Employee',          color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  manager:         { label: 'Manager',           color: '#f97315', bg: 'rgba(249,115,21,0.1)' },
  support:         { label: 'Support',           color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  sales_developer: { label: 'Sales & Developer', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  developer:       { label: 'Developer',         color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'  },
  sales:           { label: 'Sales',             color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  telecaller:      { label: 'Telecaller',        color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
};

export function hasPermission(role, navId) {
  return (PERMISSIONS[role] || []).includes(navId);
}
