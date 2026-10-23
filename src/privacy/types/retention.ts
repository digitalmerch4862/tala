export type RetentionPolicyType = 
  | 'zero_day'    // Purge immediately upon meeting conclusion / processing
  | 'fixed_days'  // Retain for N days
  | 'indefinite'  // Retain indefinitely unless manually purged
  | 'legal_hold'; // Frozen from purge indefinitely for legal compliance

export interface RetentionPolicy {
  id: string;
  name: string;
  type: RetentionPolicyType;
  /** Number of days to retain if type is 'fixed_days' */
  days?: number;
  description?: string;
}

export interface MeetingRetentionMetadata {
  meetingId: string;
  title?: string;
  createdAt: string;
  endedAt?: string;
  meetingPolicy?: RetentionPolicy;
  folderPolicy?: RetentionPolicy;
  globalPolicy?: RetentionPolicy;
  hasLegalHold?: boolean;
  legalHoldReason?: string;
  isPurged?: boolean;
  purgedAt?: string;
  contentSizeBytes?: number;
}

export interface PurgeEvaluationResult {
  meetingId: string;
  title?: string;
  isDueForPurge: boolean;
  purgeDeadline: string | null;
  effectivePolicy: RetentionPolicy;
  reason: string;
  hasLegalHold: boolean;
  contentSizeBytes: number;
}

export interface PurgePlan {
  generatedAt: string;
  totalEvaluated: number;
  dueForPurgeCount: number;
  keptCount: number;
  legalHoldCount: number;
  totalBytesToFree: number;
  itemsToPurge: PurgeEvaluationResult[];
}
