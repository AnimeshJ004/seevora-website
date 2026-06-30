const fs = require("fs");

function extractFn(src, fnName) {
  const lines = src.split("\n");
  const start = lines.findIndex(l => l.startsWith("function " + fnName));
  if (start === -1) return null;
  let depth = 0, i = start, started = false;
  while (i < lines.length) {
    for (const ch of lines[i]) {
      if (ch === "{") { depth++; started = true; }
      if (ch === "}") depth--;
    }
    i++;
    if (started && depth === 0) break;
  }
  return lines.slice(start, i).join("\n");
}

// -- Admin views
const adminSrc = fs.readFileSync("src/components/admin/AdminPage.jsx", "utf8");
// Extract shared data constants from AdminPage
const dataStart = adminSrc.indexOf("/* --- Static data");
const dataEnd   = adminSrc.indexOf("/* --- Nav structure");
const adminData = dataStart !== -1 ? adminSrc.slice(dataStart, dataEnd) : "";

// -- HR views
const hrSrc = fs.readFileSync("src/components/hr/HRPage.jsx", "utf8");
const hrDataStart = hrSrc.indexOf("/* --- Static data");
const hrDataEnd   = hrSrc.indexOf("/* --- Nav structure");
const hrData = hrDataStart !== -1 ? hrSrc.slice(hrDataStart, hrDataEnd) : "";

function makeView(name, fn, data, imports = "") {
  return `import React, { useState } from 'react';
${imports}
${data}
export default function ${name}({ user }) {
${fn.replace(/^function \w+\([^)]*\)/, '').replace(/^\s*\{/, '').replace(/\}\s*$/, '')}
}
`;
}

// Shared page header helper used in HR views
const hrHelpers = hrSrc.slice(hrSrc.indexOf("function fmt()"), hrSrc.indexOf("/* --- Static data"));

// Map: view filename -> { sourceSrc, fnName, extraData }
const adminMap = {
  AdminDashboardView: "ViewDashboard",
  BusinessesView:     "ViewBusinesses",
  UsersView:          "ViewUsers",
  SupportTicketsView: "ViewSupport",
  LeadsView:          "ViewLeads",
  AppointmentsView:   "ViewAppointments",
  AIVoiceLogsView:    "ViewAIVoiceAgent",
  WhatsAppLogsView:   "ViewWhatsAppMarketing",
  ReviewsView:        "ViewReputation",
  AuditLogsView:      "ViewAuditLogs",    // may not exist, graceful
  SecurityCenterView: "ViewSecurityCenter",
  AnalyticsView:      "ViewAnalytics",
  SettingsView:       "ViewSettings",
};

const hrMap = {
  HRDashboardView: "ViewHRDashboard",
  EmployeesView:   "ViewEmployees",
  AttendanceView:  "ViewAttendance",
  LeaveView:       "ViewLeave",
  RecruitmentView: "ViewRecruitment",
  PayrollView:     "ViewPayroll",
  DocumentsView:   "ViewDocuments",
};

// Write admin views
for (const [file, fn] of Object.entries(adminMap)) {
  const body = extractFn(adminSrc, fn);
  const out = `import React, { useState } from 'react';
import logoIcon from '../../../assets/logo-icon.png';

${adminData}

${body || `function ${fn}(){return <div style={{padding:40,color:'var(--text-muted)',textAlign:'center'}}><h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:'1.4rem',color:'var(--text-primary)',marginBottom:8}}>${file.replace('View','')}</h2><p>Full implementation in progress.</p></div>;}`}

export default ${fn};
`;
  fs.writeFileSync(`src/components/dashboard/views/${file}.jsx`, out, "utf8");
  console.log("wrote", file);
}

// Write HR views
for (const [file, fn] of Object.entries(hrMap)) {
  const body = extractFn(hrSrc, fn);
  const out = `import React, { useState } from 'react';
import logoIcon from '../../../assets/logo-icon.png';

${hrHelpers}
${hrData}

${body || `function ${fn}(){return <div style={{padding:40,color:'var(--text-muted)',textAlign:'center'}}><h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:'1.4rem',color:'var(--text-primary)',marginBottom:8}}>${file.replace('View','')}</h2><p>Full implementation in progress.</p></div>;}`}

export default ${fn};
`;
  fs.writeFileSync(`src/components/dashboard/views/${file}.jsx`, out, "utf8");
  console.log("wrote", file);
}

console.log("All views extracted!");
