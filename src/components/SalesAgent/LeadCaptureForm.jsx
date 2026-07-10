import React, { useState } from 'react';

const SERVICES = [
  'AI Voice Receptionist',
  'WhatsApp Business Automation',
  'Multi-language Support',
  'Custom Integrations',
  'Other / Not Sure',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lead capture form shown inline in the chat window.
 * @param {{ onSubmit: (data) => Promise<void>, onCancel: () => void }} props
 */
export default function LeadCaptureForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    serviceInterest: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = 'Enter a valid email';
    if (!form.serviceInterest) errs.serviceInterest = 'Please select a service';
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="sa-lead-form" role="form" aria-label="Contact information form">
      <div className="sa-lead-form__header">
        <p className="sa-lead-form__title">Get a Free Consultation</p>
        <p className="sa-lead-form__subtitle">Our team will reach out within 24 hours</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="sa-field">
          <label className="sa-label" htmlFor="sa-name">Full Name *</label>
          <input
            id="sa-name"
            className={`sa-field-input ${errors.name ? 'sa-field-input--error' : ''}`}
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Rajesh Kumar"
            autoComplete="name"
          />
          {errors.name && <span className="sa-field-error">{errors.name}</span>}
        </div>

        <div className="sa-field">
          <label className="sa-label" htmlFor="sa-email">Email Address *</label>
          <input
            id="sa-email"
            className={`sa-field-input ${errors.email ? 'sa-field-input--error' : ''}`}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="rajesh@example.com"
            autoComplete="email"
          />
          {errors.email && <span className="sa-field-error">{errors.email}</span>}
        </div>

        <div className="sa-field">
          <label className="sa-label" htmlFor="sa-phone">Phone (optional)</label>
          <input
            id="sa-phone"
            className="sa-field-input"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            autoComplete="tel"
          />
        </div>

        <div className="sa-field">
          <label className="sa-label" htmlFor="sa-service">Service Interest *</label>
          <select
            id="sa-service"
            className={`sa-field-input ${errors.serviceInterest ? 'sa-field-input--error' : ''}`}
            name="serviceInterest"
            value={form.serviceInterest}
            onChange={handleChange}
          >
            <option value="">Select a service…</option>
            {SERVICES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.serviceInterest && <span className="sa-field-error">{errors.serviceInterest}</span>}
        </div>

        <div className="sa-lead-actions">
          <button
            type="submit"
            className="sa-lead-submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Sending…' : 'Submit'}
          </button>
          <button
            type="button"
            className="sa-lead-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Maybe later
          </button>
        </div>
      </form>
    </div>
  );
}
