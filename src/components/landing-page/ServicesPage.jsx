import React, { useEffect, useState } from 'react';

import educationAcademyImg from '../../assets/education_academy_classroom_service.png';
import personalCareWellnessImg from '../../assets/personal_care_reputation_service.png';
import healthFitnessToolsImg from '../../assets/health_fitness_tools_service.png';
import legalFinancialDocumentsImg from '../../assets/legal_financial_documents_service.png';
import realEstateNoDevicesImg from '../../assets/real_estate_no_devices_service.png';
import healthcareDocivoImg from '../../assets/healthcare_docivo_analytics_service.png';
import diagnosticMicroscopeImg from '../../assets/diagnostic_microscope_service.png';

const sectors = [
  {
    hash: 'healthcare',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 21s7-3.5 7-10V6l-7-3-7 3v5c0 6.5 7 10 7 10Z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    ),
    title: 'Healthcare & Medical',
    sub: 'Clinics, hospitals, specialist practices, multi-branch medical centres',
    pain: 'Missed patient calls, booking friction, multilingual patient routing, appointment no-shows.',
    solution: '24/7 AI Receptionist answers phone calls and texts in English & Hindi, schedules appointments directly into your calendar, handles patient query intake, and sends automated reminder alerts.',
    color: 'cyan',
    img: healthcareDocivoImg,
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
        <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
        <path d="M6 12v4c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3v-4" />
        <path d="M18 10.5V15" />
      </svg>
    ),
    title: 'Education & Academies',
    sub: 'Admission enquiry automation, demo class bookings, fee reminders, and credibility growth for institutes',
    pain: 'Admission seasons, batch announcements, and exam cycles create enquiry spikes that manual call handling cannot manage reliably.',
    solution: 'Seevora answers admission enquiries 24/7, books demo classes automatically, sends UPI fee payment reminders, and supports social content that builds trust with students and parents.',
    color: 'purple',
    img: educationAcademyImg,
    metric: '4.2x',
    metricLabel: 'Demo Show-Up Rate',
    setupTime: '5 Business Days',
    languages: 'English, Hindi, Hinglish',
    integrations: 'WhatsApp Business APIs, UPI Payment Links, Demo Class Calendars, Social Content Workflows'
  },
  {
    hash: 'wellness',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3c2.2 0 4 1.8 4 4 0 1.2-.5 2.4-1.3 3.2l-6.1 6.1A4 4 0 0 1 5 13c0-1.5.8-2.8 2-3.6C7.8 6.2 9.7 3 12 3Z" />
        <path d="M8 13c2.2 0 4 .8 5.2 2" />
      </svg>
    ),
    title: 'Personal Care & Wellness',
    sub: 'Slot booking, no-show reminders, repeat visit follow-ups, Google reviews, and social presence',
    pain: 'Personal care businesses rely on repeat appointments and word-of-mouth, but missed reminders, weak follow-ups, and low review activity make clients easy to lose.',
    solution: 'Seevora automates slot booking, sends appointment reminders, follows up after visits to encourage repeat bookings, manages Google reviews, and keeps social content active.',
    color: 'pink',
    img: personalCareWellnessImg,
    metric: '85%',
    metricLabel: 'Rebooking Automation',
    setupTime: '5 Business Days',
    languages: 'English, Hinglish',
    integrations: 'Booking Calendars, WhatsApp Reminders, Google Reviews, Social Content Workflows'
  },
  {
    hash: 'diagnostics',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M10 3h4" />
        <path d="M10 3v5.5L5.5 16A3 3 0 0 0 8 20h8a3 3 0 0 0 2.5-4l-4.5-7.5V3" />
        <path d="M9 15h6" />
      </svg>
    ),
    title: 'Diagnostic & Pathology',
    sub: 'Diagnostic laboratories, pathology centers, radiology clinics, health screening hubs',
    pain: 'High test-booking drop-offs, manual sample collection scheduling, repetitive "report ready?" calls.',
    solution: 'Fully automated WhatsApp diagnostic booking flows, sample collections booking, auto-update patient records, and send direct WhatsApp notifications when report PDFs are ready for download.',
    color: 'blue',
    img: diagnosticMicroscopeImg,
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
        <path d="M5 10v4" />
        <path d="M19 10v4" />
        <path d="M7 8v8" />
        <path d="M17 8v8" />
        <path d="M8 11h8" />
      </svg>
    ),
    title: 'Health & Fitness',
    sub: 'Gyms, fitness studios, yoga centers, sports academies, rehabilitation clinics',
    pain: 'Free trial class drop-offs, renewal deadline misses, manual member follow-up, inactive user churn.',
    solution: 'AI follow-up sequences convert trial bookings, schedule sessions, send automated membership renewal reminders, trigger workout tips, and collect feedback for active engagement.',
    color: 'green',
    img: healthFitnessToolsImg,
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
        <path d="M12 4 20 8l-8 4-8-4 8-4Z" />
        <path d="M6 9v5c0 1.7 2.7 3.5 6 3.5s6-1.8 6-3.5V9" />
        <path d="M6 14.5 4 19h4" />
        <path d="M18 14.5 20 19h-4" />
      </svg>
    ),
    title: 'Legal & Financial Advisory',
    sub: 'Law firms, CA practices, tax consultants, financial planners',
    pain: 'Missed initial client intake calls, consultation booking delays, manual document request follow-ups.',
    solution: 'Structured client intake systems route inquiries, schedule consultations based on advisor calendar availability, and follow up with automated lists for document uploads.',
    color: 'orange',
    img: legalFinancialDocumentsImg,
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
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5 9.5V20h14V9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    ),
    title: 'Property & Real Estate',
    sub: 'Real estate agencies, housing developers, commercial property consultants',
    pain: 'Unqualified lead calling, delayed reply times, broker schedule clashes, missing off-market listings.',
    solution: 'Instant AI chatbot qualification by budget, location, and timeline; sends automated listing catalogs; schedules property visits; and triggers hot-lead daily sheets directly to brokers.',
    color: 'cyan',
    img: realEstateNoDevicesImg,
    metric: '5.8x',
    metricLabel: 'Qualified Lead Filtering',
    setupTime: '5 Business Days',
    languages: 'English, Hindi, Hinglish',
    integrations: 'Interactive Catalogs, Broker Schedule Manager, Hot-Lead Routing'
  }
];

export default function ServicesPage() {
  const [expandedMobileIdx, setExpandedMobileIdx] = useState(null);

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

  const toggleMobileCard = (idx) => {
    setExpandedMobileIdx((current) => (current === idx ? null : idx));
  };

  return (
    <section className="services-page">
      <div className="bg-grid" />
      <div className="container">
        
        {/* Hero Header */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="section-title">
            Our Services & <span className="gradient-text">Industries</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '700px' }}>
            Explore how Seevora integrates custom calendars, billing systems, and bilingual AI agents tailored specifically for your business sector.
          </p>
        </div>

        <div className="services-scroll-list">
          {sectors.map((s, idx) => {
            const isFlipped = idx % 2 !== 0;
            const cardNum = String(idx + 1).padStart(2, '0');
            return (
              <div
                key={idx}
                id={s.hash}
                className={`services-scroll-card border-${s.color} ${isFlipped ? 'flipped' : ''} ${expandedMobileIdx === idx ? 'mobile-expanded' : ''}`}
                data-animate={isFlipped ? 'service-card-3d-right' : 'service-card-3d-left'}
                role="button"
                tabIndex={0}
                aria-expanded={expandedMobileIdx === idx}
                onClick={() => toggleMobileCard(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMobileCard(idx);
                  }
                }}
              >
                <div className={`carousel-grid ${isFlipped ? 'flipped' : ''}`}>
                  
                  {/* Image with 3D zoom-in reveal */}
                  <div className="carousel-visual">
                    <div className="carousel-image-frame">
                      <img
                        src={s.img}
                        alt={s.title}
                        className="carousel-image svc-img-zoom"
                      />
                      <div className="carousel-image-tint" />
                      
                      <div className="mobile-hint-line" />
                      
                      {/* Floating stats badge */}
                      <div className="carousel-stats-overlay">
                        <span className="overlay-val">{s.metric}</span>
                        <span className="overlay-lbl">{s.metricLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Text Panel — staggered fade-up */}
                  <div
                    className="carousel-text-panel"
                    onClick={(e) => e.stopPropagation()}
                  >
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
