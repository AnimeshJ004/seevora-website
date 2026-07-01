import crypto from 'crypto';
import net from 'net';
import tls from 'tls';
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

function normalizeRequest(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    phone: row.phone,
    message: row.message,
    status: row.status,
    responseBody: row.response_body,
    emailStatus: row.email_status,
    emailError: row.email_error,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

function validateAuditRequest(body) {
  const errors = {};
  const data = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    company: String(body.company || '').trim(),
    phone: String(body.phone || '').trim(),
    message: String(body.message || '').trim(),
  };

  if (!data.name) errors.name = 'Full name is required.';
  if (!data.email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!data.message) errors.message = 'Message is required.';

  return { isValid: Object.keys(errors).length === 0, errors, data };
}

function validateResponse(body) {
  const responseBody = String(body.responseBody || body.message || '').trim();
  if (!responseBody) {
    return {
      isValid: false,
      errors: { responseBody: 'Response message is required.' },
      data: { responseBody },
    };
  }
  return { isValid: true, errors: {}, data: { responseBody } };
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function waitForLine(socket) {
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      const text = chunk.toString('utf8');
      if (/^\d{3}[\s-]/m.test(text)) {
        cleanup();
        resolve(text);
      }
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
    };
    socket.on('data', onData);
    socket.on('error', onError);
  });
}

async function smtpCommand(socket, command, expectedCode) {
  if (command) socket.write(`${command}\r\n`);
  const response = await waitForLine(socket);
  if (!response.startsWith(String(expectedCode))) {
    throw new Error(`SMTP command failed: ${response.trim()}`);
  }
  return response;
}

async function sendEmail({ to, subject, text }) {
  if (!smtpConfigured()) {
    return { status: 'queued', error: 'SMTP is not configured.' };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const socket = secure ? tls.connect({ host, port }) : net.connect({ host, port });

  try {
    await smtpCommand(socket, null, 220);
    await smtpCommand(socket, `EHLO ${process.env.SMTP_EHLO_DOMAIN || 'seevora.local'}`, 250);

    if (user && pass) {
      await smtpCommand(socket, 'AUTH LOGIN', 334);
      await smtpCommand(socket, Buffer.from(user).toString('base64'), 334);
      await smtpCommand(socket, Buffer.from(pass).toString('base64'), 235);
    }

    await smtpCommand(socket, `MAIL FROM:<${from}>`, 250);
    await smtpCommand(socket, `RCPT TO:<${to}>`, 250);
    await smtpCommand(socket, 'DATA', 354);
    socket.write([
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      text,
      '.',
      '',
    ].join('\r\n'));
    await smtpCommand(socket, null, 250);
    socket.write('QUIT\r\n');
    return { status: 'sent', error: null };
  } catch (error) {
    return { status: 'failed', error: error.message };
  } finally {
    socket.end();
  }
}

router.post('/', async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateAuditRequest(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const result = await pool.query(
      `INSERT INTO audit_requests (id, name, email, company, phone, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [crypto.randomUUID(), data.name, data.email, data.company || null, data.phone || null, data.message]
    );

    return res.status(201).json({
      message: 'Audit request received. We will get back to you within 24 hours.',
      request: normalizeRequest(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM audit_requests ORDER BY created_at DESC');
    return res.json({ requests: result.rows.map(normalizeRequest) });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/respond', async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateResponse(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const requestResult = await pool.query('SELECT * FROM audit_requests WHERE id = $1', [req.params.id]);
    const request = requestResult.rows[0];
    if (!request) return res.status(404).json({ message: 'Audit request not found.' });

    const emailResult = await sendEmail({
      to: request.email,
      subject: 'Seevora audit request response',
      text: `Hi ${request.name},\n\n${data.responseBody}\n\nRegards,\nSeevora Team`,
    });

    const updated = await pool.query(
      `UPDATE audit_requests
       SET status = $2,
           response_body = $3,
           email_status = $4,
           email_error = $5,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        request.id,
        emailResult.status === 'sent' ? 'responded' : 'response_saved',
        data.responseBody,
        emailResult.status,
        emailResult.error,
      ]
    );

    return res.json({
      message: emailResult.status === 'sent'
        ? 'Response sent to the user email.'
        : 'Response saved. Configure SMTP to send emails automatically.',
      request: normalizeRequest(updated.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
