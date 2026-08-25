import React, { useEffect, useRef, useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Btn, Avatar } from '../shared';
import { hrApiFetch } from './hrApi';
import { STANDARD_JOB_ROLES } from '../../../../config/jobRoles';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  department: '',
  jobTitle: 'Sales & Developer',
  salary: '',
  joinedOn: new Date().toISOString().slice(0, 10),
  status: 'active',
  accountRole: 'sales_developer',
  managerId: '',
  username: '',
  password: 'Seevora@123',
};

export default function Employees({ user }) {
  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const employeesSectionRef = React.useRef(null);
  const canManageEmployees = ['hr', 'admin'].includes(user?.role === 'super_admin' ? 'admin' : user?.role);

  const [viewingProfile, setViewingProfile] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const lastFetchedRef = useRef(0);

  const loadEmployees = async () => {
    setIsLoading(true);
    lastFetchedRef.current = Date.now();
    try {
      const response = await hrApiFetch('/api/hr/employees');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.message || 'Unable to load employees.');
        return [];
      }
      const nextEmployees = data.employees || [];
      setEmployees(nextEmployees);
      return nextEmployees;
    } catch {
      showToast('Unable to reach the HR server.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();

    const refreshEmployees = () => loadEmployees();

    // Throttle focus-triggered refreshes — only reload if 60+ seconds have passed
    const handleFocus = () => {
      if (Date.now() - lastFetchedRef.current > 60_000) {
        loadEmployees();
      }
    };

    window.addEventListener('seevora:hr-employees-changed', refreshEmployees);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('seevora:hr-employees-changed', refreshEmployees);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const openCreateModal = () => {
    if (!canManageEmployees) return;
    setModalMode('create');
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (employee) => {
    if (!canManageEmployees) return;
    setModalMode('edit');
    setEditingEmployee(employee);
    setForm({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.dept || '',
      jobTitle: employee.role || '',
      salary: employee.salaryAmount ? String(employee.salaryAmount) : '',
      joinedOn: employee.joined || new Date().toISOString().slice(0, 10),
      status: employee.status || 'active',
      accountRole: employee.accountRole || 'employee',
      managerId: employee.managerId || '',
      username: employee.username || '',
      password: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingEmployee(null);
    setErrors({});
  };

  const handleSaveEmployee = async (event) => {
    event.preventDefault();
    if (!canManageEmployees) {
      showToast('Only HR or Admins can create, edit, or delete employee accounts.');
      return;
    }
    setIsSaving(true);
    setErrors({});

    try {
      const isEdit = modalMode === 'edit' && editingEmployee;
      const endpoint = isEdit
        ? `/api/hr/employees/${encodeURIComponent(editingEmployee.id)}`
        : '/api/hr/employees';
      const payload = isEdit && !form.password
        ? Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'password'))
        : form;

      const response = await hrApiFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        showToast(data.message || data.error || 'Unable to create employee account.');
        return;
      }

      await loadEmployees();
      setSearch('');
      setFilterKey((current) => current + 1);
      setIsModalOpen(false);
      setEditingEmployee(null);
      window.dispatchEvent(new CustomEvent('seevora:hr-employees-changed'));
      window.requestAnimationFrame(() => {
        employeesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      showToast(isEdit
        ? 'Employee updated successfully.'
        : `Employee account created. Username: ${data.account?.username || data.employee.email}`);
    } catch {
      showToast('Unable to reach the HR server.');
    } finally {
      setIsSaving(false);
    }
  };

  const openProfile = async (employee) => {
    setViewingProfile(employee);
    setIsProfileLoading(true);
    setProfileData(null);
    try {
      const response = await hrApiFetch(`/api/hr/employees/${encodeURIComponent(employee.id)}/profile`);
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setProfileData(data);
      } else {
        showToast(data.message || 'Unable to load profile.');
        setViewingProfile(null);
      }
    } catch {
      showToast('Unable to reach the HR server.');
      setViewingProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setViewingProfile(null);
    setProfileData(null);
  };

  const handleRemoveEmployee = async () => {
    if (!canManageEmployees) {
      showToast('Only HR or Admins can create, edit, or delete employee accounts.');
      return;
    }
    if (!editingEmployee || isSaving) return;
    const confirmed = window.confirm(`Remove ${editingEmployee.name} from employees? This will also remove the linked employee login account.`);
    if (!confirmed) return;

    setIsSaving(true);
    setErrors({});

    try {
      const response = await hrApiFetch(`/api/hr/employees/${encodeURIComponent(editingEmployee.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(data.message || 'Unable to remove employee.');
        return;
      }

      await loadEmployees();
      setSearch('');
      setFilterKey((current) => current + 1);
      setIsModalOpen(false);
      setEditingEmployee(null);
      window.dispatchEvent(new CustomEvent('seevora:hr-employees-changed'));
      window.requestAnimationFrame(() => {
        employeesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      showToast('Employee removed successfully.');
    } catch {
      showToast('Unable to reach the HR server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (f.length === 0) {
      showToast('No employee records to export.');
      return;
    }
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Manager', 'Salary', 'Joined Date', 'Status', 'Access Role'];
    const csvRows = [
      headers.join(','),
      ...f.map(u => [
        u.id || '',
        u.name || '',
        u.email || '',
        u.phone || '',
        u.dept || '',
        u.managerName || 'Unassigned',
        u.salaryAmount || 0,
        u.joined || '',
        u.status || '',
        u.accountRole || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departmentsList = ['all', ...new Set(employees.map(u => u.dept).filter(Boolean))];
  const deptOptions = departmentsList.map(d => ({
    value: d,
    label: d === 'all' ? 'All Departments' : d
  }));

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'probation', label: 'Probation' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const f = employees.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.dept.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'all' || u.dept.toLowerCase() === selectedDept.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || u.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter((employee) => employee.status === 'active').length,
    inactive: employees.filter((employee) => employee.status === 'inactive').length,
    probation: employees.filter((employee) => employee.status === 'probation').length,
  };

  const managerOptions = employees.filter((employee) => {
    const accountRole = String(employee.accountRole || '').toLowerCase();
    const status = String(employee.status || '').toLowerCase();
    return employee.databaseId !== editingEmployee?.databaseId
      && accountRole === 'manager'
      && employee.hasAccount
      && ['active', 'probation'].includes(status);
  });

  return (
    <div ref={employeesSectionRef} style={{ position: 'relative' }}>
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
        sub={isLoading ? 'Loading employees...' : `${employees.length} total employees${canManageEmployees ? '' : ' | read-only'}`}
        action={canManageEmployees ? '+ Add Account' : undefined}
        onAction={canManageEmployees ? openCreateModal : undefined}
      />

      <StatsGrid
        cols={4}
        stats={[
          { label: 'Total', value: stats.total, color: 'blue' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Inactive', value: stats.inactive, color: 'orange' },
          { label: 'On Probation', value: stats.probation, color: 'purple' },
        ]}
      />


      <Panel>
        <FilterBar
          key={filterKey}
          filters={[
            { value: selectedDept, onChange: setSelectedDept, options: deptOptions },
            { value: selectedStatus, onChange: setSelectedStatus, options: statusOptions }
          ]}
          onSearch={setSearch}
          onExport={handleExportCSV}
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  '#', 'Employee', 'ID', 'Department', 'Role', 'Manager', 'Salary', 'Joined', 'Status', 'Login Role', 'Account',
                  'Actions',
                ].map(h => (
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
              {!isLoading && f.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                    No employees found.
                  </td>
                </tr>
              )}
              {f.map((u, i) => (
                <tr key={u.id}
                  onMouseEnter={e => [...e.currentTarget.cells].forEach(c => c.style.background = 'rgba(0,0,0,0.012)')}
                  onMouseLeave={e => [...e.currentTarget.cells].forEach(c => c.style.background = '')}>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.04)', width: '30px' }}>{i + 1}</td>
                  <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.id}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.dept}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.role}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', color: u.managerName ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>
                    {u.managerName || 'Unassigned'}
                  </td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.salary}</td>
                  <td style={{ padding: '11px 10px 11px 0', fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{u.joined}</td>
                  <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <Badge
                      label={u.status === 'probation' ? 'Probation' : u.status === 'active' ? 'Active' : 'Inactive'}
                      color={u.status === 'active' ? 'green' : u.status === 'probation' ? 'purple' : 'orange'}
                    />
                  </td>
                  <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <Badge
                      label={u.accountRole === 'manager' ? 'Manager' : u.accountRole === 'hr' ? 'HR' : 'Employee'}
                      color={u.accountRole === 'manager' ? 'orange' : u.accountRole === 'hr' ? 'cyan' : 'green'}
                    />
                  </td>
                  <td style={{ padding: '11px 10px 11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    {u.hasAccount
                      ? <Badge label="Active" color="green" />
                      : <Badge label="No Account" color="gray" />}
                  </td>
                  <td style={{ padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Btn label="View" variant="ghost" size="sm" onClick={() => openProfile(u)} />
                      {canManageEmployees && <Btn label="Edit" variant="ghost" size="sm" onClick={() => openEditModal(u)} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {viewingProfile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            width: 'min(900px, 100%)',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 24px 80px rgba(15,23,42,0.22)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar name={viewingProfile.name} size={64} />
                <div>
                  <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {viewingProfile.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 6 }}>
                    {viewingProfile.role} • {viewingProfile.dept}
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Badge label={viewingProfile.status} color={viewingProfile.status === 'active' ? 'green' : 'gray'} />
                    <Badge label={viewingProfile.id} color="cyan" />
                  </div>
                </div>
              </div>
              <button type="button" onClick={closeProfile} style={{
                width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--glass-border)',
                background: 'var(--bg-space)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem',
              }}>
                x
              </button>
            </div>

            {isProfileLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading details...</div>
            ) : profileData ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, background: 'var(--bg-space)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{profileData.employee.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Phone</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{profileData.employee.phone || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Manager</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{profileData.employee.managerName || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Joined</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{profileData.employee.joined}</div>
                  </div>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Leave Allowances</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                  {['monthly', 'yearly'].map(type => {
                    const bal = profileData.policy[type];
                    return (
                      <div key={type} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: 16, borderRadius: 12 }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{type} Leave</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{bal.remaining}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {bal.total} remaining</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Leave History</h4>
                <div style={{ overflowX: 'auto', background: 'var(--bg-space)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Type', 'From', 'To', 'Days', 'Reason', 'Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {profileData.leaves.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No leave requests found.</td></tr>
                      ) : profileData.leaves.map(l => (
                        <tr key={l.id}>
                          <td style={{ padding: '12px', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}><Badge label={l.type} color="blue" /></td>
                          <td style={{ padding: '12px', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{l.from}</td>
                          <td style={{ padding: '12px', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{l.to}</td>
                          <td style={{ padding: '12px', fontSize: '0.82rem', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{l.days}</td>
                          <td style={{ padding: '12px', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '0.82rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}><Badge label={l.status} color={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'pink' : 'orange'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Could not load profile.</div>
            )}
          </div>
        </div>
      )}

      {canManageEmployees && isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <form onSubmit={handleSaveEmployee} style={{
            width: 'min(760px, 100%)',
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 24px 80px rgba(15,23,42,0.22)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {modalMode === 'edit' ? 'Edit Employee' : 'Add Account'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {modalMode === 'edit'
                    ? 'Update employee details stored in PostgreSQL.'
                    : 'Creates an account and linked employee profile in PostgreSQL.'}
                </p>
              </div>
              <button type="button" onClick={closeModal} style={{
                width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--glass-border)',
                background: 'var(--bg-space)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem',
              }}>
                x
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <EmployeeField label="Full Name" name="name" value={form.name} error={errors.name} onChange={updateForm} placeholder="Employee name" />
              <EmployeeField label="Email" name="email" type="email" value={form.email} error={errors.email} onChange={updateForm} placeholder="employee@company.com" />
              <EmployeeField label="Phone" name="phone" value={form.phone} onChange={updateForm} placeholder="+91 98765 43210" />
              <EmployeeField label="Department" name="department" value={form.department} error={errors.department} onChange={updateForm} placeholder="Operations" />
              <div>
                <label style={fieldLabelStyle}>Job Role / Designation</label>
                <select
                  value={STANDARD_JOB_ROLES.includes(form.jobTitle) ? form.jobTitle : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') updateForm('jobTitle', val);
                    else updateForm('jobTitle', '');
                  }}
                  style={fieldInputStyle}
                >
                  {STANDARD_JOB_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="custom">Other / Custom Role...</option>
                </select>
                {(!STANDARD_JOB_ROLES.includes(form.jobTitle) || form.jobTitle === '') && (
                  <input
                    type="text"
                    placeholder="Type custom role..."
                    value={form.jobTitle}
                    onChange={(e) => updateForm('jobTitle', e.target.value)}
                    style={{ ...fieldInputStyle, marginTop: 8 }}
                  />
                )}
                {errors.jobTitle && <div style={{ color: 'var(--accent-pink)', fontSize: '0.72rem', marginTop: 5 }}>{errors.jobTitle}</div>}
              </div>
              <EmployeeField label="Monthly Salary" name="salary" type="number" value={form.salary} error={errors.salary} onChange={updateForm} placeholder="35000" />
              <EmployeeField label="Joining Date" name="joinedOn" type="date" value={form.joinedOn} onChange={updateForm} />
              <div>
                <label style={fieldLabelStyle}>Status</label>
                <select value={form.status} onChange={(e) => updateForm('status', e.target.value)} style={fieldInputStyle}>
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label style={fieldLabelStyle}>Dashboard Access Role</label>
                <select value={form.accountRole} onChange={(e) => updateForm('accountRole', e.target.value)} style={fieldInputStyle}>
                  <option value="sales_developer">Sales & Developer</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={fieldLabelStyle}>Reports To (Manager)</label>
                <select value={form.managerId} onChange={(e) => updateForm('managerId', e.target.value)} style={{ ...fieldInputStyle, borderColor: errors.managerId ? 'var(--accent-pink)' : 'var(--glass-border)' }}>
                  <option value="">No manager assigned</option>
                  {managerOptions.map((manager) => (
                    <option key={manager.databaseId} value={manager.databaseId}>
                      {manager.name} - {manager.role || 'Manager'}{manager.dept ? `, ${manager.dept}` : ''}
                    </option>
                  ))}
                </select>
                {errors.managerId && <div style={{ color: 'var(--accent-pink)', fontSize: '0.72rem', marginTop: 5 }}>{errors.managerId}</div>}
              </div>
              <EmployeeField label="Username" name="username" value={form.username} error={errors.username} onChange={updateForm} placeholder="Auto from email if empty" />
              <EmployeeField
                label={modalMode === 'edit' ? 'New Password' : 'Temporary Password'}
                name="password"
                type="text"
                value={form.password}
                error={errors.password}
                onChange={updateForm}
                placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : ''}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 22, alignItems: 'center' }}>
              <div>
                {modalMode === 'edit' && (
                  <button type="button" onClick={handleRemoveEmployee} disabled={isSaving} style={{
                    padding: '10px 18px', borderRadius: 100, border: '1px solid rgba(236,72,153,0.24)',
                    background: 'rgba(236,72,153,0.08)', color: 'var(--accent-pink)', fontWeight: 800, cursor: 'pointer',
                  }}>
                    Remove Employee
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={closeModal} disabled={isSaving} style={{
                  padding: '10px 18px', borderRadius: 100, border: '1px solid var(--glass-border)',
                  background: 'var(--bg-space)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} style={{
                  padding: '10px 20px', borderRadius: 100, border: 'none',
                  background: 'var(--text-primary)', color: '#fff', fontWeight: 800, cursor: 'pointer',
                }}>
                  {isSaving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const fieldLabelStyle = {
  display: 'block',
  fontSize: '0.76rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 6,
};

const fieldInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid var(--glass-border)',
  borderRadius: 10,
  background: 'var(--bg-space)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem',
  outline: 'none',
};

function EmployeeField({ label, name, value, onChange, error, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        style={{ ...fieldInputStyle, borderColor: error ? 'var(--accent-pink)' : 'var(--glass-border)' }}
      />
      {error && <div style={{ color: 'var(--accent-pink)', fontSize: '0.72rem', marginTop: 5 }}>{error}</div>}
    </div>
  );
}
