import React, { useState } from 'react';

const faqs = [
  {
    q: 'Does Seevora replace my staff?',
    a: 'No. Seevora acts as a 24/7 assistant. It handles missed phone calls, answers repetitive WhatsApp questions, and books appointments automatically so your physical staff can focus on the in-person clients inside your clinic, salon, or studio.',
  },
  {
    q: 'Can the AI work in Hindi and local languages?',
    a: 'Yes! Our voice receptionist and WhatsApp chat agents are fully bilingual. They communicate fluently in Hindi, English, and regional dialect variations (Hinglish), ensuring your local customers get natural replies.',
  },
  {
    q: 'How quickly can it launch?',
    a: 'We map your specific business rules, train the AI model, set up your WhatsApp automation, and launch the system live on your domain within 5 business days.',
  },
  {
    q: 'Is our customer data secure?',
    a: 'Absolutely. We follow strict data privacy standards. All customer contact details, reservation history, and conversation transcripts are fully encrypted and belong exclusively to your business.',
  },
  {
    q: 'What kind of support do you provide?',
    a: 'We do not use ticketing systems. You get direct WhatsApp access to our Indore-based engineering team for any adjustments, workflow updates, or integrations, with same-day resolution guaranteed.',
  },
  {
    q: 'What communication channels does the AI support?',
    a: 'Our systems deploy across standard customer touchpoints. This includes automated inbound/outbound phone receptionists, WhatsApp Business API chat, Instagram DMs, SMS, and website booking widgets, all synced together to the same dashboard.',
  },
  {
    q: 'Do I need a developer or technical skills to get started?',
    a: 'No coding is required on your part. Our team of Indore-based developers handles 100% of the technical setup, database configuration, CRM integrations, and voice training as part of our onboarding workflow.',
  },
  {
    q: 'How does the AI handle payment verification and alerts?',
    a: 'Seevora integrates with UPI payment gateways and bank text notifications. The moment a booking deposit or customer transfer is received, the AI matches it against the ledger, updates the calendar, and texts a confirmation alert.',
  },
  {
    q: 'Can we customize the AI voice agent\'s tone and script?',
    a: 'Absolutely. During onboarding, we translate your existing business script and preferences into the AI model. You can select standard voice styles (e.g., friendly, professional, or formal) and tweak replies via WhatsApp support.',
  },
  {
    q: 'Is there a free trial or audit available?',
    a: 'Yes! We offer a free, comprehensive AI Workflow Audit. Our engineers will audit your current manual bottlenecks and draft a tailored automation blueprint mapping out potential cost reductions for your business.',
  },
];

export default function FAQ({ isPage = false }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (i) => {
    setActiveIndex(activeIndex === i ? null : i);
  };

  const goToContact = () => {
    window.location.assign('/book-a-call');
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

        <div className="faq-list" data-animate>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`faq-item ${activeIndex === i ? 'active' : ''}`}
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
