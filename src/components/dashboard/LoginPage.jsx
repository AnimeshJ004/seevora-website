import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon.png';
import { login, DEMO_USERS, ROLE_META } from '../../auth/roles';

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in both fields.'); return; }
    setLoading(true);
    setError('');
    // Simulate network delay
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
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep)', fontFamily: "'Inter', sans-serif", padding: '24px',
    }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(15,23,42,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />
      {/* Glow */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: 500, height: 500, background: 'rgba(20,201,225,0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-100px', left: '-100px', width: 400, height: 400, background: 'rgba(158,60,236,0.05)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          <img src={logoIcon} alt="Seevora" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Seevora</span>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid var(--glass-border)', borderRadius: 24, padding: '40px 36px', boxShadow: '0 8px 40px rgba(15,23,42,0.06)' }}>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 6, textAlign: 'center' }}>Welcome back</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>Sign in to your Seevora workspace</p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Email or Phone</label>
              <input
                type="text"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@seevora.in"
                style={{ width: '100%', padding: '11px 14px', border: `1px solid ${error ? 'var(--accent-pink)' : 'var(--glass-border)'}`, borderRadius: 10, fontSize: '0.88rem', background: 'var(--bg-space)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={e => e.target.style.borderColor = error ? 'var(--accent-pink)' : 'var(--glass-border)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
                <a href="#" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 44px 11px 14px', border: `1px solid ${error ? 'var(--accent-pink)' : 'var(--glass-border)'}`, borderRadius: 10, fontSize: '0.88rem', background: 'var(--bg-space)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                  onBlur={e => e.target.style.borderColor = error ? 'var(--accent-pink)' : 'var(--glass-border)'}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                  {showPwd
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Remember me for 30 days</label>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--accent-pink)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: loading ? '#6b7280' : 'var(--text-primary)', color: '#fff', border: 'none', borderRadius: 100, fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Signing in…</>
              ) : (
                <>Sign In <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              )}
            </button>
          </form>
        </div>

        {/* Quick login demo */}
        <div style={{ marginTop: 28, background: '#fff', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '20px 24px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>Quick Demo Login</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_USERS.map(u => {
              const meta = ROLE_META[u.role];
              return (
                <button key={u.id} onClick={() => quickLogin(u)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--glass-border)', borderRadius: 10, cursor: 'pointer', background: 'var(--bg-space)', transition: 'all 0.2s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-space)'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}>{u.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700, background: meta.bg, color: meta.color }}>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 20 }}>
          © 2026 Seevora Private Limited · <a href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Back to website</a>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
