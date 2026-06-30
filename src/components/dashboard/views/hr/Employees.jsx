import React, { useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Avatar, Btn } from '../shared';

const EMPLOYEES = [];

export default function Employees() {
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState(() => {
    const m = {};
    EMPLOYEES.forEach(e => { m[e.id] = e.hasAccount; });
    return m;
  });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const makeAccount = (emp) => {
    setAccounts(prev => ({ ...prev, [emp.id]: true }));
    showToast(`\u2713 Account created for ${emp.name} — credentials sent to ${emp.email}`);
  };

  const f = EMPLOYEES.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.dept.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          background: '#10b981', color: '#fff',
          padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: '0.85rem',
          zIndex: 9999, boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
          maxWidth: 360,
        }}>
          {toast}
        </div>
      )}

      <PageHeader
        title="Employees"
        sub={`${EMPLOYEES.length} total employees`}
        action="+ Add Employee"
        onAction={() => showToast('Add Employee — coming soon!')}
      />

      <StatsGrid
        cols={4}
        stats={[
          { label: 'Total',       value: 0,  color: 'blue'   },
          { label: 'Active',      value: 0,  color: 'green'  },
          { label: 'Inactive',    value: 0,   color: 'orange' },
          { label: 'On Probation',value: 0,   color: 'purple' },
        ]}
      />

      <Panel>
        <FilterBar filters={['All Departments', 'All Status']} onSearch={setSearch} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employee', 'ID', 'Department', 'Role', 'Salary', 'Joined', 'Status', 'Account', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', fontSize: '0.72rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--text-muted)', padding: '0 10px 12px 0',
                    borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {f.map((u, i) => (
                <tr key={u.id}
                  onMouseEnter={e => [...e.currentTarget.cells].forEach(c => c.style.background = 'rgba(0,0,0,0.012)')}
                  onMouseLeave={e => [...e.currentTarget.cells].forEach(c => c.style.background = '')}>
                  <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.id}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.dept}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.role}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.salary}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.joined}</td>
                  <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <Badge label={u.status === 'active' ? 'Active' : 'Inactive'} color={u.status === 'active' ? 'green' : 'orange'} />
                  </td>
                  <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    {accounts[u.id]
                      ? <Badge label="\u2713 Active" color="green" />
                      : <Badge label="No Account" color="gray" />}
                  </td>
                  <td style={{ padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Btn label="Edit" variant="ghost" size="sm" />
                      {!accounts[u.id] && (
                        <Btn label="Make Account" variant="primary" size="sm" onClick={() => makeAccount(u)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
