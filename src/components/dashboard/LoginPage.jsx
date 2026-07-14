import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';
import { loginSession } from '../../auth/api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);

    try {
      const { response, data } = await loginSession({
        identifier: email.trim(),
        password,
        remember,
      });

      if (response.ok) {
        onLogin(data.user);
        return;
      }

      setError(data.message || 'Invalid credentials. Please try again.');
    } catch {
      setError('Unable to reach the authentication server.');
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
              Sign in to your workspace. We will help you review requests, track audits, and manage implementation updates.
            </p>
          </div>

          <div className="book-call-divider" aria-hidden="true" />

          <div className="contact-form dashboard-login-form" data-animate="slide-right">
            <div className="glass-card contact-form-card dashboard-login-card" data-animate="contact-form-3d">
              <h1 className="dashboard-login-title">Welcome back</h1>
              <p className="dashboard-login-subtitle">Sign in to your Seevora workspace</p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email or Username</label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@seevora.in or seevora"
                    className="form-input dashboard-login-input"
                    aria-invalid={Boolean(error)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="form-input dashboard-login-input"
                      aria-invalid={Boolean(error)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="password-toggle-btn"
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd
                        ? <EyeOffIcon />
                        : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="dashboard-login-remember" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={loading}
                      style={{ margin: 0, width: '16px', height: '16px' }}
                    />
                    <label htmlFor="remember" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Remember me for 30 days</label>
                  </div>
                  <a 
                    href="/forgot-password" 
                    style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'underline' }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/forgot-password');
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>

                {error && (
                  <div className="dashboard-login-error">
                    <ErrorIcon />
                    <span>{error}</span>
                  </div>
                )}

                {message && !error && (
                  <div className="dashboard-login-message">
                    {message}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary form-submit dashboard-login-submit">
                  {loading ? 'Please wait…' : 'Sign In'}
                  {!loading && <ArrowIcon />}
                </button>
              </form>
            </div>

            <p className="dashboard-login-footer">
              © 2026 Seevora Private Limited · <a href="/" className="dashboard-login-backlink">Back to website</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
