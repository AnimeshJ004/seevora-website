import React, { useState, useEffect } from 'react';
import { PageHeader, Panel } from '../shared.jsx';

export default function Newsletter({ token }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [messageHtml, setMessageHtml] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/newsletter', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!subject || !messageHtml) return;
    
    setBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/newsletter/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject, messageHtml })
      });
      
      const data = await res.json();
      if (res.ok) {
        setBroadcastResult({ type: 'success', message: data.message + ` (${data.sentCount} sent)` });
        setSubject('');
        setMessageHtml('');
      } else {
        setBroadcastResult({ type: 'error', message: data.message || 'Broadcast failed' });
      }
    } catch (err) {
      setBroadcastResult({ type: 'error', message: 'Failed to send broadcast' });
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading subscribers...</div>;

  return (
    <div className="view-container">
      <PageHeader 
        title="Newsletter Management" 
        sub="Manage your subscribers and send broadcast emails." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Panel title="Send Broadcast">
          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Subject</label>
              <input 
                type="text" 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                required 
                placeholder="Email subject..."
              />
            </div>
            <div className="form-group">
              <label>HTML Message</label>
              <textarea 
                value={messageHtml} 
                onChange={e => setMessageHtml(e.target.value)} 
                required 
                placeholder="<h1>Hello</h1><p>Your content here...</p>"
                rows={8}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
              {broadcastResult && (
                <span style={{ color: broadcastResult.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
                  {broadcastResult.message}
                </span>
              )}
              <button type="submit" className="btn btn-primary" disabled={broadcasting}>
                {broadcasting ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </form>
        </Panel>

        <Panel title={`Subscribers (${subscribers.length})`}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Subscribed At</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center' }}>No subscribers yet</td></tr>
                ) : (
                  subscribers.map(sub => (
                    <tr key={sub.id}>
                      <td>{sub.email}</td>
                      <td>
                        <span className={`status-badge status-${sub.status}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
