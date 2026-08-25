import React from 'react';
import apsLogo from '../../assets/aps-logo.png';
import doorOfSoulLogo from '../../assets/door-of-soul-logo.png';

const testimonialsData = [
  {
    id: 'aps-enterprises',
    company: 'APS Enterprises',
    role: 'Operations & Enterprise AI Systems',
    logo: apsLogo,
    logoAlt: 'APS Enterprises Logo',
    quote:
      'Seevora built custom AI agents for our CRM & ERP, an AI voice agent for our dialer, and an intelligent chatbot to calculate and respond to inquiries instantly.',
    highlights: ['CRM & ERP Agents', 'AI Voice Dialer', 'Calculation Bot'],
    rating: 5,
  },
  {
    id: 'door-of-soul',
    company: 'DoorOfSoul',
    role: 'Founder & Growth Ecosystem',
    logo: doorOfSoulLogo,
    logoAlt: 'DoorOfSoul Logo',
    quote:
      'Seevora created an automated Meta Ads lead dashboard where lead status updates via AI silent listeners, plus integrated WhatsApp to chat right from the AI section.',
    highlights: ['Meta Ads Dashboard', 'AI Silent Listener', 'WhatsApp Chat'],
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials-section section" id="testimonials">
      <div className="container">
        {/* Section Header */}
        <div className="testimonials-header" data-animate="motion-header">
          <h2 className="section-title">
            Hear it from our <span className="gradient-text">partners.</span>
          </h2>
          <p className="section-subtitle">
            Real outcomes from industry leaders who trust Seevora to automate operations, accelerate revenue, and power their next phase of growth.
          </p>
        </div>

        {/* 2-Column Balanced Grid Layout */}
        <div className="testimonials-two-col-grid">
          {testimonialsData.map((item) => (
            <div
              key={item.id}
              className="testimonial-card-pro"
              data-animate="testimonial-card-3d"
            >
              {/* Card Header: Logo & Company Info in the same place */}
              <div className="testimonial-pro-header">
                <div className="testimonial-header-brand">
                  <div className="testimonial-logo-wrapper">
                    <img
                      src={item.logo}
                      alt={item.logoAlt}
                      className={`testimonial-pro-logo logo-${item.id}`}
                      loading="lazy"
                    />
                  </div>
                  <div className="testimonial-brand-info">
                    <div className="testimonial-author-name">{item.company}</div>
                    <div className="testimonial-role">{item.role}</div>
                  </div>
                </div>
              </div>

              {/* Quote Body */}
              <div className="testimonial-pro-quote-body">
                <p className="testimonial-pro-quote">
                  "{item.quote}"
                </p>
              </div>

              {/* Highlight Pills */}
              <div className="testimonial-highlights">
                {item.highlights.map((h, i) => (
                  <span key={i} className="testimonial-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
