
import React from 'react';
import { useCallback, useEffect, useState } from 'react';
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

const attendance = [];
const leaves = [];
const candidates = [];

const statusColor = { present: C.green, late: C.orange, absent: C.red, wfh: C.blue };
const candColor   = { shortlisted: C.purple, hired: C.green, open: C.blue };

function BarChart() {
  const vals = [0, 0, 0, 0, 0, 0, 0];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60, marginTop: 8 }}>
      {vals.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", height: v * 0.5 + "px", background: v > 80 ? C.green : v > 40 ? C.orange : C.border, borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
          <span style={{ fontSize: "0.62rem", color: C.dim }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function card(s = {}) {
  return { background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...s };
}

export default function HRDashboard({ user }) {
  const name = user?.name?.split(" ")[0] || "HR";
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    probation: 0,
    byDepartment: [],
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadSummary = useCallback(async ({ showErrors = true } = {}) => {
    try {
      const response = await hrApiFetch('/api/hr/employees/summary');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (showErrors) showToast(data.message || 'Unable to load HR summary.');
        return;
      }
      setSummary({
        total: Number(data.total || 0),
        active: Number(data.active || 0),
        inactive: Number(data.inactive || 0),
        probation: Number(data.probation || 0),
        byDepartment: data.byDepartment || [],
      });
    } catch {
      if (showErrors) showToast('Unable to reach the HR server.');
    }
  }, []);

  useEffect(() => {
    loadSummary();

    const refreshSummary = () => loadSummary({ showErrors: false });
    window.addEventListener('seevora:hr-employees-changed', refreshSummary);
    window.addEventListener('focus', refreshSummary);

    return () => {
      window.removeEventListener('seevora:hr-employees-changed', refreshSummary);
      window.removeEventListener('focus', refreshSummary);
    };
  }, [loadSummary]);

  const kpis = [
    { label: "Total Employees",    value: String(summary.total), delta: "", color: C.blue },
    { label: "Present Today",      value: "0",                   delta: "", color: C.green },
    { label: "On Leave Today",     value: "0",                   delta: "", color: C.orange },
    { label: "Open Positions",     value: "0",                   delta: "", color: C.purple },
    { label: "Payroll This Month", value: "\u20B90",             delta: "", color: C.green },
    { label: "Late Today",         value: "0",                   delta: "", color: C.red },
  ];

  const departmentColors = [C.blue, C.green, C.purple, C.orange, C.red, C.cyan];
  const departments = summary.byDepartment.length > 0
    ? summary.byDepartment.map((department, index) => ({
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

      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, background: C.green, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: "0.85rem", zIndex: 9999, boxShadow: "0 8px 24px rgba(16,185,129,0.3)", animation: "none" }}>
          {toast}
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.text, marginBottom: 4 }}>
          Good Morning, {name}!
        </h2>
        <p style={{ fontSize: "0.82rem", color: C.muted }}>Here's your HR overview for today.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={card({ padding: "20px 20px 18px", textAlign: "left" })}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: "2.35rem", color: C.text, lineHeight: 0.95, letterSpacing: 0 }}>{k.value}</div>
            <div style={{ fontSize: "0.72rem", color: C.dim, marginTop: 10, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: k.color }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Attendance table */}
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text }}>Today's Attendance</span>
            <span style={{ fontSize: "0.72rem", color: C.green, background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 100 }}>● Live</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Employee", "Department", "Check In", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, padding: "0 8px 10px 0", borderBottom: "1px solid " + C.border }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>{attendance.map((a, i) => (
              <tr key={i}>
                <td style={{ padding: "10px 8px 10px 0", fontSize: "0.82rem", fontWeight: 600, color: C.text, borderBottom: "1px solid " + C.border }}>{a.name}</td>
                <td style={{ padding: "10px 8px 10px 0", fontSize: "0.78rem", color: C.muted, borderBottom: "1px solid " + C.border }}>{a.dept}</td>
                <td style={{ padding: "10px 8px 10px 0", fontSize: "0.78rem", color: C.muted, borderBottom: "1px solid " + C.border }}>{a.checkIn}</td>
                <td style={{ padding: "10px 0", borderBottom: "1px solid " + C.border }}>
                  <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 600, background: statusColor[a.status] + "22", color: statusColor[a.status] }}>
                    {a.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        {/* Pending leaves */}
        <div style={card()}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: 14 }}>Pending Leave Requests</div>
          {leaves.map((l, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < leaves.length - 1 ? "1px solid " + C.border : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{l.name}</span>
                <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 600, background: "rgba(249,115,21,0.1)", color: C.orange }}>PENDING</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: C.dim, marginBottom: 8 }}>{l.type} &middot; {l.from} &middot; {l.days} days</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => showToast("Leave approved for " + l.name)} style={{ flex: 1, padding: "6px", background: C.green, border: "none", borderRadius: 8, color: "#fff", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>Approve</button>
                <button onClick={() => showToast("Leave rejected for " + l.name)} style={{ flex: 1, padding: "6px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: C.red, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>Reject</button>
              </div>
            </div>
          ))}
          {/* Weekly attendance bar */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid " + C.border }}>
            <div style={{ fontSize: "0.75rem", color: C.dim, marginBottom: 4 }}>Weekly Attendance Rate</div>
            <BarChart />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Headcount by dept */}
        <div style={card()}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: 14 }}>Headcount by Department</div>
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

        {/* Recruitment pipeline */}
        <div style={card()}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: 14 }}>Recruitment Pipeline</div>
          {candidates.map((c, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < candidates.length - 1 ? "1px solid " + C.border : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{c.name}</span>
                <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 600, background: candColor[c.status] + "22", color: candColor[c.status] }}>{c.status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: C.dim }}>{c.role} &middot; {c.round}</div>
            </div>
          ))}
          <button style={{ width: "100%", marginTop: 14, padding: "9px", background: "transparent", border: "1px dashed " + C.border, borderRadius: 8, color: C.blue, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>+ Post New Job</button>
        </div>

        {/* Quick actions */}
        <div style={card()}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { icon: "ADD", label: "Add Employee" },
              { icon: "ATT", label: "Mark Attendance" },
              { icon: "LV", label: "Approve Leave" },
              { icon: "PAY", label: "Run Payroll" },
              { icon: "DOC", label: "Upload Doc" },
              { icon: "RPT", label: "HR Report" },
            ].map((a, i) => (
              <button key={i}
                onClick={() => showToast(a.label + " — coming soon!")}
                style={{ padding: "12px 8px", background: C.card2, border: "1px solid " + C.border, borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: C.muted, fontSize: "0.72rem", fontWeight: 600, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.blue + "11"; e.currentTarget.style.color = C.blue; e.currentTarget.style.borderColor = C.blue + "44"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.card2; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}>
                <span style={{ fontSize: "1.2rem" }}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
