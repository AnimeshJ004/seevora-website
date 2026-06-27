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
            Enterprise AI Automation
          </div>

          <h1 className="hero-title">
            Turn Business Processes into{' '}
            <span className="gradient-text">Profit Centers</span>
          </h1>

          <p className="hero-description">
            Seevora builds custom AI SaaS solutions that solve real business problems.
            We automate one process at a time, intelligently, and make sure it pays for itself.
          </p>

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
            <button
              className="btn-glass"
              onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Solutions
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
