import React, { useState } from 'react';

/* ── Page header ── */
export function PageHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
      <div>
        <h2 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'var(--text-primary)', marginBottom:4 }}>{title}</h2>
        {sub && <p style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{sub}</p>}
      </div>
      {action && (
        <button onClick={onAction} style={{ padding:'9px 20px', background:'var(--text-primary)', color:'#fff', border:'none', borderRadius:100, fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ── Stat card ── */
export function StatCard({ label, value, sub, color='cyan' }) {
  const colors = {
    cyan:   { bg:'rgba(20,201,225,0.1)',   c:'var(--accent-cyan)',   bar:'var(--accent-cyan)' },
    green:  { bg:'rgba(16,185,129,0.1)',   c:'var(--accent-green)',  bar:'var(--accent-green)' },
    orange: { bg:'rgba(249,115,21,0.1)',   c:'var(--accent-orange)', bar:'var(--accent-orange)' },
    purple: { bg:'rgba(158,60,236,0.1)',   c:'var(--accent-purple)', bar:'var(--accent-purple)' },
    pink:   { bg:'rgba(236,72,153,0.1)',   c:'var(--accent-pink)',   bar:'var(--accent-pink)' },
    blue:   { bg:'rgba(59,130,246,0.1)',   c:'var(--accent-blue)',   bar:'var(--accent-blue)' },
  };
  const s = colors[color] || colors.cyan;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--glass-border)', borderRadius:16, padding:'20px 22px', position:'relative', overflow:'hidden', transition:'transform 0.2s, box-shadow 0.2s', cursor:'default' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:s.bar, borderRadius:'0 2px 2px 0' }} />
      <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.9rem', color:'var(--text-primary)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:'0.75rem', fontWeight:600, color:s.c, marginTop:10 }}>{sub}</div>}
    </div>
  );
}

/* ── Stats grid ── */
export function StatsGrid({ stats, cols=4 }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:16, marginBottom:24 }}>
      {stats.map((s,i) => <StatCard key={i} {...s} />)}
    </div>
  );
}

/* ── Panel ── */
export function Panel({ title, meta, children, style }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--glass-border)', borderRadius:16, padding:24, ...style }}>
      {title && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)' }}>{title}</span>
          {meta && <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{meta}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Badge ── */
export function Badge({ label, color='cyan' }) {
  const map = {
    cyan:   { bg:'rgba(20,201,225,0.1)',  c:'var(--accent-cyan)' },
    green:  { bg:'rgba(16,185,129,0.1)',  c:'var(--accent-green)' },
    orange: { bg:'rgba(249,115,21,0.1)',  c:'var(--accent-orange)' },
    purple: { bg:'rgba(158,60,236,0.1)',  c:'var(--accent-purple)' },
    pink:   { bg:'rgba(236,72,153,0.1)',  c:'var(--accent-pink)' },
    blue:   { bg:'rgba(59,130,246,0.1)',  c:'var(--accent-blue)' },
    gray:   { bg:'rgba(139,139,137,0.1)', c:'var(--text-muted)' },
  };
  const s = map[color] || map.gray;
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:100, fontSize:'0.72rem', fontWeight:600, background:s.bg, color:s.c, whiteSpace:'nowrap' }}>
      {label}
    </span>
  );
}

/* ── Table ── */
export function Table({ cols, rows }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{ textAlign:'left', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', padding:'0 12px 12px 0', borderBottom:'1px solid var(--glass-border)', whiteSpace:'nowrap' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ cursor:'default' }}
              onMouseEnter={e=>{ [...e.currentTarget.cells].forEach(c=>c.style.background='rgba(0,0,0,0.012)'); }}
              onMouseLeave={e=>{ [...e.currentTarget.cells].forEach(c=>c.style.background=''); }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding:'11px 12px 11px 0', fontSize:'0.85rem', color:'var(--text-secondary)', borderBottom: i<rows.length-1 ? '1px solid rgba(0,0,0,0.04)' : 'none', verticalAlign:'middle' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Avatar ── */
export function Avatar({ name, gradient='linear-gradient(135deg,#14c9e1,#9e3cec)', size=32 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:gradient, color:'#fff', fontWeight:700, fontSize:size*0.25+'rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

/* ── Filter bar ── */
export function FilterBar({ filters=[], onSearch, onExport }) {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
      <input type="search" placeholder="Search…" onChange={e=>onSearch?.(e.target.value)}
        style={{ flex:1, minWidth:160, maxWidth:260, padding:'8px 14px', border:'1px solid var(--glass-border)', borderRadius:100, fontSize:'0.82rem', background:'var(--bg-space)', color:'var(--text-primary)', outline:'none' }} />
      {filters.map((f, idx) => {
        if (typeof f === 'string') {
          return (
            <select key={idx} style={{ padding:'8px 14px', border:'1px solid var(--glass-border)', borderRadius:100, fontSize:'0.82rem', background:'var(--bg-space)', color:'var(--text-secondary)', outline:'none', cursor:'pointer' }}>
              <option>{f}</option>
            </select>
          );
        }
        return (
          <select key={idx} value={f.value} onChange={e => f.onChange?.(e.target.value)} style={{ padding:'8px 14px', border:'1px solid var(--glass-border)', borderRadius:100, fontSize:'0.82rem', background:'var(--bg-space)', color:'var(--text-secondary)', outline:'none', cursor:'pointer' }}>
            {f.options.map(opt => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              return <option key={val} value={val}>{lbl}</option>;
            })}
          </select>
        );
      })}
      <button onClick={onExport || (() => alert('Exporting is only supported for Employee records.'))} style={{ padding:'8px 16px', border:'1px solid var(--glass-border)', borderRadius:100, fontSize:'0.82rem', fontWeight:600, background:'var(--bg-space)', color:'var(--text-secondary)', cursor:'pointer' }}>
        Export CSV
      </button>
    </div>
  );
}

/* ── Toggle switch ── */
export function Toggle({ label, desc, on: initialOn=false }) {
  const [on, setOn] = useState(initialOn);
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'13px 0', borderBottom:'1px solid var(--glass-border)' }}>
      <div style={{ flex:1, paddingRight:16 }}>
        <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{desc}</div>}
      </div>
      <button onClick={()=>setOn(!on)} style={{ flexShrink:0, width:44, height:24, borderRadius:100, border:'none', cursor:'pointer', background:on?'var(--accent-cyan)':'#d1d5db', position:'relative', transition:'background 0.2s' }}>
        <span style={{ position:'absolute', top:3, left:on?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }} />
      </button>
    </div>
  );
}

/* ── Btn ── */
export function Btn({ label, onClick, variant='primary', size='md' }) {
  const pad = size==='sm' ? '5px 12px' : '9px 20px';
  const fs  = size==='sm' ? '0.75rem' : '0.82rem';
  const styles = {
    primary: { background:'var(--text-primary)', color:'#fff', border:'none' },
    danger:  { background:'rgba(236,72,153,0.08)', color:'var(--accent-pink)', border:'1px solid rgba(236,72,153,0.2)' },
    ghost:   { background:'var(--bg-space)', color:'var(--text-secondary)', border:'1px solid var(--glass-border)' },
  };
  return (
    <button onClick={onClick} style={{ padding:pad, fontSize:fs, fontWeight:600, borderRadius:100, cursor:'pointer', transition:'all 0.2s', ...styles[variant]||styles.ghost }}>
      {label}
    </button>
  );
}

/* ── Row layout ── */
export function Row({ cols='3fr 2fr', gap=16, children }) {
  return <div style={{ display:'grid', gridTemplateColumns:cols, gap }}>{children}</div>;
}

/* ── Progress bar ── */
export function ProgressBar({ pct, color='var(--accent-cyan)', height=6 }) {
  return (
    <div style={{ flex:1, height, background:'var(--bg-space)', borderRadius:100, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:100, transition:'width 0.6s ease' }} />
    </div>
  );
}

/* ── Section title ── */
export function SectionTitle({ text }) {
  return <h3 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)', marginBottom:14, marginTop:20 }}>{text}</h3>;
}

/* ── Input field ── */
export function Field({ label, placeholder, type='text', defaultValue='' }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>{label}</label>
      <input type={type} defaultValue={defaultValue} placeholder={placeholder}
        style={{ width:'100%', padding:'10px 14px', border:'1px solid var(--glass-border)', borderRadius:10, fontSize:'0.85rem', background:'var(--bg-space)', color:'var(--text-primary)', outline:'none', boxSizing:'border-box' }}
        onFocus={e=>e.target.style.borderColor='var(--accent-cyan)'}
        onBlur={e=>e.target.style.borderColor='var(--glass-border)'} />
    </div>
  );
}

/* ── Save/Discard buttons ── */
export function SaveBar() {
  return (
    <div style={{ display:'flex', gap:10, marginTop:24 }}>
      <Btn label="Save Changes" variant="primary" />
      <Btn label="Discard" variant="ghost" />
    </div>
  );
}

/* ── Tabs ── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--glass-border)', marginBottom:20 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={()=>onChange(t.id)} style={{ padding:'9px 16px', border:'none', borderRadius:'8px 8px 0 0', fontWeight:600, fontSize:'0.82rem', cursor:'pointer', background: active===t.id ? 'var(--bg-card)' : 'transparent', color: active===t.id ? 'var(--accent-cyan)' : 'var(--text-muted)', borderBottom: active===t.id ? '2px solid var(--accent-cyan)' : '2px solid transparent', transition:'all 0.2s' }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
