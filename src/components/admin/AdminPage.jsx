import React, { useState, useEffect } from 'react';
import logoIcon from '../../assets/logo-icon.png';
import './AdminPage.css';

/* ─── Inline SVG Icons ─────────────────────────────────────────────────── */

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconAIVoice = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconAppointments = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);

const IconLeads = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <polyline points="9 11 12 14 15 11" />
  </svg>
);

const IconReviews = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconWebSEO = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconAnalytics = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconBilling = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="7" y1="15" x2="17" y2="15" />
  </svg>
);

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconUsersRoles = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="2" />
    <line x1="12" y1="13" x2="12" y2="16" />
  </svg>
);

const IconIntegrations = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const IconSupport = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="10" r="1" />
    <line x1="12" y1="13" x2="12" y2="13.01" />
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconWhatsAppOutline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconHelp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconRupee = () => (
  <span style={{ fontFamily: 'system-ui', fontSize: '1.1rem', fontWeight: 'bold' }}>₹</span>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconMegaphone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.5 1.5" />
    <path d="M14 14l3-3" />
  </svg>
);

const IconCaretDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M12 3l1.4 4.3L18 9l-4.6 1.7L12 15l-1.4-4.3L6 9l4.6-1.7L12 3z" />
    <path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14z" />
  </svg>
);

const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z" />
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ─── Sidebar Navigation Items Mapping ─────────────────────────────────── */

const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { id: 'ai-voice-agent', label: 'AI Voice Agent', Icon: IconAIVoice },
  { id: 'appointments', label: 'Appointments', Icon: IconAppointments },
  { id: 'leads', label: 'CRM / Leads', Icon: IconLeads },
  { id: 'customers', label: 'Customers', Icon: IconUsers },
  { id: 'whatsapp-marketing', label: 'WhatsApp Marketing', Icon: IconWhatsApp },
  { id: 'reputation', label: 'Reputation', Icon: IconReviews },
  { id: 'website-seo', label: 'Website & SEO', Icon: IconWebSEO },
  { id: 'analytics', label: 'Analytics', Icon: IconAnalytics },
  { id: 'billing', label: 'Billing & Payments', Icon: IconBilling },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
  { id: 'users', label: 'Users & Roles', Icon: IconUsersRoles },
  { id: 'integrations', label: 'Integrations', Icon: IconIntegrations },
  { id: 'support', label: 'Support', Icon: IconSupport },
];

/* ─── Page Title Mapping ────────────────────────────────────────────────── */

const pageTitles = {
  'dashboard': 'Dashboard',
  'ai-voice-agent': 'AI Voice Agent',
  'appointments': 'Appointments',
  'leads': 'CRM / Leads',
  'customers': 'Customers',
  'whatsapp-marketing': 'WhatsApp Marketing',
  'reputation': 'Reputation',
  'website-seo': 'Website & SEO',
  'analytics': 'Analytics',
  'billing': 'Billing & Payments',
  'settings': 'Settings',
  'users': 'Users & Roles',
  'integrations': 'Integrations',
  'support': 'Support',
};

/* ─── Main AdminPage Component ────────────────────────────────────────── */

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('seevoraAuthToken');
    localStorage.removeItem('seevoraUser');
    window.location.assign('/login');
  };

  useEffect(() => {
    const formatted = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    setCurrentDate(formatted);
  }, []);

  return (
    <div className="admin-layout">
      {/* Sidebar navigation */}
      <aside className="admin-sidebar">
        {/* Logo and Brand */}
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-header">
            <img src={logoIcon} alt="Seevora" className="admin-sidebar-logo-img" />
            <span className="admin-sidebar-logo-text">Seevora AI</span>
          </div>
          <span className="admin-sidebar-logo-subtext">AI-Powered Growth Platform</span>
        </div>

        {/* Navigation items list */}
        <nav className="admin-nav" aria-label="Admin sidebar navigation">
          {navItems.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              className={`admin-nav-item${activeNav === id ? ' active' : ''}`}
              onClick={() => setActiveNav(id)}
              aria-current={activeNav === id ? 'page' : undefined}
            >
              <Icon />
              <span>{label}</span>
              {badge && <span className="admin-nav-badge">{badge}</span>}
            </button>
          ))}
        </nav>
        {/* User profile dropdown footer */}
        <div className="admin-sidebar-user" onClick={() => setActiveNav('settings')}>
          <div className="admin-sidebar-avatar" aria-hidden="true">SA</div>
          <div className="admin-sidebar-user-info">
            <div className="admin-sidebar-user-name">Seevora Admin</div>
            <div className="admin-sidebar-user-role">admin@seevora.in</div>
          </div>
          <div className="admin-sidebar-user-caret">
            <IconCaretDown />
          </div>
        </div>
        <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17l1.5-1.5L8 12h12" />
            <path d="M20 12a8 8 0 1 1-8-8" />
          </svg>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main content body */}
      <main className="admin-main">
        {/* Header bar */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-header-menu-toggle" aria-label="Toggle navigation menu">
              <IconMenu />
            </button>
            <div className="admin-search-wrapper">
              <span className="admin-search-icon" aria-hidden="true">
                <IconSearch />
              </span>
              <input
                className="admin-search"
                type="search"
                placeholder="Search anything..."
                aria-label="Search dashboard"
              />
              <span className="admin-search-shortcut">Ctrl + /</span>
            </div>
          </div>

          <div className="admin-header-right">
            <button className="admin-header-icon-btn" aria-label="Notifications">
              <IconBell />
              <span className="admin-notif-dot" aria-hidden="true" />
            </button>
            <button 
              className="admin-header-icon-btn" 
              aria-label="WhatsApp portal"
              onClick={() => setActiveNav('whatsapp-marketing')}
            >
              <IconWhatsAppOutline />
            </button>
            <button className="admin-header-icon-btn" aria-label="Help and resources">
              <IconHelp />
            </button>
            <span className="admin-header-divider" aria-hidden="true" />
            
            <div className="admin-header-profile" onClick={() => setActiveNav('settings')}>
              <div className="admin-header-profile-avatar">SA</div>
              <div className="admin-header-profile-info">
                <span className="admin-header-profile-name">Seevora Admin</span>
                <span className="admin-header-profile-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content rendering router */}
        <div className="admin-content">
          {activeNav === 'dashboard' && <ViewDashboard />}
          {activeNav === 'ai-voice-agent' && <ViewAIVoiceAgent />}
          {activeNav === 'appointments' && <ViewAppointments />}
          {activeNav === 'leads' && <ViewLeads />}
          {activeNav === 'customers' && <ViewCustomers />}
          {activeNav === 'whatsapp-marketing' && <ViewWhatsAppMarketing />}
          {activeNav === 'reputation' && <ViewReputation />}
          {activeNav === 'website-seo' && <ViewWebsiteSEO />}
          {activeNav === 'analytics' && <ViewAnalytics />}
          {activeNav === 'billing' && <ViewBilling />}
          {activeNav === 'settings' && <ViewSettings />}
          {activeNav === 'users' && <ViewUsers />}
          {activeNav === 'integrations' && <ViewIntegrations />}
          {activeNav === 'support' && <ViewSupport />}
        </div>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   SHARED HELPERS
   ────────────────────────────────────────────────────────────────────────── */

function EmptyState({ icon, title, description }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: '10px',
      color: 'var(--text-muted)', textAlign: 'center',
    }}>
      <div style={{ fontSize: '2rem', opacity: 0.35 }}>{icon || '📭'}</div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {title || 'No data yet'}
      </div>
      <div style={{ fontSize: '0.78rem', maxWidth: 320, lineHeight: 1.6 }}>
        {description || 'Connect your backend to populate this section.'}
      </div>
    </div>
  );
}

function KpiCard({ label, colorClass, Icon }) {
  return (
    <div className="admin-stat-kpi-card">
      <div className="admin-stat-kpi-header">
        <span className="admin-stat-kpi-label">{label}</span>
        <div className={`admin-stat-kpi-icon ${colorClass}`}><Icon /></div>
      </div>
      <div className="admin-stat-kpi-value">—</div>
      <div className="admin-stat-kpi-trend" style={{ color: 'var(--text-muted)' }}>No data connected</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      {action && (
        <button style={{ padding: '9px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 100, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  );
}

function FilterBar({ filters = [], searchValue, onSearchChange, filterValues = {}, onFilterChange }) {
  const isControlled = typeof onSearchChange === 'function';

  return (
    <div className="admin-filter-bar">
      <input
        type="search"
        className="admin-filter-search"
        placeholder="Search..."
        value={isControlled ? searchValue : undefined}
        onChange={isControlled ? (e) => onSearchChange(e.target.value) : undefined}
      />
      {filters.map((f) => {
        const key = typeof f === 'string' ? f : f.key;
        const options = typeof f === 'string' ? [f] : f.options;

        return (
          <select
            key={key}
            className="admin-filter-select"
            value={filterValues[key] ?? options[0]?.value ?? options[0]}
            onChange={onFilterChange ? (e) => onFilterChange(key, e.target.value) : undefined}
          >
            {options.map((opt) => {
              const value = typeof opt === 'string' ? opt : opt.value;
              const text = typeof opt === 'string' ? opt : opt.label;
              return <option key={value} value={value}>{text}</option>;
            })}
          </select>
        );
      })}
      <button type="button" className="admin-filter-export">Export CSV</button>
    </div>
  );
}

function AIChip({ children, variant = 'default' }) {
  return (
    <span className={`admin-ai-chip admin-ai-chip--${variant}`}>
      <IconSparkle />
      {children}
    </span>
  );
}

function SentimentBadge({ sentiment }) {
  const labels = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };
  return (
    <span className={`admin-sentiment-badge admin-sentiment-badge--${sentiment}`}>
      {labels[sentiment] || sentiment}
    </span>
  );
}

function ConfidenceScore({ value }) {
  const level = value >= 85 ? 'high' : value >= 70 ? 'medium' : 'low';
  return (
    <span className={`admin-confidence admin-confidence--${level}`} title="AI intent confidence">
      {value}%
    </span>
  );
}

function AIInsightsStrip({ items }) {
  return (
    <div className="admin-ai-insights-strip" role="region" aria-label="AI insights">
      {items.map(({ label, value, sub, icon: Icon = IconBrain }) => (
        <div key={label} className="admin-ai-insight-card">
          <div className="admin-ai-insight-icon"><Icon /></div>
          <div className="admin-ai-insight-body">
            <span className="admin-ai-insight-label">{label}</span>
            <span className="admin-ai-insight-value">{value}</span>
            {sub && <span className="admin-ai-insight-sub">{sub}</span>}
          </div>
          <AIChip>AI</AIChip>
        </div>
      ))}
    </div>
  );
}

/* ─── Demo / Mock Data ─────────────────────────────────────────────────── */

const VOICE_CALL_LOGS = [
  {
    id: 1,
    caller: { name: 'Priya Sharma', phone: '+91 98765 43210' },
    business: 'Glow Salon — Bandra',
    duration: '4m 32s',
    callTime: 'Today, 10:42 AM',
    sentiment: 'positive',
    intent: 'Book appointment',
    summary: 'Caller wants bridal facial package for next Saturday; slot confirmed for 3 PM.',
    confidence: 94,
  },
  {
    id: 2,
    caller: { name: 'Rahul Mehta', phone: '+91 98200 11876' },
    business: 'SmileCare Dental — Andheri',
    duration: '2m 18s',
    callTime: 'Today, 9:15 AM',
    sentiment: 'neutral',
    intent: 'Pricing inquiry',
    summary: 'Asked about teeth whitening cost; AI shared price range and offered callback from clinic.',
    confidence: 88,
  },
  {
    id: 3,
    caller: { name: 'Ananya Reddy', phone: '+91 99887 66554' },
    business: 'Glow Salon — Bandra',
    duration: '6m 05s',
    callTime: 'Yesterday, 6:48 PM',
    sentiment: 'negative',
    intent: 'Complaint / reschedule',
    summary: 'Unhappy about cancelled slot; AI apologised and rebooked for Tuesday 11 AM with stylist Meera.',
    confidence: 91,
  },
  {
    id: 4,
    caller: { name: 'Vikram Singh', phone: '+91 98112 33445' },
    business: 'FitLife Gym — Powai',
    duration: '1m 52s',
    callTime: 'Yesterday, 4:22 PM',
    sentiment: 'positive',
    intent: 'Membership inquiry',
    summary: 'Interested in annual plan; AI sent WhatsApp brochure and booked trial session for Friday.',
    confidence: 86,
  },
  {
    id: 5,
    caller: { name: 'Sneha Patel', phone: '+91 97654 32109' },
    business: 'SmileCare Dental — Andheri',
    duration: '3m 41s',
    callTime: 'Yesterday, 2:10 PM',
    sentiment: 'positive',
    intent: 'Book appointment',
    summary: 'Root canal follow-up scheduled; patient confirmed insurance details on call.',
    confidence: 96,
  },
  {
    id: 6,
    caller: { name: 'Arjun Nair', phone: '+91 99001 22334' },
    business: 'Glow Salon — Bandra',
    duration: '2m 07s',
    callTime: 'Jun 26, 11:30 AM',
    sentiment: 'neutral',
    intent: 'General inquiry',
    summary: 'Asked about salon timings on Sundays; AI provided hours and parking info.',
    confidence: 79,
  },
  {
    id: 7,
    caller: { name: 'Kavita Desai', phone: '+91 98331 44556' },
    business: 'AyurWell Clinic — Juhu',
    duration: '5m 14s',
    callTime: 'Jun 26, 9:05 AM',
    sentiment: 'positive',
    intent: 'Book appointment',
    summary: 'Panchakarma consultation booked for July 2; dietary form link sent via SMS.',
    confidence: 93,
  },
  {
    id: 8,
    caller: { name: 'Mohit Agarwal', phone: '+91 98198 77665' },
    business: 'FitLife Gym — Powai',
    duration: '0m 48s',
    callTime: 'Jun 25, 7:55 PM',
    sentiment: 'negative',
    intent: 'Wrong number',
    summary: 'Misdial — caller looking for pizza delivery; call ended politely by AI.',
    confidence: 72,
  },
];

const WHATSAPP_CAMPAIGNS = [
  {
    id: 1,
    name: 'Diwali Glow Package — Bandra Salon',
    business: 'Glow Salon',
    messagesSent: 1240,
    readRate: 78,
    replyRate: 34,
    status: 'active',
    aiOptimized: true,
    aiReplyPrediction: 42,
    aiFollowUp: 'Send Hindi reminder 24h before offer expiry — predicted +8% replies',
    aiMessagePreview: 'Hi {{name}}! ✨ Diwali glow package still available at ₹1,999. Book before 5 Nov →',
  },
  {
    id: 2,
    name: 'Dental Check-up Reminder — Andheri',
    business: 'SmileCare Dental',
    messagesSent: 856,
    readRate: 82,
    replyRate: 41,
    status: 'completed',
    aiOptimized: true,
    aiReplyPrediction: 38,
    aiFollowUp: 'Follow up non-responders with "free X-ray" hook on Thursday 6 PM',
    aiMessagePreview: 'Namaste {{name}}, 6-month check-up due at SmileCare. Reply YES to confirm slot.',
  },
  {
    id: 3,
    name: 'Monsoon Fitness Offer — Powai',
    business: 'FitLife Gym',
    messagesSent: 2100,
    readRate: 71,
    replyRate: 28,
    status: 'active',
    aiOptimized: false,
    aiReplyPrediction: 31,
    aiFollowUp: 'AI suggests A/B test: emoji vs no-emoji subject for 15% lift',
    aiMessagePreview: 'Hey {{name}}, monsoon membership @ ₹999/mo — limited slots. Tap to claim 💪',
  },
  {
    id: 4,
    name: 'Panchakarma Wellness Week — Juhu',
    business: 'AyurWell Clinic',
    messagesSent: 432,
    readRate: 89,
    replyRate: 52,
    status: 'completed',
    aiOptimized: true,
    aiReplyPrediction: 55,
    aiFollowUp: 'Upsell post-consultation Ayurveda kit to high-engagement segment',
    aiMessagePreview: '{{name}}, exclusive Panchakarma slots open Jul 1–7. Reply BOOK for callback.',
  },
  {
    id: 5,
    name: 'Birthday Treat — VIP Clients',
    business: 'Glow Salon',
    messagesSent: 186,
    readRate: 94,
    replyRate: 61,
    status: 'scheduled',
    aiOptimized: true,
    aiReplyPrediction: 58,
    aiFollowUp: 'Schedule send at 10 AM IST — AI peak engagement window for this segment',
    aiMessagePreview: 'Happy Birthday {{name}}! 🎂 20% off any service this week. Code: BDAY20',
  },
];

const WHATSAPP_MESSAGE_LOGS = [
  {
    id: 1,
    contact: 'Priya Sharma',
    phone: '+91 98765 43210',
    campaign: 'Diwali Glow Package',
    direction: 'outbound',
    preview: 'Hi Priya! ✨ Diwali glow package still available...',
    status: 'read',
    time: 'Today, 11:02 AM',
    aiSuggested: false,
  },
  {
    id: 2,
    contact: 'Priya Sharma',
    phone: '+91 98765 43210',
    campaign: 'Diwali Glow Package',
    direction: 'inbound',
    preview: 'Yes, book me for Saturday 3 PM please',
    status: 'replied',
    time: 'Today, 11:08 AM',
    aiSuggested: false,
  },
  {
    id: 3,
    contact: 'Rahul Mehta',
    phone: '+91 98200 11876',
    campaign: 'Dental Check-up Reminder',
    direction: 'outbound',
    preview: 'Namaste Rahul, 6-month check-up due at SmileCare...',
    status: 'delivered',
    time: 'Today, 9:30 AM',
    aiSuggested: true,
  },
  {
    id: 4,
    contact: 'Ananya Reddy',
    phone: '+91 99887 66554',
    campaign: 'Diwali Glow Package',
    direction: 'outbound',
    preview: 'Hi Ananya! ✨ Diwali glow package still available...',
    status: 'read',
    time: 'Yesterday, 6:15 PM',
    aiSuggested: true,
  },
  {
    id: 5,
    contact: 'Vikram Singh',
    phone: '+91 98112 33445',
    campaign: 'Monsoon Fitness Offer',
    direction: 'inbound',
    preview: 'Interested — send me trial pass details',
    status: 'replied',
    time: 'Yesterday, 4:45 PM',
    aiSuggested: false,
  },
  {
    id: 6,
    contact: 'Sneha Patel',
    phone: '+91 97654 32109',
    campaign: 'Dental Check-up Reminder',
    direction: 'outbound',
    preview: 'Namaste Sneha, 6-month check-up due at SmileCare...',
    status: 'failed',
    time: 'Yesterday, 2:00 PM',
    aiSuggested: false,
  },
];

function normalizeText(value) {
  return String(value ?? '').toLowerCase();
}

function createCompactSummary(records, label) {
  if (!records.length) return `No matching ${label} found.`;
  const top = records.slice(0, 3).map((item) => item.title || item.name || item.contact).join(', ');
  return `${records.length} matching ${label}: ${top}`;
}

function buildAdminKnowledgeBase() {
  const voice = VOICE_CALL_LOGS.map((log) => ({
    type: 'Voice call',
    title: `${log.caller.name} - ${log.intent}`,
    body: `${log.caller.phone} ${log.business} ${log.sentiment} ${log.summary} ${log.callTime}`,
  }));
  const campaigns = WHATSAPP_CAMPAIGNS.map((campaign) => ({
    type: 'WhatsApp campaign',
    title: campaign.name,
    body: `${campaign.business} ${campaign.status} ${campaign.aiFollowUp} ${campaign.aiMessagePreview} ${campaign.replyRate}% reply`,
  }));
  const messages = WHATSAPP_MESSAGE_LOGS.map((message) => ({
    type: 'WhatsApp message',
    title: `${message.contact} - ${message.campaign}`,
    body: `${message.phone} ${message.direction} ${message.preview} ${message.status} ${message.time}`,
  }));
  return [...voice, ...campaigns, ...messages];
}

function generateAdminAIResponse(query, activeNav = 'dashboard') {
  const q = normalizeText(query);
  const knowledge = buildAdminKnowledgeBase();
  const matches = knowledge.filter((item) => normalizeText(`${item.type} ${item.title} ${item.body}`).includes(q));
  const voiceMatches = VOICE_CALL_LOGS.filter((log) => normalizeText(`${log.caller.name} ${log.caller.phone} ${log.business} ${log.intent} ${log.sentiment} ${log.summary}`).includes(q));
  const whatsappMatches = [...WHATSAPP_CAMPAIGNS, ...WHATSAPP_MESSAGE_LOGS].filter((item) => normalizeText(JSON.stringify(item)).includes(q));

  if (q.includes('summar')) {
    const positiveCalls = VOICE_CALL_LOGS.filter((log) => log.sentiment === 'positive').length;
    const replies = WHATSAPP_MESSAGE_LOGS.filter((message) => message.status === 'replied').length;
    return {
      title: 'AI business summary',
      summary: `Across demo data, the AI handled ${VOICE_CALL_LOGS.length} calls and tracked ${WHATSAPP_CAMPAIGNS.length} WhatsApp campaigns.`,
      bullets: [
        `${positiveCalls} calls are positive and ${VOICE_CALL_LOGS.length - positiveCalls} need neutral or careful follow-up.`,
        `${replies} WhatsApp conversations have replies and can be converted into appointments or callbacks.`,
        'Recommended action: follow up negative calls first, then send WhatsApp reminders to high-intent leads.',
      ],
    };
  }

  if (q.includes('whatsapp') || activeNav === 'whatsapp-marketing') {
    const best = [...WHATSAPP_CAMPAIGNS].sort((a, b) => b.replyRate - a.replyRate)[0];
    return {
      title: 'AI WhatsApp search',
      summary: whatsappMatches.length ? createCompactSummary(whatsappMatches, 'WhatsApp records') : `Best campaign is ${best.name} with ${best.replyRate}% replies.`,
      bullets: [
        `Best next step: ${best.aiFollowUp}`,
        `Suggested template: ${best.aiMessagePreview}`,
        'Use the WhatsApp AI chat box to draft a reply for any customer message.',
      ],
    };
  }

  if (q.includes('call') || q.includes('voice') || activeNav === 'ai-voice-agent') {
    const urgent = VOICE_CALL_LOGS.filter((log) => log.sentiment === 'negative');
    const strongest = [...VOICE_CALL_LOGS].sort((a, b) => b.confidence - a.confidence)[0];
    return {
      title: 'AI voice-agent search',
      summary: voiceMatches.length ? createCompactSummary(voiceMatches.map((log) => ({ title: `${log.caller.name} - ${log.intent}` })), 'voice calls') : `${VOICE_CALL_LOGS.length} voice call logs are available for analysis.`,
      bullets: [
        `${urgent.length} calls need priority follow-up because sentiment is negative.`,
        `Most confident call: ${strongest.caller.name}.`,
        'Open AI Voice Agent to generate customer-ready call scripts.',
      ],
    };
  }

  return {
    title: matches.length ? 'AI search results' : 'AI assistant answer',
    summary: matches.length ? createCompactSummary(matches, 'records') : `I did not find an exact record for "${query}", but I can summarize calls, WhatsApp, campaigns, leads, appointments, and customer follow-ups from this dashboard.`,
    bullets: matches.slice(0, 3).map((item) => `${item.type}: ${item.title}`).concat(matches.length ? [] : [
      'Try: summarize today calls',
      'Try: WhatsApp reply for Priya',
      'Try: negative calls needing follow-up',
    ]),
  };
}

function generateVoiceAgentReply(log, instruction) {
  if (!log) return 'Select a call log first.';
  const need = instruction.trim() || 'call back and resolve the customer request';
  return `Hi ${log.caller.name}, this is Seevora AI calling for ${log.business}. I am following up on your ${log.intent.toLowerCase()} request. I have noted: ${log.summary} Next step: ${need}. Would you like me to confirm this now or arrange a callback from the team?`;
}

function generateWhatsAppReply(target, instruction) {
  const context = target?.preview || target?.aiMessagePreview || target?.name || 'your recent enquiry';
  const goal = instruction.trim() || 'confirm interest and move the customer to booking';
  return `Hi ${target?.contact || '{{name}}'}, thanks for your message. Based on ${context}, I can help with that. ${goal}. Reply YES and I will confirm the next available slot.`;
}

function EmptyTable({ columns }) {
  return (
    <table className="admin-table">
      <thead><tr>{columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
      <tbody>
        <tr>
          <td colSpan={columns.length}>
            <EmptyState title="No records found" description="Data will appear here once your backend is connected." />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   DASHBOARD VIEW
   ────────────────────────────────────────────────────────────────────────── */

function ViewDashboard() {
  return (
    <>
      <div className="admin-greeting-row">
        <div>
          <h1 className="admin-greeting-title">Good Morning, Admin!</h1>
          <p className="admin-greeting-subtitle">Here's what's happening with your business today.</p>
        </div>
        <div className="admin-greeting-controls">
          <button className="admin-dropdown-btn"><IconCalendar /><span>Select date range</span><IconCaretDown /></button>
          <button className="admin-dropdown-btn"><span>All Branches</span><IconCaretDown /></button>
        </div>
      </div>

      <section className="admin-stats-sixgrid" aria-label="Key performance indicators">
        <KpiCard label="Total Calls Handled" colorClass="blue"   Icon={IconAIVoice} />
        <KpiCard label="New Leads"            colorClass="green"  Icon={IconLeads} />
        <KpiCard label="Appointments"         colorClass="purple" Icon={IconAppointments} />
        <KpiCard label="Upcoming Today"       colorClass="orange" Icon={IconClock} />
        <KpiCard label="No-show Rate"         colorClass="pink"   Icon={IconUsers} />
        <KpiCard label="Revenue (This Week)"  colorClass="green"  Icon={IconRupee} />
      </section>

      <section className="admin-middle-grid" aria-label="Dashboard insights row 1">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Appointments Overview</h2>
            <button className="admin-dropdown-btn"><span>This Week</span><IconCaretDown /></button>
          </div>
          <div className="chart-legend" aria-hidden="true">
            <div className="chart-legend-item"><span className="chart-legend-dot booked" /><span>Booked</span></div>
            <div className="chart-legend-item"><span className="chart-legend-dot completed" /><span>Completed</span></div>
            <div className="chart-legend-item"><span className="chart-legend-dot cancelled" /><span>Cancelled</span></div>
            <div className="chart-legend-item"><span className="chart-legend-dot noshow" /><span>No-show</span></div>
          </div>
          <svg className="admin-svg-chart" viewBox="0 0 600 200" aria-label="Appointments chart — awaiting data">
            <line x1="50" y1="40"  x2="550" y2="40"  className="chart-grid-line" />
            <line x1="50" y1="80"  x2="550" y2="80"  className="chart-grid-line" />
            <line x1="50" y1="120" x2="550" y2="120" className="chart-grid-line" />
            <line x1="50" y1="160" x2="550" y2="160" className="chart-grid-line" />
            <line x1="50" y1="180" x2="550" y2="180" stroke="#cbd5e1" strokeWidth="1" />
            <text x="30" y="44"  className="chart-axis-text">100</text>
            <text x="34" y="84"  className="chart-axis-text">80</text>
            <text x="34" y="124" className="chart-axis-text">60</text>
            <text x="34" y="164" className="chart-axis-text">40</text>
            <text x="34" y="184" className="chart-axis-text">20</text>
            <text x="300" y="110" textAnchor="middle" fontSize="11" fill="#94a3b8">No data — connect backend</text>
          </svg>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">AI Agent Activity (Today)</h2>
          </div>
          <EmptyState icon="🤖" title="No call data yet" description="AI voice agent activity will appear here once integrated." />
          <div className="admin-activity-view-all">
            <span className="admin-panel-link">View All Call Logs →</span>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Recent Leads</h2>
            <span className="admin-panel-link">View All</span>
          </div>
          <EmptyState icon="👥" title="No leads yet" description="Incoming leads will appear here once your CRM is connected." />
        </div>
      </section>

      <section className="admin-bottom-grid" aria-label="Dashboard insights row 2">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Revenue Overview</h2>
            <button className="admin-dropdown-btn"><span>This Month</span><IconCaretDown /></button>
          </div>
          <div className="admin-revenue-meta">
            <span className="admin-revenue-value">₹ —</span>
            <span className="admin-revenue-trend" style={{ color: 'var(--text-muted)' }}>No data connected</span>
          </div>
          <svg className="admin-svg-chart" viewBox="0 0 200 110" aria-label="Revenue chart — awaiting data">
            <line x1="10" y1="80" x2="190" y2="80" className="chart-grid-line" />
            <line x1="10" y1="50" x2="190" y2="50" className="chart-grid-line" />
            <text x="100" y="65" textAnchor="middle" fill="#94a3b8" fontSize="10">No data</text>
          </svg>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Top Services by Bookings</h2>
            <button className="admin-dropdown-btn"><span>This Week</span><IconCaretDown /></button>
          </div>
          <EmptyState icon="📋" title="No services data" description="Service booking stats will populate from your backend." />
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Performance Summary</h2>
            <button className="admin-dropdown-btn"><span>This Week</span><IconCaretDown /></button>
          </div>
          <div className="admin-perf-list">
            {[
              { label: 'Lead Conversion Rate', Icon: IconLeads },
              { label: 'Average Response Time', Icon: IconClock },
              { label: 'Appointments / Day',    Icon: IconAppointments },
              { label: 'Customer Satisfaction', Icon: IconReviews },
            ].map(({ label, Icon }) => (
              <div className="admin-perf-row" key={label}>
                <div className="admin-perf-left">
                  <span className="admin-perf-icon-wrapper"><Icon /></span>
                  <span className="admin-perf-label">{label}</span>
                </div>
                <div className="admin-perf-right">
                  <span className="admin-perf-value">—</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Quick Actions</h2>
          </div>
          <div className="admin-quick-actions-2x3">
            <button className="admin-quick-btn"><IconCalendar /><span className="admin-quick-btn-label">Add Appointment</span></button>
            <button className="admin-quick-btn"><IconLeads /><span className="admin-quick-btn-label">Add Lead</span></button>
            <button className="admin-quick-btn"><IconWhatsApp /><span className="admin-quick-btn-label">Send Broadcast</span></button>
            <button className="admin-quick-btn"><IconMegaphone /><span className="admin-quick-btn-label">Create Campaign</span></button>
            <button className="admin-quick-btn"><IconReviews /><span className="admin-quick-btn-label">Add Review Request</span></button>
            <button className="admin-quick-btn"><IconAnalytics /><span className="admin-quick-btn-label">View Reports</span></button>
          </div>
        </div>
      </section>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   SUB-PAGE VIEW COMPONENTS
   ────────────────────────────────────────────────────────────────────────── */

function ViewAIVoiceAgent() {
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [selectedCallId, setSelectedCallId] = useState(VOICE_CALL_LOGS[0]?.id);
  const [voiceInstruction, setVoiceInstruction] = useState('Confirm appointment and handle objections politely');
  const [voiceReply, setVoiceReply] = useState('');

  const businesses = ['all', ...new Set(VOICE_CALL_LOGS.map((log) => log.business))];
  const selectedCall = VOICE_CALL_LOGS.find((log) => log.id === Number(selectedCallId)) ?? VOICE_CALL_LOGS[0];

  const filteredLogs = VOICE_CALL_LOGS.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [log.caller.name, log.caller.phone, log.intent, log.summary, log.business].some((field) => field.toLowerCase().includes(q));
    const matchesSentiment = sentimentFilter === 'all' || log.sentiment === sentimentFilter;
    const matchesBusiness = businessFilter === 'all' || log.business === businessFilter;
    return matchesSearch && matchesSentiment && matchesBusiness;
  });

  const todayCount = VOICE_CALL_LOGS.filter((l) => l.callTime.startsWith('Today')).length;
  const intentCounts = VOICE_CALL_LOGS.reduce((acc, log) => {
    acc[log.intent] = (acc[log.intent] || 0) + 1;
    return acc;
  }, {});
  const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
  const positiveCount = VOICE_CALL_LOGS.filter((l) => l.sentiment === 'positive').length;
  const avgSentimentLabel = positiveCount >= VOICE_CALL_LOGS.length / 2 ? 'Positive' : positiveCount > 0 ? 'Mixed' : 'Neutral';

  return (
    <div className="admin-panel">
      <SectionHeader title="AI Voice Agent Logs" subtitle="Live logs and recordings of calls handled by the AI voice receptionist, enriched with sentiment, intent, and summaries." />

      <AIInsightsStrip
        items={[
          { label: 'Calls handled today', value: String(todayCount || VOICE_CALL_LOGS.length), sub: `${VOICE_CALL_LOGS.length} total in demo period` },
          { label: 'Most common intent', value: topIntent, sub: 'Across all logged calls' },
          { label: 'Avg sentiment', value: avgSentimentLabel, sub: `${Math.round((positiveCount / VOICE_CALL_LOGS.length) * 100)}% positive calls` },
        ]}
      />

      <div className="admin-ai-action-panel">
        <div className="admin-ai-action-copy">
          <AIChip>Voice AI</AIChip>
          <h3>Communicate from call logs</h3>
          <p>Select a call, ask the AI what to do, then generate a call script or summary.</p>
        </div>
        <div className="admin-ai-action-form">
          <select value={selectedCallId} onChange={(e) => setSelectedCallId(e.target.value)} aria-label="Select call log">
            {VOICE_CALL_LOGS.map((log) => (
              <option key={log.id} value={log.id}>{log.caller.name} - {log.intent}</option>
            ))}
          </select>
          <textarea value={voiceInstruction} onChange={(e) => setVoiceInstruction(e.target.value)} aria-label="Voice agent instruction" />
          <div className="admin-ai-action-buttons">
            <button type="button" onClick={() => setVoiceReply(generateVoiceAgentReply(selectedCall, voiceInstruction))}>Generate Call Script</button>
            <button type="button" onClick={() => setVoiceReply(`Summary: ${selectedCall.summary} Suggested follow-up: ${selectedCall.sentiment === 'negative' ? 'Escalate to human staff today.' : 'Send confirmation on WhatsApp.'}`)}>Summarize Call</button>
          </div>
          {voiceReply && <div className="admin-ai-output">{voiceReply}</div>}
        </div>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filterValues={{ sentiment: sentimentFilter, business: businessFilter }}
        onFilterChange={(key, value) => {
          if (key === 'sentiment') setSentimentFilter(value);
          if (key === 'business') setBusinessFilter(value);
        }}
        filters={[
          { key: 'sentiment', label: 'Sentiment', options: [
            { value: 'all', label: 'All Sentiments' },
            { value: 'positive', label: 'Positive' },
            { value: 'neutral', label: 'Neutral' },
            { value: 'negative', label: 'Negative' },
          ] },
          { key: 'business', label: 'Business', options: businesses.map((b) => ({ value: b, label: b === 'all' ? 'All Businesses' : b })) },
        ]}
      />

      <div className="admin-table-scroll">
        <table className="admin-table admin-table--ai">
          <thead>
            <tr>
              <th>Caller</th>
              <th>Duration</th>
              <th><span className="admin-th-ai"><IconSparkle /> AI Sentiment</span></th>
              <th><span className="admin-th-ai"><IconSparkle /> AI Intent</span></th>
              <th><span className="admin-th-ai"><IconSparkle /> AI Summary</span></th>
              <th>Confidence</th>
              <th>Call Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No matching calls" description="Try adjusting your search or filters." /></td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="admin-table-name">{log.caller.name}</div>
                    <div className="admin-table-sub">{log.caller.phone}</div>
                    <div className="admin-table-sub">{log.business}</div>
                  </td>
                  <td>{log.duration}</td>
                  <td><SentimentBadge sentiment={log.sentiment} /></td>
                  <td><span className="admin-intent-tag">{log.intent}</span></td>
                  <td><p className="admin-ai-summary">{log.summary}</p></td>
                  <td><ConfidenceScore value={log.confidence} /></td>
                  <td>{log.callTime}</td>
                  <td><button type="button" className="admin-table-action" onClick={() => { setSelectedCallId(log.id); setVoiceReply(`Summary: ${log.summary}`); }}>Summarize</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="admin-demo-note"><IconSparkle /> Demo data - connect your telephony backend to sync live call logs.</p>
    </div>
  );
}

function ViewAppointments() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Appointments Scheduler" subtitle="Overview and schedule of customer reservations." action="+ New Appointment" />
      <FilterBar filters={['All Status', 'All Businesses', 'All Professionals']} />
      <EmptyTable columns={['Client', 'Service Type', 'Assigned Professional', 'Scheduled Time', 'Status', 'Actions']} />
    </div>
  );
}
function ViewLeads() {
  return (
    <div className="admin-panel">
      <SectionHeader title="CRM Leads Pipeline" subtitle="Manage prospective leads scored by AI intent metrics." action="+ Add Lead" />
      <FilterBar filters={['All Scores', 'All Sources', 'All Businesses']} />
      <EmptyTable columns={['Lead', 'Value', 'Source', 'Score', 'Follow Up', 'Actions']} />
    </div>
  );
}

function ViewCustomers() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Customer Directory" subtitle="All unique customer profiles registered across platforms." action="+ Add Customer" />
      <FilterBar filters={['All Status', 'All Businesses']} />
      <EmptyTable columns={['Customer', 'Contact Details', 'Bookings Count', 'Total Revenue', 'Status', 'Actions']} />
    </div>
  );
}

function ViewWhatsAppMarketing() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedWhatsAppId, setSelectedWhatsAppId] = useState(WHATSAPP_MESSAGE_LOGS[1]?.id);
  const [chatInstruction, setChatInstruction] = useState('Convert this reply into a booked appointment');
  const [chatReply, setChatReply] = useState('');

  const filteredCampaigns = WHATSAPP_CAMPAIGNS.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [c.name, c.business, c.aiFollowUp, c.aiMessagePreview].some(
      (field) => field.toLowerCase().includes(q),
    );
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMessages = WHATSAPP_MESSAGE_LOGS.filter((m) => {
    const q = search.toLowerCase();
    return !q || [m.contact, m.phone, m.campaign, m.preview].some(
      (field) => field.toLowerCase().includes(q),
    );
  });

  const bestTemplate = [...WHATSAPP_CAMPAIGNS].sort((a, b) => b.replyRate - a.replyRate)[0];
  const totalSent = WHATSAPP_CAMPAIGNS.reduce((sum, c) => sum + c.messagesSent, 0);
  const selectedWhatsApp = WHATSAPP_MESSAGE_LOGS.find((message) => message.id === Number(selectedWhatsAppId)) ?? WHATSAPP_MESSAGE_LOGS[0];

  return (
    <>
      <div className="admin-panel">
        <SectionHeader
          title="WhatsApp Marketing & Campaign Logs"
          subtitle="Campaign automation, message logs, and AI-powered reply optimisation for Indian SMB outreach."
          action="+ Create Campaign"
        />

        <AIInsightsStrip
          items={[
            {
              label: 'Best performing template',
              value: bestTemplate?.name.split('—')[0].trim() ?? '—',
              sub: `${bestTemplate?.replyRate ?? 0}% reply rate · ${bestTemplate?.business ?? ''}`,
            },
            {
              label: 'Recommended send time',
              value: 'Thu 6–8 PM IST',
              sub: 'Peak reply window for clinic reminders',
            },
            {
              label: 'Audience segment',
              value: 'VIP + lapsed 90d',
              sub: `${totalSent.toLocaleString('en-IN')} msgs sent this month`,
            },
          ]}
        />


        <div className="admin-ai-action-panel admin-ai-action-panel--whatsapp">
          <div className="admin-ai-action-copy">
            <AIChip>WhatsApp AI</AIChip>
            <h3>Chat and draft replies</h3>
            <p>Pick a customer message and let AI create a response, summary, or follow-up instruction.</p>
          </div>
          <div className="admin-ai-action-form">
            <select value={selectedWhatsAppId} onChange={(e) => setSelectedWhatsAppId(e.target.value)} aria-label="Select WhatsApp message">
              {WHATSAPP_MESSAGE_LOGS.map((message) => (
                <option key={message.id} value={message.id}>{message.contact} - {message.campaign}</option>
              ))}
            </select>
            <textarea value={chatInstruction} onChange={(e) => setChatInstruction(e.target.value)} aria-label="WhatsApp AI instruction" />
            <div className="admin-ai-action-buttons">
              <button type="button" onClick={() => setChatReply(generateWhatsAppReply(selectedWhatsApp, chatInstruction))}>Draft Reply</button>
              <button type="button" onClick={() => setChatReply(`Summary: ${selectedWhatsApp.contact} ${selectedWhatsApp.direction === 'inbound' ? 'replied with' : 'was sent'} "${selectedWhatsApp.preview}". Status: ${selectedWhatsApp.status}.`)}>Summarize Chat</button>
            </div>
            {chatReply && <div className="admin-ai-output">{chatReply}</div>}
          </div>
        </div>
        <div className="admin-tab-row" role="tablist" aria-label="WhatsApp log views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'campaigns'}
            className={`admin-tab-btn${activeTab === 'campaigns' ? ' active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            Campaign Logs
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'messages'}
            className={`admin-tab-btn${activeTab === 'messages' ? ' active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Message Logs
          </button>
        </div>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filterValues={{ status: statusFilter }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
          }}
          filters={activeTab === 'campaigns' ? [{
            key: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'scheduled', label: 'Scheduled' },
            ],
          }] : []}
        />

        {activeTab === 'campaigns' ? (
          <div className="admin-table-scroll">
            <table className="admin-table admin-table--ai">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Sent</th>
                  <th>Read Rate</th>
                  <th>Reply Rate</th>
                  <th>Status</th>
                  <th><span className="admin-th-ai"><IconSparkle /> AI Prediction</span></th>
                  <th><span className="admin-th-ai"><IconSparkle /> AI Follow-up</span></th>
                  <th><span className="admin-th-ai"><IconSparkle /> Message Preview</span></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState title="No campaigns found" description="Try adjusting your search or filters." />
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="admin-table-name">{c.name}</div>
                        <div className="admin-table-sub">{c.business}</div>
                        {c.aiOptimized && <AIChip variant="success">AI Optimized</AIChip>}
                      </td>
                      <td>{c.messagesSent.toLocaleString('en-IN')}</td>
                      <td>
                        <div className="admin-rate-cell">
                          <span>{c.readRate}%</span>
                          <div className="admin-biz-progress-track">
                            <div className="admin-biz-progress-fill" style={{ width: `${c.readRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-rate-cell">
                          <span>{c.replyRate}%</span>
                          <div className="admin-biz-progress-track">
                            <div className="admin-biz-progress-fill admin-biz-progress-fill--green" style={{ width: `${c.replyRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${c.status}`}>{c.status}</span>
                      </td>
                      <td>
                        <span className="admin-ai-prediction">
                          <IconBrain />
                          {c.aiReplyPrediction}% reply
                        </span>
                      </td>
                      <td>
                        <p className="admin-ai-summary admin-ai-summary--compact">{c.aiFollowUp}</p>
                      </td>
                      <td>
                        <p className="admin-ai-preview">{c.aiMessagePreview}</p>
                      </td>
                      <td>
                        <button type="button" className="admin-table-action">View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table admin-table--ai">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Campaign</th>
                  <th>Direction</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title="No messages found" description="Try adjusting your search." />
                    </td>
                  </tr>
                ) : (
                  filteredMessages.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="admin-table-name">{m.contact}</div>
                        <div className="admin-table-sub">{m.phone}</div>
                      </td>
                      <td>{m.campaign}</td>
                      <td>
                        <span className={`admin-direction-badge admin-direction-badge--${m.direction}`}>
                          {m.direction}
                        </span>
                      </td>
                      <td>
                        <p className="admin-ai-preview">{m.preview}</p>
                        {m.aiSuggested && <AIChip variant="purple">AI Suggested</AIChip>}
                      </td>
                      <td>
                        <span className={`admin-msg-status admin-msg-status--${m.status}`}>{m.status}</span>
                      </td>
                      <td>{m.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="admin-demo-note">
          <IconSparkle /> Demo data — connect WhatsApp Business API for live campaign sync.
        </p>
      </div>
    </>
  );
}

function ViewReputation() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Online Reputation" subtitle="Review aggregator tracking Google Reviews and customer feedback." />
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {['Average Rating', 'Total Reviews', 'Replied'].map(label => (
          <div key={label} style={{ flex: 1, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-color-darker)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>—</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>
      <EmptyState icon="⭐" title="No reviews fetched yet" description="Google Reviews data will appear here once your reputation integration is set up." />
    </div>
  );
}

function ViewWebsiteSEO() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Website & SEO Health" subtitle="Audits and metrics tracking organic search performance." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {['Desktop SEO Score', 'Core Web Vitals', 'Monthly Search Hits'].map(label => (
          <div key={label} style={{ padding: 16, background: '#f8fafc', border: '1px solid var(--border-color-darker)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>—</div>
            <strong style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</strong>
          </div>
        ))}
      </div>
      <EmptyTable columns={['Primary Keywords', 'Search Volume', 'Average Position', 'Estimated Traffic']} />
    </div>
  );
}

function ViewAnalytics() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Analytics Center" subtitle="Deep data analytics for digital operations and metrics." />
      <EmptyState icon="📊" title="Analytics unavailable" description="Charts and conversion funnels will render once your analytics backend is integrated." />
    </div>
  );
}

function ViewBilling() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Billing & Plans" subtitle="Subscription levels, payment structures, invoices, and limits." />
      <div style={{ border: '1px solid var(--border-color-darker)', borderRadius: 8, padding: 20, background: '#f8fafc', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Current Plan</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Plan details will load from your billing backend.</p>
          </div>
          <span style={{ background: 'rgba(148,163,184,0.1)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: 100, fontWeight: 600, fontSize: '0.8rem' }}>Pending</span>
        </div>
        <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color-darker)', margin: '16px 0' }} />
        <div style={{ display: 'flex', gap: 30 }}>
          {['Billing Cycle', 'Next Invoice', 'Payment Method'].map(label => (
            <div key={label}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 2 }}>—</div>
            </div>
          ))}
        </div>
      </div>
      <EmptyTable columns={['Invoice Date', 'Amount Paid', 'Payment Status', 'Download']} />
    </div>
  );
}

function ViewSettings() {
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
            {inp('Currency','INR','text','INR � Indian Rupee')}
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
          <ToggleRow label="New Business Registration" desc="Send email when a new business registers" defaultOn={true} />
          <ToggleRow label="Business Approved / Rejected" desc="Notify admin on approval decision" defaultOn={true} />
          <ToggleRow label="Failed Payment Alert" desc="Alert on payment failure or decline" defaultOn={true} />
          <ToggleRow label="Weekly Platform Summary" desc="Every Monday morning digest email" defaultOn={true} />
          <ToggleRow label="New Support Ticket" desc="Notify when a new support ticket is raised" defaultOn={false} />
          {sectionTitle('WhatsApp Alerts')}
          <ToggleRow label="Critical Security Alerts" desc="Login from new device / failed attempts" defaultOn={true} />
          <ToggleRow label="Module Down Alert" desc="Notify when any AI module goes offline" defaultOn={true} />
          <ToggleRow label="SLA Breach Warning" desc="Alert before support ticket SLA expires" defaultOn={false} />
          <ToggleRow label="New Business Onboarded" desc="WhatsApp notification on live go-live" defaultOn={false} />
          {sectionTitle('In-App Notifications')}
          <ToggleRow label="Audit Log Highlights" desc="Show critical events in notification bell" defaultOn={true} />
          <ToggleRow label="Pending Approvals Reminder" desc="Remind admin of pending business approvals" defaultOn={true} />
          {saveBtn()}
        </div>
      )}
      {/* -- SECURITY -- */}
      {tab==='security' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,maxWidth:900}}>
          <div>
            {sectionTitle('Authentication')}
            <ToggleRow label="Enforce MFA for Super Admin" desc="Required on every login � cannot be disabled" defaultOn={true} />
            <ToggleRow label="Enforce MFA for Business Owners" desc="OTP on every login for business admins" defaultOn={true} />
            <ToggleRow label="MFA Optional for Staff" desc="Let business owners decide for staff" defaultOn={false} />
            <ToggleRow label="Remember Device (30 days)" desc="Skip OTP on trusted devices" defaultOn={true} />
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
            <ToggleRow label="IP Whitelist Mode" desc="Restrict admin login to specific IPs only" defaultOn={false} />
            {inp('Whitelisted IPs','Comma-separated IPs','')}
            {sectionTitle('Password Policy')}
            <ToggleRow label="Require Uppercase Letter" desc="Min 1 uppercase in password" defaultOn={true} />
            <ToggleRow label="Require Number" desc="Min 1 number in password" defaultOn={true} />
            <ToggleRow label="Require Special Character" desc="Min 1 special char e.g. @#$" defaultOn={false} />
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
            <ToggleRow label="Show Seevora Branding to Clients" desc="Display Powered by Seevora footer" defaultOn={true} />
            <ToggleRow label="White-Label Mode" desc="Remove all Seevora references for enterprise clients" defaultOn={false} />
            {inp('White-Label Brand Name','Your brand name','')}
          </div>
          <div>
            {sectionTitle('Email Templates')}
            {inp('Email Header Color','#0a0a0a','text','#0a0a0a')}
            {inp('Email Footer Text','e.g. � 2026 Seevora','text','� 2026 Seevora Private Limited')}
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
          <ToggleRow label="Auto-generate GST Invoices" desc="Create invoice PDF on every payment" defaultOn={true} />
          <ToggleRow label="Send Invoice to Client Email" desc="Email invoice automatically on payment" defaultOn={true} />
          <ToggleRow label="Send Payment Reminder" desc="WhatsApp reminder 3 days before renewal" defaultOn={true} />
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
          <ToggleRow label="DPDPA 2023 Compliance Mode" desc="Enforce data minimisation & consent logging" defaultOn={true} />
          <ToggleRow label="Consent Required on Registration" desc="Block signup without explicit consent checkboxes" defaultOn={true} />
          <ToggleRow label="Allow Data Export by Business Owner" desc="Let owners download their tenant data" defaultOn={true} />
          <ToggleRow label="Auto-delete on Subscription End" desc="Purge tenant data after retention period" defaultOn={false} />
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
            {label:'Production API Key',value:'sk_live_seevora_������������4a9f',color:'var(--accent-green)'},
            {label:'Staging API Key',value:'sk_test_seevora_������������8b2c',color:'var(--accent-orange)'},
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
}
function ToggleSwitch({defaultOn=false}) {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <button onClick={()=>setOn(!on)} style={{flexShrink:0,width:44,height:24,borderRadius:100,border:'none',cursor:'pointer',background:on?'var(--accent-cyan)':'#d1d5db',position:'relative',transition:'background 0.2s',marginLeft:16,marginTop:2}}>
      <span style={{position:'absolute',top:3,left:on?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}/>
    </button>
  );
}
function ViewUsers() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Users & Roles" subtitle="Invite and manage authorization roles across staff members." action="+ Invite User" />
      <FilterBar filters={['All Roles', 'All Status', 'All Businesses']} />
      <EmptyTable columns={['User', 'Role', 'Business / Tenant', 'Status', 'Last Login', 'Actions']} />
    </div>
  );
}

function ViewIntegrations() {
  const integrations = [
    { name: 'WhatsApp Business API',     desc: 'Broadcast automated reminder templates directly to client chats.' },
    { name: 'Google Reviews API',        desc: 'Compile customer reviews from Google Maps in real-time.' },
    { name: 'Google Calendar Sync',      desc: 'Sync booked appointments with professional calendar sheets.' },
    { name: 'Stripe / Razorpay Billing', desc: 'Secure payment invoice links on reservation portals.' },
  ];
  return (
    <div className="admin-panel">
      <SectionHeader title="Third-Party Integrations" subtitle="Connect external scheduling, CRM, messaging, and payment APIs." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {integrations.map(item => (
          <div key={item.name} style={{ border: '1px solid var(--border-color-darker)', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.name}</strong>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
            <button style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 100, fontSize: '0.74rem', fontWeight: 600, border: '1px solid var(--border-color-darker)', cursor: 'pointer', background: '#f8fafc', color: 'var(--text-secondary)' }}>
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewSupport() {
  return (
    <div className="admin-panel">
      <SectionHeader title="Support Desk" subtitle="Customer queries, feedback issues, and ticket assignments." action="+ New Ticket" />
      <FilterBar filters={['All Priority', 'All Status', 'All Businesses']} />
      <EmptyTable columns={['Ticket ID', 'Title / Summary', 'Business', 'Priority', 'Status', 'Actions']} />
    </div>
  );
}
