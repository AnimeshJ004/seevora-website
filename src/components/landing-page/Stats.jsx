import React, { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 40, suffix: '%', label: 'Average Cost Reduction', sublabel: 'Within 90 days of deployment' },
  { value: 10, suffix: '×', label: 'Faster Processing', sublabel: 'Compared to manual workflows' },
  { value: 99, suffix: '%', label: 'Accuracy Rate', sublabel: 'On structured data tasks' },
];

function AnimatedCounter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const duration = 2000;
        const startTime = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref} className="stat-number">{count}{suffix}</span>;
}

export default function Stats() {
  return (
    <section className="stats section" id="stats">
      <div className="bg-glow bg-glow-1" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Proven Impact</div>
          <h2 className="section-title">Results You Can <span className="gradient-text">Expect</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Our AI solutions deliver measurable business outcomes from day one.
          </p>
        </div>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-card" data-animate="scale-in" style={{ transitionDelay: `${i * 0.12}s` }}>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
              <div className="stat-label">{s.label}</div>
              <div className="stat-sublabel">{s.sublabel}</div>
            </div>
          ))}
        </div>
        <p className="stat-disclaimer" data-animate>* Disclaimer: Statistics are based on audited average outcomes across active Seevora client deployments within 90 days of launch.</p>
      </div>
    </section>
  );
}
