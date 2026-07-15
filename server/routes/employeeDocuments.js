import crypto from 'crypto';
import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { normalizeRole, requireAuth } from '../middleware/auth.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';
import {
  DocumentSecurityError,
  isPathInside,
  removeFileQuietly,
  scanUploadedDocument,
  validateUploadedDocument,
} from '../utils/documentSecurity.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const legacyUploadsDir = path.resolve(__dirname, '../../uploads');
const uploadsDir = path.resolve(
  process.env.DOCUMENT_UPLOAD_DIR || path.join(legacyUploadsDir, 'private-documents')
);

/* ── Multer configuration ── */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}.upload`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX'));
    }
  },
});

const DOC_TYPES = [
  'aadhaar', 'pan', 'resume', 'qualification_certificate',
  'bank_details', 'offer_letter', 'payslip', 'experience_letter', 'other',
];

function protectedFileUrl(documentId) {
  return `/api/employee/documents/file/${documentId}`;
}

/* ── Helper: get hr_employees row linked to this user ── */
async function getEmployeeByUserId(userId) {
  const res = await pool.query(
    'SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return res.rows[0] || null;
}

/* ── GET /api/employee/verification-status ── */
router.get('/verification-status', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.verification_status,
              e.id AS employee_id, e.name, e.email, e.department, e.job_title, e.employee_code
       FROM users u
       LEFT JOIN hr_employees e ON e.user_id = u.id
       WHERE u.id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (!result.rows[0]) return res.status(404).json({ message: 'User not found.' });

    const row = result.rows[0];

    // Fetch documents if employee record exists
    let documents = [];
    if (row.employee_id) {
      const docsRes = await pool.query(
        `SELECT id, doc_type, file_name, file_url, doc_status, rejection_reason, uploaded_at
         FROM employee_documents
         WHERE employee_id = $1
         ORDER BY uploaded_at DESC`,
        [row.employee_id]
      );
      documents = docsRes.rows.map((d) => ({
        id: d.id,
        docType: d.doc_type,
        fileName: d.file_name,
        fileUrl: protectedFileUrl(d.id),
        status: d.doc_status,
        rejectionReason: d.rejection_reason,
        uploadedAt: d.uploaded_at,
      }));
    }

    return res.json({
      verificationStatus: row.verification_status,
      employee: row.employee_id ? {
        id: row.employee_id,
        name: row.name,
        email: row.email,
        department: row.department,
        jobTitle: row.job_title,
        employeeCode: row.employee_code,
      } : null,
      documents,
    });
  } catch (error) {
    return next(error);
  }
});

/* ── GET /api/employee/documents/my-documents ── */
router.get('/documents/my-documents', requireAuth, async (req, res, next) => {
  try {
    const emp = await getEmployeeByUserId(req.user.id);
    if (!emp) {
      return res.json({ documents: [], message: 'No employee profile linked to this account.' });
    }

    const docsRes = await pool.query(
      `SELECT id, doc_type, file_name, file_url, file_size, doc_status, rejection_reason,
              uploaded_at, verified_at
       FROM employee_documents
       WHERE employee_id = $1
       ORDER BY uploaded_at DESC`,
      [emp.id]
    );

    const documents = docsRes.rows.map((d) => ({
      id: d.id,
      docType: d.doc_type,
      fileName: d.file_name,
      fileUrl: protectedFileUrl(d.id),
      fileSize: d.file_size,
      status: d.doc_status,
      rejectionReason: d.rejection_reason,
      uploadedAt: d.uploaded_at,
      verifiedAt: d.verified_at,
    }));

    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
});

/* ── POST /api/employee/documents/upload ── */
router.post(
  '/documents/upload',
  requireAuth,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large. Maximum size is 5 MB.' });
        }
        return res.status(400).json({ message: err.message });
      }
      if (err) return res.status(400).json({ message: err.message });
      return next();
    });
  },
  async (req, res, next) => {
    try {
      const emp = await getEmployeeByUserId(req.user.id);
      if (!emp) {
        await removeFileQuietly(req.file?.path);
        return res.status(400).json({
          message: 'No employee profile is linked to your account. Please contact HR.',
        });
      }

      const { docType } = req.body;
      const type = DOC_TYPES.includes(docType) ? docType : 'other';

      if (!req.file) {
        return res.status(400).json({ message: 'Please select a file to upload.' });
      }

      let validation;
      let filePath;
      try {
        validation = await validateUploadedDocument(req.file);
        await scanUploadedDocument(req.file.path);
        filePath = path.join(uploadsDir, `${crypto.randomUUID()}${validation.safeExtension}`);
        await fsp.rename(req.file.path, filePath);
        req.file.path = filePath;
      } catch (error) {
        await removeFileQuietly(req.file?.path);
        if (error instanceof DocumentSecurityError) {
          return res.status(error.statusCode).json({ message: error.message });
        }
        throw error;
      }

      const fileName = validation.safeOriginalName;
      const fileSize = `${(req.file.size / 1024).toFixed(0)} KB`;
      const docId = crypto.randomUUID();
      const client = await pool.connect();
      let oldFilePath = '';
      let storedDocumentId = docId;

      try {
        await client.query('BEGIN');

        /* Check if a document of the same type already exists (replace on re-upload) */
        const existing = await client.query(
          `SELECT id, file_path FROM employee_documents
           WHERE employee_id = $1 AND doc_type = $2
           LIMIT 1`,
          [emp.id, type]
        );

        if (existing.rowCount > 0) {
          oldFilePath = existing.rows[0].file_path || '';
          storedDocumentId = existing.rows[0].id;
          /* Update existing document — reset status on re-upload */
          await client.query(
            `UPDATE employee_documents
             SET file_name = $1, file_path = $2, file_url = $3, file_size = $4,
                 doc_status = 'PENDING', rejection_reason = NULL,
                 verified = false, verified_at = NULL, verified_by = NULL,
                 uploaded_at = NOW(), updated_at = NOW()
             WHERE id = $5`,
            [fileName, filePath, protectedFileUrl(existing.rows[0].id), fileSize, existing.rows[0].id]
          );
        } else {
          /* Insert new document */
          await client.query(
            `INSERT INTO employee_documents
               (id, employee_id, doc_type, file_name, file_path, file_url, file_size, doc_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
            [docId, emp.id, type, fileName, filePath, protectedFileUrl(docId), fileSize]
          );
        }

        await client.query('COMMIT');
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch {}
        await removeFileQuietly(filePath);
        throw error;
      } finally {
        client.release();
      }

      if (
        oldFilePath
        && oldFilePath !== filePath
        && (isPathInside(oldFilePath, uploadsDir) || isPathInside(oldFilePath, legacyUploadsDir))
      ) {
        await removeFileQuietly(oldFilePath);
      }

      invalidateCacheNamespaces(CACHE_NAMESPACES.documents);

      return res.status(201).json({
        message: 'Your documents have been submitted successfully. Please wait for HR verification.',
        docType: type,
        fileName,
        fileUrl: protectedFileUrl(storedDocumentId),
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get('/documents/file/:documentId', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.file_path, d.file_name, d.employee_id, e.user_id
       FROM employee_documents d
       JOIN hr_employees e ON e.id = d.employee_id
       WHERE d.id = $1
       LIMIT 1`,
      [req.params.documentId]
    );
    const document = result.rows[0];
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    const role = normalizeRole(req.user?.role);
    const canAccess = ['admin', 'hr'].includes(role) || document.user_id === req.user?.id;
    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const resolvedPath = path.resolve(document.file_path || '');
    const isAllowedPath = isPathInside(resolvedPath, uploadsDir) || isPathInside(resolvedPath, legacyUploadsDir);
    if (!isAllowedPath) {
      return res.status(404).json({ message: 'Document file not found.' });
    }

    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
      'Cache-Control': 'private, no-store',
    });
    return res.download(resolvedPath, document.file_name || path.basename(resolvedPath));
  } catch (error) {
    return next(error);
  }
});

/* ── PUT /api/employee/documents/submit  —  Submit partial documents for HR review ── */
router.put('/documents/submit', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE users
       SET verification_status = 'DOCUMENT_SUBMITTED', updated_at = NOW()
       WHERE id = $1 AND verification_status IN ('PENDING_VERIFICATION', 'REJECTED')
       RETURNING verification_status`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Unable to submit documents. Account may already be submitted or verified.' });
    }

    invalidateCacheNamespaces(CACHE_NAMESPACES.documents);

    return res.json({
      message: 'Documents submitted for HR review. You can upload any remaining documents at any time.',
      verificationStatus: 'DOCUMENT_SUBMITTED',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
