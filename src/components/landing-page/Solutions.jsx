import React from 'react';

const solutions = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    color: 'cyan',
    title: 'Automate Workflows',
    desc: 'Replace repetitive manual steps with intelligent automation that learns and adapts across document processing, data entry, and decision routing.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    color: 'purple',
    title: 'Reduce Dependency',
    desc: 'Encode expertise into AI models that work 24/7, eliminating tribal knowledge silos and reducing single points of operational failure.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    color: 'green',
    title: 'Speed & Accuracy',
    desc: 'AI processes run in seconds, not hours. Our solutions achieve 99%+ accuracy on structured tasks, catching errors humans miss.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    color: 'blue',
    title: 'Seamless Integration',
    desc: 'Plug directly into your existing CRMs, ERPs, and databases. No rip-and-replace — just smart augmentation of what you already have.',
  },
];

export default function Solutions() {
  return (
    <section className="solutions section" id="solutions">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate>
          <div className="section-label"><span className="dot" />What We Deliver</div>
          <h2 className="section-title">Practical AI. <span className="gradient-text">Real Results.</span></h2>
          <p className="section-subtitle">
            We don't sell hype. We build targeted AI solutions that transform specific business processes into measurable profit drivers.
          </p>
        </div>

        <div className="solutions-grid">
          {solutions.map((s, i) => (
            <div key={i} className="solution-card" data-animate="tilt-in" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className={`card-icon ${s.color}`}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className={`card-accent-line ${s.color}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
