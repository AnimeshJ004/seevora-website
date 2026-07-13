import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';
import { loginSession } from '../../auth/api';

const EMPTY_VALUES = {
  identifier: '',
  password: '',
};

export default function AuthPage() {
  const [message, setMessage] = useState(null);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateValue = (name, nextValue) => {
    setValues((current) => ({ ...current, [name]: nextValue }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }
    if (message) setMessage(null);
  };

  const handleChange = (e) => updateValue(e.target.name, e.target.value);

  const validateLoginForm = () => {
    const nextErrors = {};

    if (!values.identifier.trim()) nextErrors.identifier = 'Username or email is required.';
    if (!values.password) nextErrors.password = 'Password is required.';
    else if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;

    setIsSubmitting(true);

    try {
      const { response, data } = await loginSession({
        identifier: values.identifier.trim(),
        password: values.password,
        remember: false,
      });

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({ type: 'error', text: data.message || 'Authentication failed. Please try again.' });
        return;
      }

      setMessage({ type: 'success', text: data.message || 'Login successful.' });
      window.location.assign('/admin');
    } catch {
      setMessage({ type: 'error', text: 'Unable to reach the authentication server. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    return handleLogin();
  };

  return (
    <section className="contact section book-call-page auth-page">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="bg-glow bg-glow-2" style={{ bottom: '-180px', left: '-140px' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <h2 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">Access Your <span className="gradient-text">Seevora Account</span></span>
            </span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Login to manage your AI workflow requests, audits, and implementation updates.
          </p>
        </div>

        <div className="contact-grid">
          <div className="book-call-brand" data-animate="slide-left">
            <img src={logoIcon} alt="Seevora" loading="lazy" decoding="async" />
            <h3>Seevora</h3>
            <p>
              Access your Seevora workspace to review audit details, track progress, and stay connected with your AI implementation team.
            </p>
          </div>

          <div className="book-call-divider" aria-hidden="true" />

          <div className="contact-form" data-animate="slide-right">
            <div className="glass-card contact-form-card auth-card" data-animate="contact-form-3d">
              {message && (
                <div className={`auth-message auth-message--${message.type}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="identifier">Username or Email</label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    className="form-input"
                    placeholder="Enter username or email"
                    value={values.identifier}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.identifier)}
                    disabled={isSubmitting}
                  />
                  {errors.identifier && <span className="form-error">{errors.identifier}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter password"
                      value={values.password}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.password)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <button type="submit" className="btn-primary form-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
