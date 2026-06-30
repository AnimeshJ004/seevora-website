const fs = require("fs");
let c = fs.readFileSync("src/components/dashboard/views/admin/AdminDashboard.jsx","utf8");

// Replace dark color constants with light ones
c = c.replace(
  `const C = {
  bg:     "#0a0f1e",
  card:   "#112240",
  card2:  "#0d1b2e",
  border: "rgba(255,255,255,0.07)",
  text:   "#e2e8f0",
  muted:  "#8b9cb6",
  dim:    "#64748b",
  blue:   "#4f8ef7",
  green:  "#10b981",
  orange: "#f97316",
  purple: "#9e3cec",
  red:    "#ef4444",
  cyan:   "#14c9e1",
};`,
  `const C = {
  bg:     "#f1f5f9",
  card:   "#ffffff",
  card2:  "#f8fafc",
  border: "#e2e8f0",
  text:   "#0f172a",
  muted:  "#475569",
  dim:    "#94a3b8",
  blue:   "#6366f1",
  green:  "#10b981",
  orange: "#f97316",
  purple: "#8b5cf6",
  red:    "#ef4444",
  cyan:   "#0ea5e9",
};`
);

// Fix Card component - dark shadow for light theme
c = c.replace(
  'background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: "18px 20px"',
  'background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)"'
);

// Fix text color in CardTitle
c = c.replace(
  'fontFamily:"Outfit,sans-serif", fontWeight:700, fontSize:"0.88rem", color: C.text',
  'fontFamily:"\'Outfit\',sans-serif", fontWeight:700, fontSize:"0.88rem", color: C.text'
);

// Fix greeting bar background
c = c.replace(
  '"padding:"8px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid " + C.border',
  '"padding:"8px 14px", background:"#fff", border:"1px solid " + C.border'
);

// Fix line chart grid lines
c = c.replace(
  'stroke="rgba(255,255,255,0.05)"',
  'stroke="rgba(0,0,0,0.06)"'
);

// Fix bar chart colors
c = c.replace('fill={i===2 ? C.blue : C.blue+"55"}', 'fill={i===2 ? C.blue : C.blue+"33"}');

// Fix AI activity icon background
c = c.replace(
  'background:"rgba(79,142,247,0.12)"',
  'background:"rgba(99,102,241,0.1)"'
);

// Fix border lines in lists
c = c.replace(/borderBottom: i<aiActivity\.length-1 \? "1px solid rgba\(255,255,255,0\.05\)" : "none"/g,
  'borderBottom: i<aiActivity.length-1 ? "1px solid #f1f5f9" : "none"');
c = c.replace(/borderBottom: i<recentLeads\.length-1 \? "1px solid rgba\(255,255,255,0\.05\)" : "none"/g,
  'borderBottom: i<recentLeads.length-1 ? "1px solid #f1f5f9" : "none"');
c = c.replace(/borderBottom: i<perf\.length-1 \? "1px solid rgba\(255,255,255,0\.05\)" : "none"/g,
  'borderBottom: i<perf.length-1 ? "1px solid #f1f5f9" : "none"');

// Fix top services bar track
c = c.replace(
  'background:"rgba(255,255,255,0.06)", borderRadius:100, overflow:"hidden"',
  'background:"#f1f5f9", borderRadius:100, overflow:"hidden"'
);

// Fix quick action button
c = c.replace(
  'background:"rgba(255,255,255,0.04)", border:"1px solid " + C.border',
  'background:"#f8fafc", border:"1px solid " + C.border'
);
c = c.replace(
  'e.currentTarget.style.background="rgba(79,142,247,0.1)"; e.currentTarget.style.color=C.blue',
  'e.currentTarget.style.background=C.blue+"11"; e.currentTarget.style.color=C.blue'
);
c = c.replace(
  'e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color=C.muted',
  'e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color=C.muted'
);

// Fix date/branch filter buttons
c = c.replace(
  /background:"rgba\(255,255,255,0\.04\)", border:"1px solid " \+ C\.border, borderRadius:8, fontSize:"0\.78rem", color: C\.muted, cursor:"pointer"/g,
  'background:"#fff", border:"1px solid " + C.border, borderRadius:8, fontSize:"0.78rem", color: C.muted, cursor:"pointer", boxShadow:"0 1px 2px rgba(0,0,0,0.04)"'
);

// Fix AI activity "View All" link color
c = c.replace('color: C.blue, cursor:"pointer"', 'color: C.blue, cursor:"pointer", fontWeight:600');

fs.writeFileSync("src/components/dashboard/views/admin/AdminDashboard.jsx", c, "utf8");
console.log("done");
