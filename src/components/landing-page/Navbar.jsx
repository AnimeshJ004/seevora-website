import React, { useEffect, useRef, useState } from 'react';
import logoIcon from '../../assets/logo-icon.png';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      if (y < 80) {
        setHidden(false);
      } else if (y > lastScrollY.current + 10) {
        setHidden(true);
        setMobileOpen(false);
      } else if (y < lastScrollY.current - 10) {
        setHidden(false);
      }

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
    if (link.path) { window.location.assign(link.path); return; }
    goHomeSection(link.id);
  };

  const scrollTop = (e) => {
    e.preventDefault();
    setMobileOpen(false);
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

  return (
    <>
      <div className={`jitter-nav-wrapper${mobileOpen ? ' mobile-menu-open' : ''}`}>
        <nav className={`jitter-nav-full${hidden ? ' hidden' : ''}`} aria-label="Main navigation">
          <a href="/" className="jnav-logo" onClick={scrollTop}>
            <img src={logoIcon} alt="Seevora Logo" className="logo-icon-img" decoding="async" />
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
      </div>
 
      <div className={`mobile-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`}>
        <div className="mobile-nav-header">
          <a href="#" className="jnav-logo mobile-logo" onClick={(e) => { scrollTop(e); setMobileOpen(false); }}>
            <img src={logoIcon} alt="" className="logo-icon-img" />
            <span className="logo-text">Seevora</span>
          </a>
          <button className="mobile-nav-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        {links.map((l) => (
          <a key={l.id || l.path} href={l.path || `#${l.id}`} onClick={(e) => handleNav(e, l)}>
            {l.label}
          </a>
        ))}
        <button className="btn-primary" style={{ width: '100%', marginTop: '16px', marginBottom: '12px' }} onClick={(e) => handleNav(e, { path: '/login' })}>
          Login
        </button>
        <button className="btn-primary" style={{ width: '100%', marginBottom: '24px' }} onClick={(e) => handleNav(e, { path: '/book-a-call' })}>
          Book a call
        </button>
      </div>
    </>
  );
}
