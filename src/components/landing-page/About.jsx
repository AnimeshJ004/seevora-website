import React from 'react';
import GlassCard from './GlassCard';

export default function About() {
  return (
    <section className="about section" id="about">
      <div className="wireframe-sphere" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Who We Are</div>
          <h2 className="section-title">About <span className="gradient-text">Seevora</span></h2>
        </div>
        <div className="about-content">
          <div className="about-text" data-animate>
            <p className="subtitle" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '10px' }}>
              We build systems that drive growth.
            </p>
            <p>
              Seevora Private Limited is an AI company focused on custom automation, practical SaaS products, and measurable operational impact. We help businesses move from manual processes to intelligent systems that save time, reduce costs, and scale what already works.
            </p>
            <div className="about-cred-strip" style={{ marginTop: '32px' }}>
              {['7+ Sectors', '6 AI Modules', '5-Day Setup', '24/7 AI'].map((t, i) => (
                <span key={i} className="about-cred-badge">{t}</span>
              ))}
            </div>
          </div>

          <div className="about-cards">
            <GlassCard animType="about-card" animDelay={0}>
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Company Intro
              </h4>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Practical AI systems for measurable business growth.</p>
              <p>Seevora builds custom AI SaaS and automation systems that turn everyday operations into faster, smarter, trackable growth engines. Every solution is designed around real workflows, not generic tools.</p>
            </GlassCard>

            <GlassCard animType="about-card" animDelay={0.15}>
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                How We Work
              </h4>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>We start with one process and make it perform.</p>
              <p>Our team identifies a high-impact workflow, audits the friction, builds a tailored AI system, and keeps improving it until the results are visible in speed, cost, accuracy, and ROI.</p>
            </GlassCard>

            <GlassCard animType="about-card" animDelay={0.3}>
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Our Mission
              </h4>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Make AI useful for the work businesses repeat every day.</p>
              <p>Our mission is to help teams reduce manual effort, remove operational bottlenecks, and scale confidently with AI solutions that are clear, practical, and built to deliver value within months.</p>
            </GlassCard>

            <GlassCard animType="about-card" animDelay={0.45}>
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
                </svg>
                Our Vision
              </h4>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>A future where every business runs on smarter systems.</p>
              <p>We envision companies across manufacturing, BFSI, logistics, healthcare, retail, and beyond using AI as a dependable operating layer for faster decisions and better outcomes.</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
