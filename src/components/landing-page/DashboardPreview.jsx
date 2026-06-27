import React from 'react';

const metrics = [
  { label: 'Calls Handled Today', value: '47', sub: '+12% vs yesterday', color: 'cyan' },
  { label: 'Hot Leads', value: '9', sub: '3 follow-up due today', color: 'orange' },
  { label: 'Appointments Booked', value: '23', sub: '2 waitlist filled', color: 'green' },
  { label: 'Review Score', value: '4.8★', sub: '6 new reviews this week', color: 'purple' },
  { label: 'No-Show Rate', value: '8%', sub: '↓ from 31% last month', color: 'blue' },
  { label: 'Revenue Trend', value: '↑ 22%', sub: 'vs last month', color: 'green' },
];

const pipeline = [
  { stage: 'Hot', count: 9, color: '#ef4444' },
  { stage: 'Warm', count: 17, color: '#f97316' },
  { stage: 'Cold', count: 31, color: '#64748b' },
];

export default function DashboardPreview() {
  return (
    <section className="dashboard-preview section" id="dashboard">
      <div className="bg-glow bg-glow-1" style={{ top: '30%', left: '-100px' }} />
      <div className="container">
        <div data-animate style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: '0 auto 20px' }}>
            <span className="dot" />Dashboard Preview
          </div>
          <h2 className="section-title">
            Your Entire Business. <span className="gradient-text">One Screen.</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            See how calls, appointments, leads, reviews, and reports look inside one connected dashboard.
          </p>
        </div>

        <div className="dashboard-mockup" data-animate="scale-in">
          {/* Top bar */}
          <div className="dash-topbar">
            <div className="dash-dot" style={{ background: '#ef4444' }} />
            <div className="dash-dot" style={{ background: '#f97316' }} />
            <div className="dash-dot" style={{ background: '#22c55e' }} />
            <span className="dash-title">Seevora Dashboard — Your Business</span>
            <span className="dash-live"><span className="dash-live-dot" />Live</span>
          </div>

          {/* Metrics grid */}
          <div className="dash-metrics">
            {metrics.map((m, i) => (
              <div key={i} className={`dash-metric dash-metric--${m.color}`}>
                <div className="dash-metric-value">{m.value}</div>
                <div className="dash-metric-label">{m.label}</div>
                <div className="dash-metric-sub">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="dash-bottom">
            {/* Lead pipeline */}
            <div className="dash-panel">
              <div className="dash-panel-title">Lead Pipeline</div>
              <div className="dash-pipeline">
                {pipeline.map((p, i) => (
                  <div key={i} className="dash-pipeline-col">
                    <div className="dash-pipeline-header" style={{ color: p.color }}>
                      {p.stage} <span>{p.count}</span>
                    </div>
                    {Array.from({ length: Math.min(p.count, 3) }).map((_, j) => (
                      <div key={j} className="dash-lead-item">
                        <div className="dash-lead-dot" style={{ background: p.color }} />
                        <div className="dash-lead-line" />
                      </div>
                    ))}
                    {p.count > 3 && <div className="dash-lead-more">+{p.count - 3} more</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent calls */}
            <div className="dash-panel">
              <div className="dash-panel-title">AI Voice Log</div>
              {[
                { name: 'Rajesh K.', intent: 'Appointment enquiry', status: 'Lead created', time: '2m ago' },
                { name: 'Priya S.', intent: 'Pricing query', status: 'Warm lead', time: '14m ago' },
                { name: 'Unknown', intent: 'Service info', status: 'Logged', time: '31m ago' },
              ].map((c, i) => (
                <div key={i} className="dash-call-row">
                  <div className="dash-call-avatar">{c.name[0]}</div>
                  <div className="dash-call-info">
                    <span className="dash-call-name">{c.name}</span>
                    <span className="dash-call-intent">{c.intent}</span>
                  </div>
                  <div className="dash-call-right">
                    <span className="dash-call-status">{c.status}</span>
                    <span className="dash-call-time">{c.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Module health */}
            <div className="dash-panel">
              <div className="dash-panel-title">Module Health</div>
              {[
                { name: 'AI Voice', health: 100 },
                { name: 'Appointments', health: 98 },
                { name: 'CRM', health: 100 },
                { name: 'Reviews', health: 95 },
                { name: 'SEO', health: 87 },
              ].map((mod, i) => (
                <div key={i} className="dash-module-row">
                  <span className="dash-module-name">{mod.name}</span>
                  <div className="dash-module-bar">
                    <div className="dash-module-fill" style={{ width: `${mod.health}%`, background: mod.health > 95 ? 'var(--accent-green)' : 'var(--accent-cyan)' }} />
                  </div>
                  <span className="dash-module-pct">{mod.health}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
