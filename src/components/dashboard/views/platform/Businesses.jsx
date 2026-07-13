import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../auth/api';

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ name: '', industry: '', website: '', contact_email: '', contact_phone: '', status: 'active' });
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await apiFetch('/api/businesses');
      if (res.ok) {
        setBusinesses(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiFetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBusiness)
      });
      if (res.ok) {
        setShowModal(false);
        setNewBusiness({ name: '', industry: '', website: '', contact_email: '', contact_phone: '', status: 'active' });
        fetchBusinesses();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create business.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this business?')) return;
    try {
      await apiFetch(`/api/businesses/${id}`, {
        method: 'DELETE',
      });
      fetchBusinesses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem' }}>Businesses & Clients</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Business
        </button>
      </div>

      {loading ? <p>Loading businesses...</p> : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Industry</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map(business => (
                <tr key={business.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600 }}>{business.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{business.industry || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    <div style={{ color: '#4f46e5' }}>{business.contact_email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{business.contact_phone}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    <span style={{ 
                      background: business.status === 'active' ? '#dcfce7' : '#f1f5f9', 
                      color: business.status === 'active' ? '#166534' : '#475569',
                      padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                    }}>
                      {business.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(business.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No businesses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 450, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Add Business</h3>
            {error && <div style={{ color: '#ef4444', marginBottom: 12, fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Business Name *</label>
                <input 
                  type="text" required 
                  value={newBusiness.name} onChange={e => setNewBusiness({...newBusiness, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Industry</label>
                  <input 
                    type="text" 
                    value={newBusiness.industry} onChange={e => setNewBusiness({...newBusiness, industry: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Website</label>
                  <input 
                    type="url" 
                    value={newBusiness.website} onChange={e => setNewBusiness({...newBusiness, website: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input 
                    type="email" 
                    value={newBusiness.contact_email} onChange={e => setNewBusiness({...newBusiness, contact_email: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Phone</label>
                  <input 
                    type="tel" 
                    value={newBusiness.contact_phone} onChange={e => setNewBusiness({...newBusiness, contact_phone: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
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
