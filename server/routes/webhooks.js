import express from 'express';
import { sendEmail } from '../utils/email.js';
import { generateAIReply } from '../utils/ai.js';

const router = express.Router();

// Webhook endpoint to receive incoming emails
router.post('/email-inbound', async (req, res) => {
  try {
    const fromAddress = req.body.from || req.body.sender;
    const subject = req.body.subject;
    const textBody = req.body.text || req.body.text_body;

    if (!fromAddress || !textBody) {
      return res.status(400).json({ message: 'Missing from or text field' });
    }

    const prompt = `
You are an AI support agent for Seevora.
Please read the following email from a user and generate a polite, helpful reply.
Keep the reply concise and professional.
Subject: ${subject}
Message: ${textBody}
    `;

    const aiResponse = await generateAIReply({
      prompt,
      systemPrompt: 'You are an AI support agent for Seevora. Please read the email from a user and generate a polite, helpful, concise, and professional reply.'
    });

    let mailSent = false;
    if (aiResponse) {
      const { sendMail } = await import('../utils/mailer.js');
      const { aiContactReply } = await import('../utils/emailTemplates.js');

      const mailResult = await sendMail({
        to: fromAddress,
        ...aiContactReply({
          name: fromAddress.split('@')[0],
          aiResponse
        })
      });
      if (mailResult && mailResult.success) {
        mailSent = true;
      }
    }

    const { default: pool } = await import('../config/db.js');
    const { randomUUID } = await import('crypto');
    const toAddress = req.body.to || req.body.recipient || process.env.SMTP_USER || 'info@seevora.in';

    await pool.query(
      `INSERT INTO inbound_emails (id, from_email, to_email, subject, body, ai_reply, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), fromAddress, toAddress, subject || '', textBody, aiResponse || null, mailSent ? 'replied' : 'received']
    );

    res.status(200).json({ message: 'Webhook processed and reply sent' });
  } catch (error) {
    console.error('Inbound email webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
});

router.post('/audit-reply', async (req, res) => {
  try {
    const fromAddress = req.body.from || req.body.sender;
    const textBody = req.body.text || req.body.text_body;

    if (!fromAddress || !textBody) {
      return res.status(400).json({ message: 'Missing from or text field' });
    }

    const { default: pool } = await import('../config/db.js');
    const { randomUUID } = await import('crypto');

    // Find the latest audit request from this email
    const requestResult = await pool.query(
      'SELECT * FROM audit_requests WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [fromAddress]
    );

    const request = requestResult.rows[0];
    if (!request) {
      return res.status(404).json({ message: 'No audit request found for this email' });
    }

    const currentThread = request.thread || [];
    const newReply = {
      id: randomUUID(),
      sender: 'user',
      text: textBody,
      timestamp: new Date().toISOString()
    };
    const updatedThread = [...currentThread, newReply];

    // Save the user's reply first
    await pool.query(
      `UPDATE audit_requests
       SET thread = $2,
           updated_at = NOW(),
           status = 'user_replied'
       WHERE id = $1`,
      [request.id, JSON.stringify(updatedThread)]
    );

    // Generate AI response based on the entire conversation history
    const aiResponse = await generateAIReply({
      systemPrompt: 'You are Seevora\'s AI Support & Sales Agent. Seevora is an AI-powered B2B automation company. Answer the customer\'s email reply professionally and helpfully based on the email history. Keep it concise, friendly, and natural. Do NOT use placeholders. Sign off as "The Seevora Team".',
      thread: updatedThread
    });

    if (aiResponse) {
      const { sendMail } = await import('../utils/mailer.js');
      const { contactThreadReply } = await import('../utils/emailTemplates.js');

      const emailResult = await sendMail({
        to: fromAddress,
        ...contactThreadReply({
          toName: request.name,
          responseBody: aiResponse,
          originalMessage: textBody
        })
      });

      if (emailResult.success) {
        const aiReply = {
          id: randomUUID(),
          sender: 'admin',
          text: aiResponse,
          timestamp: new Date().toISOString()
        };
        const finalThread = [...updatedThread, aiReply];

        await pool.query(
          `UPDATE audit_requests
           SET thread = $2,
               response_body = $3,
               status = 'responded',
               updated_at = NOW()
           WHERE id = $1`,
          [request.id, JSON.stringify(finalThread), aiResponse]
        );
      }
    }

    res.status(200).json({ message: 'Reply added and AI reply sent' });
  } catch (error) {
    console.error('Audit reply webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
});

export default router;


