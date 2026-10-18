import { describe, it, expect } from 'vitest';
import { AuditLog } from '../../privacy/audit/index.js';
import { GENESIS_PREVIOUS_HASH } from '../../privacy/audit/crypto.js';
import type { AuditActor, AuditEntry } from '../../privacy/types/index.js';

describe('Audit Log with Cryptographic Hash Chain', () => {
  const testActor: AuditActor = {
    id: 'user-rad',
    name: 'Boss Rad',
    role: 'Admin'
  };

  it('should create chained entries with genesis hash on first entry', () => {
    const log = new AuditLog();

    const e1 = log.append('meeting.created', testActor, 'meeting-123', { title: 'First Meeting' });
    expect(e1.sequenceNumber).toBe(1);
    expect(e1.previousHash).toBe(GENESIS_PREVIOUS_HASH);
    expect(e1.hash.length).toBe(64);

    const e2 = log.append('transcript.recorded', testActor, 'meeting-123', { durationSeconds: 300 });
    expect(e2.sequenceNumber).toBe(2);
    expect(e2.previousHash).toBe(e1.hash);
    expect(e2.hash.length).toBe(64);

    const e3 = log.append('transcript.redacted', testActor, 'meeting-123', { redactedItems: 5 });
    expect(e3.sequenceNumber).toBe(3);
    expect(e3.previousHash).toBe(e2.hash);
  });

  it('should verify a valid audit chain successfully', () => {
    const log = new AuditLog();
    log.append('meeting.created', testActor, 'm-1');
    log.append('policy.applied', testActor, 'm-1', { policyId: 'policy-30d' });
    log.append('legal_hold.enabled', testActor, 'm-1', { reason: 'Pending audit' });

    const verification = log.verify();
    expect(verification.valid).toBe(true);
    expect(verification.totalEntries).toBe(3);
    expect(verification.brokenSequence).toBeUndefined();
  });

  it('should detect altered payload details in any entry', () => {
    const log = new AuditLog();
    log.append('meeting.created', testActor, 'm-1', { sensitive: 'original' });
    log.append('transcript.redacted', testActor, 'm-1', { count: 3 });

    const rawEntries: AuditEntry[] = log.getEntries();
    // Tamper with details of entry 1
    rawEntries[0].details.sensitive = 'tampered-data';

    const verification = AuditLog.verifyEntries(rawEntries);
    expect(verification.valid).toBe(false);
    expect(verification.brokenSequence).toBe(1);
    expect(verification.error?.includes('Tampered content detected')).toBe(true);
  });

  it('should detect altered timestamps', () => {
    const log = new AuditLog();
    log.append('meeting.created', testActor, 'm-1', {}, '2026-10-17T09:00:00.000Z');
    log.append('item.purged', testActor, 'm-1', {}, '2026-10-17T09:30:00.000Z');

    const rawEntries: AuditEntry[] = log.getEntries();
    // Alter timestamp of entry 2
    rawEntries[1].timestamp = '2026-10-17T09:31:00.000Z';

    const verification = AuditLog.verifyEntries(rawEntries);
    expect(verification.valid).toBe(false);
    expect(verification.brokenSequence).toBe(2);
  });

  it('should detect deletion or skipped sequence numbers', () => {
    const log = new AuditLog();
    log.append('action.1', testActor, 'res-1');
    log.append('action.2', testActor, 'res-1');
    log.append('action.3', testActor, 'res-1');

    const rawEntries: AuditEntry[] = log.getEntries();
    // Delete entry 2
    rawEntries.splice(1, 1);

    const verification = AuditLog.verifyEntries(rawEntries);
    expect(verification.valid).toBe(false);
    expect(verification.error?.includes('Broken sequence')).toBe(true);
  });

  it('should query and filter audit log entries', () => {
    const log = new AuditLog();
    log.append('meeting.created', { id: 'user-1' }, 'm-100');
    log.append('meeting.created', { id: 'user-2' }, 'm-200');
    log.append('transcript.redacted', { id: 'user-1' }, 'm-100');

    const user1Entries = log.query({ actorId: 'user-1' });
    expect(user1Entries.length).toBe(2);

    const m200Entries = log.query({ resourceId: 'm-200' });
    expect(m200Entries.length).toBe(1);
    expect(m200Entries[0].actor.id).toBe('user-2');

    const redactedEntries = log.query({ action: 'transcript.redacted' });
    expect(redactedEntries.length).toBe(1);
  });

  it('should export and rehydrate cleanly from JSON string', () => {
    const log = new AuditLog();
    log.append('meeting.created', testActor, 'm-json', { note: 'test' });
    log.append('meeting.updated', testActor, 'm-json', { note: 'updated' });

    const json = log.exportJSON();
    const rehydrated = AuditLog.fromJSON(json);

    expect(rehydrated.verify().valid).toBe(true);
    expect(rehydrated.getEntries().length).toBe(2);
    expect(rehydrated.getEntries()[0].hash).toBe(log.getEntries()[0].hash);
  });
});
