import type { AgendaItem, TimeboxSummary, TimeboxTimelineEntry } from '../types/agenda.js';

/**
 * Calculates timebox metrics and builds a chronological timeline from agenda items.
 */
export function calculateTimeboxSummary(
  items: AgendaItem[],
  targetDurationMinutes?: number
): TimeboxSummary {
  const sorted = [...items].sort((a, b) => a.order - b.order);

  let cumulativeOffset = 0;
  let totalAllocated = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let skippedCount = 0;

  const timeline: TimeboxTimelineEntry[] = [];

  for (const item of sorted) {
    const duration = Math.max(0, item.timeBoxMinutes || 0);
    const start = cumulativeOffset;
    const end = cumulativeOffset + duration;

    timeline.push({
      itemId: item.id,
      title: item.title,
      order: item.order,
      durationMinutes: duration,
      cumulativeStartOffsetMinutes: start,
      cumulativeEndOffsetMinutes: end,
      status: item.status,
      ownerName: item.owner?.name
    });

    cumulativeOffset = end;
    totalAllocated += duration;

    if (item.status === 'completed') {
      completedCount++;
    } else if (item.status === 'skipped') {
      skippedCount++;
    } else {
      pendingCount++;
    }
  }

  const isOverAllocated = targetDurationMinutes !== undefined 
    ? totalAllocated > targetDurationMinutes 
    : false;

  const overAllocatedMinutes = isOverAllocated && targetDurationMinutes !== undefined
    ? totalAllocated - targetDurationMinutes
    : 0;

  return {
    totalAllocatedMinutes: totalAllocated,
    targetDurationMinutes,
    isOverAllocated,
    overAllocatedMinutes,
    itemCount: items.length,
    completedItemCount: completedCount,
    pendingItemCount: pendingCount,
    skippedItemCount: skippedCount,
    timeline
  };
}

/**
 * Validates whether all items have valid non-negative timeboxes and sorted orders.
 */
export function validateTimeboxes(items: AgendaItem[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const item of items) {
    if (typeof item.timeBoxMinutes !== 'number' || item.timeBoxMinutes < 0) {
      issues.push(`Item '${item.id}' (${item.title}) has invalid timeBoxMinutes: ${item.timeBoxMinutes}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
