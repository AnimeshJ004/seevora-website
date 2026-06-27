import React from 'react';
import GlassCard from './GlassCard';

export default function About() {
  return (
    <section className="about section" id="about">
      <div className="wireframe-sphere" />
      <div className="container">
        <div data-animate>
          <div className="section-label"><span className="dot" />Who We Are</div>
          <h2 className="section-title">About <span className="gradient-text">Seevora</span></h2>
        </div>

        <div className="about-content">
          <div className="about-text" data-animate="slide-left">
            <h3>Our Philosophy</h3>
            <p>
              Seevora was founded on a simple belief: AI should pay for itself. We don't build
              science experiments — we build production-grade AI systems that deliver measurable ROI
              within 90 days.
            </p>
            <h3>What Sets Us Apart</h3>
            <p>
              Unlike consultancies that deliver decks or tool vendors that sell generic platforms,
              Seevora operates as your embedded AI engineering team. We own the outcome, not just the
              output. Every solution is custom-built for your exact process, your data, and your
              compliance requirements.
            </p>
            <h3>Our Commitment</h3>
            <p>
              We focus on one process at a time, perfect it, then move to the next. Laser focus means
              faster deployment, higher accuracy, and real business impact — not vaporware demos.
            </p>
          </div>

          <div className="about-cards" data-animate="slide-right">
            <GlassCard>
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                Mission
              </h4>
              <p>To transform enterprise operations by making intelligent automation accessible, measurable, and self-funding for every organization.</p>
            </GlassCard>

            <GlassCard>
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                Vision
              </h4>
              <p>A world where every repetitive business process is handled by intelligent systems, freeing humans to focus on creativity and growth.</p>
            </GlassCard>

            <GlassCard>
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Values
              </h4>
              <p>Transparency in process, accountability in outcomes, and relentless focus on delivering measurable business value — not just technology.</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
