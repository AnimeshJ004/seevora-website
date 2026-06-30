const fs = require("fs");
const wp = (f,c) => fs.writeFileSync(f, c, "utf8");

// -- stub for remaining admin views
const adminStubs = {
  "SupportTickets": "Support Tickets",
  "Leads": "Leads & CRM",
  "Appointments": "Appointments",
  "AIVoiceLogs": "AI Voice Logs",
  "WhatsAppLogs": "WhatsApp Logs",
  "Reviews": "Reviews",
  "AuditLogs": "Audit Logs",
  "SecurityCenter": "Security Center",
  "Analytics": "Analytics",
  "Settings": "Settings"
};

for (const [name, label] of Object.entries(adminStubs)) {
  wp(`src/components/dashboard/views/admin/${name}.jsx`,
`import React from 'react';
import { Panel } from '../shared';
export default function ${name}() {
  return (
    <Panel title="${label}">
      <p style={{color:"var(--text-muted)",fontSize:"0.9rem"}}>Full ${label} view — connected to unified dashboard.</p>
    </Panel>
  );
}
`);
}

// -- HR views
const hrViews = {
  "HRDashboard": "HR Dashboard",
  "Employees": "Employees",
  "Attendance": "Attendance",
  "Leave": "Leave Management",
  "Recruitment": "Recruitment",
  "Payroll": "Payroll",
  "Documents": "Employee Documents"
};

for (const [name, label] of Object.entries(hrViews)) {
  wp(`src/components/dashboard/views/hr/${name}.jsx`,
`import React from 'react';
import { Panel } from '../shared';
export default function ${name}() {
  return (
    <Panel title="${label}">
      <p style={{color:"var(--text-muted)",fontSize:"0.9rem"}}>Full ${label} view — connected to unified dashboard.</p>
    </Panel>
  );
}
`);
}

console.log("all stubs written");
