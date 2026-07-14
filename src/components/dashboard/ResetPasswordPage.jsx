import React, { useState, useEffect } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';
import { apiFetch } from '../../auth/api';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid reset link. Token is missing.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Invalid reset link. Token is missing.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage('Your password has been successfully reset. You can now sign in.');
      } else {
        setError(data.message || 'Failed to reset password.');
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
              Choose a new, strong password to secure your account.
            </p>
          </div>

          <div className="book-call-divider" aria-hidden="true" />

          <div className="contact-form dashboard-login-form" data-animate="slide-right">
            <div className="glass-card contact-form-card dashboard-login-card" data-animate="contact-form-3d">
              <h1 className="dashboard-login-title" style={{ marginBottom: '1.5rem' }}>Set New Password</h1>

              <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || message}
                  className="form-input dashboard-login-input"
                  aria-invalid={Boolean(error)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || message}
                  className="form-input dashboard-login-input"
                  aria-invalid={Boolean(error)}
                />
              </div>

              {error && <div className="dashboard-login-error" style={{ color: 'var(--accent-red)', marginBottom: '16px' }}>{error}</div>}
              {message && <div className="dashboard-login-message" style={{ color: 'var(--accent-green)', marginBottom: '16px' }}>{message}</div>}

              {!message && (
                <button type="submit" className="btn-primary form-submit dashboard-login-submit" disabled={loading || !token}>
                  {loading ? (
                    <>
                      <span className="btn-spinner" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
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
