const fs = require("fs");

// 1. DashboardShell.jsx
let c = fs.readFileSync("src/components/dashboard/DashboardShell.jsx","utf8");
c = c.replace(/import EmailBot\s+from\s+['"][^'"]+['"];?\r?\n/g,"");
c = c.replace(/import Newsletter\s+from\s+['"][^'"]+['"];?\r?\n/g,"");
c = c.replace(/,?\{id:'email-bot',label:'Email Bot'\}/g,"");
c = c.replace(/,?\{id:'newsletter',label:'Newsletter'\}/g,"");
c = c.replace(/'email-bot':'Email Marketing Bot',?\s*/g,"");
c = c.replace(/'newsletter':'Newsletter',?\s*/g,"");
c = c.replace(/'email-bot':\s*<EmailBot[^\/]*\/>,?\s*/g,"");
c = c.replace(/newsletter:\s*<Newsletter[^\/]*\/>,?\s*/g,"");
c = c.replace(/'email-bot':\s*<Ic[^\/]+\/>,?\r?\n/g,"");
c = c.replace(/newsletter:\s*<Ic[^\/]+\/>,?\r?\n/g,"");
fs.writeFileSync("src/components/dashboard/DashboardShell.jsx",c,"utf8");

// 2. Remove route file
if (fs.existsSync("server/routes/emailBot.js")) { fs.unlinkSync("server/routes/emailBot.js"); console.log("Deleted server/routes/emailBot.js"); }
if (fs.existsSync("server/routes/newsletter.js")) { console.log("Keeping newsletter.js - will be rebuilt"); }

// 3. Remove view files
if (fs.existsSync("src/components/dashboard/views/admin/EmailBot.jsx")) { fs.unlinkSync("src/components/dashboard/views/admin/EmailBot.jsx"); console.log("Deleted EmailBot.jsx view"); }
if (fs.existsSync("src/components/dashboard/views/admin/Newsletter.jsx")) { fs.unlinkSync("src/components/dashboard/views/admin/Newsletter.jsx"); console.log("Deleted Newsletter.jsx view"); }

// 4. Clean roles.js
let r = fs.readFileSync("src/auth/roles.js","utf8");
r = r.replace(/'email-bot',?\s*/g,"");
r = r.replace(/'newsletter',?\s*/g,"");
fs.writeFileSync("src/auth/roles.js",r,"utf8");

console.log("All email bot references removed");
