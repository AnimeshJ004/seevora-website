import React, { useEffect } from 'react';
import SEOHead from '../common/SEOHead';
import StructuredData from '../common/StructuredData';
import { pagesSEO } from '../../config/seo';
import { generateOrganizationSchema } from '../../utils/schemaGenerators';

const outcomes = [
  {
    num: '01',
    category: 'Business Research',
    title: 'Deep Operational Mapping.',
    desc: 'We start by thoroughly researching your B2B model to identify exact friction points and uncover where AI integration will drive the highest impact.',
    metric: '100% Custom Strategy',
    benefit: 'Ensures that every AI agent deployed is perfectly tailored to your unique business model.'
  },
  {
    num: '02',
    category: 'Software Merging',
    title: 'Seamless Multi-Agent Integration.',
    desc: 'We don\'t just add another tool; we deploy specialized AI agents and fuse them deeply with your existing software stack, CRMs, and databases.',
    metric: 'Unified Ecosystems',
    benefit: 'Creates a fully modernized, interconnected workflow without replacing your current software.'
  },
  {
    num: '03',
    category: 'Process Automation',
    title: 'Eliminate Repetitive Manual Labor.',
    desc: 'Complex data handoffs, lead routing, and repetitive operational tasks are completely automated by intelligent agents working in the background.',
    metric: '80% Manual Task Reduction',
    benefit: 'Frees your staff from tedious data entry, allowing them to focus entirely on high-value strategy.'
  },
  {
    num: '04',
    category: 'Revenue Generation',
    title: 'Accelerated B2B Sales Cycles.',
    desc: 'By automating lead qualification, meeting coordination, and follow-ups, we modernize your operations to drive deals through the pipeline faster.',
    metric: '3x Sales Conversion Boost',
    benefit: 'Empowers your sales team to handle a significantly larger pipeline with unprecedented speed.'
  },
  {
    num: '05',
    category: 'Time Efficiency',
    title: 'Massive Time Savings Delivered.',
    desc: 'The ultimate result of our multi-agent software merging is time. Your entire organizational workflow becomes faster, smoother, and highly efficient.',
    metric: '100+ Hours Saved Weekly',
    benefit: 'Provides management with transparent metrics while saving the entire team countless hours every week.'
  }
];

export default function ImpactPage() {
  const handleBookCall = (e) => {
    e.preventDefault();
    window.location.assign('/book-a-call');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      <SEOHead
        title={pagesSEO.impact.title}
        description={pagesSEO.impact.description}
        keywords={pagesSEO.impact.keywords}
        path={pagesSEO.impact.path}
        image={pagesSEO.impact.image}
        type={pagesSEO.impact.type}
      />
      <StructuredData data={organizationSchema} />

      <div className="impact-page" style={{ background: 'var(--bg-deep)', padding: '140px 0 100px' }}>
      <div className="container">
        
        {/* Page Banner Header */}
        <div data-animate style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 className="section-title">
            <span className="reveal-mask">
              <span className="reveal-text">Measurable Value. <span className="gradient-text">Delivered.</span></span>
            </span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '640px' }}>
            Every Seevora deployment focuses on real business metrics: deep workflow modernization, massive time savings, and accelerated B2B sales growth.
          </p>
        </div>

        {/* Outcomes List */}
        <div className="impact-list">
          {outcomes.map((item, i) => (
            <div
              key={item.num}
              className="impact-item-card"
              data-animate="impact-card-3d"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="impact-card-side">
                <span className="impact-card-number">{item.num}</span>
                <span className="impact-card-metric">{item.metric}</span>
              </div>
              
              <div className="impact-card-main">
                <span className="impact-card-category">{item.category}</span>
                <h3>{item.title}</h3>
                <p className="impact-card-desc">{item.desc}</p>
                <div className="impact-card-benefit">
                  <strong>Key Benefit:</strong> {item.benefit}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Outro */}
        <div className="services-outro-cta" data-animate style={{ marginTop: '80px' }}>
          <h4>Ready to modernize your B2B sales operations?</h4>
          <p>We research your business model and build custom AI agent ecosystems to drive your growth.</p>
          <div className="outro-buttons" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a href="#" className="btn-primary" onClick={handleBookCall}>
              Book a Business Audit
            </a>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
