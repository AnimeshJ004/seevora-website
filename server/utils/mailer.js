/* ============================================================
   Seevora — Nodemailer email sender
   Uses SMTP config from .env
============================================================ */
import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
  return transporter;
}

/**
 * Send an email.
 * @param {{ to: string, subject: string, html: string, text: string }} opts
 * @returns {{ success: boolean, error?: string }}
 */
export async function sendMail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Mailer] SMTP not configured — email not sent');
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"Seevora" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[Mailer] Email sent to ${to} — "${subject}"`);
    return { success: true };
  } catch (err) {
    console.error(`[Mailer] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send to multiple recipients.
 * @param {{ recipients: string[], subject: string, html: string, text: string }} opts
 */
export async function sendBulk({ recipients, subject, html, text }) {
  const results = [];
  for (const to of recipients) {
    const r = await sendMail({ to, subject, html, text });
    results.push({ to, ...r });
  }
  return results;
}
