import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  createImapConfig,
  deriveThreadId,
  markSequenceNumbersSeen,
  saveInboundEmail,
} from './imapPoller.js';
import {
  MAX_RAW_MESSAGE_BYTES,
  MAX_STORED_BODY_BYTES,
  normalizeEmailAddress,
  prepareInboundMessage,
  prepareMalformedMessage,
} from './inboundSecurity.js';

function parsedMessage(overrides = {}) {
  return {
    from: { value: [{ address: 'Customer@Example.com', name: 'Customer' }] },
    subject: 'Product question',
    text: 'Can you tell me more?',
    messageId: '<Message-1@Example.com>',
    date: new Date('2026-07-13T10:00:00.000Z'),
    headers: new Map(),
    ...overrides,
  };
}

describe('imapPoller — deriveThreadId', () => {
  it('Priority 1: extracts and trims the last element from references array', () => {
    const parsed = {
      references: [' <ref-1@example.com> ', ' <ref-2@example.com> '],
      inReplyTo: '<in-reply-to@example.com>',
      from: { value: [{ address: 'test@example.com' }] },
      subject: 'Hello World',
    };
    const threadId = deriveThreadId(parsed);
    assert.equal(threadId, '<ref-2@example.com>');
  });

  it('Priority 2: uses inReplyTo if references is missing or empty', () => {
    const parsedNoRefs = {
      inReplyTo: ' <in-reply-to@example.com> ',
      from: { value: [{ address: 'test@example.com' }] },
      subject: 'Hello World',
    };
    const threadId1 = deriveThreadId(parsedNoRefs);
    assert.equal(threadId1, '<in-reply-to@example.com>');

    const parsedEmptyRefs = {
      references: [],
      inReplyTo: '<in-reply-to@example.com>',
      from: { value: [{ address: 'test@example.com' }] },
      subject: 'Hello World',
    };
    const threadId2 = deriveThreadId(parsedEmptyRefs);
    assert.equal(threadId2, '<in-reply-to@example.com>');
  });

  it('Priority 3: falls back to sha256(fromEmail + "::" + subject) if references and inReplyTo are missing', () => {
    const parsed = {
      from: { value: [{ address: ' TEST@example.com ' }] },
      subject: ' Hello World ',
    };
    const threadId = deriveThreadId(parsed);
    
    // Expecting sha256 of 'test@example.com::Hello World'
    const expected = crypto.createHash('sha256').update('test@example.com::Hello World').digest('hex');
    assert.equal(threadId, expected);
  });

  it('Priority 3: uses from.text if from.value is missing', () => {
    const parsed = {
      from: { text: ' test@example.com ' },
      subject: 'Hello World',
    };
    const threadId = deriveThreadId(parsed);
    
    const expected = crypto.createHash('sha256').update('test@example.com::Hello World').digest('hex');
    assert.equal(threadId, expected);
  });
});

describe('imapPoller - secure IMAP configuration', () => {
  const secureEnv = {
    IMAP_HOST: 'imap.hostinger.com',
    IMAP_USER: 'info@seevora.in',
    IMAP_PASS: 'test-password',
    IMAP_PORT: '993',
    IMAP_SECURE: 'true',
  };

  it('enforces TLS and validates the Hostinger certificate', () => {
    const config = createImapConfig(secureEnv);

    assert.equal(config.port, 993);
    assert.equal(config.tls, true);
    assert.equal(config.tlsOptions.rejectUnauthorized, true);
    assert.equal(config.tlsOptions.servername, 'imap.hostinger.com');
  });

  it('rejects insecure ports and disabled TLS', () => {
    assert.throws(
      () => createImapConfig({ ...secureEnv, IMAP_PORT: '143' }),
      /TLS on port 993/
    );
    assert.throws(
      () => createImapConfig({ ...secureEnv, IMAP_SECURE: 'false' }),
      /TLS on port 993/
    );
  });

  it('rejects incomplete credentials without exposing their values', () => {
    assert.throws(
      () => createImapConfig({ ...secureEnv, IMAP_PASS: '' }),
      /credentials are not configured/
    );
  });
});

describe('imapPoller - IMAP seen flags', () => {
  it('uses the sequence-number API for fetch message sequence numbers', () => {
    let seqCall;
    let uidApiCalled = false;
    const callback = () => {};
    const imap = {
      addFlags() {
        uidApiCalled = true;
      },
      seq: {
        addFlags(sequenceNumbers, flags, cb) {
          seqCall = { sequenceNumbers, flags, cb };
        },
      },
    };

    markSequenceNumbersSeen(imap, [2, 5], callback);

    assert.equal(uidApiCalled, false);
    assert.deepEqual(seqCall.sequenceNumbers, [2, 5]);
    assert.deepEqual(seqCall.flags, ['\\Seen']);
    assert.equal(seqCall.cb, callback);
  });
});

describe('inboundSecurity - normalization and quarantine', () => {
  const options = {
    rawBytes: 512,
    mailboxAddress: 'info@seevora.in',
    smtpUser: 'info@seevora.in',
    smtpFrom: 'Seevora <info@seevora.in>',
  };

  it('normalizes a valid human message for automatic processing', () => {
    const result = prepareInboundMessage(parsedMessage(), options);

    assert.equal(result.fromEmail, 'customer@example.com');
    assert.equal(result.messageId, '<message-1@example.com>');
    assert.equal(result.status, 'received');
    assert.equal(result.quarantineReason, null);
  });

  it('normalizes configured mailbox address formats', () => {
    assert.equal(normalizeEmailAddress('Seevora <INFO@SEEVORA.IN>'), 'info@seevora.in');
    assert.equal(normalizeEmailAddress('not-an-email'), '');
  });

  it('quarantines own-address loops and automated sender addresses', () => {
    const ownMessage = prepareInboundMessage(parsedMessage({
      from: { value: [{ address: 'INFO@SEEVORA.IN' }] },
    }), options);
    const noReplyMessage = prepareInboundMessage(parsedMessage({
      from: { value: [{ address: 'no-reply@example.com' }] },
    }), options);

    assert.equal(ownMessage.quarantineReason, 'mail_loop');
    assert.equal(noReplyMessage.quarantineReason, 'automated_sender');
  });

  it('quarantines automated and bulk message headers', () => {
    const automated = prepareInboundMessage(parsedMessage({
      headers: new Map([['auto-submitted', 'auto-replied']]),
    }), options);
    const bulk = prepareInboundMessage(parsedMessage({
      headers: new Map([['precedence', 'bulk']]),
    }), options);
    const mailingList = prepareInboundMessage(parsedMessage({
      headers: new Map([['list-id', 'updates.example.com']]),
    }), options);

    assert.equal(automated.quarantineReason, 'automated_message');
    assert.equal(bulk.quarantineReason, 'bulk_message');
    assert.equal(mailingList.quarantineReason, 'bulk_message');
  });

  it('quarantines invalid senders, empty bodies, and oversized raw messages', () => {
    const invalidSender = prepareInboundMessage(parsedMessage({
      from: { value: [{ address: 'invalid' }] },
    }), options);
    const emptyBody = prepareInboundMessage(parsedMessage({ text: '   ' }), options);
    const oversized = prepareInboundMessage(parsedMessage(), {
      ...options,
      rawBytes: MAX_RAW_MESSAGE_BYTES + 1,
    });

    assert.equal(invalidSender.quarantineReason, 'invalid_sender');
    assert.equal(emptyBody.quarantineReason, 'empty_body');
    assert.equal(oversized.quarantineReason, 'message_too_large');
  });

  it('limits stored content and creates a deterministic identity without Message-ID', () => {
    const message = parsedMessage({
      subject: 's'.repeat(700),
      text: 'a'.repeat(MAX_STORED_BODY_BYTES + 100),
      messageId: '',
    });
    const first = prepareInboundMessage(message, options);
    const second = prepareInboundMessage(message, options);

    assert.equal(first.subject.length, 500);
    assert.ok(Buffer.byteLength(first.body, 'utf8') <= MAX_STORED_BODY_BYTES);
    assert.match(first.messageId, /^fingerprint:[a-f0-9]{64}$/);
    assert.equal(first.messageId, second.messageId);
  });

  it('creates a safe quarantined record when parsing fails', () => {
    const malformed = prepareMalformedMessage(Buffer.from('broken mail'), 11, 'info@seevora.in');

    assert.equal(malformed.status, 'quarantined');
    assert.equal(malformed.quarantineReason, 'mail_parse_failed');
    assert.equal(malformed.fromEmail, 'unknown@invalid.local');
    assert.doesNotMatch(malformed.body, /broken mail/);
  });

  it('retains the oversized reason when a truncated message cannot be parsed', () => {
    const malformed = prepareMalformedMessage(
      Buffer.from('truncated mail'),
      MAX_RAW_MESSAGE_BYTES + 1,
      'info@seevora.in'
    );

    assert.equal(malformed.quarantineReason, 'message_too_large');
  });
});

describe('imapPoller - duplicate-safe persistence', () => {
  const inbound = {
    fromEmail: 'customer@example.com',
    fromName: 'Customer',
    toEmail: 'info@seevora.in',
    subject: 'Question',
    body: 'Hello',
    source: 'imap',
    threadId: 'thread-1',
    messageId: '<message-1@example.com>',
    inReplyTo: '',
    status: 'received',
    quarantineReason: null,
  };

  it('returns saved only when the database inserted a new row', async () => {
    let capturedQuery = '';
    const result = await saveInboundEmail(inbound, async (query) => {
      capturedQuery = query;
      return { rows: [{ id: 'saved-id' }] };
    });

    assert.deepEqual(result, { status: 'saved', id: 'saved-id' });
    assert.match(capturedQuery, /ON CONFLICT DO NOTHING/);
    assert.match(capturedQuery, /quarantine_reason/);
    assert.match(capturedQuery, /CASE WHEN \$11::VARCHAR\(40\) = 'quarantined' THEN NOW\(\)/);
  });

  it('classifies a unique-index conflict as a duplicate', async () => {
    const result = await saveInboundEmail(inbound, async () => ({ rows: [] }));
    assert.deepEqual(result, { status: 'duplicate' });
  });
});
