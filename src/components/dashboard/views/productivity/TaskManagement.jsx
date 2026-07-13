import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../auth/api';

const taskCategories = [
  ['general', 'General'],
  ['sales', 'Sales'],
  ['marketing', 'Marketing'],
  ['operations', 'Operations'],
  ['support', 'Support'],
  ['development', 'Development'],
  ['finance', 'Finance'],
  ['hr', 'HR'],
  ['client_work', 'Client Work'],
  ['admin', 'Admin'],
];

const categoryLabels = Object.fromEntries(taskCategories);

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', project_id: '', status: 'todo', priority: 'medium', category: 'general', assigned_to: '', due_date: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, empRes] = await Promise.all([
        apiFetch('/api/productivity/tasks'),
        apiFetch('/api/productivity/projects'),
        apiFetch('/api/hr/employees')
      ]);
      
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        setTasks(Array.isArray(d) ? d : []);
      }
      if (projectsRes.ok) {
        const d = await projectsRes.json();
        setProjects(Array.isArray(d) ? d : []);
      }
      if (empRes.ok) {
        const d = await empRes.json();
        setEmployees(Array.isArray(d) ? d : d.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/productivity/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTask,
          project_id: newTask.project_id || null,
          assigned_to: newTask.assigned_to || null,
          due_date: newTask.due_date || null
        })
      });
      if (res.ok) {
        setShowModal(false);
        setNewTask({ title: '', description: '', project_id: '', status: 'todo', priority: 'medium', category: 'general', assigned_to: '', due_date: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apiFetch(`/api/productivity/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiFetch(`/api/productivity/tasks/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return '#ef4444';
    if (priority === 'low') return '#10b981';
    return '#f59e0b';
  };

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done')
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem' }}>Task Management</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          + New Task
        </button>
      </div>

      {loading ? <p>Loading tasks...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {/* To Do Column */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              To Do <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{groupedTasks.todo.length}</span>
            </h3>
            {groupedTasks.todo.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onDelete={handleDelete} getPriorityColor={getPriorityColor} />
            ))}
          </div>
          
          {/* In Progress Column */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              In Progress <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{groupedTasks.in_progress.length}</span>
            </h3>
            {groupedTasks.in_progress.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onDelete={handleDelete} getPriorityColor={getPriorityColor} />
            ))}
          </div>
          
          {/* Done Column */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              Done <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{groupedTasks.done.length}</span>
            </h3>
            {groupedTasks.done.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onDelete={handleDelete} getPriorityColor={getPriorityColor} />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 450, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Create Task</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Task Title *</label>
                <input 
                  type="text" required 
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Project</label>
                  <select
                    value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Assign To</label>
                  <select 
                    value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="">Unassigned</option>
                    {employees.map(e => <option key={e.databaseId || e.id} value={e.databaseId || e.id}>{e.name || e.email || 'Employee'}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Category</label>
                  <select
                    value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    {taskCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Priority</label>
                  <select 
                    value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Due Date</label>
                  <input 
                    type="date" 
                    value={newTask.due_date ? newTask.due_date.substring(0, 10) : ''} 
                    onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Create</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete, getPriorityColor }) {
  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{task.title}</h4>
        <span style={{ 
          background: getPriorityColor(task.priority), 
          color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 700 
        }}>
          {task.priority}
        </span>
      </div>
      {task.project_name && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px 0' }}>Project: {task.project_name}</p>}
      <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0 0 8px 0' }}>Category: {categoryLabels[task.category] || 'General'}</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.assigned_to_name ? (
            <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 12 }}>{task.assigned_to_name}</span>
          ) : (
            <span>Unassigned</span>
          )}
        </div>
        <select 
          value={task.status} 
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc' }}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
      </div>
    </div>
  );
}
