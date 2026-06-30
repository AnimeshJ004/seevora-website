import React, { useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, Avatar, Btn } from '../shared';
const users = [];
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
              <td style={{padding:"11px 10px 11px 0",fontSize:"0.78rem",fontWeight:600,borderBottom:"1px solid rgba(0,0,0,0.04)",color:u.mfa?"var(--accent-green)":"var(--text-muted)"}}>{u.mfa?"On":"Off"}</td>
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
