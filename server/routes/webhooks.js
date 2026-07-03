import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendEmail } from '../utils/email.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_if_not_provided');

// Webhook endpoint to receive incoming emails
// Note: You must configure your email provider (SendGrid/Mailgun) to forward emails to this endpoint.
router.post('/email-inbound', async (req, res) => {
  try {
    // Structure of req.body depends on your email provider's webhook payload
    // Using a generic/SendGrid-like structure as an example:
    const fromAddress = req.body.from || req.body.sender;
    const subject = req.body.subject;
    const textBody = req.body.text || req.body.text_body;

    if (!fromAddress || !textBody) {
      return res.status(400).json({ message: 'Missing from or text field' });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
You are an AI support agent for Seevora.
Please read the following email from a user and generate a polite, helpful reply.
Keep the reply concise and professional.
Subject: ${subject}
Message: ${textBody}
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Send the AI-generated reply back to the user
    await sendEmail({
      to: fromAddress,
      subject: `Re: ${subject || 'Your Inquiry'}`,
      text: aiResponse,
      html: `<p>${aiResponse.replace(/\n/g, '<br/>')}</p>`
    });

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

    await pool.query(
      `UPDATE audit_requests
       SET thread = $2,
           updated_at = NOW(),
           status = 'user_replied'
       WHERE id = $1`,
      [request.id, JSON.stringify(updatedThread)]
    );

    res.status(200).json({ message: 'Reply added to audit request thread' });
  } catch (error) {
    console.error('Audit reply webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
});

export default router;
