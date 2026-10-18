import type { MeetingRetentionMetadata, PurgeEvaluationResult, PurgePlan, RetentionPolicy } from '../types/retention.js';
import { 
  DEFAULT_GLOBAL_POLICY, 
  LEGAL_HOLD_POLICY 
} from './policies.js';

export interface RetentionEngineOptions {
  globalPolicy?: RetentionPolicy;
}

export class RetentionEngine {
  private globalPolicy: RetentionPolicy;

  constructor(options: RetentionEngineOptions = {}) {
    this.globalPolicy = options.globalPolicy || DEFAULT_GLOBAL_POLICY;
  }

  /**
   * Resolves the effective retention policy for a meeting based on precedence:
   * 1. Legal Hold (highest priority)
   * 2. Per-Meeting Specific Policy
   * 3. Folder/Channel Level Policy
   * 4. Global Workspace Policy
   */
  public resolveEffectivePolicy(meta: MeetingRetentionMetadata): RetentionPolicy {
    if (meta.hasLegalHold) {
      return LEGAL_HOLD_POLICY;
    }
    if (meta.meetingPolicy) {
      return meta.meetingPolicy;
    }
    if (meta.folderPolicy) {
      return meta.folderPolicy;
    }
    if (meta.globalPolicy) {
      return meta.globalPolicy;
    }
    return this.globalPolicy;
  }

  /**
   * Evaluates whether a meeting is due for purge as of a specified reference timestamp.
   */
  public evaluateMeeting(
    meta: MeetingRetentionMetadata,
    asOf: Date = new Date()
  ): PurgeEvaluationResult {
    const effectivePolicy = this.resolveEffectivePolicy(meta);
    const hasLegalHold = !!meta.hasLegalHold;
    const contentSizeBytes = meta.contentSizeBytes || 0;

    if (meta.isPurged) {
      return {
        meetingId: meta.meetingId,
        title: meta.title,
        isDueForPurge: false,
        purgeDeadline: null,
        effectivePolicy,
        reason: 'Meeting assets have already been purged.',
        hasLegalHold,
        contentSizeBytes: 0
      };
    }

    if (hasLegalHold) {
      return {
        meetingId: meta.meetingId,
        title: meta.title,
        isDueForPurge: false,
        purgeDeadline: null,
        effectivePolicy: LEGAL_HOLD_POLICY,
        reason: meta.legalHoldReason ? `Under legal hold: ${meta.legalHoldReason}` : 'Under active legal hold.',
        hasLegalHold: true,
        contentSizeBytes
      };
    }

    const baseDate = new Date(meta.endedAt || meta.createdAt);
    if (isNaN(baseDate.getTime())) {
      throw new Error(`Invalid timestamp for meeting '${meta.meetingId}': createdAt=${meta.createdAt}`);
    }

    // Zero-Day Ephemeral Policy
    if (effectivePolicy.type === 'zero_day') {
      const deadline = baseDate.toISOString();
      const isDue = asOf.getTime() >= baseDate.getTime();
      return {
        meetingId: meta.meetingId,
        title: meta.title,
        isDueForPurge: isDue,
        purgeDeadline: deadline,
        effectivePolicy,
        reason: isDue ? 'Zero-day policy: meeting concluded, ready for immediate purge.' : 'Zero-day policy pending meeting end.',
        hasLegalHold: false,
        contentSizeBytes
      };
    }

    // Fixed Days Policy
    if (effectivePolicy.type === 'fixed_days') {
      const days = effectivePolicy.days ?? 30;
      const deadlineTime = baseDate.getTime() + days * 24 * 60 * 60 * 1000;
      const deadlineDate = new Date(deadlineTime);
      const isDue = asOf.getTime() >= deadlineTime;

      return {
        meetingId: meta.meetingId,
        title: meta.title,
        isDueForPurge: isDue,
        purgeDeadline: deadlineDate.toISOString(),
        effectivePolicy,
        reason: isDue 
          ? `Retention window (${days} days) expired on ${deadlineDate.toISOString().slice(0, 10)}.`
          : `Within retention window (${days} days). Due on ${deadlineDate.toISOString().slice(0, 10)}.`,
        hasLegalHold: false,
        contentSizeBytes
      };
    }

    // Indefinite Policy
    return {
      meetingId: meta.meetingId,
      title: meta.title,
      isDueForPurge: false,
      purgeDeadline: null,
      effectivePolicy,
      reason: 'Indefinite retention policy applied.',
      hasLegalHold: false,
      contentSizeBytes
    };
  }

  /**
   * Evaluates a library of meetings and constructs a structured purge plan.
   */
  public generatePurgePlan(
    meetings: MeetingRetentionMetadata[],
    options: { asOfDate?: Date } = {}
  ): PurgePlan {
    const asOf = options.asOfDate || new Date();
    const itemsToPurge: PurgeEvaluationResult[] = [];

    let totalEvaluated = 0;
    let dueCount = 0;
    let keptCount = 0;
    let legalHoldCount = 0;
    let totalBytesToFree = 0;

    for (const meeting of meetings) {
      totalEvaluated++;
      const evalResult = this.evaluateMeeting(meeting, asOf);

      if (evalResult.hasLegalHold) {
        legalHoldCount++;
        keptCount++;
      } else if (evalResult.isDueForPurge) {
        dueCount++;
        totalBytesToFree += evalResult.contentSizeBytes;
        itemsToPurge.push(evalResult);
      } else {
        keptCount++;
      }
    }

    return {
      generatedAt: asOf.toISOString(),
      totalEvaluated,
      dueForPurgeCount: dueCount,
      keptCount,
      legalHoldCount,
      totalBytesToFree,
      itemsToPurge
    };
  }
}

// Global convenience instances & functions
const defaultRetentionEngine = new RetentionEngine();

export function evaluateRetention(
  meta: MeetingRetentionMetadata,
  asOf?: Date
): PurgeEvaluationResult {
  return defaultRetentionEngine.evaluateMeeting(meta, asOf);
}

export function generatePurgePlan(
  meetings: MeetingRetentionMetadata[],
  options?: { asOfDate?: Date }
): PurgePlan {
  return defaultRetentionEngine.generatePurgePlan(meetings, options);
}
