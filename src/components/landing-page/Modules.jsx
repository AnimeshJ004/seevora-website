import React, { useState } from 'react';

const modules = [
  {
    tag: 'AI',
    color: 'cyan',
    title: 'AI Voice Reception',
    desc: 'Our AI answers every inbound call 24/7 — in Hindi, English, and regional languages. Every enquiry is captured, logged, and routed correctly without any human involvement.',
    features: ['24/7 answering', 'Hindi/English/regional', 'Auto lead creation', 'Missed-call recovery'],
  },
  {
    tag: 'CAL',
    color: 'purple',
    title: 'Appointment Management',
    desc: 'Manages availability, confirms appointments automatically, sends reminders 2 hours before, predicts no-show risk, and fills cancelled slots from a live waitlist.',
    features: ['Auto-confirmations', '24h/2h reminders', 'No-show prediction', 'Waitlist fill'],
  },
  {
    tag: 'CRM',
    color: 'green',
    title: 'Lead & Client Management',
    desc: 'Every enquiry — by call, WhatsApp, or web form — enters a structured CRM pipeline. Leads are scored Hot/Warm/Cold. Follow-up sequences run automatically for 7 days.',
    features: ['Multi-source capture', 'Hot/Warm/Cold scoring', '7-day follow-up', 'Daily hot-lead list'],
  },
  {
    tag: 'WEB',
    color: 'blue',
    title: 'Digital Presence & SEO',
    desc: 'A professionally designed website live on your domain within 5 days. Paired with local SEO so your business ranks on Google for searches in your city and sector.',
    features: ['Custom website', 'Local SEO', 'Google Business Profile', 'Monthly AI content'],
  },
  {
    tag: 'REP',
    color: 'orange',
    title: 'Reputation Management',
    desc: 'Automated review requests after every visit. AI-drafted responses to Google reviews. Review score tracking and alerts. Consistent reputation building that converts new clients.',
    features: ['Post-visit requests', 'AI review replies', 'Score tracking', 'Negative-review alerts'],
  },
  {
    tag: 'DATA',
    color: 'pink',
    title: 'Analytics & Reporting',
    desc: 'Real-time dashboard showing calls handled, appointments booked, revenue trends, no-show rates, peak hours, and lead conversion. Weekly AI reports every Monday.',
    features: ['Real-time dashboard', 'Revenue trends', 'Peak hour analysis', 'Weekly owner reports'],
  },
];

export default function Modules() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeModule = modules[activeIndex];

  return (
    <section className="modules section" id="modules">
      <div className="bg-glow bg-glow-2" style={{ bottom: '-200px', right: '-100px' }} />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="section-label" style={{ margin: '0 auto 66px' }}>
            <span className="dot" />Six Core Modules
          </div>
          <h2 className="section-title" style={{ marginBottom: '18px' }}>
            Six AI Modules. <span className="gradient-text">One Platform.</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Each module is powerful alone. Together they replace your entire manual operations stack.
          </p>
        </div>

        <div className="modules-showcase">
          <div className="module-title-rail" role="tablist" aria-label="SeeVora modules">
            {modules.map((m, i) => (
              <button
                key={m.title}
                type="button"
                className={`module-title-tab module-title-tab--${m.color}${activeIndex === i ? ' active' : ''}`}
                onClick={() => setActiveIndex(i)}
                role="tab"
                aria-selected={activeIndex === i}
                aria-controls="module-detail-card"
              >
                <span className={`module-tab-dot module-tab-dot--${m.color}`} />
                <span>
                  <span className="module-tab-tag">{m.tag}</span>
                  <span className="module-tab-title">{m.title}</span>
                </span>
              </button>
            ))}
          </div>

          <div
            id="module-detail-card"
            key={activeModule.title}
            className={`module-detail-card module-detail-card--${activeModule.color}`}
            role="tabpanel"
          >
            <div className="module-detail-top">
              <span className={`module-tag module-tag--${activeModule.color}`}>{activeModule.tag}</span>
              <span className="module-detail-count">
                {String(activeIndex + 1).padStart(2, '0')} / {String(modules.length).padStart(2, '0')}
              </span>
            </div>
            <h3>{activeModule.title}</h3>
            <p>{activeModule.desc}</p>
            <div className="module-detail-divider" />
            <ul className="module-features module-detail-features">
              {activeModule.features.map((f) => (
                <li key={f}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
