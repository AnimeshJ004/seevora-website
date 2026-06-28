import React, { useState } from 'react';

const sectors = [
  {
    num: '01',
    icon: '🏥',
    title: 'Healthcare & Medical',
    sub: 'Clinics, hospitals, specialist practices, multi-branch medical centres',
    pain: 'Missed patient calls, multilingual routing, appointment no-shows',
    solution: 'AI receptionist, appointment reminders, predictive confirmations, reputation management',
    color: 'cyan',
  },
  {
    num: '02',
    icon: '🎓',
    title: 'Education & Skill Development',
    sub: 'Coaching institutes, tuition centres, exam academies, skill training providers',
    pain: 'Admission season overload, fee follow-up, demo class bookings',
    solution: '24/7 enquiry handling, demo class scheduling, UPI payment reminders, credibility content',
    color: 'purple',
  },
  {
    num: '03',
    icon: '💆',
    title: 'Personal Care & Wellness',
    sub: 'Beauty parlours, spa centres, hair studios, skin clinics, grooming services',
    pain: 'Manual slot booking, low repeat visits, weak follow-up',
    solution: 'Slot automation, appointment reminders, review requests, rebooking prompts',
    color: 'pink',
  },
  {
    num: '04',
    icon: '🔬',
    title: 'Diagnostic & Pathology',
    sub: 'Diagnostic laboratories, pathology centres, radiology clinics, health screening',
    pain: 'Test bookings, sample collection requests, report-ready queries',
    solution: 'Booking automation, WhatsApp notifications, patient trust-building website content',
    color: 'blue',
  },
  {
    num: '05',
    icon: '🏋️',
    title: 'Health & Fitness',
    sub: 'Gyms, fitness studios, yoga centres, sports academies, rehabilitation clinics',
    pain: 'Trial class drop-offs, renewal misses, inactive member churn',
    solution: 'Trial booking, renewal reminders, re-engagement campaigns, review/social content',
    color: 'green',
  },
  {
    num: '06',
    icon: '⚖️',
    title: 'Legal & Financial Advisory',
    sub: 'Law firms, CA practices, financial advisors, tax consultants',
    pain: 'Missed enquiries, consultation delays, document collection gaps',
    solution: 'Structured enquiry intake, consultation scheduling, document request reminders',
    color: 'orange',
  },
  {
    num: '07',
    icon: '🏠',
    title: 'Property & Real Estate',
    sub: 'Real estate agents, property dealers, housing developers, commercial consultants',
    pain: 'Slow response, unqualified leads, broker time wasted',
    solution: 'Instant lead qualification by budget/location/timeline and daily hot-lead list',
    color: 'cyan',
  },
];

function AIRobotModel({ color, icon }) {
  const colorMap = {
    cyan: '#14c9e1',
    purple: '#a78bfa',
    pink: '#ec4899',
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f97316',
  };
  const activeColor = colorMap[color] || '#14c9e1';

  return (
    <div className={`sector-robot-wrapper ${color}`}>
      <svg className="sector-robot-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow Background */}
        <circle cx="100" cy="100" r="70" fill={activeColor} opacity="0.04" />
        <circle cx="100" cy="80" r="30" fill={activeColor} opacity="0.1" filter="blur(10px)" />

        {/* Head Antennas */}
        <line x1="75" y1="40" x2="65" y2="22" stroke={activeColor} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="65" cy="22" r="5" fill={activeColor} />
        <line x1="125" y1="40" x2="135" y2="22" stroke={activeColor} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="135" cy="22" r="5" fill={activeColor} />

        {/* Neck */}
        <rect x="90" y="112" width="20" height="15" rx="5" fill="#1e293b" stroke={activeColor} strokeWidth="2.5" />

        {/* Head Base */}
        <rect x="58" y="42" width="84" height="72" rx="22" fill="#0f172a" stroke={activeColor} strokeWidth="3" />
        
        {/* Face Screen */}
        <rect x="66" y="50" width="68" height="48" rx="14" fill="#020617" stroke={activeColor} strokeWidth="1.5" />
        
        {/* Voice Wave */}
        <path d="M 80,82 Q 100,90 120,82" stroke={activeColor} strokeWidth="2.5" strokeLinecap="round" fill="none" className="robot-mouth-wave" />

        {/* Glowing Eyes */}
        <circle cx="82" cy="66" r="7" fill={activeColor} className="robot-eye" />
        <circle cx="118" cy="66" r="7" fill={activeColor} className="robot-eye" />
        <circle cx="82" cy="66" r="2.5" fill="#fff" />
        <circle cx="118" cy="66" r="2.5" fill="#fff" />

        {/* Ears */}
        <rect x="50" y="62" width="8" height="22" rx="4" fill="#1e293b" stroke={activeColor} strokeWidth="2" />
        <rect x="142" y="62" width="8" height="22" rx="4" fill="#1e293b" stroke={activeColor} strokeWidth="2" />

        {/* Torso Base */}
        <path d="M 68,128 L 132,128 L 142,190 L 58,190 Z" fill="#0f172a" stroke={activeColor} strokeWidth="3" strokeLinejoin="round" />
        
        {/* Robot Core holding Sector Icon */}
        <circle cx="100" cy="158" r="20" fill="#020617" stroke={activeColor} strokeWidth="2.5" className="robot-core-circle" />
        <text x="100" y="163" fontSize="22" textAnchor="middle" dominantBaseline="central">{icon}</text>
      </svg>
    </div>
  );
}

export default function Industries() {
  const [activeIdx, setActiveIdx] = useState(0);

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % sectors.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + sectors.length) % sectors.length);
  };

  return (
    <section className="industries section" id="industries">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Services We Serve
          </div>
          <h2 className="section-title">
            Built for <span className="gradient-text">Your Sector</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Every Seevora deployment is customised to your industry's specific workflow, language, and compliance needs.
          </p>
        </div>

        <div className="industries-3d-stage">
          {/* Left Arrow */}
          <button className="carousel-nav-btn prev" onClick={handlePrev} aria-label="Previous service">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* 3D Track Container */}
          <div className="stages-track">
            {sectors.map((s, i) => {
              const diff = i - activeIdx;
              const absDiff = Math.abs(diff);
              const isActive = diff === 0;

              // Setup 3D transform properties
              let translateX = diff * 160;
              let translateZ = -absDiff * 150;
              let rotateY = diff * -25;
              let scale = 1 - absDiff * 0.15;
              let opacity = isActive ? 1 : absDiff === 1 ? 0.45 : 0;
              let pointerEvents = isActive ? 'auto' : 'none';
              let visibility = absDiff <= 1 ? 'visible' : 'hidden';

              // Handle wrapping calculations for seamless looping transitions
              if (diff > 1 && i === sectors.length - 1 && activeIdx === 0) {
                // If we are at the beginning, make the last card wrap on the left
                translateX = -160;
                translateZ = -150;
                rotateY = 25;
                scale = 0.85;
                opacity = 0.45;
                visibility = 'visible';
              } else if (diff < -1 && i === 0 && activeIdx === sectors.length - 1) {
                // If we are at the end, make the first card wrap on the right
                translateX = 160;
                translateZ = -150;
                rotateY = -25;
                scale = 0.85;
                opacity = 0.45;
                visibility = 'visible';
              }

              return (
                <div
                  key={i}
                  className={`stage-card ${s.color}${isActive ? ' active' : ''}`}
                  style={{
                    transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    zIndex: 10 - absDiff,
                    opacity: opacity,
                    visibility: visibility,
                    pointerEvents: pointerEvents,
                  }}
                >
                  <AIRobotModel color={s.color} icon={s.icon} />
                  
                  <div className="stage-card-body">
                    <div className="stage-num-badge">{s.num}</div>
                    <h3>{s.title}</h3>
                    <p className="stage-desc">{s.sub}</p>
                    
                    <div className="stage-hologram-divider" />
                    
                    <div className="stage-specs">
                      <div className="spec-row">
                        <span className="spec-label">PAIN POINT:</span>
                        <span className="spec-text">{s.pain}</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">SEEVORA SOLVES:</span>
                        <span className="spec-text">{s.solution}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button className="carousel-nav-btn next" onClick={handleNext} aria-label="Next service">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Carousel Indicators / Dots */}
        <div className="stage-dots">
          {sectors.map((_, idx) => (
            <button
              key={idx}
              className={`stage-dot${activeIdx === idx ? ' active' : ''}`}
              onClick={() => setActiveIdx(idx)}
              aria-label={`Go to service ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
