import React, { useState, useEffect, useRef } from 'react';
import logoIcon from '../../assets/logo-icon.png';

export default function Navbar() {
  const [mode, setMode] = useState('full');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY.current) > 15) setIsExpanded(false);
      if (y < 80) { setMode('full'); setIsExpanded(false); }
      else if (y > lastScrollY.current && y > 80) setMode('compact');
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goHomeSection = (id) => {
    if (window.location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    window.location.assign(`/#${id}`);
  };

  const handleNav = (e, link) => {
    e.preventDefault();
    setMobileOpen(false);
    setIsExpanded(false);
    if (link.path) { window.location.assign(link.path); return; }
    goHomeSection(link.id);
  };

  const scrollTop = (e) => {
    e.preventDefault();
    setMobileOpen(false);
    setIsExpanded(false);
    if (window.location.pathname === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    window.location.assign('/');
  };

  const links = [
    { label: 'About', path: '/about' },
    { label: 'Modules', path: '/modules' },
    { label: 'Services', path: '/services' },
    { label: 'Impact', path: '/impact' },
    { label: 'FAQs', path: '/faqs' },
  ];

  const isCompact = mode === 'compact';

  return (
    <>
      <div className="jitter-nav-wrapper">
        <nav className={`jitter-nav-full${isCompact ? ' hidden' : ''}`}>
          <a href="#" className="jnav-logo" onClick={scrollTop}>
            <img src={logoIcon} alt="" className="logo-icon-img" />
            <span className="logo-text">Seevora</span>
          </a>
          <div className="jnav-links">
            {links.map((l) => (
              <a key={l.id || l.path} href={l.path || `#${l.id}`} onClick={(e) => handleNav(e, l)}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="jnav-actions">
            <button className="jnav-login" onClick={(e) => handleNav(e, { path: '/login' })}>
              Login
            </button>
            <span className="jnav-action-separator" aria-hidden="true">|</span>
            <button className="jnav-cta" onClick={(e) => handleNav(e, { path: '/book-a-call' })}>
              Book a call
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            className={`jnav-hamburger jnav-hamburger--full${mobileOpen ? ' active' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </nav>
 
        <nav className={`jitter-nav-compact${isCompact ? ' visible' : ''}${isExpanded ? ' expanded' : ''}`}>
          <div className={`jnav-compact-links${isExpanded ? ' expanded' : ''}`}>
            {links.map((l, idx) => (
              <a
                key={l.id || l.path}
                href={l.path || `#${l.id}`}
                onClick={(e) => handleNav(e, l)}
                style={{ transitionDelay: isExpanded ? `${idx * 40}ms` : '0ms' }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="jnav-actions jnav-actions--compact">
            <button className="jnav-cta jnav-cta--compact" onClick={(e) => handleNav(e, { path: '/book-a-call' })}>
              Book a call
            </button>
          </div>
          <button
            className={`jnav-hamburger-circle${isExpanded ? ' active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </nav>
      </div>
 
      <div className={`mobile-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`}>
        <a href="#" className="jnav-logo mobile-logo" onClick={(e) => { scrollTop(e); setMobileOpen(false); }}>
          <img src={logoIcon} alt="" className="logo-icon-img" />
          <span className="logo-text">Seevora</span>
        </a>
        {links.map((l) => (
          <a key={l.id || l.path} href={l.path || `#${l.id}`} onClick={(e) => handleNav(e, l)}>
            {l.label}
          </a>
        ))}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="tel:+918269297967" className="btn-glass" style={{ justifyContent: 'center', width: '100%' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Call +91 82692 97967
          </a>
          <button className="btn-primary" style={{ width: '100%' }} onClick={(e) => handleNav(e, { path: '/login' })}>
            Login
          </button>
          <button className="btn-primary" style={{ width: '100%' }} onClick={(e) => handleNav(e, { path: '/book-a-call' })}>
            Book a call
          </button>
        </div>
      </div>
    </>
  );
}
