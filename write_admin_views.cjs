const fs = require("fs");
const p = (f,c) => fs.writeFileSync("src/components/dashboard/views/admin/"+f, c, "utf8");

// -- AdminDashboard
p("AdminDashboard.jsx", `import React from 'react';
import { Panel, StatsGrid, Row, Badge, Avatar, ProgressBar } from '../shared';

const kpis = [
  {label:"Total Businesses",value:142,sub:"+8 this month",color:"cyan"},
  {label:"Active Businesses",value:118,sub:"83% of total",color:"green"},
  {label:"Pending Approvals",value:7,sub:"Needs review",color:"orange"},
  {label:"Total Users",value:394,sub:"Across all tenants",color:"purple"},
  {label:"Calls Today",value:47,sub:"+12% vs yesterday",color:"cyan"},
  {label:"Leads Today",value:23,sub:"9 hot leads",color:"orange"},
  {label:"Appointments",value:31,sub:"2 waitlist filled",color:"green"},
  {label:"Open Tickets",value:3,sub:"1 SLA breach",color:"pink"},
];

const auditEvents = [
  {sev:"info",     action:"LOGIN_SUCCESS",  actor:"Animesh J. (Super Admin)",   time:"2m ago"},
  {sev:"warning",  action:"LEAD_UPDATED",   actor:"Priya S. (Staff)",           time:"8m ago"},
  {sev:"security", action:"LOGIN_FAILED",   actor:"Unknown · 192.168.1.45",     time:"12m ago"},
  {sev:"info",     action:"APPT_CREATED",   actor:"Rajesh K. (Business Admin)", time:"25m ago"},
  {sev:"warning",  action:"APPT_CANCELLED", actor:"Sunita R. (Staff)",          time:"41m ago"},
  {sev:"info",     action:"USER_CREATED",   actor:"Animesh J. (Super Admin)",   time:"1hr ago"},
];

const sevColor = {info:"var(--accent-cyan)",warning:"var(--accent-orange)",security:"var(--accent-pink)",critical:"#ef4444"};

const bizRows = [
  {name:"Sunrise Clinic",    sector:"Healthcare",    status:"Active",   sc:"green", stage:"Live",     pct:100},
  {name:"EduFirst Academy",  sector:"Education",     status:"Active",   sc:"green", stage:"Live",     pct:100},
  {name:"GlowUp Salon",      sector:"Personal Care", status:"Active",   sc:"green", stage:"Live",     pct:87},
  {name:"PathLabs",          sector:"Diagnostic",    status:"Pending",  sc:"orange",stage:"Config",   pct:40},
  {name:"FitZone Gym",       sector:"Health & Fit",  status:"Active",   sc:"green", stage:"Live",     pct:95},
  {name:"LegalEdge Advisory",sector:"Legal",         status:"Pending",  sc:"orange",stage:"Approval", pct:0},
];

const modules = [
  {name:"AI Voice",pct:100,c:"green"},{name:"Appointments",pct:98,c:"green"},
  {name:"CRM",pct:100,c:"green"},{name:"Reviews",pct:95,c:"cyan"},{name:"SEO",pct:87,c:"orange"},
];

const clr = {green:"var(--accent-green)",cyan:"var(--accent-cyan)",orange:"var(--accent-orange)"};

export default function AdminDashboard({user}) {
  return (
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.4rem",color:"var(--text-primary)",marginBottom:4}}>
          Welcome back, {user?.name?.split(" ")[0]} ??
        </h2>
        <p style={{fontSize:"0.82rem",color:"var(--text-muted)"}}>Here's what's happening across your platform today.</p>
      </div>

      <StatsGrid stats={kpis} cols={4} />

      <Row cols="3fr 2fr" gap={16} style={{marginBottom:16}}>
        <Panel title="Registered Businesses" meta="142 total">
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              {["Business","Sector","Status","Stage","Onboarding"].map(h=>(
                <th key={h} style={{textAlign:"left",fontSize:"0.72rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-muted)",padding:"0 8px 10px 0",borderBottom:"1px solid var(--glass-border)"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {bizRows.map((b,i)=>(
                <tr key={i}>
                  <td style={{padding:"10px 8px 10px 0",fontWeight:600,fontSize:"0.85rem",color:"var(--text-primary)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.name}</td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:"0.82rem",color:"var(--text-secondary)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.sector}</td>
                  <td style={{padding:"10px 8px 10px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}><Badge label={b.status} color={b.sc} /></td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:"0.82rem",color:"var(--text-secondary)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.stage}</td>
                  <td style={{padding:"10px 0 10px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <ProgressBar pct={b.pct} color={b.pct===100?"var(--accent-green)":b.pct>50?"var(--accent-cyan)":"var(--accent-orange)"} />
                      <span style={{fontSize:"0.72rem",color:"var(--text-muted)",flexShrink:0,width:28}}>{b.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Recent Audit Events" meta="Live">
          <div>
            {auditEvents.map((e,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom: i<auditEvents.length-1 ? "1px solid rgba(0,0,0,0.04)" : "none"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:sevColor[e.sev]||"var(--accent-cyan)",flexShrink:0,marginTop:5}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:"0.82rem",fontWeight:600,color:"var(--text-primary)"}}>{e.action}</div>
                  <div style={{fontSize:"0.75rem",color:"var(--text-muted)"}}>{e.actor}</div>
                </div>
                <span style={{fontSize:"0.72rem",color:"var(--text-muted)",flexShrink:0}}>{e.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </Row>

      <Row cols="1fr 1fr" gap={16}>
        <Panel title="Module Health" meta="All systems">
          {modules.map((m,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom: i<modules.length-1 ? 14 : 0}}>
              <span style={{width:110,fontSize:"0.85rem",color:"var(--text-secondary)",flexShrink:0}}>{m.name}</span>
              <ProgressBar pct={m.pct} color={clr[m.c]} />
              <span style={{fontSize:"0.78rem",fontWeight:700,color:"var(--text-primary)",width:36,textAlign:"right",flexShrink:0}}>{m.pct}%</span>
              <span style={{width:7,height:7,borderRadius:"50%",background:clr[m.c],flexShrink:0}}/>
            </div>
          ))}
        </Panel>

        <Panel title="Security Center" meta="Last 24h">
          {[
            {sev:"critical",desc:"5 failed logins from 103.45.67.89",time:"12m ago"},
            {sev:"warning", desc:"Password reset by Priya S.",        time:"2h ago"},
            {sev:"critical",desc:"Login from new city: Mumbai",       time:"3h ago"},
            {sev:"warning", desc:"Role changed: Sunita R. ? Staff",   time:"6h ago"},
          ].map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom: i<3?"1px solid rgba(0,0,0,0.04)":"none"}}>
              <div style={{width:28,height:28,borderRadius:8,background: a.sev==="critical"?"rgba(239,68,68,0.1)":"rgba(249,115,21,0.1)", color: a.sev==="critical"?"#ef4444":"var(--accent-orange)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"0.8rem"}}>
                {a.sev==="critical"?"?":"!"}
              </div>
              <div style={{flex:1,fontSize:"0.82rem",color:"var(--text-secondary)"}}>{a.desc}</div>
              <span style={{fontSize:"0.72rem",color:"var(--text-muted)",flexShrink:0}}>{a.time}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:10,marginTop:14,paddingTop:14,borderTop:"1px solid var(--glass-border)"}}>
            {[{v:"8",l:"Failed Logins"},{v:"2",l:"Suspicious IPs"},{v:"1",l:"Role Changes"}].map(s=>(
              <div key={s.l} style={{flex:1,background:"var(--bg-space)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:"1.1rem",color:"var(--text-primary)"}}>{s.v}</div>
                <div style={{fontSize:"0.68rem",color:"var(--text-muted)",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        </Panel>
      </Row>
    </div>
  );
}
`);
console.log("AdminDashboard done");
