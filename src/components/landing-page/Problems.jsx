import React from 'react';

const problems = [
  {
    icon: '📞',
    title: 'Missed Calls = Lost Revenue',
    desc: 'Every unanswered call can become lost revenue. Seevora captures enquiries even when staff are busy or closed.',
  },
  {
    icon: '📅',
    title: 'No-Shows Drain Schedules',
    desc: 'Automated reminders and waitlist logic help keep appointment slots full and reduce no-shows by 30–40%.',
  },
  {
    icon: '🗂️',
    title: 'Unorganised Leads',
    desc: 'Calls, WhatsApp, and web forms enter one CRM pipeline with Hot/Warm/Cold priority. Nothing falls through the cracks.',
  },
  {
    icon: '⭐',
    title: 'Weak Online Trust',
    desc: 'Review requests, Google Business Profile support, and local SEO help clients find and trust you before they call.',
  },
];

export default function Problems() {
  return (
    <section className="problems section" id="problems">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Problems We Solve
          </div>
          <h2 className="section-title">
            Why Indian Businesses <span className="gradient-text">Lose Growth</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            These are the four operational failures costing Indian SMBs lakhs every month.
          </p>
        </div>

        <div className="problems-grid">
          {problems.map((p, i) => (
            <div key={i} className="problem-card" data-animate="tilt-in" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="problem-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
