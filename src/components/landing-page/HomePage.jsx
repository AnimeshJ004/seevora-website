import React, { useEffect, useRef, useState } from 'react';
import img1 from '../../assets/services/img1.jpg';
import imgVoice from '../../assets/services/img-voice.jpg';
import imgHandshake from '../../assets/services/img-handshake.jpg';
import imgAiPlug from '../../assets/services/img-ai-plug.jpg';
import imgOffice from '../../assets/services/img-office.jpg';

const whyReasons = [
  {
    stat: 'B2B',
    statLabel: 'Sales Solutions',
    title: 'Custom B2B Sales Automation',
    desc: 'B2B sales client ke business ke liye tailored solutions. Hum off-the-shelf software nahi dete, aapke exact business operations ke liye custom automation build karte hai.',
    highlight: 'Built for complex B2B pipelines.',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.78 19.78 0 0 1 1.08 3.18 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.84a16 16 0 0 0 6.07 6.07l1.21-1.21a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  },
  {
    stat: '100%',
    statLabel: 'Business Mapping',
    title: 'Deep Research & AI Mapping',
    desc: 'Client lete hai, smjhte hai unka business model. Deep research karke identify karte hai ki kahan AI safely and effectively use kiya ja sakta hai to modernize operations.',
    highlight: 'Data-driven business analysis.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m13 2-8 10h6l-1 10 8-10h-6l1-10Z" />
      </svg>
    )
  },
  {
    stat: 'Merge',
    statLabel: 'Software & AI',
    title: 'Multiple AI Agents & Fusion',
    desc: 'Hum sirf ek chatbot nahi dete. Multiple AI agents aur existing software ko merge karte hai jisse client ka poora business model intelligently automate ho jaye.',
    highlight: 'Seamless software integration.',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    stat: '10x',
    statLabel: 'Time Saving',
    title: 'Massive Client Time Saving',
    desc: 'Manual tasks aur data entry ko AI agents handle karte hai. Client ka massive time saving hota hai, allowing them to focus on closing deals instead of paperwork.',
    highlight: 'Focus on growth, not admin.',
    image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80',
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
    stat: 'Sales',
    statLabel: 'Growth Accelerated',
    title: 'Fusion Then Sales Growth',
    desc: 'Operations automate karke hum business ko itna efficient banate hai ki time aur resources bachte hai, jo directly lead karte hai massive sales growth mein.',
    highlight: 'Efficiency that scales revenue.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    )
  },
  {
    stat: '24/7',
    statLabel: 'Always On',
    title: 'Never Miss a Customer Again',
    desc: 'Seevora\'s AI Voice Receptionist answers every call around the clock - even at 2 AM. No leads lost to voicemail, no patients going to competitors.',
    highlight: 'Zero missed calls, guaranteed.',
    image: imgVoice,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.78 19.78 0 0 1 1.08 3.18 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.84a16 16 0 0 0 6.07 6.07l1.21-1.21a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  },

  {
    stat: '40%',
    statLabel: 'No-Show Reduction',
    title: 'WhatsApp-First Automation',
    desc: 'Your customers live on WhatsApp — so does Seevora. Automated confirmations, smart waitlists, and follow-up reminders reduce no-shows by 30–40% without lifting a finger.',
    highlight: 'Built for India\'s WhatsApp culture.',
    image: imgHandshake,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },

  {
    stat: '1',
    statLabel: 'Platform, All Ops',
    title: 'One Automation for Everything',
    desc: 'Voice calls, WhatsApp, appointment bookings, document collection, UPI reminders, Google reviews — all visible and manageable from a single clean dashboard.',
    highlight: 'No juggling 10 tools anymore.',
    image: imgAiPlug,
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
    image: imgOffice,
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
  'B2B Sales Automation',
  'AI Sales Agents',
  'Deep Business Research',
  'Massive Time Saving',
  'Sales Scaling',
  'Lead Qualification',
  '24/7 Prospecting',
  'Custom AI Ecosystems',
  'CRM Integration',
  'Intelligent Outbound',
];

const HERO_ROTATING_PHRASES = [
  'B2B Sales Engines',
  'Revenue Engines',
  'Fusion',
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
    <section className="bk-hero-section bk-hero-video-section" id="hero">
      {/* === VIDEO BACKGROUND === */}
      <div className="bk-hero-video-bg" aria-hidden="true">
        <video
          className="bk-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          {/* Primary: Futuristic Digital Grid with Dynamic Flow (glowing AI network nodes) */}
          <source src="/hero-bg-primary.mp4" type="video/mp4" />
          {/* Fallback: Abstract Wavy Digital Grid with Floating Particles */}
          <source src="/hero-bg-fallback.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay so text stays readable */}
        <div className="bk-hero-video-overlay" />
      </div>

      <div className="bk-hero-container container">
        <div className="bk-hero-grid bk-hero-grid--video">
          {/* Left Column: Content */}
          <div className="bk-hero-content" data-animate>
            <h1 className="hero-title bk-hero-title hero-title-typing">
              <span className="reveal-mask">
                <span className="hero-typed-line hero-typed-3d reveal-text" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                  Turn Your Business
                </span>
              </span>
              <span className="reveal-mask">
                <span className="hero-typed-line hero-typed-3d reveal-text delay-1" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                  Processes into
                </span>
              </span>
              <span className="reveal-mask">
                <span
                  className="hero-typed-line hero-typed-gradient hero-rotating-phrase reveal-text delay-2"
                  style={{ display: 'block', whiteSpace: 'nowrap' }}
                >
                  <span key={phraseIndex} className="hero-rotating-phrase-text hero-rotating-phrase-text--swap">
                    {HERO_ROTATING_PHRASES[phraseIndex]}
                  </span>
                </span>
              </span>
              <span className="reveal-mask">
                <span className="hero-typed-line hero-typed-3d reveal-text delay-3" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                  With AI.
                </span>
              </span>
            </h1>

            <p className="bk-hero-subtitle">
              Seevora helps businesses automate their operations, accelerate sales, and scale effortlessly — all powered by intelligent AI.
            </p>

            <div className="hero-buttons bk-hero-buttons">
              <button
                className="btn-pill btn-pill-primary bk-btn-primary"
                onClick={() => {
                  window.history.pushState(null, '', '/book-a-call');
                }}
              >
                Book a Call
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="btn-pill btn-pill-secondary bk-btn-secondary"
                onClick={() => document.getElementById('why-seevora')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Solutions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-capability-strip bk-capability-strip" aria-label="Seevora automation capabilities">
        <div className="hero-capability-track">
          {[...heroCapabilities, ...heroCapabilities].map((item, index) => (
            <div className="hero-capability-item" key={`${item}-${index}`}>
              <span className={`hero-capability-mark hero-capability-mark-${(index % heroCapabilities.length) + 1}`} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12.5l2.5 2.5 4.5-4.5" />
                </svg>
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



function WhyChooseSeevora() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? whyReasons.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === whyReasons.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e) => {
    // Skip on mobile — shapes are hidden on mobile and touch events cause repaints
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width;
    const y = (clientY - top) / height;
    currentTarget.style.setProperty('--mouse-x', `${(x - 0.5) * 40}px`);
    currentTarget.style.setProperty('--mouse-y', `${(y - 0.5) * 40}px`);
    currentTarget.style.setProperty('--mouse-x-inv', `${(0.5 - x) * 40}px`);
    currentTarget.style.setProperty('--mouse-y-inv', `${(0.5 - y) * 40}px`);
  };

  return (
    <section className="why-choose-seevora section" id="why-seevora" onMouseMove={handleMouseMove}>
      <div className="why-bg-glow" aria-hidden="true">
        <div className="shape-3d shape-1 parallax-layer-1" />
        <div className="shape-3d shape-2 parallax-layer-2" />
        <div className="shape-3d shape-3 parallax-layer-3" />
      </div>
      <div className="container">
        {/* Section Header */}
        <div className="why-motion-header" data-animate="motion-header">
          <h2 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">Why <span className="gradient-text">Seevora</span> Is the Right Choice</span>
            </span>
          </h2>
          <p className="section-subtitle why-motion-subtitle">
            <span className="reveal-mask">
              <span className="reveal-text delay-1">We're a technology integration company specializing in B2B sales automation. We merge AI agents with your existing software ecosystem to modernize your entire workflow and accelerate sales.</span>
            </span>
          </p>
        </div>

        {/* 3D Carousel */}
        <div className="why-carousel-container">
          <button className="carousel-nav-btn prev" onClick={handlePrev} aria-label="Previous">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="why-carousel-track">
            {whyReasons.map((reason, i) => {
              let positionClass = 'hidden';
              if (i === currentIndex) positionClass = 'active';
              else if (i === (currentIndex - 1 + whyReasons.length) % whyReasons.length) positionClass = 'prev';
              else if (i === (currentIndex + 1) % whyReasons.length) positionClass = 'next';

              return (
                <div
                  key={i}
                  className={`why-carousel-card ${positionClass}`}
                  onClick={() => {
                    if (positionClass === 'prev') handlePrev();
                    if (positionClass === 'next') handleNext();
                  }}
                >
                  {reason.image && (
                    <div className="why-carousel-bg" style={{ backgroundImage: `url(${reason.image})` }} />
                  )}
                  <div className="why-carousel-overlay" />

                  <div className="why-carousel-content">
                    <h3 className="why-carousel-title">{reason.title}</h3>
                    <div className="why-carousel-badge">
                      {reason.stat} {reason.statLabel}
                    </div>
                    <p className="why-carousel-desc">{reason.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="carousel-nav-btn next" onClick={handleNext} aria-label="Next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
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
          <h2 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">How It <span className="gradient-text">Works</span></span>
            </span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            <span className="reveal-mask">
              <span className="reveal-text delay-1">A structured, transparent approach from discovery to deployment.</span>
            </span>
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
          <h2 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">Results You Can <span className="gradient-text">Expect</span></span>
            </span>
          </h2>
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
    </main>
  );
}
