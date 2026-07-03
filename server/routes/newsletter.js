import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { sendEmail } from '../utils/email.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public: Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await pool.query(
      `INSERT INTO subscribers (id, email, status) 
       VALUES ($1, $2, 'active')
       ON CONFLICT (email) 
       DO UPDATE SET status = 'active', unsubscribed_at = NULL, updated_at = NOW()
       RETURNING *`,
      [crypto.randomUUID(), email]
    );

    // Optional: send confirmation email
    await sendEmail({
      to: email,
      subject: 'Welcome to Seevora Newsletter!',
      html: '<p>Thank you for subscribing to our newsletter! We will keep you updated.</p>',
    });

    res.status(200).json({ message: 'Successfully subscribed', subscriber: result.rows[0] });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ message: 'Error subscribing to newsletter' });
  }
});

// Public: Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await pool.query(
      `UPDATE subscribers 
       SET status = 'unsubscribed', unsubscribed_at = NOW(), updated_at = NOW() 
       WHERE email = $1`,
      [email]
    );

    res.status(200).json({ message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ message: 'Error unsubscribing from newsletter' });
  }
});

// Admin: Get all subscribers
router.get('/', requireRole('super_admin', 'admin', 'hr'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM subscribers ORDER BY created_at DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// Admin: Send broadcast
router.post('/broadcast', requireRole('super_admin', 'admin', 'hr'), async (req, res) => {
  try {
    const { subject, messageHtml } = req.body;
    if (!subject || !messageHtml) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const result = await pool.query(
      `SELECT email FROM subscribers WHERE status = 'active'`
    );

    const subscribers = result.rows;
    let sentCount = 0;

    for (const sub of subscribers) {
      // In a real production app, this should be sent to a queue
      const success = await sendEmail({
        to: sub.email,
        subject,
        html: messageHtml,
      });
      if (success) sentCount++;
    }

    res.status(200).json({ 
      message: 'Broadcast sent successfully', 
      totalActive: subscribers.length,
      sentCount 
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ message: 'Error sending broadcast' });
  }
});

export default router;
