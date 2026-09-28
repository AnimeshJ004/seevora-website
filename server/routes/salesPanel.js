import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';

const router = express.Router();
router.use(requireAuth);

const SALES_PANEL_TTL = 30;

function bustSalesPanelCache() {
  invalidateCacheNamespaces(
    CACHE_NAMESPACES.salesPanel,
    CACHE_NAMESPACES.analytics,
    CACHE_NAMESPACES.dashboard
  );
}

function defaultProbabilityForStage(stage) {
  switch (stage) {
    case 'discovery': return 20;
    case 'proposal_sent': return 50;
    case 'negotiation': return 80;
    case 'won': return 100;
    case 'lost': return 0;
    default: return 30;
  }
}

// ── GET /api/sales-panel/overview ──────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.salesPanel, {
      view: 'overview',
      userId: req.user?.id || '',
      role: req.user?.role || '',
      period,
    });

    const data = await getOrSetCache(cacheKey, SALES_PANEL_TTL, async () => {
      // 1. All deals aggregation
      const { rows: deals } = await pool.query(`
        SELECT 
          id, amount, currency, stage, probability, payment_status,
          expected_close_date, actual_close_date, created_at
        FROM sales_deals
        ORDER BY created_at DESC
      `);

      let totalWonRevenue = 0;
      let wonDealsCount = 0;
      let pipelineValue = 0;
      let weightedPipelineValue = 0;
      let activeDealsCount = 0;
      let lostDealsCount = 0;

      const stageCounts = {
        discovery: { count: 0, amount: 0 },
        proposal_sent: { count: 0, amount: 0 },
        negotiation: { count: 0, amount: 0 },
        won: { count: 0, amount: 0 },
        lost: { count: 0, amount: 0 },
      };

      for (const d of deals) {
        const amt = Number(d.amount) || 0;
        const prob = Number(d.probability) || 0;
        const stg = d.stage || 'discovery';

        if (stageCounts[stg]) {
          stageCounts[stg].count += 1;
          stageCounts[stg].amount += amt;
        }

        if (stg === 'won') {
          totalWonRevenue += amt;
          wonDealsCount += 1;
        } else if (stg === 'lost') {
          lostDealsCount += 1;
        } else {
          // active pipeline stages
          pipelineValue += amt;
          weightedPipelineValue += amt * (prob / 100);
          activeDealsCount += 1;
        }
      }

      const totalClosed = wonDealsCount + lostDealsCount;
      const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 100) : 0;
      const avgDealSize = wonDealsCount > 0 ? Math.round(totalWonRevenue / wonDealsCount) : 0;

      // 2. Fetch current sales target
      const { rows: targetRows } = await pool.query(`
        SELECT * FROM sales_targets 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      const currentTarget = targetRows[0] || {
        period: 'Q3 2026',
        target_revenue: 3500000,
        currency: 'INR',
      };

      const targetAmount = Number(currentTarget.target_revenue) || 3500000;
      const targetAttainment = targetAmount > 0 
        ? Math.min(Math.round((totalWonRevenue / targetAmount) * 100), 200) 
        : 0;

      return {
        totalWonRevenue,
        wonDealsCount,
        pipelineValue,
        weightedPipelineValue: Math.round(weightedPipelineValue),
        activeDealsCount,
        lostDealsCount,
        totalDealsCount: deals.length,
        winRate,
        avgDealSize,
        currentTarget: {
          period: currentTarget.period,
          targetRevenue: targetAmount,
          currency: currentTarget.currency || 'INR',
          attainmentRate: targetAttainment,
          remaining: Math.max(0, targetAmount - totalWonRevenue),
        },
        stageBreakdown: stageCounts,
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching sales overview:', error);
    res.status(500).json({ error: 'Server error fetching sales overview' });
  }
});

// ── GET /api/sales-panel/analytics ─────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.salesPanel, {
      view: 'analytics',
      userId: req.user?.id || '',
    });

    const analytics = await getOrSetCache(cacheKey, SALES_PANEL_TTL, async () => {
      // 1. Monthly revenue trend for recent months
      const { rows: monthlyRows } = await pool.query(`
        SELECT 
          TO_CHAR(COALESCE(actual_close_date, created_at), 'Mon YYYY') as month_label,
          TO_CHAR(COALESCE(actual_close_date, created_at), 'YYYY-MM') as month_key,
          SUM(CASE WHEN stage = 'won' THEN amount ELSE 0 END) as won_revenue,
          SUM(CASE WHEN stage IN ('discovery', 'proposal_sent', 'negotiation') THEN amount ELSE 0 END) as pipeline_revenue,
          COUNT(*) as deal_count
        FROM sales_deals
        GROUP BY month_label, month_key
        ORDER BY month_key ASC
        LIMIT 12
      `);

      // 2. Breakdown by service type
      const { rows: serviceRows } = await pool.query(`
        SELECT 
          service_type,
          COUNT(*) as deal_count,
          SUM(amount) as total_amount,
          SUM(CASE WHEN stage = 'won' THEN amount ELSE 0 END) as won_amount
        FROM sales_deals
        GROUP BY service_type
        ORDER BY total_amount DESC
      `);

      // 3. Sales rep performance leaderboard
      const { rows: repRows } = await pool.query(`
        SELECT 
          COALESCE(assigned_rep_name, 'Unassigned') as rep_name,
          COUNT(*) as total_deals,
          SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END) as won_deals,
          SUM(CASE WHEN stage = 'won' THEN amount ELSE 0 END) as won_revenue,
          SUM(CASE WHEN stage IN ('discovery', 'proposal_sent', 'negotiation') THEN amount ELSE 0 END) as active_pipeline
        FROM sales_deals
        GROUP BY rep_name
        ORDER BY won_revenue DESC
      `);

      // 4. Funnel steps
      const { rows: funnelRows } = await pool.query(`
        SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
        FROM sales_deals
        GROUP BY stage
      `);

      const stageMap = {};
      funnelRows.forEach(r => { stageMap[r.stage] = { count: Number(r.count), amount: Number(r.amount) }; });

      const funnel = [
        { stage: 'Discovery', key: 'discovery', count: stageMap.discovery?.count || 0, amount: stageMap.discovery?.amount || 0 },
        { stage: 'Proposal Sent', key: 'proposal_sent', count: stageMap.proposal_sent?.count || 0, amount: stageMap.proposal_sent?.amount || 0 },
        { stage: 'Negotiation', key: 'negotiation', count: stageMap.negotiation?.count || 0, amount: stageMap.negotiation?.amount || 0 },
        { stage: 'Closed Won', key: 'won', count: stageMap.won?.count || 0, amount: stageMap.won?.amount || 0 },
      ];

      return {
        monthlyTrend: monthlyRows,
        serviceBreakdown: serviceRows,
        repPerformance: repRows,
        funnel,
      };
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ error: 'Server error fetching sales analytics' });
  }
});

// ── GET /api/sales-panel/deals ─────────────────────────────────────────────
router.get('/deals', async (req, res) => {
  try {
    const { stage, service_type, rep, search, sort = 'created_at_desc' } = req.query;

    const conditions = [];
    const values = [];

    if (stage && stage !== 'all') {
      values.push(stage);
      conditions.push(`d.stage = $${values.length}`);
    }

    if (service_type && service_type !== 'all') {
      values.push(service_type);
      conditions.push(`d.service_type = $${values.length}`);
    }

    if (rep && rep !== 'all') {
      values.push(`%${rep.toLowerCase()}%`);
      conditions.push(`LOWER(d.assigned_rep_name) LIKE $${values.length}`);
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(`(
        LOWER(d.deal_name) LIKE $${values.length} OR 
        LOWER(d.client_name) LIKE $${values.length} OR 
        LOWER(d.client_company) LIKE $${values.length}
      )`);
    }

    let orderBy = 'd.created_at DESC';
    if (sort === 'amount_desc') orderBy = 'd.amount DESC';
    if (sort === 'amount_asc') orderBy = 'd.amount ASC';
    if (sort === 'close_date') orderBy = 'd.expected_close_date ASC NULLS LAST';
    if (sort === 'probability_desc') orderBy = 'd.probability DESC';

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(`
      SELECT 
        d.*,
        l.email as lead_email,
        l.phone as lead_phone
      FROM sales_deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      ${where}
      ORDER BY ${orderBy}
    `, values);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching sales deals:', error);
    res.status(500).json({ error: 'Server error fetching sales deals' });
  }
});

// ── GET /api/sales-panel/deals/:id ─────────────────────────────────────────
router.get('/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT d.*, l.name as lead_name, l.email as lead_email
      FROM sales_deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      WHERE d.id = $1
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Server error fetching deal' });
  }
});

// ── POST /api/sales-panel/deals ────────────────────────────────────────────
router.post('/deals', async (req, res) => {
  try {
    const {
      deal_name,
      client_name,
      client_email,
      client_phone,
      client_company,
      amount,
      currency = 'INR',
      stage = 'discovery',
      probability,
      service_type = 'AI Solutions',
      assigned_rep_id,
      assigned_rep_name,
      payment_status = 'pending',
      expected_close_date,
      actual_close_date,
      notes,
      lead_id,
    } = req.body;

    if (!deal_name || !deal_name.trim()) {
      return res.status(400).json({ error: 'Deal title is required' });
    }
    if (!client_name || !client_name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const calculatedProbability = probability !== undefined && probability !== null && probability !== ''
      ? Math.max(0, Math.min(100, Number(probability)))
      : defaultProbabilityForStage(stage);

    const actualClose = stage === 'won' && !actual_close_date ? new Date().toISOString() : actual_close_date || null;
    const id = crypto.randomUUID();

    const { rows } = await pool.query(`
      INSERT INTO sales_deals (
        id, deal_name, lead_id, client_name, client_email, client_phone, client_company,
        amount, currency, stage, probability, service_type,
        assigned_rep_id, assigned_rep_name, payment_status,
        expected_close_date, actual_close_date, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      id,
      deal_name.trim(),
      lead_id || null,
      client_name.trim(),
      client_email || null,
      client_phone || null,
      client_company || null,
      Number(amount) || 0,
      currency || 'INR',
      stage || 'discovery',
      calculatedProbability,
      service_type || 'AI Solutions',
      assigned_rep_id || null,
      assigned_rep_name || null,
      payment_status || 'pending',
      expected_close_date || null,
      actualClose,
      notes || null,
      req.user?.id || null,
    ]);

    bustSalesPanelCache();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating sales deal:', error);
    res.status(500).json({ error: 'Server error creating deal' });
  }
});

// ── PUT /api/sales-panel/deals/:id ─────────────────────────────────────────
router.put('/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM sales_deals WHERE id = $1 LIMIT 1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const prev = existing.rows[0];
    const {
      deal_name,
      client_name,
      client_email,
      client_phone,
      client_company,
      amount,
      currency,
      stage,
      probability,
      service_type,
      assigned_rep_id,
      assigned_rep_name,
      payment_status,
      expected_close_date,
      actual_close_date,
      notes,
    } = req.body;

    const nextStage = stage !== undefined ? stage : prev.stage;
    let nextProb = probability !== undefined ? Number(probability) : prev.probability;
    if (stage !== undefined && probability === undefined && stage !== prev.stage) {
      nextProb = defaultProbabilityForStage(nextStage);
    }

    let nextActualClose = actual_close_date !== undefined ? actual_close_date : prev.actual_close_date;
    if (nextStage === 'won' && !nextActualClose) {
      nextActualClose = new Date().toISOString();
    }

    const { rows } = await pool.query(`
      UPDATE sales_deals
      SET
        deal_name = COALESCE($1, deal_name),
        client_name = COALESCE($2, client_name),
        client_email = COALESCE($3, client_email),
        client_phone = COALESCE($4, client_phone),
        client_company = COALESCE($5, client_company),
        amount = COALESCE($6, amount),
        currency = COALESCE($7, currency),
        stage = COALESCE($8, stage),
        probability = COALESCE($9, probability),
        service_type = COALESCE($10, service_type),
        assigned_rep_id = COALESCE($11, assigned_rep_id),
        assigned_rep_name = COALESCE($12, assigned_rep_name),
        payment_status = COALESCE($13, payment_status),
        expected_close_date = COALESCE($14, expected_close_date),
        actual_close_date = $15,
        notes = COALESCE($16, notes),
        updated_at = NOW()
      WHERE id = $17
      RETURNING *
    `, [
      deal_name, client_name, client_email, client_phone, client_company,
      amount !== undefined ? Number(amount) : null,
      currency,
      nextStage,
      nextProb,
      service_type,
      assigned_rep_id,
      assigned_rep_name,
      payment_status,
      expected_close_date,
      nextActualClose,
      notes,
      id,
    ]);

    bustSalesPanelCache();
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Server error updating deal' });
  }
});

// ── DELETE /api/sales-panel/deals/:id ──────────────────────────────────────
router.delete('/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM sales_deals WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    bustSalesPanelCache();
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Server error deleting deal' });
  }
});

// ── GET /api/sales-panel/reps ──────────────────────────────────────────────
router.get('/reps', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, email, department, job_title
      FROM hr_employees
      WHERE status IN ('active', 'probation')
      ORDER BY name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sales reps:', error);
    res.status(500).json({ error: 'Server error fetching sales reps' });
  }
});

// ── GET /api/sales-panel/export-csv ────────────────────────────────────────
router.get('/export-csv', async (req, res) => {
  try {
    const { rows: deals } = await pool.query(`
      SELECT 
        deal_name, client_name, client_company, client_email, client_phone,
        amount, currency, stage, probability, service_type, assigned_rep_name,
        payment_status, expected_close_date, actual_close_date, created_at
      FROM sales_deals
      ORDER BY created_at DESC
    `);

    const headers = [
      'Deal Name',
      'Client Name',
      'Company',
      'Email',
      'Phone',
      'Amount',
      'Currency',
      'Stage',
      'Probability (%)',
      'Service Type',
      'Assigned Rep',
      'Payment Status',
      'Expected Close Date',
      'Actual Close Date',
      'Created Date'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const csvLines = [headers.join(',')];

    for (const d of deals) {
      csvLines.push([
        escapeCsv(d.deal_name),
        escapeCsv(d.client_name),
        escapeCsv(d.client_company),
        escapeCsv(d.client_email),
        escapeCsv(d.client_phone),
        d.amount || 0,
        escapeCsv(d.currency),
        escapeCsv(d.stage),
        d.probability || 0,
        escapeCsv(d.service_type),
        escapeCsv(d.assigned_rep_name),
        escapeCsv(d.payment_status),
        escapeCsv(d.expected_close_date ? String(d.expected_close_date).substring(0, 10) : ''),
        escapeCsv(d.actual_close_date ? String(d.actual_close_date).substring(0, 10) : ''),
        escapeCsv(d.created_at ? String(d.created_at).substring(0, 10) : '')
      ].join(','));
    }

    const csvContent = csvLines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="seevora_sales_report_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting sales CSV:', error);
    res.status(500).json({ error: 'Server error generating sales CSV' });
  }
});

// ── GET /api/sales-panel/report ────────────────────────────────────────────
router.get('/report', async (req, res) => {
  try {
    const { rows: deals } = await pool.query('SELECT * FROM sales_deals ORDER BY amount DESC');
    const { rows: targetRows } = await pool.query('SELECT * FROM sales_targets ORDER BY created_at DESC LIMIT 1');
    const target = targetRows[0] || { period: 'Q3 2026', target_revenue: 3500000 };

    const totalRevenue = deals.filter(d => d.stage === 'won').reduce((sum, d) => sum + Number(d.amount), 0);
    const pipelineValue = deals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((sum, d) => sum + Number(d.amount), 0);
    const wonCount = deals.filter(d => d.stage === 'won').length;
    const lostCount = deals.filter(d => d.stage === 'lost').length;
    const closedCount = wonCount + lostCount;
    const winRate = closedCount > 0 ? ((wonCount / closedCount) * 100).toFixed(1) : 0;

    const report = {
      generatedAt: new Date().toISOString(),
      period: target.period,
      metrics: {
        totalRevenue,
        pipelineValue,
        wonCount,
        lostCount,
        winRate: `${winRate}%`,
        targetRevenue: Number(target.target_revenue),
        targetAttainment: `${((totalRevenue / Number(target.target_revenue)) * 100).toFixed(1)}%`,
      },
      topDeals: deals.slice(0, 5).map(d => ({
        dealName: d.deal_name,
        client: d.client_company || d.client_name,
        amount: d.amount,
        stage: d.stage,
        rep: d.assigned_rep_name
      })),
      recommendations: [
        'Accelerate deals in negotiation stage to hit Q3 sales target.',
        'High win-rate on AI Voice Agent implementations; consider expanding outreach.',
        'Follow up on 2 proposal-stage enterprise accounts with SLA assurances.'
      ]
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Server error generating sales report' });
  }
});

export default router;
