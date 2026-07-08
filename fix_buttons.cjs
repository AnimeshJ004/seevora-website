const fs = require('fs');
let code = fs.readFileSync('src/components/landing-page/HomePage.jsx', 'utf8');

code = code.replace(
  /<button\s*className="btn-pill btn-pill-primary"[^>]*>[\s\S]*?<\/button>/,
  \<button className="btn-accenture btn-accenture-primary" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Start your transformation
              <svg className="accenture-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>\
);

code = code.replace(
  /<button\s*className="btn-pill btn-pill-secondary"[^>]*>[\s\S]*?<\/button>/,
  \<button className="btn-accenture btn-accenture-secondary" onClick={() => document.getElementById('why-seevora')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore our process
              <svg className="accenture-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>\
);

fs.writeFileSync('src/components/landing-page/HomePage.jsx', code);
console.log('JSX Buttons updated');
