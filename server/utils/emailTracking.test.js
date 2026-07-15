import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  allowedEmailTrackingOrigins,
  buildEmailTrackingUrl,
  getSafeEmailTrackingTargetUrl,
  wrapTrackableEmailLinks,
} from './emailTracking.js';

describe('email click tracking URL validation', () => {
  it('allows Seevora production URLs by default', () => {
    assert.equal(
      getSafeEmailTrackingTargetUrl('https://seevora.in/book-a-call?source=email'),
      'https://seevora.in/book-a-call?source=email'
    );
    assert.equal(
      getSafeEmailTrackingTargetUrl('https://www.seevora.in/services#voice'),
      'https://www.seevora.in/services#voice'
    );
  });

  it('allows explicitly configured extra origins', () => {
    const env = { EMAIL_TRACKING_ALLOWED_ORIGINS: 'https://calendar.example,partner.example' };
    assert.deepEqual(
      Array.from(allowedEmailTrackingOrigins(env)).sort(),
      [
        'https://calendar.example',
        'https://partner.example',
        'https://seevora.in',
        'https://www.seevora.in',
      ]
    );
    assert.equal(
      getSafeEmailTrackingTargetUrl('https://calendar.example/meet', env),
      'https://calendar.example/meet'
    );
  });

  it('rejects unsafe, malformed, and unapproved targets', () => {
    for (const value of [
      '',
      'not a url',
      '//evil.example/path',
      'javascript:alert(1)',
      'data:text/html,hello',
      'mailto:info@seevora.in',
      'tel:+918269297967',
      'https://evil.example/phish',
      ['https://seevora.in'],
    ]) {
      assert.equal(getSafeEmailTrackingTargetUrl(value), '', String(value));
    }
  });
});

describe('email click tracking link wrapping', () => {
  it('wraps only approved http and https links', () => {
    const body = [
      '<a href="https://seevora.in/book-a-call">Book</a>',
      '<a href="mailto:info@seevora.in">Mail</a>',
      '<a href="https://evil.example/login">Bad</a>',
      '[Services](https://www.seevora.in/services)',
      '[Phone](tel:+918269297967)',
    ].join('\n');

    const wrapped = wrapTrackableEmailLinks(body, {
      logId: '11111111-1111-4111-8111-111111111111',
      apiBaseUrl: 'https://api.seevora.in/',
    });

    assert.match(wrapped, /https:\/\/api\.seevora\.in\/api\/email-bot\/track\/click\/11111111-1111-4111-8111-111111111111\?url=https%3A%2F%2Fseevora\.in%2Fbook-a-call/);
    assert.match(wrapped, /https:\/\/api\.seevora\.in\/api\/email-bot\/track\/click\/11111111-1111-4111-8111-111111111111\?url=https%3A%2F%2Fwww\.seevora\.in%2Fservices/);
    assert.match(wrapped, /href="mailto:info@seevora\.in"/);
    assert.match(wrapped, /href="https:\/\/evil\.example\/login"/);
    assert.match(wrapped, /\[Phone\]\(tel:\+918269297967\)/);
  });

  it('builds no tracking URL for rejected targets', () => {
    assert.equal(
      buildEmailTrackingUrl({
        logId: '11111111-1111-4111-8111-111111111111',
        targetUrl: 'https://evil.example',
        apiBaseUrl: 'https://api.seevora.in',
      }),
      ''
    );
  });
});
