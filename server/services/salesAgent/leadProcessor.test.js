/**
 * Unit tests for leadProcessor service
 * Tests: validateLeadData — required fields, email regex, length limits, optional phone
 *
 * Requirements: 5.1
 *
 * NOTE: validateLeadData is a pure function — no DB connection required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateLeadData } from './leadProcessor.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Return a fully-valid lead payload so individual tests can override one field. */
function validLead(overrides = {}) {
  return {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98765 43210',
    serviceInterest: 'AI Voice Receptionist',
    ...overrides,
  };
}

// ─── Basic pass ───────────────────────────────────────────────────────────────

describe('validateLeadData — valid inputs', () => {
  it('returns valid:true with no errors for a complete, correct payload', () => {
    const { valid, errors } = validateLeadData(validLead());
    assert.equal(valid, true);
    assert.deepEqual(errors, {});
  });

  it('returns valid:true when phone is omitted (optional field)', () => {
    const { valid, errors } = validateLeadData(validLead({ phone: undefined }));
    assert.equal(valid, true);
    assert.deepEqual(errors, {});
  });

  it('returns valid:true when phone is null', () => {
    const { valid, errors } = validateLeadData(validLead({ phone: null }));
    assert.equal(valid, true);
    assert.deepEqual(errors, {});
  });

  it('returns valid:true when phone is an empty string (not present)', () => {
    // empty string — no trim() length > 0, so the >40 check is skipped
    const { valid, errors } = validateLeadData(validLead({ phone: '' }));
    assert.equal(valid, true);
    assert.deepEqual(errors, {});
  });
});

// ─── name validation ──────────────────────────────────────────────────────────

describe('validateLeadData — name field', () => {
  it('returns error when name is missing', () => {
    const { valid, errors } = validateLeadData(validLead({ name: undefined }));
    assert.equal(valid, false);
    assert.ok(errors.name, 'Expected a name error');
  });

  it('returns error when name is null', () => {
    const { valid, errors } = validateLeadData(validLead({ name: null }));
    assert.equal(valid, false);
    assert.ok(errors.name);
  });

  it('returns error when name is an empty string', () => {
    const { valid, errors } = validateLeadData(validLead({ name: '' }));
    assert.equal(valid, false);
    assert.ok(errors.name);
  });

  it('returns error when name is whitespace only', () => {
    const { valid, errors } = validateLeadData(validLead({ name: '   ' }));
    assert.equal(valid, false);
    assert.ok(errors.name);
  });

  it('accepts a name of exactly 200 characters', () => {
    const { valid } = validateLeadData(validLead({ name: 'A'.repeat(200) }));
    assert.equal(valid, true);
  });

  it('returns error when name exceeds 200 characters', () => {
    const { valid, errors } = validateLeadData(validLead({ name: 'A'.repeat(201) }));
    assert.equal(valid, false);
    assert.ok(errors.name);
  });

  it('trims whitespace before checking length (201 chars of padding should still fail)', () => {
    // 200 real chars + 1 space padding — trim makes it 200, should pass
    const { valid } = validateLeadData(validLead({ name: 'A'.repeat(200) + ' ' }));
    assert.equal(valid, true);
  });
});

// ─── email validation ─────────────────────────────────────────────────────────

describe('validateLeadData — email field', () => {
  it('returns error when email is missing', () => {
    const { valid, errors } = validateLeadData(validLead({ email: undefined }));
    assert.equal(valid, false);
    assert.ok(errors.email);
  });

  it('returns error when email is null', () => {
    const { valid, errors } = validateLeadData(validLead({ email: null }));
    assert.equal(valid, false);
    assert.ok(errors.email);
  });

  it('returns error when email is an empty string', () => {
    const { valid, errors } = validateLeadData(validLead({ email: '' }));
    assert.equal(valid, false);
    assert.ok(errors.email);
  });

  it('accepts a standard email address', () => {
    const { valid } = validateLeadData(validLead({ email: 'user@domain.com' }));
    assert.equal(valid, true);
  });

  it('accepts email with sub-domain', () => {
    const { valid } = validateLeadData(validLead({ email: 'user@mail.domain.co.in' }));
    assert.equal(valid, true);
  });

  it('rejects email with no @ sign', () => {
    const { valid, errors } = validateLeadData(validLead({ email: 'userATdomain.com' }));
    assert.equal(valid, false);
    assert.ok(errors.email);
  });

  it('rejects email with no domain part', () => {
    const { valid, errors } = validateLeadData(validLead({ email: 'user@' }));
    assert.equal(valid, false);
    assert.ok(errors.email);
  });

  it('rejects email with no local part', () => {
    const { valid, errors } = validateLeadData(validLead({ email: '@domain.com' }));
    assert.equal(valid, false);
    assert.ok(errors.email);
  });

  it('rejects email with spaces', () => {
    const { valid, errors } = validateLeadData(validLead({ email: 'user @domain.com' }));
    assert.equal(valid, false);
    assert.ok(errors.email);
  });

  it('accepts email with leading/trailing whitespace (trimmed internally)', () => {
    const { valid } = validateLeadData(validLead({ email: '  user@domain.com  ' }));
    assert.equal(valid, true);
  });
});

// ─── phone validation ─────────────────────────────────────────────────────────

describe('validateLeadData — phone field (optional)', () => {
  it('returns no phone error when phone is a valid short number', () => {
    const { valid, errors } = validateLeadData(validLead({ phone: '+91 98765 43210' }));
    assert.equal(valid, true);
    assert.equal(errors.phone, undefined);
  });

  it('accepts phone of exactly 40 characters', () => {
    const { valid, errors } = validateLeadData(validLead({ phone: '1'.repeat(40) }));
    assert.equal(valid, true);
    assert.equal(errors.phone, undefined);
  });

  it('returns error when phone exceeds 40 characters', () => {
    const { valid, errors } = validateLeadData(validLead({ phone: '1'.repeat(41) }));
    assert.equal(valid, false);
    assert.ok(errors.phone);
  });
});

// ─── serviceInterest validation ───────────────────────────────────────────────

describe('validateLeadData — serviceInterest field', () => {
  it('returns error when serviceInterest is missing', () => {
    const { valid, errors } = validateLeadData(validLead({ serviceInterest: undefined }));
    assert.equal(valid, false);
    assert.ok(errors.serviceInterest);
  });

  it('returns error when serviceInterest is null', () => {
    const { valid, errors } = validateLeadData(validLead({ serviceInterest: null }));
    assert.equal(valid, false);
    assert.ok(errors.serviceInterest);
  });

  it('returns error when serviceInterest is empty string', () => {
    const { valid, errors } = validateLeadData(validLead({ serviceInterest: '' }));
    assert.equal(valid, false);
    assert.ok(errors.serviceInterest);
  });

  it('returns error when serviceInterest is whitespace only', () => {
    const { valid, errors } = validateLeadData(validLead({ serviceInterest: '   ' }));
    assert.equal(valid, false);
    assert.ok(errors.serviceInterest);
  });

  it('accepts serviceInterest of exactly 200 characters', () => {
    const { valid } = validateLeadData(validLead({ serviceInterest: 'S'.repeat(200) }));
    assert.equal(valid, true);
  });

  it('returns error when serviceInterest exceeds 200 characters', () => {
    const { valid, errors } = validateLeadData(validLead({ serviceInterest: 'S'.repeat(201) }));
    assert.equal(valid, false);
    assert.ok(errors.serviceInterest);
  });
});

// ─── multiple field errors ────────────────────────────────────────────────────

describe('validateLeadData — multiple simultaneous errors', () => {
  it('reports errors for all invalid fields at once', () => {
    const { valid, errors } = validateLeadData({
      name: '',
      email: 'not-an-email',
      phone: '1'.repeat(41),
      serviceInterest: '',
    });
    assert.equal(valid, false);
    assert.ok(errors.name);
    assert.ok(errors.email);
    assert.ok(errors.phone);
    assert.ok(errors.serviceInterest);
  });

  it('returns valid:true only when every field passes', () => {
    const { valid, errors } = validateLeadData(validLead());
    assert.equal(valid, true);
    assert.equal(Object.keys(errors).length, 0);
  });
});
