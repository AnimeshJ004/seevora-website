import nodemailer from 'nodemailer';

function createTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP is not fully configured; email was not sent.');
    return { success: false, error: 'SMTP is not fully configured.' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    console.log('[Email] Sent message %s to %s', info.messageId, to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
}
