import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: '', email: '', company: '', phone: '', message: '' });
  };

  return (
    <section className="contact section book-call-page" id="book-a-call">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Book a Call</div>
          <h2 className="section-title">Schedule Your <span className="gradient-text">AI Growth Call</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Book a free discovery call. We'll map your process, identify the opportunity, and show you what's possible — no strings attached.
          </p>
        </div>

        <div className="contact-grid">
          <div className="book-call-brand" data-animate="slide-left">
            <img src={logoIcon} alt="Seevora" />
            <h3>Seevora</h3>
            <p>
              Book a focused discovery call with our team. We will understand your workflow, identify automation opportunities, and recommend the right AI system for your business.
            </p>
          </div>

          <div className="book-call-divider" aria-hidden="true" />

          <div className="contact-form" data-animate="slide-right">
            <div className="glass-card contact-form-card" data-animate="contact-form-3d">
              {submitted && (
                <div style={{
                  padding: '14px 18px', marginBottom: 18,
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(0,229,160,0.08)',
                  border: '1px solid rgba(0,229,160,0.2)',
                  color: 'var(--accent-green)', fontSize: '0.88rem', fontWeight: 600,
                }}>
                  Message sent. We'll get back to you within 24 hours.
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input id="name" name="name" type="text" className="form-input" placeholder="Your name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" className="form-input" placeholder="you@company.com" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input id="company" name="company" type="text" className="form-input" placeholder="Your company name" value={formData.company} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input id="phone" name="phone" type="tel" className="form-input" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" className="form-input" placeholder="Tell us about the process you want to automate..." value={formData.message} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn-primary form-submit">
                  Request a Audit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
