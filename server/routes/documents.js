import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const DOC_TYPES = ['aadhaar', 'pan', 'offer_letter', 'payslip', 'resume', 'experience_letter', 'bank_details', 'qualification_certificate', 'other'];

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
    fileUrl: row.file_url || '',
    size: row.file_size || '',
    status: row.doc_status || (row.verified ? 'VERIFIED' : 'PENDING'),
    verified: Boolean(row.verified),
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason || '',
    uploaded: row.uploaded_at,
  };
}

/* ── GET /  —  List all documents (HR) ── */
router.get('/', requireAuth, async (_req, res, next) => {
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
router.get('/summary', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE doc_status = 'VERIFIED' OR verified = true)::int AS verified,
        COUNT(*) FILTER (WHERE doc_status = 'PENDING' AND verified = false)::int AS pending,
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

/* ── GET /verifications  —  List ALL employees with their verification status ── */
router.get('/verifications', requireAuth, async (_req, res, next) => {
  try {
    /* No WHERE filter on role — show every hr_employees row */
    const result = await pool.query(`
      SELECT
        e.id                                                        AS employee_id,
        e.employee_code,
        e.name,
        e.email,
        e.department,
        e.job_title,
        e.joined_on::text                                           AS joined_on,
        COALESCE(u.verification_status, 'PENDING_VERIFICATION')     AS verification_status,
        COUNT(d.id)::int                                            AS doc_count,
        COUNT(d.id) FILTER (WHERE d.doc_status = 'VERIFIED')::int  AS verified_count,
        COUNT(d.id) FILTER (WHERE d.doc_status = 'PENDING')::int   AS pending_count,
        COUNT(d.id) FILTER (WHERE d.doc_status = 'REJECTED')::int  AS rejected_count,
        MAX(d.uploaded_at)                                          AS last_upload
      FROM hr_employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN employee_documents d ON d.employee_id = e.id
      GROUP BY
        e.id, e.employee_code, e.name, e.email,
        e.department, e.job_title, e.joined_on,
        u.verification_status
      ORDER BY
        CASE COALESCE(u.verification_status, 'PENDING_VERIFICATION')
          WHEN 'DOCUMENT_SUBMITTED'   THEN 0
          WHEN 'PENDING_VERIFICATION' THEN 1
          WHEN 'REJECTED'             THEN 2
          WHEN 'VERIFIED'             THEN 3
          ELSE 4
        END,
        MAX(d.uploaded_at) DESC NULLS LAST,
        e.name ASC
    `);

    const employees = result.rows.map((row) => ({
      employeeId:         row.employee_id,
      employeeCode:       row.employee_code,
      name:               row.name,
      email:              row.email,
      department:         row.department,
      jobTitle:           row.job_title,
      joinedOn:           row.joined_on,
      verificationStatus: row.verification_status || 'PENDING_VERIFICATION',
      docCount:           Number(row.doc_count     || 0),
      verifiedCount:      Number(row.verified_count || 0),
      pendingCount:       Number(row.pending_count  || 0),
      rejectedCount:      Number(row.rejected_count || 0),
      lastUpload:         row.last_upload,
    }));

    /* Stats across ALL employees */
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(u.verification_status,'PENDING_VERIFICATION') = 'PENDING_VERIFICATION')::int AS pending_verification,
        COUNT(*) FILTER (WHERE u.verification_status = 'DOCUMENT_SUBMITTED')::int  AS document_submitted,
        COUNT(*) FILTER (WHERE u.verification_status = 'VERIFIED')::int            AS verified,
        COUNT(*) FILTER (WHERE u.verification_status = 'REJECTED')::int            AS rejected
      FROM hr_employees e
      LEFT JOIN users u ON u.id = e.user_id
    `);

    const s = statsResult.rows[0] || {};

    return res.json({
      employees,
      stats: {
        pendingVerification: Number(s.pending_verification || 0),
        documentSubmitted:   Number(s.document_submitted   || 0),
        verified:            Number(s.verified              || 0),
        rejected:            Number(s.rejected              || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
});

/* ── GET /verifications/:employeeId  —  Employee detail + documents ── */
router.get('/verifications/:employeeId', requireAuth, async (req, res, next) => {
  try {
    const empResult = await pool.query(`
      SELECT e.id, e.employee_code, e.name, e.email, e.phone, e.department, e.job_title,
             e.joined_on::text AS joined_on,
             COALESCE(u.verification_status, 'PENDING_VERIFICATION') AS verification_status,
             u.id AS user_id
      FROM hr_employees e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.id = $1
      LIMIT 1
    `, [req.params.employeeId]);

    if (empResult.rowCount === 0) return res.status(404).json({ message: 'Employee not found.' });

    const emp = empResult.rows[0];

    const docsResult = await pool.query(`
      SELECT id, doc_type, file_name, file_url, file_path, file_size,
             doc_status, rejection_reason, uploaded_at, verified_at, verified_by
      FROM employee_documents
      WHERE employee_id = $1
      ORDER BY uploaded_at DESC
    `, [emp.id]);

    const documents = docsResult.rows.map((d) => ({
      id:              d.id,
      docType:         d.doc_type,
      docTypeLabel:    d.doc_type.replace(/_/g, ' '),
      fileName:        d.file_name,
      fileUrl:         d.file_url || '',
      fileSize:        d.file_size || '',
      status:          d.doc_status || 'PENDING',
      rejectionReason: d.rejection_reason || '',
      uploadedAt:      d.uploaded_at,
      verifiedAt:      d.verified_at,
    }));

    return res.json({
      employee: {
        id:                 emp.id,
        employeeCode:       emp.employee_code,
        name:               emp.name,
        email:              emp.email,
        phone:              emp.phone,
        department:         emp.department,
        jobTitle:           emp.job_title,
        joinedOn:           emp.joined_on,
        verificationStatus: emp.verification_status || 'PENDING_VERIFICATION',
        userId:             emp.user_id,
      },
      documents,
    });
  } catch (error) {
    return next(error);
  }
});

/* ── PUT /verifications/:employeeId/verify  —  HR verifies employee ── */
router.put('/verifications/:employeeId/verify', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const empResult = await client.query(
      'SELECT id, user_id FROM hr_employees WHERE id = $1 LIMIT 1',
      [req.params.employeeId]
    );
    if (empResult.rowCount === 0) return res.status(404).json({ message: 'Employee not found.' });
    const emp = empResult.rows[0];

    await client.query('BEGIN');

    /* Verify ALL pending documents for this employee */
    await client.query(
      `UPDATE employee_documents
       SET doc_status = 'VERIFIED', verified = true,
           verified_at = NOW(), verified_by = $2, updated_at = NOW()
       WHERE employee_id = $1 AND doc_status = 'PENDING'`,
      [emp.id, req.user.id]
    );

    /* Update employee verification status in users table */
    if (emp.user_id) {
      await client.query(
        `UPDATE users SET verification_status = 'VERIFIED', updated_at = NOW()
         WHERE id = $1`,
        [emp.user_id]
      );
    }

    await client.query('COMMIT');
    return res.json({ message: 'Employee verified successfully.' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

/* ── PUT /verifications/:employeeId/reject  —  HR rejects employee ── */
router.put('/verifications/:employeeId/reject', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { reason, documentIds } = req.body;
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const empResult = await client.query(
      'SELECT id, user_id FROM hr_employees WHERE id = $1 LIMIT 1',
      [req.params.employeeId]
    );
    if (empResult.rowCount === 0) return res.status(404).json({ message: 'Employee not found.' });
    const emp = empResult.rows[0];

    await client.query('BEGIN');

    if (Array.isArray(documentIds) && documentIds.length > 0) {
      for (const docId of documentIds) {
        await client.query(
          `UPDATE employee_documents
           SET doc_status = 'REJECTED', verified = false,
               rejection_reason = $2, updated_at = NOW()
           WHERE id = $1 AND employee_id = $3`,
          [docId, reason.trim(), emp.id]
        );
      }
    } else {
      await client.query(
        `UPDATE employee_documents
         SET doc_status = 'REJECTED', verified = false,
             rejection_reason = $2, updated_at = NOW()
         WHERE employee_id = $1 AND doc_status = 'PENDING'`,
        [emp.id, reason.trim()]
      );
    }

    if (emp.user_id) {
      await client.query(
        `UPDATE users SET verification_status = 'REJECTED', updated_at = NOW()
         WHERE id = $1`,
        [emp.user_id]
      );
    }

    await client.query('COMMIT');
    return res.json({ message: 'Employee documents rejected. The employee will be notified to re-upload.' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    client.release();
  }
});

/* ── POST /  —  Upload document metadata (HR side) ── */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { employeeId, docType, fileName, fileSize } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'Employee is required.' });
    if (!fileName) return res.status(400).json({ message: 'File name is required.' });

    const empExists = await pool.query('SELECT id FROM hr_employees WHERE id = $1 LIMIT 1', [employeeId]);
    if (empExists.rowCount === 0) return res.status(404).json({ message: 'Employee not found.' });

    const type = DOC_TYPES.includes(docType) ? docType : 'other';
    const id = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO employee_documents (id, employee_id, doc_type, file_name, file_size, doc_status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
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

/* ── PUT /:id/verify  —  Mark single document as verified (HR) ── */
router.put('/:id/verify', requireAuth, async (req, res, next) => {
  try {
    const current = await pool.query('SELECT * FROM employee_documents WHERE id = $1 LIMIT 1', [req.params.id]);
    if (current.rowCount === 0) return res.status(404).json({ message: 'Document not found.' });

    await pool.query(
      `UPDATE employee_documents
       SET verified = true, doc_status = 'VERIFIED', verified_at = NOW(),
           verified_by = $2, rejection_reason = NULL, updated_at = NOW()
       WHERE id = $1`,
      [req.params.id, req.user.id]
    );

    return res.json({ message: 'Document verified.' });
  } catch (error) {
    return next(error);
  }
});

/* ── DELETE /:id  —  Remove a document ── */
router.delete('/:id', requireAuth, async (req, res, next) => {
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
