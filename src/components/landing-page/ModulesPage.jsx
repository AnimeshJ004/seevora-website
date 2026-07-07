import React, { useEffect } from 'react';

/* ── Per-module SVG icons ── */
const ModuleIcons = {
  'ai-receptionist': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.21 6.21l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      <path d="M14.05 3a9 9 0 0 1 5.95 5.95"/>
      <path d="M14.05 7A5 5 0 0 1 17 9.95"/>
    </svg>
  ),
  'auto-scheduler': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  ),
  'lead-intake': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'digital-presence': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  'reputation-builder': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  'analytics-reporting': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
};

/* ── Per-module accent colors ── */
const MODULE_COLORS = {
  cyan:   { border: '#6F7F33', glow: 'rgba(111,127,51,0.10)', pill: 'rgba(111,127,51,0.08)', pillText: '#4a5a1a' },
  purple: { border: '#6F7F33', glow: 'rgba(111,127,51,0.10)', pill: 'rgba(111,127,51,0.08)', pillText: '#4a5a1a' },
  green:  { border: '#6F7F33', glow: 'rgba(111,127,51,0.10)', pill: 'rgba(111,127,51,0.08)', pillText: '#4a5a1a' },
  blue:   { border: '#6F7F33', glow: 'rgba(111,127,51,0.10)', pill: 'rgba(111,127,51,0.08)', pillText: '#4a5a1a' },
  orange: { border: '#6F7F33', glow: 'rgba(111,127,51,0.10)', pill: 'rgba(111,127,51,0.08)', pillText: '#4a5a1a' },
  pink:   { border: '#6F7F33', glow: 'rgba(111,127,51,0.10)', pill: 'rgba(111,127,51,0.08)', pillText: '#4a5a1a' },
};

const modules = [
  {
    hash: 'ai-receptionist',
    tag: 'AI',
    color: 'cyan',
    title: 'AI Voice Reception',
    desc: 'Our AI answers every inbound call 24/7 — in Hindi, English, and regional languages. Every enquiry is captured, logged, and routed correctly without any human involvement.',
    features: ['24/7 answering', 'Hindi/English/regional', 'Auto lead creation', 'Missed-call recovery'],
    specs: { latency: '< 1.2s', channels: 'Voice / Dial-In', setup: '5 Days' },
    img: '/ai rec.jpg',
    imgAlt: 'AI voice reception call center agents with headsets',
  },
  {
    hash: 'auto-scheduler',
    tag: 'CAL',
    color: 'purple',
    title: 'Appointment Management',
    desc: 'Manages availability, confirms appointments automatically, sends reminders 2 hours before, predicts no-show risk, and fills cancelled slots from a live waitlist.',
    features: ['Auto-confirmations', '24h/2h reminders', 'No-show prediction', 'Waitlist fill'],
    specs: { latency: 'Real-time', channels: 'SMS / WhatsApp', setup: '5 Days' },
    img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=900&q=85&fit=crop&crop=center',
    imgAlt: 'Calendar planning and scheduling',
  },
  {
    hash: 'lead-intake',
    tag: 'CRM',
    color: 'green',
    title: 'Lead & Client Management',
    desc: 'Every enquiry — by call, WhatsApp, or web form — enters a structured CRM pipeline. Leads are scored Hot/Warm/Cold. Follow-up sequences run automatically for 7 days.',
    features: ['Multi-source capture', 'Hot/Warm/Cold scoring', '7-day follow-up', 'Daily hot-lead list'],
    specs: { latency: 'Instant', channels: 'WhatsApp / Web', setup: '5 Days' },
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=85&fit=crop&crop=center',
    imgAlt: 'Business team discussing CRM pipeline',
  },
  {
    hash: 'digital-presence',
    tag: 'WEB',
    color: 'blue',
    title: 'Digital Presence & SEO',
    desc: 'A professionally designed website live on your domain within 5 days. Paired with local SEO so your business ranks on Google for searches in your city and sector.',
    features: ['Custom website', 'Local SEO', 'Google Business Profile', 'Monthly AI content'],
    specs: { latency: 'Uptime 99%', channels: 'Custom Domain', setup: '5 Days' },
    img: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=900&q=85&fit=crop&crop=center',
    imgAlt: 'Web design and SEO on multiple devices',
  },
  {
    hash: 'reputation-builder',
    tag: 'REP',
    color: 'orange',
    title: 'Reputation Management',
    desc: 'Automated review requests after every visit. AI-drafted responses to Google reviews. Review score tracking and alerts. Consistent reputation building that converts new clients.',
    features: ['Post-visit requests', 'AI review replies', 'Score tracking', 'Negative-review alerts'],
    specs: { latency: '< 5 mins', channels: 'Google Maps / SMS', setup: '5 Days' },
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=85&fit=crop&crop=center',
    imgAlt: 'Customer satisfaction and positive reviews',
  },
  {
    hash: 'analytics-reporting',
    tag: 'DATA',
    color: 'pink',
    title: 'Analytics & Reporting',
    desc: 'Real-time dashboard showing calls handled, appointments booked, revenue trends, no-show rates, peak hours, and lead conversion. Weekly AI reports every Monday.',
    features: ['Real-time dashboard', 'Revenue trends', 'Peak hour analysis', 'Weekly owner reports'],
    specs: { latency: 'Instant', channels: 'Owner Dashboard', setup: '5 Days' },
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=85&fit=crop&crop=center',
    imgAlt: 'Business analytics and data dashboard',
  },
];

export default function ModulesPage() {
  const handleBookCall = (e) => {
    e.preventDefault();
    window.location.assign('/book-a-call');
  };

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const rows = document.querySelectorAll('.mod-row');
    if (!rows.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('mod-row--visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    rows.forEach((r) => obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="modules-page">
      <div className="container">

        {/* Header */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 className="section-title">
            Six AI Modules. <span className="gradient-text">One Connected Platform.</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '640px' }}>
            Each module is built to automate manual bottlenecks, fully integrated to run your operations autonomously.
          </p>
        </div>

        {/* ── Module rows ── */}
        <div className="mod-list">
          {modules.map((m, idx) => {
            const isReversed = idx % 2 !== 0;
            return (
              <div
                key={m.hash}
                id={m.hash}
                className={`mod-row${isReversed ? ' mod-row--reversed' : ''}`}
              >
                {/* ── CIRCLE IMAGE ── */}
                <div className="mod-circle-wrap">
                  {/* decorative ring */}
                  <div className="mod-ring" />
                  <div className="mod-ring mod-ring--2" />
                  <div className="mod-circle">
                    <img
                      src={m.img}
                      alt={m.imgAlt}
                      className="mod-circle-img"
                      loading="lazy"
                      draggable="false"
                    />
                  </div>
                  {/* floating number badge */}
                  <span className="mod-circle-num">{String(idx + 1).padStart(2, '0')}</span>
                  {/* floating tag */}
                  <span className="mod-circle-tag">{m.tag}</span>
                </div>

                {/* ── CONTENT ── */}
                <div className="mod-content">
                  <div className="mod-content-icon">
                    {ModuleIcons[m.hash]}
                  </div>
                  <h2 className="mod-content-title">{m.title}</h2>
                  <p className="mod-content-desc">{m.desc}</p>

                  {/* features */}
                  <ul className="mod-content-features">
                    {m.features.map((f) => (
                      <li key={f}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6F7F33" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* specs */}
                  <div className="mod-content-specs">
                    {[
                      { label: 'Response', value: m.specs.latency },
                      { label: 'Channels', value: m.specs.channels },
                      { label: 'Launch',   value: m.specs.setup },
                    ].map((s) => (
                      <div key={s.label} className="mod-spec-item">
                        <span className="mod-spec-item__label">{s.label}</span>
                        <strong className="mod-spec-item__value">{s.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="services-outro-cta" data-animate style={{ marginTop: '100px' }}>
          <h4>Ready to deploy Seevora AI Modules?</h4>
          <p>We configure, customize, and launch all modules custom-trained on your workflow in 5 business days.</p>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <a href="#" className="btn-primary" onClick={handleBookCall}>
              Request a Custom AI Audit
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

