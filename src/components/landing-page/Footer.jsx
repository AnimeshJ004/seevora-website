import React from 'react';
import logoIcon from '../../assets/logo-icon.png';

const socials = [
  { label:'Instagram', href:'https://www.instagram.com/seevora1/', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
  { label:'X', href:'https://x.com/seevora1', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.1177z"/></svg> },
  { label:'Facebook', href:'https://www.facebook.com/people/Seevora/61574331010641/', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12V24h6.114C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z"/></svg> },
  { label:'LinkedIn', href:'https://www.linkedin.com/company/seevora/', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { label:'YouTube', href:'https://www.youtube.com/@Seevora1', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
];

export default function Footer() {
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (window.location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.assign(`/#${id}`);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-watermark">SEEVORA</div>
      <div className="footer-inner">

        {/* Main columns */}
        <div className="footer-cols">
          {/* Brand */}
          <div className="footer-brand">
            <a href="#" className="footer-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top:0, behavior:'smooth' }); }}>
              <img src={logoIcon} alt="Seevora" />
              <span>Seevora</span>
            </a>
            <p className="footer-tagline">Custom AI SaaS, intelligent automations, and AI products designed around the way your business actually works.</p>
            <div className="footer-contact-list">
              <span>📞 <a href="tel:+918269297967">+91 82692 97967</a>, <a href="tel:+919827305577">+91 98273 05577</a></span>
              <a href="mailto:docivoseevora@gmail.com">✉️ docivoseevora@gmail.com</a>
              <span>📍 Indore, Madhya Pradesh</span>
            </div>
          </div>

          {/* Services Column */}
          <div className="footer-col">
            <h5>Services</h5>
            <a href="#industries" onClick={e => handleScrollTo(e, 'industries')}>Healthcare</a>
            <a href="#industries" onClick={e => handleScrollTo(e, 'industries')}>Education</a>
            <a href="#industries" onClick={e => handleScrollTo(e, 'industries')}>Personal Care</a>
            <a href="#industries" onClick={e => handleScrollTo(e, 'industries')}>Diagnostics</a>
            <a href="#industries" onClick={e => handleScrollTo(e, 'industries')}>Fitness & Gyms</a>
            <a href="#industries" onClick={e => handleScrollTo(e, 'industries')}>Legal & CA</a>
            <a href="#industries" onClick={e => handleScrollTo(e, 'industries')}>Real Estate</a>
          </div>

          {/* Modules Column */}
          <div className="footer-col">
            <h5>Modules</h5>
            <a href="#modules" onClick={e => handleScrollTo(e, 'modules')}>AI Receptionist</a>
            <a href="#modules" onClick={e => handleScrollTo(e, 'modules')}>Lead Intake Bot</a>
            <a href="#modules" onClick={e => handleScrollTo(e, 'modules')}>Auto Scheduler</a>
            <a href="#modules" onClick={e => handleScrollTo(e, 'modules')}>Voice Assistants</a>
            <a href="#modules" onClick={e => handleScrollTo(e, 'modules')}>CRM Syncing</a>
            <a href="#modules" onClick={e => handleScrollTo(e, 'modules')}>Reputation Builder</a>
          </div>

          {/* Company Column */}
          <div className="footer-col">
            <h5>Company</h5>
            <a href="#about" onClick={e => handleScrollTo(e, 'about')}>About Us</a>
            <a href="#why" onClick={e => handleScrollTo(e, 'why')}>Why Seevora</a>
            <a href="/faqs">FAQs</a>
            <a href="#contact" onClick={e => handleScrollTo(e, 'contact')}>Contact</a>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <div className="footer-policy">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-and-conditions">Terms and Conditions</a>
          </div>
          <div className="footer-social">
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>{s.icon}</a>
            ))}
          </div>
        </div>

        <p className="footer-copyright">© {new Date().getFullYear()} Seevora Private Limited. All rights reserved. Indore, India.</p>
      </div>
    </footer>
  );
}
