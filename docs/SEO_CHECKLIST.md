# SEO Implementation Checklist

Use this checklist to ensure all SEO requirements are met when adding new pages or updating content.

## New Page SEO Checklist

### 1. Configuration
- [ ] Add page data to `src/config/seo.js` in `pagesSEO` object
  - [ ] Unique, descriptive title (50-60 characters)
  - [ ] Compelling meta description (150-160 characters)
  - [ ] Relevant keywords array (5-10 keywords)
  - [ ] Correct path
  - [ ] Appropriate OG image
  - [ ] Correct type (website, article, etc.)

### 2. Component Implementation
- [ ] Import SEOHead component
- [ ] Import StructuredData component
- [ ] Import pagesSEO from config
- [ ] Import relevant schema generators
- [ ] Add SEOHead with all props
- [ ] Add StructuredData with appropriate schema
- [ ] Wrap content in fragment `<>...</>`

### 3. Content Optimization
- [ ] H1 tag present and unique
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Keywords naturally integrated in content
- [ ] Alt text on all images
- [ ] Internal links to related pages
- [ ] External links open in new tab (if applicable)

### 4. Technical SEO
- [ ] Add route to `server/routes/sitemap.js`
- [ ] Set appropriate priority (0.0 - 1.0)
- [ ] Set changefreq (daily, weekly, monthly)
- [ ] Update lastmod date
- [ ] Verify route in `src/App.jsx`
- [ ] Test lazy loading works

### 5. Schema Markup
- [ ] Organization schema (global)
- [ ] Page-specific schema (Service, FAQ, Article, etc.)
- [ ] Breadcrumb schema (if multi-level navigation)
- [ ] Validate schema using Schema Markup Validator

### 6. Image Optimization
- [ ] All images have descriptive alt text
- [ ] Images below fold use `loading="lazy"`
- [ ] Images use `decoding="async"`
- [ ] Images optimized (< 200KB recommended)
- [ ] Responsive images with srcset (if needed)

### 7. Mobile Optimization
- [ ] Test on mobile device
- [ ] Verify touch targets are 44x44px minimum
- [ ] Check text is readable without zooming
- [ ] Ensure no horizontal scrolling
- [ ] Test form fields work properly

### 8. Performance
- [ ] Page loads in < 3 seconds
- [ ] Largest Contentful Paint < 2.5s
- [ ] First Input Delay < 100ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] No render-blocking resources

### 9. Testing & Validation
- [ ] Test meta tags in browser DevTools
- [ ] Validate structured data in Rich Results Test
- [ ] Test Open Graph with Facebook Debugger
- [ ] Test Twitter Card with Twitter Validator
- [ ] Run Lighthouse audit (target 90+ SEO score)
- [ ] Test 404 handling
- [ ] Test canonical URL is correct

### 10. Documentation
- [ ] Update SEO_GUIDE.md if introducing new patterns
- [ ] Document any custom schema implementations
- [ ] Note any SEO decisions in code comments

---

## Content Update Checklist

Use this when updating existing page content:

- [ ] Review and update meta description if needed
- [ ] Update keywords if content focus changed
- [ ] Check H1 still accurately reflects page content
- [ ] Verify internal links still relevant
- [ ] Update lastmod date in sitemap.js
- [ ] Re-validate structured data
- [ ] Test page load performance
- [ ] Re-run Lighthouse audit

---

## Pre-Launch Checklist

Before deploying to production:

### Technical Validation
- [ ] All pages have unique titles
- [ ] All pages have unique descriptions
- [ ] No duplicate H1 tags on same page
- [ ] Sitemap.xml accessible at /sitemap.xml
- [ ] Robots.txt accessible at /robots.txt
- [ ] All public pages in sitemap
- [ ] Private pages excluded from sitemap
- [ ] Canonical URLs correct on all pages
- [ ] 404 page works for invalid URLs
- [ ] No console errors on any page

### Schema Validation
- [ ] All schemas pass Rich Results Test
- [ ] Organization schema present on all pages
- [ ] LocalBusiness schema on appropriate pages
- [ ] FAQ schema on FAQ page
- [ ] Service schemas on Services page
- [ ] No schema validation errors

### Performance
- [ ] Lighthouse SEO score 90+
- [ ] Lighthouse Performance score 80+
- [ ] Lighthouse Accessibility score 90+
- [ ] Lighthouse Best Practices score 90+
- [ ] All Core Web Vitals in green
- [ ] Mobile performance acceptable

### Meta Tags
- [ ] Open Graph tags validated
- [ ] Twitter Card tags validated
- [ ] Geographic tags present
- [ ] Language tags correct
- [ ] Theme color set
- [ ] Favicon present and loading

### Content
- [ ] No spelling/grammar errors
- [ ] All links working (no 404s)
- [ ] Images loading correctly
- [ ] Videos/media working
- [ ] Forms functional
- [ ] CTA buttons working

---

## Post-Launch Checklist

After deploying to production:

### Search Engine Submission
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Request indexing for homepage
- [ ] Request indexing for key pages
- [ ] Set up Google Analytics (optional)
- [ ] Set up Google Search Console alerts

### Monitoring Setup
- [ ] Enable Search Console email notifications
- [ ] Monitor indexing status weekly
- [ ] Check for crawl errors
- [ ] Monitor Core Web Vitals
- [ ] Track keyword rankings
- [ ] Review search analytics monthly

### Social Media
- [ ] Test social sharing on Facebook
- [ ] Test social sharing on Twitter
- [ ] Test social sharing on LinkedIn
- [ ] Verify preview images display correctly
- [ ] Check preview text is compelling

---

## Monthly Maintenance Checklist

### Performance Review
- [ ] Review Google Search Console performance
- [ ] Check for indexing issues
- [ ] Review Core Web Vitals
- [ ] Check for manual actions/penalties
- [ ] Review top performing pages
- [ ] Identify underperforming pages

### Technical Health
- [ ] Check for 404 errors
- [ ] Verify sitemap up to date
- [ ] Check robots.txt still correct
- [ ] Review structured data errors
- [ ] Check mobile usability
- [ ] Verify HTTPS working

### Content Health
- [ ] Update outdated content
- [ ] Refresh old blog posts (if applicable)
- [ ] Add new FAQs based on customer questions
- [ ] Update service descriptions if changed
- [ ] Review and update meta descriptions
- [ ] Check competitor keywords

### Opportunities
- [ ] Identify new keyword opportunities
- [ ] Plan new content based on search trends
- [ ] Optimize underperforming pages
- [ ] Build internal links to new content
- [ ] Update schema markup with new features

---

## Troubleshooting Checklist

### Meta Tags Not Showing

- [ ] Check react-helmet-async installed
- [ ] Verify HelmetProvider in main.jsx
- [ ] Clear browser cache
- [ ] Test in incognito mode
- [ ] Check for JavaScript errors in console
- [ ] Verify component is being rendered

### Structured Data Errors

- [ ] Validate JSON-LD syntax
- [ ] Check @context is "https://schema.org"
- [ ] Verify @type is correct
- [ ] Check all required properties present
- [ ] Test in Schema Markup Validator
- [ ] Check for quote/bracket errors

### Page Not Indexing

- [ ] Check robots.txt not blocking
- [ ] Verify no noindex meta tag
- [ ] Check canonical URL is correct
- [ ] Submit URL in Search Console
- [ ] Wait 24-48 hours for crawl
- [ ] Check for manual actions

### Poor Performance

- [ ] Run Lighthouse audit
- [ ] Identify blocking resources
- [ ] Optimize large images
- [ ] Check for render-blocking CSS/JS
- [ ] Enable code splitting
- [ ] Review third-party scripts

---

## Tools & Resources

### Validation Tools
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Google PageSpeed Insights: https://pagespeed.web.dev/

### Monitoring Tools
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmasters
- Google Analytics: https://analytics.google.com/

### SEO Tools
- Google Keyword Planner: https://ads.google.com/home/tools/keyword-planner/
- Ubersuggest: https://neilpatel.com/ubersuggest/
- AnswerThePublic: https://answerthepublic.com/

---

**Note**: Keep this checklist updated as your SEO strategy evolves.

**Last Updated**: July 2026
