const fs = require("fs");
let c = fs.readFileSync("server/index.js","utf8");
// Add import after last import line
const lastImport = c.lastIndexOf("\nimport ");
const insertAfter = c.indexOf("\n", lastImport + 1);
const importLine = "\nimport emailOutreachRoutes from './routes/emailOutreach.js';";
c = c.slice(0, insertAfter) + importLine + c.slice(insertAfter);
// Add route registration before the 404 handler
c = c.replace(
  "app.use('/api/audit-requests', auditRequestsRoutes);",
  "app.use('/api/audit-requests', auditRequestsRoutes);\napp.use('/api/email-outreach', emailOutreachRoutes);"
);
fs.writeFileSync("server/index.js", c, "utf8");
console.log("Registered /api/email-outreach route");
