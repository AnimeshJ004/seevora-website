/**
 * Robots.txt Generator
 * 
 * Generates dynamic robots.txt to guide search engine crawlers
 * Specifies which paths can be crawled and where to find the sitemap
 */

const SITE_URL = 'https://seevora.in';

/**
 * Generate robots.txt content
 */
function generateRobotsTxt() {
  return `# Robots.txt for Seevora
# https://seevora.in

# Allow all bots to crawl public pages
User-agent: *
Allow: /
Allow: /services
Allow: /modules
Allow: /impact
Allow: /about
Allow: /book-a-call
Allow: /faqs

# Disallow private/admin areas
Disallow: /admin
Disallow: /dashboard
Disallow: /hr
Disallow: /login
Disallow: /api/

# Disallow uploaded files (private documents)
Disallow: /uploads/

# Optional: Legal pages (already have noindex meta tags)
Disallow: /privacy-policy
Disallow: /terms-and-conditions

# Crawl delay (optional - 1 second between requests)
Crawl-delay: 1

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml

# Specific bot rules

# Google
User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /hr
Disallow: /login
Disallow: /api/
Disallow: /uploads/

# Bing
User-agent: Bingbot
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /hr
Disallow: /login
Disallow: /api/
Disallow: /uploads/

# Yandex
User-agent: Yandex
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /hr
Disallow: /login
Disallow: /api/
Disallow: /uploads/
`;
}

/**
 * Express route handler for /robots.txt
 */
export default function robotsHandler(req, res) {
  try {
    const txt = generateRobotsTxt();
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.status(200).send(txt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
}
