/**
 * SEO Helper Utilities
 * 
 * Utility functions for generating SEO-related data
 */

import seoConfig from '../config/seo';

/**
 * Generate canonical URL for a given path
 * @param {string} path - The page path
 * @returns {string} Full canonical URL
 */
export function getCanonicalUrl(path = '/') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const urlWithoutTrailingSlash = cleanPath.endsWith('/') && cleanPath !== '/' 
    ? cleanPath.slice(0, -1) 
    : cleanPath;
  return `${seoConfig.siteUrl}${urlWithoutTrailingSlash}`;
}

/**
 * Generate full page title with template
 * @param {string} pageTitle - The page-specific title
 * @param {boolean} useTemplate - Whether to use the title template
 * @returns {string} Formatted title
 */
export function getPageTitle(pageTitle, useTemplate = true) {
  if (!pageTitle) return seoConfig.defaultTitle;
  if (!useTemplate) return pageTitle;
  return seoConfig.titleTemplate.replace('%s', pageTitle);
}

/**
 * Format keywords array into comma-separated string
 * @param {Array<string>} keywords - Array of keywords
 * @returns {string} Comma-separated keywords
 */
export function formatKeywords(keywords = []) {
  return keywords.join(', ');
}

/**
 * Get full image URL
 * @param {string} imagePath - Relative or absolute image path
 * @returns {string} Full image URL
 */
export function getFullImageUrl(imagePath) {
  if (!imagePath) return seoConfig.defaultImage.url;
  if (imagePath.startsWith('http')) return imagePath;
  return `${seoConfig.siteUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
}

/**
 * Generate hreflang tags data
 * @returns {Array<Object>} Array of hreflang objects
 */
export function getHreflangTags() {
  return seoConfig.alternateLanguages.map(alt => ({
    rel: 'alternate',
    hreflang: alt.lang,
    href: alt.url
  }));
}

/**
 * Validate required SEO fields
 * @param {Object} seoData - SEO data object to validate
 * @returns {Object} Validation result with isValid and missing fields
 */
export function validateSEOData(seoData) {
  const requiredFields = ['title', 'description'];
  const missing = requiredFields.filter(field => !seoData[field]);
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings: []
  };
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 160) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate structured breadcrumb path from URL
 * @param {string} pathname - Current URL pathname
 * @returns {Array<Object>} Breadcrumb items with name and path
 */
export function generateBreadcrumbs(pathname) {
  // Remove leading/trailing slashes and split
  const paths = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  
  // Start with home
  const breadcrumbs = [
    { name: 'Home', path: '/' }
  ];
  
  // Build breadcrumb trail
  let currentPath = '';
  paths.forEach((segment) => {
    currentPath += `/${segment}`;
    const name = formatBreadcrumbName(segment);
    breadcrumbs.push({ name, path: currentPath });
  });
  
  return breadcrumbs;
}

/**
 * Format URL segment into human-readable breadcrumb name
 * @param {string} segment - URL segment
 * @returns {string} Formatted name
 */
function formatBreadcrumbName(segment) {
  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get page-specific SEO data
 * @param {string} pathname - Current URL pathname
 * @returns {Object} SEO data for the page
 */
export function getPageSEOData(pathname) {
  const routeMap = {
    '/': 'home',
    '/services': 'services',
    '/modules': 'modules',
    '/impact': 'impact',
    '/about': 'about',
    '/book-a-call': 'contact',
    '/faqs': 'faq',
    '/privacy-policy': 'privacy',
    '/terms-and-conditions': 'terms'
  };
  
  const pageKey = routeMap[pathname];
  
  // Return page-specific data or fallback to defaults
  if (pageKey && seoConfig.pagesSEO && seoConfig.pagesSEO[pageKey]) {
    return seoConfig.pagesSEO[pageKey];
  }
  
  // Fallback for unknown pages
  return {
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    keywords: seoConfig.defaultKeywords,
    path: pathname,
    image: seoConfig.defaultImage.url,
    type: 'website'
  };
}

/**
 * Generate JSON-LD script tag content
 * @param {Object} schemaData - Schema.org structured data
 * @returns {string} JSON-LD string
 */
export function generateJSONLD(schemaData) {
  return JSON.stringify(schemaData, null, 2);
}

/**
 * Check if URL should be indexed
 * @param {string} pathname - Current URL pathname
 * @returns {boolean} Whether page should be indexed
 */
export function shouldIndexPage(pathname) {
  const noIndexPaths = [
    '/login',
    '/admin',
    '/dashboard',
    '/hr',
    '/privacy-policy',
    '/terms-and-conditions'
  ];
  
  return !noIndexPaths.some(path => pathname.startsWith(path));
}

/**
 * Get robots meta tag content
 * @param {string} pathname - Current URL pathname
 * @returns {string} Robots directive
 */
export function getRobotsContent(pathname) {
  if (shouldIndexPage(pathname)) {
    return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  }
  return 'noindex, nofollow';
}

export default {
  getCanonicalUrl,
  getPageTitle,
  formatKeywords,
  getFullImageUrl,
  getHreflangTags,
  validateSEOData,
  truncateText,
  generateBreadcrumbs,
  getPageSEOData,
  generateJSONLD,
  shouldIndexPage,
  getRobotsContent
};
