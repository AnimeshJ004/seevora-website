import { clearCacheNamespace } from './cache.js';

export const CACHE_NAMESPACES = Object.freeze({
  analytics: 'analytics',
  appointments: 'appointments',
  attendanceToday: 'attendance_today',
  auditRequests: 'audit_requests',
  businesses: 'businesses',
  dashboard: 'dashboard',
  documents: 'documents',
  emailAgent: 'email_agent',
  emailBot: 'email_bot',
  hrEmployees: 'hr_employees',
  hrLeaves: 'hr_leaves',
  adminLeaves: 'admin_leaves',
  managerLeaves: 'manager_leaves',
  leads: 'leads',
  payroll: 'payroll',
  productivity: 'productivity',
  recruitment: 'recruitment',
  reviews: 'reviews',
  salesAdmin: 'sales_admin',
  systemEvents: 'system_events',
  systemPrompt: 'system_prompt',
  users: 'users',
});

export function invalidateCacheNamespaces(...namespaces) {
  return namespaces.reduce((deleted, namespace) => deleted + clearCacheNamespace(namespace), 0);
}
