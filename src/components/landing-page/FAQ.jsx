import React, { useState } from 'react';

const faqs = [
  {
    q: 'How is Seevora different from other AI companies?',
    a: 'We don\'t sell generic AI tools or produce consulting decks. Seevora builds custom, production-grade AI solutions tailored to a specific business process. We own the outcome — from discovery to deployment to ongoing optimization.',
  },
  {
    q: 'What industries do you serve?',
    a: 'We work across healthcare, finance, manufacturing, retail, and logistics. Our solutions are built around your industry\'s specific data types, workflows, and compliance requirements.',
  },
  {
    q: 'How long does implementation take?',
    a: 'Most solutions go from discovery to production in 6-12 weeks, depending on complexity. We focus on one process at a time to ensure rapid, high-quality deployment with measurable results.',
  },
  {
    q: 'What kind of ROI can we expect?',
    a: 'Our clients typically see 30-50% cost reduction on the automated process within 90 days. We define ROI metrics upfront and track them throughout — every solution is designed to pay for itself.',
  },
  {
    q: 'Do we need to replace our existing systems?',
    a: 'No. Seevora solutions integrate with your current tech stack — CRMs, ERPs, databases, and internal tools. We augment your existing infrastructure rather than replacing it.',
  },
  {
    q: 'What happens after deployment?',
    a: 'We provide ongoing monitoring, optimization, and support. Our AI systems continuously learn and improve, and we deliver regular ROI reports so you always know the impact.',
  },
];

export default function FAQ({ isPage = false }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (i) => {
    setActiveIndex(activeIndex === i ? null : i);
  };

  const goToContact = () => {
    window.location.assign('/#contact');
  };

  return (
    <section className={`faq section${isPage ? ' faq-page' : ''}`} id="faqs">
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 24px' }}>
            <span className="dot" />
            FAQ
          </div>
          <h2 className="section-title">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Everything you need to know about working with Seevora.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`faq-item${activeIndex === i ? ' active' : ''}`}
              data-animate
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              <div className="glass-card" onClick={() => toggle(i)}>
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-icon">+</span>
                </div>
                <div
                  className="faq-answer"
                  style={{
                    maxHeight: activeIndex === i ? '300px' : '0px',
                  }}
                >
                  <div className="faq-answer-inner">{faq.a}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="faq-cta" data-animate>
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
            Still have questions? Let's talk.
          </p>
          <button
            className="btn-primary"
            onClick={goToContact}
          >
            Book a Call
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
