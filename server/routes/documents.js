import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

const DOC_TYPES = ['aadhaar', 'pan', 'offer_letter', 'payslip', 'resume', 'experience_letter', 'bank_details', 'other'];

function toDocument(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    emp: row.emp_name || '',
    employeeCode: row.employee_code || '',
    type: (row.doc_type || 'other').replace(/_/g, ' '),
    typeKey: row.doc_type || 'other',
    fileName: row.file_name,
    filePath: row.file_path || '',
    size: row.file_size || '',
    verified: Boolean(row.verified),
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    uploaded: row.uploaded_at,
  };
}

/* ── GET /  —  List all documents ── */
router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT d.*, e.name AS emp_name, e.employee_code
      FROM employee_documents d
      JOIN hr_employees e ON e.id = d.employee_id
      ORDER BY d.uploaded_at DESC
    `);
    return res.json({ documents: result.rows.map(toDocument) });
  } catch (error) {
    return next(error);
  }
});

/* ── GET /summary  —  Document stats ── */
router.get('/summary', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE verified = true)::int AS verified,
        COUNT(*) FILTER (WHERE verified = false)::int AS pending,
        COUNT(DISTINCT employee_id)::int AS employees_with_docs
      FROM employee_documents
    `);
    const row = result.rows[0] || {};
    return res.json({
      total: Number(row.total || 0),
      verified: Number(row.verified || 0),
      pending: Number(row.pending || 0),
      employeesWithDocs: Number(row.employees_with_docs || 0),
    });
  } catch (error) {
    return next(error);
  }
});

/* ── POST /  —  Upload document metadata ── */
router.post('/', async (req, res, next) => {
  try {
    const { employeeId, docType, fileName, fileSize } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'Employee is required.' });
    if (!fileName) return res.status(400).json({ message: 'File name is required.' });

    const empExists = await pool.query('SELECT id FROM hr_employees WHERE id = $1 LIMIT 1', [employeeId]);
    if (empExists.rowCount === 0) return res.status(404).json({ message: 'Employee not found.' });

    const type = DOC_TYPES.includes(docType) ? docType : 'other';
    const id = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO employee_documents (id, employee_id, doc_type, file_name, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, employeeId, type, fileName.trim(), fileSize || '']
    );

    const empInfo = await pool.query('SELECT name, employee_code FROM hr_employees WHERE id = $1', [employeeId]);
    return res.status(201).json({
      message: 'Document uploaded.',
      document: toDocument({ ...result.rows[0], emp_name: empInfo.rows[0]?.name, employee_code: empInfo.rows[0]?.employee_code }),
    });
  } catch (error) {
    return next(error);
  }
});

/* ── PUT /:id/verify  —  Mark document as verified ── */
router.put('/:id/verify', async (req, res, next) => {
  try {
    const current = await pool.query('SELECT * FROM employee_documents WHERE id = $1 LIMIT 1', [req.params.id]);
    if (current.rowCount === 0) return res.status(404).json({ message: 'Document not found.' });
    if (current.rows[0].verified) return res.status(400).json({ message: 'Document already verified.' });

    await pool.query(
      `UPDATE employee_documents SET verified = true, verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    return res.json({ message: 'Document verified.' });
  } catch (error) {
    return next(error);
  }
});

/* ── DELETE /:id  —  Remove a document ── */
router.delete('/:id', async (req, res, next) => {
  try {
    const current = await pool.query('SELECT id FROM employee_documents WHERE id = $1 LIMIT 1', [req.params.id]);
    if (current.rowCount === 0) return res.status(404).json({ message: 'Document not found.' });

    await pool.query('DELETE FROM employee_documents WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Document removed.' });
  } catch (error) {
    return next(error);
  }
});

export default router;
