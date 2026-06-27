import React from 'react';
import GlassCard from './GlassCard';

const testimonials = [
  {
    quote: "Seevora improved our inventory tracking and quality checks, reducing stock errors and helping production teams work with faster, cleaner data.",
    author: 'Saddam Mansuri',
    role: 'Owner, APS Enterprises',
    initials: 'SM',
  },
  {
    quote: "Seevora's trend prediction helped us plan content earlier, improving campaign timing and increasing engagement across key digital channels.",
    author: 'Client Representative',
    role: 'Digital Strategy Lead, Kodanda Media',
    initials: 'CR',
  },
  {
    quote: "Seevora made portfolio risk assessment faster and clearer, helping our team spot exposure early and make better-informed decisions.",
    author: 'Client Representative',
    role: 'Portfolio Operations Lead, Kodanda Investments',
    initials: 'CR',
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials section" id="testimonials">
      <div className="bg-glow bg-glow-2" style={{ bottom: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Client Results</div>
          <h2 className="section-title">Trusted by <span className="gradient-text">Industry Leaders</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Real feedback from teams that have transformed their operations with Seevora.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <GlassCard key={i} className="testimonial-card" animType="tilt-in" animDelay={i * 0.1}>
              <div className="quote-icon">"</div>
              <p className="quote-text">{t.quote}</p>
              <div className="quote-author">
                <div className="author-avatar">{t.initials}</div>
                <div className="author-info">
                  <h5>{t.author}</h5>
                  <span>{t.role}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
