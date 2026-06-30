/* ============================================================
   SEEVORA — Role-Based Access Control (RBAC)
   Add new roles here. The dashboard shell reads this to
   build nav and guard views automatically.
============================================================ */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN:       'admin',
  HR:          'hr',
  MANAGER:     'manager',   // future
  SUPPORT:     'support',   // future
};

/* ── Permission keys (match nav item IDs in Dashboard) ── */
export const PERMISSIONS = {
  super_admin: [
    'dashboard',
    // Platform
    'businesses', 'users', 'support-tickets',
    // Operations
    'leads', 'appointments', 'ai-voice-logs', 'whatsapp-logs', 'reviews',
    // System
    'audit-logs', 'security-center', 'analytics', 'settings',
    // HR (super admin sees everything)
    'employees', 'attendance', 'leave', 'recruitment', 'payroll', 'documents',
  ],
  admin: [
    'dashboard',
    'businesses', 'users', 'support-tickets',
    'leads', 'appointments', 'ai-voice-logs', 'whatsapp-logs', 'reviews',
    'audit-logs', 'security-center', 'analytics', 'settings',
  ],
  hr: [
    'dashboard',
    'employees', 'attendance', 'leave', 'recruitment', 'payroll', 'documents',
  ],
  manager: [
    'dashboard',
    'leads', 'appointments', 'analytics',
  ],
  support: [
    'dashboard',
    'support-tickets', 'audit-logs',
  ],
};

/* ── Role metadata (label, color, badge) ── */
export const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#9e3cec', bg: 'rgba(158,60,236,0.1)' },
  admin:       { label: 'Admin',       color: '#14c9e1', bg: 'rgba(20,201,225,0.1)' },
  hr:          { label: 'HR',          color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  manager:     { label: 'Manager',     color: '#f97315', bg: 'rgba(249,115,21,0.1)' },
  support:     { label: 'Support',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

/* ── Demo users (replace with real API auth later) ── */
export const DEMO_USERS = [
  { id: 1, name: 'Seevora Admin',     email: 'admin@seevora.in',    password: 'admin123',   role: 'super_admin', avatar: 'AD' },
  { id: 3, name: 'Seevora HR',        email: 'hr@seevora.in',       password: 'hr123',      role: 'hr',          avatar: 'HR' },
];

/* ── Auth helpers ── */
export function login(email, password) {
  const user = DEMO_USERS.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (user) {
    const session = { ...user };
    delete session.password;
    sessionStorage.setItem('seevora_session', JSON.stringify(session));
    return { success: true, user: session };
  }
  return { success: false, error: 'Invalid credentials' };
}

export function logout() {
  sessionStorage.removeItem('seevora_session');
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem('seevora_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasPermission(role, navId) {
  return (PERMISSIONS[role] || []).includes(navId);
}
