import React from 'react';

const outcomes = [
  {
    num: '01',
    title: 'More Leads. Zero Missed Opportunities.',
    desc: 'Every inbound message, call, or form submission is captured and engaged instantly by our custom AI receptionist. No lead is left cold or ignored.'
  },
  {
    num: '02',
    title: 'Fewer No-Shows. Fuller Schedules.',
    desc: 'Smart automated WhatsApp and Voice reminders ensure clients confirm their booking slots, filling your operational calendars automatically.'
  },
  {
    num: '03',
    title: 'Better Client Retention. More Repeat Business.',
    desc: 'Keep customers coming back with automated post-visit feedback loops, loyalty program updates, and personalized booking reminders.'
  },
  {
    num: '04',
    title: 'Stronger Online Presence. More Inbound Clients.',
    desc: 'Automatically request reviews via WhatsApp from satisfied clients, boosting your Google local search rating and local organic visibility.'
  },
  {
    num: '05',
    title: 'Organised Operations. Time Freed for What Matters.',
    desc: 'Manual follow-ups, scheduling, and standard queries are completely handled by AI, freeing your staff to focus on high-value client care.'
  }
];

export default function Outcomes() {
  return (
    <section className="outcomes section" id="outcomes">
      <div className="container">
        <div data-animate style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label" style={{ margin: '0 auto 10px' }}><span className="dot" />Our Impact</div>
          <h2 className="section-title">How We Help <span className="gradient-text">Businesses Grow</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Five measurable outcomes delivered by every Seevora deployment
          </p>
        </div>

        <div className="outcomes-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {outcomes.map((item, i) => (
            <div
              key={i}
              className="outcome-row"
              data-animate
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className="outcome-num">{item.num}</div>
              <div className="outcome-title">{item.title}</div>
              <div className="outcome-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
