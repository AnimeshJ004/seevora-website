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

    // Network Canvas Animation
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles = [];
    const particleCount = 50;
    const connectionDistance = 150;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(22, 168, 216, 0.6)';
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(22, 168, 216, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
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
      
      <style>{`
        .impact-page {
          padding-top: 0 !important;
        }
      `}</style>

      <div className="impact-page light-theme-page" style={{ 
        background: '#f8fafc', 
        paddingBottom: '100px',
        paddingTop: '0 !important',
        color: '#0f172a', 
        margin: 0, 
        padding: '0 0 100px 0',
        position: 'relative',
        width: '100%'
      }}>
        
        {/* Full-Screen Animated Network + Video Hero Section */}
        <div className="impact-hero-header" style={{ 
          position: 'relative',
          top: 0,
          left: 0,
          right: 0,
          minHeight: '100vh',
          overflow: 'hidden', 
          margin: '0',
          marginTop: '0',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1a'
        }}>
          {/* Background Image Layer — Robot pointing at AI network (Pexels/Tara Winstead) */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '-10px',
            width: 'calc(100% + 20px)',
            height: 'calc(100% + 20px)',
            overflow: 'hidden',
            zIndex: 0
          }}>
            {/* Main image */}
            <img
              src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1920"
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                minWidth: '110%',
                minHeight: '110%',
                width: 'auto',
                height: 'auto',
                objectFit: 'cover',
                opacity: 0.55,
              }}
            />
            {/* Dark gradient overlay for text readability */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,14,26,0.65) 0%, rgba(10,14,26,0.35) 50%, rgba(10,14,26,0.8) 100%)',
              zIndex: 1
            }} />
          </div>

          {/* Animated Canvas Network Overlay */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '-10px',
            width: 'calc(100% + 20px)',
            height: 'calc(100% + 20px)',
            zIndex: 1
          }}>
            <canvas 
              id="networkCanvas" 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            ></canvas>
          </div>
            
          {/* Glowing Elements Overlay */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
            <div style={{
              position: 'absolute',
              top: '20%',
              right: '15%',
              width: '12px',
              height: '12px',
              background: '#16a8d8',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(22, 168, 216, 0.8)',
              animation: 'pulse-glow 2s ease-in-out infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '60%',
              left: '20%',
              width: '10px',
              height: '10px',
              background: '#16a8d8',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(22, 168, 216, 0.7)',
              animation: 'pulse-glow 2.5s ease-in-out infinite',
              animationDelay: '0.5s'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '25%',
              right: '25%',
              width: '8px',
              height: '8px',
              background: '#16a8d8',
              borderRadius: '50%',
              boxShadow: '0 0 12px rgba(22, 168, 216, 0.6)',
              animation: 'pulse-glow 3s ease-in-out infinite',
              animationDelay: '1s'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '35%',
              width: '10px',
              height: '10px',
              background: '#16a8d8',
              borderRadius: '50%',
              boxShadow: '0 0 18px rgba(22, 168, 216, 0.75)',
              animation: 'pulse-glow 2.2s ease-in-out infinite',
              animationDelay: '1.5s'
            }}></div>
          </div>

          {/* Dark Gradient Overlay for Text Readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(10, 14, 26, 0.4) 0%, rgba(10, 14, 26, 0.7) 100%)',
            zIndex: 2
          }}></div>

          {/* Text Content Overlay */}
          <div className="container" style={{ position: 'relative', zIndex: 3, textAlign: 'center' }}>
            <div data-animate>
              <h1 style={{ 
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: '800',
                lineHeight: '1.1',
                marginBottom: '24px',
                color: '#ffffff',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
              }}>
                <span className="reveal-mask">
                  <span className="reveal-text">
                    Measurable Value. <span style={{ color: '#9CA3AF' }}>Delivered.</span>
                  </span>
                </span>
              </h1>
              <p style={{ 
                fontSize: '1.25rem',
                lineHeight: '1.7',
                color: '#e2e8f0',
                margin: '0 auto',
                maxWidth: '720px',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}>
                Every Seevora deployment focuses on real business metrics: deep workflow modernization, massive time savings, and accelerated B2B sales growth.
              </p>
            </div>
          </div>
        </div>

        <div className="container" style={{ background: '#f8fafc', paddingTop: '80px', marginTop: '0', position: 'relative' }}>
          {/* Outcomes List without Videos */}
          <div className="impact-list">
            {outcomes.map((item, i) => (
              <div
                key={item.num}
                className="impact-item-card light-impact-card-text-only"
                data-animate="impact-card-3d"
                style={{ transitionDelay: `${i * 0.1}s`, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.05)' }}
              >
                <div className="impact-card-side" style={{ borderColor: 'rgba(15, 23, 42, 0.1)', background: '#f8fafc' }}>
                  <span className="impact-card-number" style={{ color: '#16a8d8' }}>{item.num}</span>
                  <span className="impact-card-metric" style={{ color: '#0f172a' }}>{item.metric}</span>
                </div>
                
                <div className="impact-card-main">
                  <span className="impact-card-category" style={{ color: '#64748b' }}>{item.category}</span>
                  <h3 style={{ color: '#0f172a' }}>{item.title}</h3>
                  <p className="impact-card-desc" style={{ color: '#475569' }}>{item.desc}</p>
                  <div className="impact-card-benefit" style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left', marginTop: '-4px', padding: '12px 16px', borderRadius: '8px' }}>
                    <strong style={{ color: '#0f172a' }}>Key Benefit:</strong> {item.benefit}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Outro */}
          <div className="services-outro-cta light-outro" data-animate style={{ marginTop: '80px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ color: '#0f172a' }}>Ready to modernize your B2B sales operations?</h4>
            <p style={{ color: '#475569' }}>We research your business model and build custom AI agent ecosystems to drive your growth.</p>
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
