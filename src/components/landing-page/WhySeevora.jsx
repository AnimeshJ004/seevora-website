import React from 'react';

const benefits = [
  {
    icon: '⚙️',
    title: 'Fully Customised',
    desc: 'No generic templates. Every voice receptionist and automated pipeline is custom-trained on your specific business rules.'
  },
  {
    icon: '🇮🇳',
    title: 'Hindi-First AI',
    desc: 'Voice agents and automated chat reply fluently in Hindi, English, and regional mixes, matching the local tongue.'
  },
  {
    icon: '⚡',
    title: 'Ready in 5 Days',
    desc: 'We map your specific salon, clinic, or coaching workflow and launch your custom AI live in just 5 business days.'
  },
  {
    icon: '📦',
    title: 'One Platform',
    desc: 'Consolidates voice receptionist, WhatsApp queries, client reservations, follow-ups, and reviews in one screen.'
  },
  {
    icon: '🤝',
    title: 'Dedicated Support',
    desc: 'Skip generic tickets. Direct WhatsApp access to your custom engineering support team for real-time updates.'
  },
  {
    icon: '🦁',
    title: 'Built for Indian SMBs',
    desc: 'Integrated with Indian business requirements — WhatsApp-first workflows, dial-in calls, and UPI billing reminders.'
  }
];

export default function WhySeevora() {
  return (
    <section className="why-seevora section" id="why-seevora">
      <div className="container">
        <div data-animate style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Why Seevora
          </div>
          <h2 className="section-title">
            The Seevora <span className="gradient-text">Difference</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Built specifically to solve the operational bottlenecks of Indian local businesses.
          </p>
        </div>

        <div className="why-seevora-grid">
          {benefits.map((b, i) => (
            <div key={i} className="why-card" data-animate="tilt-in" style={{ transitionDelay: `${i * 0.06}s` }}>
              <div className="why-card-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
