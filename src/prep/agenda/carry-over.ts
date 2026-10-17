import { 
  Agenda, 
  AgendaItem, 
  AgendaItemStatus, 
  CarryOverOptions 
} from '../types/agenda.js';

const DEFAULT_UNFINISHED_STATUSES: AgendaItemStatus[] = ['pending', 'in_progress'];

/**
 * Extracts unfinished items from an agenda based on status and selection criteria.
 */
export function extractUnfinishedItems(
  agenda: Agenda,
  options: CarryOverOptions = {}
): AgendaItem[] {
  const targetStatuses = options.statusesToCarryOver || DEFAULT_UNFINISHED_STATUSES;
  const statusSet = new Set(targetStatuses);

  return agenda.items.filter(item => {
    if (!statusSet.has(item.status)) {
      return false;
    }
    if (options.selectedItemIds && options.selectedItemIds.length > 0) {
      return options.selectedItemIds.includes(item.id);
    }
    return true;
  });
}

/**
 * Clones and transforms a single item into a carried-over item for a subsequent meeting.
 */
export function cloneItemForCarryOver(
  item: AgendaItem,
  sourceAgenda: Agenda,
  newOrder: number,
  options: CarryOverOptions = {}
): AgendaItem {
  const now = new Date().toISOString();
  const priorCount = item.carryOverHistory?.carryOverCount ?? 0;
  const carryOverCount = priorCount + 1;
  const firstCreatedDate = item.carryOverHistory?.firstCreatedDate || item.createdAt;

  let title = item.title;
  if (options.prefixTitle) {
    const prefix = options.customPrefix ?? '[Carried Over] ';
    if (!title.startsWith(prefix.trim())) {
      title = `${prefix.trim()} ${title}`;
    }
  }

  // Preserve talking points, keeping uncompleted ones and copying notes
  const talkingPoints = item.talkingPoints.map(tp => ({
    ...tp,
    id: `tp-co-${tp.id}-${Date.now().toString(36)}`
  }));

  // Carry over open action items
  const actionItems = item.actionItems
    .filter(act => !act.completed)
    .map(act => ({
      ...act,
      id: `act-co-${act.id}-${Date.now().toString(36)}`
    }));

  const notes = options.preserveNotes !== false ? item.notes : undefined;

  return {
    id: `item-co-${item.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    title,
    description: item.description,
    owner: item.owner ? { ...item.owner } : undefined,
    timeBoxMinutes: options.overrideTimeBoxMinutes ?? item.timeBoxMinutes,
    status: 'pending',
    order: newOrder,
    talkingPoints,
    notes,
    decision: undefined, // Decisions belong to the meeting session where they occurred
    actionItems,
    tags: Array.from(new Set([...(item.tags || []), 'carried-over'])),
    isCarriedOver: true,
    carryOverHistory: {
      originalMeetingId: sourceAgenda.id,
      originalMeetingTitle: sourceAgenda.title,
      originalItemId: item.carryOverHistory?.originalItemId || item.id,
      carryOverCount,
      firstCreatedDate,
      lastCarriedOverDate: now,
      carriedOverReason: options.reason
    },
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Carries over unfinished items from a source agenda into a target agenda.
 * Appends carried-over items to the target agenda and updates ordering.
 */
export function carryOverUnfinishedItems(
  sourceAgenda: Agenda,
  targetAgenda: Agenda,
  options: CarryOverOptions = {}
): {
  source: Agenda;
  target: Agenda;
  carriedOverItems: AgendaItem[];
} {
  const unfinished = extractUnfinishedItems(sourceAgenda, options);
  const startOrder = targetAgenda.items.length + 1;

  const carriedOverItems: AgendaItem[] = unfinished.map((item, idx) =>
    cloneItemForCarryOver(item, sourceAgenda, startOrder + idx, options)
  );

  const updatedTargetItems = [...targetAgenda.items, ...carriedOverItems];

  const updatedTarget: Agenda = {
    ...targetAgenda,
    items: updatedTargetItems,
    updatedAt: new Date().toISOString()
  };

  return {
    source: sourceAgenda,
    target: updatedTarget,
    carriedOverItems
  };
}

/**
 * Creates a brand new follow-up agenda populated directly with the carried-over items of a prior agenda.
 */
export function createFollowUpAgendaWithCarryOver(
  sourceAgenda: Agenda,
  newAgendaMeta: {
    id?: string;
    title: string;
    description?: string;
    meetingDate?: string;
    targetTotalDurationMinutes?: number;
  },
  options: CarryOverOptions = {}
): Agenda {
  const unfinished = extractUnfinishedItems(sourceAgenda, options);
  const now = new Date().toISOString();
  const agendaId = newAgendaMeta.id || `agenda-followup-${Date.now().toString(36)}`;

  const carriedOverItems = unfinished.map((item, idx) =>
    cloneItemForCarryOver(item, sourceAgenda, idx + 1, options)
  );

  const totalAllocated = carriedOverItems.reduce((acc, curr) => acc + curr.timeBoxMinutes, 0);

  return {
    id: agendaId,
    title: newAgendaMeta.title,
    description: newAgendaMeta.description || `Follow-up meeting carrying over unfinished items from '${sourceAgenda.title}'`,
    meetingDate: newAgendaMeta.meetingDate,
    templateId: sourceAgenda.templateId,
    participants: [...sourceAgenda.participants],
    items: carriedOverItems,
    status: 'draft',
    targetTotalDurationMinutes: newAgendaMeta.targetTotalDurationMinutes || totalAllocated,
    createdAt: now,
    updatedAt: now
  };
}
