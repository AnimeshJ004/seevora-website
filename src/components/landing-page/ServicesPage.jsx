import React, { useEffect } from 'react';

import educationImg from '../../assets/education_classroom_service.jpg';
import wellnessImg from '../../assets/wellness_yoga_service.jpg';
import fitnessImg from '../../assets/fitness_dumbbells_service.jpg';
import financialImg from '../../assets/financial_advisory_service.jpg';
import realEstateImg from '../../assets/real_estate_service.jpg';
import dashboardImg from '../../assets/dashboard_metrics_service.jpg';

const sectors = [
  {
    hash: 'healthcare',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
        <path d="M4 4h16v16H4z" />
      </svg>
    ),
    title: 'Healthcare & Medical',
    sub: 'Clinics, hospitals, specialist practices, multi-branch medical centres',
    pain: 'Missed patient calls, booking friction, multilingual patient routing, appointment no-shows.',
    solution: '24/7 AI Receptionist answers phone calls and texts in English & Hindi, schedules appointments directly into your calendar, handles patient query intake, and sends automated reminder alerts.',
    color: 'cyan',
    img: dashboardImg,
    metric: '92%',
    metricLabel: 'Missed Calls Saved',
    setupTime: '5 Business Days',
    languages: 'English, Hindi, Hinglish',
    integrations: 'Meta WhatsApp API, Google/Outlook Calendar, Custom EMR Sync'
  },
  {
    hash: 'education',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 10.5 12 6l9 4.5-9 4.5-9-4.5Z" />
        <path d="M6 11.8V16c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3v-4.2" />
      </svg>
    ),
    title: 'Education & Academies',
    sub: 'Coaching institutes, tuition centres, exam prep academies, skill development providers',
    pain: 'Admission season inquiry overload, manual demo session follow-up, fee reminders, student intake friction.',
    solution: 'Automated WhatsApp chatbots answer enrollment FAQs, schedule students into demo classes, trigger automated UPI payment reminder links, and sync user intake sheets to the CRM database.',
    color: 'purple',
    img: educationImg,
    metric: '4.2x',
    metricLabel: 'Demo Show-Up Rate',
    setupTime: '5 Business Days',
    languages: 'English, Hindi, Hinglish',
    integrations: 'WhatsApp Business APIs, Razorpay/UPI Reminders, Google Sheets/CRM'
  },
  {
    hash: 'wellness',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M7 13a5 5 0 0 1 10 0" />
        <path d="M6 13h12" />
        <path d="M4 18h16" />
        <path d="M8 8a4 4 0 0 1 8 0" />
      </svg>
    ),
    title: 'Personal Care & Wellness',
    sub: 'Beauty parlours, salon studios, spas, skin clinics, grooming services',
    pain: 'Double-bookings, manual calendar slots, lost recurring bookings, low review rates.',
    solution: 'Intelligent scheduler bots lock in time slots via WhatsApp, follow up with automated rebooking campaigns, request Google reviews post-session, and handle slot modifications instantly.',
    color: 'pink',
    img: wellnessImg,
    metric: '85%',
    metricLabel: 'Rebooking Automation',
    setupTime: '5 Business Days',
    languages: 'English, Hinglish',
    integrations: 'WhatsApp API, Slot Matrices, Google Reviews API'
  },
  {
    hash: 'diagnostics',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M10 3v6l-5 7a3 3 0 0 0 2.4 4.8h9.2A3 3 0 0 0 19 16l-5-7V3" />
        <path d="M8.5 15h7" />
      </svg>
    ),
    title: 'Diagnostic & Pathology',
    sub: 'Diagnostic laboratories, pathology centers, radiology clinics, health screening hubs',
    pain: 'High test-booking drop-offs, manual sample collection scheduling, repetitive "report ready?" calls.',
    solution: 'Fully automated WhatsApp diagnostic booking flows, sample collections booking, auto-update patient records, and send direct WhatsApp notifications when report PDFs are ready for download.',
    color: 'blue',
    img: dashboardImg,
    metric: '65%',
    metricLabel: 'Staff Hours Saved/Mo',
    setupTime: '5 Business Days',
    languages: 'English, Hindi, Hinglish',
    integrations: 'LIS/Lab Databases, WhatsApp File Server, Sample Route APIs'
  },
  {
    hash: 'fitness',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M6 9v6M18 9v6" />
        <path d="M4 10v4M20 10v4" />
        <path d="M8 8h8v8H8z" />
      </svg>
    ),
    title: 'Health & Fitness',
    sub: 'Gyms, fitness studios, yoga centers, sports academies, rehabilitation clinics',
    pain: 'Free trial class drop-offs, renewal deadline misses, manual member follow-up, inactive user churn.',
    solution: 'AI follow-up sequences convert trial bookings, schedule sessions, send automated membership renewal reminders, trigger workout tips, and collect feedback for active engagement.',
    color: 'green',
    img: fitnessImg,
    metric: '38%',
    metricLabel: 'Renewal Uplift Rate',
    setupTime: '5 Business Days',
    languages: 'English, Hinglish',
    integrations: 'Membership Software, WhatsApp Gateway, Auto-Reminders Trigger'
  },
  {
    hash: 'legal',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M7 7 4 13h6L7 7Z" />
        <path d="m17 7-3 6h6l-3-6Z" />
        <path d="M5 21h14" />
      </svg>
    ),
    title: 'Legal & Financial Advisory',
    sub: 'Law firms, CA practices, tax consultants, financial planners',
    pain: 'Missed initial client intake calls, consultation booking delays, manual document request follow-ups.',
    solution: 'Structured client intake systems route inquiries, schedule consultations based on advisor calendar availability, and follow up with automated lists for document uploads.',
    color: 'orange',
    img: financialImg,
    metric: '100%',
    metricLabel: 'Secure Document Intake',
    setupTime: '5 Business Days',
    languages: 'English, Hinglish',
    integrations: 'Advisor Calendars, Secure Document Server, Email & CRM Webhooks'
  },
  {
    hash: 'property',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10.5V20h14v-9.5" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
    title: 'Property & Real Estate',
    sub: 'Real estate agencies, housing developers, commercial property consultants',
    pain: 'Unqualified lead calling, delayed reply times, broker schedule clashes, missing off-market listings.',
    solution: 'Instant AI chatbot qualification by budget, location, and timeline; sends automated listing catalogs; schedules property visits; and triggers hot-lead daily sheets directly to brokers.',
    color: 'cyan',
    img: realEstateImg,
    metric: '5.8x',
    metricLabel: 'Qualified Lead Filtering',
    setupTime: '5 Business Days',
    languages: 'English, Hindi, Hinglish',
    integrations: 'Interactive Catalogs, Broker Schedule Manager, Hot-Lead Routing'
  }
];

export default function ServicesPage() {
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      }
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  const handleBookCall = (e) => {
    e.preventDefault();
    window.location.assign('/book-a-call');
  };

  return (
    <section className="services-page">
      <div className="bg-grid" />
      <div className="container">
        
        {/* Hero Header */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="section-label" style={{ margin: '0 auto 24px' }}>
            <span className="dot" />
            Industry Hub
          </div>
          <h2 className="section-title">
            Our Services & <span className="gradient-text">Industries</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '700px' }}>
            Explore how Seevora integrates custom calendars, billing systems, and bilingual AI agents tailored specifically for your business sector.
          </p>
        </div>

        {/* Vertical Stack of Service Cards */}
        <div className="services-scroll-list">
          {sectors.map((s, idx) => {
            const isFlipped = idx % 2 !== 0;
            const cardNum = String(idx + 1).padStart(2, '0');
            return (
              <div
                key={idx}
                id={s.hash}
                className={`services-scroll-card border-${s.color} ${isFlipped ? 'flipped' : ''}`}
                data-animate
              >
                <div className={`carousel-grid ${isFlipped ? 'flipped' : ''}`}>
                  
                  {/* Visual Image with Stats Overlay */}
                  <div className="carousel-visual">
                    <div className="carousel-image-frame">
                      <img
                        src={s.img}
                        alt={s.title}
                        className="carousel-image"
                      />
                      <div className="carousel-image-tint" />
                      
                      {/* Floating stats badge */}
                      <div className="carousel-stats-overlay">
                        <span className="overlay-val">{s.metric}</span>
                        <span className="overlay-lbl">{s.metricLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Curved Panel */}
                  <div className="carousel-text-panel">
                    <div className="card-number">{cardNum}</div>
                    <div className="carousel-header">
                      <span className="carousel-icon">{s.icon}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p className="carousel-sub">{s.sub}</p>
                      </div>
                    </div>

                    <div className="carousel-details-box">
                      <div className="detail-row">
                        <span className="detail-tag tag-pain">THE CHALLENGE</span>
                        <p>{s.pain}</p>
                      </div>
                      <div className="detail-row">
                        <span className="detail-tag tag-sol">THE AI SOLUTION</span>
                        <p>{s.solution}</p>
                      </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="carousel-tech-spec-grid">
                      <div className="tech-spec-item">
                        <h5>Deployment Speed</h5>
                        <p>{s.setupTime}</p>
                      </div>
                      <div className="tech-spec-item">
                        <h5>Languages Served</h5>
                        <p>{s.languages}</p>
                      </div>
                      <div className="tech-spec-item">
                        <h5>API Integrations</h5>
                        <p>{s.integrations}</p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Outro CTA */}
        <div className="services-outro-cta" data-animate>
          <h3>Need a custom workflow built?</h3>
          <p>
            Seevora Private Limited specializes in bespoke automations. If your business has unique operational guidelines, calendar routing, or private database modules, our Indore team will audit and engineer a custom-tailored system for you.
          </p>
          <div style={{ marginTop: '24px' }}>
            <a href="#" className="btn-glass" onClick={(e) => { e.preventDefault(); window.location.assign('/'); }}>
              Return to Home
            </a>
            <a href="#" className="btn-primary" onClick={handleBookCall} style={{ marginLeft: '12px' }}>
              Request a Custom AI Audit
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
