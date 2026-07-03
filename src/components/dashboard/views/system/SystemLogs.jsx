import { useState, useEffect } from 'react';

export default function SystemLogs({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/system/audit-logs', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>System Audit Logs</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Monitor all administrative actions and system changes for compliance.</p>
      </div>

      {loading ? <p>Loading logs...</p> : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>User</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Action</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>IP Address</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600 }}>{log.user_name || 'System'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>{log.ip_address || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569' }}>{log.details || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No audit logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
