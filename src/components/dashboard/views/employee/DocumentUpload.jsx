import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hrApiFetch } from '../hr/hrApi';

const DOC_CONFIGS = [
  { key: 'aadhaar',                  label: 'Aadhaar / ID Proof',         icon: '🪪', required: true },
  { key: 'pan',                      label: 'PAN Card',                    icon: '💳', required: true },
  { key: 'resume',                   label: 'Resume / CV',                 icon: '📄', required: true },
  { key: 'qualification_certificate',label: 'Qualification Certificate',   icon: '🎓', required: true },
  { key: 'bank_details',             label: 'Bank Details / Cancelled Cheque', icon: '🏦', required: true },
  { key: 'other',                    label: 'Other (Optional)',             icon: '📎', required: false },
];

const STATUS_COLORS = {
  PENDING:   { bg: 'rgba(234,179,8,0.12)',   c: '#ca8a04',   label: 'Pending Review' },
  VERIFIED:  { bg: 'rgba(16,185,129,0.12)',  c: '#059669',   label: 'Verified' },
  REJECTED:  { bg: 'rgba(239,68,68,0.12)',   c: '#dc2626',   label: 'Rejected' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: 100,
      fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.c,
    }}>
      {s.label}
    </span>
  );
}

export default function DocumentUpload({ user }) {
  const [verificationStatus, setVerificationStatus] = useState('PENDING_VERIFICATION');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');
  const fileInputRefs = useRef({});

  const handleSubmitPartial = async () => {
    setSubmitting(true);
    try {
      const res = await hrApiFetch('/api/employee/documents/submit', { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Documents submitted successfully!');
        setVerificationStatus('DOCUMENT_SUBMITTED');
        await loadStatus();
      } else {
        showToast(data.message || 'Submission failed. Please try again.', 'error');
      }
    } catch {
      showToast('Unable to reach the server. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 4000);
  };

  const loadStatus = useCallback(async () => {
    try {
      const res = await hrApiFetch('/api/employee/verification-status');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setVerificationStatus(data.verificationStatus || 'PENDING_VERIFICATION');
        setDocuments(data.documents || []);
      }
    } catch {}
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const getDocStatus = (docKey) => {
    const doc = documents.find((d) => d.docType === docKey);
    return doc || null;
  };

  const handleUpload = async (docKey, file) => {
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File is too large. Maximum size is 5 MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docKey);

    setUploading((prev) => ({ ...prev, [docKey]: true }));

    try {
      const res = await hrApiFetch('/api/employee/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Document uploaded successfully!');
        setVerificationStatus('DOCUMENT_SUBMITTED');
        await loadStatus();
      } else {
        showToast(data.message || 'Upload failed. Please try again.', 'error');
      }
    } catch {
      showToast('Unable to reach the server. Please try again.', 'error');
    } finally {
      setUploading((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  const triggerFileInput = (docKey) => {
    if (fileInputRefs.current[docKey]) {
      fileInputRefs.current[docKey].value = '';
      fileInputRefs.current[docKey].click();
    }
  };

  const statusConfig = {
    PENDING_VERIFICATION: {
      banner: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', icon: '⏳', color: '#ca8a04' },
      title: 'Account Pending Verification',
      message: 'Your account is not verified by HR yet. Please upload your documents below and wait for approval.',
    },
    DOCUMENT_SUBMITTED: {
      banner: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', icon: '📋', color: '#2563eb' },
      title: 'Documents Submitted',
      message: 'Your documents have been submitted successfully. Please wait for HR verification.',
    },
    REJECTED: {
      banner: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: '❌', color: '#dc2626' },
      title: 'Documents Rejected',
      message: 'Your documents were rejected by HR. Please check the reason below and upload again.',
    },
    VERIFIED: {
      banner: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: '✅', color: '#059669' },
      title: 'Account Verified',
      message: 'Your account has been verified by HR. You now have full access to the dashboard.',
    },
  };

  const sc = statusConfig[verificationStatus] || statusConfig.PENDING_VERIFICATION;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 860, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toastType === 'error' ? '#dc2626' : '#059669',
          color: '#fff', padding: '12px 22px', borderRadius: 12,
          fontWeight: 600, fontSize: '0.85rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          animation: 'slideIn 0.3s ease',
          maxWidth: 380,
        }}>
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.6rem',
          color: 'var(--text-primary)', marginBottom: 6,
        }}>
          Document Upload
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Upload your required documents for HR verification. All documents are stored securely.
        </p>
      </div>

      {/* Status Banner */}
      <div style={{
        background: sc.banner.bg,
        border: `1px solid ${sc.banner.border}`,
        borderRadius: 14, padding: '16px 22px',
        display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28,
      }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{sc.banner.icon}</span>
        <div>
          <div style={{ fontWeight: 700, color: sc.banner.color, marginBottom: 4, fontSize: '0.95rem' }}>
            {sc.title}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {sc.message}
          </div>
        </div>
      </div>

      {/* Document Upload Cards */}
      <div style={{ display: 'grid', gap: 16 }}>
        {DOC_CONFIGS.map((doc) => {
          const existing = getDocStatus(doc.key);
          const isUploading = uploading[doc.key];
          const isRejected = existing?.status === 'REJECTED';
          const isVerified = existing?.status === 'VERIFIED';

          return (
            <div key={doc.key} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isRejected ? 'rgba(239,68,68,0.3)' : isVerified ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
              borderRadius: 16, padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap',
              transition: 'box-shadow 0.2s',
            }}>
              {/* Left: info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: isVerified ? 'rgba(16,185,129,0.1)' : isRejected ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem',
                }}>
                  {doc.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {doc.label}
                    {doc.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                  </div>
                  {existing ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {existing.fileName} · Uploaded {existing.uploadedAt ? new Date(existing.uploadedAt).toLocaleDateString('en-IN') : ''}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      PDF, JPG, PNG or DOC · Max 5 MB
                    </div>
                  )}
                  {/* Rejection Reason */}
                  {isRejected && existing?.rejectionReason && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px',
                      background: 'rgba(239,68,68,0.08)', borderRadius: 8,
                      fontSize: '0.78rem', color: '#dc2626', lineHeight: 1.5,
                    }}>
                      <strong>Rejected:</strong> {existing.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: status + action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                {existing && <StatusBadge status={existing.status} />}

                {/* View uploaded file */}
                {existing?.fileUrl && (
                  <a
                    href={existing.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '7px 16px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 600,
                      background: 'var(--bg-space)', color: 'var(--text-secondary)',
                      border: '1px solid var(--glass-border)', cursor: 'pointer',
                      textDecoration: 'none', display: 'inline-block',
                    }}
                  >
                    View
                  </a>
                )}

                {/* Upload / Re-upload button */}
                {!isVerified && (
                  <>
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[doc.key] = el; }}
                      style={{ display: 'none' }}
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.key, file);
                      }}
                    />
                    <button
                      onClick={() => triggerFileInput(doc.key)}
                      disabled={isUploading}
                      style={{
                        padding: '8px 20px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700,
                        background: isRejected ? '#dc2626' : 'var(--text-primary)',
                        color: '#fff', border: 'none', cursor: isUploading ? 'wait' : 'pointer',
                        opacity: isUploading ? 0.7 : 1, whiteSpace: 'nowrap',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {isUploading ? 'Uploading…' : existing ? (isRejected ? 'Re-upload' : 'Replace') : 'Upload'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Later Submission Card */}
      {(verificationStatus === 'PENDING_VERIFICATION' || verificationStatus === 'REJECTED') && (
        <div style={{
          marginTop: 24, padding: '24px 28px',
          background: 'rgba(99, 102, 241, 0.04)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h4 style={{ margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.98rem' }}>
              Submit Uploaded Documents
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Don't have all documents on hand right now? You can submit your uploaded documents for review and upload the remaining files later.
            </p>
          </div>
          <button
            onClick={handleSubmitPartial}
            disabled={submitting}
            style={{
              padding: '10px 24px', borderRadius: 100, fontSize: '0.85rem', fontWeight: 700,
              background: '#4f46e5', color: '#fff', border: 'none', cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit & Upload Rest Later'}
          </button>
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: 24, padding: '14px 20px',
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> All documents marked with <span style={{ color: '#ef4444' }}>*</span> are required.
        After uploading, HR will review your documents within 1–2 business days.
        You will have access to the full dashboard once verified.
      </div>
    </div>
  );
}
