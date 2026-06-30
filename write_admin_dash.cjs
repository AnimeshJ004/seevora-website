const fs = require("fs");
const c = `import React, { useState } from "react";

const C = {
  bg:     "#0a0f1e",
  card:   "#112240",
  card2:  "#0d1b2e",
  border: "rgba(255,255,255,0.07)",
  text:   "#e2e8f0",
  muted:  "#8b9cb6",
  dim:    "#64748b",
  blue:   "#4f8ef7",
  green:  "#10b981",
  orange: "#f97316",
  purple: "#9e3cec",
  red:    "#ef4444",
  cyan:   "#14c9e1",
};

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: "18px 20px", ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
      <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:700, fontSize:"0.88rem", color: C.text }}>{title}</span>
      {right && <span style={{ fontSize:"0.72rem", color: C.dim, background:"rgba(255,255,255,0.04)", padding:"4px 10px", borderRadius:6, cursor:"pointer" }}>{right}</span>}
    </div>
  );
}

function Delta({ val, down, note }) {
  return (
    <div style={{ fontSize:"0.72rem", fontWeight:600, color: down ? C.red : C.green, marginTop:8 }}>
      {down ? "v " : "^ "}{val} <span style={{ color: C.dim, fontWeight:400 }}>{note}</span>
    </div>
  );
}

function LineChart({ lines }) {
  const W = 600, H = 120;
  return (
    <svg viewBox={"0 0 " + W + " " + (H+20)} width="100%" height="130" preserveAspectRatio="none">
      {[0,30,60,90,120].map(y => (
        <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      {lines.map((l,li) => {
        const pts = l.pts.map((v,i) => ({ x: i*(W/(l.pts.length-1)), y: H - (v/100*H) }));
        const d = pts.map((p,i) => (i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
        return <path key={li} d={d} fill="none" stroke={l.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>;
      })}
      {["21 May","22 May","23 May","24 May","25 May","26 May","27 May"].map((d,i)=>(
        <text key={d} x={i*(W/6)} y={H+16} fill={C.dim} fontSize="10" textAnchor="middle">{d}</text>
      ))}
    </svg>
  );
}

function BarChart() {
  const vals = [60,130,170,150,110];
  const max = 200;
  const W = 300, H = 90;
  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" height={H} preserveAspectRatio="none">
      {vals.map((v,i)=>(
        <rect key={i} x={i*60+5} y={H-(v/max*H)} width="50" height={v/max*H}
          rx="4" fill={i===2 ? C.blue : C.blue+"55"}/>
      ))}
    </svg>
  );
}

const kpis = [
  { label:"Total Calls Handled", value:"1,248", delta:"+18.5%", note:"vs last 7 days", color: C.blue,   icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" },
  { label:"New Leads",            value:"364",   delta:"+22.7%", note:"vs last 7 days", color: C.green,  icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
  { label:"Appointments",         value:"256",   delta:"+12.4%", note:"vs last 7 days", color: C.purple, icon: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18" },
  { label:"Upcoming Today",       value:"32",    delta:"+8.2%",  note:"vs yesterday",   color: C.orange, icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { label:"No-show Rate",         value:"6.8%",  delta:"-2.3%",  note:"vs last 7 days", color: C.red,    down:true, icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" },
  { label:"Revenue (This Week)",  value:"2,45,680", prefix:"Rs ", delta:"+15.9%", note:"vs last 7 days", color: C.green, icon: "M12 2v20 M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" },
];

const apptLines = [
  { label:"Booked",    color: C.blue,   pts:[60,70,80,75,85,90,80,88,75,95,88,100,92] },
  { label:"Completed", color: C.green,  pts:[50,55,65,60,70,75,65,72,60,80,72,85,78] },
  { label:"Cancelled", color: C.orange, pts:[15,20,18,22,25,20,18,22,20,25,22,20,18] },
  { label:"No-show",   color: C.red,    pts:[8,10,12,10,8,12,10,8,12,10,8,10,8] },
];

const aiActivity = [
  { label:"Total Calls",            value:"186",         icon:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" },
  { label:"Answered by AI",         value:"172 (92.5%)", icon:"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" },
  { label:"New Enquiries",          value:"74",          icon:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
  { label:"Missed Calls Recovered", value:"12",          icon:"M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 0 0-9.78 2.096A4.001 4.001 0 0 0 3 15z" },
];

const recentLeads = [
  { name:"Rohit Sharma",  src:"Website",  time:"10:24 AM", status:"New",        sc: C.blue },
  { name:"Priya Verma",   src:"WhatsApp", time:"09:58 AM", status:"Contacted",  sc: C.green },
  { name:"Ankit Patel",   src:"AI Call",  time:"09:32 AM", status:"Interested", sc: C.purple },
  { name:"Sneha Gupta",   src:"Website",  time:"09:10 AM", status:"New",        sc: C.blue },
  { name:"Vikas Singh",   src:"WhatsApp", time:"08:47 AM", status:"Warm",       sc: C.orange },
];

const topServices = [
  { name:"General Consultation", count:78, color: C.blue },
  { name:"Dental Checkup",       count:56, color: C.green },
  { name:"Physiotherapy Session",count:42, color: C.orange },
  { name:"Skin Treatment",       count:31, color: C.purple },
  { name:"Hair Treatment",       count:28, color: C.red },
];

const perf = [
  { label:"Lead Conversion Rate",  value:"23.6%", delta:"4.6%" },
  { label:"Average Response Time", value:"12 sec",delta:"3 sec" },
  { label:"Appointments / Day",    value:"36.5",  delta:"6.2%" },
  { label:"Customer Satisfaction", value:"4.7/5", delta:"0.3" },
];

const quickActions = [
  { label:"Add Appointment", icon:"M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18" },
  { label:"Add Lead",        icon:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
  { label:"Send Broadcast",  icon:"M22 2L11 13 M22 2L15 22l-4-9-9-4z" },
  { label:"Create Campaign", icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { label:"Review Request",  icon:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" },
  { label:"View Reports",    icon:"M18 20V10 M12 20V4 M6 20v-6 M2 20h20" },
];

export default function AdminDashboard({ user }) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";

  return (
    <div style={{ fontFamily:"Inter,sans-serif", color: C.text }}>

      {/* Greeting bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:"1.4rem", color: C.text, marginBottom:2 }}>
            Good {greet}, {user?.name?.split(" ")[0] || "Admin"}!
          </h2>
          <p style={{ fontSize:"0.8rem", color: C.dim }}>Here's what's happening with your business today.</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ padding:"8px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid " + C.border, borderRadius:8, fontSize:"0.78rem", color: C.muted, cursor:"pointer" }}>
            21 May 2025 - 27 May 2025
          </div>
          <div style={{ padding:"8px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid " + C.border, borderRadius:8, fontSize:"0.78rem", color: C.muted, cursor:"pointer" }}>
            All Branches
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:18 }}>
        {kpis.map((k,i) => (
          <Card key={i} style={{ padding:"16px 16px" }}>
            <div style={{ width:36, height:36, borderRadius:10, background: k.color+"22", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                {k.icon.split(" M ").map((p,j)=><path key={j} d={j===0?p:"M "+p}/>)}
              </svg>
            </div>
            <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:"1.4rem", color: k.color, lineHeight:1 }}>
              {k.prefix || ""}{k.value}
            </div>
            <div style={{ fontSize:"0.7rem", color: C.muted, marginTop:3, marginBottom:6, lineHeight:1.3 }}>{k.label}</div>
            <Delta val={k.delta} down={k.down} note={k.note} />
          </Card>
        ))}
      </div>

      {/* Middle 3 columns */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr", gap:14, marginBottom:14 }}>
        {/* Appointments chart */}
        <Card>
          <CardTitle title="Appointments Overview" right="This Week" />
          <div style={{ display:"flex", gap:16, marginBottom:10, flexWrap:"wrap" }}>
            {apptLines.map(l=>(
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem", color: C.muted }}>
                <span style={{ width:18, height:2.5, background:l.color, borderRadius:2, display:"inline-block" }}/>
                {l.label}
              </div>
            ))}
          </div>
          <LineChart lines={apptLines} />
        </Card>

        {/* AI Activity */}
        <Card>
          <CardTitle title="AI Agent Activity (Today)" />
          {aiActivity.map((a,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i<aiActivity.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(79,142,247,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    {a.icon.split(" M ").map((p,j)=><path key={j} d={j===0?p:"M "+p}/>)}
                  </svg>
                </div>
                <span style={{ fontSize:"0.8rem", color: C.muted }}>{a.label}</span>
              </div>
              <span style={{ fontWeight:700, color: C.text, fontSize:"0.88rem" }}>{a.value}</span>
            </div>
          ))}
          <div style={{ textAlign:"center", marginTop:12 }}>
            <span style={{ fontSize:"0.75rem", color: C.blue, cursor:"pointer" }}>View All Call Logs</span>
          </div>
        </Card>

        {/* Recent Leads */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:700, fontSize:"0.88rem", color: C.text }}>Recent Leads</span>
            <span style={{ fontSize:"0.72rem", color: C.blue, cursor:"pointer" }}>View All</span>
          </div>
          {recentLeads.map((l,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom: i<recentLeads.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background: C.blue+"33", color: C.blue, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.78rem", flexShrink:0 }}>
                {l.name[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"0.8rem", fontWeight:600, color: C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{l.name}</div>
                <div style={{ fontSize:"0.68rem", color: C.dim }}>{l.src} · {l.time}</div>
              </div>
              <span style={{ padding:"2px 8px", borderRadius:100, fontSize:"0.65rem", fontWeight:600, background: l.sc+"22", color: l.sc, flexShrink:0 }}>{l.status}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Bottom 4 columns */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14 }}>
        {/* Revenue */}
        <Card>
          <CardTitle title="Revenue Overview" right="This Month" />
          <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:"1.4rem", color: C.green, marginBottom:4 }}>Rs 9,78,450</div>
          <div style={{ fontSize:"0.72rem", color: C.green, marginBottom:10 }}>16.3% vs last month</div>
          <BarChart />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            {["1-7","8-14","15-21","22-28","29"].map(d=>(
              <span key={d} style={{ fontSize:"0.62rem", color: C.dim }}>{d}</span>
            ))}
          </div>
        </Card>

        {/* Top Services */}
        <Card>
          <CardTitle title="Top Services by Bookings" right="This Week" />
          {topServices.map((s,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", color: C.muted, marginBottom:4 }}>
                <span>{s.name}</span><span style={{ fontWeight:700, color: C.text }}>{s.count}</span>
              </div>
              <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:100, overflow:"hidden" }}>
                <div style={{ height:"100%", width:(s.count/78*100)+"%", background:s.color, borderRadius:100 }}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Performance */}
        <Card>
          <CardTitle title="Performance Summary" right="This Week" />
          {perf.map((p,i)=>(
            <div key={i} style={{ padding:"9px 0", borderBottom: i<perf.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ fontSize:"0.75rem", color: C.dim, marginBottom:4 }}>{p.label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:"1.05rem", color: C.text }}>{p.value}</span>
                <span style={{ fontSize:"0.7rem", fontWeight:600, color: C.green }}>+ {p.delta}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardTitle title="Quick Actions" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {quickActions.map((a,i)=>(
              <button key={i} style={{ padding:"12px 6px", background:"rgba(255,255,255,0.04)", border:"1px solid " + C.border, borderRadius:10, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, color: C.muted, fontSize:"0.7rem", fontWeight:600, transition:"all 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="rgba(79,142,247,0.1)"; e.currentTarget.style.color=C.blue; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color=C.muted; }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  {a.icon.split(" M ").map((p,j)=><path key={j} d={j===0?p:"M "+p}/>)}
                </svg>
                {a.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
`;
fs.writeFileSync("src/components/dashboard/views/admin/AdminDashboard.jsx", c, "utf8");
console.log("done");
