import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../auth/api';

export default function TimeTracking() {
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLog, setNewLog] = useState({ task_id: '', employee_id: '', hours: '', date: new Date().toISOString().substring(0, 10), description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, tasksRes, empRes] = await Promise.all([
        apiFetch('/api/productivity/time-logs'),
        apiFetch('/api/productivity/tasks'),
        apiFetch('/api/hr/employees')
      ]);
      
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(Array.isArray(d) ? d : []);
      }
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        setTasks(Array.isArray(d) ? d : []);
      }
      if (empRes.ok) {
        const d = await empRes.json();
        const employeeList = Array.isArray(d) ? d : d.employees || [];
        setEmployees(employeeList);
        setNewLog(current => (
          current.employee_id || !employeeList.length
            ? current
            : { ...current, employee_id: employeeList[0].databaseId || employeeList[0].id }
        ));
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
      const res = await apiFetch('/api/productivity/time-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newLog,
          employee_id: newLog.employee_id || employees[0]?.databaseId || employees[0]?.id || '',
        })
      });
      if (res.ok) {
        setShowModal(false);
        setNewLog({ task_id: '', employee_id: '', hours: '', date: new Date().toISOString().substring(0, 10), description: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this time log?')) return;
    try {
      await apiFetch(`/api/productivity/time-logs/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem' }}>Time Tracking</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          + Log Time
        </button>
      </div>

      {loading ? <p>Loading time logs...</p> : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Employee</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Task / Project</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Hours</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Description</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{new Date(log.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{log.employee_name || 'Self'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 600 }}>{log.task_title}</div>
                    {log.project_name && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.project_name}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5' }}>{log.hours}h</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569' }}>{log.description || '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(log.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No time logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 400, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Log Time</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Task *</label>
                <select 
                  required
                  value={newLog.task_id} onChange={e => setNewLog({...newLog, task_id: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="">Select Task</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.title} {t.project_name ? `(${t.project_name})` : ''}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Employee *</label>
                <select 
                  required
                  value={newLog.employee_id} onChange={e => setNewLog({...newLog, employee_id: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e.databaseId || e.id} value={e.databaseId || e.id}>{e.name || e.email || 'Employee'}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Hours *</label>
                  <input 
                    type="number" step="0.25" min="0.25" required 
                    value={newLog.hours} onChange={e => setNewLog({...newLog, hours: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Date *</label>
                  <input 
                    type="date" required 
                    value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Description / Notes</label>
                <input 
                  type="text" 
                  value={newLog.description} onChange={e => setNewLog({...newLog, description: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
