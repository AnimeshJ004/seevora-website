/**
 * Schema.org Structured Data Generators
 * 
 * Functions to generate JSON-LD structured data for various schema types
 * Follows schema.org specifications for SEO and rich results
 */

import seoConfig from '../config/seo';
import { getCanonicalUrl } from './seoHelpers';

/**
 * Generate Organization schema
 * @param {Object} customData - Custom organization data to override defaults
 * @returns {Object} Organization schema
 */
export function generateOrganizationSchema(customData = {}) {
  const { business, socialProfiles, logo, siteUrl, knowsAbout } = seoConfig;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: customData.name || business.name,
    legalName: customData.legalName || business.legalName,
    description: customData.description || business.description,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logo,
      width: 512,
      height: 512
    },
    image: logo,
    email: business.email,
    telephone: business.phone,
    foundingDate: business.foundingDate,
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: business.numberOfEmployees
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.address.addressLocality,
      addressRegion: business.address.addressRegion,
      addressCountry: business.address.addressCountry
    },
    sameAs: Object.values(socialProfiles).filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: business.phone,
      contactType: 'Customer Service',
      email: business.email,
      areaServed: 'IN',
      availableLanguage: business.languages
    }
  };

  // GEO: Entity expertise signals for AI search engines
  if (business.slogan) {
    schema.slogan = business.slogan;
  }
  if (knowsAbout && knowsAbout.length > 0) {
    schema.knowsAbout = knowsAbout;
  }

  return schema;
}

/**
 * Generate LocalBusiness schema for GEO optimization
 * @param {Object} customData - Custom business data
 * @returns {Object} LocalBusiness schema
 */
export function generateLocalBusinessSchema(customData = {}) {
  const { business, siteUrl, logo, openingHours } = seoConfig;
  
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SoftwareCompany'],
    '@id': `${siteUrl}/#localbusiness`,
    name: business.name,
    image: logo,
    description: business.description,
    telephone: business.phone,
    email: business.email,
    priceRange: business.priceRange,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.address.addressLocality,
      addressRegion: business.address.addressRegion,
      addressCountry: business.address.addressCountry
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: customData.latitude || 22.7196, // Indore, India
      longitude: customData.longitude || 75.8577
    },
    url: siteUrl,
    openingHoursSpecification: openingHours.map(hours => {
      const [days, time] = hours.split(' ');
      const [open, close] = time.split('-');
      
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days.split('-').map(day => {
          const dayMap = {
            'Mo': 'Monday',
            'Tu': 'Tuesday',
            'We': 'Wednesday',
            'Th': 'Thursday',
            'Fr': 'Friday',
            'Sa': 'Saturday',
            'Su': 'Sunday'
          };
          return dayMap[day];
        }),
        opens: open,
        closes: close
      };
    }),
    areaServed: business.serviceAreas.map(area => ({
      '@type': area === 'India' ? 'Country' : 'City',
      name: area
    })),
    ...customData
  };
}

/**
 * Generate WebSite schema
 * @returns {Object} WebSite schema
 */
export function generateWebSiteSchema() {
  const { siteName, siteUrl } = seoConfig;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: siteName,
    url: siteUrl,
    // Note: SearchAction removed — this SPA has no server-side search endpoint.
    // Add back only when a real search feature (e.g. /search?q=) is implemented.
    publisher: {
      '@id': `${siteUrl}/#organization`
    }
  };
}

/**
 * Generate Service schema for service pages
 * @param {Object} serviceData - Service information
 * @returns {Object} Service schema
 */
export function generateServiceSchema(serviceData) {
  const { business, siteUrl } = seoConfig;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${siteUrl}/services#${serviceData.id || serviceData.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: serviceData.name,
    description: serviceData.description,
    provider: {
      '@id': `${siteUrl}/#organization`
    },
    areaServed: business.serviceAreas.map(area => ({
      '@type': 'City',
      name: area
    })),
    serviceType: serviceData.type || 'AI Automation',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${siteUrl}/services`,
      servicePhone: business.phone,
      availableLanguage: business.languages
    },
    category: serviceData.category || 'Technology',
    ...serviceData.additionalProps
  };
}

/**
 * Generate multiple Service schemas for all services
 * @returns {Array} Array of Service schemas
 */
export function generateAllServicesSchema() {
  return seoConfig.services.map(service => generateServiceSchema(service));
}

/**
 * Generate FAQPage schema for FAQ sections
 * @param {Array<Object>} faqs - Array of FAQ objects with q and a properties
 * @returns {Object} FAQPage schema
 */
export function generateFAQSchema(faqs) {
  if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
    console.warn('generateFAQSchema: Invalid or empty FAQ array');
    return null;
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q || faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a || faq.answer
      }
    }))
  };
}

/**
 * Generate BreadcrumbList schema
 * @param {Array<Object>} breadcrumbs - Array of breadcrumb items with name and path
 * @returns {Object} BreadcrumbList schema
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  const { siteUrl } = seoConfig;
  
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`
    }))
  };
}

/**
 * Generate HowTo schema for process/step content
 * @param {Object} howToData - HowTo data with name, description, steps
 * @returns {Object} HowTo schema
 */
export function generateHowToSchema(howToData) {
  const { siteUrl } = seoConfig;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howToData.name,
    description: howToData.description,
    image: howToData.image ? {
      '@type': 'ImageObject',
      url: howToData.image
    } : undefined,
    totalTime: howToData.totalTime || 'P5D', // ISO 8601 duration (5 days)
    estimatedCost: howToData.estimatedCost ? {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: howToData.estimatedCost
    } : undefined,
    step: howToData.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title || step.name,
      text: step.desc || step.description,
      url: howToData.url ? `${howToData.url}#step-${index + 1}` : undefined,
      image: step.image ? {
        '@type': 'ImageObject',
        url: step.image
      } : undefined
    }))
  };
}

/**
 * Generate Article schema for blog posts/articles
 * @param {Object} articleData - Article data
 * @returns {Object} Article schema
 */
export function generateArticleSchema(articleData) {
  const { business, siteUrl, logo } = seoConfig;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${siteUrl}${articleData.path}#article`,
    headline: articleData.title,
    description: articleData.description,
    image: articleData.image || logo,
    datePublished: articleData.publishedDate,
    dateModified: articleData.modifiedDate || articleData.publishedDate,
    author: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: business.name
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: business.name,
      logo: {
        '@type': 'ImageObject',
        url: logo
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}${articleData.path}`
    },
    articleSection: articleData.category || 'Technology',
    keywords: articleData.keywords ? articleData.keywords.join(', ') : undefined,
    inLanguage: 'en-IN'
  };
}

/**
 * Generate AggregateRating schema for reviews
 * @param {Object} ratingData - Rating data with ratingValue, reviewCount
 * @returns {Object} AggregateRating schema
 */
export function generateAggregateRatingSchema(ratingData) {
  return {
    '@type': 'AggregateRating',
    ratingValue: ratingData.ratingValue || 5,
    bestRating: ratingData.bestRating || 5,
    worstRating: ratingData.worstRating || 1,
    ratingCount: ratingData.ratingCount || 0,
    reviewCount: ratingData.reviewCount || 0
  };
}

/**
 * Generate Review schema
 * @param {Object} reviewData - Review data
 * @returns {Object} Review schema
 */
export function generateReviewSchema(reviewData) {
  return {
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: reviewData.authorName
    },
    datePublished: reviewData.date,
    reviewBody: reviewData.text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewData.rating,
      bestRating: 5,
      worstRating: 1
    }
  };
}

/**
 * Generate ContactPage schema
 * @returns {Object} ContactPage schema
 */
export function generateContactPageSchema() {
  const { business, siteUrl } = seoConfig;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${siteUrl}/book-a-call#contactpage`,
    name: 'Contact Seevora',
    description: 'Get in touch with Seevora for AI automation solutions',
    url: `${siteUrl}/book-a-call`,
    mainEntity: {
      '@id': `${siteUrl}/#organization`
    }
  };
}

/**
 * Generate complete schema set for a page
 * @param {string} pageType - Type of page (home, services, contact, etc.)
 * @param {Object} customData - Custom data for the page
 * @returns {Array} Array of schemas for the page
 */
export function generatePageSchemas(pageType, customData = {}) {
  const schemas = [];
  
  // All pages get Organization and WebSite
  schemas.push(generateOrganizationSchema());
  schemas.push(generateWebSiteSchema());
  
  // Page-specific schemas
  switch (pageType) {
    case 'home':
      schemas.push(generateLocalBusinessSchema());
      if (customData.howTo) {
        schemas.push(generateHowToSchema(customData.howTo));
      }
      break;
      
    case 'services':
      schemas.push(generateLocalBusinessSchema());
      // Add service schemas
      if (customData.services) {
        customData.services.forEach(service => {
          schemas.push(generateServiceSchema(service));
        });
      }
      break;
      
    case 'faq':
      if (customData.faqs) {
        schemas.push(generateFAQSchema(customData.faqs));
      }
      break;
      
    case 'contact':
      schemas.push(generateContactPageSchema());
      break;
      
    case 'article':
      if (customData.article) {
        schemas.push(generateArticleSchema(customData.article));
      }
      break;
      
    default:
      // Generic page - just Organization and WebSite
      break;
  }
  
  // Add breadcrumbs if provided
  if (customData.breadcrumbs) {
    schemas.push(generateBreadcrumbSchema(customData.breadcrumbs));
  }
  
  return schemas.filter(Boolean); // Remove any null schemas
}

/**
 * Generate Speakable schema for AEO voice search optimization
 * @param {string} pageUrl - The URL of the page
 * @param {Array<string>} cssSelectors - CSS selectors for speakable content
 * @returns {Object} Speakable schema
 */
export function generateSpeakableSchema(pageUrl, cssSelectors) {
  if (!cssSelectors || cssSelectors.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors
    },
    url: pageUrl
  };
}

/**
 * Generate SoftwareApplication schema for GEO product attribution
 * @returns {Object} SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema() {
  const { business, siteUrl, logo } = seoConfig;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Seevora AI Platform',
    description: business.description,
    url: siteUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    image: logo,
    author: {
      '@id': `${siteUrl}/#organization`
    },
    offers: {
      '@type': 'Offer',
      price: '',
      priceCurrency: 'INR',
      description: 'Custom pricing based on business requirements and automation scope. Book a free AI audit to get a tailored quote.',
      url: `${siteUrl}/book-a-call`
    }
  };
}

export default {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebSiteSchema,
  generateServiceSchema,
  generateAllServicesSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateHowToSchema,
  generateArticleSchema,
  generateAggregateRatingSchema,
  generateReviewSchema,
  generateContactPageSchema,
  generatePageSchemas,
  generateSpeakableSchema,
  generateSoftwareApplicationSchema
};
