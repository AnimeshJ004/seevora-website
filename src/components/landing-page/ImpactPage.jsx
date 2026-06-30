import React, { useEffect } from 'react';

const outcomes = [
  {
    num: '01',
    category: 'Lead Capture',
    title: 'More Leads. Zero Missed Opportunities.',
    desc: 'Every inbound message, call, or form submission is captured and engaged instantly by our custom AI receptionist. No lead is left cold or ignored.',
    metric: '100% Lead Engagement',
    benefit: 'Recovers leads outside business hours and converts missed calls into live enquiries instantly.'
  },
  {
    num: '02',
    category: 'Calendar Optimization',
    title: 'Fewer No-Shows. Fuller Schedules.',
    desc: 'Smart automated WhatsApp and Voice reminders ensure clients confirm their booking slots, filling your operational calendars automatically.',
    metric: 'Up to 40% Lower No-Shows',
    benefit: 'Automatically shifts waitlisted customers into cancellation gaps to maximize appointment capacity.'
  },
  {
    num: '03',
    category: 'Customer Retention',
    title: 'Better Client Retention. More Repeat Business.',
    desc: 'Keep customers coming back with automated post-visit feedback loops, loyalty program updates, and personalized booking reminders.',
    metric: '+22% Repeat Appointments',
    benefit: 'Builds tailored engagement paths automatically without requiring manual text templates or staff effort.'
  },
  {
    num: '04',
    category: 'Reputation Growth',
    title: 'Stronger Online Presence. More Inbound Clients.',
    desc: 'Automatically request reviews via WhatsApp from satisfied clients, boosting your Google local search rating and local organic visibility.',
    metric: '4.9★ Average Rating Target',
    benefit: 'Filters for happy customer feedback and requests 5-star ratings, keeping negative experiences internal.'
  },
  {
    num: '05',
    category: 'Operational Speed',
    title: 'Organised Operations. Time Freed for Growth.',
    desc: 'Manual follow-ups, scheduling, and standard queries are completely handled by AI, freeing your staff to focus on high-value client care.',
    metric: '25+ Hours Saved Weekly',
    benefit: 'Gives management transparent operational metrics dashboards and saves hours of receptionist data entry.'
  }
];

export default function ImpactPage() {
  const handleBookCall = (e) => {
    e.preventDefault();
    window.location.assign('/book-a-call');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="impact-page" style={{ background: 'var(--bg-deep)', padding: '140px 0 100px' }}>
      <div className="container">
        
        {/* Page Banner Header */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 className="section-title">
            Measurable Value. <span className="gradient-text">Delivered.</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '640px' }}>
            Every Seevora deployment focuses on real business metrics: more leads, fuller schedules, and operations that pay for themselves.
          </p>
        </div>

        {/* Outcomes List */}
        <div className="impact-list">
          {outcomes.map((item, i) => (
            <div
              key={item.num}
              className="impact-item-card"
              data-animate
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="impact-card-side">
                <span className="impact-card-number">{item.num}</span>
                <span className="impact-card-metric">{item.metric}</span>
              </div>
              
              <div className="impact-card-main">
                <span className="impact-card-category">{item.category}</span>
                <h3>{item.title}</h3>
                <p className="impact-card-desc">{item.desc}</p>
                <div className="impact-card-benefit">
                  <strong>Key Benefit:</strong> {item.benefit}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Outro */}
        <div className="services-outro-cta" data-animate style={{ marginTop: '80px' }}>
          <h4>Ready to maximize your business capacity?</h4>
          <p>We build, install, and support custom AI automations designed around your operational targets.</p>
          <div className="outro-buttons" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a href="#" className="btn-primary" onClick={handleBookCall}>
              Book an Assessment Call
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
