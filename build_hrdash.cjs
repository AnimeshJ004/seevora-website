const fs = require("fs");
fs.writeFileSync("src/components/dashboard/views/hr/HRDashboard.jsx", `
import React from 'react';

const kpis = [
  { icon:"??", label:"Total Employees",    value:"47",     delta:"+3 this month",  color:"#3b82f6" },
  { icon:"?", label:"Present Today",      value:"39",     delta:"83% attendance", color:"#10b981" },
  { icon:"???", label:"On Leave Today",    value:"4",      delta:"2 pending",      color:"#f97316" },
  { icon:"??", label:"Open Positions",     value:"6",      delta:"3 shortlisted",  color:"#8b5cf6" },
  { icon:"??", label:"Payroll This Month", value:"?38L",   delta:"6 processed",    color:"#10b981" },
  { icon:"?", label:"Late Today",         value:"4",      delta:"2 WFH",          color:"#ef4444" },
];

const attendance = [
  {name:"Priya Sharma",  dept:"Engineering", checkIn:"09:02 AM", status:"present", pct:100},
  {name:"Rahul Verma",   dept:"Sales",       checkIn:"09:45 AM", status:"late",    pct:75},
  {name:"Anita Joshi",   dept:"HR",          checkIn:"—",        status:"absent",  pct:0},
  {name:"Karan Mehta",   dept:"Operations",  checkIn:"Remote",   status:"wfh",     pct:100},
  {name:"Sunita Rao",    dept:"Finance",     checkIn:"08:58 AM", status:"present", pct:100},
  {name:"Deepak Singh",  dept:"Engineering", checkIn:"10:12 AM", status:"late",    pct:75},
];

const leaves = [
  {name:"Rahul Verma",  type:"Casual Leave", days:3, from:"15 Jul", status:"pending"},
  {name:"Meera Gupta",  type:"Annual Leave",  days:6, from:"20 Jul", status:"pending"},
];

const candidates = [
  {name:"Amit Tiwari",    role:"Full Stack Dev",   round:"Technical Round 2", status:"shortlisted"},
  {name:"Sneha Kulkarni", role:"Product Manager",  round:"Offer Accepted",    status:"hired"},
  {name:"Rohit Bansal",   role:"Data Analyst",     round:"HR Screening",      status:"open"},
];

const statusColor = {present:"#10b981",late:"#f97316",absent:"#ef4444",wfh:"#3b82f6"};
const candColor   = {shortlisted:"#8b5cf6",hired:"#10b981",open:"#3b82f6"};

function BarChart() {
  const vals = [95,88,91,85,83,40,0];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:60,marginTop:8}}>
      {vals.map((v,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",height:v*0.5+"px",background:v>80?"#10b981":v>40?"#f97316":"#334155",borderRadius:"3px 3px 0 0",opacity:0.85}}/>
          <span style={{fontSize:"0.62rem",color:"#64748b"}}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function HRDashboard({ user }) {
  const name = user?.name?.split(" ")[0] || "HR";
  const card = (s={}) => ({ background:"#1e293b", border:"1px solid #334155", borderRadius:12, padding:"18px 20px", ...s });

  return (
    <div style={{color:"#e2e8f0",fontFamily:"'Inter',sans-serif"}}>

      {/* Greeting */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.5rem",color:"#f1f5f9",marginBottom:4}}>
          Good Morning, {name}! ??
        </h2>
        <p style={{fontSize:"0.82rem",color:"#64748b"}}>Here's your HR overview for today.</p>
      </div>

      {/* KPI Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
        {kpis.map((k,i)=>(
          <div key={i} style={card()}>
            <div style={{fontSize:"1.4rem",marginBottom:8}}>{k.icon}</div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.5rem",color:k.color,lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:"0.72rem",color:"#94a3b8",marginTop:4,marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:"0.72rem",fontWeight:600,color:k.color}}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>

        {/* Attendance table */}
        <div style={card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9"}}>Today's Attendance</span>
            <span style={{fontSize:"0.72rem",color:"#10b981",background:"rgba(16,185,129,0.1)",padding:"4px 10px",borderRadius:100}}>? Live</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>{["Employee","Department","Check In","Status"].map(h=>(
                <th key={h} style={{textAlign:"left",fontSize:"0.65rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",color:"#64748b",padding:"0 8px 10px 0",borderBottom:"1px solid #334155"}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>{attendance.map((a,i)=>(
              <tr key={i}>
                <td style={{padding:"10px 8px 10px 0",fontSize:"0.82rem",fontWeight:600,color:"#f1f5f9",borderBottom:"1px solid #1e3a5f"}}>{a.name}</td>
                <td style={{padding:"10px 8px 10px 0",fontSize:"0.78rem",color:"#94a3b8",borderBottom:"1px solid #1e3a5f"}}>{a.dept}</td>
                <td style={{padding:"10px 8px 10px 0",fontSize:"0.78rem",color:"#cbd5e1",borderBottom:"1px solid #1e3a5f"}}>{a.checkIn}</td>
                <td style={{padding:"10px 0",borderBottom:"1px solid #1e3a5f"}}>
                  <span style={{padding:"3px 10px",borderRadius:100,fontSize:"0.65rem",fontWeight:600,background:statusColor[a.status]+"22",color:statusColor[a.status]}}>
                    {a.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        {/* Pending leaves */}
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9",marginBottom:14}}>Pending Leave Requests</div>
          {leaves.map((l,i)=>(
            <div key={i} style={{padding:"12px 0",borderBottom: i<leaves.length-1 ? "1px solid #1e3a5f" : "none"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:"0.85rem",fontWeight:600,color:"#f1f5f9"}}>{l.name}</span>
                <span style={{padding:"2px 8px",borderRadius:100,fontSize:"0.65rem",fontWeight:600,background:"rgba(249,115,21,0.15)",color:"#f97316"}}>PENDING</span>
              </div>
              <div style={{fontSize:"0.75rem",color:"#64748b",marginBottom:8}}>{l.type} · {l.from} · {l.days} days</div>
              <div style={{display:"flex",gap:8}}>
                <button style={{flex:1,padding:"6px",background:"#10b981",border:"none",borderRadius:8,color:"#fff",fontSize:"0.72rem",fontWeight:600,cursor:"pointer"}}>Approve</button>
                <button style={{flex:1,padding:"6px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#ef4444",fontSize:"0.72rem",fontWeight:600,cursor:"pointer"}}>Reject</button>
              </div>
            </div>
          ))}
          {/* Weekly attendance bar */}
          <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #334155"}}>
            <div style={{fontSize:"0.75rem",color:"#64748b",marginBottom:4}}>Weekly Attendance Rate</div>
            <BarChart />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>

        {/* Headcount by dept */}
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9",marginBottom:14}}>Headcount by Department</div>
          {[
            {dept:"Engineering",count:18,pct:38,color:"#3b82f6"},
            {dept:"Sales",      count:12,pct:26,color:"#10b981"},
            {dept:"Operations", count:9, pct:19,color:"#8b5cf6"},
            {dept:"Finance",    count:5, pct:11,color:"#f97316"},
            {dept:"HR",         count:3, pct:6, color:"#ef4444"},
          ].map(d=>(
            <div key={d.dept} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",color:"#cbd5e1",marginBottom:4}}>
                <span>{d.dept}</span><span style={{fontWeight:700}}>{d.count}</span>
              </div>
              <div style={{height:6,background:"#0f172a",borderRadius:100,overflow:"hidden"}}>
                <div style={{height:"100%",width:d.pct+"%",background:d.color,borderRadius:100}}/>
              </div>
            </div>
          ))}
        </div>

        {/* Recruitment pipeline */}
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9",marginBottom:14}}>Recruitment Pipeline</div>
          {candidates.map((c,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom: i<candidates.length-1 ? "1px solid #1e3a5f":"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:"0.85rem",fontWeight:600,color:"#f1f5f9"}}>{c.name}</span>
                <span style={{padding:"2px 8px",borderRadius:100,fontSize:"0.65rem",fontWeight:600,background:candColor[c.status]+"22",color:candColor[c.status]}}>{c.status.toUpperCase()}</span>
              </div>
              <div style={{fontSize:"0.75rem",color:"#64748b"}}>{c.role} · {c.round}</div>
            </div>
          ))}
          <button style={{width:"100%",marginTop:14,padding:"9px",background:"transparent",border:"1px dashed #334155",borderRadius:8,color:"#3b82f6",fontSize:"0.78rem",fontWeight:600,cursor:"pointer"}}>+ Post New Job</button>
        </div>

        {/* Quick actions */}
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:"0.9rem",color:"#f1f5f9",marginBottom:14}}>Quick Actions</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {icon:"?",label:"Add Employee"},
              {icon:"??",label:"Mark Attendance"},
              {icon:"?",label:"Approve Leave"},
              {icon:"??",label:"Run Payroll"},
              {icon:"??",label:"Upload Doc"},
              {icon:"??",label:"HR Report"},
            ].map((a,i)=>(
              <button key={i} style={{padding:"12px 8px",background:"#0f172a",border:"1px solid #334155",borderRadius:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,color:"#94a3b8",fontSize:"0.72rem",fontWeight:600,transition:"all 0.2s"}}
                onMouseEnter={e=>{ e.currentTarget.style.background="#1e3a5f"; e.currentTarget.style.color="#f1f5f9"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#0f172a"; e.currentTarget.style.color="#94a3b8"; }}>
                <span style={{fontSize:"1.2rem"}}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`, "utf8");
console.log("HRDashboard done");
