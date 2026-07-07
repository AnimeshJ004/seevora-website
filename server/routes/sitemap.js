/**
 * Sitemap XML Generator
 * 
 * Generates dynamic sitemap.xml for search engine crawlers
 * Lists all public pages with priority and change frequency
 */

const SITE_URL = 'https://seevora.in';

// Define all public routes with their SEO properties
const routes = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/services',
    priority: 0.9,
    changefreq: 'weekly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/modules',
    priority: 0.8,
    changefreq: 'weekly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/impact',
    priority: 0.8,
    changefreq: 'weekly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/about',
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/book-a-call',
    priority: 0.9,
    changefreq: 'monthly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/faqs',
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: new Date().toISOString().split('T')[0]
  }
  // Note: Privacy Policy and Terms & Conditions are excluded (noindex)
  // Note: Login, Admin, Dashboard, HR pages are excluded (private)
];

/**
 * Generate sitemap XML content
 */
function generateSitemapXML() {
  const urlTags = routes.map(route => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlTags}
</urlset>`;
}

/**
 * Express route handler for /sitemap.xml
 */
export default function sitemapHandler(req, res) {
  try {
    const xml = generateSitemapXML();
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}
