const fs = require("fs");
const p = (f,c) => fs.writeFileSync("src/components/dashboard/views/admin/"+f, c, "utf8");

// -- Businesses
p("Businesses.jsx", `import React, { useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, ProgressBar, Btn } from '../shared';
const rows = [
  {name:"Sunrise Clinic",     sector:"Healthcare",     owner:"Ravi Sharma",   city:"Indore", status:"active",  sl:"Active",  stage:"Live",     mods:6, pct:100},
  {name:"EduFirst Academy",   sector:"Education",      owner:"Nisha Patel",   city:"Indore", status:"active",  sl:"Active",  stage:"Live",     mods:5, pct:100},
  {name:"GlowUp Salon",       sector:"Personal Care",  owner:"Pooja Mehta",   city:"Bhopal", status:"active",  sl:"Active",  stage:"Live",     mods:4, pct:87},
  {name:"PathLabs",           sector:"Diagnostic",     owner:"Arjun Mehta",   city:"Indore", status:"pending", sl:"Pending", stage:"Config",   mods:3, pct:40},
  {name:"FitZone Gym",        sector:"Health & Fit",   owner:"Suresh Kumar",  city:"Ujjain", status:"active",  sl:"Active",  stage:"Live",     mods:6, pct:95},
  {name:"LegalEdge Advisory", sector:"Legal",          owner:"Vikram Joshi",  city:"Indore", status:"pending", sl:"Pending", stage:"Approval", mods:0, pct:0},
  {name:"BrightSmile Dental", sector:"Healthcare",     owner:"Dr. Anita Rao", city:"Jabalpur",status:"active", sl:"Active",  stage:"Live",     mods:5, pct:100},
  {name:"CodeCraft Academy",  sector:"Education",      owner:"Deepak Mishra", city:"Indore", status:"active",  sl:"Active",  stage:"Live",     mods:4, pct:92},
];
const sc = {active:"green",pending:"orange"};
export default function Businesses() {
  const [search, setSearch] = useState("");
  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.sector.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageHeader title="Businesses" sub="142 registered businesses across 7 sectors" action="+ Add Business" />
      <StatsGrid stats={[{label:"Total",value:142,color:"cyan"},{label:"Active",value:118,color:"green"},{label:"Pending",value:7,color:"orange"},{label:"Suspended",value:17,color:"pink"}]} />
      <Panel>
        <FilterBar filters={["All Sectors","All Status","All Stages"]} onSearch={setSearch} />
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Business","Sector","Owner","City","Status","Stage","Modules","Onboarding","Actions"].map(h=>(
            <th key={h} style={{textAlign:"left",fontSize:"0.72rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-muted)",padding:"0 10px 10px 0",borderBottom:"1px solid var(--glass-border)"}}>{h}</th>
          ))}</tr></thead>
          <tbody>{filtered.map((b,i)=>(
            <tr key={i}>
              <td style={{padding:"11px 10px 11px 0",fontWeight:600,fontSize:"0.85rem",color:"var(--text-primary)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.name}</td>
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.82rem",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.sector}</td>
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.78rem",color:"var(--text-muted)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.owner}</td>
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.78rem",color:"var(--text-muted)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.city}</td>
              <td style={{padding:"11px 10px 11px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}><Badge label={b.sl} color={sc[b.status]} /></td>
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.82rem",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.stage}</td>
              <td style={{padding:"11px 10px 11px 0",fontWeight:700,color:"var(--accent-cyan)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{b.mods}/6</td>
              <td style={{padding:"11px 10px 11px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <ProgressBar pct={b.pct} color={b.pct===100?"var(--accent-green)":"var(--accent-cyan)"} />
                  <span style={{fontSize:"0.72rem",color:"var(--text-muted)",width:30,flexShrink:0}}>{b.pct}%</span>
                </div>
              </td>
              <td style={{padding:"11px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",gap:6}}><Btn label="View" variant="ghost" size="sm" /><Btn label="Edit" variant="ghost" size="sm" /></div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>
    </div>
  );
}
`);

// -- Users
p("Users.jsx", `import React, { useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Avatar, Btn } from '../shared';
const users = [
  {name:"Animesh Jain",  email:"animesh@seevora.in",    role:"super_admin",    rl:"Super Admin", business:"—",                   status:"active",  lastLogin:"2m ago"},
  {name:"Ravi Sharma",   email:"ravi@seevora.in",       role:"admin",          rl:"Admin",       business:"—",                   status:"active",  lastLogin:"1hr ago"},
  {name:"Nisha Patel",   email:"nisha@edufirst.in",     role:"business_admin", rl:"Biz Admin",   business:"EduFirst Academy",    status:"active",  lastLogin:"3hr ago"},
  {name:"Priya Singh",   email:"priya@glowup.in",       role:"staff",          rl:"Staff",       business:"GlowUp Salon",        status:"active",  lastLogin:"Yesterday"},
  {name:"Arjun Mehta",   email:"arjun@pathlabs.in",     role:"business_admin", rl:"Biz Admin",   business:"PathLabs Diagnostics",status:"pending", lastLogin:"Never"},
  {name:"Sunita Rao",    email:"sunita@fitzone.in",     role:"staff",          rl:"Staff",       business:"FitZone Gym",         status:"active",  lastLogin:"5hr ago"},
  {name:"Meera Gupta",   email:"meera@seevora.in",      role:"support_agent",  rl:"Support",     business:"—",                   status:"active",  lastLogin:"30m ago"},
];
const roleColor = {super_admin:"purple",admin:"cyan",business_admin:"cyan",staff:"green",support_agent:"orange"};
export default function Users() {
  const [search, setSearch] = useState("");
  const f = users.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageHeader title="Users & Roles" sub="394 users across all tenants" action="+ Invite User" />
      <StatsGrid stats={[{label:"Super Admins",value:2,color:"purple"},{label:"Biz Admins",value:142,color:"cyan"},{label:"Staff",value:241,color:"green"},{label:"Support",value:9,color:"orange"}]} />
      <Panel>
        <FilterBar filters={["All Roles","All Status"]} onSearch={setSearch} />
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["User","Role","Business","Status","MFA","Last Login","Actions"].map(h=>(
            <th key={h} style={{textAlign:"left",fontSize:"0.72rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-muted)",padding:"0 10px 10px 0",borderBottom:"1px solid var(--glass-border)"}}>{h}</th>
          ))}</tr></thead>
          <tbody>{f.map((u,i)=>(
            <tr key={i}>
              <td style={{padding:"11px 10px 11px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Avatar name={u.name} />
                  <div><div style={{fontWeight:600,fontSize:"0.85rem",color:"var(--text-primary)"}}>{u.name}</div><div style={{fontSize:"0.72rem",color:"var(--text-muted)"}}>{u.email}</div></div>
                </div>
              </td>
              <td style={{padding:"11px 10px 11px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}><Badge label={u.rl} color={roleColor[u.role]||"gray"} /></td>
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.82rem",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{u.business}</td>
              <td style={{padding:"11px 10px 11px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}><Badge label={u.status==="active"?"Active":"Pending"} color={u.status==="active"?"green":"orange"} /></td>
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.78rem",fontWeight:600,color:"var(--accent-green)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{u.role==="super_admin"||u.role==="admin"?"? On":"—"}</td>
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.78rem",color:"var(--text-muted)",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>{u.lastLogin}</td>
              <td style={{padding:"11px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",gap:6}}><Btn label="Edit" variant="ghost" size="sm" /><Btn label="Suspend" variant="danger" size="sm" /></div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>
    </div>
  );
}
`);
console.log("Businesses + Users done");
