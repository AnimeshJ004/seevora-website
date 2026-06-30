import React, { useState } from 'react';
import { PageHeader, Panel, StatsGrid, FilterBar, Badge, ProgressBar, Btn } from '../shared';
const rows = [];
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
