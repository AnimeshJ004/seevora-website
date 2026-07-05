const fs = require("fs");
let c = fs.readFileSync("src/components/admin/AdminPage.jsx", "utf8");

// 1. Replace the broken toggle helper inside ViewSettings
const oldToggle = /  const toggle = \(label, desc, defaultOn=false\) => \{[\s\S]*?^\  \};/m;
c = c.replace(oldToggle, "");

// 2. Replace all toggle('...','...',bool) calls with <ToggleRow />
c = c.replace(/\{toggle\('([^']+)',\s*'([^']+)',\s*(true|false)\)\}/g, function(m, label, desc, on) {
  return '<ToggleRow label="' + label + '" desc="' + desc + '" defaultOn={' + on + '} />';
});
c = c.replace(/\{toggle\('([^']+)',\s*'([^']+)'\)\}/g, function(m, label, desc) {
  return '<ToggleRow label="' + label + '" desc="' + desc + '" defaultOn={false} />';
});

// 3. Add ToggleRow component before ToggleSwitch
const toggleRowComp = `
function ToggleRow({label, desc, defaultOn}) {
  const [on, setOn] = React.useState(defaultOn || false);
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"14px 0",borderBottom:"1px solid var(--glass-border)"}}>
      <div style={{flex:1,paddingRight:16}}>
        <div style={{fontSize:"0.85rem",fontWeight:600,color:"var(--text-primary)"}}>{label}</div>
        <div style={{fontSize:"0.75rem",color:"var(--text-muted)",marginTop:2}}>{desc}</div>
      </div>
      <button onClick={()=>setOn(!on)} style={{flexShrink:0,width:44,height:24,borderRadius:100,border:"none",cursor:"pointer",background:on?"var(--accent-cyan)":"#d1d5db",position:"relative",transition:"background 0.2s"}}>
        <span style={{position:"absolute",top:3,left:on?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}} />
      </button>
    </div>
  );
}`;

c = c.replace("function ToggleSwitch", toggleRowComp + "\nfunction ToggleSwitch");

fs.writeFileSync("src/components/admin/AdminPage.jsx", c, "utf8");
console.log("done");
