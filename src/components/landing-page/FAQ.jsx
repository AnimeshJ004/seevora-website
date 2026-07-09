import React, { useState } from 'react';
import SEOHead from '../common/SEOHead';
import StructuredData from '../common/StructuredData';
import { pagesSEO } from '../../config/seo';
import { generateFAQSchema } from '../../utils/schemaGenerators';

const faqs = [
  {
    q: 'Do you provide solutions for B2B Sales clients?',
    a: 'Yes. We conduct deep research into your B2B model and identify exactly where custom AI agents can automate your workflow, save time, and accelerate your sales cycles.',
  },
  {
    q: 'What is Multi-Agent Software Merging?',
    a: 'For complex business operations, we deploy multiple specialized AI agents and seamlessly merge them with your existing software stack (CRMs, ERPs) so they function as a unified, modernized ecosystem.',
  },
  {
    q: 'Does Seevora replace my sales team?',
    a: 'No. Seevora acts as a 24/7 intelligent extension of your team. It handles massive amounts of data entry, routine follow-ups, and lead qualification so your sales professionals can focus purely on closing deals and building relationships.',
  },
  {
    q: 'Can the AI handle outbound prospecting and lead qualification?',
    a: 'Yes! Our custom AI Sales Agents are designed to handle 24/7 intelligent outbound prospecting, engage leads across channels, and qualify them before passing them to your human sales reps.',
  },
  {
    q: 'How quickly can it launch?',
    a: 'We audit your operations, map your specific business rules, build the custom AI solution architecture, and deploy it into your environment seamlessly.',
  },
  {
    q: 'Is our corporate and customer data secure?',
    a: 'Absolutely. We follow strict data privacy standards. All customer data, CRM interactions, and proprietary business rules are fully encrypted and belong exclusively to your business.',
  },
  {
    q: 'What kind of support do you provide?',
    a: 'We provide ongoing support and continuous optimization. You get direct access to our engineering team for adjustments, workflow updates, or new CRM integrations to ensure maximum ROI.',
  },
  {
    q: 'What communication channels does the AI support?',
    a: 'Our systems deploy across standard B2B touchpoints. This includes voice calls, WhatsApp Business API, SMS, and email, all synced together to your centralized CRM dashboard.',
  },
  {
    q: 'Do I need a developer or technical skills to get started?',
    a: 'No coding is required on your part. Our engineers handle 100% of the technical setup, database configuration, CRM integrations, and AI training as part of our comprehensive onboarding workflow.',
  },
  {
    q: 'How does the AI integrate with our existing CRM?',
    a: 'Seevora seamlessly integrates with your existing tech stack. The AI automatically updates records, logs interactions, and triggers workflows within your CRM, eliminating manual data entry.',
  },
  {
    q: 'Can we customize the AI agent\'s tone and sales script?',
    a: 'Absolutely. During the build phase, we translate your existing sales playbooks and preferences into the AI model. You have full control over the tone, ensuring it aligns perfectly with your brand voice.',
  },
  {
    q: 'Is there an initial audit available?',
    a: 'Yes! We offer a free Discovery & Process Mapping audit. Our engineers will review your current operations and draft a tailored automation blueprint mapping out potential cost reductions and efficiency gains.',
  },
  {
    q: 'Can your AI Sales Agents handle complex B2B negotiations?',
    a: 'While the AI excels at lead qualification, initial outreach, and answering detailed product questions, we typically design the workflow to seamlessly hand off warm, highly-qualified leads to your senior human sales executives for final negotiations and closing.',
  },
  {
    q: 'Which CRMs do your AI solutions integrate with?',
    a: 'We build custom API connectors, meaning we can integrate with virtually any modern CRM—including Salesforce, HubSpot, Zoho, Pipedrive, and Monday.com—as well as proprietary legacy systems, ensuring a flawless bidirectional sync of all your data.',
  },
  {
    q: 'How do you ensure the AI doesn\'t hallucinate or give wrong information?',
    a: 'We use advanced Retrieval-Augmented Generation (RAG) combined with strict guardrails. The AI is explicitly restricted to only use your approved knowledge base, sales playbooks, and corporate data, preventing it from making up false claims.',
  },
  {
    q: 'Can Seevora automate our entire outbound email and outreach process?',
    a: 'Yes. We can design multi-channel AI agents that research prospects, draft hyper-personalized outreach messages based on company data, and automatically trigger intelligent follow-up sequences, feeding all positive responses directly into your CRM.',
  },
  {
    q: 'What makes Seevora different from standard chatbot builders?',
    a: 'We don\'t provide a DIY drag-and-drop tool. We are a full-service technology partner. We analyze your unique B2B sales pipeline, custom-engineer the AI agents, build the complex CRM integrations, and provide continuous optimization to guarantee your ROI.',
  },
  {
    q: 'Can you generate custom AI agents and merge them with our existing software?',
    a: 'Yes, we specialize in building custom AI agents and seamlessly merging them with your existing software stack to create a unified, intelligent ecosystem tailored to your business workflows.',
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

  return (
    <>
      {/* Only add SEO tags when rendered as a standalone page */}
      {isPage && (
        <>
          <SEOHead
            title={pagesSEO.faq.title}
            description={pagesSEO.faq.description}
            keywords={pagesSEO.faq.keywords}
            path={pagesSEO.faq.path}
            image={pagesSEO.faq.image}
            type={pagesSEO.faq.type}
          />
          <StructuredData data={faqSchema} />
        </>
      )}

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
              <div className="glass-card" onClick={() => toggle(i)}>
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-icon">+</span>
                </div>
                <div
                  className="faq-answer"
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
