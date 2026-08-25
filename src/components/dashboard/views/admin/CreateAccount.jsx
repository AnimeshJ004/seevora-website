import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../auth/api';
import { STANDARD_JOB_ROLES } from '../../../../config/jobRoles';

export default function CreateAccount({ user }) {
  const [newUser, setNewUser] = useState({ username: '', email: '', phone: '', jobTitle: 'Sales & Developer', role: 'sales_developer', password: '' });
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

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
      setLoadingUsers(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const finalJobTitle = newUser.jobTitle === 'custom' ? customJobTitle.trim() : newUser.jobTitle;

    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newUser,
          jobTitle: finalJobTitle || 'Employee',
        })
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Account created successfully!' });
        setNewUser({ username: '', email: '', phone: '', jobTitle: 'Sales & Developer', role: 'sales_developer', password: '' });
        setCustomJobTitle('');
        fetchUsers();
        window.dispatchEvent(new CustomEvent('seevora:hr-employees-changed'));
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Failed to create account' });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (id === user.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
        window.dispatchEvent(new CustomEvent('seevora:hr-employees-changed'));
      }
      else alert('Failed to delete account');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a', display: 'grid', gridTemplateColumns: 'minmax(350px, 500px) 1fr', gap: '32px', alignItems: 'start' }}>
      
      {/* LEFT COLUMN: FORM */}
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem', marginBottom: '8px' }}>Create New Account</h2>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.9rem' }}>Create an account for any role (Employee, Manager, HR, Support, etc.) and assign them a temporary password.</p>
        
        {msg.text && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534', fontWeight: 600 }}>
            {msg.text}
          </div>
        )}
        
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Username *</label>
            <input type="text" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
            <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Phone Number</label>
            <input type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Company Job Role / Title *</label>
            <select
              value={newUser.jobTitle}
              onChange={e => setNewUser({...newUser, jobTitle: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              {STANDARD_JOB_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="custom">Other / Custom Role...</option>
            </select>
            {newUser.jobTitle === 'custom' && (
              <input
                type="text"
                required
                placeholder="Enter custom job title..."
                value={customJobTitle}
                onChange={e => setCustomJobTitle(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '8px' }}
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Dashboard Access Role *</label>
            <select required value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>
              <option value="sales_developer">Sales & Developer</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Temporary Password *</label>
            <input type="text" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="e.g. Welcome123!" />
          </div>
          
          <button type="submit" disabled={loading} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: RECENT ACCOUNTS */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px' }}>Existing Accounts</h2>
        {loadingUsers ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading accounts...</p>
        ) : users.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No accounts found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map(u => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.username}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', textTransform: 'capitalize' }}>
                    {u.role.replace('_', ' ')}
                  </div>
                  <button onClick={(e) => handleDelete(u.id, e)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete Account">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* HISTORY MODAL */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%', position: 'relative' }}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '16px', marginTop: 0 }}>Account History</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Username</span>
                <div style={{ fontWeight: 500 }}>{selectedUser.username}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Email</span>
                <div style={{ fontWeight: 500 }}>{selectedUser.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Role</span>
                <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{selectedUser.role.replace('_', ' ')}</div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Created At</span>
                <div style={{ fontWeight: 500 }}>{new Date(selectedUser.created_at).toLocaleString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Last Updated</span>
                <div style={{ fontWeight: 500 }}>{new Date(selectedUser.updated_at).toLocaleString()}</div>
              </div>
            </div>
            
            <button onClick={() => setSelectedUser(null)} style={{ width: '100%', background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, marginTop: '24px', cursor: 'pointer', color: '#475569' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
