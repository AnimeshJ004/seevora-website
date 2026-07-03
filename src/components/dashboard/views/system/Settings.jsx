import { useState, useEffect } from 'react';

const sections = [
  { id: 'general', label: 'General', desc: 'Company profile and support details' },
  { id: 'security', label: 'Security', desc: 'Admin login and session controls' },
  { id: 'notifications', label: 'Notifications', desc: 'Email and alert preferences' },
  { id: 'branding', label: 'Branding', desc: 'Dashboard display and brand fields' },
  { id: 'integrations', label: 'Integrations', desc: 'Connected communication channels' },
  { id: 'billing', label: 'Billing', desc: 'Plan and invoice preferences' },
];

export default function Settings({ user }) {
  const [settings, setSettings] = useState({});
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/system/settings', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/system/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      setSaveMessage('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const checkbox = (key) => settings[key] === 'true';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>System Settings</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Choose a settings option to configure that area.</p>
      </div>

      {loading ? <p>Loading settings...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          <aside style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10 }}>
            {sections.map(section => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 14px',
                    background: active ? '#eef2ff' : 'transparent',
                    color: active ? '#3730a3' : '#0f172a',
                    cursor: 'pointer',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{section.label}</div>
                  <div style={{ color: active ? '#4f46e5' : '#64748b', fontSize: '0.75rem', marginTop: 3 }}>{section.desc}</div>
                </button>
              );
            })}
          </aside>

          <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 30 }}>
            <SectionHeader section={sections.find(item => item.id === activeSection)} />

            {activeSection === 'general' && (
              <>
                <Field label="Company Name" value={settings.company_name || ''} onChange={value => handleChange('company_name', value)} />
                <Field label="Support Email" type="email" value={settings.support_email || ''} onChange={value => handleChange('support_email', value)} />
                <Field label="Company Phone" value={settings.company_phone || ''} onChange={value => handleChange('company_phone', value)} />
                <Field label="Default Timezone" value={settings.default_timezone || 'Asia/Kolkata'} onChange={value => handleChange('default_timezone', value)} />
              </>
            )}

            {activeSection === 'security' && (
              <>
                <CheckRow label="Require Two-Factor Authentication for Admins" checked={checkbox('require_2fa')} onChange={value => handleChange('require_2fa', value ? 'true' : 'false')} />
                <Field label="Session Timeout (Minutes)" type="number" value={settings.session_timeout || '60'} onChange={value => handleChange('session_timeout', value)} />
                <Field label="Password Expiry Days" type="number" value={settings.password_expiry_days || '90'} onChange={value => handleChange('password_expiry_days', value)} />
                <CheckRow label="Send login alert emails" checked={checkbox('login_alerts')} onChange={value => handleChange('login_alerts', value ? 'true' : 'false')} />
              </>
            )}

            {activeSection === 'notifications' && (
              <>
                <CheckRow label="Enable Email Notifications for System Alerts" checked={checkbox('email_notifications')} onChange={value => handleChange('email_notifications', value ? 'true' : 'false')} />
                <CheckRow label="Notify admins for new audit requests" checked={checkbox('audit_notifications')} onChange={value => handleChange('audit_notifications', value ? 'true' : 'false')} />
                <CheckRow label="Notify managers for new leads" checked={checkbox('lead_notifications')} onChange={value => handleChange('lead_notifications', value ? 'true' : 'false')} />
                <Field label="Notification Email" type="email" value={settings.notification_email || ''} onChange={value => handleChange('notification_email', value)} />
              </>
            )}

            {activeSection === 'branding' && (
              <>
                <Field label="Dashboard Title" value={settings.dashboard_title || 'Seevora Workspace'} onChange={value => handleChange('dashboard_title', value)} />
                <Field label="Brand Color" value={settings.brand_color || '#4f46e5'} onChange={value => handleChange('brand_color', value)} />
                <Field label="Logo URL" value={settings.logo_url || ''} onChange={value => handleChange('logo_url', value)} />
                <CheckRow label="Show company name in header" checked={checkbox('show_company_name')} onChange={value => handleChange('show_company_name', value ? 'true' : 'false')} />
              </>
            )}

            {activeSection === 'integrations' && (
              <>
                <Field label="WhatsApp Business Number" value={settings.whatsapp_number || ''} onChange={value => handleChange('whatsapp_number', value)} />
                <Field label="SMTP Host" value={settings.smtp_host || ''} onChange={value => handleChange('smtp_host', value)} />
                <Field label="Calendar Provider" value={settings.calendar_provider || 'Google Calendar'} onChange={value => handleChange('calendar_provider', value)} />
                <CheckRow label="Enable webhook delivery" checked={checkbox('webhooks_enabled')} onChange={value => handleChange('webhooks_enabled', value ? 'true' : 'false')} />
              </>
            )}

            {activeSection === 'billing' && (
              <>
                <Field label="Billing Email" type="email" value={settings.billing_email || ''} onChange={value => handleChange('billing_email', value)} />
                <Field label="Plan Name" value={settings.plan_name || 'Starter'} onChange={value => handleChange('plan_name', value)} />
                <Field label="GST / Tax ID" value={settings.tax_id || ''} onChange={value => handleChange('tax_id', value)} />
                <CheckRow label="Send monthly invoice emails" checked={checkbox('invoice_emails')} onChange={value => handleChange('invoice_emails', value ? 'true' : 'false')} />
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 36, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
              <button 
                type="submit" 
                disabled={saving}
                style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {saveMessage && (
                <span style={{ color: saveMessage.includes('successfully') ? '#10b981' : '#ef4444', fontWeight: 500, fontSize: '0.9rem' }}>
                  {saveMessage}
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ section }) {
  return (
    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 14, marginBottom: 22 }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{section?.label || 'Settings'}</h3>
      <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.84rem' }}>{section?.desc}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
      />
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
      </label>
    </div>
  );
}
