import React, { useEffect } from 'react';
import SEOHead from '../common/SEOHead';
import StructuredData from '../common/StructuredData';
import { pagesSEO } from '../../config/seo';
import { generateOrganizationSchema } from '../../utils/schemaGenerators';

const modules = [
  {
    hash: 'ai-receptionist',
    tag: 'AI',
    color: 'cyan',
    title: 'AI Voice Reception',
    desc: 'Our AI answers every inbound call 24/7 — in Hindi, English, and regional languages. Every enquiry is captured, logged, and routed correctly without any human involvement.',
    features: ['24/7 answering', 'Hindi/English/regional', 'Auto lead creation', 'Missed-call recovery'],
    specs: { latency: '< 1.2s', channels: 'Voice / Dial-In', setup: '5 Days' }
  },
  {
    hash: 'auto-scheduler',
    tag: 'CAL',
    color: 'purple',
    title: 'Appointment Management',
    desc: 'Manages availability, confirms appointments automatically, sends reminders 2 hours before, predicts no-show risk, and fills cancelled slots from a live waitlist.',
    features: ['Auto-confirmations', '24h/2h reminders', 'No-show prediction', 'Waitlist fill'],
    specs: { latency: 'Real-time', channels: 'SMS / WhatsApp', setup: '5 Days' }
  },
  {
    hash: 'lead-intake',
    tag: 'CRM',
    color: 'green',
    title: 'Lead & Client Management',
    desc: 'Every enquiry — by call, WhatsApp, or web form — enters a structured CRM pipeline. Leads are scored Hot/Warm/Cold. Follow-up sequences run automatically for 7 days.',
    features: ['Multi-source capture', 'Hot/Warm/Cold scoring', '7-day follow-up', 'Daily hot-lead list'],
    specs: { latency: 'Instant', channels: 'WhatsApp / Web', setup: '5 Days' }
  },
  {
    hash: 'digital-presence',
    tag: 'WEB',
    color: 'blue',
    title: 'Digital Presence & SEO',
    desc: 'A professionally designed website live on your domain within 5 days. Paired with local SEO so your business ranks on Google for searches in your city and sector.',
    features: ['Custom website', 'Local SEO', 'Google Business Profile', 'Monthly AI content'],
    specs: { latency: 'Uptime 99%', channels: 'Custom Domain', setup: '5 Days' }
  },
  {
    hash: 'reputation-builder',
    tag: 'REP',
    color: 'orange',
    title: 'Reputation Management',
    desc: 'Automated review requests after every visit. AI-drafted responses to Google reviews. Review score tracking and alerts. Consistent reputation building that converts new clients.',
    features: ['Post-visit requests', 'AI review replies', 'Score tracking', 'Negative-review alerts'],
    specs: { latency: '< 5 mins', channels: 'Google Maps / SMS', setup: '5 Days' }
  },
  {
    hash: 'analytics-reporting',
    tag: 'DATA',
    color: 'pink',
    title: 'Analytics & Reporting',
    desc: 'Real-time dashboard showing calls handled, appointments booked, revenue trends, no-show rates, peak hours, and lead conversion. Weekly AI reports every Monday.',
    features: ['Real-time dashboard', 'Revenue trends', 'Peak hour analysis', 'Weekly owner reports'],
    specs: { latency: 'Instant', channels: 'Owner Dashboard', setup: '5 Days' }
  },
];

export default function ModulesPage() {
  const handleBookCall = (e) => {
    e.preventDefault();
    window.location.assign('/book-a-call');
  };

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      <SEOHead
        title={pagesSEO.modules.title}
        description={pagesSEO.modules.description}
        keywords={pagesSEO.modules.keywords}
        path={pagesSEO.modules.path}
        image={pagesSEO.modules.image}
        type={pagesSEO.modules.type}
      />
      <StructuredData data={organizationSchema} />

      <div className="modules-page">
      <div className="container">
        
        {/* Banner Header */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">Six AI Modules. <span className="gradient-text">One Connected Platform.</span></span>
            </span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '640px' }}>
            Each module is built specifically to automate manual bottlenecks, fully integrated to run your operations autonomously.
          </p>
        </div>

        <div className="modules-long-list">
          {modules.map((m, idx) => (
            <article
              key={m.hash}
              id={m.hash}
              className={`modules-long-card modules-long-card--${m.color}${idx % 2 ? ' is-reversed' : ''}`}
              data-animate="module-card-3d"
            >
              <div className="modules-long-side">
                <span className="modules-long-number">{String(idx + 1).padStart(2, '0')}</span>
                <span className={`module-tag module-tag--${m.color}`}>{m.tag}</span>
                <div className="modules-long-spec-stack">
                  <div>
                    <span>Response</span>
                    <strong>{m.specs.latency}</strong>
                  </div>
                  <div>
                    <span>Channels</span>
                    <strong>{m.specs.channels}</strong>
                  </div>
                  <div>
                    <span>Launch</span>
                    <strong>{m.specs.setup}</strong>
                  </div>
                </div>
              </div>

              <div className="modules-long-main">
                <h2>{m.title}</h2>
                <p>{m.desc}</p>
                <ul className="modules-long-feature-grid">
                  {m.features.map((feature) => (
                    <li key={feature}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* Outro CTA */}
        <div className="services-outro-cta" data-animate style={{ marginTop: '80px' }}>
          <h4>Ready to deploy Seevora AI Modules?</h4>
          <p>We configure, customize, and launch all modules custom-trained on your workflow in 5 business days.</p>
          <div className="outro-buttons" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a href="#" className="btn-primary" onClick={handleBookCall}>
              Request a Custom AI Audit
            </a>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
