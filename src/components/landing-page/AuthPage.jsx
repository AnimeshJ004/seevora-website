import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon-clean.png';

export default function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const [message, setMessage] = useState(null);
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (message) setMessage(null);
  };

  const validate = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isSignup && !values.username.trim()) nextErrors.username = 'Username is required.';
    if (!values.email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.';
    
    if (!values.password) {
      nextErrors.password = 'Password is required.';
    } else if (isSignup) {
      const hasCapital = /[A-Z]/.test(values.password);
      const hasNumber = /[0-9]/.test(values.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(values.password);
      const hasMinLength = values.password.length >= 8;

      if (!hasMinLength || !hasCapital || !hasNumber || !hasSpecial) {
        nextErrors.password = 'Password must meet all security requirements.';
      }
    } else if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (isSignup && !values.confirmPassword) nextErrors.confirmPassword = 'Confirm password is required.';
    else if (isSignup && values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    if (isSignup && values.phone.trim()) {
      const phonePattern = /^[0-9+\-\s()]{7,20}$/;
      if (!phonePattern.test(values.phone.trim())) nextErrors.phone = 'Enter a valid phone number.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setMessage(null);
    setErrors({});

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup
        ? {
            username: values.username.trim(),
            email: values.email.trim(),
            password: values.password,
            phone: values.phone.trim(),
          }
        : {
            email: values.email.trim(),
            password: values.password,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage({ type: 'error', text: data.message || 'Authentication failed. Please try again.' });
        return;
      }

      localStorage.setItem('seevoraAuthToken', data.token);
      localStorage.setItem('seevoraUser', JSON.stringify(data.user));
      setMessage({ type: 'success', text: data.message || (isSignup ? 'Account created successfully.' : 'Login successful.') });

      if (isSignup) {
        setValues({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: ''
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Unable to reach the authentication server. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact section book-call-page auth-page">
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />{isSignup ? 'Register' : 'Login'}
          </div>
          <h2 className="section-title">
            {isSignup ? 'Create Your ' : 'Access Your '}
            <span className="gradient-text">Seevora Account</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            {isSignup
              ? 'Register to start your AI workflow audit and manage your automation journey.'
              : 'Login to manage your AI workflow requests, audits, and implementation updates.'}
          </p>
        </div>

        <div className="contact-grid">
          <div className="book-call-brand" data-animate="slide-left">
            <img src={logoIcon} alt="Seevora" />
            <h3>Seevora</h3>
            <p>
              {isSignup
                ? 'Create your Seevora account to request audits, track conversations, and move faster from process review to automation launch.'
                : 'Access your Seevora workspace to review audit details, track progress, and stay connected with your AI implementation team.'}
            </p>
          </div>

          <div className="book-call-divider" aria-hidden="true" />

          <div className="contact-form" data-animate="slide-right">
            <div className="glass-card contact-form-card" data-animate="contact-form-3d">
              {message && (
                <div className={`auth-message auth-message--${message.type}`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                {isSignup ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <input id="username" name="username" type="text" className="form-input" placeholder="Your username" value={values.username} onChange={handleChange} aria-invalid={Boolean(errors.username)} />
                      {errors.username && <span className="form-error">{errors.username}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input id="email" name="email" type="email" className="form-input" placeholder="name@gmail.com" value={values.email} onChange={handleChange} aria-invalid={Boolean(errors.email)} />
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="password-input-wrapper">
                        <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Enter password" value={values.password} onChange={handleChange} aria-invalid={Boolean(errors.password)} />
                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      <div className="password-note">
                        Note: Must contain at least 8 characters, 1 uppercase letter, 1 number, and 1 special character.
                      </div>
                      {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <div className="password-input-wrapper">
                        <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="form-input" placeholder="Confirm password" value={values.confirmPassword} onChange={handleChange} aria-invalid={Boolean(errors.confirmPassword)} />
                        <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone (Optional)</label>
                      <input id="phone" name="phone" type="tel" className="form-input" placeholder="Your phone number" value={values.phone} onChange={handleChange} aria-invalid={Boolean(errors.phone)} />
                      {errors.phone && <span className="form-error">{errors.phone}</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input id="email" name="email" type="email" className="form-input" placeholder="name@gmail.com" value={values.email} onChange={handleChange} aria-invalid={Boolean(errors.email)} />
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="password-input-wrapper">
                        <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Enter password" value={values.password} onChange={handleChange} aria-invalid={Boolean(errors.password)} />
                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>
                  </>
                )}
                <button type="submit" className="btn-primary form-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait...' : isSignup ? 'Register' : 'Login'}
                </button>
              </form>
              <p className="auth-switch">
                {isSignup ? 'Already have an account?' : 'New to Seevora?'}{' '}
                <a href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Login' : 'Register'}</a>
              </p>
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
