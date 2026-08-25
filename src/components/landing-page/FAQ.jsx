import React, { useState } from 'react';
import SEOHead from '../common/SEOHead';
import StructuredData from '../common/StructuredData';
import { pagesSEO } from '../../config/seo';
import { generateFAQSchema, generateBreadcrumbSchema } from '../../utils/schemaGenerators';

const faqs = [
  {
    q: 'Do you provide solutions for B2B Sales clients?',
    a: 'Yes. We conduct deep research into your B2B model and identify exactly where custom AI agents can automate your workflow, save time, and accelerate your sales cycles. Clients typically see 40%+ reduction in manual data entry within the first 30 days.',
  },
  {
    q: 'What is Multi-Agent Software Merging?',
    a: 'For complex business operations, we deploy multiple specialized AI agents and seamlessly merge them with your existing software stack (CRMs like Salesforce, HubSpot, Zoho, or Pipedrive; ERPs; and custom tools) so they function as a unified, modernized ecosystem.',
  },
  {
    q: 'Does Seevora replace my sales team?',
    a: 'No. Seevora acts as a 24/7 intelligent extension of your team. It handles routine tasks — data entry, follow-ups, lead qualification — so your sales professionals can focus purely on closing deals. Most clients free up 15–20 hours per week per rep.',
  },
  {
    q: 'Can the AI handle outbound prospecting and lead qualification?',
    a: 'Yes! Our custom AI Sales Agents are designed to handle 24/7 intelligent outbound prospecting, engage leads across channels (voice, WhatsApp, email), and qualify them before passing to your human sales reps.',
  },
  {
    q: 'How quickly can it launch?',
    a: 'Your system goes live within 5 business days. In that time, we audit your operations, map your business rules, custom-build the AI solution, and deploy it into your environment — no downtime, no disruption to your existing workflow.',
  },
  {
    q: 'Is our corporate and customer data secure?',
    a: 'Absolutely. We follow strict data privacy standards including end-to-end encryption at rest and in transit. All customer data, CRM interactions, and proprietary business rules belong exclusively to your business and are never used to train third-party models.',
  },
  {
    q: 'What kind of support do you provide?',
    a: 'We provide ongoing support and continuous optimization post-launch. You get direct access to our engineering team for adjustments, workflow updates, or new CRM integrations — with a standard response time under 24 hours.',
  },
  {
    q: 'What communication channels does the AI support?',
    a: 'Our systems deploy across standard B2B touchpoints: voice calls, WhatsApp Business API, SMS, and email — all synced together to your centralized CRM dashboard in real time.',
  },
  {
    q: 'Do I need a developer or technical skills to get started?',
    a: 'No coding is required on your part. Our engineers handle 100% of the technical setup, database configuration, CRM integrations, and AI training as part of our onboarding. You simply review and approve the workflow before go-live.',
  },
  {
    q: 'How does the AI integrate with our existing CRM?',
    a: 'Seevora integrates with all major CRMs including Salesforce, HubSpot, Zoho, Pipedrive, and Monday.com via custom API connectors. The AI automatically updates records, logs interactions, and triggers workflows — eliminating manual data entry entirely.',
  },
  {
    q: 'Can we customize the AI agent\'s tone and sales script?',
    a: 'Absolutely. During the build phase, we translate your existing sales playbooks and brand guidelines into the AI model. You have full control over tone, language (English, Hindi, or Hinglish), and script before go-live.',
  },
  {
    q: 'Is there an initial audit available?',
    a: 'Yes! We offer a free Discovery & Process Mapping audit — no commitment required. Our engineers review your current operations and deliver a tailored automation blueprint mapping potential cost reductions, time savings, and efficiency gains specific to your business.',
  },
  {
    q: 'Can your AI Sales Agents handle complex B2B negotiations?',
    a: 'The AI excels at lead qualification, initial outreach, and detailed product Q&A. For final negotiations and closing, it seamlessly hands off warm, fully-qualified leads to your senior human sales executives — with a complete call transcript and lead profile already prepared.',
  },
  {
    q: 'Which CRMs do your AI solutions integrate with?',
    a: 'We build custom API connectors for any modern CRM — including Salesforce, HubSpot, Zoho, Pipedrive, and Monday.com — as well as proprietary legacy systems. All integrations provide bidirectional sync so your CRM data is always up to date.',
  },
  {
    q: 'How do you ensure the AI doesn\'t hallucinate or give wrong information?',
    a: 'We use Retrieval-Augmented Generation (RAG) combined with strict guardrails. The AI is explicitly restricted to your approved knowledge base, sales playbooks, and corporate data — it cannot make up claims outside that boundary. All responses are logged and auditable.',
  },
  {
    q: 'Can Seevora automate our entire outbound email and outreach process?',
    a: 'Yes. We design multi-channel AI agents that research prospects, draft hyper-personalized outreach based on company data, and trigger intelligent follow-up sequences — feeding all positive responses directly into your CRM pipeline automatically.',
  },
  {
    q: 'What makes Seevora different from standard chatbot builders?',
    a: 'We don\'t sell a DIY drag-and-drop tool. We are a full-service technology partner. We analyze your unique B2B sales pipeline, custom-engineer the AI agents, build complex CRM integrations, and provide continuous optimization. You get a finished system, not a builder.',
  },
  {
    q: 'Can you generate custom AI agents and merge them with our existing software?',
    a: 'Yes, we specialize in building custom AI agents and merging them with your existing software stack — CRMs, ERPs, booking systems, and more. The result is a unified, intelligent ecosystem tailored to your exact business workflows, live in 5 business days.',
  },
];

export default function FAQ({ isPage = false }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (i) => {
    setActiveIndex(activeIndex === i ? null : i);
  };

  const goToContact = () => {
    window.location.assign('/book-a-call');
  };

  // Generate FAQ schema for AEO optimization
  const faqSchema = generateFAQSchema(faqs);

  // Breadcrumb schema for rich results in SERPs (only when standalone page)
  const breadcrumbSchema = isPage ? generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'FAQs', path: '/faqs' }
  ]) : null;

  return (
    <>
      {/* SEO meta tags only when rendered as standalone page */}
      {isPage && (
        <SEOHead
          title={pagesSEO.faq.title}
          description={pagesSEO.faq.description}
          keywords={pagesSEO.faq.keywords}
          path={pagesSEO.faq.path}
          image={pagesSEO.faq.image}
          type={pagesSEO.faq.type}
        />
      )}
      {/* FAQ schema always renders for AEO — works on standalone and embedded */}
      <StructuredData data={[faqSchema, breadcrumbSchema].filter(Boolean)} />

      <section className={`faq section${isPage ? ' faq-page' : ''}`} id="faqs">
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <h2 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">Frequently Asked <span className="gradient-text">Questions</span></span>
            </span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Everything you need to know about working with Seevora.
          </p>
        </div>

        <div className="faq-list" data-animate>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`faq-item ${activeIndex === i ? 'active' : ''}`}
            >
              <div
                className="glass-card"
                onClick={() => toggle(i)}
                role="button"
                aria-expanded={activeIndex === i}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-icon" aria-hidden="true">+</span>
                </div>
                <div
                  className="faq-answer"
                  aria-hidden={activeIndex !== i}
                  style={{
                    maxHeight: activeIndex === i ? '300px' : '0px',
                  }}
                >
                  <div className="faq-answer-inner">{faq.a}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="faq-cta" data-animate>
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
            Still have questions? Let's talk.
          </p>
          <button
            className="btn-primary"
            onClick={goToContact}
          >
            Book a Call
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
    </>
  );
}
