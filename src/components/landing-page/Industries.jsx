import React, { useState } from 'react';

const sectors = [
  {
    num: '01',
    icon: '🏥',
    title: 'Healthcare & Medical',
    sub: 'Clinics, hospitals, specialist practices, multi-branch medical centres',
    pain: 'Missed patient calls, multilingual routing, appointment no-shows',
    solution: 'AI receptionist, appointment reminders, predictive confirmations, reputation management',
    color: 'cyan',
  },
  {
    num: '02',
    icon: '🎓',
    title: 'Education & Skill Development',
    sub: 'Coaching institutes, tuition centres, exam academies, skill training providers',
    pain: 'Admission season overload, fee follow-up, demo class bookings',
    solution: '24/7 enquiry handling, demo class scheduling, UPI payment reminders, credibility content',
    color: 'purple',
  },
  {
    num: '03',
    icon: '💆',
    title: 'Personal Care & Wellness',
    sub: 'Beauty parlours, spa centres, hair studios, skin clinics, grooming services',
    pain: 'Manual slot booking, low repeat visits, weak follow-up',
    solution: 'Slot automation, appointment reminders, review requests, rebooking prompts',
    color: 'pink',
  },
  {
    num: '04',
    icon: '🔬',
    title: 'Diagnostic & Pathology',
    sub: 'Diagnostic laboratories, pathology centres, radiology clinics, health screening',
    pain: 'Test bookings, sample collection requests, report-ready queries',
    solution: 'Booking automation, WhatsApp notifications, patient trust-building website content',
    color: 'blue',
  },
  {
    num: '05',
    icon: '🏋️',
    title: 'Health & Fitness',
    sub: 'Gyms, fitness studios, yoga centres, sports academies, rehabilitation clinics',
    pain: 'Trial class drop-offs, renewal misses, inactive member churn',
    solution: 'Trial booking, renewal reminders, re-engagement campaigns, review/social content',
    color: 'green',
  },
  {
    num: '06',
    icon: '⚖️',
    title: 'Legal & Financial Advisory',
    sub: 'Law firms, CA practices, financial advisors, tax consultants',
    pain: 'Missed enquiries, consultation delays, document collection gaps',
    solution: 'Structured enquiry intake, consultation scheduling, document request reminders',
    color: 'orange',
  },
  {
    num: '07',
    icon: '🏠',
    title: 'Property & Real Estate',
    sub: 'Real estate agents, property dealers, housing developers, commercial consultants',
    pain: 'Slow response, unqualified leads, broker time wasted',
    solution: 'Instant lead qualification by budget/location/timeline and daily hot-lead list',
    color: 'cyan',
  },
];

export default function Industries() {
  const [active, setActive] = useState(null);

  return (
    <section className="industries section" id="industries">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />7 Business Verticals
          </div>
          <h2 className="section-title">
            Built for <span className="gradient-text">Your Sector</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Every Seevora deployment is customised to your industry's specific workflow, language, and compliance needs.
          </p>
        </div>

        <div className="sectors-grid">
          {sectors.map((s, i) => (
            <div
              key={i}
              className={`sector-card sector-card--${s.color}${active === i ? ' sector-card--active' : ''}`}
              data-animate="tilt-in"
              style={{ transitionDelay: `${i * 0.07}s` }}
              onClick={() => setActive(active === i ? null : i)}
            >
              <div className="sector-card-top">
                <span className="sector-num">{s.num}</span>
                <span className="sector-icon">{s.icon}</span>
              </div>
              <h3>{s.title}</h3>
              <p className="sector-sub">{s.sub}</p>
              <div className={`sector-detail${active === i ? ' open' : ''}`}>
                <div className="sector-detail-inner">
                  <div className="sector-detail-row">
                    <span className="sector-label">Pain point</span>
                    <span>{s.pain}</span>
                  </div>
                  <div className="sector-detail-row">
                    <span className="sector-label">Seevora solves</span>
                    <span>{s.solution}</span>
                  </div>
                </div>
              </div>
              <button className="sector-toggle">
                {active === i ? 'Show less ↑' : 'See how ↓'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
