import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../auth/api';

export default function Users({ user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', phone: '', role: 'employee', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowModal(false);
        setNewUser({ username: '', email: '', phone: '', role: 'employee', password: '' });
        fetchUsers();
        window.dispatchEvent(new CustomEvent('seevora:hr-employees-changed'));
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await apiFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
        window.dispatchEvent(new CustomEvent('seevora:hr-employees-changed'));
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update user');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
        window.dispatchEvent(new CustomEvent('seevora:hr-employees-changed'));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role) => {
    const normalizedRole = role === 'super_admin' ? 'admin' : role;
    const roles = {
      admin: { label: 'Admin', color: '#0ea5e9', bg: '#e0f2fe' },
      hr: { label: 'HR', color: '#10b981', bg: '#d1fae5' },
      manager: { label: 'Manager', color: '#f59e0b', bg: '#fef3c7' },
      support: { label: 'Support', color: '#8b5cf6', bg: '#ede9fe' },
      employee: { label: 'Employee', color: '#64748b', bg: '#f1f5f9' },
    };
    const r = roles[normalizedRole] || roles.employee;
    return (
      <span style={{ background: r.bg, color: r.color, padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
        {r.label}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem' }}>Users & Roles</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add User
        </button>
      </div>

      {loading ? <p>Loading users...</p> : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Username</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Email & Phone</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Joined</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    <div style={{ color: '#4f46e5' }}>{u.email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.phone || 'No phone'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    {getRoleBadge(u.role)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b' }}>
                    {u.joined_on ? new Date(u.joined_on).toLocaleDateString() : new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => setEditingUser({ ...u, password: '' })} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.85rem', marginRight: 10 }}>Edit</button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 450, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Add System User</h3>
            {errorMsg && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>{errorMsg}</div>}
            
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Username *</label>
                  <input 
                    type="text" required 
                    value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Role *</label>
                  <select 
                    required value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Email *</label>
                  <input 
                    type="email" required 
                    value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Phone</label>
                  <input 
                    type="tel" 
                    value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Temporary Password *</label>
                <input 
                  type="text" required 
                  value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Create User</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 450, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Edit User</h3>
            {errorMsg && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>{errorMsg}</div>}
            
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Username *</label>
                  <input 
                    type="text" required 
                    value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Role *</label>
                  <select 
                    required value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Email *</label>
                  <input 
                    type="email" required 
                    value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Phone</label>
                  <input 
                    type="tel" 
                    value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Joining Date (Optional)</label>
                <input 
                  type="date" 
                  value={editingUser.joined_on ? editingUser.joined_on.split('T')[0] : ''} 
                  onChange={e => setEditingUser({...editingUser, joined_on: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
                <button type="button" onClick={() => { setEditingUser(null); setErrorMsg(''); }} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
