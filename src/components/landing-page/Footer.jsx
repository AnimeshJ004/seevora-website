import React, { useState } from 'react';
import logoIcon from '../../assets/logo-icon.png';

const socials = [
  { label:'Instagram', href:'https://www.instagram.com/seevora1/', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
  { label:'X', href:'https://x.com/seevora1', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.1177z"/></svg> },
  { label:'Facebook', href:'https://www.facebook.com/people/Seevora/61574331010641/', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12V24h6.114C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z"/></svg> },
  { label:'LinkedIn', href:'https://www.linkedin.com/company/seevora/', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { label:'YouTube', href:'https://www.youtube.com/@Seevora1', icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
];

const contactIconStyle = { width: '16px', height: '16px', flexShrink: 0, marginRight: '8px', verticalAlign: 'text-bottom' };

const PhoneIcon = () => (
  <svg style={contactIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.78 19.78 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.61a2 2 0 0 1-.45 2.11L8.09 9.64a16 16 0 0 0 6.27 6.27l1.2-1.2a2 2 0 0 1 2.11-.45c.84.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon = () => (
  <svg style={contactIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

const LocationIcon = () => (
  <svg style={contactIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export default function Footer() {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (id.startsWith('services#')) {
      const hash = id.substring(9);
      window.location.assign(`/services#${hash}`);
      return;
    }
    if (id.startsWith('modules#')) {
      const hash = id.substring(8);
      window.location.assign(`/modules#${hash}`);
      return;
    }
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
              <img src={logoIcon} alt="Seevora" loading="lazy" decoding="async" />
              <span>Seevora</span>
            </a>
            <p className="footer-tagline">Custom AI SaaS, intelligent automations, and AI products designed around the way your business actually works.</p>
            <div className="footer-contact-list">
              <span><PhoneIcon /><a href="tel:+918982200895">+91 89822 00895</a></span>
              <a href="mailto:info@seevora.in"><MailIcon />info@seevora.in</a>
              <span><LocationIcon />Indore, Madhya Pradesh</span>
            </div>
          </div>

          {/* Services Column */}
          <div className={`footer-col ${openSection === 'services' ? 'open' : ''}`}>
            <h5 onClick={() => toggleSection('services')}>
              Services
              <span className="footer-toggle-icon" aria-hidden="true">+</span>
            </h5>
            <div className="footer-links-wrapper">
              <a href="/services#healthcare" onClick={e => handleScrollTo(e, 'services#healthcare')}>Healthcare</a>
              <a href="/services#education" onClick={e => handleScrollTo(e, 'services#education')}>Education</a>
              <a href="/services#wellness" onClick={e => handleScrollTo(e, 'services#wellness')}>Personal Care</a>
              <a href="/services#diagnostics" onClick={e => handleScrollTo(e, 'services#diagnostics')}>Diagnostics</a>
              <a href="/services#fitness" onClick={e => handleScrollTo(e, 'services#fitness')}>Fitness & Gyms</a>
              <a href="/services#legal" onClick={e => handleScrollTo(e, 'services#legal')}>Legal & CA</a>
              <a href="/services#property" onClick={e => handleScrollTo(e, 'services#property')}>Real Estate</a>
            </div>
          </div>

          {/* Modules Column */}
          <div className={`footer-col ${openSection === 'modules' ? 'open' : ''}`}>
            <h5 onClick={() => toggleSection('modules')}>
              Modules
              <span className="footer-toggle-icon" aria-hidden="true">+</span>
            </h5>
            <div className="footer-links-wrapper">
              <a href="/modules#ai-receptionist" onClick={e => handleScrollTo(e, 'modules#ai-receptionist')}>AI Receptionist</a>
              <a href="/modules#lead-intake" onClick={e => handleScrollTo(e, 'modules#lead-intake')}>Lead Intake Bot</a>
              <a href="/modules#auto-scheduler" onClick={e => handleScrollTo(e, 'modules#auto-scheduler')}>Auto Scheduler</a>
              <a href="/modules#ai-receptionist" onClick={e => handleScrollTo(e, 'modules#ai-receptionist')}>Voice Assistants</a>
              <a href="/modules#lead-intake" onClick={e => handleScrollTo(e, 'modules#lead-intake')}>CRM Syncing</a>
              <a href="/modules#reputation-builder" onClick={e => handleScrollTo(e, 'modules#reputation-builder')}>Reputation Builder</a>
            </div>
          </div>

          {/* Company Column */}
          <div className={`footer-col ${openSection === 'company' ? 'open' : ''}`}>
            <h5 onClick={() => toggleSection('company')}>
              Company
              <span className="footer-toggle-icon" aria-hidden="true">+</span>
            </h5>
            <div className="footer-links-wrapper">
              <a href="/about">About Us</a>
              <a href="#why-seevora" onClick={e => handleScrollTo(e, 'why-seevora')}>Why Seevora</a>
              <a href="/faqs">FAQs</a>
              <a href="/book-a-call">Book a Call</a>
            </div>
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
