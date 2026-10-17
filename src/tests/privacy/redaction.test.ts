import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { 
  RedactionEngine, 
  redactText, 
  redactTranscript,
  isValidLuhn
} from '../../privacy/redaction/index.js';
import { TranscriptUtterance } from '../../privacy/types/index.js';

describe('Redaction Engine - PII and Notes Redaction', () => {
  it('should redact email addresses', () => {
    const input = 'Please contact buyer at client.name+invest@gmail.com or admin@brokerage.ph for details.';
    const res = redactText(input);

    assert.ok(!res.redactedText.includes('client.name+invest@gmail.com'));
    assert.ok(!res.redactedText.includes('admin@brokerage.ph'));
    assert.ok(res.redactedText.includes('[REDACTED_EMAIL]'));
    assert.equal(res.summary.email, 2);
    assert.equal(res.totalMatches, 2);
  });

  it('should redact Philippine mobile numbers in various standard formats', () => {
    const input = 'Call me at +63 917 123 4567, or on my other line 0918-987-6543, or 09201112233.';
    const res = redactText(input);

    assert.ok(!res.redactedText.includes('917 123 4567'));
    assert.ok(!res.redactedText.includes('0918-987-6543'));
    assert.ok(!res.redactedText.includes('09201112233'));
    assert.equal(res.summary.phone, 3);
  });

  it('should redact Philippine landlines and international numbers', () => {
    const input = 'Main office is (02) 8123-4567 and US agent is +1 (555) 234-5678.';
    const res = redactText(input);

    assert.ok(!res.redactedText.includes('(02) 8123-4567'));
    assert.ok(!res.redactedText.includes('+1 (555) 234-5678'));
    assert.equal(res.summary.phone, 2);
  });

  it('should validate credit cards using Luhn algorithm', () => {
    // Valid Visa test card (4111 1111 1111 1111 is Luhn-valid)
    assert.equal(isValidLuhn('4111111111111111'), true);
    // Invalid test number (fails Luhn)
    assert.equal(isValidLuhn('4111111111111112'), false);

    const validCard = '4111-1111-1111-1111';
    const fakeSeq = '1234-5678-9012-3456'; // fails Luhn, but might match PCN if gov_id enabled; test with credit_card only
    
    const engine = new RedactionEngine({ categories: ['credit_card'] });
    const res = engine.redact(`Payment card: ${validCard} and random code: ${fakeSeq}`);

    assert.ok(!res.redactedText.includes(validCard));
    assert.ok(res.redactedText.includes('[REDACTED_CARD]'));
    assert.equal(res.summary.credit_card, 1);
  });

  it('should redact Philippine Government IDs', () => {
    const input = `
      Buyer Documents:
      SSS: 34-1234567-8
      TIN: 123-456-789-000
      PhilHealth: 12-345678901-2
      Pag-IBIG: 1234-5678-9012
      Passport: P1234567A
      US SSN: 987-65-4321
    `;

    const res = redactText(input, { categories: ['gov_id'] });

    assert.ok(!res.redactedText.includes('34-1234567-8'));
    assert.ok(!res.redactedText.includes('123-456-789-000'));
    assert.ok(!res.redactedText.includes('12-345678901-2'));
    assert.ok(!res.redactedText.includes('1234-5678-9012'));
    assert.ok(!res.redactedText.includes('P1234567A'));
    assert.ok(!res.redactedText.includes('987-65-4321'));

    assert.ok(res.summary.gov_id >= 6);
  });

  it('should redact addresses based on location keywords', () => {
    const input = 'Meet at Unit 1204, Tower 2, Horizon Condominium, Ayala Avenue, Makati City for the contract signing.';
    const res = redactText(input, { categories: ['address'] });

    assert.ok(!res.redactedText.includes('Ayala Avenue'));
    assert.ok(res.redactedText.includes('[REDACTED_ADDRESS]'));
    assert.equal(res.summary.address, 1);
  });

  it('should redact custom sensitive terms and proprietary keywords', () => {
    const input = 'The confidential project codename is Project Falcon spearheaded by client Acme Holdings.';
    const res = redactText(input, {
      customTerms: ['Project Falcon', 'Acme Holdings']
    });

    assert.ok(!res.redactedText.includes('Project Falcon'));
    assert.ok(!res.redactedText.includes('Acme Holdings'));
    assert.equal(res.summary.custom_term, 2);
  });

  it('should respect whitelist exclusions', () => {
    const input = 'Send inquiries to public support@brokerage.ph or private vip.buyer@domain.com';
    const res = redactText(input, {
      whitelist: ['support@brokerage.ph']
    });

    assert.ok(res.redactedText.includes('support@brokerage.ph'), 'Whitelisted email should not be redacted');
    assert.ok(!res.redactedText.includes('vip.buyer@domain.com'), 'Non-whitelisted email should be redacted');
    assert.equal(res.summary.email, 1);
  });

  it('should support alternative replacement strategies: mask and custom', () => {
    const input = 'Contact me at 0917-555-4321 or email me@test.com.';
    
    // Mask mode
    const maskRes = redactText(input, { replacementStrategy: 'mask' });
    assert.ok(maskRes.redactedText.includes('[REDACTED]'));

    // Custom mode
    const customRes = redactText(input, {
      replacementStrategy: 'custom',
      customReplacer: (cat) => `<HIDDEN:${cat.toUpperCase()}>`
    });
    assert.ok(customRes.redactedText.includes('<HIDDEN:PHONE>'));
    assert.ok(customRes.redactedText.includes('<HIDDEN:EMAIL>'));
  });

  it('should redact structured transcript utterances', () => {
    const utterances: TranscriptUtterance[] = [
      { id: 'u1', speaker: 'Broker Rad', startTimeSeconds: 0, endTimeSeconds: 5, text: 'Welcome! Please verify your email client@investor.ph' },
      { id: 'u2', speaker: 'Client', startTimeSeconds: 6, endTimeSeconds: 12, text: 'Yes, and reach my mobile at 0917-888-9999.' }
    ];

    const { utterances: redactedList, report } = redactTranscript(utterances);

    assert.equal(redactedList.length, 2);
    assert.ok(!redactedList[0].text.includes('client@investor.ph'));
    assert.ok(redactedList[0].text.includes('[REDACTED_EMAIL]'));
    assert.ok(!redactedList[1].text.includes('0917-888-9999'));
    assert.ok(redactedList[1].text.includes('[REDACTED_PHONE]'));
    assert.equal(report.totalMatches, 2);
  });
});
