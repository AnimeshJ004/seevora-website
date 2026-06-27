import React from 'react';

const steps = [
  {
    title: 'Discovery & Process Mapping',
    desc: 'We audit your operations, identify the highest-ROI automation target, and define measurable success criteria before writing a single line of code.',
  },
  {
    title: 'AI Solution Architecture',
    desc: 'Our engineers design a custom AI pipeline tailored to your data, systems, and compliance requirements — using the right models for each sub-task.',
  },
  {
    title: 'Build, Test & Validate',
    desc: 'We develop and rigorously test your solution against real-world data. Every model is validated for accuracy, speed, and edge-case handling.',
  },
  {
    title: 'Deploy & Optimize',
    desc: 'We deploy into your environment, monitor performance in production, and continuously optimize. You get ongoing support and measurable ROI reporting.',
  },
];

export default function Workflow() {
  return (
    <section className="workflow section" id="workflow">
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}><span className="dot" />Our Process</div>
          <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            A structured, transparent approach from discovery to deployment.
          </p>
        </div>

        <div className="workflow-timeline">
          <div className="traveling-dot" />
          {steps.map((step, i) => (
            <div
              key={i}
              className="workflow-step"
              data-animate="tilt-in"
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className="step-number">{i + 1}</div>
              <div className="glass-card">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
