import React from 'react';

const trustItems = [
  { icon: '🔐', title: 'Role-Based Access', desc: 'Owner, manager, and staff roles with separate dashboard permissions. No one sees more than they need to.' },
  { icon: '🛡️', title: 'Secure Login & OTP', desc: 'Every session is protected with secure login and OTP verification for business owners and admins.' },
  { icon: '🔒', title: 'Encrypted Backups', desc: 'All business and customer data is encrypted at rest and in transit. Regular automated backups.' },
  { icon: '📋', title: 'Audit Logs', desc: 'Every action in the dashboard is logged with a timestamp, user, and event type. Full traceability.' },
  { icon: '✅', title: 'Consent & Privacy', desc: 'Customers are informed when AI call recording, WhatsApp communication, and data processing are enabled.' },
  { icon: '🇮🇳', title: 'India-Compliant', desc: 'Built for Indian data practices — WhatsApp Business API, UPI/GST workflows, and local language AI.' },
];

export default function TrustSecurity() {
  return (
    <section className="trust section" id="trust">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Trust & Security
          </div>
          <h2 className="section-title">
            Your Data. <span className="gradient-text">Fully Protected.</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Seevora handles business and customer data with bank-grade security practices and full transparency.
          </p>
        </div>

        <div className="trust-ledger">
          {trustItems.map((t, i) => (
            <div
              key={i}
              className="trust-ledger-item"
              data-animate="slide-up"
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              <div className="trust-ledger-marker">
                <span className="trust-icon">{t.icon}</span>
              </div>
              <div className="trust-ledger-title">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h4>{t.title}</h4>
              </div>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
