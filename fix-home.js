const fs = require('fs');
let code = fs.readFileSync('original_home.jsx', 'utf16le');

// 1. Replace whyReasons
const oldWhyReasonsMatch = code.match(/const whyReasons = \[([\s\S]*?)\];/);
const oldWhyReasonsBody = oldWhyReasonsMatch ? oldWhyReasonsMatch[1] : '';

const newWhyReasons = \const whyReasons = [
  {
    stat: 'B2B',
    statLabel: 'Sales Solutions',
    title: 'Custom B2B Sales Automation',
    desc: 'B2B sales client ke business ke liye tailored solutions. Hum off-the-shelf software nahi dete, aapke exact business operations ke liye custom automation build karte hai.',
    highlight: 'Built for complex B2B pipelines.',
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m13 2-8 10h6l-1 10 8-10h-6l1-10Z" />
      </svg>
    )
  },
  {
    stat: 'Merge',
    statLabel: 'Software & AI',
    title: 'Multiple AI Agents & SW Merge',
    desc: 'Hum sirf ek chatbot nahi dete. Multiple AI agents aur existing software (SW) ko merge karte hai jisse client ka poora business model intelligently automate ho jaye.',
    highlight: 'Seamless software integration.',
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
    title: 'SW Merge Then Sales Growth',
    desc: 'Pehle SW aur AI ko merge karte hai, workflow optimize karte hai, uske baad aggressively B2B sales aur conversion rates boost karte hai.',
    highlight: 'End-to-end revenue generation.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    )
  },\n\ + oldWhyReasonsBody + '\n];';
code = code.replace(/const whyReasons = \[[\s\S]*?\];/, newWhyReasons);

// 2. Replace heroCapabilities
const newHeroCap = \const heroCapabilities = [
  'B2B Sales Automation',
  'Fusion',
  'Deep Business Research',
  'Massive Time Saving',
  'Sales Scaling',
];\;
code = code.replace(/const heroCapabilities = \[[\s\S]*?\];/, newHeroCap);

// 3. Replace HERO_ROTATING_PHRASES
const newHeroPhrases = \const HERO_ROTATING_PHRASES = [
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
];\;
code = code.replace(/const HERO_ROTATING_PHRASES = \[[\s\S]*?\];/, newHeroPhrases);

// 4. Hero Title Reveal Wrappers
code = code.replace(
  /<span className="hero-typed-line hero-typed-3d" style={{ display: 'block', whiteSpace: 'nowrap' }}>\s*Turn Your Business\s*<\/span>/,
  \<span className="reveal-mask">
              <span className="hero-typed-line hero-typed-3d reveal-text" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                Turn Your Business
              </span>
            </span>\
);
code = code.replace(
  /<span className="hero-typed-line hero-typed-3d" style={{ display: 'block', whiteSpace: 'nowrap' }}>\s*Processes into\s*<\/span>/,
  \<span className="reveal-mask">
              <span className="hero-typed-line hero-typed-3d reveal-text delay-1" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                Processes into
              </span>
            </span>\
);
code = code.replace(
  /<span\s*className="hero-typed-line hero-typed-gradient hero-rotating-phrase"\s*style={{ display: 'block', whiteSpace: 'nowrap' }}\s*>\s*<span key={phraseIndex} className="hero-rotating-phrase-text hero-rotating-phrase-text--swap">\s*{HERO_ROTATING_PHRASES\[phraseIndex\]}\s*<\/span>\s*<\/span>/,
  \<span className="reveal-mask">
              <span
                className="hero-typed-line hero-typed-gradient hero-rotating-phrase reveal-text delay-2"
                style={{ display: 'block', whiteSpace: 'nowrap' }}
              >
                <span key={phraseIndex} className="hero-rotating-phrase-text hero-rotating-phrase-text--swap">
                  {HERO_ROTATING_PHRASES[phraseIndex]}
                </span>
              </span>
            </span>\
);
code = code.replace(
  /<span className="hero-typed-line hero-typed-3d" style={{ display: 'block', whiteSpace: 'nowrap' }}>\s*With AI.\s*<\/span>/,
  \<span className="reveal-mask">
              <span className="hero-typed-line hero-typed-3d reveal-text delay-3" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                With AI.
              </span>
            </span>\
);

// 5. WhyChooseSeevora MouseMove + Reveal
code = code.replace(
  /const handleNext = \(\) => {[\s\S]*?return \(\s*<section className="why-choose-seevora section" id="why-seevora">\s*<div className="container">\s*{\/\* Section Header \*\/}\s*<div className="why-motion-header" data-animate="motion-header">\s*<h2 className="section-title">\s*Why <span className="gradient-text">Seevora<\/span> Is the Right Choice\s*<\/h2>\s*<p className="section-subtitle why-motion-subtitle">\s*We're not a generic SaaS tool. Seevora is a custom-built AI automation partner for Indian SMBs — built for your workflow, your language, and your growth.\s*<\/p>\s*<\/div>/,
  \const handleNext = () => {
    setCurrentIndex((prev) => (prev === whyReasons.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width;
    const y = (clientY - top) / height;
    currentTarget.style.setProperty('--mouse-x', \\px\);
    currentTarget.style.setProperty('--mouse-y', \\px\);
    currentTarget.style.setProperty('--mouse-x-inv', \\px\);
    currentTarget.style.setProperty('--mouse-y-inv', \\px\);
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
        </div>\
);

// 6. Workflow Reveal
code = code.replace(
  /<div data-animate style={{ textAlign: 'center' }}>\s*<h2 className="section-title">How It <span className="gradient-text">Works<\/span><\/h2>\s*<p className="section-subtitle" style={{ margin: '0 auto' }}>\s*A structured, transparent approach from discovery to deployment.\s*<\/p>\s*<\/div>/,
  \<div data-animate style={{ textAlign: 'center' }}>
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
        </div>\
);


fs.writeFileSync('src/components/landing-page/HomePage.jsx', code);
console.log('Update Complete!');
