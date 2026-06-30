import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';
import {
  login,
  DEMO_USERS,
  ROLE_META,
  createDemoResetRequest,
  consumeDemoResetRequest,
} from '../../auth/roles';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email or username.');
        return;
      }

      setLoading(true);
      const result = createDemoResetRequest(email);
      setLoading(false);

      if (!result.success) {
        setError(result.error || 'Unable to create a reset code.');
        return;
      }

      setResetInfo(result);
      setResetCode(result.resetCode);
      setNewPassword('');
      setConfirmPassword('');
      setMode('reset');
      setMessage('Reset code generated below for this demo account.');
      return;
    }

    if (mode === 'reset') {
      if (!email.trim() || !resetCode.trim() || !newPassword || !confirmPassword) {
        setError('Please fill in all reset fields.');
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      const result = consumeDemoResetRequest(email, resetCode, newPassword);
      setLoading(false);

      if (!result.success) {
        setError(result.error || 'Unable to reset password.');
        return;
      }

      setPassword(newPassword);
      setMode('login');
      setResetInfo(null);
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPwd(false);
      setMessage('Password reset successful. You can now sign in.');
      return;
    }

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.success) {
        onLogin(result.user);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    }, 600);
  };

  const quickLogin = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
    setMessage('');
    setMode('login');
    setResetInfo(null);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
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
                  <div className="dashboard-login-label-row">
                    <label htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="dashboard-login-link"
                      onClick={() => {
                        setError('');
                        setMessage('');
                        setShowPwd(false);
                        setResetInfo(null);
                        setResetCode('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setMode(mode === 'reset' ? 'login' : 'forgot');
                      }}
                    >
                      {mode === 'reset' ? 'Back to login' : 'Forgot password?'}
                    </button>
                  </div>
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

                {mode === 'forgot' && (
                  <div className="dashboard-reset-note">
                    Enter your email or username. We will generate a one-time reset code for this demo account.
                  </div>
                )}

                {mode === 'reset' && resetInfo && (
                  <div className="dashboard-reset-panel">
                    <div className="dashboard-reset-panel__label">Reset code</div>
                    <div className="dashboard-reset-panel__code">{resetInfo.resetCode}</div>
                    <p className="dashboard-reset-panel__meta">
                      Use this code to set a new password. It expires in {resetInfo.expiresInMinutes} minutes.
                    </p>
                  </div>
                )}

                {mode === 'reset' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="resetCode">Reset Code</label>
                      <input
                        id="resetCode"
                        type="text"
                        value={resetCode}
                        onChange={(e) => { setResetCode(e.target.value); setError(''); }}
                        placeholder="Enter reset code"
                        className="form-input dashboard-login-input"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        id="newPassword"
                        type={showPwd ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                        placeholder="Enter new password"
                        className="form-input dashboard-login-input"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Re-enter new password"
                        className="form-input dashboard-login-input"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <div className="dashboard-login-remember">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label htmlFor="remember">Remember me for 30 days</label>
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
                  {loading ? 'Please wait…' : mode === 'reset' ? 'Reset Password' : mode === 'forgot' ? 'Send Reset Code' : 'Sign In'}
                  {!loading && <ArrowIcon />}
                </button>
              </form>
            </div>

            <div className="dashboard-demo-card">
              <p className="dashboard-demo-title">Quick Demo Login</p>
              <div className="dashboard-demo-list">
                {DEMO_USERS.map((u) => {
                  const meta = ROLE_META[u.role];
                  return (
                    <button
                      key={u.id}
                      onClick={() => quickLogin(u)}
                      className="dashboard-demo-item"
                      type="button"
                    >
                      <div className="dashboard-demo-avatar" style={{ background: meta.bg, color: meta.color }}>{u.avatar}</div>
                      <div className="dashboard-demo-copy">
                        <div className="dashboard-demo-name">{u.name}</div>
                        <div className="dashboard-demo-email">{u.email}</div>
                      </div>
                      <span className="dashboard-demo-role" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
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
