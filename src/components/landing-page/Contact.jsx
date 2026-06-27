import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  return (
    <section className="contact section" id="contact">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Get Started</div>
          <h2 className="section-title">Ready to See What AI Can <span className="gradient-text">Save You?</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Book a free discovery call. We'll map your process, identify the opportunity, and show you what's possible — no strings attached.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-info" data-animate="slide-left">
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                title: 'Email Us', value: 'info@seevora.in',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 12 19.79 19.79 0 0 1 1.12 3.38 2 2 0 0 1 3.1 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                title: 'Call Us', value: '+91 89822 00895',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                title: 'Location', value: 'Indore, India',
              },
            ].map((item, i) => (
              <div key={i} className="glass-card contact-info-card">
                <div className="info-icon">{item.icon}</div>
                <div className="info-text"><h4>{item.title}</h4><p>{item.value}</p></div>
              </div>
            ))}
          </div>

          <div className="contact-form" data-animate="slide-right">
            <div className="glass-card">
              {submitted && (
                <div style={{
                  padding: '14px 18px', marginBottom: 18,
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(0,229,160,0.08)',
                  border: '1px solid rgba(0,229,160,0.2)',
                  color: 'var(--accent-green)', fontSize: '0.88rem', fontWeight: 600,
                }}>
                  ✓ Message sent! We'll get back to you within 24 hours.
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
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input id="company" name="company" type="text" className="form-input" placeholder="Your company name" value={formData.company} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" className="form-input" placeholder="Tell us about the process you want to automate..." value={formData.message} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn-primary form-submit">
                  Request free audit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
