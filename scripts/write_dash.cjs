const fs = require("fs");

const content = `import React, { useState } from 'react';

/* -- Mini line chart using SVG -- */
function LineChart({ data, color, height=60, width=180 }) {
  const max = Math.max(...data); const min = Math.min(...data);
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1))*width;
    const y = height - ((v-min)/(max-min||1))*(height-8)-4;
    return x+","+y;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(" ").at(-1).split(",")[0]} cy={pts.split(" ").at(-1).split(",")[1]} r="3" fill={color}/>
    </svg>
  );
}

/* -- Mini bar chart -- */
function BarChart({ data, color="#4f8ef7", height=80 }) {
  const max = Math.max(...data.map(d=>d.v));
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:height}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",background:color,borderRadius:"3px 3px 0 0",height:(d.v/max*height*0.85)+"px",opacity:0.85,transition:"height 0.4s"}}/>
          <span style={{fontSize:"0.6rem",color:"var(--ds-muted)"}}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

/* -- Multi-line chart -- */
function MultiLine({ datasets, labels, height=120, width="100%" }) {
  const [hover, setHover] = React.useState(null);
  const allVals = datasets.flatMap(d=>d.data);
  const max = Math.max(...allVals); const min = Math.min(...allVals);
  const W = 520; const H = height;
  const colors = ["#4f8ef7","#10b981","#f97316","#ec4899"];
  return (
    <div style={{position:"relative"}}>
      <svg viewBox={"0 0 "+W+" "+H} width="100%" height={H} preserveAspectRatio="none" style={{overflow:"visible"}}>
        {datasets.map((ds,di)=>{
          const pts = ds.data.map((v,i)=>{
            const x=(i/(ds.data.length-1))*W;
            const y=H-((v-min)/(max-min||1))*(H-10)-5;
            return x+","+y;
          }).join(" ");
          return <polyline key={di} points={pts} fill="none" stroke={colors[di]||colors[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>;
        })}
      </svg>
      <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
        {datasets.map((ds,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.72rem",color:"var(--ds-muted)"}}>
            <span style={{width:20,height:2,background:colors[i]||colors[0],borderRadius:2,display:"inline-block"}}/>
            {ds.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const kpis = [
  {label:"Total Calls Handled", value:"1,248", trend:"+18.5%", up:true, icon:"??", color:"rgba(79,142,247,0.15)", ic:"#4f8ef7", spark:[40,55,48,62,58,70,65,80,72,85]},
  {label:"New Leads",           value:"364",   trend:"+22.7%", up:true, icon:"??", color:"rgba(16,185,129,0.15)", ic:"#10b981", spark:[20,28,24,35,30,42,38,45,40,52]},
  {label:"Appointments",        value:"256",   trend:"+12.4%", up:true, icon:"??", color:"rgba(249,115,21,0.15)", ic:"#f97316", spark:[30,35,32,40,38,44,42,50,46,55]},
  {label:"Upcoming Today",      value:"32",    trend:"+8.2%",  up:true, icon:"?", color:"rgba(240,180,41,0.15)", ic:"#f0b429", spark:[10,12,11,15,13,16,14,18,16,20]},
  {label:"No-show Rate",        value:"6.8%",  trend:"-2.3%",  up:false,icon:"?", color:"rgba(239,68,68,0.15)",  ic:"#ef4444", spark:[10,9,11,8,10,7,9,8,7,6]},
  {label:"Revenue (This Week)", value:"?2,45,680", trend:"+15.9%", up:true, icon:"?", color:"rgba(16,185,129,0.15)", ic:"#10b981", spark:[60,75,68,85,80,95,88,102,96,110]},
];

const recentLeads = [
  {name:"Rohit Sharma",  src:"Website",  time:"10:24 AM", badge:"New",        bc:"rgba(79,142,247,0.15)",  bct:"#4f8ef7"},
  {name:"Priya Verma",   src:"WhatsApp", time:"09:58 AM", badge:"Contacted",  bc:"rgba(16,185,129,0.15)",  bct:"#10b981"},
  {name:"Ankit Patel",   src:"AI Call",  time:"09:32 AM", badge:"Interested", bc:"rgba(240,180,41,0.15)",  bct:"#f0b429"},
  {name:"Sneha Gupta",   src:"Website",  time:"09:10 AM", badge:"New",        bc:"rgba(79,142,247,0.15)",  bct:"#4f8ef7"},
  {name:"Vikas Singh",   src:"WhatsApp", time:"08:47 AM", badge:"Warm",       bc:"rgba(249,115,21,0.15)",  bct:"#f97316"},
];

const aiActivity = [
  {label:"Total Calls",          value:186,     icon:"??"},
  {label:"Answered by AI",       value:"172 (92.5%)", icon:"??"},
  {label:"New Enquiries",        value:74,      icon:"??"},
  {label:"Missed Calls Recovered",value:12,    icon:"??"},
];

const topServices = [
  {name:"General Consultation", count:78, color:"#4f8ef7"},
  {name:"Dental Checkup",       count:56, color:"#10b981"},
  {name:"Physiotherapy Session",count:42, color:"#f0b429"},
  {name:"Skin Treatment",       count:31, color:"#f97316"},
  {name:"Hair Treatment",       count:28, color:"#9e3cec"},
];

const perfSummary = [
  {label:"Lead Conversion Rate", value:"23.6%", trend:"+4.8%", up:true},
  {label:"Average Response Time", value:"12 sec", trend:"-3 sec", up:true},
  {label:"Appointments / Day",   value:"36.5",  trend:"+6.2%", up:true},
  {label:"Customer Satisfaction",value:"4.7/5", trend:"+0.3",  up:true},
];

const quickActions = [
  {label:"Add Appointment", icon:"??", color:"rgba(79,142,247,0.2)"},
  {label:"Add Lead",        icon:"?", color:"rgba(16,185,129,0.2)"},
  {label:"Send Broadcast",  icon:"??", color:"rgba(37,211,102,0.2)"},
  {label:"Create Campaign", icon:"??", color:"rgba(249,115,21,0.2)"},
  {label:"Add Review Request",icon:"?",color:"rgba(240,180,41,0.2)"},
  {label:"View Reports",    icon:"??", color:"rgba(158,60,236,0.2)"},
];

const apptDatasets = [
  { label:"Booked",    data:[80,85,78,90,88,82,86,92,88,94,90,96] },
  { label:"Completed", data:[70,75,68,80,77,72,76,82,78,84,80,86] },
  { label:"Cancelled", data:[15,12,18,10,14,16,12,10,14,12,10,8] },
  { label:"No-show",   data:[8,6,10,5,7,9,6,5,7,6,5,4] },
];
const apptLabels = ["21 May","22 May","23 May","24 May","25 May","26 May","27 May"];

const revData = [
  {l:"1-7",v:120000},{l:"8-14",v:185000},{l:"15-21",v:165000},{l:"22-28",v:195000}
];

export default function AdminDashboard({ user }) {
  const name = user?.name?.split(" ")[0] || "Admin";
  const hour = new Date().getHours();
  const greet = hour<12?"Good Morning":hour<17?"Good Afternoon":"Good Evening";

  return (
    <div>
      {/* -- Welcome -- */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.5rem",color:"#fff",marginBottom:4}}>
            {greet}, {name}! ??
          </h2>
          <p style={{fontSize:"0.82rem",color:"var(--ds-muted)"}}>Here's what's happening with your business today.</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <select className="ds-select">
            <option>21 May 2025 - 27 May 2025</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
          <select className="ds-select">
            <option>All Branches</option>
            <option>Indore</option>
            <option>Bhopal</option>
          </select>
        </div>
      </div>

      {/* -- KPI Cards -- */}
      <div className="ds-kpi-grid" style={{marginBottom:20}}>
        {kpis.map((k,i)=>(
          <div key={i} className="ds-kpi-card">
            <div className="ds-kpi-icon" style={{background:k.color,fontSize:"1rem"}}>{k.icon}</div>
            <div className="ds-kpi-value">{k.value}</div>
            <div className="ds-kpi-label">{k.label}</div>
            <div className={"ds-kpi-trend "+(k.up?"up":"down")}>
              {k.up?"?":"?"} {k.trend} vs last 7 days
            </div>
          </div>
        ))}
      </div>

      {/* -- Row 1: Appointments chart + AI Activity + Recent Leads -- */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:16,marginBottom:16}}>

        {/* Appointments Overview */}
        <div className="ds-card">
          <div className="ds-card-title">
            Appointments Overview
            <select className="ds-select">
              <option>This Week</option><option>Last Week</option><option>This Month</option>
            </select>
          </div>
          <MultiLine datasets={apptDatasets} height={130} />
        </div>

        {/* AI Agent Activity */}
        <div className="ds-card">
          <div className="ds-card-title">AI Agent Activity (Today)</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {aiActivity.map((a,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:"1.1rem"}}>{a.icon}</span>
                  <span style={{fontSize:"0.8rem",color:"var(--ds-muted)"}}>{a.label}</span>
                </div>
                <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:"1rem",color:"#fff"}}>{a.value}</span>
              </div>
            ))}
          </div>
          <button style={{width:"100%",marginTop:14,padding:"8px",background:"transparent",border:"1px solid var(--ds-border)",borderRadius:7,fontSize:"0.75rem",color:"var(--ds-accent)",cursor:"pointer",fontWeight:600}}>
            View All Call Logs ?
          </button>
        </div>

        {/* Recent Leads */}
        <div className="ds-card">
          <div className="ds-card-title">
            Recent Leads
            <button style={{background:"none",border:"none",color:"var(--ds-accent)",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>View All</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {recentLeads.map((l,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#4f8ef7,#9e3cec)",color:"#fff",fontWeight:700,fontSize:"0.75rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {l.name[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.82rem",fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}</div>
                  <div style={{fontSize:"0.7rem",color:"var(--ds-muted)"}}>{l.src}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"0.68rem",color:"var(--ds-muted)",marginBottom:3}}>{l.time}</div>
                  <span style={{padding:"2px 8px",borderRadius:100,fontSize:"0.65rem",fontWeight:600,background:l.bc,color:l.bct}}>{l.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- Row 2: Revenue + Top Services + Performance + Quick Actions -- */}
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:16}}>

        {/* Revenue Overview */}
        <div className="ds-card">
          <div className="ds-card-title">
            Revenue Overview
            <select className="ds-select"><option>This Month</option><option>Last Month</option></select>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.6rem",color:"#fff"}}>? 9,78,450</div>
            <div style={{fontSize:"0.75rem",color:"var(--ds-green)",marginTop:2}}>? 16.3% vs last month</div>
          </div>
          <BarChart data={revData} color="#4f8ef7" height={80} />
        </div>

        {/* Top Services */}
        <div className="ds-card">
          <div className="ds-card-title">
            Top Services by Bookings
            <select className="ds-select"><option>This Week</option></select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {topServices.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:28,height:28,borderRadius:6,background:s.color+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",flexShrink:0}}>
                  {["??","??","??","??","??"][i]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"0.78rem",color:"var(--ds-text)",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                  <div className="ds-progress-track">
                    <div className="ds-progress-fill" style={{width:(s.count/78*100)+"%",background:s.color}}/>
                  </div>
                </div>
                <span style={{fontSize:"0.78rem",fontWeight:700,color:"#fff",flexShrink:0,width:24,textAlign:"right"}}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="ds-card">
          <div className="ds-card-title">
            Performance Summary
            <select className="ds-select"><option>This Week</option></select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {perfSummary.map((p,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:"0.78rem",color:"var(--ds-muted)"}}>{p.label}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:"0.95rem",color:"#fff"}}>{p.value}</div>
                  <div style={{fontSize:"0.68rem",color:p.up?"var(--ds-green)":"var(--ds-red)"}}>
                    {p.up?"?":"?"} {p.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ds-card">
          <div className="ds-card-title">Quick Actions</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {quickActions.map((q,i)=>(
              <button key={i} className="ds-qa-btn">
                <div className="ds-qa-btn-icon" style={{background:q.color,fontSize:"1.1rem"}}>{q.icon}</div>
                <span className="ds-qa-btn-label">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync("src/components/dashboard/views/admin/AdminDashboard.jsx", content, "utf8");
console.log("AdminDashboard done");
