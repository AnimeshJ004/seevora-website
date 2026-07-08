import React from 'react';
import SEOHead from '../common/SEOHead';

/**
 * 404 Not Found Page
 * 
 * SEO-friendly 404 page with helpful navigation
 */
export default function NotFoundPage() {
  const handleGoHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('locationchange'));
    window.scrollTo(0, 0);
  };

  const handleGoServices = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/services');
    window.dispatchEvent(new Event('locationchange'));
    window.scrollTo(0, 0);
  };

  const handleGoContact = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/book-a-call');
    window.dispatchEvent(new Event('locationchange'));
    window.scrollTo(0, 0);
  };

  return (
    <>
      <SEOHead
        title="404 - Page Not Found"
        description="The page you're looking for doesn't exist. Explore Seevora's AI automation solutions or contact us for help."
        noindex={true}
        path="/404"
      />

      <div className="not-found-page">
        <div className="bg-grid" />
        <div className="container">
          <div className="not-found-content">
            <div className="not-found-code" data-animate>404</div>
            
            <h1 className="not-found-title" data-animate>
              Page Not Found
            </h1>
            
            <p className="not-found-description" data-animate>
              Oops! The page you're looking for doesn't exist or has been moved.
              <br />
              Let's get you back on track.
            </p>

            <div className="not-found-actions" data-animate>
              <button className="btn-primary" onClick={handleGoHome}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Go to Homepage
              </button>
              
              <button className="btn-glass" onClick={handleGoServices}>
                Explore Services
              </button>
              
              <button className="btn-glass" onClick={handleGoContact}>
                Contact Us
              </button>
            </div>

            <div className="not-found-sitemap" data-animate>
              <h3>Quick Links</h3>
              <div className="sitemap-grid">
                <div className="sitemap-column">
                  <h4>Company</h4>
                  <ul>
                    <li><a href="/" onClick={handleGoHome}>Home</a></li>
                    <li><a href="/about" onClick={(e) => { e.preventDefault(); window.location.assign('/about'); }}>About</a></li>
                    <li><a href="/impact" onClick={(e) => { e.preventDefault(); window.location.assign('/impact'); }}>Impact</a></li>
                  </ul>
                </div>
                
                <div className="sitemap-column">
                  <h4>Solutions</h4>
                  <ul>
                    <li><a href="/services" onClick={handleGoServices}>Services</a></li>
                    <li><a href="/modules" onClick={(e) => { e.preventDefault(); window.location.assign('/modules'); }}>Modules</a></li>
                  </ul>
                </div>
                
                <div className="sitemap-column">
                  <h4>Support</h4>
                  <ul>
                    <li><a href="/faqs" onClick={(e) => { e.preventDefault(); window.location.assign('/faqs'); }}>FAQs</a></li>
                    <li><a href="/book-a-call" onClick={handleGoContact}>Book a Call</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .not-found-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 80px 0;
            position: relative;
            background: var(--bg-deep);
            overflow: hidden;
          }

          .not-found-content {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
          }

          .not-found-code {
            font-size: 120px;
            font-weight: 900;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            -webkit-text-fill-color: transparent;
            line-height: 1;
            margin-bottom: 24px;
            letter-spacing: -0.02em;
          }

          .not-found-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 16px;
          }

          .not-found-description {
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin-bottom: 40px;
            line-height: 1.6;
          }

          .not-found-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 60px;
          }

          .not-found-actions .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .not-found-sitemap {
            margin-top: 60px;
            padding-top: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .not-found-sitemap h3 {
            font-size: 1.25rem;
            color: var(--text-primary);
            margin-bottom: 32px;
          }

          .sitemap-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 32px;
            text-align: left;
          }

          .sitemap-column h4 {
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-bottom: 16px;
            font-weight: 600;
          }

          .sitemap-column ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .sitemap-column li {
            margin-bottom: 12px;
          }

          .sitemap-column a {
            color: var(--text-primary);
            text-decoration: none;
            transition: color 0.2s ease;
            display: inline-block;
          }

          .sitemap-column a:hover {
            color: var(--accent);
            text-decoration: underline;
          }

          @media (max-width: 768px) {
            .not-found-code {
              font-size: 80px;
            }

            .not-found-title {
              font-size: 2rem;
            }

            .not-found-description {
              font-size: 1rem;
            }

            .not-found-actions {
              flex-direction: column;
              align-items: stretch;
            }

            .sitemap-grid {
              grid-template-columns: 1fr;
              gap: 24px;
            }
          }
        `}</style>
      </div>
    </>
  );
}
