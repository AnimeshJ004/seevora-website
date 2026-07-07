import React from 'react';
import { Helmet } from 'react-helmet-async';
import seoConfig, { pagesSEO } from '../../config/seo';
import {
  getCanonicalUrl,
  getPageTitle,
  formatKeywords,
  getFullImageUrl,
  getRobotsContent
} from '../../utils/seoHelpers';

/**
 * SEOHead Component
 * 
 * Dynamically manages meta tags, Open Graph, Twitter Cards, and other SEO elements
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {Array<string>} props.keywords - Page keywords
 * @param {string} props.image - OG image URL
 * @param {string} props.type - OG type (website, article, etc.)
 * @param {string} props.path - Current page path
 * @param {boolean} props.noindex - Whether to noindex the page
 * @param {Object} props.article - Article-specific data (publishedTime, modifiedTime, author)
 * @param {Array<Object>} props.additionalMeta - Additional meta tags
 */
export default function SEOHead({
  title,
  description,
  keywords = [],
  image,
  type = 'website',
  path = '/',
  noindex = false,
  article = null,
  additionalMeta = []
}) {
  // Generate SEO data
  const pageTitle = getPageTitle(title, title !== seoConfig.defaultTitle);
  const pageDescription = description || seoConfig.defaultDescription;
  const pageKeywords = keywords.length > 0 ? keywords : seoConfig.defaultKeywords;
  const pageImage = getFullImageUrl(image || seoConfig.defaultImage.url);
  const canonicalUrl = getCanonicalUrl(path);
  const robotsContent = noindex ? 'noindex, nofollow' : getRobotsContent(path);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={formatKeywords(pageKeywords)} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Language & Region */}
      <meta httpEquiv="content-language" content={seoConfig.language} />
      <meta name="geo.region" content={seoConfig.region} />
      <meta name="geo.placename" content={seoConfig.business.address.addressLocality} />

      {/* Hreflang Tags */}
      {seoConfig.alternateLanguages.map((alt, index) => (
        <link
          key={index}
          rel="alternate"
          hrefLang={alt.lang}
          href={alt.url}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={seoConfig.siteUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:width" content={seoConfig.defaultImage.width.toString()} />
      <meta property="og:image:height" content={seoConfig.defaultImage.height.toString()} />
      <meta property="og:image:alt" content={seoConfig.defaultImage.alt} />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:locale:alternate" content="hi_IN" />

      {/* Article-specific OG tags */}
      {article && type === 'article' && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:author" content={article.author || seoConfig.business.name} />
          <meta property="article:section" content={article.section || 'Technology'} />
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:image:alt" content={seoConfig.defaultImage.alt} />
      {seoConfig.socialProfiles.twitter && (
        <meta name="twitter:site" content={seoConfig.socialProfiles.twitter} />
      )}

      {/* Additional Meta Tags */}
      <meta name="author" content={seoConfig.business.name} />
      <meta name="publisher" content={seoConfig.business.name} />
      <meta name="theme-color" content="#6366f1" />
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={seoConfig.siteName} />

      {/* Custom Additional Meta Tags */}
      {additionalMeta.map((meta, index) => (
        <meta key={index} {...meta} />
      ))}
    </Helmet>
  );
}
