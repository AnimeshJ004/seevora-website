import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../auth/api';

export default function SecurityCenter() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await apiFetch('/api/system/security-events');
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const s = {
      critical: { bg: '#fee2e2', color: '#b91c1c' },
      high: { bg: '#ffedd5', color: '#c2410c' },
      medium: { bg: '#fef9c3', color: '#a16207' },
      low: { bg: '#e0f2fe', color: '#0369a1' }
    };
    const style = s[severity] || s.low;
    return (
      <span style={{ background: style.bg, color: style.color, padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
        {severity}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>Security Center</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Monitor login attempts, suspicious activities, and system alerts.</p>
        </div>
        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }}></div>
          <span style={{ fontWeight: 600, color: '#065f46', fontSize: '0.9rem' }}>System Secure</span>
        </div>
      </div>

      {loading ? <p>Loading security events...</p> : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Event Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Severity</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>IP Address</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(ev.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600 }}>{ev.event_type}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    {getSeverityBadge(ev.severity)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>{ev.ip_address || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569' }}>{ev.description || '-'}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No security events recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
