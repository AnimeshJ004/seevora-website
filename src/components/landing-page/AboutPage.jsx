import React, { useRef, useCallback } from 'react';

export default function AboutPage() {
  const handleGoBack = (e) => {
    e.preventDefault();
    window.location.assign('/');
  };

  const handleBookCall = (e) => {
    e.preventDefault();
    window.location.assign('/book-a-call');
  };

  const badges = [
    '7+ Sectors Served',
    '6 Active AI Modules',
    '5-Day Rapid Setup',
    '24/7 Autopilot Support',
    'Indore-Based Engineering',
    'Strict Zero-Sale Data Policy',
    '99.9% System Uptime',
    'Full Hinglish/Hindi Voice Capability'
  ];

  const pillars = [
    {
      title: 'Company Intro',
      desc: 'Practical AI systems for measurable business growth.',
      text: 'Seevora builds custom AI SaaS and automation systems that turn everyday operations into faster, smarter, trackable growth engines. Every solution is designed around real workflows, not generic templates.',
      stroke: 'var(--accent-cyan)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      title: 'How We Work',
      desc: 'We start with one process and make it perform.',
      text: 'Our team identifies a high-impact workflow, audits the friction, builds a tailored AI system, and keeps improving it until the results are visible in speed, cost, accuracy, and ROI.',
      stroke: '#a78bfa',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    },
    {
      title: 'Our Mission',
      desc: 'Make AI useful for the work businesses repeat every day.',
      text: 'Our mission is to help teams reduce manual effort, remove operational bottlenecks, and scale confidently with AI solutions that are clear, practical, and built to deliver value within months.',
      stroke: 'var(--accent-green)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      title: 'Our Vision',
      desc: 'A future where every business runs on smarter systems.',
      text: 'We envision companies across manufacturing, BFSI, logistics, healthcare, retail, and beyond using AI as a dependable operating layer for faster decisions and better outcomes.',
      stroke: 'var(--accent-orange)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      )
    }
  ];

  const details = [
    {
      title: 'Bilingual Voice & Chat Automation',
      desc: 'Communication styled for local markets.',
      text: 'Seevora AI agents switch languages on-the-fly. Whether customer queries are in clean English, Hindi, or a mix of both (Hinglish), our models understand intent, context, and accents perfectly. This ensures that personal studios, coaching classes, or retail clients experience zero communication gap.'
    },
    {
      title: 'Indore-Based Direct Engineering Access',
      desc: 'We are part of your team, not a support queue.',
      text: 'We do not hide behind ticket-raising portals. As a Seevora client, you get direct WhatsApp group access to the specific engineers in Indore who configured your calendar matrices, database syncs, and voice scripts. If you need a script tweak or a custom report, we deploy it the same day.'
    },
    {
      title: 'Strict Data Residency & Privacy Protocol',
      desc: 'Your customer data is entirely yours.',
      text: 'Operating under CIN: U62011MP2026PTC082651, Seevora follows rigid privacy guidelines. We apply a Zero-Sale policy: your interaction transcripts, phone audio recordings, appointment lists, and customer detail rows are encrypted at rest and in transit. They are never sold or rented to external marketing modules.'
    },
    {
      title: 'Deep Multi-Channel Integrations',
      desc: 'Seamless connections to your current stack.',
      text: 'Our AI doesn\'t operate in a silo. We configure webhook handshakes and database APIs to route patient reservations, fee confirmations, or real-estate inquiries directly into your existing CRM (like Salesforce, HubSpot, or custom spreadsheets), calendars, and gateways.'
    },
    {
      title: 'Setup & Refined in 5 Days',
      desc: 'Speed-to-value is our operating metric.',
      text: 'Traditional custom software takes months to configure and deploy. Our team completes initial requirements freezing, maps out calendar systems, trains custom conversational voice weights, and pushes your chatbot/receptionist live in just 5 business days.'
    }
  ];

  return (
    <section className="about-page">
      <div className="bg-grid" />
      <div className="container">
        
        {/* Hero Section */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="section-label" style={{ margin: '0 auto 24px' }}>
            <span className="dot" />
            Who We Are
          </div>
          <h2 className="section-title">
            About <span className="gradient-text">Seevora</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '650px' }}>
            Building the next generation of custom automation, smart voice agents, and practical SaaS products.
          </p>
        </div>

        {/* Company Overview & Story */}
        <div className="about-page-intro" data-animate>
          <div className="about-intro-text">
            <h3>Our Identity</h3>
            <p>
              Seevora Private Limited is an AI company based in Indore, Madhya Pradesh. We focus on building custom automation, practical SaaS products, and digital workflows designed to eliminate repetitive manual bottlenecks. We help organizations transition from rigid, manual processes to high-performing, intelligent systems that reduce human overhead, save on operations, and scale what works.
            </p>
            <p style={{ marginTop: '16px' }}>
              Unlike generic, off-the-shelf chatbot software, our engineering team works directly with business owners to audit existing workflows. We write custom integrations and train specialized models so that the AI functions precisely as a trained human team member would.
            </p>
          </div>
          <div className="about-page-badges-container">
            <h4>Seevora at a Glance</h4>
            <div className="about-page-badges-grid">
              {badges.map((b, idx) => (
                <div key={idx} className="about-page-badge-item">
                  <span className="badge-bullet" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Four Core Pillars */}
        <div style={{ marginTop: '80px', marginBottom: '30px' }} data-animate>
          <h3 className="about-section-h3" style={{ textAlign: 'center', marginBottom: '40px' }}>
            The Pillars of Our Operations
          </h3>
          <div className="about-pillars-grid">
            {pillars.map((p, idx) => (
              <GlassCard key={idx} animType="about-card" animDelay={idx * 0.1}>
                <div className="pillar-header" style={{ color: p.stroke }}>
                  {p.icon}
                  <h4>{p.title}</h4>
                </div>
                <p className="pillar-subtitle">{p.desc}</p>
                <p className="pillar-text">{p.text}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Deep Dive / Expanded Points of Company */}
        <div className="about-details-section" data-animate>
          <h3 className="about-section-h3" style={{ textAlign: 'center', marginBottom: '40px', marginTop: '60px' }}>
            How Seevora Delivers Operational Excellence
          </h3>
          <div className="about-details-list">
            {details.map((d, idx) => (
              <div key={idx} className="about-detail-card">
                <div className="about-detail-num">0{idx + 1}</div>
                <div className="about-detail-content">
                  <h4>{d.title}</h4>
                  <h5>{d.desc}</h5>
                  <p>{d.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Block */}
        <div className="about-bottom-cta" data-animate>
          <h3>Ready to automate your manual workflows?</h3>
          <p>Let our Indore-based engineering team audit your bottlenecks and build a custom AI roadmap for your business.</p>
          <div className="about-cta-buttons">
            <a href="#" className="btn-glass" onClick={handleGoBack}>
              Return to Home
            </a>
            <a href="#" className="btn-primary" onClick={handleBookCall}>
              Book a Custom Audit
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

function GlassCard({
  children,
  className = '',
  animType = '',
  animDelay = 0,
  onClick,
  style = {},
}) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  }, []);

  return (
    <div
      className="tilt-card"
      data-animate={animType || undefined}
      style={{
        transitionDelay: animDelay ? `${animDelay}s` : undefined,
        ...style,
      }}
    >
      <div
        ref={cardRef}
        className={`glass-card ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {children}
      </div>
    </div>
  );
}
