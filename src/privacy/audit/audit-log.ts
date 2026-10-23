import { 
  AuditAction, 
  AuditActor, 
  AuditEntry, 
  AuditQueryFilter, 
  AuditVerificationResult 
} from '../types/audit.js';
import { 
  computeEntryHash, 
  GENESIS_PREVIOUS_HASH 
} from './crypto.js';

export class AuditLog {
  private entries: AuditEntry[] = [];

  constructor(initialEntries: readonly AuditEntry[] = []) {
    if (initialEntries && initialEntries.length > 0) {
      // Deep clone to prevent external mutations from compromising the log
      this.entries = JSON.parse(JSON.stringify(initialEntries));
    }
  }

  /**
   * Appends an action to the audit log, creating an immutable hash-chained link.
   */
  public append(
    action: AuditAction,
    actor: AuditActor,
    resourceId: string,
    details: Record<string, unknown> = {},
    timestamp?: string
  ): AuditEntry {
    const sequenceNumber = this.entries.length + 1;
    const entryTimestamp = timestamp || new Date().toISOString();
    const previousHash = this.entries.length === 0
      ? GENESIS_PREVIOUS_HASH
      : this.entries[this.entries.length - 1].hash;

    const payload = {
      sequenceNumber,
      timestamp: entryTimestamp,
      action,
      actor,
      resourceId,
      details,
      previousHash
    };

    const hash = computeEntryHash(payload);

    const entry: AuditEntry = {
      ...payload,
      hash
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * Cryptographically verifies the entire audit log hash chain to detect any tampering,
   * alteration, deletion, or reordering.
   */
  public verify(): AuditVerificationResult {
    return AuditLog.verifyEntries(this.entries);
  }

  /**
   * Static verification function that can be used on any external or persisted audit log array.
   */
  public static verifyEntries(entries: readonly AuditEntry[]): AuditVerificationResult {
    if (!entries || entries.length === 0) {
      return {
        valid: true,
        totalEntries: 0
      };
    }

    let previousHash = GENESIS_PREVIOUS_HASH;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const expectedSequence = i + 1;

      // 1. Verify sequence number continuity
      if (entry.sequenceNumber !== expectedSequence) {
        return {
          valid: false,
          totalEntries: entries.length,
          brokenSequence: entry.sequenceNumber,
          error: `Broken sequence at index ${i}: expected sequence ${expectedSequence}, found ${entry.sequenceNumber}`
        };
      }

      // 2. Verify previousHash chain linkage
      if (entry.previousHash !== previousHash) {
        return {
          valid: false,
          totalEntries: entries.length,
          brokenSequence: entry.sequenceNumber,
          error: `Broken hash chain at sequence ${entry.sequenceNumber}: previousHash mismatch`
        };
      }

      // 3. Recompute hash from payload to detect any altered content
      const computedHash = computeEntryHash({
        sequenceNumber: entry.sequenceNumber,
        timestamp: entry.timestamp,
        action: entry.action,
        actor: entry.actor,
        resourceId: entry.resourceId,
        details: entry.details,
        previousHash: entry.previousHash
      });

      if (computedHash !== entry.hash) {
        return {
          valid: false,
          totalEntries: entries.length,
          brokenSequence: entry.sequenceNumber,
          error: `Tampered content detected at sequence ${entry.sequenceNumber}: payload hash mismatch`
        };
      }

      previousHash = entry.hash;
    }

    return {
      valid: true,
      totalEntries: entries.length
    };
  }

  /**
   * Retrieves all entries in the log.
   */
  public getEntries(): AuditEntry[] {
    return JSON.parse(JSON.stringify(this.entries));
  }

  /**
   * Retrieves the most recent entry in the log.
   */
  public getLatestEntry(): AuditEntry | undefined {
    if (this.entries.length === 0) return undefined;
    return JSON.parse(JSON.stringify(this.entries[this.entries.length - 1]));
  }

  /**
   * Queries audit entries matching specific filter criteria.
   */
  public query(filter: AuditQueryFilter): AuditEntry[] {
    return this.entries.filter(entry => {
      if (filter.resourceId && entry.resourceId !== filter.resourceId) {
        return false;
      }
      if (filter.actorId && entry.actor.id !== filter.actorId) {
        return false;
      }
      if (filter.action && entry.action !== filter.action) {
        return false;
      }
      if (filter.fromTimestamp && new Date(entry.timestamp) < new Date(filter.fromTimestamp)) {
        return false;
      }
      if (filter.toTimestamp && new Date(entry.timestamp) > new Date(filter.toTimestamp)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Serializes the audit log to a JSON string.
   */
  public exportJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Rehydrates an AuditLog instance from a JSON string.
   */
  public static fromJSON(jsonString: string): AuditLog {
    const parsed = JSON.parse(jsonString) as AuditEntry[];
    return new AuditLog(parsed);
  }
}
