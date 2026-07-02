import React, { useCallback, useEffect, useState } from 'react';
import { hrApiFetch } from '../hr/hrApi';

const STATUS_META = {
  PENDING_VERIFICATION: {
    label: 'Pending Verification',
    color: '#ca8a04',
    bg: 'rgba(234,179,8,0.12)',
    icon: '⏳',
    desc: 'Your account has been created. Please upload your required documents so HR can verify your profile.',
    step: 1,
  },
  DOCUMENT_SUBMITTED: {
    label: 'Documents Submitted',
    color: '#2563eb',
    bg: 'rgba(59,130,246,0.12)',
    icon: '📋',
    desc: 'Your documents have been submitted and are awaiting HR review. This typically takes 1–2 business days.',
    step: 2,
  },
  VERIFIED: {
    label: 'Verified',
    color: '#059669',
    bg: 'rgba(16,185,129,0.12)',
    icon: '✅',
    desc: 'Your account has been verified by HR. You now have full access to all dashboard features.',
    step: 3,
  },
  REJECTED: {
    label: 'Rejected',
    color: '#dc2626',
    bg: 'rgba(239,68,68,0.12)',
    icon: '❌',
    desc: 'Your documents were rejected by HR. Please review the rejection reason and re-upload your documents.',
    step: 1,
  },
};

const DOC_STATUS_COLORS = {
  PENDING:   { bg: 'rgba(234,179,8,0.1)',   c: '#ca8a04',   label: 'Pending' },
  VERIFIED:  { bg: 'rgba(16,185,129,0.1)',  c: '#059669',   label: 'Verified' },
  REJECTED:  { bg: 'rgba(239,68,68,0.1)',   c: '#dc2626',   label: 'Rejected' },
};

const STEPS = [
  { id: 1, label: 'Upload Documents' },
  { id: 2, label: 'HR Review' },
  { id: 3, label: 'Access Granted' },
];

function DocStatusBadge({ status }) {
  const s = DOC_STATUS_COLORS[status] || DOC_STATUS_COLORS.PENDING;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 11px', borderRadius: 100,
      fontSize: '0.71rem', fontWeight: 700, background: s.bg, color: s.c,
    }}>
      {s.label}
    </span>
  );
}

export default function VerificationStatus({ user }) {
  const [status, setStatus] = useState('PENDING_VERIFICATION');
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await hrApiFetch('/api/employee/verification-status');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus(data.verificationStatus || 'PENDING_VERIFICATION');
        setEmployee(data.employee || null);
        setDocuments(data.documents || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const meta = STATUS_META[status] || STATUS_META.PENDING_VERIFICATION;
  const currentStep = meta.step;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Loading verification status…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 900,
          fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 6,
        }}>
          Verification Status
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Track the progress of your account verification below.
        </p>
      </div>

      {/* Stepper */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative',
      }}>
        {STEPS.map((step, idx) => {
          const isVerifiedState = status === 'VERIFIED';
          const isDone = isVerifiedState ? true : currentStep > step.id;
          const isActive = isVerifiedState ? false : currentStep === step.id;
          const color = isDone || isActive ? meta.color : '#94a3b8';
          return (
            <React.Fragment key={step.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: isDone ? meta.color : isActive ? meta.bg : 'rgba(148,163,184,0.1)',
                  border: `2px solid ${isDone || isActive ? meta.color : '#475569'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? '1.1rem' : '0.95rem', fontWeight: 800,
                  color: isDone ? '#fff' : isActive ? meta.color : '#64748b',
                  transition: 'all 0.3s',
                }}>
                  {isDone ? '✓' : step.id}
                </div>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 600,
                  color: isActive || isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                  textAlign: 'center',
                }}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{
                  flex: 2, height: 2,
                  background: currentStep > step.id ? meta.color : 'var(--glass-border)',
                  transition: 'background 0.3s', marginBottom: 24,
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Card */}
      <div style={{
        background: meta.bg, border: `1px solid ${meta.color}40`,
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 18,
      }}>
        <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{meta.icon}</div>
        <div>
          <div style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: '1.15rem', color: meta.color, marginBottom: 8,
          }}>
            {meta.label}
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {meta.desc}
          </p>
        </div>
      </div>

      {/* Employee Profile Summary */}
      {employee && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
        }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 14,
          }}>
            Your Profile
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 24px' }}>
            {[
              ['Name', employee.name],
              ['Employee Code', employee.employeeCode],
              ['Department', employee.department],
              ['Role', employee.jobTitle],
              ['Email', employee.email],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>{lbl}</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{val || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
        borderRadius: 16, padding: '20px 24px',
      }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16,
        }}>
          Submitted Documents ({documents.length})
        </div>

        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            color: 'var(--text-muted)', fontSize: '0.85rem',
          }}>
            No documents uploaded yet. Go to <strong>Document Upload</strong> to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                padding: '12px 16px',
                background: 'var(--bg-space)', borderRadius: 10,
                border: '1px solid var(--glass-border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, color: 'var(--text-primary)',
                    fontSize: '0.85rem', textTransform: 'capitalize', marginBottom: 2,
                  }}>
                    {(doc.docType || 'other').replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {doc.fileName}
                    {doc.uploadedAt && ` · ${new Date(doc.uploadedAt).toLocaleDateString('en-IN')}`}
                  </div>
                  {doc.rejectionReason && doc.status === 'REJECTED' && (
                    <div style={{
                      marginTop: 6, fontSize: '0.75rem', color: '#dc2626',
                      background: 'rgba(239,68,68,0.08)', padding: '5px 10px',
                      borderRadius: 6, lineHeight: 1.5,
                    }}>
                      <strong>Reason:</strong> {doc.rejectionReason}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <DocStatusBadge status={doc.status} />
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.76rem', color: 'var(--text-muted)',
                        textDecoration: 'none', fontWeight: 600,
                        padding: '4px 12px', border: '1px solid var(--glass-border)',
                        borderRadius: 100, display: 'inline-block',
                      }}
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
