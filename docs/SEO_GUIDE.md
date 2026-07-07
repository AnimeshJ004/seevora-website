# SEO Implementation Guide for Seevora

## Overview

This guide documents the comprehensive SEO, GEO (Geographic), and AEO (Answer Engine Optimization) implementation for the Seevora website. The implementation is designed to achieve top 10 search engine rankings while maintaining all existing functionality.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [SEO Components](#seo-components)
3. [How to Update SEO for Pages](#how-to-update-seo-for-pages)
4. [Schema.org Structured Data](#schemaorg-structured-data)
5. [Image Optimization](#image-optimization)
6. [Performance Optimizations](#performance-optimizations)
7. [Testing and Validation](#testing-and-validation)
8. [Maintenance Guidelines](#maintenance-guidelines)

---

## Architecture Overview

### Key Technologies
- **react-helmet-async**: Dynamic meta tag management for React SPA
- **Schema.org JSON-LD**: Structured data for rich search results
- **React.lazy()**: Code splitting for performance
- **Express routes**: Server-side sitemap.xml and robots.txt generation

### File Structure
```
src/
├── config/
│   └── seo.js                 # Centralized SEO configuration
├── utils/
│   ├── seoHelpers.js          # SEO utility functions
│   └── schemaGenerators.js    # Schema.org generators
├── components/
│   └── common/
│       ├── SEOHead.jsx        # Meta tags component
│       ├── StructuredData.jsx # JSON-LD component
│       └── Breadcrumbs.jsx    # Breadcrumb navigation
server/
└── routes/
    ├── sitemap.js             # Sitemap generator
    └── robots.js              # Robots.txt generator
```

---

## SEO Components

### 1. SEOHead Component

The `SEOHead` component manages all meta tags for a page.

**Usage:**
```jsx
import SEOHead from '../common/SEOHead';
import { pagesSEO } from '../../config/seo';

<SEOHead
  title={pagesSEO.home.title}
  description={pagesSEO.home.description}
  keywords={pagesSEO.home.keywords}
  path={pagesSEO.home.path}
  image={pagesSEO.home.image}
  type={pagesSEO.home.type}
/>
```

**Props:**
- `title` (string): Page title
- `description` (string): Meta description
- `keywords` (array): Array of keywords
- `path` (string): Page path for canonical URL
- `image` (string): OG image URL
- `type` (string): OG type (website, article, etc.)
- `noindex` (boolean): Whether to noindex the page

### 2. StructuredData Component

The `StructuredData` component renders JSON-LD structured data.

**Usage:**
```jsx
import StructuredData from '../common/StructuredData';
import { generateOrganizationSchema } from '../../utils/schemaGenerators';

const organizationSchema = generateOrganizationSchema();

<StructuredData data={organizationSchema} />
```

You can pass a single schema object or an array of schemas:
```jsx
<StructuredData data={[schema1, schema2, schema3]} />
```

### 3. Breadcrumbs Component

The `Breadcrumbs` component adds navigation and BreadcrumbList schema.

**Usage:**
```jsx
import Breadcrumbs from '../common/Breadcrumbs';

<Breadcrumbs path="/services" />
```

---

## How to Update SEO for Pages

### Step 1: Update SEO Configuration

Edit `src/config/seo.js` to add or modify page-specific SEO data:

```javascript
export const pagesSEO = {
  newpage: {
    title: 'Your Page Title',
    description: 'Your page description (150-160 characters)',
    keywords: ['keyword1', 'keyword2', 'keyword3'],
    path: '/newpage',
    image: seoConfig.defaultImage.url,
    type: 'website'
  }
};
```

### Step 2: Add SEO to Your Page Component

```jsx
import React from 'react';
import SEOHead from '../common/SEOHead';
import StructuredData from '../common/StructuredData';
import { pagesSEO } from '../../config/seo';
import { generateOrganizationSchema } from '../../utils/schemaGenerators';

export default function YourPage() {
  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      <SEOHead
        title={pagesSEO.newpage.title}
        description={pagesSEO.newpage.description}
        keywords={pagesSEO.newpage.keywords}
        path={pagesSEO.newpage.path}
        image={pagesSEO.newpage.image}
        type={pagesSEO.newpage.type}
      />
      <StructuredData data={organizationSchema} />

      <section className="your-page">
        {/* Your page content */}
      </section>
    </>
  );
}
```

### Step 3: Update Sitemap

Add your new route to `server/routes/sitemap.js`:

```javascript
const routes = [
  // ... existing routes
  {
    path: '/newpage',
    priority: 0.8,
    changefreq: 'weekly',
    lastmod: new Date().toISOString().split('T')[0]
  }
];
```

---

## Schema.org Structured Data

### Available Schema Generators

All schema generators are in `src/utils/schemaGenerators.js`:

1. **generateOrganizationSchema()** - Company information
2. **generateLocalBusinessSchema()** - Local business with GEO data
3. **generateWebSiteSchema()** - Website metadata
4. **generateServiceSchema(data)** - Individual service
5. **generateFAQSchema(faqs)** - FAQ page for AEO
6. **generateBreadcrumbSchema(breadcrumbs)** - Breadcrumb navigation
7. **generateHowToSchema(data)** - Step-by-step guides
8. **generateArticleSchema(data)** - Blog posts/articles
9. **generateContactPageSchema()** - Contact page

### Example: Adding Service Schema

```jsx
import { generateServiceSchema } from '../../utils/schemaGenerators';

const serviceSchema = generateServiceSchema({
  id: 'healthcare-automation',
  name: 'Healthcare AI Automation',
  description: '24/7 AI receptionist for clinics and hospitals',
  type: 'AI Automation Service',
  category: 'Healthcare'
});

<StructuredData data={serviceSchema} />
```

### Example: Adding FAQ Schema

```jsx
import { generateFAQSchema } from '../../utils/schemaGenerators';

const faqs = [
  { q: 'How much does it cost?', a: 'Pricing starts at...' },
  { q: 'How long does setup take?', a: 'Setup takes 5 business days.' }
];

const faqSchema = generateFAQSchema(faqs);

<StructuredData data={faqSchema} />
```

---

## Image Optimization

### Lazy Loading

All images below the fold should use lazy loading:

```jsx
<img 
  src={imageSrc} 
  alt="Descriptive alt text" 
  loading="lazy" 
  decoding="async"
/>
```

### Above-the-Fold Images

Images in the viewport on page load should NOT use lazy loading:

```jsx
<img 
  src={logoSrc} 
  alt="Company Logo" 
  decoding="async"
/>
```

### Image Best Practices

1. **Alt text**: Always provide descriptive alt text
2. **Responsive images**: Consider using `<picture>` for multiple sizes
3. **Format**: Use modern formats (WebP) with fallbacks
4. **Dimensions**: Always specify width and height to prevent CLS
5. **File size**: Optimize images to < 200KB when possible

---

## Performance Optimizations

### Code Splitting

All page components are lazy-loaded using React.lazy():

```jsx
const HomePage = lazy(() => import('./components/landing-page/HomePage'));
```

Wrapped with Suspense:

```jsx
<Suspense fallback={<LoadingFallback />}>
  <HomePage />
</Suspense>
```

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Performance Checklist

- ✅ Code splitting implemented
- ✅ Images lazy-loaded
- ✅ Async image decoding
- ✅ Preconnect to external domains
- ✅ DNS prefetch for critical resources
- ✅ Minimal render-blocking resources

---

## Testing and Validation

### Required Tools

1. **Google Search Console**: Submit sitemap, monitor indexing
2. **Google Rich Results Test**: Validate structured data
3. **Facebook Sharing Debugger**: Test Open Graph tags
4. **Twitter Card Validator**: Test Twitter Card markup
5. **Lighthouse**: Measure performance and SEO score
6. **Schema Markup Validator**: Validate JSON-LD

### Testing Checklist

#### Before Launch

- [ ] Run Lighthouse audit (target: 90+ SEO score)
- [ ] Validate all structured data in Rich Results Test
- [ ] Test meta tags in browser DevTools
- [ ] Check sitemap.xml at `/sitemap.xml`
- [ ] Check robots.txt at `/robots.txt`
- [ ] Verify canonical URLs on all pages
- [ ] Test 404 page
- [ ] Test on mobile devices
- [ ] Check page load speed (< 3s)

#### After Launch

- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Request indexing for key pages
- [ ] Monitor Core Web Vitals
- [ ] Track keyword rankings
- [ ] Monitor structured data errors

### Validation Commands

```bash
# Test sitemap locally
curl http://localhost:4000/sitemap.xml

# Test robots.txt locally
curl http://localhost:4000/robots.txt

# View page source to check meta tags
# Open browser DevTools > Elements > <head>
```

### Online Tools

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Markup Validator**: https://validator.schema.org/
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Google PageSpeed Insights**: https://pagespeed.web.dev/

---

## Maintenance Guidelines

### Monthly Tasks

1. **Review keyword rankings** using Google Search Console
2. **Check for indexing issues** in Search Console
3. **Monitor Core Web Vitals** performance
4. **Update sitemap** if new pages added
5. **Check for broken links** using tools like Screaming Frog
6. **Review structured data errors** in Search Console

### When Adding New Pages

1. Add SEO data to `src/config/seo.js`
2. Import and use SEOHead component
3. Add appropriate structured data
4. Update sitemap.js with new route
5. Test meta tags and schema markup
6. Submit updated sitemap to search engines

### When Updating Content

1. Update meta descriptions if content changes significantly
2. Refresh lastmod date in sitemap.js
3. Re-validate structured data if page structure changes
4. Update keywords if targeting changes

### Troubleshooting

**Meta tags not updating?**
- Check that react-helmet-async is properly installed
- Verify HelmetProvider wraps your App in main.jsx
- Clear browser cache and test in incognito mode

**Structured data not showing in Rich Results?**
- Validate JSON-LD using Schema Markup Validator
- Ensure @context and @type are present
- Check for syntax errors in console
- Allow time for Google to re-crawl (24-48 hours)

**Page not appearing in search results?**
- Check robots.txt isn't blocking the page
- Verify noindex tag is not present
- Submit URL for indexing in Search Console
- Check canonical URL points to correct page

---

## Quick Reference

### Adding SEO to a New Page

```jsx
// 1. Import dependencies
import SEOHead from '../common/SEOHead';
import StructuredData from '../common/StructuredData';
import { pagesSEO } from '../../config/seo';
import { generateOrganizationSchema } from '../../utils/schemaGenerators';

// 2. Generate schema
const organizationSchema = generateOrganizationSchema();

// 3. Add to component return
return (
  <>
    <SEOHead
      title={pagesSEO.yourpage.title}
      description={pagesSEO.yourpage.description}
      keywords={pagesSEO.yourpage.keywords}
      path={pagesSEO.yourpage.path}
    />
    <StructuredData data={organizationSchema} />
    <section>{/* Content */}</section>
  </>
);
```

### Updating Business Information

Edit `src/config/seo.js`:

```javascript
business: {
  name: 'Seevora',
  email: 'hello@seevora.in',
  phone: '+91-XXXXXXXXXX', // UPDATE THIS
  address: {
    streetAddress: 'XXX Business District', // UPDATE THIS
    addressLocality: 'Indore',
    addressRegion: 'Madhya Pradesh',
    postalCode: 'XXXXXX', // UPDATE THIS
    addressCountry: 'IN'
  }
}
```

---

## Support

For questions or issues with SEO implementation:
1. Review this documentation
2. Check browser console for errors
3. Validate using online tools
4. Test in incognito/private browsing mode

---

**Last Updated**: July 2026  
**Version**: 1.0.0
