import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Temporarily bypass auth for testing from frontend demo login
const mockAuth = (req, res, next) => {
  req.user = { id: null, role: 'admin', email: 'demo@seevora.com' };
  next();
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
function normalizeLead(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    industry: row.industry,
    designation: row.designation,
    source: row.source,
    pipelineStage: row.pipeline_stage,
    score: row.score,
    notes: row.notes,
    nextFollowUpAt: row.next_follow_up_at,
    auditRequestId: row.audit_request_id,
    lastContactedAt: row.last_contacted_at,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ── GET /api/leads — list all leads ────────────────────────────────── */
router.get('/', mockAuth, async (req, res, next) => {
  try {
    const { stage, source, search } = req.query;
    const conditions = [];
    const values = [];

    if (stage) {
      values.push(stage);
      conditions.push(`pipeline_stage = $${values.length}`);
    }
    if (source) {
      values.push(source);
      conditions.push(`source = $${values.length}`);
    }
    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length} OR LOWER(company) LIKE $${values.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM leads ${where} ORDER BY created_at DESC`,
      values
    );
    res.json({ leads: result.rows.map(normalizeLead) });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/leads/:id ──────────────────────────────────────────────── */
router.get('/:id', mockAuth, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Lead not found.' });
    res.json({ lead: normalizeLead(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/leads — create lead ──────────────────────────────────── */
router.post('/', mockAuth, async (req, res, next) => {
  try {
    const {
      name, email, phone, company, industry, designation,
      source = 'manual', pipelineStage = 'new', score = 0, notes, nextFollowUpAt, auditRequestId,
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Lead name is required.' });

    const result = await pool.query(
      `INSERT INTO leads
         (id, name, email, phone, company, industry, designation, source, pipeline_stage, score, notes, next_follow_up_at, audit_request_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        crypto.randomUUID(), name, email || null, phone || null,
        company || null, industry || null, designation || null,
        source, pipelineStage, score, notes || null, nextFollowUpAt || null, auditRequestId || null, req.user.id,
      ]
    );
    res.status(201).json({ message: 'Lead created.', lead: normalizeLead(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

/* ── PATCH /api/leads/:id — update lead / move stage ────────────────── */
router.patch('/:id', mockAuth, async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Lead not found.' });

    const row = existing.rows[0];
    const {
      name = row.name,
      email = row.email,
      phone = row.phone,
      company = row.company,
      industry = row.industry,
      designation = row.designation,
      source = row.source,
      pipelineStage = row.pipeline_stage,
      score = row.score,
      notes = row.notes,
      nextFollowUpAt = row.next_follow_up_at,
    } = req.body;

    const updated = await pool.query(
      `UPDATE leads SET
         name=$2, email=$3, phone=$4, company=$5, industry=$6, designation=$7,
         source=$8, pipeline_stage=$9, score=$10, notes=$11, next_follow_up_at=$12, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id, name, email, phone, company, industry, designation, source, pipelineStage, score, notes, nextFollowUpAt || null]
    );
    res.json({ message: 'Lead updated.', lead: normalizeLead(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});

/* ── DELETE /api/leads/:id ───────────────────────────────────────────── */
router.delete('/:id', mockAuth, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Lead not found.' });
    res.json({ message: 'Lead deleted.' });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/leads/bulk — bulk import leads ───────────────────────── */
router.post('/bulk', mockAuth, async (req, res, next) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || !leads.length) {
      return res.status(400).json({ message: 'Leads array is required.' });
    }

    const inserted = [];
    for (const l of leads) {
      if (!l.name) continue;
      const r = await pool.query(
        `INSERT INTO leads (id, name, email, phone, company, industry, source, pipeline_stage, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'new',$8) RETURNING *`,
        [
          crypto.randomUUID(), l.name, l.email || null, l.phone || null,
          l.company || null, l.industry || null, l.source || 'import', req.user.id,
        ]
      );
      inserted.push(normalizeLead(r.rows[0]));
    }

    res.status(201).json({ message: `${inserted.length} leads imported.`, leads: inserted });
  } catch (err) {
    next(err);
  }
});

export default router;
