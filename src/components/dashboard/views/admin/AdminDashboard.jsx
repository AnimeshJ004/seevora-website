import React, { useState, useEffect } from "react";
import { hrApiFetch } from "../hr/hrApi";

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

function Card({ children, style, onClick, title }) {
  const handleKeyDown = (event) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={title}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{
        background: C.card,
        border: "1px solid " + C.border,
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        outline: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
      <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:"0.88rem", color: C.text }}>{title}</span>
      {right && <span style={{ fontSize:"0.72rem", color: C.dim, background:"rgba(255,255,255,0.04)", padding:"4px 10px", borderRadius:6, cursor:"pointer" }}>{right}</span>}
    </div>
  );
}

/* Responsive style injected once */
const MOBILE_STYLES = `
  .admin-kpi-grid   { display:grid; grid-template-columns: repeat(4,1fr); gap:14px; margin-bottom:20px; }
  .admin-half-grid  { display:grid; grid-template-columns: 1fr 1fr;       gap:14px; margin-bottom:20px; }
  .admin-bottom-grid{ display:grid; grid-template-columns: 1fr 1fr;       gap:14px; }
  @media (max-width: 768px) {
    .admin-kpi-grid   { grid-template-columns: repeat(2,1fr); }
    .admin-half-grid  { grid-template-columns: 1fr; }
    .admin-bottom-grid{ grid-template-columns: 1fr; }
  }
  @media (max-width: 400px) {
    .admin-kpi-grid   { grid-template-columns: 1fr; }
  }
`;

export default function AdminDashboard({ user, onNavigate, canNavigate }) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchStats = async () => {
      try {
        const token = user?.token || localStorage.getItem('seevoraAuthToken');
        const res = await hrApiFetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || data?.message || `Dashboard stats request failed (${res.status})`);
        }
        if (!ignore) {
          setStats({
            employeesCount: 0,
            leadsCount: 0,
            projectsCount: 0,
            appointmentsCount: 0,
            presentToday: 0,
            auditRequestsCount: 0,
            taskStats: { todo: 0, in_progress: 0, done: 0 },
            recentLeads: [],
            upcomingAppointments: [],
            recentAuditRequests: [],
            recentAuditLogs: [],
            ...data,
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchStats();

    return () => {
      ignore = true;
    };
  }, [user?.token]);

  if (loading) {
    return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading dashboard...</div>;
  }

  if (!stats) {
    return <div style={{ padding: 40, color: C.red, textAlign: 'center' }}>Failed to load dashboard data.</div>;
  }

  const kpis = [
    { label:"Active Employees", value: stats.employeesCount || 0, color: C.blue, target: "employees", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
    { label:"Total Leads",      value: stats.leadsCount || 0,     color: C.green, target: "leads", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" },
    { label:"Active Projects",  value: stats.projectsCount || 0,  color: C.purple, target: "project-management", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
    { label:"Total Appointments",value: stats.appointmentsCount || 0, color: C.orange, target: "appointments", icon: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18" },
  ];

  const totalTasks = (stats.taskStats?.todo || 0) + (stats.taskStats?.in_progress || 0) + (stats.taskStats?.done || 0);
  const latestAuditRequest = stats.recentAuditRequests?.[0];
  const navigateIfAllowed = (target) => canNavigate?.(target) ? () => onNavigate?.(target) : undefined;

  return (
    <div style={{ fontFamily:"Inter,sans-serif", color: C.text, height: '100%', overflowY: 'auto' }}>
      <style>{MOBILE_STYLES}</style>

      {/* Greeting bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:"1.4rem", color: C.text, marginBottom:2 }}>
            Good {greet}, {user?.name?.split(" ")[0] || "Admin"}
          </h2>
          <p style={{ fontSize:"0.8rem", color: C.dim }}>Here's what's happening with your business today.</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="admin-kpi-grid">
        {kpis.map((k,i) => (
          <Card key={i} title={`Open ${k.label}`} onClick={navigateIfAllowed(k.target)} style={{ padding:"20px" }}>
            <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:"2.5rem", color: "#111", lineHeight:1 }}>
              {k.value}
            </div>
            <div style={{ fontSize:"0.85rem", color: C.muted, marginTop:8, fontWeight:600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Middle Sections */}
      <div className="admin-half-grid">
        
        {/* Messages */}
        <Card title="Open audit requests" onClick={navigateIfAllowed("audit-logs")}>
          <CardTitle title="Messages" />
          {latestAuditRequest ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.red, marginTop: 5, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: C.text }}>
                  {stats.auditRequestsCount || 1} new audit by {latestAuditRequest.name || "client"}
                </div>
                <div style={{ fontSize: "0.76rem", color: C.dim, marginTop: 4 }}>
                  {latestAuditRequest.company || latestAuditRequest.email || "Client audit request"}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:"0.8rem", color: C.dim }}>No new audit messages.</div>
          )}
        </Card>

        {/* Recent Leads */}
        <Card title="Open CRM leads" onClick={navigateIfAllowed("leads")}>
          <CardTitle title="Recent Leads" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {stats.recentLeads && stats.recentLeads.length > 0 ? stats.recentLeads.map((l,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom: 12, borderBottom: i<stats.recentLeads.length-1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background: C.blue+"15", color: C.blue, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.85rem", flexShrink:0 }}>
                  {l.name[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.85rem", fontWeight:700, color: C.text }}>{l.name}</div>
                  <div style={{ fontSize:"0.75rem", color: C.dim }}>{l.email || l.phone || 'No contact info'}</div>
                </div>
                <span style={{ padding:"4px 10px", borderRadius:100, fontSize:"0.65rem", fontWeight:700, background: C.blue+"15", color: C.blue, textTransform: 'uppercase' }}>
                  {l.pipeline_stage || 'NEW'}
                </span>
              </div>
            )) : <div style={{ fontSize:"0.8rem", color: C.dim }}>No recent leads found.</div>}
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card title="Open appointments" onClick={navigateIfAllowed("appointments")}>
          <CardTitle title="Upcoming Appointments" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {stats.upcomingAppointments && stats.upcomingAppointments.length > 0 ? stats.upcomingAppointments.map((a,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom: 12, borderBottom: i<stats.upcomingAppointments.length-1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width:40, height:40, borderRadius:8, background: C.orange+"15", color: C.orange, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:"0.6rem", fontWeight:700, textTransform:'uppercase' }}>{new Date(a.scheduled_at).toLocaleString('en-US', { month: 'short' })}</span>
                  <span style={{ fontSize:"0.9rem", fontWeight:800 }}>{new Date(a.scheduled_at).getDate()}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.85rem", fontWeight:700, color: C.text }}>{a.title}</div>
                  <div style={{ fontSize:"0.75rem", color: C.dim }}>{new Date(a.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} · {a.client_name || 'Internal'}</div>
                </div>
              </div>
            )) : <div style={{ fontSize:"0.8rem", color: C.dim }}>No upcoming appointments.</div>}
          </div>
        </Card>

        {/* Recent Businesses */}
        <Card title="Open businesses" onClick={navigateIfAllowed("businesses")}>
          <CardTitle title="Recent Businesses" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {stats.recentBusinesses && stats.recentBusinesses.length > 0 ? stats.recentBusinesses.map((b,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom: 12, borderBottom: i<stats.recentBusinesses.length-1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background: C.purple+"15", color: C.purple, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.85rem", flexShrink:0 }}>
                  {b.name?.[0]?.toUpperCase() || 'B'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.85rem", fontWeight:700, color: C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</div>
                  <div style={{ fontSize:"0.75rem", color: C.dim }}>{b.email || 'No email'}</div>
                </div>
                <span style={{ padding:"4px 10px", borderRadius:100, fontSize:"0.65rem", fontWeight:700, background: C.purple+"15", color: C.purple, textTransform: 'uppercase' }}>
                  {b.status || 'ACTIVE'}
                </span>
              </div>
            )) : <div style={{ fontSize:"0.8rem", color: C.dim }}>No recent businesses found.</div>}
          </div>
        </Card>

      </div>

      {/* Bottom Sections */}
      <div className="admin-bottom-grid">
        
        {/* Task Overview */}
        <Card title="Open task management" onClick={navigateIfAllowed("task-management")}>
          <CardTitle title="Task Overview" />
          {totalTasks > 0 ? (
            <div style={{ marginTop: 20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6, fontSize:"0.75rem", fontWeight:600 }}>
                <span style={{ color: C.muted }}>To Do</span>
                <span style={{ color: C.text }}>{stats.taskStats?.todo || 0}</span>
              </div>
              <div style={{ height:6, background:C.border, borderRadius:10, marginBottom:16 }}>
                <div style={{ height:"100%", width: `${((stats.taskStats?.todo || 0)/totalTasks)*100}%`, background:C.muted, borderRadius:10 }}/>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6, fontSize:"0.75rem", fontWeight:600 }}>
                <span style={{ color: C.orange }}>In Progress</span>
                <span style={{ color: C.text }}>{stats.taskStats?.in_progress || 0}</span>
              </div>
              <div style={{ height:6, background:C.orange+"33", borderRadius:10, marginBottom:16 }}>
                <div style={{ height:"100%", width: `${((stats.taskStats?.in_progress || 0)/totalTasks)*100}%`, background:C.orange, borderRadius:10 }}/>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6, fontSize:"0.75rem", fontWeight:600 }}>
                <span style={{ color: C.green }}>Done</span>
                <span style={{ color: C.text }}>{stats.taskStats?.done || 0}</span>
              </div>
              <div style={{ height:6, background:C.green+"33", borderRadius:10 }}>
                <div style={{ height:"100%", width: `${((stats.taskStats?.done || 0)/totalTasks)*100}%`, background:C.green, borderRadius:10 }}/>
              </div>
            </div>
          ) : <div style={{ fontSize:"0.8rem", color: C.dim }}>No tasks found.</div>}
        </Card>

        {/* Recent Audit Logs */}
        <Card title="Open audit logs" onClick={navigateIfAllowed("audit-logs")}>
          <CardTitle title="Recent System Activity" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {stats.recentAuditLogs && stats.recentAuditLogs.length > 0 ? stats.recentAuditLogs.map((log,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:C.blue, marginTop:6 }} />
                <div>
                  <div style={{ fontSize:"0.8rem", color: C.text, fontWeight:600 }}>
                    {log.user_name || 'System'} <span style={{ fontWeight:400, color: C.muted }}>performed</span> {log.action}
                  </div>
                  <div style={{ fontSize:"0.7rem", color: C.dim, marginTop:2 }}>
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            )) : <div style={{ fontSize:"0.8rem", color: C.dim }}>No recent activity.</div>}
          </div>
        </Card>

      </div>
    </div>
  );
}
