import React from 'react';

const problems = [
  {
    icon: '📞',
    title: 'Clinics Losing Patients to Missed Calls',
    desc: 'Every unanswered call at a clinic or practice is a patient lost to a competitor. Seevora answers 24/7, books appointments, and captures every patient enquiry.',
  },
  {
    icon: '📅',
    title: 'Salons & Studios Damaged by No-Shows',
    desc: 'Low-commitment online bookings lead to empty chairs and lost staff time. Our automated WhatsApp confirmations and smart waitlists reduce no-shows by 30–40%.',
  },
  {
    icon: '💼',
    title: 'CAs & Consultants Buried in Follow-ups',
    desc: 'Chasing clients for documents, tax receipts, and signatures wastes hours daily. Seevora automates file collection, reminders, and payment links.',
  },
  {
    icon: '🗂️',
    title: 'Coaches & Institutes Overloaded with Leads',
    desc: 'Admissions and inquiries bring chaotic WhatsApp chats, phone calls, and forms. Seevora parses them into a single CRM pipeline with hot priority alerts.',
  },
  {
    icon: '⭐',
    title: 'Gyms & Local Services Failing Local SEO',
    desc: 'Without active Google reviews and quick replies, local service businesses rank low. Automated review prompts and local SEO boost Google visibility by 2x.',
  },
];

export default function Problems() {
  return (
    <section className="problems section" id="problems">
      <div className="bg-grid" />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Problems We Solve
          </div>
          <h2 className="section-title">
            Why Indian Businesses <span className="gradient-text">Lose Growth</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            These are the critical operational failures costing Indian SMBs lakhs every month.
          </p>
        </div>

        <div className="problems-grid-3col">
          {/* Column 1 (Left) */}
          <div className="problems-col">
            {[problems[0], problems[1]].map((p, i) => (
              <div key={i} className="problem-card" data-animate="rotate-3d" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="problem-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Column 2 (Center) */}
          <div className="problems-col-center">
            <div className="problem-card" data-animate="rotate-3d" style={{ transitionDelay: '0.2s' }}>
              <div className="problem-icon">{problems[2].icon}</div>
              <h3>{problems[2].title}</h3>
              <p>{problems[2].desc}</p>
            </div>
          </div>

          {/* Column 3 (Right) */}
          <div className="problems-col">
            {[problems[3], problems[4]].map((p, i) => (
              <div key={i} className="problem-card" data-animate="rotate-3d" style={{ transitionDelay: `${(i + 3) * 0.1}s` }}>
                <div className="problem-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
