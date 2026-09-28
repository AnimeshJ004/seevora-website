import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../../../auth/api';

/* ── Inline SVG Icons ── */
function Icon({ name, size = 16, color = 'currentColor' }) {
  const icons = {
    trendingUp: <path d="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" />,
    dollar: <path d="M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    pieChart: <path d="M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z" />,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    award: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
    kanban: <><rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" /></>,
    table: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="12" y1="3" x2="12" y2="21" /></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  };

  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      width={size} 
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {icons[name] || null}
    </svg>
  );
}

const STAGE_CONFIG = {
  discovery: { label: 'Discovery', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', next: 'proposal_sent' },
  proposal_sent: { label: 'Proposal Sent', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', next: 'negotiation' },
  negotiation: { label: 'In Negotiation', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', next: 'won' },
  won: { label: 'Closed Won', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', next: null },
  lost: { label: 'Closed Lost', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', next: null },
};

const SERVICES = [
  'AI Voice Agents',
  'Email & WhatsApp AI',
  'CRM Automation',
  'Custom AI Pipeline',
  'AI Chatbot System',
  'Enterprise Support'
];

function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  }
  return `$${num.toLocaleString('en-US')}`;
}

export default function SalesPanel({ user }) {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [deals, setDeals] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [currency, setCurrency] = useState('INR');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedRep, setSelectedRep] = useState('all');
  const [sortBy, setSortBy] = useState('created_at_desc');

  // Modals
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, anRes, dealsRes, repsRes] = await Promise.all([
        apiFetch('/api/sales-panel/overview'),
        apiFetch('/api/sales-panel/analytics'),
        apiFetch(`/api/sales-panel/deals?stage=${selectedStage}&service_type=${selectedService}&rep=${selectedRep}&search=${encodeURIComponent(searchQuery)}&sort=${sortBy}`),
        apiFetch('/api/sales-panel/reps')
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (anRes.ok) setAnalytics(await anRes.json());
      if (dealsRes.ok) setDeals(await dealsRes.json());
      if (repsRes.ok) setReps(await repsRes.json());
    } catch (err) {
      console.error('Failed to load sales panel data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStage, selectedService, selectedRep, searchQuery, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle stage change directly from card
  const handleQuickStageMove = async (dealId, nextStage) => {
    try {
      const res = await apiFetch(`/api/sales-panel/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage })
      });
      if (res.ok) {
        showToast(`Deal advanced to ${STAGE_CONFIG[nextStage]?.label || nextStage}!`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDeal = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await apiFetch(`/api/sales-panel/deals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Deal deleted successfully');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/sales-panel/export-csv', '_blank');
  };

  const handleOpenReport = async () => {
    try {
      const res = await apiFetch('/api/sales-panel/report');
      if (res.ok) {
        setReportData(await res.json());
        setShowReportModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group deals for kanban
  const kanbanStages = ['discovery', 'proposal_sent', 'negotiation', 'won', 'lost'];
  const groupedDeals = useMemo(() => {
    const map = { discovery: [], proposal_sent: [], negotiation: [], won: [], lost: [] };
    deals.forEach(d => {
      if (map[d.stage]) map[d.stage].push(d);
      else map.discovery.push(d);
    });
    return map;
  }, [deals]);

  return (
    <div style={{ padding: '24px 28px', color: '#0f172a', fontFamily: "'Inter', sans-serif", maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, right: 28, zIndex: 99999,
          background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '0.88rem', fontWeight: 600, animation: 'fadeIn 0.2s ease-out'
        }}>
          <span style={{ color: '#10b981' }}><Icon name="check" size={18} /></span>
          {toastMessage}
        </div>
      )}

      {/* ── Top Header & Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Sales Panel & Revenue Analytics
            </h1>
            <span style={{ background: 'rgba(79, 142, 247, 0.12)', color: '#2563eb', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Executive Hub
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Real-time pipeline monitoring, deal progression, and quarterly revenue forecasting.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Currency Toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 8, padding: 3 }}>
            <button 
              onClick={() => setCurrency('INR')}
              style={{
                background: currency === 'INR' ? '#fff' : 'transparent',
                border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
                fontWeight: 700, cursor: 'pointer', color: currency === 'INR' ? '#0f172a' : '#64748b',
                boxShadow: currency === 'INR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ₹ INR
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              style={{
                background: currency === 'USD' ? '#fff' : 'transparent',
                border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
                fontWeight: 700, cursor: 'pointer', color: currency === 'USD' ? '#0f172a' : '#64748b',
                boxShadow: currency === 'USD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              $ USD
            </button>
          </div>

          <button 
            onClick={handleOpenReport}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', border: '1px solid #cbd5e1', padding: '9px 14px',
              borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer'
            }}
          >
            <Icon name="fileText" size={15} /> Executive Report
          </button>

          <button 
            onClick={handleExportCsv}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', border: '1px solid #cbd5e1', padding: '9px 14px',
              borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer'
            }}
          >
            <Icon name="download" size={15} /> Export CSV
          </button>

          <button 
            onClick={() => { setEditingDeal(null); setShowDealModal(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              border: 'none', color: '#fff', padding: '9px 18px',
              borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Icon name="plus" size={16} /> + New Deal
          </button>
        </div>
      </div>

      {/* ── 5 Key Metric Cards (KPIs) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        
        {/* Closed Won Revenue */}
        <div style={{ background: '#fff', padding: '20px 22px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Closed Won Revenue</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: 6, borderRadius: 8 }}>
              <Icon name="dollar" size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {formatCurrency(overview?.totalWonRevenue || 0, currency)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.78rem' }}>
            <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon name="trendingUp" size={13} /> +24%
            </span>
            <span style={{ color: '#64748b' }}>• {overview?.wonDealsCount || 0} deals closed</span>
          </div>
        </div>

        {/* Active Pipeline Value */}
        <div style={{ background: '#fff', padding: '20px 22px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Pipeline</span>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: 6, borderRadius: 8 }}>
              <Icon name="pieChart" size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {formatCurrency(overview?.pipelineValue || 0, currency)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.78rem', color: '#64748b' }}>
            <span>Weighted: </span>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>{formatCurrency(overview?.weightedPipelineValue || 0, currency)}</span>
            <span>({overview?.activeDealsCount || 0} active)</span>
          </div>
        </div>

        {/* Win Rate */}
        <div style={{ background: '#fff', padding: '20px 22px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Win Rate</span>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: 6, borderRadius: 8 }}>
              <Icon name="award" size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {overview?.winRate || 0}%
          </div>
          <div style={{ marginTop: 8, width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${overview?.winRate || 0}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: 4 }} />
          </div>
        </div>

        {/* Average Deal Size */}
        <div style={{ background: '#fff', padding: '20px 22px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Deal Size</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: 6, borderRadius: 8 }}>
              <Icon name="trendingUp" size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {formatCurrency(overview?.avgDealSize || 0, currency)}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#64748b' }}>
            Per closed client engagement
          </div>
        </div>

        {/* Target Attainment */}
        <div style={{ background: '#fff', padding: '20px 22px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target ({overview?.currentTarget?.period || 'Q3'})</span>
            <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: 6, borderRadius: 8 }}>
              <Icon name="target" size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {overview?.currentTarget?.attainmentRate || 0}%
          </div>
          <div style={{ marginTop: 8, width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(overview?.currentTarget?.attainmentRate || 0, 100)}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
          </div>
          <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>Target: {formatCurrency(overview?.currentTarget?.targetRevenue || 0, currency)}</span>
          </div>
        </div>

      </div>

      {/* ── Data Visualizations Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* Viz 1: Monthly Revenue Trend & Forecast (Custom Interactive SVG Chart) */}
        <div style={{ background: '#fff', padding: '22px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#0f172a' }}>
                Revenue Trend & Pipeline Forecast
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Closed won deals vs active pipeline progression
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} /> Won Revenue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: '#93c5fd', borderRadius: 2 }} /> Active Pipeline
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 210, position: 'relative', marginTop: 10 }}>
            <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />

              {/* Draw bars from analytics or fallback data */}
              {(analytics?.monthlyTrend?.length ? analytics.monthlyTrend : [
                { month_label: 'Jul 2026', won_revenue: 450000, pipeline_revenue: 350000 },
                { month_label: 'Aug 2026', won_revenue: 720000, pipeline_revenue: 550000 },
                { month_label: 'Sep 2026', won_revenue: 1650000, pipeline_revenue: 1900000 },
                { month_label: 'Oct 2026 (Est)', won_revenue: 0, pipeline_revenue: 1400000 },
              ]).map((m, i, arr) => {
                const totalWidth = 500;
                const slotWidth = totalWidth / arr.length;
                const x = i * slotWidth + slotWidth * 0.25;
                const barWidth = slotWidth * 0.24;

                const maxVal = 2200000;
                const wonH = Math.min(130, ((Number(m.won_revenue) || 0) / maxVal) * 130);
                const pipeH = Math.min(130, ((Number(m.pipeline_revenue) || 0) / maxVal) * 130);

                return (
                  <g key={i}>
                    {/* Won Revenue Bar */}
                    <rect 
                      x={x} 
                      y={150 - wonH} 
                      width={barWidth} 
                      height={wonH} 
                      rx="4" 
                      fill="url(#greenGrad)" 
                    />
                    {/* Pipeline Revenue Bar */}
                    <rect 
                      x={x + barWidth + 4} 
                      y={150 - pipeH} 
                      width={barWidth} 
                      height={pipeH} 
                      rx="4" 
                      fill="url(#blueGrad)" 
                    />
                    {/* X-axis Label */}
                    <text 
                      x={x + barWidth} 
                      y="170" 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="#64748b" 
                      fontWeight="600"
                    >
                      {m.month_label}
                    </text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Viz 2: Pipeline Funnel / Stage Conversion Flow */}
        <div style={{ background: '#fff', padding: '22px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#0f172a' }}>
                Pipeline Conversion Funnel
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Deal progression drop-off across qualification stages
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: 6 }}>
              {deals.length} Total Deals Tracked
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {[
              { stage: 'Discovery & Qualification', key: 'discovery', color: '#3b82f6' },
              { stage: 'Proposal / Solution Pitch', key: 'proposal_sent', color: '#f59e0b' },
              { stage: 'Negotiation & Contract Review', key: 'negotiation', color: '#8b5cf6' },
              { stage: 'Closed Won (Signed Client)', key: 'won', color: '#10b981' },
            ].map((f, i, arr) => {
              const stageData = overview?.stageBreakdown?.[f.key] || { count: 0, amount: 0 };
              const maxCount = Math.max(1, ...arr.map(a => overview?.stageBreakdown?.[a.key]?.count || 0));
              const pctWidth = Math.max(20, ((stageData.count || 0) / maxCount) * 100);

              return (
                <div key={f.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4, fontWeight: 600 }}>
                    <span style={{ color: '#334155' }}>{f.stage}</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>
                      {stageData.count} deals • {formatCurrency(stageData.amount, currency)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 20, background: '#f8fafc', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: `${pctWidth}%`,
                      height: '100%',
                      background: f.color,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                      color: '#fff', fontSize: '0.68rem', fontWeight: 700
                    }}>
                      {stageData.count > 0 && `${stageData.count}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Visual Breakdown Row 2: Solutions Distribution & Rep Leaderboard ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
        
        {/* Solution Category Distribution */}
        <div style={{ background: '#fff', padding: '22px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            Revenue by Solution Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(analytics?.serviceBreakdown?.length ? analytics.serviceBreakdown : [
              { service_type: 'AI Voice Agents', total_amount: 1020000, deal_count: 2 },
              { service_type: 'Email & WhatsApp AI', total_amount: 810000, deal_count: 2 },
              { service_type: 'Custom AI Pipeline', total_amount: 1230000, deal_count: 2 },
              { service_type: 'CRM Automation', total_amount: 420000, deal_count: 1 },
              { service_type: 'AI Chatbot System', total_amount: 450000, deal_count: 1 },
            ]).map((s, idx) => {
              const totalAll = (analytics?.serviceBreakdown || []).reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 3930000;
              const sharePct = Math.round(((Number(s.total_amount) || 0) / totalAll) * 100);
              const colors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
              const col = colors[idx % colors.length];

              return (
                <div key={s.service_type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{s.service_type}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {formatCurrency(s.total_amount, currency)} ({sharePct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${sharePct}%`, height: '100%', background: col, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rep Leaderboard */}
        <div style={{ background: '#fff', padding: '22px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            Sales Team Leaderboard
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(analytics?.repPerformance?.length ? analytics.repPerformance : [
              { rep_name: 'Arjun Kapoor', won_deals: 2, won_revenue: 1130000, active_pipeline: 850000 },
              { rep_name: 'Neha Singhal', won_deals: 1, won_revenue: 520000, active_pipeline: 340000 },
              { rep_name: 'Rohan Desai', won_deals: 0, won_revenue: 0, active_pipeline: 710000 },
            ]).map((rep, idx) => (
              <div key={rep.rep_name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: idx === 0 ? '#fef3c7' : '#e2e8f0',
                  color: idx === 0 ? '#b45309' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.78rem'
                }}>
                  #{idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{rep.rep_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {rep.won_deals} closed deals • Pipeline: {formatCurrency(rep.active_pipeline, currency)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                    {formatCurrency(rep.won_revenue, currency)}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Closed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Deals Management Section ── */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        {/* Filter & View Switcher Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
              <span style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }}>
                <Icon name="search" size={16} />
              </span>
              <input 
                type="text"
                placeholder="Search deals, clients, companies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8,
                  border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none'
                }}
              />
            </div>

            {/* Stage filter */}
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="all">All Stages</option>
              {Object.entries(STAGE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {/* Service filter */}
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="all">All Solutions</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              <button 
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: viewMode === 'kanban' ? '#fff' : 'transparent',
                  border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
                  fontWeight: 700, cursor: 'pointer', color: viewMode === 'kanban' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Icon name="kanban" size={14} /> Pipeline Board
              </button>
              <button 
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: viewMode === 'table' ? '#fff' : 'transparent',
                  border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem',
                  fontWeight: 700, cursor: 'pointer', color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Icon name="table" size={14} /> Table View
              </button>
            </div>

            <button 
              onClick={loadData}
              title="Refresh"
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', color: '#475569' }}
            >
              <Icon name="refresh" size={16} />
            </button>
          </div>

        </div>

        {/* ── View 1: Kanban Pipeline Board ── */}
        {viewMode === 'kanban' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))', gap: 14, overflowX: 'auto', paddingBottom: 10 }}>
            {kanbanStages.map(stageKey => {
              const stageDeals = groupedDeals[stageKey] || [];
              const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.amount), 0);
              const conf = STAGE_CONFIG[stageKey];

              return (
                <div key={stageKey} style={{ background: '#f8fafc', borderRadius: 12, padding: 12, minHeight: 480, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Column Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${conf.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{conf.label}</span>
                      <span style={{ background: conf.bg, color: conf.color, fontSize: '0.7rem', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                        {stageDeals.length}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                      {formatCurrency(stageTotal, currency)}
                    </span>
                  </div>

                  {/* Deal Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                    {stageDeals.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '0.78rem' }}>
                        No deals in this stage
                      </div>
                    ) : (
                      stageDeals.map(deal => (
                        <div 
                          key={deal.id}
                          style={{
                            background: '#fff', borderRadius: 10, padding: 12,
                            border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>
                              {deal.service_type}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: deal.probability >= 70 ? '#10b981' : deal.probability >= 40 ? '#f59e0b' : '#64748b' }}>
                              {deal.probability}% prob
                            </span>
                          </div>

                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                            {deal.deal_name}
                          </h4>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: 8 }}>
                            {deal.client_company || deal.client_name}
                          </div>

                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: conf.color, fontFamily: "'Outfit', sans-serif", marginBottom: 10 }}>
                            {formatCurrency(deal.amount, currency)}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#64748b' }}>
                            <span title="Assigned Representative" style={{ fontWeight: 600 }}>
                              👤 {deal.assigned_rep_name || 'Unassigned'}
                            </span>
                            {deal.expected_close_date && (
                              <span>📅 {String(deal.expected_close_date).substring(0, 10)}</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 4 }}>
                            {conf.next && (
                              <button 
                                onClick={() => handleQuickStageMove(deal.id, conf.next)}
                                style={{
                                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                  background: conf.bg, border: 'none', color: conf.color, padding: '4px 8px',
                                  borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
                                }}
                              >
                                Advance <Icon name="arrowRight" size={12} color={conf.color} />
                              </button>
                            )}
                            <button 
                              onClick={() => { setEditingDeal(deal); setShowDealModal(true); }}
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: '0.7rem' }}
                            >
                              <Icon name="edit" size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteDeal(deal.id, deal.deal_name)}
                              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#ef4444' }}
                            >
                              <Icon name="trash" size={13} color="#ef4444" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── View 2: Detailed Table View ── */}
        {viewMode === 'table' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 14px' }}>Deal Name</th>
                  <th style={{ padding: '12px 14px' }}>Client / Company</th>
                  <th style={{ padding: '12px 14px' }}>Solution</th>
                  <th style={{ padding: '12px 14px' }}>Value</th>
                  <th style={{ padding: '12px 14px' }}>Stage</th>
                  <th style={{ padding: '12px 14px' }}>Probability</th>
                  <th style={{ padding: '12px 14px' }}>Rep</th>
                  <th style={{ padding: '12px 14px' }}>Target Close</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d, idx) => {
                  const conf = STAGE_CONFIG[d.stage] || STAGE_CONFIG.discovery;
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfdfd' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{d.deal_name}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        <div>{d.client_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{d.client_company}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                          {d.service_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                        {formatCurrency(d.amount, currency)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: conf.bg, color: conf.color, padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem' }}>
                          {conf.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>{d.probability}%</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{d.assigned_rep_name || 'Unassigned'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>
                        {d.expected_close_date ? String(d.expected_close_date).substring(0, 10) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button 
                            onClick={() => { setEditingDeal(d); setShowDealModal(true); }}
                            style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', color: '#334155' }}
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDeal(d.id, d.deal_name)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', color: '#ef4444' }}
                          >
                            <Icon name="trash" size={13} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── Modal: Create / Edit Deal ── */}
      {showDealModal && (
        <DealModal 
          deal={editingDeal}
          reps={reps}
          onClose={() => { setShowDealModal(false); setEditingDeal(null); }}
          onSaved={() => {
            setShowDealModal(false);
            setEditingDeal(null);
            showToast(editingDeal ? 'Deal updated successfully!' : 'New deal created!');
            loadData();
          }}
        />
      )}

      {/* ── Modal: Executive Report ── */}
      {showReportModal && reportData && (
        <ExecutiveReportModal 
          data={reportData}
          currency={currency}
          onClose={() => setShowReportModal(false)}
          onExport={handleExportCsv}
        />
      )}

    </div>
  );
}

/* ── Modal Component: Deal Create/Edit ── */
function DealModal({ deal, reps, onClose, onSaved }) {
  const [form, setForm] = useState({
    deal_name: deal?.deal_name || '',
    client_name: deal?.client_name || '',
    client_email: deal?.client_email || '',
    client_phone: deal?.client_phone || '',
    client_company: deal?.client_company || '',
    amount: deal?.amount || '',
    currency: deal?.currency || 'INR',
    stage: deal?.stage || 'discovery',
    probability: deal?.probability !== undefined ? deal.probability : '',
    service_type: deal?.service_type || 'AI Voice Agents',
    assigned_rep_name: deal?.assigned_rep_name || '',
    assigned_rep_id: deal?.assigned_rep_id || '',
    payment_status: deal?.payment_status || 'pending',
    expected_close_date: deal?.expected_close_date ? String(deal.expected_close_date).substring(0, 10) : '',
    notes: deal?.notes || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deal_name.trim() || !form.client_name.trim()) {
      setError('Deal name and client name are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = deal ? `/api/sales-panel/deals/${deal.id}` : '/api/sales-panel/deals';
      const method = deal ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        onSaved();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to save deal');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepChange = (repId) => {
    const selected = reps.find(r => r.id === repId);
    setForm(f => ({
      ...f,
      assigned_rep_id: repId || null,
      assigned_rep_name: selected ? selected.name : ''
    }));
  };

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
  };
  const lbl = {
    fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', flexDirection: 'column', gap: 5
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 620, maxWidth: '95%',
        maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            {deal ? 'Edit Sales Deal' : '+ Create New Deal'}
          </h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: '0.82rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>Deal Name / Title *
                <input required style={inp} value={form.deal_name} onChange={e => setForm({...form, deal_name: e.target.value})} placeholder="e.g. Apollo Hospitals - AI Voice Triage" />
              </label>
            </div>

            <label style={lbl}>Client Contact Name *
              <input required style={inp} value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} placeholder="e.g. Dr. Ramesh Sharma" />
            </label>

            <label style={lbl}>Company / Organization
              <input style={inp} value={form.client_company} onChange={e => setForm({...form, client_company: e.target.value})} placeholder="e.g. Apollo Healthcare" />
            </label>

            <label style={lbl}>Email Address
              <input type="email" style={inp} value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} placeholder="client@company.com" />
            </label>

            <label style={lbl}>Phone Number
              <input style={inp} value={form.client_phone} onChange={e => setForm({...form, client_phone: e.target.value})} placeholder="+91 98765 43210" />
            </label>

            <label style={lbl}>Deal Value (Amount) *
              <input type="number" required min="0" style={inp} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="e.g. 500000" />
            </label>

            <label style={lbl}>Currency
              <select style={inp} value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </label>

            <label style={lbl}>Pipeline Stage
              <select style={inp} value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
                {Object.entries(STAGE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>

            <label style={lbl}>Probability (%)
              <input type="number" min="0" max="100" style={inp} value={form.probability} onChange={e => setForm({...form, probability: e.target.value})} placeholder="Auto-calculated if blank" />
            </label>

            <label style={lbl}>Solution / Service
              <select style={inp} value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label style={lbl}>Assigned Sales Rep
              <select style={inp} value={form.assigned_rep_id || ''} onChange={e => handleRepChange(e.target.value)}>
                <option value="">Unassigned</option>
                {reps.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.job_title || 'Sales'})</option>
                ))}
              </select>
            </label>

            <label style={lbl}>Target Close Date
              <input type="date" style={inp} value={form.expected_close_date} onChange={e => setForm({...form, expected_close_date: e.target.value})} />
            </label>

            <label style={lbl}>Payment Status
              <select style={inp} value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})}>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <label style={{ ...lbl, marginTop: 14 }}>Deal Notes & Commercial Terms
            <textarea style={{ ...inp, height: 75, resize: 'vertical' }} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Key requirements, SLA terms, next touchpoints..." />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
              {submitting ? 'Saving...' : deal ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Component: Executive Sales Report ── */
function ExecutiveReportModal({ data, currency, onClose, onExport }) {
  const m = data.metrics || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 680, maxWidth: '95%',
        maxHeight: '90vh', overflowY: 'auto', padding: 32, boxShadow: '0 30px 70px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#0f172a' }}>
              Seevora Executive Sales Briefing
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Reporting Period: {data.period} • Generated {new Date(data.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>
            ✕ Close
          </button>
        </div>

        {/* Executive Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Closed Revenue</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
              {formatCurrency(m.totalRevenue, currency)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Target: {m.targetAttainment} reached</div>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Pipeline</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb', fontFamily: "'Outfit', sans-serif" }}>
              {formatCurrency(m.pipelineValue, currency)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Qualified active opportunities</div>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Win Rate</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#8b5cf6', fontFamily: "'Outfit', sans-serif" }}>
              {m.winRate}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>{m.wonCount} won vs {m.lostCount} lost</div>
          </div>
        </div>

        {/* Strategic AI Recommendations */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
            Strategic Revenue Recommendations
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.recommendations || []).map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: 10, background: '#eff6ff', borderRadius: 8, fontSize: '0.82rem', color: '#1e40af' }}>
                <span>💡</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Deals */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
            Highest Value Deals
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(data.topDeals || []).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>{d.dealName}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{d.client} • Rep: {d.rep}</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>
                  {formatCurrency(d.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
            <Icon name="download" size={14} /> Download Full CSV
          </button>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
