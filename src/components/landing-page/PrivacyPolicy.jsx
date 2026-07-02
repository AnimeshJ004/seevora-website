import React, { useState } from 'react';

const policyPoints = [
  {
    q: '1. Who is the Data Controller for Seevora?',
    a: 'Your data controller is Seevora Private Limited (CIN: U62011MP2026PTC082651), incorporated in Indore, Madhya Pradesh, India. If you have questions about how your data is handled or secured, you can contact our privacy officer directly at info@seevora.in.'
  },
  {
    q: '2. What personal data do we collect?',
    a: 'We collect personal details to facilitate consultations, audits, and account management. This includes: Full Name, company email address, active WhatsApp phone numbers, corporate role, and your city of operation. We also gather technical metadata such as IP addresses, device types, browser version, and activity logs during your visits.'
  },
  {
    q: '3. What business operational data do we collect?',
    a: 'To customize our AI agents, we collect specific details about your business workflow. This includes appointment slots (for clinics/salons), fee reminders (for coaching institutes), lead routing rules, CRM structure mappings, and diagnostic test listings. This data is only gathered with your explicit consent during requirement freezing.'
  },
  {
    q: '4. How do we use the collected data?',
    a: 'We process your business and personal data to build, train, and maintain your customized AI voice receptionists and WhatsApp chatbots. It is also used to deliver custom AI Workflow Audits, integrate calendars and CRM database targets, trigger automated billing reminder notifications, and troubleshoot system anomalies.'
  },
  {
    q: '5. What is our Zero-Sale data policy?',
    a: 'Seevora enforces a strict Zero-Sale data policy. We do not sell, rent, trade, or distribute your customer information, patient records, phone call recordings, or conversation transcripts to third-party marketing companies, brokers, or external advertisers under any circumstances.'
  },
  {
    q: '6. Who do we share your data with?',
    a: 'We share data only with essential cloud infrastructure sub-processors. This includes hosting networks (secure cloud servers), communication gateways (Meta\'s WhatsApp Business API, voice synthesis APIs), and database modules that you request we connect to your CRM.'
  },
  {
    q: '7. How do we ensure data security and encryption?',
    a: 'All data is secured using industry-standard protocols. In transit, data is protected by SSL/TLS encryption. At rest, data is isolated in separate database instances to prevent cross-account exposure. Internal database access is restricted exclusively to authorized Indore engineers.'
  },
  {
    q: '8. How long is your business data retained?',
    a: 'We retain your custom business blueprints, chatbots parameters, and integration logs for as long as your subscription is active. Upon contract termination or cancellation, all custom models and database instances are securely wiped from our primary and backup servers within 30 days.'
  },
  {
    q: '9. How do we handle children\'s privacy?',
    a: 'Seevora is a B2B service. We do not knowingly collect or solicit personal information from individuals under the age of 18. If we discover we have unintentionally gathered data from a minor, we will delete it immediately.'
  },
  {
    q: '10. What are your data rights and how can you exercise them?',
    a: 'You hold full ownership of your data. You have the right to request a complete export of your interaction logs, update incorrect records, or ask for total data erasure. You can submit these requests to info@seevora.in, and we will comply within 7 business days.'
  }
];

export default function PrivacyPolicy() {
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
            Privacy <span className="gradient-text">Policy</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Interactive policy sections. Click headers to read details.
          </p>
        </div>

        <div className="legal-list" data-animate>
          {policyPoints.map((pt, i) => (
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
