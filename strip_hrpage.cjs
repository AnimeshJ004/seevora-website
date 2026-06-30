const fs = require("fs");
const path = require("path");
const dir = "src/components/dashboard/views";

fs.readdirSync(dir).forEach(f => {
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, "utf8");
  // Remove everything from "export default function HRPage" to end, but keep the last export default line
  // Strategy: find "export default function HRPage" and remove from there until the matching closing brace
  const marker = "export default function HRPage()";
  const idx = c.indexOf(marker);
  if (idx === -1) return;
  // Find the end of HRPage function
  let depth = 0, i = idx, started = false;
  while (i < c.length) {
    if (c[i] === "{") { depth++; started = true; }
    if (c[i] === "}") depth--;
    i++;
    if (started && depth === 0) break;
  }
  // Remove from marker to end of HRPage closing brace
  c = c.slice(0, idx) + c.slice(i);
  fs.writeFileSync(fp, c.trim() + "\n", "utf8");
  console.log("stripped HRPage from", f);
});
console.log("done");
