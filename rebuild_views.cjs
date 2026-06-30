const fs = require("fs");

// -- Shared HR data & helpers (copy from HRPage exactly)
const hrSrc = fs.readFileSync("src/components/hr/HRPage.jsx","utf8");

// Extract everything between "/* --- Shared helpers" and "/* --- Nav structure"
const helperStart = hrSrc.indexOf("function fmt()");
const dataStart   = hrSrc.indexOf("/* --- Static data");
const dataEnd     = hrSrc.indexOf("/* --- Nav structure");
const helpers     = hrSrc.slice(helperStart, dataStart);
const data        = hrSrc.slice(dataStart, dataEnd);

function extractFn(src, fnName) {
  const lines = src.split("\n");
  const si = lines.findIndex(l => l.match(new RegExp("^function " + fnName + "\\b")));
  if (si === -1) return null;
  let depth = 0, i = si, started = false;
  while (i < lines.length) {
    for (const ch of lines[i]) {
      if (ch === "{") { depth++; started = true; }
      if (ch === "}") depth--;
    }
    i++;
    if (started && depth === 0) break;
  }
  return lines.slice(si, i).join("\n");
}

// -- HR views map: filename -> original fnName
const hrViews = {
  HRDashboardView: "ViewHRDashboard",
  EmployeesView:   "ViewEmployees",
  AttendanceView:  "ViewAttendance",
  LeaveView:       "ViewLeave",
  RecruitmentView: "ViewRecruitment",
  PayrollView:     "ViewPayroll",
  DocumentsView:   "ViewDocuments",
};

for (const [file, fn] of Object.entries(hrViews)) {
  let body = extractFn(hrSrc, fn);
  if (!body) { console.log("NOT FOUND:", fn); continue; }
  // Rename function to match export name
  body = body.replace(new RegExp("^function " + fn), "function " + file);
  const out = `import React, { useState } from 'react';
import logoIcon from '../../../assets/logo-icon.png';

${helpers}
${data}
${body}

export default ${file};
`;
  fs.writeFileSync("src/components/dashboard/views/" + file + ".jsx", out, "utf8");
  console.log("?", file);
}

// -- Admin views map
const adminSrc  = fs.readFileSync("src/components/admin/AdminPage.jsx","utf8");
const adDataS   = adminSrc.indexOf("/* --- Extended Data");
const adDataE   = adminSrc.indexOf("/* --- Page Title Map");
const adminData = adDataS !== -1 ? adminSrc.slice(adDataS, adDataE) : "";

// Shared admin helpers (SvgWarn, SvgCrit, PageHeader, FilterBar)
const adHelpS = adminSrc.indexOf("/* -------------------------------------------------\n   SUB-PAGE VIEW COMPONENTS");
const adHelpE = adminSrc.indexOf("/* -- BUSINESSES VIEW");
const adminHelpers = adHelpS !== -1 ? adminSrc.slice(adHelpS, adHelpE) : "";

const adminViews = {
  AdminDashboardView:  "ViewDashboard",
  BusinessesView:      "ViewBusinesses",
  UsersView:           "ViewUsers",
  SupportTicketsView:  "ViewSupport",
  LeadsView:           "ViewLeads",
  AppointmentsView:    "ViewAppointments",
  AIVoiceLogsView:     "ViewAIVoiceAgent",
  WhatsAppLogsView:    "ViewWhatsAppMarketing",
  ReviewsView:         "ViewReputation",
  AuditLogsView:       "ViewAuditLogs",
  SecurityCenterView:  "ViewSecurityCenter",
  AnalyticsView:       "ViewAnalytics",
  SettingsView:        "ViewSettings",
};

// Extra components referenced in admin views
const extraAdminComps = ["ToggleRow","ToggleSwitch","SectionHeader","EmptyTable","FilterBar","StatCard","StatusBadge"].map(name => {
  const f = extractFn(adminSrc, name);
  return f || "";
}).join("\n\n");

for (const [file, fn] of Object.entries(adminViews)) {
  let body = extractFn(adminSrc, fn);
  if (!body) {
    // write stub
    body = `function ${file}({ user }) { return (<div style={{padding:40,textAlign:"center",color:"var(--text-muted)"}}><h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"1.4rem",color:"var(--text-primary)",marginBottom:8}}>${file.replace("View","")}</h2><p>View coming soon.</p></div>); }`;
  } else {
    body = body.replace(new RegExp("^function " + fn), "function " + file);
  }
  const out = `import React, { useState } from 'react';
import logoIcon from '../../../assets/logo-icon.png';

${adminHelpers}
${adminData}
${extraAdminComps}
${body}

export default ${file};
`;
  fs.writeFileSync("src/components/dashboard/views/" + file + ".jsx", out, "utf8");
  console.log("?", file);
}

console.log("All views rebuilt.");
