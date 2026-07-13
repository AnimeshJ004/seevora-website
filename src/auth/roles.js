/* ============================================================
   SEEVORA — Role-Based Access Control (RBAC)
   Add new roles here. The dashboard shell reads this to
   build nav and guard views automatically.
============================================================ */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN:       'admin',
  HR:          'hr',
  EMPLOYEE:    'employee',
  MANAGER:     'manager',   // future
  SUPPORT:     'support',   // future
};

/* ── Permission keys (match nav item IDs in Dashboard) ── */
export const PERMISSIONS = {
  super_admin: [
    'dashboard',
    // Platform
    'businesses', 'users', 'create-account',
    // Operations & CRM / Marketing
    'leads', 'crm', 'appointments', 'ai-voice-logs', 'whatsapp-logs', 'reviews',
    'subscribers', 'campaigns', 'email-templates', 'scheduled-campaigns', 'email-history', 'ai-agent-config', 'inbound-emails', 'email-ai-agent',
    // Productivity
    'task-management', 'project-management', 'time-tracking',
    // System
    'audit-logs', 'system-logs', 'security-center', 'settings',
    // HR (super admin sees everything)
    'employees', 'attendance', 'leave', 'hr-leave', 'payroll', 'documents',
    'document-verifications',
  ],
  admin: [
    'dashboard',
    'businesses', 'users', 'create-account',
    'leads', 'crm', 'appointments', 'ai-voice-logs', 'whatsapp-logs', 'reviews',
    'subscribers', 'campaigns', 'email-templates', 'scheduled-campaigns', 'email-history', 'ai-agent-config', 'inbound-emails', 'email-ai-agent',
    'task-management', 'project-management', 'time-tracking',
    'audit-logs', 'system-logs', 'security-center', 'settings',
    'employees', 'hr-leave',
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
};

/* ── Role metadata (label, color, badge) ── */
export const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#9e3cec', bg: 'rgba(158,60,236,0.1)' },
  admin:       { label: 'Admin',       color: '#14c9e1', bg: 'rgba(20,201,225,0.1)' },
  hr:          { label: 'HR',          color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  employee:    { label: 'Employee',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  manager:     { label: 'Manager',     color: '#f97315', bg: 'rgba(249,115,21,0.1)' },
  support:     { label: 'Support',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

/* ── Demo users (replace with real API auth later) ── */
export const DEMO_USERS = [
  { id: 1, name: 'Seevora Admin',     email: 'admin@seevora.in',    password: 'admin123',   role: 'super_admin', avatar: 'AD' },
  { id: 3, name: 'Seevora HR',        email: 'hr@seevora.in',       password: 'hr123',      role: 'hr',          avatar: 'HR' },
];

const DEMO_PASSWORD_OVERRIDES_KEY = 'seevora_demo_password_overrides';
const DEMO_RESET_REQUESTS_KEY = 'seevora_demo_reset_requests';

function demoTokenForRole(role) {
  return `demo:${role || 'super_admin'}`;
}

function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getIdentifierAliases(user) {
  const emailAlias = user.email.split('@')[0].toLowerCase();
  const nameAlias = user.name.replace(/\s+/g, '').toLowerCase();
  return new Set([
    user.email.toLowerCase(),
    emailAlias,
    nameAlias,
  ]);
}

export function findDemoUser(identifier) {
  const normalized = String(identifier || '').trim().toLowerCase();
  if (!normalized) return null;

  return DEMO_USERS.find((user) => getIdentifierAliases(user).has(normalized)) || null;
}

export function getDemoPassword(userOrIdentifier) {
  const user = typeof userOrIdentifier === 'string' ? findDemoUser(userOrIdentifier) : userOrIdentifier;
  if (!user) return null;

  const overrides = readStoredJson(DEMO_PASSWORD_OVERRIDES_KEY, {});
  return overrides[user.email.toLowerCase()] || user.password;
}

export function setDemoPassword(identifier, nextPassword) {
  const user = findDemoUser(identifier);
  if (!user) return { success: false, error: 'Account not found.' };

  const overrides = readStoredJson(DEMO_PASSWORD_OVERRIDES_KEY, {});
  overrides[user.email.toLowerCase()] = nextPassword;
  writeStoredJson(DEMO_PASSWORD_OVERRIDES_KEY, overrides);
  return { success: true, user };
}

export function createDemoResetRequest(identifier) {
  const user = findDemoUser(identifier);
  if (!user) return { success: false, error: 'Account not found.' };

  const resetCode = `SV-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const requests = readStoredJson(DEMO_RESET_REQUESTS_KEY, {});
  requests[user.email.toLowerCase()] = {
    code: resetCode,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  writeStoredJson(DEMO_RESET_REQUESTS_KEY, requests);

  return {
    success: true,
    user,
    resetCode,
    expiresInMinutes: 15,
  };
}

export function consumeDemoResetRequest(identifier, resetCode, nextPassword) {
  const user = findDemoUser(identifier);
  if (!user) return { success: false, error: 'Account not found.' };

  const requests = readStoredJson(DEMO_RESET_REQUESTS_KEY, {});
  const entry = requests[user.email.toLowerCase()];
  if (!entry) return { success: false, error: 'No reset code found. Request a new one.' };
  if (entry.expiresAt < Date.now()) {
    delete requests[user.email.toLowerCase()];
    writeStoredJson(DEMO_RESET_REQUESTS_KEY, requests);
    return { success: false, error: 'The reset code has expired. Request a new one.' };
  }
  if (String(entry.code).trim().toUpperCase() !== String(resetCode || '').trim().toUpperCase()) {
    return { success: false, error: 'The reset code is invalid.' };
  }

  const result = setDemoPassword(user.email, nextPassword);
  delete requests[user.email.toLowerCase()];
  writeStoredJson(DEMO_RESET_REQUESTS_KEY, requests);
  return result.success ? { success: true, user } : result;
}

/* ── Auth helpers ── */
export function login(email, password) {
  const user = findDemoUser(email);
  const effectivePassword = user ? getDemoPassword(user) : null;
  const matches = user && effectivePassword === password;
  if (matches) {
    const session = { ...user };
    delete session.password;
    session.token = demoTokenForRole(session.role);
    sessionStorage.setItem('seevora_session', JSON.stringify(session));
    localStorage.setItem('seevoraAuthToken', session.token);
    localStorage.setItem('seevoraUser', JSON.stringify(session));
    return { success: true, user: session };
  }
  return { success: false, error: 'Invalid credentials' };
}

export function logout() {
  sessionStorage.removeItem('seevora_session');
  localStorage.removeItem('seevoraAuthToken');
  localStorage.removeItem('seevoraUser');
}

export function getSession() {
  try {
    const token = localStorage.getItem('seevoraAuthToken');
    /* Prefer the stored user object from real API login */
    const userRaw = localStorage.getItem('seevoraUser');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      if (u && u.role) {
        if (token && !token.startsWith('demo:')) u.token = token;
        else {
          u.token = demoTokenForRole(u.role);
          localStorage.setItem('seevoraAuthToken', u.token);
          localStorage.setItem('seevoraUser', JSON.stringify(u));
        }
        return u;
      }
    }
    const raw = sessionStorage.getItem('seevora_session');
    if (raw) {
      const u = JSON.parse(raw);
      if (token && !token.startsWith('demo:')) u.token = token;
      else if (u?.role) {
        u.token = demoTokenForRole(u.role);
        localStorage.setItem('seevoraAuthToken', u.token);
        localStorage.setItem('seevoraUser', JSON.stringify(u));
      }
      return u;
    }
    return null;
  } catch {
    return null;
  }
}

export function hasPermission(role, navId) {
  return (PERMISSIONS[role] || []).includes(navId);
}
