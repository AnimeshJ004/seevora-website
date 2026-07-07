import React, { useRef, useCallback } from 'react';
import SEOHead from '../common/SEOHead';
import StructuredData from '../common/StructuredData';
import { pagesSEO } from '../../config/seo';
import { generateOrganizationSchema } from '../../utils/schemaGenerators';

export default function AboutPage() {
  const handleGoBack = (e) => {
    e.preventDefault();
    window.location.assign('/');
  };

  const handleBookCall = (e) => {
    e.preventDefault();
    window.location.assign('/book-a-call');
  };

  const organizationSchema = generateOrganizationSchema();

  const badges = [
    'B2B Sales Optimization',
    'Deep Business Research',
    'Multi-Agent Integration',
    'Software & AI Merging',
    'Massive Time Savings',
    'Business Modernization',
    'Custom AI Ecosystems',
    'Automated Workflows'
  ];

  const pillars = [
    {
      title: 'Company Intro',
      desc: 'Bespoke AI ecosystems for measurable sales growth.',
      text: 'Seevora researches your B2B model and builds integrated AI systems that turn everyday operations into faster, smarter, trackable growth engines. We merge software and AI to modernize your business.',
      stroke: 'var(--accent-cyan)',
      icon: <span className="pillar-dot" />
    },
    {
      title: 'How We Work',
      desc: 'We start by understanding your business model.',
      text: 'Our team conducts deep research into your current operations, identifies where AI can be utilized best, and merges specialized AI agents with your existing software stack to eliminate bottlenecks.',
      stroke: '#a78bfa',
      icon: <span className="pillar-dot" />
    },
    {
      title: 'Our Mission',
      desc: 'Make AI useful by seamlessly merging it with software.',
      text: 'Our mission is to help B2B clients save massive amounts of time by integrating multiple specialized AI agents into their workflows, allowing their teams to focus entirely on closing sales and driving revenue.',
      stroke: 'var(--accent-green)',
      icon: <span className="pillar-dot" />
    },
    {
      title: 'Our Vision',
      desc: 'A future where every B2B model runs on smarter systems.',
      text: 'We envision a landscape where complex software and multiple AI agents operate in perfect harmony, serving as a dependable, modernized operating layer for B2B companies worldwide.',
      stroke: 'var(--accent-orange)',
      icon: <span className="pillar-dot" />
    }
  ];

  const details = [
    {
      title: 'Deep Business Research & Auditing',
      desc: 'We don\'t just sell generic software.',
      text: 'Before writing a single line of code, we study your specific B2B model. We map out your workflows, identify data bottlenecks, and pinpoint the exact areas where AI integration can revolutionize your daily operations.'
    },
    {
      title: 'Multi-Agent & Software Merging',
      desc: 'Creating a unified, automated engine.',
      text: 'We deploy multiple specialized AI agents and seamlessly fuse them with your existing software ecosystem. Whether it\'s CRMs, ERPs, or custom tools, we ensure all systems communicate and function as a single modernized unit.'
    },
    {
      title: 'Massive Time & Resource Savings',
      desc: 'Eliminating manual bottlenecks completely.',
      text: 'By automating complex workflows and data handoffs between systems, we remove the need for repetitive manual effort. This saves your team countless hours every week, allowing them to focus on high-value strategic tasks.'
    },
    {
      title: 'Sales Automation & Acceleration',
      desc: 'The ultimate goal is to drive growth.',
      text: 'We modernize your operations specifically to accelerate your B2B sales cycles. By offloading redundant tasks to merged AI agents, your sales team is empowered to close deals faster and handle a significantly larger pipeline.'
    },
    {
      title: 'End-to-End Business Modernization',
      desc: 'Transforming how you operate.',
      text: 'We handle the complete digital transformation of your business. From the initial research phase to the final software merge, we ensure that your new AI-powered model operates flawlessly and scales effortlessly.'
    }
  ];

  return (
    <>
      <SEOHead
        title={pagesSEO.about.title}
        description={pagesSEO.about.description}
        keywords={pagesSEO.about.keywords}
        path={pagesSEO.about.path}
        image={pagesSEO.about.image}
        type={pagesSEO.about.type}
      />
      <StructuredData data={organizationSchema} />

      <section className="about-page">
      <div className="bg-grid" />
      <div className="container">
        
        {/* Hero Section */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">About <span className="gradient-text">Seevora</span></span>
            </span>
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
              Seevora is a technology integration company specializing in B2B sales automation and operational modernization. We don't just offer off-the-shelf SaaS products; we take the time to deeply research and understand your unique business model. By identifying exact areas for optimization, we merge specialized AI agents with your existing software ecosystem to modernize your entire workflow.
            </p>
            <p style={{ marginTop: '16px' }}>
              Our engineering team focuses on deploying multiple AI agents that communicate flawlessly with your current tools. This deep software merging strategy eliminates repetitive manual bottlenecks, saves your team massive amounts of time, and ultimately serves to accelerate your B2B sales cycles.
            </p>
          </div>
          <div className="about-page-badges-container">
            <h4>Seevora at a Glance</h4>
            <div className="about-page-badges-grid">
              {badges.map((b, idx) => (
                <div
                  key={idx}
                  className="about-page-badge-item"
                  data-animate="about-badge"
                  style={{ transitionDelay: `${idx * 0.045}s` }}
                >
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
              <div
                key={idx}
                className="about-detail-card"
                data-animate="about-detail-card"
                style={{ transitionDelay: `${idx * 0.08}s` }}
              >
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
          <h3>Ready to modernize your B2B workflows?</h3>
          <p>Let our engineering team research your business model and build a custom AI agent ecosystem for you.</p>
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
    </>
  );
}

// TiltCard Component

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
