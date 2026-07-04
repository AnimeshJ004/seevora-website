const fs = require("fs");
let c = fs.readFileSync("server/routes/auditRequests.js","utf8");

// Remove old SMTP helper functions (everything from smtpConfigured to closing brace of sendEmail)
const start = c.indexOf("function smtpConfigured()");
const end = c.indexOf("\nrouter.post('/',");
if (start !== -1 && end !== -1) {
  c = c.slice(0, start) + c.slice(end);
  console.log("Removed old SMTP helpers");
}

// Update POST / handler to send emails after saving
const oldPost = `router.post('/', async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateAuditRequest(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const initialThread = [{
      id: crypto.randomUUID(),
      sender: 'user',
      text: data.message,
      timestamp: new Date().toISOString()
    }];

    const result = await pool.query(
      \`INSERT INTO audit_requests (id, name, email, company, phone, message, thread)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *\`,
      [crypto.randomUUID(), data.name, data.email, data.company || null, data.phone || null, data.message, JSON.stringify(initialThread)]
    );

    return res.status(201).json({
      message: 'Audit request received. We will get back to you within 24 hours.',
      request: normalizeRequest(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});`;

const newPost = `router.post('/', async (req, res, next) => {
  try {
    const { isValid, errors, data } = validateAuditRequest(req.body);
    if (!isValid) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    const initialThread = [{
      id: crypto.randomUUID(),
      sender: 'user',
      text: data.message,
      timestamp: new Date().toISOString()
    }];

    const result = await pool.query(
      \`INSERT INTO audit_requests (id, name, email, company, phone, message, thread)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *\`,
      [crypto.randomUUID(), data.name, data.email, data.company || null, data.phone || null, data.message, JSON.stringify(initialThread)]
    );

    // 1. Send customer auto-reply
    const autoReplyTpl = contactAutoReply({ name: data.name, company: data.company, message: data.message });
    sendMail({ to: data.email, ...autoReplyTpl }).catch(() => {});

    // 2. Notify admin
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_FROM;
    if (adminEmail) {
      const adminTpl = contactAdminNotification({ name: data.name, email: data.email, phone: data.phone, company: data.company, message: data.message });
      sendMail({ to: adminEmail, ...adminTpl }).catch(() => {});
    }

    return res.status(201).json({
      message: 'Message received! Check your email — we sent you a confirmation.',
      request: normalizeRequest(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
});`;

c = c.replace(oldPost, newPost);

// Update respond handler to use new template
const oldRespond = "subject: 'Seevora audit request response',\n      text: `Hi ${request.name},\\n\\n${data.responseBody}\\n\\nRegards,\\nSeevora Team`,";
const newRespond = "...contactThreadReply({ toName: request.name, responseBody: data.responseBody, originalMessage: request.message }),";
c = c.replace(
  "const emailResult = await sendEmail({\n      to: request.email,\n      subject: 'Seevora audit request response',\n      text: `Hi ${request.name},\\n\\n${data.responseBody}\\n\\nRegards,\\nSeevora Team`,\n    });",
  "const emailResult = await sendMail({ to: request.email, ...contactThreadReply({ toName: request.name, responseBody: data.responseBody, originalMessage: request.message }) });\n    emailResult.status = emailResult.success ? 'sent' : 'failed';\n    emailResult.error = emailResult.error || null;"
);

fs.writeFileSync("server/routes/auditRequests.js", c, "utf8");
console.log("auditRequests.js upgraded");
