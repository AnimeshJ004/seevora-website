import crypto from 'node:crypto';

export const MAX_RAW_MESSAGE_BYTES = 1024 * 1024;
export const MAX_STORED_BODY_BYTES = 64 * 1024;
export const MAX_SUBJECT_CHARACTERS = 500;

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const AUTOMATED_LOCAL_PART = /^(?:no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer[-_.]?daemon|postmaster)(?:[+._-].*)?$/i;

function stripNullBytes(value) {
  return String(value ?? '').split('\0').join('');
}

export function truncateUtf8(value, maxBytes) {
  const buffer = Buffer.from(stripNullBytes(value), 'utf8');
  if (buffer.length <= maxBytes) return buffer.toString('utf8');
  return buffer.subarray(0, maxBytes).toString('utf8').replace(/\uFFFD$/, '');
}

export function normalizeEmailAddress(value) {
  const raw = stripNullBytes(value).trim();
  const angleAddress = raw.match(/<([^<>]+)>/);
  const candidate = (angleAddress?.[1] || raw).trim().toLowerCase();

  if (!candidate || candidate.length > 255 || !EMAIL_PATTERN.test(candidate)) return '';
  return candidate;
}

export function normalizeMessageId(value) {
  const normalized = stripNullBytes(value).replace(/[\r\n]/g, '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.length <= 500) return normalized;
  return `message-id-sha256:${crypto.createHash('sha256').update(normalized).digest('hex')}`;
}

function normalizeThreadIdentifier(value) {
  const normalized = normalizeMessageId(value);
  if (normalized.length <= 255) return normalized;
  return `thread-sha256:${crypto.createHash('sha256').update(normalized).digest('hex')}`;
}

function headerValue(parsed, name) {
  const value = parsed?.headers?.get?.(name);
  if (Array.isArray(value)) return value.join(', ');
  return stripNullBytes(value).trim().toLowerCase();
}

function firstReference(parsed) {
  if (Array.isArray(parsed?.references) && parsed.references.length > 0) {
    return parsed.references[parsed.references.length - 1];
  }
  if (typeof parsed?.references === 'string') return parsed.references;
  return '';
}

export function deriveThreadId(parsed) {
  const reference = normalizeThreadIdentifier(firstReference(parsed));
  if (reference) return reference;

  const inReplyTo = normalizeThreadIdentifier(parsed?.inReplyTo);
  if (inReplyTo) return inReplyTo;

  const fromEmail = normalizeEmailAddress(
    parsed?.from?.value?.[0]?.address || parsed?.from?.text || ''
  );
  const subject = stripNullBytes(parsed?.subject).trim();
  return crypto.createHash('sha256').update(`${fromEmail}::${subject}`).digest('hex');
}

function fingerprintMessage({ fromEmail, toEmail, subject, body, date }) {
  const input = [fromEmail, toEmail, subject, body, date || ''].join('\n::\n');
  return `fingerprint:${crypto.createHash('sha256').update(input).digest('hex')}`;
}

function configuredOwnAddresses({ mailboxAddress, smtpUser, smtpFrom }) {
  return new Set(
    [mailboxAddress, smtpUser, smtpFrom]
      .map(normalizeEmailAddress)
      .filter(Boolean)
  );
}

export function classifyInboundMessage(parsed, message, options = {}) {
  if (options.rawBytes > MAX_RAW_MESSAGE_BYTES) return 'message_too_large';
  if (!message.fromEmail) return 'invalid_sender';
  if (!message.body.trim()) return 'empty_body';

  const ownAddresses = configuredOwnAddresses(options);
  if (ownAddresses.has(message.fromEmail)) return 'mail_loop';

  const localPart = message.fromEmail.split('@')[0];
  if (AUTOMATED_LOCAL_PART.test(localPart)) return 'automated_sender';

  const autoSubmitted = headerValue(parsed, 'auto-submitted');
  if (autoSubmitted && autoSubmitted !== 'no') return 'automated_message';

  const precedence = headerValue(parsed, 'precedence');
  if (/\b(?:bulk|list|junk)\b/.test(precedence)) return 'bulk_message';
  if (parsed?.headers?.has?.('list-id')) return 'bulk_message';

  const autoResponseSuppress = headerValue(parsed, 'x-auto-response-suppress');
  if (autoResponseSuppress && autoResponseSuppress !== 'none') return 'automated_message';

  return null;
}

export function prepareInboundMessage(parsed, options = {}) {
  const fromEmail = normalizeEmailAddress(
    parsed?.from?.value?.[0]?.address || parsed?.from?.text || ''
  );
  const fromName = truncateUtf8(parsed?.from?.value?.[0]?.name || '', 200).trim();
  const toEmail = normalizeEmailAddress(options.mailboxAddress) || 'unknown@invalid.local';
  const subject = stripNullBytes(parsed?.subject).trim().slice(0, MAX_SUBJECT_CHARACTERS);
  const body = truncateUtf8(parsed?.text || '', MAX_STORED_BODY_BYTES).trim();
  const date = parsed?.date instanceof Date && !Number.isNaN(parsed.date.valueOf())
    ? parsed.date.toISOString()
    : '';

  const normalized = { fromEmail, fromName, toEmail, subject, body };
  const messageId = normalizeMessageId(parsed?.messageId) || fingerprintMessage({
    ...normalized,
    date,
  });
  const quarantineReason = classifyInboundMessage(parsed, normalized, options);

  return {
    ...normalized,
    source: 'imap',
    threadId: deriveThreadId(parsed),
    messageId,
    inReplyTo: normalizeMessageId(parsed?.inReplyTo),
    status: quarantineReason ? 'quarantined' : 'received',
    quarantineReason,
  };
}

export function prepareMalformedMessage(rawMessage, rawBytes, mailboxAddress) {
  const content = Buffer.isBuffer(rawMessage) ? rawMessage : Buffer.from(rawMessage || '');
  const fingerprintInput = Buffer.concat([
    content,
    Buffer.from(`:${rawBytes}`, 'utf8'),
  ]);
  const digest = crypto.createHash('sha256').update(fingerprintInput).digest('hex');

  return {
    fromEmail: 'unknown@invalid.local',
    fromName: '',
    toEmail: normalizeEmailAddress(mailboxAddress) || 'unknown@invalid.local',
    subject: 'Unparseable inbound email',
    body: 'This message could not be parsed safely. No automatic response was sent.',
    source: 'imap',
    threadId: `malformed:${digest}`,
    messageId: `fingerprint:${digest}`,
    inReplyTo: '',
    status: 'quarantined',
    quarantineReason: rawBytes > MAX_RAW_MESSAGE_BYTES
      ? 'message_too_large'
      : 'mail_parse_failed',
  };
}

export function hashMessageIdentity(messageId) {
  return crypto.createHash('sha256').update(String(messageId || '')).digest('hex').slice(0, 16);
}
