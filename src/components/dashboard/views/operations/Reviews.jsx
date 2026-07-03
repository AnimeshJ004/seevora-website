import { useState, useEffect } from 'react';

export default function Reviews({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newReview, setNewReview] = useState({ reviewer_name: '', rating: 5, comment: '', source: 'google', status: 'pending' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) {
        setReviews(await res.json());
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
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        setShowModal(false);
        setNewReview({ reviewer_name: '', rating: 5, comment: '', source: 'google', status: 'pending' });
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem' }}>Reputation Management</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Review Manually
        </button>
      </div>

      {loading ? <p>Loading reviews...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {reviews.map(review => (
            <div key={review.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>{review.reviewer_name}</h3>
                  <div style={{ color: '#f59e0b', fontSize: '1.2rem', letterSpacing: 2 }}>{renderStars(review.rating)}</div>
                </div>
                <span style={{ 
                  background: '#f1f5f9', color: '#475569',
                  padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                }}>
                  {review.source}
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: 20, fontStyle: 'italic' }}>"{review.comment || 'No comment provided.'}"</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                <button onClick={() => handleDelete(review.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontWeight: 500 }}>No reviews found. They will appear here once connected.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 400, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Add Manual Review</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Reviewer Name *</label>
                <input 
                  type="text" required 
                  value={newReview.reviewer_name} onChange={e => setNewReview({...newReview, reviewer_name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Rating (1-5) *</label>
                  <input 
                    type="number" min="1" max="5" required 
                    value={newReview.rating} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Source</label>
                  <select 
                    value={newReview.source} onChange={e => setNewReview({...newReview, source: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="google">Google</option>
                    <option value="trustpilot">Trustpilot</option>
                    <option value="facebook">Facebook</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Comment</label>
                <textarea 
                  rows="3"
                  value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Add Review</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
