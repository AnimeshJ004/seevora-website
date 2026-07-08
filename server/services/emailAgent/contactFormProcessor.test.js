import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveContactFormThreadId } from './contactFormProcessor.js';

describe('contactFormProcessor — deriveContactFormThreadId', () => {
  it('determinism: same inputs always return the same output', () => {
    const email = 'info@seevora.in';
    const subject = 'Interested in AI Voice Receptionist';
    
    const out1 = deriveContactFormThreadId(email, subject);
    const out2 = deriveContactFormThreadId(email, subject);
    
    assert.equal(out1, out2);
  });

  it('normalised subject: handles surrounding and internal whitespace normalization', () => {
    const email = 'info@seevora.in';
    
    const out1 = deriveContactFormThreadId(email, '  Interested   in   AI   Voice   Receptionist  ');
    const out2 = deriveContactFormThreadId(email, 'Interested in AI Voice Receptionist');
    
    assert.equal(out1, out2);
  });

  it('case-insensitivity: normalises both email and subject to lowercase', () => {
    const out1 = deriveContactFormThreadId('INFO@SEEVORA.IN', 'INTERESTED');
    const out2 = deriveContactFormThreadId('info@seevora.in', 'interested');
    
    assert.equal(out1, out2);
  });
});
