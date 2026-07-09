import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { deriveThreadId } from './imapPoller.js';

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
