import React, { useEffect, useRef, useState } from 'react';

const problemTabs = [
  {
    key: 'clinics',
    label: 'Clinic Missed Calls',
    color: 'cyan',
    title: 'Clinics Losing Patients to Missed Calls',
    desc: 'Every unanswered call at a clinic or practice is a patient lost to a competitor. Seevora answers 24/7, books appointments, and captures every patient enquiry.',
    checklist: [
      'Instantly answers patient enquiries after hours',
      'Books appointments directly into the calendar',
      'Captures missed-call leads before competitors do'
    ],
    statusLabel: 'Seevora AI Status: Covering Calls',
    metricVal: '24/7',
    metricLbl: 'CARE COVERAGE',
    bars: [
      { name: 'Call Capture', val: '96%' },
      { name: 'Booking Flow', val: '88%' }
    ],
    icon: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.78 19.78 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.61a2 2 0 0 1-.45 2.11L8.09 9.64a16 16 0 0 0 6.27 6.27l1.2-1.2a2 2 0 0 1 2.11-.45c.84.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92z" /></svg>
  },
  {
    key: 'salons',
    label: 'Studio No-Shows',
    color: 'purple',
    title: 'Salons & Studios Damaged by No-Shows',
    desc: 'Low-commitment online bookings lead to empty chairs and lost staff time. Our automated WhatsApp confirmations and smart waitlists reduce no-shows by 30-40%.',
    checklist: [
      'Confirms bookings automatically on WhatsApp',
      'Fills cancellation slots from smart waitlists',
      'Reminds clients before staff time is wasted'
    ],
    statusLabel: 'Seevora AI Status: Protecting Slots',
    metricVal: '40%',
    metricLbl: 'NO-SHOW REDUCTION',
    bars: [
      { name: 'Reminder Reach', val: '92%' },
      { name: 'Slot Recovery', val: '78%' }
    ],
    icon: <svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
  },
  {
    key: 'consultants',
    label: 'Consultant Follow-ups',
    color: 'green',
    title: 'CAs & Consultants Buried in Follow-ups',
    desc: 'Chasing clients for documents, tax receipts, and signatures wastes hours daily. Seevora automates file collection, reminders, and payment links.',
    checklist: [
      'Collects files and receipts through guided reminders',
      'Sends payment links without manual chasing',
      'Flags pending signatures before deadlines'
    ],
    statusLabel: 'Seevora AI Status: Chasing Tasks',
    metricVal: '8h',
    metricLbl: 'WEEKLY TIME SAVED',
    bars: [
      { name: 'Document Collection', val: '84%' },
      { name: 'Payment Follow-up', val: '80%' }
    ],
    icon: <svg viewBox="0 0 24 24"><path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zM3 8l2-3h14l2 3M9 13h6" /></svg>
  },
  {
    key: 'coaches',
    label: 'Lead Overload',
    color: 'blue',
    title: 'Coaches & Institutes Overloaded with Leads',
    desc: 'Admissions and inquiries bring chaotic WhatsApp chats, phone calls, and forms. Seevora parses them into a single CRM pipeline with hot priority alerts.',
    checklist: [
      'Turns WhatsApp, calls, and forms into CRM records',
      'Prioritizes hot admission enquiries instantly',
      'Keeps counsellors focused on qualified leads'
    ],
    statusLabel: 'Seevora AI Status: Sorting Leads',
    metricVal: '2x',
    metricLbl: 'FASTER RESPONSE',
    bars: [
      { name: 'Lead Routing', val: '90%' },
      { name: 'Priority Alerts', val: '86%' }
    ],
    icon: <svg viewBox="0 0 24 24"><path d="M3 7h7l2 3h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7V5a2 2 0 0 1 2-2h5l2 4" /></svg>
  },
  {
    key: 'seo',
    label: 'Local SEO Failure',
    color: 'orange',
    title: 'Gyms & Local Services Failing Local SEO',
    desc: 'Without active Google reviews and quick replies, local service businesses rank low. Automated review prompts and local SEO boost Google visibility by 2x.',
    checklist: [
      'Requests reviews from satisfied customers automatically',
      'Improves reply speed on local discovery channels',
      'Builds a stronger Google visibility loop'
    ],
    statusLabel: 'Seevora AI Status: Growing Visibility',
    metricVal: '2x',
    metricLbl: 'LOCAL VISIBILITY',
    bars: [
      { name: 'Review Requests', val: '82%' },
      { name: 'Local Discovery', val: '74%' }
    ],
    icon: <svg viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
  },
];

const benefits = [
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2.06 2.06 0 0 1-2.91 2.91l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2.06 2.06 0 0 1-4.12 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2.06 2.06 0 0 1-2.91-2.91l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2.06 2.06 0 0 1 0-4.12h.09A1.7 1.7 0 0 0 4.6 8.82a1.7 1.7 0 0 0-.34-1.88L4.2 6.88a2.06 2.06 0 0 1 2.91-2.91l.06.06a1.7 1.7 0 0 0 1.88.34h.01A1.7 1.7 0 0 0 10.08 2.8V2.7a2.06 2.06 0 0 1 4.12 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2.06 2.06 0 0 1 2.91 2.91l-.06.06a1.7 1.7 0 0 0-.34 1.88v.01a1.7 1.7 0 0 0 1.56 1.03h.09a2.06 2.06 0 0 1 0 4.12h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    ),
    title: 'Fully Customised',
    desc: 'No generic templates. Every voice receptionist and automated pipeline is custom-trained on your specific business rules.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 4h16v16H4z" />
        <path d="M4 8h16" />
        <path d="M4 16h16" />
        <path d="M12 4v16" />
        <path d="M12 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" />
      </svg>
    ),
    title: 'Hindi-First AI',
    desc: 'Voice agents and automated chat reply fluently in Hindi, English, and regional mixes, matching the local tongue.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="m13 2-8 10h6l-1 10 8-10h-6l1-10Z" />
      </svg>
    ),
    title: 'Ready in 5 Days',
    desc: 'We map your specific salon, clinic, or coaching workflow and launch your custom AI live in just 5 business days.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="m3 7 9-4 9 4-9 4-9-4Z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </svg>
    ),
    title: 'One Platform',
    desc: 'Consolidates voice receptionist, WhatsApp queries, client reservations, follow-ups, and reviews in one screen.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 12a8 8 0 0 1 16 0" />
        <path d="M4 12v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
        <path d="M20 12v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
        <path d="M14 19h2a4 4 0 0 0 4-4" />
        <path d="M10 19h4" />
      </svg>
    ),
    title: 'Dedicated Support',
    desc: 'Skip generic tickets. Direct WhatsApp access to your custom engineering support team for real-time updates.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3 8.5 6.2 4 7l1.6 4.2L4 15l4.4.8L12 21l3.6-5.2L20 15l-1.6-3.8L20 7l-4.5-.8L12 3Z" />
        <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />
      </svg>
    ),
    title: 'Built for Indian SMBs',
    desc: 'Integrated with Indian business requirements — WhatsApp-first workflows, dial-in calls, and UPI billing reminders.'
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

function Hero() {
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
        <div className="hero-float-card hero-float-card-left">
          <span>24/7</span>
          <strong>AI RESPONSE</strong>
        </div>
        <div className="hero-float-card hero-float-card-right">
          <span>40%</span>
          <strong>FEWER NO-SHOWS</strong>
        </div>
        <div className="hero-float-card hero-float-card-bottom">
          <span>5 Days</span>
          <strong>LAUNCH READY</strong>
        </div>
      </div>

      <div className="container">
        <div className="hero-content centered" data-animate>
          <div className="hero-eyebrow">
            <span className="dot" />
            AI Growth Platform
          </div>

          <h1 className="hero-title centered">
            <span style={{ whiteSpace: 'nowrap' }}>Turn Your Business</span><br />
            <span style={{ whiteSpace: 'nowrap' }}>Processes into</span><br />
            <span style={{ whiteSpace: 'nowrap' }}><span className="gradient-text">Profit Centers</span></span><br />
            <span style={{ whiteSpace: 'nowrap' }}> With AI.</span>
          </h1>

          <p className="hero-description centered">
            Seevora builds custom AI SaaS solutions designed to solve real business problems, not generic chatbot tools or overpriced consulting decks. We focus on one process at a time, automate it intelligently, and make sure it pays for itself.
          </p>

          <div className="hero-buttons centered">
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
              onClick={() => document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Solutions
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg className="check-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Problems() {
  const [activeKey, setActiveKey] = useState(problemTabs[0].key);
  const active = problemTabs.find((problem) => problem.key === activeKey) || problemTabs[0];
  const renderDetail = (problem) => (
    <div className={`problem-detail-card border-${problem.color}`}>
      <div>
        <div className="problem-detail-header">
          <div className={`problem-detail-icon-wrapper icon-${problem.color}`}>{problem.icon}</div>
          <h3>{problem.title}</h3>
        </div>
        <p className="problem-detail-desc">{problem.desc}</p>
        <ul className="problem-checklist">
          {problem.checklist.map((item) => (
            <li key={item}><CheckIcon />{item}</li>
          ))}
        </ul>
      </div>

      <div className="problem-status-widget">
        <div className="widget-status-header"><span className="pulse-dot" />{problem.statusLabel}</div>
        <div className="widget-metric-block">
          <div className="widget-metric-val">{problem.metricVal}</div>
          <div className="widget-metric-lbl">{problem.metricLbl}</div>
        </div>
        <div className="widget-progress-bars">
          {problem.bars.map((bar) => (
            <div className="widget-progress-bar" key={bar.name}>
              <div className="progress-bar-labels"><span>{bar.name}</span><span>{bar.val}</span></div>
              <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: bar.val }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="problems section" id="problems">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Problems We Solve
          </div>
          <h2 className="section-title">
            Why Indian Businesses <span className="gradient-text">Lose Growth</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            These are the critical operational failures costing Indian SMBs lakhs every month.
          </p>
        </div>

        <div className="problems-showcase" data-animate>
          <div className="problems-tab-rail">
            {problemTabs.map((problem) => (
              <div className="problem-tab-wrapper" key={problem.key}>
                <button
                  className={`problem-tab-btn problem-tab-btn--${problem.color} ${activeKey === problem.key ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActiveKey(problem.key)}
                  onMouseEnter={() => setActiveKey(problem.key)}
                  onFocus={() => setActiveKey(problem.key)}
                >
                  <span className={`problem-btn-icon-wrapper icon-${problem.color}`}>{problem.icon}</span>
                  <span className="problem-btn-label">{problem.label}</span>
                </button>
                <div className={`problem-accordion-card-container ${activeKey === problem.key ? 'expanded' : ''}`}>
                  {renderDetail(problem)}
                </div>
              </div>
            ))}
          </div>

          <div className="problem-desktop-card-container">
            {renderDetail(active)}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySeevora() {
  return (
    <section className="why-seevora section" id="why-seevora">
      <div className="container">
        <div data-animate style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Why Seevora
          </div>
          <h2 className="section-title">
            The Seevora <span className="gradient-text">Difference</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Built specifically to solve the operational bottlenecks of Indian local businesses.
          </p>
        </div>

        <div className="why-seevora-grid why-seevora-grid--cards">
          {benefits.map((b, i) => (
            <div
              key={i}
              className={`why-card ${i < 2 ? 'why-card--featured' : ''}`}
              data-animate="tilt-in"
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              <div className="why-card-icon">{b.icon}</div>
              <div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="workflow section" id="workflow">
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Our Process</div>
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
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Proven Impact</div>
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
    <>
      <Hero />
      <Problems />
      <WhySeevora />
      <Workflow />
      <Stats />
    </>
  );
}
