import React, { useState } from 'react';

const termsPoints = [
  {
    q: '1. Acceptance of Terms & Eligibility',
    a: 'By accessing seevora.in or utilizing our complimentary workflow audits, calculator playgrounds, and tools, you agree to these Terms and Conditions. You represent that you are at least 18 years old and are authorized to bind your business or corporate entity to these terms.'
  },
  {
    q: '2. Corporate Profile & Location',
    a: 'These terms are a contract between you and Seevora Private Limited (CIN: U62011MP2026PTC082651), incorporated under the laws of India. All operations, development of custom SaaS configurations, and technical support are managed from our engineering offices in Indore, Madhya Pradesh.'
  },
  {
    q: '3. Binding Scope of Written Contracts',
    a: 'General diagrams, calculators, statistics, and descriptions on this website represent standard capability showcases. Binding scopes of services, custom API specifications, monthly subscription terms, payment parameters, and SLA definitions are governed exclusively by a signed written Service Agreement.'
  },
  {
    q: '4. Setup Timeline & Deployment SLA',
    a: 'For registered clients, we promise to configure, map business logic, sync APIs, train models, and deploy the AI receptionist or chatbot live on your domain within 5 business days of requirement freezing. Timelines are subject to extension if client-side API keys or database details are delayed.'
  },
  {
    q: '5. Intellectual Property & Code Ownership',
    a: 'All website layout code, custom SVG components, styling frameworks, and general code belong exclusively to Seevora. However, clients retain absolute, 100% intellectual property ownership of their custom customer databases, lead transcripts, and training datasets.'
  },
  {
    q: '6. Acceptable Use Policy & Ground Rules',
    a: 'You agree not to spam or flood our playground tools, demo receptionists, or lead capture forms with malicious payloads. System scraping, crawler tools, automated security testing, and platform resource flooding are strictly prohibited.'
  },
  {
    q: '7. Subscriptions, Payments & Cancellation Policies',
    a: 'Setup services are billed according to signed proposals. Monthly recurring AI SaaS subscription bills must be settled within 5 days of invoice generation. Subscriptions can be cancelled at any time by notifying info@seevora.in at least 15 days in advance.'
  },
  {
    q: '8. Meta & Third-Party APIs Liability Disclaimer',
    a: 'Our integrations depend on third-party APIs, including Meta\'s WhatsApp Business API, database tools, and text-to-speech services. Seevora is not liable for temporary service interruptions, policy shifts, or cost hikes implemented by these external sub-processors.'
  },
  {
    q: '9. Suspension & Termination of Service',
    a: 'We reserve the right to suspend or terminate platform access, API connections, or chatbot routing in cases of payment defaults, code injection attempts, or violations of acceptable use rules, following a 3-day written warning.'
  },
  {
    q: '10. Governing Law, Warranties & Jurisdiction',
    a: 'Our systems are provided "as-is" without direct warranties of uninterrupted profitability. These terms are governed by Indian law, and all legal disputes, claims, or contract reviews are subject to the exclusive jurisdiction of courts in Indore, Madhya Pradesh.'
  }
];

export default function TermsConditions() {
  const [activePoint, setActivePoint] = useState(null);

  const toggle = (i) => {
    setActivePoint(activePoint === i ? null : i);
  };

  const handleGoBack = (e) => {
    e.preventDefault();
    window.location.assign('/');
  };

  return (
    <section className="legal-page">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 className="section-title">
            Terms & <span className="gradient-text">Conditions</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Interactive terms sections. Click headers to read details.
          </p>
        </div>

        <div className="legal-list" data-animate>
          {termsPoints.map((pt, i) => (
            <div
              key={i}
              className={`legal-item ${activePoint === i ? 'active' : ''}`}
            >
              <div className="legal-header" onClick={() => toggle(i)}>
                <span>{pt.q}</span>
                <span className="legal-icon">+</span>
              </div>
              <div
                className="legal-body"
                style={{
                  maxHeight: activePoint === i ? '300px' : '0px',
                }}
              >
                <div className="legal-body-inner">
                  <p style={{ margin: 0 }}>{pt.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <a href="#" className="btn-primary" onClick={handleGoBack}>
            Return to Home
          </a>
        </div>
      </div>
    </section>
  );
}
