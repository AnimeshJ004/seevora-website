/* ============================================================
   Seevora — WhatsApp Automation Engine
   Handles inbound message processing, keyword triggers,
   auto-replies, and lead creation from WhatsApp contacts.
============================================================ */
import crypto from 'crypto';
import pool from '../../config/db.js';

/**
 * Send a WhatsApp message via Meta Cloud API.
 * Returns { success, wamid?, error? }
 */
export async function sendWhatsAppMessage(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set — message not sent');
    return { success: false, error: 'WhatsApp API not configured' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error('[WhatsApp] Send failed:', data);
      return { success: false, error: data?.error?.message || 'API error' };
    }
    const wamid = data?.messages?.[0]?.id;
    console.log(`[WhatsApp] Sent to ${to} — wamid: ${wamid}`);
    return { success: true, wamid };
  } catch (err) {
    console.error('[WhatsApp] Network error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get or create a conversation record for a given phone number.
 */
async function upsertConversation(contactWaid, contactPhone, contactName) {
  const existing = await pool.query(
    'SELECT * FROM whatsapp_conversations WHERE contact_waid = $1',
    [contactWaid]
  );
  if (existing.rowCount > 0) {
    // Update name if we got it
    if (contactName && !existing.rows[0].contact_name) {
      await pool.query(
        'UPDATE whatsapp_conversations SET contact_name = $2, last_message_at = NOW() WHERE contact_waid = $1',
        [contactWaid, contactName]
      );
    } else {
      await pool.query(
        'UPDATE whatsapp_conversations SET last_message_at = NOW() WHERE contact_waid = $1',
        [contactWaid]
      );
    }
    return existing.rows[0];
  }

  // Create new conversation
  const r = await pool.query(
    `INSERT INTO whatsapp_conversations
       (id, contact_waid, contact_phone, contact_name, status, unread_count, last_message_at)
     VALUES ($1,$2,$3,$4,'open',1,NOW())
     RETURNING *`,
    [crypto.randomUUID(), contactWaid, contactPhone, contactName || null]
  );
  return r.rows[0];
}

/**
 * Store an inbound message in DB.
 */
async function storeInboundMessage(conversationId, wamid, body, messageType = 'text', mediaUrl = null, timestamp = null) {
  await pool.query(
    `INSERT INTO whatsapp_messages
       (id, conversation_id, wamid, direction, message_type, body, media_url, status, sent_at)
     VALUES ($1,$2,$3,'inbound',$4,$5,$6,'delivered',$7)
     ON CONFLICT (wamid) DO NOTHING`,
    [
      crypto.randomUUID(), conversationId, wamid,
      messageType, body || '', mediaUrl || null,
      timestamp ? new Date(Number(timestamp) * 1000) : new Date(),
    ]
  );

  // Increment unread
  await pool.query(
    `UPDATE whatsapp_conversations SET unread_count = unread_count + 1, last_message_at = NOW() WHERE id = $1`,
    [conversationId]
  );
}

/**
 * Store an outbound message in DB.
 */
export async function storeOutboundMessage(conversationId, wamid, body) {
  await pool.query(
    `INSERT INTO whatsapp_messages
       (id, conversation_id, wamid, direction, message_type, body, status, sent_at)
     VALUES ($1,$2,$3,'outbound','text',$4,'sent',NOW())`,
    [crypto.randomUUID(), conversationId, wamid || null, body]
  );
  await pool.query(
    'UPDATE whatsapp_conversations SET last_message_at = NOW() WHERE id = $1',
    [conversationId]
  );
}

/**
 * Auto-create a CRM lead from a WhatsApp contact (if not already created).
 */
async function ensureLeadForConversation(conversation) {
  if (conversation.lead_id) return; // Already linked

  // Check if a lead with this phone already exists
  const phone = conversation.contact_phone;
  const existing = await pool.query(
    `SELECT id FROM leads WHERE phone = $1 LIMIT 1`,
    [phone]
  );

  let leadId;
  if (existing.rowCount > 0) {
    leadId = existing.rows[0].id;
  } else {
    const name = conversation.contact_name || `WhatsApp ${phone}`;
    const r = await pool.query(
      `INSERT INTO leads (id, name, phone, source, pipeline_stage, score, notes, created_by)
       VALUES ($1,$2,$3,'whatsapp','new',10,'Auto-created from WhatsApp inbound message.',NULL)
       RETURNING id`,
      [crypto.randomUUID(), name, phone]
    );
    leadId = r.rows[0].id;
    console.log(`[WhatsApp] Auto-created lead ${leadId} for ${phone}`);
  }

  // Link conversation to lead
  await pool.query(
    'UPDATE whatsapp_conversations SET lead_id = $2 WHERE id = $1',
    [conversation.id, leadId]
  );
}

/**
 * Check automation rules and fire auto-reply if matched.
 * Returns true if a reply was sent.
 */
async function runAutomation(conversationId, contactWaid, messageBody, isFirstMessage) {
  const { rows: rules } = await pool.query(
    `SELECT * FROM whatsapp_automation_rules WHERE is_active = TRUE ORDER BY created_at ASC`
  );

  for (const rule of rules) {
    let matched = false;

    if (rule.trigger_type === 'all') {
      matched = true;
    } else if (rule.trigger_type === 'first_message' && isFirstMessage) {
      matched = true;
    } else if (rule.trigger_type === 'keyword' && rule.trigger_keyword) {
      const keyword = rule.trigger_keyword.toLowerCase().trim();
      const body    = (messageBody || '').toLowerCase().trim();
      matched = body.includes(keyword) || body === keyword;
    }

    if (!matched) continue;

    // Send auto-reply
    const replyText = rule.response_template;
    const result = await sendWhatsAppMessage(contactWaid, replyText);

    // Store the outbound message
    await storeOutboundMessage(conversationId, result.wamid || null, replyText);

    if (result.success) {
      console.log(`[WhatsApp Automation] Rule "${rule.name}" fired for ${contactWaid}`);
      // Only fire one rule per message (first match wins)
      return true;
    }
  }

  return false;
}

/**
 * Main entry point: process an inbound WhatsApp webhook message object.
 */
export async function processInboundMessage(value) {
  try {
    const contact = value?.contacts?.[0];
    const message = value?.messages?.[0];

    if (!message || !contact) return;

    const contactWaid  = contact.wa_id;          // e.g. "919876543210"
    const contactPhone = `+${contact.wa_id}`;    // "+919876543210"
    const contactName  = contact?.profile?.name || null;
    const wamid        = message.id;
    const timestamp    = message.timestamp;
    const messageType  = message.type || 'text';

    let body     = '';
    let mediaUrl = null;

    if (messageType === 'text') {
      body = message?.text?.body || '';
    } else if (messageType === 'image') {
      body = message?.image?.caption || '[Image]';
      mediaUrl = message?.image?.id || null;
    } else if (messageType === 'document') {
      body = message?.document?.filename || '[Document]';
      mediaUrl = message?.document?.id || null;
    } else if (messageType === 'audio') {
      body = '[Voice message]';
    } else if (messageType === 'video') {
      body = message?.video?.caption || '[Video]';
    } else if (messageType === 'location') {
      const loc = message?.location;
      body = `[Location: ${loc?.name || ''} ${loc?.address || ''}]`.trim();
    } else {
      body = `[${messageType}]`;
    }

    // Upsert conversation
    const conversation = await upsertConversation(contactWaid, contactPhone, contactName);
    const isFirstMessage = conversation.unread_count === 0; // before increment

    // Store message
    await storeInboundMessage(conversation.id, wamid, body, messageType, mediaUrl, timestamp);

    // Auto-create CRM lead
    await ensureLeadForConversation({ ...conversation, contact_phone: contactPhone });

    // Run automation rules
    await runAutomation(conversation.id, contactWaid, body, isFirstMessage);

  } catch (err) {
    console.error('[WhatsApp] Error processing inbound message:', err.message);
  }
}

/**
 * Process delivery/read status updates from Meta webhooks.
 */
export async function processStatusUpdate(status) {
  try {
    const wamid      = status?.id;
    const newStatus  = status?.status; // sent | delivered | read | failed
    if (!wamid || !newStatus) return;

    await pool.query(
      `UPDATE whatsapp_messages SET status = $2 WHERE wamid = $1`,
      [wamid, newStatus]
    );
  } catch (err) {
    console.error('[WhatsApp] Error updating message status:', err.message);
  }
}
