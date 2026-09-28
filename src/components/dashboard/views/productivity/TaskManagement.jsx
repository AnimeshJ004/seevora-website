import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../../../auth/api';

/* ── Inline SVG Icon Helper ── */
function Icon({ name, size = 16, color = 'currentColor' }) {
  const icons = {
    checkSquare: <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    square: <rect x="3" y="3" width="18" height="18" rx="2" />,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    kanban: <><rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    messageSquare: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    alertCircle: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  };

  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      width={size} 
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {icons[name] || null}
    </svg>
  );
}

const TASK_CATEGORIES = [
  ['general', 'General'],
  ['sales', 'Sales & CRM'],
  ['marketing', 'Marketing'],
  ['development', 'Engineering & Dev'],
  ['operations', 'Operations'],
  ['support', 'Support'],
  ['finance', 'Finance'],
  ['hr', 'HR & People'],
  ['client_work', 'Client Delivery'],
  ['admin', 'Admin'],
];

const CATEGORY_LABELS = Object.fromEntries(TASK_CATEGORIES);

const STAGES = {
  todo: { key: 'todo', label: 'To Do', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  in_progress: { key: 'in_progress', label: 'In Progress', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  review: { key: 'review', label: 'Review', color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
  done: { key: 'done', label: 'Done', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
};

function getPriorityBadge(priority) {
  if (priority === 'high') return { label: 'High', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  if (priority === 'low') return { label: 'Low', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  return { label: 'Medium', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
}

export default function TaskManagement({ user }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workflowSummary, setWorkflowSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // View & Filters
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [filterDue, setFilterDue] = useState('all'); // 'all' | 'overdue' | 'today'

  // Modals & Active Edit
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // task object opened in detail/edit modal
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, empRes, summaryRes, notifRes] = await Promise.all([
        apiFetch('/api/productivity/tasks'),
        apiFetch('/api/productivity/projects'),
        apiFetch('/api/hr/employees'),
        apiFetch('/api/productivity/workflow-summary'),
        apiFetch('/api/productivity/notifications'),
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : empData.employees || []);
      }
      if (summaryRes.ok) setWorkflowSummary(await summaryRes.json());
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setNotifications(nData.notifications || []);
        setUnreadNotificationCount(nData.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching task management data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle fast status change
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await apiFetch(`/api/productivity/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Task moved to ${STAGES[newStatus]?.label || newStatus}!`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      const res = await apiFetch(`/api/productivity/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Task deleted successfully');
        if (activeTask?.id === id) setActiveTask(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Notification actions
  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/productivity/notifications/read-all', { method: 'PUT' });
      setUnreadNotificationCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await apiFetch(`/api/productivity/notifications/${notif.id}/read`, { method: 'PUT' });
        setUnreadNotificationCount(c => Math.max(0, c - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      }
      if (notif.task_id) {
        const t = tasks.find(item => item.id === notif.task_id);
        if (t) setActiveTask(t);
        setShowNotificationDropdown(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    return tasks.filter(task => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesProject = task.project_name?.toLowerCase().includes(q);
        const matchesAssignee = task.assigned_to_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesProject && !matchesAssignee) return false;
      }

      // Status
      if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;

      // Priority
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

      // Category
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

      // Assignee
      if (selectedAssignee === 'unassigned' && task.assigned_to) return false;
      if (selectedAssignee !== 'all' && selectedAssignee !== 'unassigned' && task.assigned_to !== selectedAssignee) return false;

      // Due date filter
      if (filterDue === 'overdue' && (!task.due_date || String(task.due_date).substring(0, 10) >= today || task.status === 'done')) return false;
      if (filterDue === 'today' && (!task.due_date || String(task.due_date).substring(0, 10) !== today || task.status === 'done')) return false;

      return true;
    });
  }, [tasks, searchQuery, selectedStatus, selectedPriority, selectedCategory, selectedAssignee, filterDue]);

  // Grouped tasks by stage for Kanban
  const groupedTasks = useMemo(() => {
    const map = { todo: [], in_progress: [], review: [], done: [] };
    filteredTasks.forEach(task => {
      if (map[task.status]) map[task.status].push(task);
      else map.todo.push(task);
    });
    return map;
  }, [filteredTasks]);

  return (
    <div style={{ padding: '24px 28px', color: '#0f172a', fontFamily: "'Inter', sans-serif", maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, right: 28, zIndex: 99999,
          background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '0.88rem', fontWeight: 600, animation: 'fadeIn 0.2s ease-out'
        }}>
          <span style={{ color: '#10b981' }}><Icon name="check" size={18} /></span>
          {toastMessage}
        </div>
      )}

      {/* ── Top Header & Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Task Management & Workflow Hub
            </h1>
            <span style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Productivity
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Collaborative task workflows, assignments, subtask checklists, and real-time activity tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Notifications Bell Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              style={{
                position: 'relative', background: '#fff', border: '1px solid #cbd5e1',
                padding: '9px 12px', borderRadius: 8, cursor: 'pointer', color: '#334155',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600
              }}
            >
              <Icon name="bell" size={16} />
              <span>Alerts</span>
              {unreadNotificationCount > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 800,
                  borderRadius: 10, padding: '1px 6px', minWidth: 16, textAlign: 'center'
                }}>
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotificationDropdown && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 340,
                background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>Task Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                          background: n.is_read ? '#fff' : '#eff6ff', transition: 'background 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 600 : 800, color: '#0f172a' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#475569', lineHeight: 1.35 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Task Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              border: 'none', color: '#fff', padding: '9px 18px',
              borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Icon name="plus" size={16} /> + New Task
          </button>
        </div>
      </div>

      {/* ── Workflow Quick Stats Chips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Tasks', count: workflowSummary?.total || tasks.length, color: '#0f172a', bg: '#f8fafc', icon: 'checkSquare' },
          { label: 'In Progress', count: workflowSummary?.in_progress || 0, color: '#2563eb', bg: '#eff6ff', icon: 'clock' },
          { label: 'In Review', count: workflowSummary?.review || 0, color: '#8b5cf6', bg: '#f5f3ff', icon: 'activity' },
          { label: 'Completed', count: workflowSummary?.done || 0, color: '#10b981', bg: '#ecfdf5', icon: 'check' },
          { label: 'High Priority', count: workflowSummary?.high_priority || 0, color: '#ef4444', bg: '#fee2e2', icon: 'alertCircle' },
          { label: 'Overdue', count: workflowSummary?.overdue || 0, color: '#b91c1c', bg: '#fef2f2', icon: 'alertCircle', isAlert: true },
        ].map(stat => (
          <div 
            key={stat.label}
            style={{
              background: '#fff', padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${stat.isAlert && Number(stat.count) > 0 ? '#fca5a5' : '#e2e8f0'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                {stat.count}
              </div>
            </div>
            <div style={{ background: stat.bg, color: stat.color, padding: 8, borderRadius: 8 }}>
              <Icon name={stat.icon} size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search, Filters & View Mode Switcher ── */}
      <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
              <span style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8' }}>
                <Icon name="search" size={15} />
              </span>
              <input 
                type="text"
                placeholder="Search tasks, project, assignee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
                  border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <select 
              value={selectedStatus} 
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="all">All Stages</option>
              {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            {/* Priority Filter */}
            <select 
              value={selectedPriority} 
              onChange={e => setSelectedPriority(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Assignee Filter */}
            <select 
              value={selectedAssignee} 
              onChange={e => setSelectedAssignee(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="all">All Categories</option>
              {TASK_CATEGORIES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: viewMode === 'kanban' ? '#fff' : 'transparent',
                border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
                fontWeight: 700, cursor: 'pointer', color: viewMode === 'kanban' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Icon name="kanban" size={14} /> Kanban Board
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: viewMode === 'list' ? '#fff' : 'transparent',
                border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
                fontWeight: 700, cursor: 'pointer', color: viewMode === 'list' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Icon name="list" size={14} /> Detailed List
            </button>
          </div>

        </div>
      </div>

      {/* ── Content: Kanban Board or List View ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          Loading task workflows...
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* ── KANBAN BOARD ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: 18, overflowX: 'auto', paddingBottom: 16 }}>
          {Object.entries(STAGES).map(([stageKey, conf]) => {
            const stageTasks = groupedTasks[stageKey] || [];

            return (
              <div key={stageKey} style={{ background: '#f8fafc', borderRadius: 14, padding: 14, minHeight: 520, display: 'flex', flexDirection: 'column' }}>
                
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${conf.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{conf.label}</span>
                    <span style={{ background: conf.bg, color: conf.color, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                      {stageTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCreateModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                    title="Add task in this stage"
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>

                {/* Cards Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
                  {stageTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No tasks in {conf.label}
                    </div>
                  ) : (
                    stageTasks.map(task => {
                      const pBadge = getPriorityBadge(task.priority);
                      const isOverdue = task.due_date && String(task.due_date).substring(0, 10) < new Date().toISOString().substring(0, 10) && task.status !== 'done';
                      const checklistTotal = Number(task.checklist_total) || 0;
                      const checklistDone = Number(task.checklist_completed) || 0;

                      return (
                        <div 
                          key={task.id}
                          style={{
                            background: '#fff', borderRadius: 10, padding: 14,
                            border: `1px solid ${isOverdue ? '#fca5a5' : '#e2e8f0'}`,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                            cursor: 'pointer', transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                          }}
                          onClick={() => setActiveTask(task)}
                        >
                          {/* Priority & Category Badges */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ background: pBadge.bg, color: pBadge.color, fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                              {pBadge.label}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                              {CATEGORY_LABELS[task.category] || 'General'}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                            {task.title}
                          </h4>

                          {/* Project Name */}
                          {task.project_name && (
                            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginBottom: 8 }}>
                              📁 {task.project_name}
                            </div>
                          )}

                          {/* Subtasks Progress */}
                          {checklistTotal > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: 3 }}>
                                <span>Subtasks</span>
                                <span style={{ fontWeight: 700, color: checklistDone === checklistTotal ? '#10b981' : '#475569' }}>
                                  {checklistDone}/{checklistTotal}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${(checklistDone / checklistTotal) * 100}%`, height: '100%', background: checklistDone === checklistTotal ? '#10b981' : '#4f46e5' }} />
                              </div>
                            </div>
                          )}

                          {/* Footer: Assignee & Due Date */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9', fontSize: '0.74rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155', fontWeight: 600 }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: '50%', background: task.assigned_to_name ? '#e0e7ff' : '#f1f5f9',
                                color: task.assigned_to_name ? '#3730a3' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 800
                              }}>
                                {task.assigned_to_name ? task.assigned_to_name.substring(0, 2).toUpperCase() : '?'}
                              </span>
                              <span>{task.assigned_to_name || 'Unassigned'}</span>
                            </div>

                            {task.due_date && (
                              <span style={{ color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 700 : 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                                📅 {String(task.due_date).substring(0, 10)}
                              </span>
                            )}
                          </div>

                          {/* Quick Workflow Move Bar */}
                          <div 
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 6, borderTop: '1px dashed #f1f5f9' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              style={{ fontSize: '0.72rem', padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }}
                            >
                              {Object.entries(STAGES).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>

                            <button 
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                              title="Delete task"
                            >
                              <Icon name="trash" size={13} color="#ef4444" />
                            </button>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* ── DETAILED LIST VIEW ── */
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Task Title</th>
                <th style={{ padding: '12px 16px' }}>Project</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px' }}>Subtasks</th>
                <th style={{ padding: '12px 16px' }}>Assigned To</th>
                <th style={{ padding: '12px 16px' }}>Due Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, idx) => {
                const conf = STAGES[task.status] || STAGES.todo;
                const pBadge = getPriorityBadge(task.priority);
                const isOverdue = task.due_date && String(task.due_date).substring(0, 10) < new Date().toISOString().substring(0, 10) && task.status !== 'done';
                const checklistTotal = Number(task.checklist_total) || 0;
                const checklistDone = Number(task.checklist_completed) || 0;

                return (
                  <tr 
                    key={task.id}
                    onClick={() => setActiveTask(task)}
                    style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfdfd', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: conf.bg, color: conf.color, padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.74rem' }}>
                        {conf.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      {task.title}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 600 }}>
                      {task.project_name || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {CATEGORY_LABELS[task.category] || 'General'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: pBadge.bg, color: pBadge.color, fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                        {pBadge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {checklistTotal > 0 ? `${checklistDone}/${checklistTotal}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>
                      {task.assigned_to_name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px 16px', color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 700 : 500 }}>
                      {task.due_date ? String(task.due_date).substring(0, 10) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button 
                          onClick={() => setActiveTask(task)}
                          style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', color: '#334155' }}
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', color: '#ef4444' }}
                        >
                          <Icon name="trash" size={13} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Create Task ── */}
      {showCreateModal && (
        <CreateTaskModal 
          projects={projects}
          employees={employees}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            showToast('New task created & assigned successfully!');
            fetchData();
          }}
        />
      )}

      {/* ── Modal: Task Detail, Assignment, Checklists & Activity Log ── */}
      {activeTask && (
        <TaskDetailModal 
          taskId={activeTask.id}
          initialTask={activeTask}
          projects={projects}
          employees={employees}
          onClose={() => setActiveTask(null)}
          onUpdated={() => {
            showToast('Task updated!');
            fetchData();
          }}
          onDeleted={() => {
            setActiveTask(null);
            showToast('Task removed');
            fetchData();
          }}
        />
      )}

    </div>
  );
}

/* ── Modal: Create Task ── */
function CreateTaskModal({ projects, employees, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_id: '',
    status: 'todo',
    priority: 'medium',
    category: 'general',
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    checklists: ['']
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addChecklistRow = () => {
    setForm(f => ({ ...f, checklists: [...f.checklists, ''] }));
  };

  const updateChecklistRow = (index, val) => {
    setForm(f => {
      const updated = [...f.checklists];
      updated[index] = val;
      return { ...f, checklists: updated };
    });
  };

  const removeChecklistRow = (index) => {
    setForm(f => ({ ...f, checklists: f.checklists.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const cleanChecklists = form.checklists.filter(c => c.trim().length > 0);
      const res = await apiFetch('/api/productivity/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          project_id: form.project_id || null,
          assigned_to: form.assigned_to || null,
          due_date: form.due_date || null,
          estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : 0,
          checklists: cleanChecklists
        })
      });

      if (res.ok) {
        onCreated();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to create task');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const lbl = {
    fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', flexDirection: 'column', gap: 5
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 620, maxWidth: '95%',
        maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            Create New Task
          </h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: '0.82rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Task Title *
              <input required style={inp} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Integrate Payment Gateway API" />
            </label>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Description & Requirements
              <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Key objectives, acceptance criteria, notes..." />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <label style={lbl}>Project
              <select style={inp} value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                <option value="">None (Standalone Task)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>

            <label style={lbl}>Assign To (Team Member)
              <select style={inp} value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}>
                <option value="">Unassigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.job_title || 'Team'})</option>
                ))}
              </select>
            </label>

            <label style={lbl}>Workflow Stage
              <select style={inp} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>

            <label style={lbl}>Priority Level
              <select style={inp} value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </label>

            <label style={lbl}>Category
              <select style={inp} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {TASK_CATEGORIES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </label>

            <label style={lbl}>Due Date
              <input type="date" style={inp} value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </label>
          </div>

          {/* Initial Checklist / Subtasks */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Subtasks / Checklist</span>
              <button 
                type="button" 
                onClick={addChecklistRow}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', color: '#2563eb' }}
              >
                + Add Item
              </button>
            </div>
            {form.checklists.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input 
                  style={inp} 
                  placeholder={`Subtask #${i + 1}`} 
                  value={c} 
                  onChange={e => updateChecklistRow(i, e.target.value)} 
                />
                {form.checklists.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeChecklistRow(i)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 6px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal: Task Detail, Assignment, Subtasks, Activity Log & Comments ── */
function TaskDetailModal({ taskId, initialTask, projects, employees, onClose, onUpdated, onDeleted }) {
  const [task, setTask] = useState(initialTask);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'checklists' | 'activity' | 'comments'
  const [checklists, setChecklists] = useState([]);
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newCommentBody, setNewCommentBody] = useState('');
  const [saving, setSaving] = useState(false);

  // Form edit state
  const [editForm, setEditForm] = useState({
    title: initialTask.title || '',
    description: initialTask.description || '',
    project_id: initialTask.project_id || '',
    status: initialTask.status || 'todo',
    priority: initialTask.priority || 'medium',
    category: initialTask.category || 'general',
    assigned_to: initialTask.assigned_to || '',
    due_date: initialTask.due_date ? String(initialTask.due_date).substring(0, 10) : '',
    estimated_hours: initialTask.estimated_hours || 0,
  });

  const loadFullTask = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/productivity/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setChecklists(data.checklists || []);
        setActivities(data.activities || []);
        setComments(data.comments || []);
        setEditForm({
          title: data.title || '',
          description: data.description || '',
          project_id: data.project_id || '',
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          category: data.category || 'general',
          assigned_to: data.assigned_to || '',
          due_date: data.due_date ? String(data.due_date).substring(0, 10) : '',
          estimated_hours: data.estimated_hours || 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [taskId]);

  useEffect(() => {
    loadFullTask();
  }, [loadFullTask]);

  // Save Task Details
  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch(`/api/productivity/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        onUpdated();
        loadFullTask();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Checklist Actions
  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    try {
      const res = await apiFetch(`/api/productivity/tasks/${taskId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChecklistTitle.trim() })
      });
      if (res.ok) {
        setNewChecklistTitle('');
        loadFullTask();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklist = async (item) => {
    try {
      await apiFetch(`/api/productivity/tasks/${taskId}/checklists/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !item.is_completed })
      });
      loadFullTask();
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklist = async (itemId) => {
    try {
      await apiFetch(`/api/productivity/tasks/${taskId}/checklists/${itemId}`, { method: 'DELETE' });
      loadFullTask();
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  // Comment Action
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;
    try {
      const res = await apiFetch(`/api/productivity/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newCommentBody.trim() })
      });
      if (res.ok) {
        setNewCommentBody('');
        loadFullTask();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const lbl = {
    fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', flexDirection: 'column', gap: 5
  };

  const completedChecklists = checklists.filter(c => c.is_completed).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 720, maxWidth: '95%',
        maxHeight: '92vh', overflowY: 'auto', padding: 28, boxShadow: '0 30px 70px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: STAGES[editForm.status]?.bg || '#f1f5f9',
              color: STAGES[editForm.status]?.color || '#475569',
              padding: '4px 10px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 800
            }}>
              {STAGES[editForm.status]?.label || editForm.status}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Created {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>
            ✕ Close
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
          {[
            { id: 'details', label: 'Task Details', icon: 'edit' },
            { id: 'checklists', label: `Subtasks (${completedChecklists}/${checklists.length})`, icon: 'checkSquare' },
            { id: 'activity', label: `Activity Log (${activities.length})`, icon: 'activity' },
            { id: 'comments', label: `Comments (${comments.length})`, icon: 'messageSquare' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
                padding: '10px 14px', fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 800 : 600,
                color: activeTab === tab.id ? '#4f46e5' : '#64748b', cursor: 'pointer'
              }}
            >
              <Icon name={tab.icon} size={14} color={activeTab === tab.id ? '#4f46e5' : '#64748b'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Task Details & Assignment ── */}
        {activeTab === 'details' && (
          <form onSubmit={handleSaveDetails}>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Task Title
                <input required style={inp} value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Description & Instructions
                <textarea style={{ ...inp, height: 75, resize: 'vertical' }} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <label style={lbl}>Assigned To
                <select style={inp} value={editForm.assigned_to || ''} onChange={e => setEditForm({...editForm, assigned_to: e.target.value})}>
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.job_title || 'Team'})</option>
                  ))}
                </select>
              </label>

              <label style={lbl}>Workflow Stage
                <select style={inp} value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>

              <label style={lbl}>Priority
                <select style={inp} value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </label>

              <label style={lbl}>Category
                <select style={inp} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                  {TASK_CATEGORIES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </label>

              <label style={lbl}>Due Date
                <input type="date" style={inp} value={editForm.due_date} onChange={e => setEditForm({...editForm, due_date: e.target.value})} />
              </label>

              <label style={lbl}>Project
                <select style={inp} value={editForm.project_id || ''} onChange={e => setEditForm({...editForm, project_id: e.target.value})}>
                  <option value="">None (Standalone)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <button 
                type="button" 
                onClick={() => onDeleted(task.id)}
                style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Delete Task
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── TAB 2: Subtasks / Checklists ── */}
        {activeTab === 'checklists' && (
          <div>
            {/* Progress bar */}
            <div style={{ marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                <span>Subtask Checklist Progress</span>
                <span>{checklists.length ? `${Math.round((completedChecklists / checklists.length) * 100)}%` : '0%'}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: checklists.length ? `${(completedChecklists / checklists.length) * 100}%` : '0%', height: '100%', background: '#10b981', borderRadius: 3 }} />
              </div>
            </div>

            {/* List of subtasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {checklists.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No subtasks added yet. Add checklist items below to track step-by-step completion.
                </div>
              ) : (
                checklists.map(item => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                      background: item.is_completed ? '#f8fafc' : '#fff'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={item.is_completed} 
                        onChange={() => handleToggleChecklist(item)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span style={{
                        fontSize: '0.85rem', color: item.is_completed ? '#94a3b8' : '#0f172a',
                        textDecoration: item.is_completed ? 'line-through' : 'none'
                      }}>
                        {item.title}
                      </span>
                    </label>
                    <button 
                      onClick={() => handleDeleteChecklist(item.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                    >
                      <Icon name="trash" size={13} color="#ef4444" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add checklist input */}
            <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: 10 }}>
              <input 
                style={inp} 
                placeholder="Add a new checklist step..." 
                value={newChecklistTitle} 
                onChange={e => setNewChecklistTitle(e.target.value)} 
              />
              <button type="submit" style={{ padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                + Add
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 3: Activity Log & Workflow History ── */}
        {activeTab === 'activity' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No recorded activity events yet.
                </div>
              ) : (
                activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#4f46e5', marginTop: 2 }}>
                      <Icon name="activity" size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{act.actor_name || 'System'}</span>
                        <span style={{ color: '#94a3b8' }}>{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        Action: <strong style={{ textTransform: 'capitalize' }}>{act.action_type.replace('_', ' ')}</strong>
                        {act.details && (
                          <span style={{ color: '#64748b', marginLeft: 6 }}>
                            {JSON.stringify(act.details)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: Discussion Comments ── */}
        {activeTab === 'comments' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {comments.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No comments yet. Start the team discussion below.
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
                      <strong style={{ color: '#0f172a' }}>{c.author_name} ({c.author_role || 'member'})</strong>
                      <span style={{ color: '#94a3b8' }}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      {c.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add comment input */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 10 }}>
              <input 
                style={inp} 
                placeholder="Write a message or update..." 
                value={newCommentBody} 
                onChange={e => setNewCommentBody(e.target.value)} 
              />
              <button type="submit" style={{ padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                Send
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
