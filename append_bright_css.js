const fs = require('fs');

const cssToAdd = \
/* Bright Hero Styling */
.bright-hero .hero-curves-bg {
  filter: brightness(0.9) !important;
}

.bright-hero .hero-title .hero-typed-line, 
.bright-hero .hero-title .hero-rotating-phrase-text {
  color: #111111 !important;
  text-shadow: 0 4px 20px rgba(255, 255, 255, 0.8) !important;
}

.bright-hero .hero-subtitle {
  color: #222222 !important;
  font-weight: 600 !important;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.8) !important;
}

.bright-hero .hero-badge {
  background: #111111 !important;
  color: #ffffff !important;
  border-color: #333333 !important;
}

/* Enhanced Text Animation */
.text-animate-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(20px);
  animation: charReveal 0.6s cubic-bezier(0.2, 1, 0.3, 1) forwards;
}

@keyframes charReveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
\;

fs.appendFileSync('src/index.css', cssToAdd);
console.log('Appended bright hero CSS!');
