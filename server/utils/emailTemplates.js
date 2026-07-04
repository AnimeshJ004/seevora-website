/* ============================================================
   Seevora — Professional Email Templates
   All templates return { subject, html, text }
============================================================ */

const BRAND = {
  name:    'Seevora',
  tagline: 'AI-Powered Business Automation',
  color:   '#14c9e1',
  dark:    '#0a0a0a',
  site:    'https://seevora.in',
  email:   'info@seevora.in',
  phone:   '+91 82692 97967',
  address: 'Indore, Madhya Pradesh, India',
};

function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Seevora</title>
<style>
  body { margin:0; padding:0; background:#f4f6f8; font-family:'Segoe UI',Helvetica,Arial,sans-serif; }
  .wrapper { max-width:600px; margin:32px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .header { background:${BRAND.dark}; padding:28px 36px; text-align:center; }
  .header .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; }
  .header .logo span { color:${BRAND.color}; }
  .header .tagline { font-size:12px; color:#94a3b8; margin-top:4px; }
  .body { padding:36px 36px 28px; }
  .body h2 { font-size:20px; font-weight:700; color:#0f172a; margin:0 0 12px; }
  .body p { font-size:15px; color:#475569; line-height:1.7; margin:0 0 14px; }
  .body strong { color:#0f172a; }
  .cta { display:inline-block; margin:20px 0; padding:13px 28px; background:${BRAND.dark}; color:#ffffff !important; text-decoration:none; border-radius:100px; font-size:14px; font-weight:700; letter-spacing:0.3px; }
  .divider { border:none; border-top:1px solid #e2e8f0; margin:24px 0; }
  .detail-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px 20px; margin:18px 0; }
  .detail-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e8edf2; font-size:14px; }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { color:#64748b; font-weight:600; }
  .detail-value { color:#1e293b; }
  .highlight { background:${BRAND.color}18; border-left:3px solid ${BRAND.color}; padding:14px 18px; border-radius:0 8px 8px 0; margin:16px 0; font-size:14px; color:#0f172a; }
  .footer { background:#f8fafc; padding:22px 36px; text-align:center; border-top:1px solid #e2e8f0; }
  .footer p { font-size:12px; color:#94a3b8; margin:0; line-height:1.8; }
  .footer a { color:${BRAND.color}; text-decoration:none; }
  @media(max-width:600px){ .wrapper{margin:0;border-radius:0;} .body,.header,.footer{padding:24px 20px;} }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Seevora<span>.</span></div>
    <div class="tagline">${BRAND.tagline}</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>
      <strong>Seevora Private Limited</strong><br/>
      ${BRAND.address}<br/>
      <a href="tel:${BRAND.phone}">${BRAND.phone}</a> &nbsp;|&nbsp;
      <a href="mailto:${BRAND.email}">${BRAND.email}</a><br/>
      <a href="${BRAND.site}">${BRAND.site}</a>
    </p>
    <p style="margin-top:10px;font-size:11px;">
      You received this email because you reached out to Seevora.
      &copy; ${new Date().getFullYear()} Seevora Private Limited. All rights reserved.
    </p>
  </div>
</div>
</body>
</html>`;
}

/* ── 1. Customer auto-reply after contact form ── */
export function contactAutoReply({ name, company, message }) {
  const subject = `Thank you for contacting Seevora, ${name.split(' ')[0]}!`;
  const html = baseLayout(`
    <h2>We received your message!</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thank you for reaching out to Seevora. We've received your enquiry and our team will get back to you within <strong>24 hours</strong>.</p>
    <div class="highlight">
      Our team is reviewing your message and will connect with you shortly to understand your business needs and suggest the best AI automation approach for you.
    </div>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${name}</span></div>
      ${company ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${company}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">Your Message</span><span class="detail-value" style="max-width:280px;word-break:break-word;">${message.slice(0, 200)}${message.length > 200 ? '...' : ''}</span></div>
    </div>
    <p>While you wait, explore how we help businesses like yours:</p>
    <a href="${BRAND.site}" class="cta">Explore Seevora →</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#94a3b8;">If you have an urgent query, call us directly at <a href="tel:${BRAND.phone}" style="color:${BRAND.color};">${BRAND.phone}</a>.</p>
  `);
  const text = `Hi ${name},\n\nThank you for contacting Seevora!\n\nWe've received your message and will get back to you within 24 hours.\n\nYour message: "${message.slice(0, 200)}"\n\nFor urgent queries, call: ${BRAND.phone}\n\nBest regards,\nSeevora Team\n${BRAND.site}`;
  return { subject, html, text };
}

/* ── 2. Admin notification for new contact form submission ── */
export function contactAdminNotification({ name, email, phone, company, message }) {
  const subject = `New Contact Form Submission — ${name}${company ? ` (${company})` : ''}`;
  const html = baseLayout(`
    <h2>New Enquiry Received</h2>
    <p>A new contact form submission has been received on Seevora.in.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${name}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value"><a href="mailto:${email}" style="color:${BRAND.color};">${email}</a></span></div>
      ${phone ? `<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${phone}</span></div>` : ''}
      ${company ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${company}</span></div>` : ''}
    </div>
    <p><strong>Message:</strong></p>
    <div class="highlight">${message}</div>
    <a href="mailto:${email}?subject=Re: Your enquiry to Seevora" class="cta">Reply to ${name.split(' ')[0]} →</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#94a3b8;">Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
  `);
  const text = `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nCompany: ${company || 'N/A'}\n\nMessage:\n${message}\n\nSubmitted: ${new Date().toLocaleString('en-IN')}`;
  return { subject, html, text };
}

/* ── 3. CRM Outbound cold email to a lead ── */
export function crmOutboundEmail({ leadName, company, senderName, customMessage, serviceContext }) {
  const firstName = leadName.split(' ')[0];
  const subject = `Quick question about ${company || 'your business'}, ${firstName}`;
  const html = baseLayout(`
    <h2>Personalised for ${firstName}</h2>
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>${customMessage || `I came across ${company || 'your business'} and wanted to reach out about how Seevora's AI automation platform could help you save time and grow faster.`}</p>
    ${serviceContext ? `<div class="highlight">${serviceContext}</div>` : ''}
    <p>Here's what businesses like yours typically achieve with Seevora in the first 90 days:</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Cost Reduction</span><span class="detail-value" style="color:#10b981;font-weight:700;">Up to 40%</span></div>
      <div class="detail-row"><span class="detail-label">Processing Speed</span><span class="detail-value" style="color:#10b981;font-weight:700;">10x faster</span></div>
      <div class="detail-row"><span class="detail-label">Accuracy Rate</span><span class="detail-value" style="color:#10b981;font-weight:700;">99%+ on structured tasks</span></div>
      <div class="detail-row"><span class="detail-label">Setup Time</span><span class="detail-value" style="color:#10b981;font-weight:700;">5 days to go live</span></div>
    </div>
    <p>Would you be open to a 20-minute call this week to explore if this fits your workflow?</p>
    <a href="${BRAND.site}#book-a-call" class="cta">Book a Free Discovery Call →</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#475569;">
      <strong>${senderName || 'The Seevora Team'}</strong><br/>
      Seevora Private Limited<br/>
      <a href="tel:${BRAND.phone}" style="color:${BRAND.color};">${BRAND.phone}</a>
    </p>
    <p style="font-size:12px;color:#94a3b8;margin-top:8px;">If you don't wish to receive further emails, simply reply with "unsubscribe".</p>
  `);
  const text = `Hi ${firstName},\n\n${customMessage || `I came across ${company || 'your business'} and wanted to reach out about Seevora's AI automation platform.`}\n\nWould you be open to a 20-minute call this week?\n\nBook here: ${BRAND.site}#book-a-call\n\nBest regards,\n${senderName || 'Seevora Team'}\n${BRAND.phone}`;
  return { subject, html, text };
}

/* ── 4. Admin response to a contact form (existing thread) ── */
export function contactThreadReply({ toName, responseBody, originalMessage }) {
  const subject = `Re: Your enquiry to Seevora`;
  const html = baseLayout(`
    <h2>Response from Seevora</h2>
    <p>Hi <strong>${toName}</strong>,</p>
    <div class="highlight">${responseBody.replace(/\n/g, '<br/>')}</div>
    ${originalMessage ? `
    <hr class="divider"/>
    <p style="font-size:13px;color:#94a3b8;"><strong>Your original message:</strong></p>
    <p style="font-size:13px;color:#94a3b8;">${originalMessage}</p>` : ''}
    <hr class="divider"/>
    <p style="font-size:13px;">Need anything else? Reply to this email or call us at <a href="tel:${BRAND.phone}" style="color:${BRAND.color};">${BRAND.phone}</a>.</p>
  `);
  const text = `Hi ${toName},\n\n${responseBody}\n\nBest regards,\nSeevora Team\n${BRAND.phone}`;
  return { subject, html, text };
}

/* ── 5. Thank you email after booking a call ── */
export function callBookingConfirmation({ name, email, company, phone, message }) {
  const firstName = name.split(' ')[0];
  const subject = `Thanks for booking a call, ${firstName}! 🎯 — Seevora`;
  const html = baseLayout(`
    <h2>Your Discovery Call is Confirmed! 🎉</h2>
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>Thank you for booking a discovery call with Seevora! We're excited to learn about your business and explore how our AI-powered automation can help you grow.</p>

    <div class="highlight">
      <strong>What happens next?</strong><br/>
      Our team will review your details and reach out within <strong>24 hours</strong> to schedule a convenient time for your call.
    </div>

    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${name}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${email}</span></div>
      ${company ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${company}</span></div>` : ''}
      ${phone ? `<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${phone}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">Your Message</span><span class="detail-value" style="max-width:280px;word-break:break-word;">${message.slice(0, 300)}${message.length > 300 ? '...' : ''}</span></div>
    </div>

    <p style="font-size:15px;color:#475569;margin-top:20px;"><strong>During the call, we'll cover:</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:14px 0;">
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px 0 0 0;font-size:14px;color:#475569;">
          <span style="color:${BRAND.color};font-weight:700;margin-right:8px;">✓</span> Understanding your current business workflow
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;font-size:14px;color:#475569;">
          <span style="color:${BRAND.color};font-weight:700;margin-right:8px;">✓</span> Identifying automation opportunities
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;color:#475569;">
          <span style="color:${BRAND.color};font-weight:700;margin-right:8px;">✓</span> Personalized AI strategy for your industry
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:0 0 6px 6px;font-size:14px;color:#475569;">
          <span style="color:${BRAND.color};font-weight:700;margin-right:8px;">✓</span> ROI projection & implementation timeline
        </td>
      </tr>
    </table>

    <a href="${BRAND.site}" class="cta">Explore Seevora →</a>

    <hr class="divider"/>
    <p style="font-size:13px;color:#94a3b8;">
      Have questions before the call? Reply to this email or reach us at
      <a href="tel:${BRAND.phone}" style="color:${BRAND.color};">${BRAND.phone}</a>.
    </p>
  `);

  const text = `Hi ${firstName},\n\nThank you for booking a discovery call with Seevora! 🎯\n\nWe're excited to learn about your business and explore how our AI-powered automation can help you grow.\n\nWhat happens next?\nOur team will review your details and reach out within 24 hours to schedule a convenient time for your call.\n\nYour Details:\n- Name: ${name}\n- Email: ${email}${company ? `\n- Company: ${company}` : ''}${phone ? `\n- Phone: ${phone}` : ''}\n- Message: "${message.slice(0, 300)}"\n\nDuring the call, we'll cover:\n✓ Understanding your current business workflow\n✓ Identifying automation opportunities\n✓ Personalized AI strategy for your industry\n✓ ROI projection & implementation timeline\n\nHave questions? Call us at ${BRAND.phone} or reply to this email.\n\nLooking forward to speaking with you!\n\nWarm regards,\nThe Seevora Team\n${BRAND.site}`;

  return { subject, html, text };
}
