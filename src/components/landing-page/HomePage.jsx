import React, { useEffect, useRef, useState } from 'react';
import Chatbot from './Chatbot';

const whyReasons = [
  {
    stat: '24/7',
    statLabel: 'Always On',
    title: 'Never Miss a Customer Again',
    desc: 'Seevora\'s AI Voice Receptionist answers every call around the clock — even at 2 AM. No leads lost to voicemail, no patients going to competitors.',
    highlight: 'Zero missed calls, guaranteed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.78 19.78 0 0 1 1.08 3.18 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.84a16 16 0 0 0 6.07 6.07l1.21-1.21a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  },
  {
    stat: '5',
    statLabel: 'Days to Live',
    title: 'Deployed in 5 Business Days',
    desc: 'No months-long setup, no generic SaaS templates. Our engineers map your exact salon, clinic, or CA workflow and launch a fully customised AI system — live in just 5 days.',
    highlight: 'Fastest go-live in the industry.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m13 2-8 10h6l-1 10 8-10h-6l1-10Z" />
      </svg>
    )
  },
  {
    stat: '40%',
    statLabel: 'No-Show Reduction',
    title: 'WhatsApp-First Automation',
    desc: 'Your customers live on WhatsApp — so does Seevora. Automated confirmations, smart waitlists, and follow-up reminders reduce no-shows by 30–40% without lifting a finger.',
    highlight: 'Built for India\'s WhatsApp culture.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    stat: '8h',
    statLabel: 'Saved per Week',
    title: 'Hindi-First, Truly Local',
    desc: 'Our AI speaks your customers\' language — Hindi, English, or Hinglish. No awkward chatbots that sound foreign. Seevora feels natural to every caller and chat user.',
    highlight: 'Fluent in India\'s real language.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    )
  },
  {
    stat: '1',
    statLabel: 'Platform, All Ops',
    title: 'One Dashboard for Everything',
    desc: 'Voice calls, WhatsApp, appointment bookings, document collection, UPI reminders, Google reviews — all visible and manageable from a single clean dashboard.',
    highlight: 'No juggling 10 tools anymore.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    stat: '90',
    statLabel: 'Days ROI',
    title: 'Measurable ROI in 90 Days',
    desc: 'Seevora clients consistently report 40% cost reduction and 2× faster lead response within 90 days. We track every metric so you know exactly what you\'re getting.',
    highlight: 'ROI-backed, not just promised.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    )
  }
];



const steps = [
  {
    title: 'Discovery & Process Mapping',
    desc: 'We audit your operations, identify the highest-ROI automation target, and define measurable success criteria before writing a single line of code.',
  },
  {
    title: 'AI Solution Architecture',
    desc: 'Our engineers design a custom AI pipeline tailored to your data, systems, and compliance requirements — using the right models for each sub-task.',
  },
  {
    title: 'Build, Test & Validate',
    desc: 'We develop and rigorously test your solution against real-world data. Every model is validated for accuracy, speed, and edge-case handling.',
  },
  {
    title: 'Deploy & Optimize',
    desc: 'We deploy into your environment, monitor performance in production, and continuously optimize. You get ongoing support and measurable ROI reporting.',
  },
];

const stats = [
  { value: 40, suffix: '%', label: 'Average Cost Reduction', sublabel: 'Within 90 days of deployment' },
  { value: 10, suffix: '×', label: 'Faster Processing', sublabel: 'Compared to manual workflows' },
  { value: 99, suffix: '%', label: 'Accuracy Rate', sublabel: 'On structured data tasks' },
];

const heroCapabilities = [
  'AI Receptionist',
  'WhatsApp Follow-ups',
  '24/7 AI Response',
  '40% Fewer No-Shows',
  '5 Days Launch Ready',
];

const HERO_ROTATING_PHRASES = [
  'Profit Centers',
  'Revenue Engines',
  'Growth Systems',
  'Smart Workflows',
  'Automation Hubs',
  'Sales Machines',
  'Lead Pipelines',
  'Booking Engines',
  'Client Journeys',
  'AI Workflows',
];

function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % HERO_ROTATING_PHRASES.length);
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="centered-hero" id="hero">
      <div className="hero-curves-bg" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M-140 620C210 430 380 390 720 520C1050 646 1200 610 1580 390" />
          <path d="M-100 720C260 520 470 500 760 620C1030 732 1230 706 1540 520" />
          <path d="M-120 520C220 342 438 312 730 430C1040 556 1220 520 1540 330" />
        </svg>
      </div>

      <div className="hero-reference-scene" aria-hidden="true">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-float-card hero-float-card-left hero-metric-card hero-metric-card--calls">
          <div className="hero-metric-topline">
            <span className="hero-metric-value">92%</span>
            <span className="hero-metric-chip hero-metric-chip--up">+24%</span>
          </div>
          <strong>Missed calls saved</strong>
          <small>AI Receptionist</small>
        </div>
        <div className="hero-float-card hero-float-card-right hero-metric-card hero-metric-card--shows">
          <div className="hero-metric-topline">
            <span className="hero-metric-value">40%</span>
            <span className="hero-metric-chip hero-metric-chip--down">fewer</span>
          </div>
          <strong>No-show reduction</strong>
          <small>WhatsApp reminders</small>
        </div>
        <div className="hero-float-card hero-float-card-bottom hero-chart-card">
          <div className="hero-chart-bars" aria-hidden="true">
            <span style={{ '--bar-h': '64%' }} />
            <span style={{ '--bar-h': '78%' }} />
            <span style={{ '--bar-h': '42%' }} />
            <span style={{ '--bar-h': '90%' }} />
          </div>
          <div className="hero-chart-copy">
            <span>5 days</span>
            <strong>Launch ready</strong>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="hero-content centered" data-animate>
          <h1 className="hero-title centered hero-title-typing">
            <span className="hero-typed-line hero-typed-3d" style={{ display: 'block', whiteSpace: 'nowrap' }}>
              Turn Your Business
            </span>
            <span className="hero-typed-line hero-typed-3d" style={{ display: 'block', whiteSpace: 'nowrap' }}>
              Processes into
            </span>
            <span
              className="hero-typed-line hero-typed-gradient hero-rotating-phrase"
              style={{ display: 'block', whiteSpace: 'nowrap' }}
            >
              <span key={phraseIndex} className="hero-rotating-phrase-text hero-rotating-phrase-text--swap">
                {HERO_ROTATING_PHRASES[phraseIndex]}
              </span>
            </span>
            <span className="hero-typed-line hero-typed-3d" style={{ display: 'block', whiteSpace: 'nowrap' }}>
              With AI.
            </span>
          </h1>

          <div
            className="hero-buttons centered"
          >
            <button
              className="btn-pill btn-pill-primary"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book a Call
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              className="btn-pill btn-pill-secondary"
              onClick={() => document.getElementById('why-seevora')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Solutions
            </button>
          </div>
        </div>
      </div>

      <div className="hero-capability-strip" aria-label="Seevora automation capabilities">
        {heroCapabilities.map((item, index) => (
          <div className="hero-capability-item" key={item}>
            <span className={`hero-capability-mark hero-capability-mark-${index + 1}`} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="M8.5 12h7" />
              </svg>
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}



function WhyChooseSeevora() {
  return (
    <section className="why-choose-seevora section" id="why-seevora">
      <div className="container">
        {/* Section Header */}
        <div className="why-motion-header" data-animate="motion-header">
          <h2 className="section-title">
            Why <span className="gradient-text">Seevora</span> Is the Right Choice
          </h2>
          <p className="section-subtitle why-motion-subtitle">
            We're not a generic SaaS tool. Seevora is a custom-built AI automation partner for Indian SMBs — built for your workflow, your language, and your growth.
          </p>
        </div>

        {/* 3-column reasons grid */}
        <div className="why-motion-grid">
          {whyReasons.map((reason, i) => (
            <div
              key={i}
              data-animate="motion-card"
              style={{ '--motion-delay': `${i * 0.09}s`, '--float-delay': `${i * 0.35}s` }}
              className="why-reason-card"
            >
              {/* Top row: number + stat */}
              <div className="why-card-top">
                <div className="why-card-number">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="why-card-stat">
                  <div className="why-card-stat-value">{reason.stat}</div>
                  <div className="why-card-stat-label">{reason.statLabel}</div>
                </div>
              </div>

              <h3 className="why-card-title">{reason.title}</h3>

              <p className="why-card-desc">{reason.desc}</p>

              {/* Highlight tag */}
              <div className="why-card-highlight">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6F7F33" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{reason.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// WhySeevora replaced by WhyChooseSeevora above

function Workflow() {
  return (
    <section className="workflow section" id="workflow">
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            A structured, transparent approach from discovery to deployment.
          </p>
        </div>

        <div className="workflow-timeline">
          <div className="traveling-dot" />
          {steps.map((step, i) => (
            <div
              key={i}
              className="workflow-step"
              data-animate="tilt-in"
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className="step-number">{i + 1}</div>
              <div className="glass-card">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedCounter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const duration = 2000;
        const startTime = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref} className="stat-number">{count}{suffix}</span>;
}

function Stats() {
  const handleBookCall = () => {
    window.location.assign('/book-a-call');
  };

  return (
    <section className="stats section" id="stats">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <h2 className="section-title">Results You Can <span className="gradient-text">Expect</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Our AI solutions deliver measurable business outcomes from day one.
          </p>
        </div>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-card" data-animate="scale-in" style={{ transitionDelay: `${i * 0.12}s` }}>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
              <div className="stat-label">{s.label}</div>
              <div className="stat-sublabel">{s.sublabel}</div>
            </div>
          ))}
        </div>
        <div className="stats-book-call" data-animate>
          <button className="btn-primary" onClick={handleBookCall}>
            Book a Call
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="stat-disclaimer" data-animate>* Disclaimer: Statistics are based on audited average outcomes across active Seevora client deployments within 90 days of launch.</p>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="home-landing">
      <Hero />
      <WhyChooseSeevora />
      <Workflow />
      <Stats />
      <Chatbot />
    </main>
  );
}
