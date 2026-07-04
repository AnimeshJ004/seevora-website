import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, Panel, Badge, Btn, Table } from '../shared';
import { hrApiFetch } from '../hr/hrApi';

const EMPTY_FORM = {
  title: '',
  description: '',
  assigned_to: '',
  priority: 'medium',
  status: 'todo',
  due_date: '',
  project_name: '',
};

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const PRIORITY_COLORS = { high: 'pink', medium: 'orange', low: 'green' };
const STATUS_COLORS = { todo: 'gray', in_progress: 'blue', done: 'green' };

function labelize(value) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN');
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

export default function TeamTasks() {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentBody, setCommentBody] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingTask, setEditingTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, teamRes] = await Promise.all([
        hrApiFetch('/api/productivity/tasks'),
        hrApiFetch('/api/productivity/my-team'),
      ]);
      const tasksData = await tasksRes.json().catch(() => ({}));
      const teamData = await teamRes.json().catch(() => ({}));
      if (!tasksRes.ok) showToast(tasksData.error || 'Failed to load tasks.');
      else setTasks(Array.isArray(tasksData) ? tasksData : []);
      if (!teamRes.ok) showToast(teamData.error || 'Failed to load team members.');
      else setTeam(Array.isArray(teamData) ? teamData : []);
    } catch {
      showToast('Unable to reach the task server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openCreateModal = () => {
    setEditingTask(null);
    setForm({ ...EMPTY_FORM, assigned_to: team[0]?.id || '' });
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      due_date: dateInputValue(task.due_date),
      project_name: task.project_name || '',
    });
    setIsTaskModalOpen(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      showToast('Task title is required.');
      return;
    }
    if (!form.assigned_to) {
      showToast('Assign this task to a team member.');
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(editingTask);
      const endpoint = isEdit ? `/api/productivity/tasks/${editingTask.id}` : '/api/productivity/tasks';
      const res = await hrApiFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, due_date: form.due_date || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to save task.');
        return;
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      setForm(EMPTY_FORM);
      showToast(isEdit ? 'Task updated.' : 'Task created.');
      loadData();
    } catch {
      showToast('Unable to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (task, status) => {
    setIsSaving(true);
    try {
      const res = await hrApiFetch(`/api/productivity/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to update status.');
        return;
      }
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: data.status || status } : item)));
      setSelectedTask((current) => current?.id === task.id ? { ...current, status: data.status || status } : current);
    } catch {
      showToast('Unable to update task.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setIsSaving(true);
    try {
      const res = await hrApiFetch(`/api/productivity/tasks/${task.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to delete task.');
        return;
      }
      setTasks((current) => current.filter((item) => item.id !== task.id));
      showToast('Task deleted.');
    } catch {
      showToast('Unable to delete task.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadComments = async (task) => {
    setSelectedTask(task);
    setCommentBody('');
    try {
      const res = await hrApiFetch(`/api/productivity/tasks/${task.id}/comments`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to load comments.');
        setComments([]);
        return;
      }
      setComments(Array.isArray(data) ? data : []);
    } catch {
      showToast('Unable to load comments.');
      setComments([]);
    }
  };

  const postComment = async () => {
    if (!selectedTask || !commentBody.trim()) {
      showToast('Write a comment first.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await hrApiFetch(`/api/productivity/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to post comment.');
        return;
      }
      setComments((current) => [...current, data]);
      setCommentBody('');
    } catch {
      showToast('Unable to post comment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', zIndex: 9999, boxShadow: '0 8px 24px rgba(16,185,129,0.3)', maxWidth: 380 }}>{toast}</div>
      )}

      <PageHeader title="Team Tasks" sub={isLoading ? 'Loading team work...' : `${tasks.length} visible tasks · ${team.length} assignable employees`} action="+ New Task" onAction={openCreateModal} />

      <Panel>
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>Loading team tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>No team tasks yet. Create a task for one of your direct reports.</p>
        ) : (
          <Table
            cols={['Title', 'Assignee', 'Project', 'Priority', 'Due Date', 'Status', 'Actions']}
            rows={tasks.map((task) => [
              <span key="title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{task.title}</span>,
              task.assigned_to_name || '-',
              task.project_name || '-',
              <Badge key="priority" label={labelize(task.priority)} color={PRIORITY_COLORS[task.priority] || 'gray'} />,
              formatDate(task.due_date),
              <select key="status" value={task.status || 'todo'} disabled={isSaving} onChange={(event) => updateStatus(task, event.target.value)} style={selectStyle}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
              </select>,
              <div key="actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Btn label="Edit" variant="ghost" size="sm" onClick={() => openEditModal(task)} />
                <Btn label="Comments" variant="ghost" size="sm" onClick={() => loadComments(task)} />
                <Btn label="Delete" variant="danger" size="sm" onClick={() => deleteTask(task)} />
              </div>,
            ])}
          />
        )}
      </Panel>

      {isTaskModalOpen && (
        <TaskFormModal
          form={form}
          team={team}
          editingTask={editingTask}
          isSaving={isSaving}
          onChange={updateForm}
          onSave={saveTask}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}

      {selectedTask && (
        <CommentsModal
          task={selectedTask}
          comments={comments}
          commentBody={commentBody}
          setCommentBody={setCommentBody}
          onClose={() => setSelectedTask(null)}
          onPost={postComment}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function TaskFormModal({ form, team, editingTask, isSaving, onChange, onSave, onClose }) {
  return (
    <div style={overlayStyle} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={onSave} style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>{editingTask ? 'Edit Task' : 'New Team Task'}</h3>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Assign work to a direct report and track progress.</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>x</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Title *" value={form.title} onChange={(value) => onChange('title', value)} />
          <div>
            <label style={labelStyle}>Assign To *</label>
            <select value={form.assigned_to} onChange={(event) => onChange('assigned_to', event.target.value)} style={inputStyle}>
              <option value="">Select employee</option>
              {team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select value={form.priority} onChange={(event) => onChange('priority', event.target.value)} style={inputStyle}>
              {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{labelize(priority)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={(event) => onChange('status', event.target.value)} style={inputStyle}>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
            </select>
          </div>
          <Field label="Due Date" type="date" value={form.due_date} onChange={(value) => onChange('due_date', value)} />
          <Field label="Project Name" value={form.project_name} onChange={(value) => onChange('project_name', value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={(event) => onChange('description', event.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Btn label="Cancel" variant="ghost" onClick={onClose} />
          <button type="submit" disabled={isSaving} style={primaryButtonStyle}>{isSaving ? 'Saving...' : 'Save Task'}</button>
        </div>
      </form>
    </div>
  );
}

function CommentsModal({ task, comments, commentBody, setCommentBody, onClose, onPost, isSaving }) {
  return (
    <div style={overlayStyle} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>{task.title}</h3>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{task.assigned_to_name || 'Unassigned'} · <Badge label={labelize(task.status)} color={STATUS_COLORS[task.status] || 'gray'} /></p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>x</button>
        </div>

        <div style={{ display: 'grid', gap: 10, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {comments.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No comments yet.</div>
          ) : comments.map((comment) => (
            <div key={comment.id} style={{ border: '1px solid var(--glass-border)', borderRadius: 10, padding: 12, background: 'var(--bg-space)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{comment.author_name}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{formatDateTime(comment.created_at)}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{comment.body}</div>
            </div>
          ))}
        </div>

        <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} rows={3} placeholder="Add a comment..." style={{ ...inputStyle, marginTop: 14, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
          <Btn label="Cancel" variant="ghost" onClick={onClose} />
          <Btn label={isSaving ? 'Posting...' : 'Post Comment'} onClick={onPost} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.76rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid var(--glass-border)',
  borderRadius: 10,
  background: 'var(--bg-space)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem',
  outline: 'none',
};

const selectStyle = {
  padding: '7px 10px',
  border: '1px solid var(--glass-border)',
  borderRadius: 8,
  background: 'var(--bg-space)',
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  background: 'rgba(15,23,42,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalStyle = {
  width: 'min(680px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'var(--bg-card)',
  border: '1px solid var(--glass-border)',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 24px 80px rgba(15,23,42,0.24)',
};

const closeButtonStyle = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '1px solid var(--glass-border)',
  background: 'var(--bg-space)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const primaryButtonStyle = {
  padding: '9px 20px',
  background: 'var(--text-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 100,
  fontWeight: 700,
  fontSize: '0.82rem',
  cursor: 'pointer',
};
