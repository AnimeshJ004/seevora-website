
import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hrApiFetch } from './hrApi';

const C = {
  bg:     "#f1f5f9",
  card:   "#ffffff",
  card2:  "#f8fafc",
  border: "#e2e8f0",
  text:   "#0f172a",
  muted:  "#475569",
  dim:    "#94a3b8",
  blue:   "#6366f1",
  green:  "#10b981",
  orange: "#f97316",
  purple: "#8b5cf6",
  red:    "#ef4444",
  cyan:   "#0ea5e9",
};

const statusColor = { present: C.green, full_day: C.green, half_day: C.orange, absent: C.red, wfh: C.blue, late: C.orange };

function card(s = {}) {
  return { background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...s };
}

function navigableProps(target, onNavigate, canNavigate) {
  if (!target || !onNavigate || (canNavigate && !canNavigate(target))) return {};
  return {
    role: "button",
    tabIndex: 0,
    onClick: () => onNavigate(target),
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onNavigate(target);
      }
    },
  };
}

const MOBILE_STYLES = `
  .hr-kpi-grid    { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:20px; }
  .hr-mid-grid    { display:grid; grid-template-columns:2fr 1fr;       gap:16px; margin-bottom:16px; }
  .hr-dept-grid   { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
  @media (max-width: 768px) {
    .hr-kpi-grid  { grid-template-columns: repeat(2,1fr); gap:10px; }
    .hr-mid-grid  { grid-template-columns: 1fr; }
    .hr-dept-grid { grid-template-columns: repeat(2,1fr); gap:10px; }
  }
  @media (max-width: 400px) {
    .hr-kpi-grid  { grid-template-columns: 1fr; }
    .hr-dept-grid { grid-template-columns: 1fr; }
  }
`;

export default function HRDashboard({ user, onNavigate, canNavigate }) {
  const name = user?.name?.split(" ")[0] || "HR";
  const [toast, setToast] = useState(null);

  // Summary data from employees
  const [empSummary, setEmpSummary] = useState({ total: 0, active: 0, inactive: 0, probation: 0, byDepartment: [] });

  // Attendance data
  const [attendance, setAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({ total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 });

  // Leave data
  const [leaveSummary, setLeaveSummary] = useState({ pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
  const [pendingLeaves, setPendingLeaves] = useState([]);

  // Payroll data
  const [payrollSummary, setPayrollSummary] = useState({ totalPayroll: '₹0', totalRecords: 0 });

  // Documents data
  const [docSummary, setDocSummary] = useState({ total: 0, verified: 0, pending: 0 });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const lastFetchedRef = useRef(0);

  const loadAll = useCallback(async () => {
    lastFetchedRef.current = Date.now();
    try {
      const results = await Promise.allSettled([
        hrApiFetch('/api/hr/employees/summary'),
        hrApiFetch('/api/hr/attendance/today'),
        hrApiFetch('/api/hr/leaves/summary'),
        hrApiFetch('/api/hr/leaves?status=pending'),
        hrApiFetch('/api/hr/payroll/summary'),
        hrApiFetch('/api/hr/documents/summary'),
      ]);

      // Employee summary
      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const data = await results[0].value.json().catch(() => ({}));
        setEmpSummary({
          total: Number(data.total || 0),
          active: Number(data.active || 0),
          inactive: Number(data.inactive || 0),
          probation: Number(data.probation || 0),
          byDepartment: data.byDepartment || [],
        });
      }

      // Attendance today
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const data = await results[1].value.json().catch(() => ({}));
        setAttendance((data.attendance || []).slice(0, 5));
        setAttendanceSummary(data.summary || { total: 0, present: 0, absent: 0, fullDay: 0, halfDay: 0 });
      }

      // Leave summary
      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const data = await results[2].value.json().catch(() => ({}));
        setLeaveSummary(data);
      }

      // Pending leaves
      if (results[3].status === 'fulfilled' && results[3].value.ok) {
        const data = await results[3].value.json().catch(() => ({}));
        setPendingLeaves((data.leaves || []).slice(0, 3));
      }

      // Payroll summary
      if (results[4].status === 'fulfilled' && results[4].value.ok) {
        const data = await results[4].value.json().catch(() => ({}));
        setPayrollSummary(data);
      }

      // Documents summary
      if (results[5].status === 'fulfilled' && results[5].value.ok) {
        const data = await results[5].value.json().catch(() => ({}));
        setDocSummary(data);
      }
    } catch {
      // Silently fail — dashboard shows 0s
    }
  }, []);

  useEffect(() => {
    loadAll();

    const refreshAll = () => loadAll();

    // Throttle focus-triggered refreshes — only reload if 60+ seconds have passed
    const handleFocus = () => {
      if (Date.now() - lastFetchedRef.current > 60_000) {
        loadAll();
      }
    };

    window.addEventListener('seevora:hr-employees-changed', refreshAll);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('seevora:hr-employees-changed', refreshAll);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadAll]);

  const handleApproveLeave = async (id) => {
    try {
      const res = await hrApiFetch(`/api/hr/leaves/${id}/approve`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Leave approved.'); loadAll(); }
      else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
  };

  const handleRejectLeave = async (id) => {
    try {
      const res = await hrApiFetch(`/api/hr/leaves/${id}/reject`, { method: 'PUT' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast(data.message || 'Leave rejected.'); loadAll(); }
      else showToast(data.message || 'Failed.');
    } catch { showToast('Server error.'); }
  };

  const presentCount = attendanceSummary.present + attendanceSummary.fullDay + attendanceSummary.halfDay;

  const kpis = [
    { label: "Total Employees",    value: String(empSummary.total),         delta: empSummary.active > 0 ? `${empSummary.active} active` : "", color: C.blue, target: "employees" },
    { label: "Present Today",      value: String(presentCount),             delta: attendanceSummary.total > 0 ? `of ${attendanceSummary.total}` : "", color: C.green, target: "attendance" },
    { label: "On Leave Today",     value: String(leaveSummary.onLeaveToday || 0), delta: leaveSummary.pending > 0 ? `${leaveSummary.pending} pending` : "", color: C.orange, target: "leave" },
    { label: "Payroll This Month", value: payrollSummary.totalPayroll || "₹0",     delta: payrollSummary.totalRecords > 0 ? `${payrollSummary.paid || 0} paid` : "", color: C.green, target: "payroll" },
    { label: "Docs Unverified",    value: String(docSummary.pending || 0),         delta: docSummary.total > 0 ? `of ${docSummary.total}` : "", color: C.red, target: "document-verifications" },
  ];

  const departmentColors = [C.blue, C.green, C.purple, C.orange, C.red, C.cyan];
  const departments = empSummary.byDepartment.length > 0
    ? empSummary.byDepartment.map((department, index) => ({
        ...department,
        color: departmentColors[index % departmentColors.length],
      }))
    : [
        { dept: "Engineering", count: 0, pct: 0, color: C.blue },
        { dept: "Sales",       count: 0, pct: 0, color: C.green },
        { dept: "Operations",  count: 0, pct: 0, color: C.purple },
        { dept: "Finance",     count: 0, pct: 0, color: C.orange },
        { dept: "HR",          count: 0, pct: 0, color: C.red },
      ];

  return (
    <div style={{ color: C.muted, fontFamily: "'Inter',sans-serif", position: "relative" }}>
      <style>{MOBILE_STYLES}</style>

      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, background: C.green, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: "0.85rem", zIndex: 9999, boxShadow: "0 8px 24px rgba(16,185,129,0.3)" }}>
          {toast}
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {name}!
        </h2>
        <p style={{ fontSize: "0.82rem", color: C.muted }}>Here's your HR overview for today.</p>
      </div>

      {/* KPI Cards */}
      <div className="hr-kpi-grid">
        {kpis.map((k, i) => (
          <div
            key={i}
            {...navigableProps(k.target, onNavigate, canNavigate)}
            style={card({ padding: "20px 20px 18px", textAlign: "left", cursor: canNavigate?.(k.target) ? "pointer" : "default", outline: "none" })}
          >
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: "2.35rem", color: C.text, lineHeight: 0.95 }}>{k.value}</div>
            <div style={{ fontSize: "0.72rem", color: C.dim, marginTop: 10, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: k.color }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="hr-mid-grid">

        {/* Attendance table */}
        <div {...navigableProps("attendance", onNavigate, canNavigate)} style={card({ cursor: canNavigate?.("attendance") ? "pointer" : "default", outline: "none" })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text }}>Today's Attendance</span>
            <span style={{ fontSize: "0.72rem", color: C.green, background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 100 }}>● Live</span>
          </div>
          {attendance.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: C.dim, textAlign: "center", padding: "20px 0" }}>No attendance data for today yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Employee", "Department", "Check In", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, padding: "0 8px 10px 0", borderBottom: "1px solid " + C.border }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>{attendance.map((a, i) => (
                <tr key={i}>
                  <td style={{ padding: "10px 8px 10px 0", fontSize: "0.82rem", fontWeight: 600, color: C.text, borderBottom: "1px solid " + C.border }}>{a.name || a.emp || '—'}</td>
                  <td style={{ padding: "10px 8px 10px 0", fontSize: "0.78rem", color: C.muted, borderBottom: "1px solid " + C.border }}>{a.department || '—'}</td>
                  <td style={{ padding: "10px 8px 10px 0", fontSize: "0.78rem", color: C.muted, borderBottom: "1px solid " + C.border }}>{a.loginTime || '—'}</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid " + C.border }}>
                    <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 600, background: (statusColor[a.status] || C.dim) + "22", color: statusColor[a.status] || C.dim }}>
                      {(a.status || 'absent').replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        {/* Pending leaves */}
        <div {...navigableProps("leave", onNavigate, canNavigate)} style={card({ cursor: canNavigate?.("leave") ? "pointer" : "default", outline: "none" })}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: 14 }}>Pending Leave Requests</div>
          {pendingLeaves.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: C.dim, textAlign: "center", padding: "20px 0" }}>No pending leave requests.</p>
          ) : pendingLeaves.map((l, i) => (
            <div key={l.id || i} style={{ padding: "12px 0", borderBottom: i < pendingLeaves.length - 1 ? "1px solid " + C.border : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{l.emp}</span>
                <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 600, background: "rgba(249,115,21,0.1)", color: C.orange }}>PENDING</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: C.dim, marginBottom: 8 }}>{l.type?.replace(/_/g, ' ')} · {l.from} → {l.to} ({l.days} days)</div>
              {l.reason && <div style={{ fontSize: "0.75rem", color: C.muted, marginBottom: 8, fontStyle: "italic" }}>"{l.reason}"</div>}
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.orange }}>
                Awaiting manager approval
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div>
        {/* Headcount by dept */}
        <div {...navigableProps("employees", onNavigate, canNavigate)} style={card({ cursor: canNavigate?.("employees") ? "pointer" : "default", outline: "none" })}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: 14 }}>Headcount by Department</div>
          <div className="hr-dept-grid">
            {departments.map(d => (
              <div key={d.dept} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: C.muted, marginBottom: 4 }}>
                  <span>{d.dept}</span><span style={{ fontWeight: 700 }}>{d.count}</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: d.pct + "%", background: d.color, borderRadius: 100 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
