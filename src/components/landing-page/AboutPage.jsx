import React, { useState, useEffect, useRef } from 'react';

const pillars = [
  {
    id: 'company-intro',
    label: '01',
    title: 'Company Intro',
    desc: 'Practical AI systems for measurable business growth.',
    text: 'Seevora builds custom AI SaaS and automation systems that turn everyday operations into faster, smarter, trackable growth engines. Every solution is designed around real workflows, not generic templates.',
    img: '/pillar_company_intro.jpg',
    imgAlt: 'Seevora team collaborating with data dashboards and analytics',
    layout: 'img-left', // image LEFT, text RIGHT
  },
  {
    id: 'how-we-work',
    label: '02',
    title: 'How We Work',
    desc: 'We start with one process and make it perform.',
    text: 'Our team identifies a high-impact workflow, audits the friction, builds a tailored AI system, and keeps improving it until the results are visible in speed, cost, accuracy, and ROI.',
    img: '/pillar_how_we_work.jpg',
    imgAlt: 'Step-by-step success roadmap: Idea → Planning → Strategy → Success',
    layout: 'img-right', // text LEFT, image RIGHT
  },
  {
    id: 'our-mission',
    label: '03',
    title: 'Our Mission',
    desc: 'Make AI useful for the work businesses repeat every day.',
    text: 'Our mission is to help teams reduce manual effort, remove operational bottlenecks, and scale confidently with AI solutions that are clear, practical, and built to deliver value within months.',
    img: '/pillar_mission.jpg',
    imgAlt: 'Our Mission — building the future with clear purpose',
    layout: 'img-left', // image LEFT, text RIGHT
  },
  {
    id: 'our-vision',
    label: '04',
    title: 'Our Vision',
    desc: 'A future where every business runs on smarter systems.',
    text: 'We envision companies across manufacturing, BFSI, logistics, healthcare, retail, and beyond using AI as a dependable operating layer for faster decisions and better outcomes.',
    img: '/pillar_vision.jpg',
    imgAlt: 'Hold the Vision. Trust the Process. — Seevora office',
    layout: 'img-right', // text LEFT, image RIGHT
    objectPosition: 'center 20%',
    imgHeight: 560,
  },
];

const badges = [
  '7+ Sectors Served', '6 Active AI Modules', '5-Day Rapid Setup',
  '24/7 Autopilot Support', 'Indore-Based Engineering', 'Strict Zero-Sale Data Policy',
  '99.9% System Uptime', 'Full Hinglish/Hindi Voice Capability',
];

const details = [
  { title: 'Bilingual Voice & Chat Automation', desc: 'Communication styled for local markets.', text: 'Seevora AI agents switch languages on-the-fly. Whether customer queries are in clean English, Hindi, or a mix of both (Hinglish), our models understand intent, context, and accents perfectly.' },
  { title: 'Indore-Based Direct Engineering Access', desc: 'We are part of your team, not a support queue.', text: 'As a Seevora client, you get direct WhatsApp group access to the specific engineers in Indore who configured your calendar matrices, database syncs, and voice scripts. Same-day deployments, always.' },
  { title: 'Strict Data Residency & Privacy Protocol', desc: 'Your customer data is entirely yours.', text: 'Operating under CIN: U62011MP2026PTC082651, Seevora follows rigid privacy guidelines. We apply a Zero-Sale policy — your data is encrypted at rest and in transit. Never sold or rented.' },
  { title: 'Deep Multi-Channel Integrations', desc: 'Seamless connections to your current stack.', text: 'We configure webhook handshakes and database APIs to route patient reservations, fee confirmations, or real-estate inquiries directly into your existing CRM, calendars, and payment gateways.' },
  { title: 'Setup & Refined in 5 Days', desc: 'Speed-to-value is our operating metric.', text: 'Our team completes initial requirements freezing, maps out calendar systems, trains custom conversational voice weights, and pushes your chatbot/receptionist live in just 5 business days.' },
];

export default function AboutPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [animDir, setAnimDir] = useState('down'); // 'down' | 'up'
  const itemRefs = useRef([]);
  const activeIdxRef = useRef(0);

  const pillarRowsRef = useRef(null);

  const handleGoBack = (e) => { e.preventDefault(); window.location.assign('/'); };
  const handleBookCall = (e) => { e.preventDefault(); window.location.assign('/book-a-call'); };

  /* ── Reveal pillar rows on scroll ── */
  useEffect(() => {
    const rows = document.querySelectorAll('.pillar-alt-row');
    if (!rows.length) return;

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('pillar-alt-row--visible');
          obs.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    rows.forEach((row) => obs.observe(row));
    return () => obs.disconnect();
  }, []);

  /* ── IntersectionObserver: detect which text panel is in viewport center ── */
  useEffect(() => {
    const observers = [];

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const prev = activeIdxRef.current;
            setAnimDir(idx > prev ? 'down' : 'up');
            setPrevIdx(prev);
            setActiveIdx(idx);
            activeIdxRef.current = idx;
          }
        },
        { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section className="about-page">
      <div className="bg-grid" />
      <div className="container">

        {/* Hero */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 className="section-title">About <span className="gradient-text">Seevora</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '650px' }}>
            Building the next generation of custom automation, smart voice agents, and practical SaaS products.
          </p>
        </div>

        {/* Identity + Badges */}
        <div className="about-page-intro" data-animate>
          <div className="about-intro-text">
            <h3>Our Identity</h3>
            <p>Seevora Private Limited is an AI company based in Indore, Madhya Pradesh. We focus on building custom automation, practical SaaS products, and digital workflows designed to eliminate repetitive manual bottlenecks.</p>
            <p style={{ marginTop: '16px' }}>Unlike generic, off-the-shelf chatbot software, our engineering team works directly with business owners to audit existing workflows. We write custom integrations and train specialized models so that the AI functions precisely as a trained human team member would.</p>
          </div>
          <div className="about-page-badges-container">
            <h4>Seevora at a Glance</h4>
            <div className="about-page-badges-grid">
              {badges.map((b, idx) => (
                <div key={idx} className="about-page-badge-item" data-animate="about-badge" style={{ transitionDelay: `${idx * 0.045}s` }}>
                  <span className="badge-bullet" /><span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pillars: Alternating left-right layout ── */}
        <div className="pillars-section">
          <div className="pillars-section__header" data-animate>
            <h3 className="about-section-h3">The Pillars of Our Operations</h3>
            <p className="pillars-section__sub">
              Four foundational principles that shape every system we build and every relationship we form.
            </p>
          </div>

          <div className="pillars-alt-list">
            {pillars.map((p, idx) => (
              <div
                key={p.id}
                className={`pillar-alt-row pillar-alt-row--${p.layout}`}
              >
                {/* Image side */}
                <div className="pillar-alt-img-wrap">
                  <div
                    className="pillar-alt-img-frame"
                    style={p.imgHeight ? { height: `${p.imgHeight}px` } : undefined}
                  >
                    <img
                      src={p.img}
                      alt={p.imgAlt}
                      className="pillar-alt-img"
                      loading="lazy"
                      draggable="false"
                      style={p.objectPosition ? { objectPosition: p.objectPosition } : undefined}
                    />
                    <div className="pillar-alt-img-overlay" />
                    <span className="pillar-alt-badge">{p.label}</span>
                  </div>
                </div>

                {/* Text side */}
                <div className="pillar-alt-text">
                  <span className="pillar-alt-num">{p.label} / 04</span>
                  <div className="pillar-alt-bar" />
                  <h4 className="pillar-alt-title">{p.title}</h4>
                  <p className="pillar-alt-desc">{p.desc}</p>
                  <p className="pillar-alt-body">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deep Dive */}
        <div className="about-details-section" data-animate>
          <h3 className="about-section-h3" style={{ textAlign: 'center', marginBottom: '40px', marginTop: '60px' }}>
            How Seevora Delivers Operational Excellence
          </h3>
          <div className="about-details-list">
            {details.map((d, idx) => (
              <div key={idx} className="about-detail-card" data-animate="about-detail-card" style={{ transitionDelay: `${idx * 0.08}s` }}>
                <div className="about-detail-num">0{idx + 1}</div>
                <div className="about-detail-content">
                  <h4>{d.title}</h4><h5>{d.desc}</h5><p>{d.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="about-bottom-cta" data-animate>
          <h3>Ready to automate your manual workflows?</h3>
          <p>Let our Indore-based engineering team audit your bottlenecks and build a custom AI roadmap for your business.</p>
          <div className="about-cta-buttons">
            <a href="#" className="btn-glass" onClick={handleGoBack}>Return to Home</a>
            <a href="#" className="btn-primary" onClick={handleBookCall}>
              Book a Custom Audit
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
