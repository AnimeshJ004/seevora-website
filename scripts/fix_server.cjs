const fs = require("fs");
let c = fs.readFileSync("server/index.js","utf8");
c = c.replace(/import newsletterRoutes from ['"]\.\/routes\/newsletter\.js['"];?\r?\n/g,"");
c = c.replace(/import emailBotRoutes from ['"]\.\/routes\/emailBot\.js['"];?\r?\n/g,"");
c = c.replace(/app\.use\(['"]\/api\/newsletter['"],\s*newsletterRoutes\);?\r?\n/g,"");
c = c.replace(/app\.use\(['"]\/api\/email-bot['"],\s*emailBotRoutes\);?\r?\n/g,"");
fs.writeFileSync("server/index.js",c,"utf8");
console.log("Fixed server/index.js");
