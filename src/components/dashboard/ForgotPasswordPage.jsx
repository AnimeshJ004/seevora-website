import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';
import { apiFetch } from '../../auth/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'If an account exists, a password reset link has been sent.');
      } else {
        setError(data.message || 'Failed to request password reset.');
      }
    } catch {
      setError('Unable to reach the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact section book-call-page dashboard-login-page">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="bg-glow bg-glow-2" style={{ bottom: '-180px', left: '-140px' }} />
      <div className="container">
        <div className="contact-grid dashboard-login-grid">
          <div className="book-call-brand dashboard-login-brand">
            <img src={logoIcon} alt="Seevora" />
            <h3>Seevora</h3>
            <p>
              Forgot your password? Enter your email address to receive a secure link to reset it.
            </p>
          </div>

          <div className="book-call-divider" aria-hidden="true" />

          <div className="contact-form dashboard-login-form" data-animate="slide-right">
            <div className="glass-card contact-form-card dashboard-login-card" data-animate="contact-form-3d">
              <h1 className="dashboard-login-title" style={{ marginBottom: '1.5rem' }}>Reset Password</h1>

              <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || message}
                  className="form-input dashboard-login-input"
                  aria-invalid={Boolean(error)}
                />
              </div>

              {error && <div className="dashboard-login-error" style={{ color: 'var(--accent-red)', marginBottom: '16px' }}>{error}</div>}
              {message && <div className="dashboard-login-message" style={{ color: 'var(--accent-green)', marginBottom: '16px' }}>{message}</div>}

              {!message && (
                <button type="submit" className="btn-primary form-submit dashboard-login-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="btn-spinner" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              )}
              
              <div className="auth-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
                <a href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }} onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/login');
                }}>
                  Return to Login
                </a>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
