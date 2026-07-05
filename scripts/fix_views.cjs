const fs = require("fs");
const path = require("path");
const dir = "src/components/dashboard/views";

// Fix: view files have duplicate default exports (HRPage, ViewEmployees etc)
// Each file should only export the named view function
const files = fs.readdirSync(dir);
for (const f of files) {
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, "utf8");
  // Remove any extra "export default HRPage;" or "export default ViewXxx;" lines
  // that come from the full file copy
  // Keep only the last export default line
  const lines = c.split("\n");
  const exportLines = lines.map((l,i)=>({l,i})).filter(x=>x.l.trim().startsWith("export default "));
  if (exportLines.length > 1) {
    // Remove all but the last export default
    const toRemove = new Set(exportLines.slice(0,-1).map(x=>x.i));
    const fixed = lines.filter((_,i)=>!toRemove.has(i)).join("\n");
    fs.writeFileSync(fp, fixed, "utf8");
    console.log("fixed duplicate exports in", f);
  }
  // Also remove lines with "export default function HRPage" or similar wrong names
  let c2 = fs.readFileSync(fp,"utf8");
  // The last export default should match the filename
  const name = f.replace(".jsx","");
  // Replace wrong function name in export default
  c2 = c2.replace(/^export default function \w+\b/m, `export default function ${name}`);
  fs.writeFileSync(fp, c2, "utf8");
}
console.log("done fixing views");
