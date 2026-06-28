import React, { Suspense } from 'react';
import AIScene3D from './AIScene3D';

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-grid" />
      <div className="hero-noise" />

      <div className="container">
        <div className="hero-content" data-animate="slide-left">
          <div className="hero-eyebrow">
            <span className="dot" />
            AI Growth Platform
          </div>

          <h1 className="hero-title">
            <span style={{ whiteSpace: 'nowrap' }}>Turn Your Business</span><br />
            <span style={{ whiteSpace: 'nowrap' }}>Processes into</span><br />
            <span style={{ whiteSpace: 'nowrap' }}><span className="gradient-text">Profit Centers</span></span><br />
            <span style={{ whiteSpace: 'nowrap' }}> With AI.</span>
          </h1>

          <div style={{ marginBottom: '32px' }}>
            <p className="hero-description" style={{ marginBottom: '10px' }}>
              Seevora builds custom AI SaaS solutions designed to solve real business problems, not generic chatbot tools or overpriced consulting decks.
            </p>
            <p className="hero-description" style={{ marginBottom: 0 }}>
              We focus on one process at a time, automate it intelligently, and make sure it pays for itself.
            </p>
          </div>

          <div className="hero-buttons">
            <button
              className="btn-primary"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book a Call
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="hero-visual" data-animate="slide-right">
          <Suspense fallback={
            <div className="orb-scene">
              <div className="orb-main" />
              <div className="orb-ring" />
              <div className="orb-ring" />
              <div className="orb-ring" />
            </div>
          }>
            <AIScene3D />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
