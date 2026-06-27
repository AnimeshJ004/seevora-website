import React from 'react';

export default function FinalCTA() {
  return (
    <section className="final-cta section" id="get-started">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800 }} />
      <div className="container">
        <div className="final-cta-inner" data-animate="scale-in">
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Get Started
          </div>
          <h2 className="final-cta-title">
            Ready to Automate Your<br />
            <span className="gradient-text">Business Operations?</span>
          </h2>
          <p className="final-cta-sub">
            Book a free demo with Seevora. Our Indore team will study your workflow, sector, and goals —
            then show you exactly how AI can be configured for your business. Setup in 5 days. No lock-in.
          </p>
          <div className="final-cta-actions">
            <button
              className="btn-primary"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book a Demo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <a href="https://wa.me/918269297967" target="_blank" rel="noopener noreferrer" className="btn-glass btn-whatsapp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Us
            </a>
          </div>
          <div className="final-cta-trust">
            <span>✓ 5-day setup</span>
            <span>✓ Hindi-first AI</span>
            <span>✓ No lock-in</span>
            <span>✓ Dedicated support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
