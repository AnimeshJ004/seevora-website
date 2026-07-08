const fs = require('fs');

const cssToAdd = \
/* =============================
   ACCENTURE REDESIGN STYLES
   ============================= */

/* Universal Sharp Edges */
.card, .btn, .why-carousel-card, .glass-card, .btn-primary, .btn-secondary, input, textarea, select {
  border-radius: 0 !important;
}

/* Scroll Reveal Animations */
[data-animate] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}
[data-animate].animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* Accenture Sharp Typography & Backgrounds */
.centered-hero h1 {
  font-family: var(--font-display);
  font-weight: 850;
  font-size: clamp(3.5rem, 8vw, 6rem) !important;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.why-seevora {
  background-color: #050505 !important;
}
.why-seevora .section-title {
  color: #ffffff;
}
.why-seevora .section-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

/* Accenture Signature Buttons */
.btn-accenture {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 20px 32px;
  border-radius: 0; /* Sharp corners */
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.35, 1);
  position: relative;
  overflow: hidden;
}

.btn-accenture-primary {
  background: var(--landing-ink);
  color: #fff;
}
.btn-accenture-primary:hover {
  background: #6F7F33; /* Switch to brand green on hover */
}

.btn-accenture-secondary {
  background: transparent;
  color: var(--landing-ink);
  border: 1px solid var(--landing-ink);
}
.btn-accenture-secondary:hover {
  background: rgba(111, 127, 51, 0.1);
  border-color: #6F7F33;
}

.accenture-arrow {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.35, 1);
}

.btn-accenture:hover .accenture-arrow {
  transform: translateX(6px);
}
\;

fs.appendFileSync('src/index.css', cssToAdd);
console.log('Appended Accenture CSS!');
