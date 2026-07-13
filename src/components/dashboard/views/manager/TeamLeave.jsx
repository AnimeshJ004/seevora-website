import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader, Panel, StatsGrid, Badge, Btn, Table, ExpandableText } from '../shared';
import { hrApiFetch } from '../hr/hrApi';

const STATUS_COLORS = { pending: 'orange', approved: 'green', rejected: 'pink' };

function labelize(value) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN');
}

export default function TeamLeave() {
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leavesRes, summaryRes] = await Promise.all([
        hrApiFetch('/api/manager/leaves'),
        hrApiFetch('/api/manager/leaves/summary'),
      ]);
      const leavesData = await leavesRes.json().catch(() => ({}));
      const summaryData = await summaryRes.json().catch(() => ({}));

      if (!leavesRes.ok) showToast(leavesData.message || 'Unable to load team leave requests.');
      else setLeaves(leavesData.leaves || []);

      if (!summaryRes.ok) showToast(summaryData.message || 'Unable to load leave summary.');
      else setSummary(summaryData);
    } catch {
      showToast('Unable to reach the leave server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLeaves = useMemo(() => {
    if (statusFilter === 'all') return leaves;
    return leaves.filter((leave) => leave.status === statusFilter);
  }, [leaves, statusFilter]);

  const handleDecision = async (leaveId, action) => {
    setIsSaving(true);
    try {
      const response = await hrApiFetch(`/api/manager/leaves/${leaveId}/${action}`, { method: 'PUT' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.message || `Failed to ${action} leave.`);
        return;
      }
      showToast(data.message || `Leave ${action}d.`);
      loadData();
    } catch {
      showToast(`Unable to ${action} leave.`);
    } finally {
      setIsSaving(false);
    }
  };

  const stats = [
    { label: 'Pending', value: summary.pending || 0, color: 'orange' },
    { label: 'Approved', value: summary.approved || 0, color: 'green' },
    { label: 'Rejected', value: summary.rejected || 0, color: 'pink' },
    { label: 'On Leave Today', value: summary.onLeaveToday || 0, color: 'purple' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', zIndex: 9999, boxShadow: '0 8px 24px rgba(16,185,129,0.3)', maxWidth: 380 }}>
          {toast}
        </div>
      )}

      <PageHeader title="Team Leave" sub="Approve leave requests from your direct reports" />
      <StatsGrid stats={stats} />

      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            {isLoading ? 'Loading requests...' : `${filteredLeaves.length} visible requests`}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ padding: '8px 14px', border: '1px solid var(--glass-border)', borderRadius: 100, background: 'var(--bg-space)', color: 'var(--text-secondary)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              type="button"
              onClick={loadData}
              style={{ padding: '8px 14px', borderRadius: 100, border: '1px solid var(--glass-border)', background: 'var(--bg-space)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>Loading team leave requests...</p>
        ) : filteredLeaves.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 40 }}>
            {leaves.length === 0
              ? 'No team leave requests found. HR must assign employees to this manager before their requests appear here.'
              : 'No leave requests match this filter.'}
          </p>
        ) : (
          <Table
            cols={['Employee', 'Leave Type', 'From', 'To', 'Days', 'Reason', 'Applied', 'Status', 'Actions']}
            rows={filteredLeaves.map((leave) => [
              <div key="employee">
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{leave.emp}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{leave.employeeCode || leave.email}</div>
              </div>,
              <span key="type" style={{ textTransform: 'capitalize' }}>{labelize(leave.type)}</span>,
              leave.from,
              leave.to,
              <span key="days" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{leave.days}</span>,
              <ExpandableText key="reason" text={leave.reason} />,
              formatDate(leave.applied),
              <Badge key="status" label={labelize(leave.status)} color={STATUS_COLORS[leave.status] || 'gray'} />,
              leave.status === 'pending' ? (
                <div key="actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn label="Approve" size="sm" onClick={() => handleDecision(leave.id, 'approve')} />
                  <Btn label="Reject" variant="danger" size="sm" onClick={() => handleDecision(leave.id, 'reject')} />
                </div>
              ) : (
                <span key="reviewed" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {leave.reviewedAt ? formatDate(leave.reviewedAt) : '-'}
                </span>
              ),
            ])}
          />
        )}
      </Panel>
    </div>
  );
}
