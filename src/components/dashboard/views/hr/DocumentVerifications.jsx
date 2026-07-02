import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, StatsGrid, Panel, Badge, Avatar, Btn } from '../shared';
import { hrApiFetch } from './hrApi';

const VS_CONFIG = {
  PENDING_VERIFICATION: { label: 'Pending Docs',       color: 'orange' },
  DOCUMENT_SUBMITTED:   { label: 'Docs Submitted',     color: 'blue'   },
  VERIFIED:             { label: 'Verified',            color: 'green'  },
  REJECTED:             { label: 'Rejected',            color: 'pink'   },
};

const DOC_STATUS_COLORS = {
  PENDING:   { bg: 'rgba(234,179,8,0.12)',   c: '#ca8a04' },
  VERIFIED:  { bg: 'rgba(16,185,129,0.12)',  c: '#059669' },
  REJECTED:  { bg: 'rgba(239,68,68,0.12)',   c: '#dc2626' },
};

function VsBadge({ status }) {
  const cfg = VS_CONFIG[status] || { label: status, color: 'gray' };
  return <Badge label={cfg.label} color={cfg.color} />;
}

function DocStatusBadge({ status }) {
  const s = DOC_STATUS_COLORS[status] || DOC_STATUS_COLORS.PENDING;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 100,
      fontSize: '0.71rem', fontWeight: 700, background: s.bg, color: s.c,
    }}>
      {status}
    </span>
  );
}

/* ── Reject Modal ── */
function RejectModal({ employee, onReject, onClose }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReject = async () => {
    if (!reason.trim()) { setError('Rejection reason is required.'); return; }
    setSaving(true);
    const empId = employee.id || employee.employeeId;
    await onReject(empId, reason.trim());
    setSaving(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 18, padding: 32, width: 460,
        border: '1px solid var(--glass-border)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem',
          }}>
            ❌
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Reject Documents
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {employee.name} · {employee.employeeCode}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: '0.78rem', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            Rejection Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            placeholder="Explain why the documents are being rejected (e.g., blurry image, incorrect document type, expired ID)…"
            rows={4}
            style={{
              width: '100%', padding: '12px 14px',
              border: error ? '1px solid #ef4444' : '1px solid var(--glass-border)',
              borderRadius: 10, fontSize: '0.85rem',
              background: 'var(--bg-space)', color: 'var(--text-primary)',
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
            }}
          />
          {error && <div style={{ fontSize: '0.76rem', color: '#ef4444', marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleReject}
            disabled={saving}
            style={{
              flex: 1, padding: '10px 0', background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: 100, fontWeight: 700, fontSize: '0.85rem',
              cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Rejecting…' : 'Reject Documents'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', background: 'var(--bg-space)', color: 'var(--text-secondary)',
              border: '1px solid var(--glass-border)', borderRadius: 100, fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Employee Detail Panel ── */
const DOC_CONFIGS = [
  { key: 'aadhaar',                  label: 'Aadhaar / ID Proof',         icon: '🪪', required: true },
  { key: 'pan',                      label: 'PAN Card',                    icon: '💳', required: true },
  { key: 'resume',                   label: 'Resume / CV',                 icon: '📄', required: true },
  { key: 'qualification_certificate',label: 'Qualification Certificate',   icon: '🎓', required: true },
  { key: 'bank_details',             label: 'Bank Details / Cancelled Cheque', icon: '🏦', required: true },
  { key: 'other',                    label: 'Other (Optional)',             icon: '📎', required: false },
];

function EmployeeDetailPanel({ employee, documents, onVerify, onReject, onClose }) {
  const vs = VS_CONFIG[employee.verificationStatus] || VS_CONFIG.PENDING_VERIFICATION;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 20, width: 680,
        maxHeight: '88vh', overflow: 'auto',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 0', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar name={employee.name} size={52} />
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {employee.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {employee.email} · <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{employee.employeeCode}</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <VsBadge status={employee.verificationStatus} />
                {employee.department && (
                  <Badge label={employee.department} color="cyan" />
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '1.4rem', padding: 4, lineHeight: 1,
          }}>
            ×
          </button>
        </div>

        {/* Actions */}
        {employee.verificationStatus !== 'VERIFIED' && (
          <div style={{
            margin: '20px 28px', padding: '16px 20px',
            background: 'var(--bg-space)', borderRadius: 12,
            border: '1px solid var(--glass-border)',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <button
              onClick={() => onVerify(employee.id)}
              style={{
                flex: 1, padding: '10px 0', background: '#059669', color: '#fff',
                border: 'none', borderRadius: 100, fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ✓ Verify Employee
            </button>
            <button
              onClick={() => onReject(employee)}
              style={{
                flex: 1, padding: '10px 0', background: 'rgba(239,68,68,0.1)', color: '#dc2626',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100,
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              ✗ Reject Documents
            </button>
          </div>
        )}

        {/* Documents */}
        <div style={{ padding: '0 28px 28px' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 14,
          }}>
            Employee Documents Status
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {DOC_CONFIGS.map((cfg) => {
              const doc = documents.find((d) => d.docType === cfg.key);
              
              if (doc) {
                return (
                  <div key={doc.id} style={{
                    background: 'var(--bg-space)', borderRadius: 12,
                    border: '1px solid var(--glass-border)', padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{
                          fontWeight: 700, color: 'var(--text-primary)',
                          fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                        }}>
                          <span>{cfg.icon}</span>
                          <span style={{ textTransform: 'capitalize' }}>
                            {doc.docTypeLabel || doc.docType?.replace(/_/g, ' ')}
                          </span>
                          {cfg.required && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>*</span>}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {doc.fileName}
                          {doc.fileSize && ` · ${doc.fileSize}`}
                          {doc.uploadedAt && ` · ${new Date(doc.uploadedAt).toLocaleDateString('en-IN')}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <DocStatusBadge status={doc.status} />
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 14px', borderRadius: 100,
                              background: 'var(--bg-card)', color: 'var(--text-secondary)',
                              border: '1px solid var(--glass-border)',
                              fontSize: '0.76rem', fontWeight: 600,
                              textDecoration: 'none', display: 'inline-block',
                            }}
                          >
                            View / Download
                          </a>
                        )}
                      </div>
                    </div>
                    {doc.rejectionReason && doc.status === 'REJECTED' && (
                      <div style={{
                        marginTop: 10, fontSize: '0.76rem', color: '#dc2626',
                        background: 'rgba(239,68,68,0.08)', padding: '6px 12px',
                        borderRadius: 8, lineHeight: 1.6,
                      }}>
                        <strong>Rejection reason:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={cfg.key} style={{
                    background: 'rgba(148, 163, 184, 0.04)', borderRadius: 12,
                    border: '1px dashed var(--glass-border)', padding: '14px 18px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                        {cfg.required && <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600 }}>(Required)</span>}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        No file uploaded yet.
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 100,
                      fontSize: '0.71rem', fontWeight: 700, background: 'rgba(148,163,184,0.08)', color: '#64748b',
                    }}>
                      Pending Upload
                    </span>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export default function DocumentVerifications() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ pendingVerification: 0, documentSubmitted: 0, verified: 0, rejected: 0 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Detail panel state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setApiError('');
    try {
      const res = await hrApiFetch('/api/hr/documents/verifications');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmployees(data.employees || []);
        setStats(data.stats || {});
      } else {
        setApiError(data.message || `Server returned ${res.status}. Check the console for details.`);
      }
    } catch (err) {
      setApiError('Unable to reach the server. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDetail = async (emp) => {
    try {
      const res = await hrApiFetch(`/api/hr/documents/verifications/${emp.employeeId}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelectedEmployee(data.employee);
        setSelectedDocs(data.documents || []);
        setShowDetail(true);
      } else {
        showToast(data.message || 'Failed to load details.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    }
  };

  const handleVerify = async (employeeId) => {
    try {
      const res = await hrApiFetch(`/api/hr/documents/verifications/${employeeId}/verify`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Employee verified successfully.');
        setShowDetail(false);
        setRejectTarget(null);
        await loadData();
      } else {
        showToast(data.message || 'Verification failed.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    }
  };

  const handleRejectSubmit = async (employeeId, reason) => {
    try {
      const res = await hrApiFetch(`/api/hr/documents/verifications/${employeeId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Documents rejected.');
        setRejectTarget(null);
        setShowDetail(false);
        await loadData();
      } else {
        showToast(data.message || 'Rejection failed.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    }
  };

  /* Filtered list */
  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || emp.verificationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statCards = [
    { label: 'Docs Submitted', value: stats.documentSubmitted || 0, color: 'blue',   sub: 'Awaiting HR review' },
    { label: 'Pending Docs',   value: stats.pendingVerification || 0, color: 'orange', sub: 'No docs uploaded' },
    { label: 'Verified',       value: stats.verified || 0,           color: 'green',  sub: 'Full access granted' },
    { label: 'Rejected',       value: stats.rejected || 0,           color: 'pink',   sub: 'Needs re-upload' },
  ];

  const inputStyle = {
    padding: '8px 14px', border: '1px solid var(--glass-border)', borderRadius: 100,
    fontSize: '0.82rem', background: 'var(--bg-space)', color: 'var(--text-secondary)',
    outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 10001,
          background: toastType === 'error' ? '#dc2626' : '#059669',
          color: '#fff', padding: '12px 22px', borderRadius: 10,
          fontWeight: 600, fontSize: '0.85rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', maxWidth: 400,
        }}>
          {toast}
        </div>
      )}

      <PageHeader
        title="Document Verifications"
        sub="Review employee documents and manage verification status"
      />

      <StatsGrid stats={statCards} />

      <Panel>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            placeholder="Search by name, email, code, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 180, maxWidth: 320, padding: '8px 14px', border: '1px solid var(--glass-border)', borderRadius: 100, fontSize: '0.82rem', background: 'var(--bg-space)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={inputStyle}
          >
            <option value="ALL">All Statuses</option>
            <option value="DOCUMENT_SUBMITTED">Docs Submitted</option>
            <option value="PENDING_VERIFICATION">Pending Docs</option>
            <option value="REJECTED">Rejected</option>
            <option value="VERIFIED">Verified</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading employee verifications…
          </div>
        ) : apiError ? (
          <div style={{
            textAlign: 'center', padding: '32px 24px',
            background: 'rgba(239,68,68,0.08)', borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.25)',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>⚠️</div>
            <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6, fontSize: '0.9rem' }}>Failed to load verifications</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{apiError}</div>
            <button
              onClick={loadData}
              style={{ marginTop: 14, padding: '8px 20px', borderRadius: 100, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No employees found matching your filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Employee', 'Department / Role', 'Status', 'Documents', 'Last Upload', 'Actions'].map((col) => (
                    <th key={col} style={{
                      textAlign: 'left', fontSize: '0.72rem', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: 'var(--text-muted)', padding: '0 12px 12px 0',
                      borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => (
                  <tr
                    key={emp.employeeId}
                    onMouseEnter={(e) => [...e.currentTarget.cells].forEach((c) => (c.style.background = 'rgba(0,0,0,0.012)'))}
                    onMouseLeave={(e) => [...e.currentTarget.cells].forEach((c) => (c.style.background = ''))}
                  >
                    {/* Numbering */}
                    <td style={{ padding: '13px 12px 13px 0', fontSize: '0.82rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.04)', verticalAlign: 'middle', width: '30px' }}>
                      {idx + 1}
                    </td>
                    {/* Employee */}
                    <td style={{ padding: '13px 12px 13px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {emp.email}
                          </div>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent-teal)' }}>{emp.employeeCode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Dept / Role */}
                    <td style={{ padding: '13px 12px 13px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {emp.department || '—'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {emp.jobTitle || '—'}
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td style={{ padding: '13px 12px 13px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', verticalAlign: 'middle' }}>
                      <VsBadge status={emp.verificationStatus} />
                    </td>

                    {/* Docs */}
                    <td style={{ padding: '13px 12px 13px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {emp.verifiedCount > 0 && <Badge label={`${emp.verifiedCount} ✓`} color="green" />}
                        {emp.pendingCount > 0 && <Badge label={`${emp.pendingCount} pending`} color="orange" />}
                        {emp.rejectedCount > 0 && <Badge label={`${emp.rejectedCount} rejected`} color="pink" />}
                        {emp.docCount === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None uploaded</span>}
                      </div>
                    </td>

                    {/* Last Upload */}
                    <td style={{ padding: '13px 12px 13px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {emp.lastUpload ? new Date(emp.lastUpload).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Btn label="View Docs" size="sm" variant="ghost" onClick={() => openDetail(emp)} />
                        {emp.verificationStatus !== 'VERIFIED' && emp.docCount > 0 && (
                          <>
                            <Btn
                              label="Verify"
                              size="sm"
                              onClick={() => handleVerify(emp.employeeId)}
                            />
                            <Btn
                              label="Reject"
                              size="sm"
                              variant="danger"
                              onClick={() => setRejectTarget(emp)}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Employee Detail Modal */}
      {showDetail && selectedEmployee && (
        <EmployeeDetailPanel
          employee={selectedEmployee}
          documents={selectedDocs}
          onVerify={handleVerify}
          onReject={(emp) => {
            setRejectTarget(emp);
            setShowDetail(false);
          }}
          onClose={() => setShowDetail(false)}
        />
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          employee={rejectTarget}
          onReject={handleRejectSubmit}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
