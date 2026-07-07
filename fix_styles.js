const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');
const start = code.indexOf('.why-carousel-card {');
const end = code.indexOf('.carousel-nav-btn {');
if (start !== -1 && end !== -1) {
  const newCss = \.why-carousel-card {
  position: absolute;
  width: 420px;
  min-height: 480px;
  border-radius: 24px;
  padding: 40px;
  background: #111;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  text-align: left;
  transition: all 0.6s cubic-bezier(0.25, 1, 0.35, 1);
  transform-origin: center center;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
}

.why-carousel-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
  transition: transform 0.6s ease;
}

.why-carousel-card:hover .why-carousel-bg {
  transform: scale(1.05);
}

.why-carousel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%);
  z-index: 1;
}

.why-carousel-card.active {
  z-index: 3;
  transform: translateX(0) scale(1) translateZ(0);
  opacity: 1;
  cursor: default;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
}

.why-carousel-card.prev {
  z-index: 2;
  transform: translateX(-45%) scale(0.85) translateZ(-100px) rotateY(15deg);
  opacity: 0.4;
  filter: blur(2px);
}

.why-carousel-card.next {
  z-index: 2;
  transform: translateX(45%) scale(0.85) translateZ(-100px) rotateY(-15deg);
  opacity: 0.4;
  filter: blur(2px);
}

.why-carousel-card.hidden {
  z-index: 1;
  transform: translateX(0) scale(0.7) translateZ(-200px);
  opacity: 0;
  pointer-events: none;
}

.why-carousel-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.why-carousel-title {
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 850;
  margin-bottom: 12px;
  line-height: 1.1;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.why-carousel-badge {
  background: rgba(111, 127, 51, 0.9);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
}

.why-carousel-desc {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 0;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

\;
  code = code.substring(0, start) + newCss + code.substring(end);
  fs.writeFileSync('src/index.css', code);
  console.log('CSS Replaced');
}
