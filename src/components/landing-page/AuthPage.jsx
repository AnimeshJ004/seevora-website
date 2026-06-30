import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';

const API_FALLBACK_ORIGIN = 'http://127.0.0.1:4000';

async function postAuth(endpoint, payload) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };

  const response = await fetch(endpoint, requestOptions);
  if (response.status !== 502) return response;

  return fetch(`${API_FALLBACK_ORIGIN}${endpoint}`, requestOptions);
}

const EMPTY_VALUES = {
  identifier: '',
  password: '',
  resetCode: '',
  newPassword: '',
  confirmPassword: '',
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState(null);
  const [resetInfo, setResetInfo] = useState(null);
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

  const validateForgotForm = () => {
    const nextErrors = {};

    if (!values.identifier.trim()) nextErrors.identifier = 'Username or email is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateResetForm = () => {
    const nextErrors = {};

    if (!values.resetCode.trim()) nextErrors.resetCode = 'Reset code is required.';
    if (!values.newPassword) nextErrors.newPassword = 'New password is required.';
    else if (values.newPassword.length < 8) nextErrors.newPassword = 'Password must be at least 8 characters.';
    if (!values.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (values.confirmPassword !== values.newPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;

    setIsSubmitting(true);

    try {
      const response = await postAuth('/api/auth/login', {
        identifier: values.identifier.trim(),
        password: values.password,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({ type: 'error', text: data.message || 'Authentication failed. Please try again.' });
        return;
      }

      localStorage.setItem('seevoraAuthToken', data.token);
      localStorage.setItem('seevoraUser', JSON.stringify(data.user));
      setMessage({ type: 'success', text: data.message || 'Login successful.' });
      window.location.assign('/admin');
    } catch {
      setMessage({ type: 'error', text: 'Unable to reach the authentication server. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForgotForm()) return;

    setIsSubmitting(true);
    setMessage(null);
    setErrors({});

    try {
      const response = await postAuth('/api/auth/forgot-password', {
        identifier: values.identifier.trim(),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({ type: 'error', text: data.message || 'Unable to create a reset code.' });
        return;
      }

      setResetInfo({
        code: data.resetCode,
        expiresInMinutes: data.expiresInMinutes,
      });
      setValues((current) => ({
        ...current,
        resetCode: data.resetCode || current.resetCode,
        newPassword: '',
        confirmPassword: '',
      }));
      setShowPassword(false);
      setMode('reset');
      setMessage({
        type: 'success',
        text: data.message || 'Reset code generated.',
      });
    } catch {
      setMessage({ type: 'error', text: 'Unable to reach the authentication server. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateResetForm()) return;

    setIsSubmitting(true);
    setMessage(null);
    setErrors({});

    try {
      const response = await postAuth('/api/auth/reset-password', {
        resetCode: values.resetCode.trim(),
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({ type: 'error', text: data.message || 'Unable to reset password.' });
        return;
      }

      setMode('login');
      setResetInfo(null);
      setValues(EMPTY_VALUES);
      setShowPassword(false);
      setMessage({ type: 'success', text: data.message || 'Password reset successful.' });
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

    if (mode === 'login') return handleLogin();
    if (mode === 'forgot') return handleForgotPassword();
    return handleResetPassword();
  };

  const resetToLogin = () => {
    setMode('login');
    setErrors({});
    setMessage(null);
    setShowPassword(false);
    setResetInfo(null);
    setValues((current) => ({
      ...current,
      password: '',
      resetCode: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  return (
    <section className="contact section book-call-page auth-page">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="bg-glow bg-glow-2" style={{ bottom: '-180px', left: '-140px' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <h2 className="section-title">
            Access Your <span className="gradient-text">Seevora Account</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Login to manage your AI workflow requests, audits, and implementation updates.
          </p>
        </div>

        <div className="contact-grid">
          <div className="book-call-brand" data-animate="slide-left">
            <img src={logoIcon} alt="Seevora" />
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

              {mode === 'reset' && resetInfo && (
                <div className="auth-reset-panel">
                  <div className="auth-reset-panel__label">Reset code</div>
                  <div className="auth-reset-panel__code">{resetInfo.code}</div>
                  <p className="auth-reset-panel__meta">
                    One-time code. Expires in {resetInfo.expiresInMinutes} minutes.
                  </p>
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

                {mode === 'login' && (
                  <>
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

                    <div className="auth-inline-actions">
                      <button
                        type="button"
                        className="auth-link-button"
                        onClick={() => {
                          setShowPassword(false);
                          setValues((current) => ({
                            ...current,
                            password: '',
                            resetCode: '',
                            newPassword: '',
                            confirmPassword: '',
                          }));
                          setMode('forgot');
                        }}
                        disabled={isSubmitting}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </>
                )}

                {mode === 'forgot' && (
                  <>
                    <div className="auth-reset-note">
                      Enter the username or email for the account. The server will generate a one-time reset code for you.
                    </div>

                    <div className="auth-inline-actions">
                      <button type="button" className="auth-link-button" onClick={resetToLogin} disabled={isSubmitting}>
                        Back to login
                      </button>
                    </div>
                  </>
                )}

                {mode === 'reset' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="resetCode">Reset Code</label>
                      <input
                        id="resetCode"
                        name="resetCode"
                        type="text"
                        className="form-input auth-code-input"
                        placeholder="Paste the reset code"
                        value={values.resetCode}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.resetCode)}
                        disabled={isSubmitting}
                      />
                      {errors.resetCode && <span className="form-error">{errors.resetCode}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Enter new password"
                          value={values.newPassword}
                          onChange={handleChange}
                          aria-invalid={Boolean(errors.newPassword)}
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
                      {errors.newPassword && <span className="form-error">{errors.newPassword}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        className="form-input"
                        placeholder="Re-enter new password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.confirmPassword)}
                        disabled={isSubmitting}
                      />
                      {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                    </div>

                    <div className="auth-inline-actions">
                      <button type="button" className="auth-link-button" onClick={resetToLogin} disabled={isSubmitting}>
                        Back to login
                      </button>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary form-submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Login'
                      : mode === 'forgot'
                        ? 'Send Reset Code'
                        : 'Reset Password'}
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
