import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';

const API_FALLBACK_ORIGIN = 'http://127.0.0.1:4000';

async function postAuditRequest(payload) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };

  const response = await fetch('/api/audit-requests', requestOptions);
  if (response.status !== 502) return response;

  return fetch(`${API_FALLBACK_ORIGIN}/api/audit-requests`, requestOptions);
}

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status) setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await postAuditRequest(formData);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus({ type: 'error', text: data.message || 'Unable to submit your audit request. Please try again.' });
        return;
      }

      setStatus({ type: 'success', text: data.message || "Message sent. We'll get back to you within 24 hours." });
      setTimeout(() => setStatus(null), 4000);
      setFormData({ name: '', email: '', company: '', phone: '', message: '' });
    } catch {
      setStatus({ type: 'error', text: 'Unable to reach the server. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact section book-call-page" id="book-a-call">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
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
              {status && (
                <div style={{
                  padding: '14px 18px', marginBottom: 18,
                  borderRadius: 'var(--border-radius-sm)',
                  background: status.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(0,229,160,0.08)',
                  border: status.type === 'error' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(0,229,160,0.2)',
                  color: status.type === 'error' ? '#dc2626' : 'var(--accent-green)', fontSize: '0.88rem', fontWeight: 600,
                }}>
                  {status.text}
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
                    <input id="phone" name="phone" type="tel" className="form-input" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" className="form-input" placeholder="Tell us about the process you want to automate..." value={formData.message} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn-primary form-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait...' : 'Request a Audit'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
