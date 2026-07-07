import React from 'react';
import { generateBreadcrumbSchema } from '../../utils/schemaGenerators';
import { generateBreadcrumbs } from '../../utils/seoHelpers';
import StructuredData from './StructuredData';

/**
 * Breadcrumbs Component
 * 
 * Displays breadcrumb navigation and adds BreadcrumbList structured data
 * 
 * @param {Object} props
 * @param {string} props.path - Current page path
 * @param {Array<Object>} props.customBreadcrumbs - Custom breadcrumb items (optional)
 * @param {boolean} props.showSchema - Whether to include schema markup (default: true)
 */
export default function Breadcrumbs({ 
  path, 
  customBreadcrumbs = null, 
  showSchema = true 
}) {
  // Generate breadcrumbs from path or use custom ones
  const breadcrumbs = customBreadcrumbs || generateBreadcrumbs(path);

  // Don't show breadcrumbs for home page or if only home exists
  if (breadcrumbs.length <= 1) {
    return null;
  }

  // Generate schema markup
  const breadcrumbSchema = showSchema ? generateBreadcrumbSchema(breadcrumbs) : null;

  const handleClick = (e, crumbPath) => {
    e.preventDefault();
    window.history.pushState({}, '', crumbPath);
    window.dispatchEvent(new Event('locationchange'));
    window.scrollTo(0, 0);
  };

  return (
    <>
      {breadcrumbSchema && <StructuredData data={breadcrumbSchema} />}
      
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumbs-list">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <li key={index} className="breadcrumb-item">
                {!isLast ? (
                  <>
                    <a 
                      href={crumb.path} 
                      onClick={(e) => handleClick(e, crumb.path)}
                      className="breadcrumb-link"
                    >
                      {crumb.name}
                    </a>
                    <span className="breadcrumb-separator" aria-hidden="true">
                      /
                    </span>
                  </>
                ) : (
                  <span className="breadcrumb-current" aria-current="page">
                    {crumb.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <style>{`
        .breadcrumbs {
          padding: 12px 0;
          margin-bottom: 24px;
        }

        .breadcrumbs-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 8px;
          font-size: 0.875rem;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb-link {
          color: var(--text-secondary, #6b7280);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb-link:hover {
          color: var(--accent, #6366f1);
          text-decoration: underline;
        }

        .breadcrumb-separator {
          color: var(--text-tertiary, #9ca3af);
          user-select: none;
        }

        .breadcrumb-current {
          color: var(--text-primary, #1f2937);
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .breadcrumbs-list {
            font-size: 0.8125rem;
            gap: 6px;
          }
        }
      `}</style>
    </>
  );
}
