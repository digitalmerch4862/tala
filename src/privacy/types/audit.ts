export type AuditAction = 
  | 'meeting.created'
  | 'meeting.updated'
  | 'meeting.deleted'
  | 'transcript.recorded'
  | 'transcript.redacted'
  | 'segment.otr_marked'
  | 'policy.applied'
  | 'legal_hold.enabled'
  | 'legal_hold.disabled'
  | 'item.purged'
  | 'audit.exported'
  | (string & {});

export interface AuditActor {
  id: string;
  name?: string;
  role?: string;
  ipAddress?: string;
}

export interface AuditEntry {
  sequenceNumber: number;
  timestamp: string;
  action: AuditAction;
  actor: AuditActor;
  resourceId: string;
  details: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  totalEntries: number;
  brokenSequence?: number;
  error?: string;
}

export interface AuditQueryFilter {
  resourceId?: string;
  actorId?: string;
  action?: AuditAction;
  fromTimestamp?: string;
  toTimestamp?: string;
}
