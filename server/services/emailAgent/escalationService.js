import pool from '../../config/db.js';
import { sendMail } from '../../utils/mailer.js';
import { writeLog, detectModelUsed } from './replyLogger.js';

/**
 * Escalate a thread and send final human-handoff email.
 * @param {object} thread - Row from email_threads
 * @param {object} inboundEmail - Row from inbound_emails (for context)
 * @param {'human_request'|'reply_limit_reached'} reason
 * @returns {Promise<void>}
 */
export async function escalateThread(thread, inboundEmail, reason = 'human_request') {
  try {
    // 1. Update thread to mark as escalated and disable auto-reply
    await pool.query(
      `UPDATE email_threads 
       SET escalated = true, 
           auto_reply_enabled = false, 
           escalation_reason = $2, 
           updated_at = NOW() 
       WHERE thread_id = $1`,
      [thread.thread_id, reason]
    );

    // 2. Build escalation email HTML using Seevora brand template
    const fromName = inboundEmail.from_name || 'there';
    const firstName = fromName.split(' ')[0];

    const escalationText = `Hi ${firstName},

Thank you for reaching out to Seevora!

I've noted your message and a member of our team will be in touch with you shortly to continue this conversation personally.

In the meantime, you can also reach us at:
📧 info@seevora.in
📞 +91 82692 97967
🌐 https://seevora.in

We'll be in touch soon.

Warm regards,
The Seevora Team`;

    const escalationHtml = buildEscalationHtml(firstName, escalationText);

    // 3. Send escalation email via sendMail
    const subject = buildReplySubject(inboundEmail.subject);

    const mailResult = await sendMail({
      to: inboundEmail.from_email,
      subject,
      html: escalationHtml,
      text: escalationText,
    });

    // 4. Log the escalation via replyLogger
    await writeLog({
      threadId: thread.thread_id,
      inboundEmailId: inboundEmail.id,
      toEmail: inboundEmail.from_email,
      subject,
      replyBodyHtml: escalationHtml,
      replyBodyText: escalationText,
      aiModelUsed: null, // No AI used for escalation
      source: 'escalation',
      status: mailResult.success ? 'sent' : 'failed',
      errorMessage: mailResult.error || null,
      escalationReason: reason,
      processingDurationMs: null,
    });

    // 5. Update inbound_email status to 'escalated'
    await pool.query(
      `UPDATE inbound_emails SET status = 'escalated' WHERE id = $1`,
      [inboundEmail.id]
    );

    console.log(`[escalationService] Thread ${thread.thread_id} escalated (${reason})`);
  } catch (err) {
    console.error('[escalationService] Failed to escalate thread:', err.message);
    throw err;
  }
}

/**
 * Build reply subject, preserving existing Re: prefix if present
 * @param {string|null} originalSubject
 * @returns {string}
 */
function buildReplySubject(originalSubject) {
  if (!originalSubject) {
    return 'Re: Your enquiry';
  }
  
  if (originalSubject.trim().toLowerCase().startsWith('re:')) {
    return originalSubject;
  }
  
  return `Re: ${originalSubject}`;
}

/**
 * Build escalation email HTML using Seevora brand template
 * @param {string} firstName
 * @param {string} textContent
 * @returns {string}
 */
function buildEscalationHtml(firstName, textContent) {
  const bodyHtml = textContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Seevora</title>
<style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
  .header{background:#0a0a0a;padding:28px 36px;text-align:center;}
  .logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
  .logo span{color:#14c9e1;}
  .tagline{font-size:12px;color:#94a3b8;margin-top:4px;}
  .body{padding:36px 36px 28px;}
  .body p{font-size:15px;color:#475569;line-height:1.7;margin:0 0 14px;}
  .footer{background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #e2e8f0;}
  .footer p{font-size:12px;color:#94a3b8;margin:0;line-height:1.8;}
  .footer a{color:#14c9e1;text-decoration:none;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Seevora<span>.</span></div>
    <div class="tagline">AI-Powered Business Automation</div>
  </div>
  <div class="body">
    <p>${bodyHtml}</p>
  </div>
  <div class="footer">
    <p><strong>Seevora Private Limited</strong><br/>
    Indore, Madhya Pradesh, India<br/>
    <a href="tel:+918269297967">+91 82692 97967</a> &nbsp;|&nbsp;
    <a href="mailto:info@seevora.in">info@seevora.in</a><br/>
    <a href="https://seevora.in">seevora.in</a></p>
    <p style="margin-top:10px;font-size:11px;">
      &copy; ${new Date().getFullYear()} Seevora Private Limited. All rights reserved.
    </p>
  </div>
</div>
</body>
</html>`;
}
