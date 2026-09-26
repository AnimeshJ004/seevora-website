/* ============================================================
   Seevora — WhatsApp API Routes
   Handles Meta webhook verification, inbound messages,
   conversation management, messaging, and automation rules.
============================================================ */
import crypto from 'crypto';
import express from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { buildCacheKey, getOrSetCache } from '../utils/cache.js';
import { CACHE_NAMESPACES, invalidateCacheNamespaces } from '../utils/cacheNamespaces.js';
import {
  processInboundMessage,
  processStatusUpdate,
  sendWhatsAppMessage,
  storeOutboundMessage,
} from '../services/whatsapp/automationEngine.js';

const router  = express.Router();
const guard   = requireRole('admin', 'manager', 'sales_developer');
const WA_TTL  = 30; // cache seconds

function bustWhatsAppCache() {
  invalidateCacheNamespaces(CACHE_NAMESPACES.whatsapp, CACHE_NAMESPACES.dashboard);
}

// ── Webhook verification (GET) ─────────────────────────────────────
router.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'seevora_whatsapp_verify';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp] Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ── Webhook receiver (POST) — inbound messages from Meta ───────────
router.post('/webhook', express.json(), async (req, res) => {
  try {
    res.sendStatus(200); // Respond immediately (required by Meta)

    const body = req.body;
    if (body?.object !== 'whatsapp_business_account') return;

    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        // Process inbound messages
        if (value?.messages?.length) {
          await processInboundMessage(value);
        }

        // Process status updates (delivered, read, etc.)
        if (value?.statuses?.length) {
          for (const status of value.statuses) {
            await processStatusUpdate(status);
          }
        }
      }
    }
    bustWhatsAppCache();
  } catch (err) {
    console.error('[WhatsApp Webhook] Error:', err.message);
  }
});

// ── GET /api/whatsapp/stats ─────────────────────────────────────────
router.get('/stats', guard, async (req, res, next) => {
  try {
    const key = buildCacheKey(CACHE_NAMESPACES.whatsapp, { view: 'stats' });
    const data = await getOrSetCache(key, WA_TTL, async () => {
      const [convs, msgs, unread] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM whatsapp_conversations'),
        pool.query('SELECT COUNT(*) FROM whatsapp_messages'),
        pool.query('SELECT COUNT(*) FROM whatsapp_conversations WHERE unread_count > 0'),
      ]);
      return {
        totalConversations: parseInt(convs.rows[0].count),
        totalMessages: parseInt(msgs.rows[0].count),
        unreadConversations: parseInt(unread.rows[0].count),
      };
    });
    res.json(data);
  } catch (err) { next(err); }
});

// ── GET /api/whatsapp/conversations ────────────────────────────────
router.get('/conversations', guard, async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const key = buildCacheKey(CACHE_NAMESPACES.whatsapp, { view: 'conv_list', search: search.toLowerCase() });
    const data = await getOrSetCache(key, WA_TTL, async () => {
      let q, params = [];
      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        q = `SELECT wc.*, l.name as lead_name, l.pipeline_stage as lead_stage,
               (SELECT body FROM whatsapp_messages WHERE conversation_id = wc.id ORDER BY sent_at DESC LIMIT 1) as last_message
             FROM whatsapp_conversations wc
             LEFT JOIN leads l ON l.id = wc.lead_id
             WHERE LOWER(wc.contact_name) LIKE $1 OR wc.contact_phone LIKE $1
             ORDER BY wc.last_message_at DESC LIMIT 100`;
      } else {
        q = `SELECT wc.*, l.name as lead_name, l.pipeline_stage as lead_stage,
               (SELECT body FROM whatsapp_messages WHERE conversation_id = wc.id ORDER BY sent_at DESC LIMIT 1) as last_message
             FROM whatsapp_conversations wc
             LEFT JOIN leads l ON l.id = wc.lead_id
             ORDER BY wc.last_message_at DESC LIMIT 100`;
      }
      const { rows } = await pool.query(q, params);
      return { conversations: rows };
    });
    res.json(data);
  } catch (err) { next(err); }
});

// ── GET /api/whatsapp/conversations/:id/messages ───────────────────
router.get('/conversations/:id/messages', guard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM whatsapp_messages WHERE conversation_id = $1 ORDER BY sent_at ASC LIMIT 200`,
      [id]
    );
    // Mark as read
    await pool.query(
      'UPDATE whatsapp_conversations SET unread_count = 0 WHERE id = $1',
      [id]
    );
    bustWhatsAppCache();
    res.json({ messages: rows });
  } catch (err) { next(err); }
});

// ── POST /api/whatsapp/conversations/:id/send ──────────────────────
router.post('/conversations/:id/send', guard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text is required.' });

    const conv = await pool.query('SELECT * FROM whatsapp_conversations WHERE id = $1', [id]);
    if (!conv.rowCount) return res.status(404).json({ message: 'Conversation not found.' });

    const contactWaid = conv.rows[0].contact_waid;
    const result = await sendWhatsAppMessage(contactWaid, text.trim());

    await storeOutboundMessage(id, result.wamid || null, text.trim());
    bustWhatsAppCache();

    if (result.success) {
      res.json({ success: true, wamid: result.wamid });
    } else {
      // Still store the message (shows as pending/failed in UI)
      res.status(207).json({ success: false, error: result.error, stored: true });
    }
  } catch (err) { next(err); }
});

// ── POST /api/whatsapp/conversations/:id/create-lead ──────────────
router.post('/conversations/:id/create-lead', guard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const conv = await pool.query('SELECT * FROM whatsapp_conversations WHERE id = $1', [id]);
    if (!conv.rowCount) return res.status(404).json({ message: 'Conversation not found.' });

    const conversation = conv.rows[0];

    if (conversation.lead_id) {
      return res.json({ message: 'Already linked to a lead.', leadId: conversation.lead_id });
    }

    const { name, company, industry, notes } = req.body;

    const r = await pool.query(
      `INSERT INTO leads (id, name, phone, company, industry, source, pipeline_stage, score, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,'whatsapp','new',20,$6,$7)
       RETURNING *`,
      [
        crypto.randomUUID(),
        name || conversation.contact_name || `WhatsApp ${conversation.contact_phone}`,
        conversation.contact_phone,
        company || null, industry || null,
        notes || 'Lead created from WhatsApp conversation.',
        req.user.id,
      ]
    );

    const lead = r.rows[0];
    await pool.query('UPDATE whatsapp_conversations SET lead_id = $2 WHERE id = $1', [id, lead.id]);
    invalidateCacheNamespaces(CACHE_NAMESPACES.leads, CACHE_NAMESPACES.dashboard, CACHE_NAMESPACES.whatsapp);

    res.status(201).json({ message: 'Lead created.', lead });
  } catch (err) { next(err); }
});

// ── PATCH /api/whatsapp/conversations/:id ─────────────────────────
router.patch('/conversations/:id', guard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, contactName } = req.body;
    const updates = [];
    const values  = [id];

    if (status) { values.push(status); updates.push(`status = $${values.length}`); }
    if (contactName) { values.push(contactName); updates.push(`contact_name = $${values.length}`); }
    if (!updates.length) return res.status(400).json({ message: 'Nothing to update.' });

    updates.push('updated_at = NOW()');
    const { rows } = await pool.query(
      `UPDATE whatsapp_conversations SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ message: 'Conversation not found.' });
    bustWhatsAppCache();
    res.json({ conversation: rows[0] });
  } catch (err) { next(err); }
});

// ── GET /api/whatsapp/automation ───────────────────────────────────
router.get('/automation', guard, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM whatsapp_automation_rules ORDER BY created_at ASC');
    res.json({ rules: rows });
  } catch (err) { next(err); }
});

// ── POST /api/whatsapp/automation ──────────────────────────────────
router.post('/automation', guard, async (req, res, next) => {
  try {
    const { name, triggerType, triggerKeyword, responseTemplate } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Rule name is required.' });
    if (!responseTemplate?.trim()) return res.status(400).json({ message: 'Response template is required.' });
    if (!['all', 'first_message', 'keyword'].includes(triggerType)) {
      return res.status(400).json({ message: 'triggerType must be all, first_message, or keyword.' });
    }
    if (triggerType === 'keyword' && !triggerKeyword?.trim()) {
      return res.status(400).json({ message: 'Keyword required for keyword trigger.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO whatsapp_automation_rules (id, name, trigger_type, trigger_keyword, response_template, is_active)
       VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING *`,
      [crypto.randomUUID(), name.trim(), triggerType, triggerKeyword?.trim() || null, responseTemplate.trim()]
    );
    res.status(201).json({ rule: rows[0] });
  } catch (err) { next(err); }
});

// ── PATCH /api/whatsapp/automation/:id ────────────────────────────
router.patch('/automation/:id', guard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, triggerType, triggerKeyword, responseTemplate, isActive } = req.body;

    const existing = await pool.query('SELECT * FROM whatsapp_automation_rules WHERE id = $1', [id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Rule not found.' });

    const cur = existing.rows[0];
    const { rows } = await pool.query(
      `UPDATE whatsapp_automation_rules SET
         name=$2, trigger_type=$3, trigger_keyword=$4, response_template=$5, is_active=$6, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [
        id,
        name?.trim() || cur.name,
        triggerType || cur.trigger_type,
        triggerKeyword?.trim() ?? cur.trigger_keyword,
        responseTemplate?.trim() || cur.response_template,
        isActive !== undefined ? isActive : cur.is_active,
      ]
    );
    res.json({ rule: rows[0] });
  } catch (err) { next(err); }
});

// ── DELETE /api/whatsapp/automation/:id ───────────────────────────
router.delete('/automation/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM whatsapp_automation_rules WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Rule not found.' });
    res.json({ message: 'Rule deleted.' });
  } catch (err) { next(err); }
});

export default router;
