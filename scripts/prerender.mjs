/**
 * scripts/prerender.mjs
 *
 * Static Meta Pre-renderer for Seevora SPA
 *
 * Purpose
 * -------
 * Vite builds a single dist/index.html. When Google crawls /faqs, /services
 * etc. it gets that blank shell and all meta tags are wrong (home-page values).
 * This script runs AFTER vite build (as a postbuild hook) and creates a
 * per-route dist/{route}/index.html with the correct <title>, <meta description>,
 * <link canonical>, og:*, and twitter:* tags for every public page.
 *
 * Google will now see the right title and description for EVERY page
 * without needing to execute JavaScript at all.
 *
 * Limitation (acceptable)
 * -----------------------
 * The React component HTML (body content) is NOT pre-rendered — only the
 * <head> meta layer is patched. Body content still requires JS. However,
 * the FAQ structured data is already embedded statically in index.html,
 * so crawlers can read FAQ schema without JS.
 *
 * How to run
 * ----------
 * Automatically runs via:  npm run build  (postbuild hook in package.json)
 * Manually:                node scripts/prerender.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir   = join(__dirname, '..', 'dist');
const SITE_URL  = 'https://seevora.in';

// ─── Per-route metadata ──────────────────────────────────────────────────────
// Mirrors the pagesSEO config in src/config/seo.js.
// Update here whenever you update page titles/descriptions in seo.js.

const routes = [
  {
    path:        '/services',
    title:       'AI Automation Services for 7+ Industries | Seevora',
    description: 'Custom AI solutions for Healthcare, Education, Wellness, Diagnostics, Fitness, Legal & Real Estate. 24/7 voice receptionist, WhatsApp automation, appointment booking. Deployed in 5 days.',
    keywords:    'healthcare AI automation India, education automation, wellness automation, diagnostic lab automation, AI services India',
  },
  {
    path:        '/modules',
    title:       'AI Automation Modules & Features | Seevora',
    description: 'Complete AI automation platform with voice receptionist, WhatsApp chat, appointment booking, CRM, analytics & more. All modules integrate seamlessly for maximum efficiency.',
    keywords:    'AI modules, automation features, voice receptionist, WhatsApp automation, booking system India',
  },
  {
    path:        '/impact',
    title:       'Real Business Results from AI Automation | Seevora',
    description: 'See how businesses achieve 92% reduction in missed calls, 40% fewer no-shows, and 8+ hours saved weekly with Seevora AI automation. Measurable ROI in 90 days.',
    keywords:    'AI automation ROI, business automation results, AI impact India, automation case studies',
  },
  {
    path:        '/about',
    title:       'About Seevora — AI Automation Company in Indore, India',
    description: 'Indore-based AI automation company serving businesses across India. We build custom AI solutions that solve real problems for healthcare, education, and service businesses.',
    keywords:    'AI company India, AI automation company Indore, about Seevora, AI experts India',
  },
  {
    path:        '/faqs',
    title:       'Frequently Asked Questions About AI Automation | Seevora',
    description: 'Common questions about Seevora AI automation: setup time (5 days), pricing, Hindi support, data security, CRM integrations & more. Answers from our AI engineers.',
    keywords:    'AI automation FAQ, AI receptionist questions, WhatsApp automation help, AI setup India',
  },
  {
    path:        '/book-a-call',
    title:       'Book a Free AI Audit | Contact Seevora',
    description: 'Get a free AI workflow audit from our Indore-based engineering team. Discover how to automate your business processes and reduce costs. Book your call now.',
    keywords:    'AI audit free, contact Seevora, book AI consultation, AI automation quote India',
  },
  {
    path:        '/privacy-policy',
    title:       'Privacy Policy | Seevora',
    description: 'Seevora privacy policy and data protection practices. Learn how we handle your business and customer data with industry-leading security standards.',
    keywords:    'privacy policy, data protection, Seevora privacy',
    noindex:     true,
  },
  {
    path:        '/terms-and-conditions',
    title:       'Terms and Conditions | Seevora',
    description: 'Seevora terms of service and usage conditions. Review our service agreements and usage policies before using our AI automation platform.',
    keywords:    'terms and conditions, terms of service, Seevora terms',
    noindex:     true,
  },
];

// ─── HTML helpers ────────────────────────────────────────────────────────────

/** Escape text for safe insertion into HTML attribute values */
function esc(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/"/g,  '&quot;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');
}

/**
 * Patch all <head> meta tags in the HTML template for a specific route.
 * Uses regex replace — safe because the template structure is fully known.
 */
function patchHead(template, route) {
  const { title, description, keywords, noindex } = route;
  const canonical = `${SITE_URL}${route.path}`;
  let html = template;

  // <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${esc(title)}</title>`
  );

  // <meta name="title">
  html = html.replace(
    /(<meta name="title"\s+content=")[^"]*(")/i,
    `$1${esc(title)}$2`
  );

  // <meta name="description"> (may span two lines)
  html = html.replace(
    /(<meta name="description"[\s\S]*?content=")[^"]*(")/i,
    `$1${esc(description)}$2`
  );

  // <meta name="keywords"> (may span two lines)
  html = html.replace(
    /(<meta name="keywords"[\s\S]*?content=")[^"]*(")/i,
    `$1${esc(keywords)}$2`
  );

  // <meta name="robots"> — noindex for legal pages
  if (noindex) {
    html = html.replace(
      /(<meta name="robots"\s+content=")[^"]*(")/i,
      `$1noindex, nofollow$2`
    );
  }

  // <link rel="canonical">
  html = html.replace(
    /(<link rel="canonical"\s+href=")[^"]*(")/i,
    `$1${canonical}$2`
  );

  // Open Graph
  html = html.replace(/(<meta property="og:url"\s+content=")[^"]*(")/i,       `$1${canonical}$2`);
  html = html.replace(/(<meta property="og:title"\s+content=")[^"]*(")/i,     `$1${esc(title)}$2`);
  html = html.replace(
    /(<meta property="og:description"[\s\S]*?content=")[^"]*(")/i,
    `$1${esc(description)}$2`
  );

  // Twitter Card
  html = html.replace(/(<meta name="twitter:url"\s+content=")[^"]*(")/i,      `$1${canonical}$2`);
  html = html.replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/i,    `$1${esc(title)}$2`);
  html = html.replace(
    /(<meta name="twitter:description"[\s\S]*?content=")[^"]*(")/i,
    `$1${esc(description)}$2`
  );

  return html;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const templatePath = join(distDir, 'index.html');
  let template;

  try {
    template = readFileSync(templatePath, 'utf-8');
  } catch {
    console.error(`\n❌  Pre-render: dist/index.html not found.`);
    console.error(`   Run  npm run build  before this script.\n`);
    process.exit(1);
  }

  console.log('\n🔧  Seevora Static Pre-renderer');
  console.log('   Patching <head> meta tags for each public route...\n');

  let count = 0;
  for (const route of routes) {
    const patched  = patchHead(template, route);
    
    // 1. Write flat html (e.g., dist/about.html) — for Vercel cleanUrls
    const flatFile = join(distDir, `${route.path}.html`);
    mkdirSync(dirname(flatFile), { recursive: true });
    writeFileSync(flatFile, patched, 'utf-8');

    // 2. Write directory index.html (e.g., dist/about/index.html) — for trailing-slash routing
    const routeDir  = join(distDir, route.path);
    mkdirSync(routeDir, { recursive: true });
    writeFileSync(join(routeDir, 'index.html'), patched, 'utf-8');

    const kb = (Buffer.byteLength(patched, 'utf-8') / 1024).toFixed(1);
    const label = route.noindex ? ' [noindex]' : '';
    console.log(`   ✅  dist${route.path}.html & dist${route.path}/index.html  (${kb} KB)${label}`);
    count++;
  }

  console.log(`\n✨  Done — ${count} routes pre-rendered (both .html & /index.html generated).`);
  console.log('   Google & Vercel now serve pre-rendered pages seamlessly with zero 404s.\n');
}

main();
