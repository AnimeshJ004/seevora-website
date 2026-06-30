const fs = require('fs');
const lines = fs.readFileSync('src/components/admin/AdminPage.jsx', 'utf8').split('\n');
const before = lines.slice(0, 1459); // lines before ViewSettings (0-indexed = line 1460)
const after   = lines.slice(1480);   // lines after old ViewSettings

const newFn = `function ViewSettings() {
  const [tab, setTab] = React.useState('general');
  const tabs = [
    { id:'general',       label:'General' },
    { id:'notifications', label:'Notifications' },
    { id:'security',      label:'Security & Auth' },
    { id:'modules',       label:'Modules' },
    { id:'branding',      label:'Branding' },
    { id:'billing',       label:'Billing & Plans' },
    { id:'data',          label:'Data & Privacy' },
    { id:'api',           label:'API & Webhooks' },
  ];
  const inp = (label, placeholder, type='text', defaultVal='') => (
    <div key={label} style={{marginBottom:16}}>
      <label style={{display:'block',fontSize:'0.78rem',fontWeight:600,color:'var(--text-primary)',marginBottom:6}}>{label}</label>
      <input type={type} defaultValue={defaultVal} placeholder={placeholder}
        style={{width:'100%',padding:'10px 14px',border:'1px solid var(--glass-border)',borderRadius:10,fontSize:'0.85rem',background:'var(--bg-space)',color:'var(--text-primary)',outline:'none'}} />
    </div>
  );
  const toggle = (label, desc, defaultOn=false) => {
    const [on, setOn] = React.useState(defaultOn);
    return (
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'14px 0',borderBottom:'1px solid var(--glass-border)'}}>
        <div>
          <div style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text-primary)'}}>{label}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:2}}>{desc}</div>
        </div>
        <button onClick={()=>setOn(!on)} style={{flexShrink:0,width:44,height:24,borderRadius:100,border:'none',cursor:'pointer',background:on?'var(--accent-cyan)':'var(--glass-border)',position:'relative',transition:'background 0.2s'}}>
          <span style={{position:'absolute',top:3,left:on?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}/>
        </button>
      </div>
    );
  };
  const saveBtn = () => (
    <div style={{marginTop:24,display:'flex',gap:10}}>
      <button style={{padding:'10px 24px',background:'var(--text-primary)',color:'#fff',border:'none',borderRadius:100,fontWeight:700,fontSize:'0.85rem',cursor:'pointer'}}>Save Changes</button>
      <button style={{padding:'10px 24px',background:'transparent',color:'var(--text-secondary)',border:'1px solid var(--glass-border)',borderRadius:100,fontWeight:600,fontSize:'0.85rem',cursor:'pointer'}}>Discard</button>
    </div>
  );
  const sectionTitle = (t) => <h3 style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:'1rem',color:'var(--text-primary)',marginBottom:16,marginTop:8}}>{t}</h3>;
  return (
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:'1.4rem',color:'var(--text-primary)',marginBottom:4}}>Settings</h2>
        <p style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>Manage platform configuration, security, modules and preferences</p>
      </div>
      {/* Tab bar */}
      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:24,borderBottom:'1px solid var(--glass-border)',paddingBottom:0}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'10px 18px',border:'none',borderRadius:'10px 10px 0 0',fontWeight:600,fontSize:'0.82rem',cursor:'pointer',background:tab===t.id?'var(--bg-card)':'transparent',color:tab===t.id?'var(--accent-cyan)':'var(--text-muted)',borderBottom:tab===t.id?'2px solid var(--accent-cyan)':'2px solid transparent',transition:'all 0.2s'}}>{t.label}</button>
        ))}
      </div>
      {/* -- GENERAL -- */}
      {tab==='general' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,maxWidth:900}}>
          <div>
            {sectionTitle('Platform Identity')}
            {inp('Platform Name','e.g. Seevora','text','Seevora')}
            {inp('Tagline','Short description','text','AI-Powered Business Automation')}
            {inp('Super Admin Email','admin@seevora.in','email','animesh@seevora.in')}
            {inp('Support Email','support@seevora.in','email','support@seevora.in')}
            {inp('Support WhatsApp','+91 XXXXX XXXXX','tel','+91 82692 97967')}
            {saveBtn()}
          </div>
          <div>
            {sectionTitle('Regional Settings')}
            {inp('Timezone','Select timezone','text','Asia/Kolkata (IST)')}
            {inp('Date Format','DD/MM/YYYY','text','DD/MM/YYYY')}
            {inp('Currency','INR','text','INR — Indian Rupee')}
            {inp('Default Language','English','text','English + Hindi')}
            {sectionTitle('Business Hours')}
            {inp('Opening Time','09:00','time','09:00')}
            {inp('Closing Time','18:00','time','18:00')}
            {inp('Weekly Off','Sunday','text','Sunday')}
          </div>
        </div>
      )}
      {/* -- NOTIFICATIONS -- */}
      {tab==='notifications' && (
        <div style={{maxWidth:640}}>
          {sectionTitle('Email Notifications')}
          {toggle('New Business Registration','Send email when a new business registers',true)}
          {toggle('Business Approved / Rejected','Notify admin on approval decision',true)}
          {toggle('Failed Payment Alert','Alert on payment failure or decline',true)}
          {toggle('Weekly Platform Summary','Every Monday morning digest email',true)}
          {toggle('New Support Ticket','Notify when a new support ticket is raised',false)}
          {sectionTitle('WhatsApp Alerts')}
          {toggle('Critical Security Alerts','Login from new device / failed attempts',true)}
          {toggle('Module Down Alert','Notify when any AI module goes offline',true)}
          {toggle('SLA Breach Warning','Alert before support ticket SLA expires',false)}
          {toggle('New Business Onboarded','WhatsApp notification on live go-live',false)}
          {sectionTitle('In-App Notifications')}
          {toggle('Audit Log Highlights','Show critical events in notification bell',true)}
          {toggle('Pending Approvals Reminder','Remind admin of pending business approvals',true)}
          {saveBtn()}
        </div>
      )}
      {/* -- SECURITY -- */}
      {tab==='security' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,maxWidth:900}}>
          <div>
            {sectionTitle('Authentication')}
            {toggle('Enforce MFA for Super Admin','Required on every login — cannot be disabled',true)}
            {toggle('Enforce MFA for Business Owners','OTP on every login for business admins',true)}
            {toggle('MFA Optional for Staff','Let business owners decide for staff',false)}
            {toggle('Remember Device (30 days)','Skip OTP on trusted devices',true)}
            {sectionTitle('Session Policy')}
            {inp('Session Timeout (minutes)','30','number','30')}
            {inp('Max Concurrent Sessions','1 = single device only','number','2')}
            {inp('Refresh Token Expiry (days)','7','number','7')}
          </div>
          <div>
            {sectionTitle('Login Protection')}
            {inp('Max Failed Attempts Before Lock','Default: 5','number','5')}
            {inp('Lockout Duration (minutes)','Default: 15','number','15')}
            {inp('Permanent Lock After (attempts)','Default: 20','number','20')}
            {toggle('IP Whitelist Mode','Restrict admin login to specific IPs only',false)}
            {inp('Whitelisted IPs','Comma-separated IPs','')}
            {sectionTitle('Password Policy')}
            {toggle('Require Uppercase Letter','Min 1 uppercase in password',true)}
            {toggle('Require Number','Min 1 number in password',true)}
            {toggle('Require Special Character','Min 1 special char e.g. @#$',false)}
            {inp('Minimum Password Length','Default: 8','number','8')}
            {saveBtn()}
          </div>
        </div>
      )}
      {/* -- MODULES -- */}
      {tab==='modules' && (
        <div style={{maxWidth:700}}>
          {sectionTitle('Module Availability')}
          <p style={{fontSize:'0.82rem',color:'var(--text-muted)',marginBottom:20}}>Enable or disable modules globally. Business owners can further configure per-tenant settings.</p>
          {[
            {name:'AI Voice Reception',desc:'24/7 inbound call handling in Hindi, English & regional languages',on:true},
            {name:'Appointment Management',desc:'Smart booking engine with reminders, waitlist and no-show prediction',on:true},
            {name:'CRM & Lead Management',desc:'Multi-source lead capture, scoring and 7-day follow-up sequences',on:true},
            {name:'WhatsApp Automation',desc:'Broadcast reminders, follow-ups and review requests via WhatsApp API',on:true},
            {name:'Reputation Management',desc:'Automated review requests + AI-drafted Google review replies',on:true},
            {name:'Digital Presence & SEO',desc:'Client website deployment with local SEO and Google Business Profile',on:true},
            {name:'Analytics & Reporting',desc:'Real-time dashboards and weekly AI-generated owner reports',on:true},
            {name:'Billing & Invoicing',desc:'Razorpay subscription management, GST invoices, payment tracking',on:true},
          ].map(m=>(
            <div key={m.name} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'16px 0',borderBottom:'1px solid var(--glass-border)'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.88rem',fontWeight:600,color:'var(--text-primary)'}}>{m.name}</div>
                <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:3}}>{m.desc}</div>
              </div>
              <ToggleSwitch defaultOn={m.on} />
            </div>
          ))}
          {saveBtn()}
        </div>
      )}
      {/* -- BRANDING -- */}
      {tab==='branding' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,maxWidth:900}}>
          <div>
            {sectionTitle('Visual Identity')}
            {inp('Brand Name','Seevora','text','Seevora')}
            {inp('Primary Accent Color','#14c9e1','text','#14c9e1')}
            {inp('Secondary Accent Color','#9e3cec','text','#9e3cec')}
            {inp('Logo URL','https://...','url','')}
            {inp('Favicon URL','https://...','url','')}
            {sectionTitle('Client Dashboard Branding')}
            {toggle('Show Seevora Branding to Clients','Display Powered by Seevora footer',true)}
            {toggle('White-Label Mode','Remove all Seevora references for enterprise clients',false)}
            {inp('White-Label Brand Name','Your brand name','')}
          </div>
          <div>
            {sectionTitle('Email Templates')}
            {inp('Email Header Color','#0a0a0a','text','#0a0a0a')}
            {inp('Email Footer Text','e.g. © 2026 Seevora','text','© 2026 Seevora Private Limited')}
            {inp('Reply-To Email','noreply@seevora.in','email','noreply@seevora.in')}
            {sectionTitle('Client Portal URL')}
            {inp('Dashboard Base URL','app.seevora.in','text','app.seevora.in')}
            {inp('Custom Domain (optional)','dashboard.yourbrand.in','')}
            {saveBtn()}
          </div>
        </div>
      )}
      {/* -- BILLING -- */}
      {tab==='billing' && (
        <div style={{maxWidth:800}}>
          {sectionTitle('Subscription Plans')}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
            {[
              {name:'Starter',price:'?2,999/mo',features:['AI Voice','CRM','Appointments','Basic Analytics'],color:'var(--accent-cyan)'},
              {name:'Pro',price:'?5,999/mo',features:['All Starter','WhatsApp Automation','Reputation Mgmt','SEO Website','Advanced Reports'],color:'var(--accent-purple)'},
              {name:'Enterprise',price:'Custom',features:['All Pro','White-Label','Dedicated Support','Custom Integrations','SLA Agreement'],color:'var(--accent-green)'},
            ].map(p=>(
              <div key={p.name} style={{border:'1px solid var(--glass-border)',borderRadius:14,padding:20,background:'var(--bg-card)'}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:'1rem',color:'var(--text-primary)',marginBottom:4}}>{p.name}</div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:'1.3rem',color:p.color,marginBottom:12}}>{p.price}</div>
                {p.features.map(f=>(
                  <div key={f} style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginBottom:4,display:'flex',gap:6,alignItems:'center'}}>
                    <span style={{color:'var(--accent-green)',fontWeight:700}}>?</span>{f}
                  </div>
                ))}
                <button style={{marginTop:14,width:'100%',padding:'8px 0',border:'1px solid var(--glass-border)',borderRadius:8,fontSize:'0.78rem',fontWeight:600,cursor:'pointer',background:'var(--bg-space)',color:'var(--text-secondary)'}}>Edit Plan</button>
              </div>
            ))}
          </div>
          {sectionTitle('Payment Gateway')}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:700}}>
            {inp('Razorpay Key ID','rzp_live_...','text')}
            {inp('Razorpay Key Secret','Hidden','password')}
            {inp('GST Number','27AABCU9603R1ZX','text','27AABCU9603R1ZX')}
            {inp('GST Rate (%)','18','number','18')}
          </div>
          {toggle('Auto-generate GST Invoices','Create invoice PDF on every payment',true)}
          {toggle('Send Invoice to Client Email','Email invoice automatically on payment',true)}
          {toggle('Send Payment Reminder','WhatsApp reminder 3 days before renewal',true)}
          {saveBtn()}
        </div>
      )}
      {/* -- DATA & PRIVACY -- */}
      {tab==='data' && (
        <div style={{maxWidth:700}}>
          {sectionTitle('Data Retention')}
          {inp('Active Client Data Retention','Subscription duration + N days','number','90')}
          {inp('Audit Log Retention (days)','730 = 2 years','number','730')}
          {inp('Call Recording Retention (days)','Default: 180','number','180')}
          {inp('WhatsApp Message Log Retention (days)','Default: 365','number','365')}
          {sectionTitle('Privacy & Compliance')}
          {toggle('DPDPA 2023 Compliance Mode','Enforce data minimisation & consent logging',true)}
          {toggle('Consent Required on Registration','Block signup without explicit consent checkboxes',true)}
          {toggle('Allow Data Export by Business Owner','Let owners download their tenant data',true)}
          {toggle('Auto-delete on Subscription End','Purge tenant data after retention period',false)}
          {sectionTitle('Data Protection Officer')}
          {inp('DPO Name','Full name','text','Animesh Jain')}
          {inp('DPO Email','dpo@seevora.in','email','dpo@seevora.in')}
          {inp('DPO Contact','Phone number','tel','+91 82692 97967')}
          {saveBtn()}
        </div>
      )}
      {/* -- API & WEBHOOKS -- */}
      {tab==='api' && (
        <div style={{maxWidth:800}}>
          {sectionTitle('API Keys')}
          {[
            {label:'Production API Key',value:'sk_live_seevora_••••••••••••4a9f',color:'var(--accent-green)'},
            {label:'Staging API Key',value:'sk_test_seevora_••••••••••••8b2c',color:'var(--accent-orange)'},
          ].map(k=>(
            <div key={k.label} style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:'12px 16px',border:'1px solid var(--glass-border)',borderRadius:10,background:'var(--bg-space)'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--text-muted)',marginBottom:4}}>{k.label}</div>
                <div style={{fontFamily:'monospace',fontSize:'0.85rem',color:k.color,letterSpacing:'0.04em'}}>{k.value}</div>
              </div>
              <button style={{padding:'6px 14px',border:'1px solid var(--glass-border)',borderRadius:8,fontSize:'0.75rem',fontWeight:600,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-secondary)'}}>Reveal</button>
              <button style={{padding:'6px 14px',border:'1px solid rgba(236,72,153,0.2)',borderRadius:8,fontSize:'0.75rem',fontWeight:600,cursor:'pointer',background:'rgba(236,72,153,0.06)',color:'var(--accent-pink)'}}>Revoke</button>
            </div>
          ))}
          <button style={{padding:'9px 18px',border:'1px dashed var(--glass-border)',borderRadius:10,fontSize:'0.82rem',fontWeight:600,cursor:'pointer',background:'transparent',color:'var(--accent-cyan)',marginBottom:28}}>+ Generate New Key</button>
          {sectionTitle('Webhook Endpoints')}
          {[
            {event:'lead.created',url:'https://crm.example.com/webhook/lead',status:'active'},
            {event:'appointment.confirmed',url:'https://cal.example.com/webhook/appt',status:'active'},
            {event:'payment.received',url:'https://billing.example.com/webhook/pay',status:'inactive'},
          ].map(w=>(
            <div key={w.event} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,padding:'12px 16px',border:'1px solid var(--glass-border)',borderRadius:10,background:'var(--bg-space)'}}>
              <span style={{padding:'3px 10px',borderRadius:100,fontSize:'0.72rem',fontWeight:700,background:w.status==='active'?'rgba(16,185,129,0.1)':'rgba(139,139,137,0.1)',color:w.status==='active'?'var(--accent-green)':'var(--text-muted)'}}>{w.status}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>{w.event}</div>
                <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--text-muted)'}}>{w.url}</div>
              </div>
              <button style={{padding:'6px 12px',border:'1px solid var(--glass-border)',borderRadius:8,fontSize:'0.72rem',fontWeight:600,cursor:'pointer',background:'var(--bg-card)',color:'var(--text-secondary)'}}>Edit</button>
            </div>
          ))}
          <button style={{padding:'9px 18px',border:'1px dashed var(--glass-border)',borderRadius:10,fontSize:'0.82rem',fontWeight:600,cursor:'pointer',background:'transparent',color:'var(--accent-cyan)',marginTop:4}}>+ Add Webhook</button>
          {saveBtn()}
        </div>
      )}
    </div>
  );
}
function ToggleSwitch({defaultOn=false}) {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <button onClick={()=>setOn(!on)} style={{flexShrink:0,width:44,height:24,borderRadius:100,border:'none',cursor:'pointer',background:on?'var(--accent-cyan)':'#d1d5db',position:'relative',transition:'background 0.2s',marginLeft:16,marginTop:2}}>
      <span style={{position:'absolute',top:3,left:on?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}/>
    </button>
  );
}`;

const result = [...before, newFn, ...after].join('\n');
fs.writeFileSync('src/components/admin/AdminPage.jsx', result, 'utf8');
console.log('done');
