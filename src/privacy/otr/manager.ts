import type { OtrSegment } from '../types/otr.js';

export class OtrManager {
  private segments: OtrSegment[] = [];

  constructor(initialSegments: readonly OtrSegment[] = []) {
    if (initialSegments && initialSegments.length > 0) {
      for (const seg of initialSegments) {
        this.markSegment(seg.startTimeSeconds, seg.endTimeSeconds, {
          reason: seg.reason,
          markedBy: seg.markedBy
        });
      }
    }
  }

  /**
   * Marks a time range as off-the-record and merges any overlapping or adjacent intervals.
   */
  public markSegment(
    startTimeSeconds: number,
    endTimeSeconds: number,
    options: { reason?: string; markedBy?: string; id?: string } = {}
  ): OtrSegment {
    if (startTimeSeconds < 0) {
      throw new Error(`startTimeSeconds cannot be negative: ${startTimeSeconds}`);
    }
    if (endTimeSeconds < startTimeSeconds) {
      throw new Error(`endTimeSeconds (${endTimeSeconds}) cannot be less than startTimeSeconds (${startTimeSeconds})`);
    }

    const start = Math.round(startTimeSeconds * 100) / 100;
    const end = Math.round(endTimeSeconds * 100) / 100;
    const now = new Date().toISOString();

    const newSegment: OtrSegment = {
      id: options.id || `otr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      startTimeSeconds: start,
      endTimeSeconds: end,
      reason: options.reason,
      markedBy: options.markedBy,
      createdAt: now
    };

    this.segments.push(newSegment);
    this.consolidate();

    // Find the merged segment covering this range
    const covering = this.segments.find(s => s.startTimeSeconds <= start && s.endTimeSeconds >= end);
    return covering || newSegment;
  }

  /**
   * Removes a specific segment by ID.
   */
  public removeSegment(segmentId: string): boolean {
    const idx = this.segments.findIndex(s => s.id === segmentId);
    if (idx === -1) return false;
    this.segments.splice(idx, 1);
    return true;
  }

  /**
   * Returns all active OTR segments sorted by start time.
   */
  public getSegments(): OtrSegment[] {
    return JSON.parse(JSON.stringify(this.segments));
  }

  /**
   * Checks whether a specific timestamp in seconds falls within any off-the-record segment.
   */
  public isTimestampOtr(timeSeconds: number): boolean {
    return this.segments.some(s => timeSeconds >= s.startTimeSeconds && timeSeconds <= s.endTimeSeconds);
  }

  /**
   * Calculates the total non-overlapping duration of off-the-record segments in seconds.
   */
  public getTotalOtrDurationSeconds(): number {
    return this.segments.reduce((acc, curr) => acc + (curr.endTimeSeconds - curr.startTimeSeconds), 0);
  }

  /**
   * Clears all OTR segments.
   */
  public clear(): void {
    this.segments = [];
  }

  /**
   * Sorts segments and merges overlapping or adjacent intervals.
   */
  private consolidate(): void {
    if (this.segments.length <= 1) return;

    this.segments.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

    const merged: OtrSegment[] = [];
    let current = { ...this.segments[0] };

    for (let i = 1; i < this.segments.length; i++) {
      const next = this.segments[i];

      // If next overlaps or is immediately adjacent to current
      if (next.startTimeSeconds <= current.endTimeSeconds) {
        current.endTimeSeconds = Math.max(current.endTimeSeconds, next.endTimeSeconds);
        // Combine reasons if distinct
        if (next.reason && next.reason !== current.reason) {
          current.reason = current.reason ? `${current.reason}; ${next.reason}` : next.reason;
        }
      } else {
        merged.push(current);
        current = { ...next };
      }
    }

    merged.push(current);
    this.segments = merged;
  }
}
