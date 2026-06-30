const fs = require("fs");

// -- Admin Dashboard (matching the screenshot design)
fs.writeFileSync("src/components/dashboard/views/admin/AdminDashboard.jsx", `
import React, { useState } from 'react';

const kpis = [
  { icon:"??", label:"Total Calls Handled", value:"1,248", delta:"+18.5%", note:"vs last 7 days", color:"#3b82f6" },
  { icon:"??", label:"New Leads",            value:"364",   delta:"+22.7%", note:"vs last 7 days", color:"#10b981" },
  { icon:"??", label:"Appointments",         value:"256",   delta:"+12.4%", note:"vs last 7 days", color:"#8b5cf6" },
  { icon:"??", label:"Upcoming Today",       value:"32",    delta:"+8.2%",  note:"vs yesterday",   color:"#f97316" },
  { icon:"?", label:"No-show Rate",         value:"6.8%",  delta:"-2.3%",  note:"vs last 7 days", color:"#ef4444", down:true },
  { icon:"?",  label:"Revenue (This Week)",  value:"?2,45,680", delta:"+15.9%", note:"vs last 7 days", color:"#10b981" },
];

const recentLeads = [
  { name:"Rohit Sharma",  src:"Website",  time:"10:24 AM", status:"New",        sc:"#3b82f6" },
  { name:"Priya Verma",   src:"WhatsApp", time:"09:58 AM", status:"Contacted",  sc:"#10b981" },
  { name:"Ankit Patel",   src:"AI Call",  time:"09:32 AM", status:"Interested", sc:"#8b5cf6" },
  { name:"Sneha Gupta",   src:"Website",  time:"09:10 AM", status:"New",        sc:"#3b82f6" },
  { name:"Vikas Singh",   src:"WhatsApp", time:"08:47 AM", status:"Warm",       sc:"#f97316" },
];

const aiActivity = [
  { label:"Total Calls",           value:"186",         sub:null },
  { label:"Answered by AI",        value:"172 (92.5%)", sub:null },
  { label:"New Enquiries",         value:"74",          sub:null },
  { label:"Missed Calls Recovered",value:"12",          sub:null },
];

const topServices = [
  { name:"General Consultation", count:78, color:"#3b82f6" },
  { name:"Dental Checkup",       count:56, color:"#10b981" },
  { name:"Physiotherapy Session",count:42, color:"#f97316" },
  { name:"Skin Treatment",       count:31, color:"#8b5cf6" },
  { name:"Hair Treatment",       count:28, color:"#ef4444" },
];

const perf = [
  { label:"Lead Conversion Rate",  value:"23.6%", delta:"+4.6%",  good:true },
  { label:"Average Response Time", value:"12 sec", delta:"-3 sec", good:true },
  { label:"Appointments / Day",    value:"36.5",  delta:"+6.2%",  good:true },
  { label:"Customer Satisfaction", value:"4.7/5", delta:"+0.3",   good:true },
];

const quickActions = [
  { label:"Add Appointment", icon:"??" },
  { label:"Add Lead",        icon:"??" },
  { label:"Send Broadcast",  icon:"??" },
  { label:"Create Campaign", icon:"??" },
  { label:"Add Review Request", icon:"?" },
  { label:"View Reports",    icon:"??" },
];

// Mini line chart using SVG
function LineChart({ color="#3b82f6" }) {
  const pts = [40,65,55,80,70,90,75,88,72,95,82,100,85].map((y,i)=>({x:i*(320/12),y:110-y}));
  const d = pts.map((p,i)=>(i===0?"M":"L")+p.x+","+p.y).join(" ");
  return (
    <svg viewBox="0 0 320 110" width="100%" height="60" preserveAspectRatio="none">
      <defs>
        <linearGradient id={\`g\${color.replace("#","")}\`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={d+" L320,110 L0,110 Z"} fill={\`url(#g\${color.replace("#","")})\`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity={i%3===0?1:0}/>)}
    </svg>
  );
}

// Mini bar chart
function BarChart({ color="#3b82f6" }) {
  const vals = [60,120,180,150,130];
  const max = Math.max(...vals);
  const days = ["1-7 May","8-14 May","15-21 May","22-28 May","29 May"];
  return (
    <svg viewBox="0 0 300 120" width="100%" height="100" preserveAspectRatio="none">
      {vals.map((v,i)=>(
        <rect key={i} x={i*60+10} y={120-(v/max*90)} width="40" height={v/max*90}
          rx="4" fill={i===3?color:color+"66"}/>
      ))}
    </svg>
  );
}

// Appointments line chart with legend
function ApptChart() {
  const lines = [
    { label:"Booked",    color:"#3b82f6", pts:[60,70,80,75,85,90,80,88,75,95,88,100,92] },
    { label:"Completed", color:"#10b981", pts:[50,55,65,60,70,75,65,72,60,80,72,85,78] },
    { label:"Cancelled", color:"#f97316", pts:[15,20,18,22,25,20,18,22,20,25,22,20,18] },
    { label:"No-show",   color:"#ef4444", pts:[8,10,12,10,8,12,10,8,12,10,8,10,8] },
  ];
  return (
    <div>
      <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
        {lines.map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.75rem",color:"#94a3b8"}}>
            <span style={{width:20,height:3,background:l.color,borderRadius:2,display:"inline-block"}}/>
            {l.label}
          </div>
        ))}
      </div>
      <svg viewBox="0 0 600 140" width="100%" height="120" preserveAspectRatio="none">
        {[0,35,70,105,140].map(y=>(
          <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4"/>
        ))}
        {lines.map(l=>{
          const pts = l.pts.map((v,i)=>({x:i*(600/12),y:140-(v/100*130)}));
          const d = pts.map((p,i)=>(i===0?"M":"L")+p.x+","+p.y).join(" ");
          return <path key={l.label} d={d} fill="none" stroke={l.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>;
        })}
        {["21 May","22 May","23 May","24 May","25 May","26 May","27 May"].map((d,i)=>(
          <text key={d} x={i*(600/6)} y="155" fill="#64748b" fontSize="12" textAnchor="middle">{d}</text>
        ))}
      </svg>
    </div>
  );
}

export default function AdminDashboard({ user }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const name = user?.name?.split(" ")[0] || "Admin";

  const card = (style={}) => ({ background:"#1e293b", border:"1px solid #334155", borderRadius:12, padding:"18px 20px", ...style });

  return (
    <div style={{color:"#e2e8f0",fontFamily:"'Inter',sans-serif"}}>

      {/* Greeting */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.5rem",color:"#f1f5f9",marginBottom:4}}>
            Good {greet}, {name}! ??
          </h2>
          <p style={{fontSize:"0.82rem",color:"#64748b"}}>Here's what's happening with your business today.</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{padding:"8px 14px",background:"#1e293b",border:"1px solid #334155",borderRadius:8,fontSize:"0.78rem",color:"#94a3b8",display:"flex",alignItems:"center",gap:6}}>
            ?? 21 May 2025 - 27 May 2025 ?
          </div>
          <div style={{padding:"8px 14px",background:"#1e293b",border:"1px solid #334155",borderRadius:8,fontSize:"0.78rem",color:"#94a3b8"}}>
            All Branches ?
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
        {kpis.map((k,i)=>(
          <div key={i} style={card()}>
            <div style={{fontSize:"1.4rem",marginBottom:8}}>{k.icon}</div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.5rem",color:k.color,lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:"0.72rem",color:"#94a3b8",marginTop:4,marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:"0.72rem",fontWeight:600,color:k.down?"#ef4444":"#10b981"}}>
              {k.delta} <span style={{color:"#64748b",fontWeight:400}}>{k.note}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 1fr",gap:16,marginBottom:16}}>
        {/* Appointments Overview chart */}
        <div style={card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9"}}>Appointments Overview</span>
            <span style={{fontSize:"0.75rem",color:"#64748b",background:"#0f172a",padding:"4px 10px",borderRadius:6}}>This Week ?</span>
          </div>
          <ApptChart />
        </div>

        {/* AI Agent Activity */}
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9",marginBottom:14}}>AI Agent Activity (Today)</div>
          {aiActivity.map((a,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom: i<aiActivity.length-1 ? "1px solid #1e3a5f" : "none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:32,height:32,borderRadius:"50%",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem"}}>
                  {i===0?"??":i===1?"??":i===2?"??":"??"}
                </span>
                <span style={{fontSize:"0.82rem",color:"#cbd5e1"}}>{a.label}</span>
              </div>
              <span style={{fontWeight:700,color:"#f1f5f9",fontSize:"0.9rem"}}>{a.value}</span>
            </div>
          ))}
          <div style={{marginTop:14,textAlign:"center"}}>
            <span style={{fontSize:"0.78rem",color:"#3b82f6",cursor:"pointer"}}>View All Call Logs ?</span>
          </div>
        </div>

        {/* Recent Leads */}
        <div style={card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9"}}>Recent Leads</span>
            <span style={{fontSize:"0.75rem",color:"#3b82f6",cursor:"pointer"}}>View All</span>
          </div>
          {recentLeads.map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom: i<recentLeads.length-1 ? "1px solid #1e3a5f" : "none"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"#3b82f6",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.75rem",flexShrink:0}}>
                {l.name[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"0.8rem",fontWeight:600,color:"#f1f5f9",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}</div>
                <div style={{fontSize:"0.7rem",color:"#64748b"}}>{l.src} · {l.time}</div>
              </div>
              <span style={{padding:"2px 8px",borderRadius:100,fontSize:"0.65rem",fontWeight:600,background:l.sc+"22",color:l.sc,flexShrink:0}}>{l.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16}}>
        {/* Revenue Overview */}
        <div style={card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9"}}>Revenue Overview</span>
            <span style={{fontSize:"0.75rem",color:"#64748b",background:"#0f172a",padding:"4px 10px",borderRadius:6}}>This Month ?</span>
          </div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.4rem",color:"#10b981",margin:"8px 0"}}>? 9,78,450</div>
          <div style={{fontSize:"0.72rem",color:"#10b981",marginBottom:8}}>? 16.3% vs last month</div>
          <BarChart color="#3b82f6" />
        </div>

        {/* Top Services */}
        <div style={card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9"}}>Top Services by Bookings</span>
            <span style={{fontSize:"0.75rem",color:"#64748b",background:"#0f172a",padding:"4px 8px",borderRadius:6}}>This Week ?</span>
          </div>
          {topServices.map((s,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",color:"#cbd5e1",marginBottom:4}}>
                <span>{s.name}</span><span style={{fontWeight:700}}>{s.count}</span>
              </div>
              <div style={{height:6,background:"#0f172a",borderRadius:100,overflow:"hidden"}}>
                <div style={{height:"100%",width:s.count/78*100+"%",background:s.color,borderRadius:100}}/>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div style={card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9"}}>Performance Summary</span>
            <span style={{fontSize:"0.75rem",color:"#64748b",background:"#0f172a",padding:"4px 8px",borderRadius:6}}>This Week ?</span>
          </div>
          {perf.map((p,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom: i<perf.length-1 ? "1px solid #1e3a5f" : "none"}}>
              <div style={{fontSize:"0.78rem",color:"#94a3b8",marginBottom:4}}>{p.label}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#f1f5f9"}}>{p.value}</span>
                <span style={{fontSize:"0.72rem",fontWeight:600,color:p.good?"#10b981":"#ef4444"}}>? {p.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9",marginBottom:14}}>Quick Actions</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {quickActions.map((a,i)=>(
              <button key={i} style={{padding:"12px 8px",background:"#0f172a",border:"1px solid #334155",borderRadius:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.2s",color:"#94a3b8",fontSize:"0.72rem",fontWeight:600}}
                onMouseEnter={e=>{ e.currentTarget.style.background="#1e3a5f"; e.currentTarget.style.color="#f1f5f9"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#0f172a"; e.currentTarget.style.color="#94a3b8"; }}>
                <span style={{fontSize:"1.2rem"}}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`, "utf8");
console.log("AdminDashboard done");
