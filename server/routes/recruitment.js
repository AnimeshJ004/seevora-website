import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';

const router = express.Router();
router.use(requireRole('hr', 'admin'));

const PIPELINE_STAGES = ['applied', 'screening', 'technical', 'hr_round', 'offer', 'hired', 'rejected'];
const RECRUITMENT_TTL = 60;

function bustRecruitmentCache() {
  invalidateCacheNamespaces(CACHE_NAMESPACES.recruitment);
}

function toJob(row) {
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    type: row.type,
    experience: row.experience || '',
    description: row.description || '',
    status: row.status,
    applicants: Number(row.applicant_count || 0),
    posted: row.posted_at,
    closedAt: row.closed_at,
  };
}

function toCandidate(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    exp: row.experience || '',
    source: row.source || 'direct',
    role: row.job_title || '',
    round: (row.current_stage || 'applied').replace(/_/g, ' '),
    stage: row.current_stage || 'applied',
    status: row.current_stage || 'applied',
    applied: row.applied_at,
  };
}

/* ── GET /jobs  —  List all job openings ── */
router.get('/jobs', async (_req, res, next) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.recruitment, { view: 'jobs' });
    const payload = await getOrSetCache(cacheKey, RECRUITMENT_TTL, async () => {
      const result = await pool.query(`
        SELECT j.*, COUNT(c.id)::int AS applicant_count
        FROM job_openings j
        LEFT JOIN candidates c ON c.job_id = j.id
        GROUP BY j.id
        ORDER BY j.posted_at DESC
      `);
      return { jobs: result.rows.map(toJob) };
    });
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

/* ── POST /jobs  —  Post a new job ── */
router.post('/jobs', async (req, res, next) => {
  try {
    const { title, department, type, experience, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Job title is required.' });
    if (!department) return res.status(400).json({ message: 'Department is required.' });

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO job_openings (id, title, department, type, experience, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, title.trim(), department.trim(), type || 'full-time', experience || '', description || '']
    );

    bustRecruitmentCache();
    return res.status(201).json({ message: 'Job posted successfully.', job: toJob({ ...result.rows[0], applicant_count: 0 }) });
  } catch (error) {
    return next(error);
  }
});

/* ── PUT /jobs/:id  —  Update or close a job ── */
router.put('/jobs/:id', async (req, res, next) => {
  try {
    const { title, department, type, experience, description, status } = req.body;

    const current = await pool.query('SELECT id FROM job_openings WHERE id = $1 LIMIT 1', [req.params.id]);
    if (current.rowCount === 0) return res.status(404).json({ message: 'Job not found.' });

    const closedAt = status === 'closed' ? 'NOW()' : 'closed_at';
    const result = await pool.query(
      `UPDATE job_openings
       SET title = COALESCE($2, title),
           department = COALESCE($3, department),
           type = COALESCE($4, type),
           experience = COALESCE($5, experience),
           description = COALESCE($6, description),
           status = COALESCE($7, status),
           closed_at = ${status === 'closed' ? 'NOW()' : 'closed_at'},
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, title || null, department || null, type || null, experience || null, description || null, status || null]
    );

    bustRecruitmentCache();
    return res.json({ message: 'Job updated.', job: toJob({ ...result.rows[0], applicant_count: 0 }) });
  } catch (error) {
    return next(error);
  }
});

/* ── GET /candidates  —  List all candidates ── */
router.get('/candidates', async (req, res, next) => {
  try {
    const { jobId, stage } = req.query;
    const validStage = PIPELINE_STAGES.includes(stage) ? stage : '';
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.recruitment, {
      view: 'candidates',
      jobId: String(jobId || ''),
      stage: validStage,
    });
    const payload = await getOrSetCache(cacheKey, RECRUITMENT_TTL, async () => {
      let sql = `
        SELECT c.*, j.title AS job_title
        FROM candidates c
        JOIN job_openings j ON j.id = c.job_id
      `;
      const params = [];
      const conditions = [];

      if (jobId) { conditions.push(`c.job_id = $${params.length + 1}`); params.push(jobId); }
      if (validStage) { conditions.push(`c.current_stage = $${params.length + 1}`); params.push(validStage); }
      if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' ORDER BY c.applied_at DESC';

      const result = await pool.query(sql, params);
      return { candidates: result.rows.map(toCandidate) };
    });
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

/* ── POST /candidates  —  Add a candidate ── */
router.post('/candidates', async (req, res, next) => {
  try {
    const { jobId, name, email, phone, experience, source } = req.body;
    if (!jobId) return res.status(400).json({ message: 'Job ID is required.' });
    if (!name) return res.status(400).json({ message: 'Candidate name is required.' });
    if (!email) return res.status(400).json({ message: 'Candidate email is required.' });

    const jobExists = await pool.query('SELECT id FROM job_openings WHERE id = $1 AND status = $2 LIMIT 1', [jobId, 'open']);
    if (jobExists.rowCount === 0) return res.status(404).json({ message: 'Job opening not found or closed.' });

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO candidates (id, job_id, name, email, phone, experience, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, jobId, name.trim(), email.trim().toLowerCase(), phone || '', experience || '', source || 'direct']
    );

    bustRecruitmentCache();
    const jobTitle = await pool.query('SELECT title FROM job_openings WHERE id = $1', [jobId]);
    return res.status(201).json({
      message: 'Candidate added.',
      candidate: toCandidate({ ...result.rows[0], job_title: jobTitle.rows[0]?.title || '' }),
    });
  } catch (error) {
    return next(error);
  }
});

/* ── PUT /candidates/:id/stage  —  Move candidate stage ── */
router.put('/candidates/:id/stage', async (req, res, next) => {
  try {
    const { stage } = req.body;
    if (!stage || !PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ message: `Invalid stage. Must be one of: ${PIPELINE_STAGES.join(', ')}` });
    }

    const current = await pool.query('SELECT * FROM candidates WHERE id = $1 LIMIT 1', [req.params.id]);
    if (current.rowCount === 0) return res.status(404).json({ message: 'Candidate not found.' });

    const result = await pool.query(
      `UPDATE candidates SET current_stage = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, stage]
    );

    bustRecruitmentCache();
    const jobTitle = await pool.query('SELECT title FROM job_openings WHERE id = $1', [result.rows[0].job_id]);
    return res.json({
      message: `Candidate moved to ${stage.replace(/_/g, ' ')}.`,
      candidate: toCandidate({ ...result.rows[0], job_title: jobTitle.rows[0]?.title || '' }),
    });
  } catch (error) {
    return next(error);
  }
});

/* ── GET /summary  —  Recruitment summary ── */
router.get('/summary', async (_req, res, next) => {
  try {
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.recruitment, { view: 'summary' });
    const payload = await getOrSetCache(cacheKey, RECRUITMENT_TTL, async () => {
      const [jobResult, candidateResult, pipelineResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'open')::int AS open_positions,
          COUNT(*)::int AS total_jobs
        FROM job_openings
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_applicants,
          COUNT(*) FILTER (WHERE current_stage IN ('screening', 'technical', 'hr_round', 'offer'))::int AS shortlisted,
          COUNT(*) FILTER (WHERE current_stage = 'hired')::int AS hired
        FROM candidates
      `),
      pool.query(`
        SELECT current_stage AS stage, COUNT(*)::int AS count
        FROM candidates
        WHERE current_stage NOT IN ('rejected')
        GROUP BY current_stage
        ORDER BY
          CASE current_stage
            WHEN 'applied' THEN 1
            WHEN 'screening' THEN 2
            WHEN 'technical' THEN 3
            WHEN 'hr_round' THEN 4
            WHEN 'offer' THEN 5
            WHEN 'hired' THEN 6
          END
      `),
    ]);

      const jobs = jobResult.rows[0] || {};
      const cands = candidateResult.rows[0] || {};

      return {
        openPositions: Number(jobs.open_positions || 0),
        totalJobs: Number(jobs.total_jobs || 0),
        totalApplicants: Number(cands.total_applicants || 0),
        shortlisted: Number(cands.shortlisted || 0),
        hired: Number(cands.hired || 0),
        pipeline: pipelineResult.rows.map(r => ({
          stage: r.stage.replace(/_/g, ' '),
          stageKey: r.stage,
          count: Number(r.count || 0),
        })),
      };
    });
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

export default router;
