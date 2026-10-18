import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { 
  RetentionEngine, 
  evaluateRetention, 
  generatePurgePlan,
  ZERO_DAY_POLICY,
  DAYS_7_POLICY,
  DAYS_30_POLICY,
  DAYS_90_POLICY,
  INDEFINITE_POLICY,
  LEGAL_HOLD_POLICY
} from '../../privacy/retention/index.js';
import type { MeetingRetentionMetadata } from '../../privacy/types/index.js';

describe('Retention Policy Engine', () => {
  const baseNow = new Date('2026-10-17T10:00:00.000Z');

  it('should immediately flag zero-day policy meetings for purge once concluded', () => {
    const meeting: MeetingRetentionMetadata = {
      meetingId: 'm-zero-1',
      createdAt: '2026-10-17T09:00:00.000Z',
      endedAt: '2026-10-17T09:45:00.000Z',
      meetingPolicy: ZERO_DAY_POLICY,
      contentSizeBytes: 1048576
    };

    const res = evaluateRetention(meeting, baseNow);
    assert.equal(res.isDueForPurge, true);
    assert.equal(res.effectivePolicy.type, 'zero_day');
    assert.ok(res.purgeDeadline);
  });

  it('should calculate due-for-purge for fixed days policies accurately', () => {
    // Created 10 days ago with a 7-day retention policy -> expired
    const expiredMeeting: MeetingRetentionMetadata = {
      meetingId: 'm-expired-7d',
      createdAt: '2026-10-07T10:00:00.000Z',
      meetingPolicy: DAYS_7_POLICY,
      contentSizeBytes: 500000
    };

    const expRes = evaluateRetention(expiredMeeting, baseNow);
    assert.equal(expRes.isDueForPurge, true);

    // Created 5 days ago with a 30-day retention policy -> kept
    const activeMeeting: MeetingRetentionMetadata = {
      meetingId: 'm-active-30d',
      createdAt: '2026-10-12T10:00:00.000Z',
      meetingPolicy: DAYS_30_POLICY,
      contentSizeBytes: 500000
    };

    const actRes = evaluateRetention(activeMeeting, baseNow);
    assert.equal(actRes.isDueForPurge, false);
    assert.ok(actRes.purgeDeadline);
  });

  it('should enforce policy precedence: Legal Hold > Meeting Policy > Folder Policy > Global Policy', () => {
    const engine = new RetentionEngine({ globalPolicy: DAYS_90_POLICY });

    // 1. Meeting policy overrides global policy
    const m1: MeetingRetentionMetadata = {
      meetingId: 'm-custom',
      createdAt: '2026-10-01T00:00:00.000Z',
      meetingPolicy: DAYS_7_POLICY,
      globalPolicy: DAYS_90_POLICY
    };
    assert.equal(engine.resolveEffectivePolicy(m1).id, DAYS_7_POLICY.id);

    // 2. Folder policy overrides global policy when no meeting policy
    const m2: MeetingRetentionMetadata = {
      meetingId: 'm-folder',
      createdAt: '2026-10-01T00:00:00.000Z',
      folderPolicy: DAYS_30_POLICY,
      globalPolicy: DAYS_90_POLICY
    };
    assert.equal(engine.resolveEffectivePolicy(m2).id, DAYS_30_POLICY.id);

    // 3. Legal Hold overrides meeting policy even if expired
    const m3: MeetingRetentionMetadata = {
      meetingId: 'm-held',
      createdAt: '2026-01-01T00:00:00.000Z',
      meetingPolicy: ZERO_DAY_POLICY,
      hasLegalHold: true,
      legalHoldReason: 'Audit review'
    };
    const resM3 = engine.evaluateMeeting(m3, baseNow);
    assert.equal(resM3.isDueForPurge, false);
    assert.equal(resM3.effectivePolicy.type, 'legal_hold');
    assert.equal(resM3.hasLegalHold, true);
  });

  it('should never flag indefinite retention meetings for purge', () => {
    const meeting: MeetingRetentionMetadata = {
      meetingId: 'm-indefinite',
      createdAt: '2020-01-01T00:00:00.000Z',
      meetingPolicy: INDEFINITE_POLICY
    };

    const res = evaluateRetention(meeting, baseNow);
    assert.equal(res.isDueForPurge, false);
    assert.equal(res.purgeDeadline, null);
  });

  it('should generate a comprehensive batch purge plan', () => {
    const meetings: MeetingRetentionMetadata[] = [
      {
        meetingId: 'm-1',
        title: 'Old Standup',
        createdAt: '2026-09-01T00:00:00.000Z',
        meetingPolicy: DAYS_30_POLICY,
        contentSizeBytes: 2000000
      },
      {
        meetingId: 'm-2',
        title: 'Recent Planning',
        createdAt: '2026-10-15T00:00:00.000Z',
        meetingPolicy: DAYS_30_POLICY,
        contentSizeBytes: 1500000
      },
      {
        meetingId: 'm-3',
        title: 'Litigation Review',
        createdAt: '2026-08-01T00:00:00.000Z',
        meetingPolicy: DAYS_30_POLICY,
        hasLegalHold: true,
        contentSizeBytes: 3000000
      },
      {
        meetingId: 'm-4',
        title: 'Already Purged',
        createdAt: '2026-08-01T00:00:00.000Z',
        meetingPolicy: DAYS_30_POLICY,
        isPurged: true,
        contentSizeBytes: 0
      }
    ];

    const plan = generatePurgePlan(meetings, { asOfDate: baseNow });

    assert.equal(plan.totalEvaluated, 4);
    assert.equal(plan.dueForPurgeCount, 1); // m-1 is due
    assert.equal(plan.legalHoldCount, 1);   // m-3 is on hold
    assert.equal(plan.keptCount, 3);        // m-2, m-3, m-4
    assert.equal(plan.totalBytesToFree, 2000000);
    assert.equal(plan.itemsToPurge.length, 1);
    assert.equal(plan.itemsToPurge[0].meetingId, 'm-1');
  });
});
