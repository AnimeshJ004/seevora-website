import React, { useState } from 'react';

const solutions = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    color: 'cyan',
    title: 'Automate Workflows',
    desc: 'Replace repetitive manual steps with intelligent automation that learns and adapts across document processing, data entry, and decision routing.',
    bullets: [
      'Eliminate 90%+ of manual data entry tasks',
      'Context-aware routing for student admissions & patient queries',
      'Intelligent PDF and document parsing engines'
    ],
    metric: '90%',
    metricLabel: 'Friction Reduced',
    status: 'Automating'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    color: 'purple',
    title: 'Reduce Dependency',
    desc: 'Encode expertise into AI models that work 24/7, eliminating tribal knowledge silos and reducing single points of operational failure.',
    bullets: [
      'Encode specific business rules directly into conversational models',
      'Ensure 100% policy compliance in Hindi, English, & Hinglish',
      'Zero downtime — AI works 24/7/365 to handle client queries'
    ],
    metric: '24/7',
    metricLabel: 'AI Availability',
    status: 'Operational'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    color: 'green',
    title: 'Speed & Accuracy',
    desc: 'AI processes run in seconds, not hours. Our solutions achieve 99%+ accuracy on structured tasks, catching errors humans miss.',
    bullets: [
      'Responses delivered in milliseconds via WhatsApp and voice',
      'Automated error validation before storing in CA, salon, or clinic CRMs',
      'Guaranteed 99% accuracy on bookings and reminders'
    ],
    metric: '99%+',
    metricLabel: 'Data Accuracy',
    status: 'Optimized'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    color: 'blue',
    title: 'Seamless Integration',
    desc: 'Plug directly into your existing CRMs, ERPs, and databases. No rip-and-replace — just smart augmentation of what you already have.',
    bullets: [
      'Pre-built integrations for WhatsApp Business, Google Sheets, & local CRMs',
      'Requires zero changes to your existing accounting or clinic software',
      'Real-time automated sync across all endpoints'
    ],
    metric: '< 2s',
    metricLabel: 'Sync Latency',
    status: 'Connected'
  },
];

export default function Solutions() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = solutions[activeIdx];

  return (
    <section className="solutions section" id="solutions">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label" style={{ margin: '0 auto 10px' }}><span className="dot" />What We Deliver</div>
          <h2 className="section-title">Practical AI. <span className="gradient-text">Real Results.</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            We don't sell hype. We build targeted AI systems that transform specific business processes into measurable profit drivers.
          </p>
        </div>

        <div className="solutions-showcase" data-animate="scale-in">
          {/* Left Side: Navigation Tabs */}
          <div className="showcase-nav">
            {solutions.map((s, idx) => (
              <button
                key={idx}
                className={`showcase-tab ${s.color}${activeIdx === idx ? ' active' : ''}`}
                onClick={() => setActiveIdx(idx)}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                <span className={`tab-icon ${s.color}`}>{s.icon}</span>
                <span className="tab-title">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Right Side: Showcase Display */}
          <div className={`showcase-display ${active.color}`}>
            <div className="display-content">
              <div className="display-header">
                <span className={`display-icon-badge ${active.color}`}>{active.icon}</span>
                <h3>{active.title}</h3>
              </div>
              <p className="display-desc">{active.desc}</p>
              <ul className="display-bullets">
                {active.bullets.map((b, i) => (
                  <li key={i}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="bullet-check">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Simulated Live Dashboard/Metric Card */}
            <div className="display-visual">
              <div className="visual-glass-card">
                <div className="visual-header">
                  <span className="dot-live" />
                  <span className="status-label">Seevora AI Status: <strong>{active.status}</strong></span>
                </div>
                
                <div className="visual-metric-block">
                  <div className="metric-val">{active.metric}</div>
                  <div className="metric-label">{active.metricLabel}</div>
                </div>

                <div className="visual-bars">
                  <div className="bar-item">
                    <span className="bar-label">Processing Load</span>
                    <div className="bar-bg"><div className="bar-fill" style={{ width: '74%' }} /></div>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">Success Rate</span>
                    <div className="bar-bg"><div className="bar-fill" style={{ width: '99.8%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
