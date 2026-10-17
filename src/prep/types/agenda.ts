export type AgendaItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type AgendaStatus = 'draft' | 'ready' | 'in_progress' | 'completed' | 'archived';

export interface Participant {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface TalkingPoint {
  id: string;
  text: string;
  completed?: boolean;
  notes?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee?: Participant | string;
  dueDate?: string;
  completed: boolean;
}

export interface CarryOverHistory {
  /** Identifier of the prior meeting where this item originated */
  originalMeetingId?: string;
  /** Title of the prior meeting */
  originalMeetingTitle?: string;
  /** Prior item ID before copy/clone */
  originalItemId?: string;
  /** Number of times this item has been carried over across meetings */
  carryOverCount: number;
  /** ISO timestamp when the item was first created */
  firstCreatedDate?: string;
  /** ISO timestamp of the latest carry-over event */
  lastCarriedOverDate?: string;
  /** Optional note on why the item was deferred */
  carriedOverReason?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  owner?: Participant;
  /** Allocated timebox in minutes */
  timeBoxMinutes: number;
  /** Actual recorded time spent during the meeting in minutes */
  actualDurationMinutes?: number;
  status: AgendaItemStatus;
  order: number;
  talkingPoints: TalkingPoint[];
  notes?: string;
  decision?: string;
  actionItems: ActionItem[];
  tags?: string[];
  /** Flag indicating whether this item was carried over from a prior agenda */
  isCarriedOver?: boolean;
  /** Historical lineage if carried over */
  carryOverHistory?: CarryOverHistory;
  createdAt: string;
  updatedAt: string;
}

export interface Agenda {
  id: string;
  title: string;
  description?: string;
  meetingDate?: string;
  templateId?: string;
  participants: Participant[];
  items: AgendaItem[];
  status: AgendaStatus;
  targetTotalDurationMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeboxTimelineEntry {
  itemId: string;
  title: string;
  order: number;
  durationMinutes: number;
  cumulativeStartOffsetMinutes: number;
  cumulativeEndOffsetMinutes: number;
  status: AgendaItemStatus;
  ownerName?: string;
}

export interface TimeboxSummary {
  totalAllocatedMinutes: number;
  targetDurationMinutes?: number;
  isOverAllocated: boolean;
  overAllocatedMinutes: number;
  itemCount: number;
  completedItemCount: number;
  pendingItemCount: number;
  skippedItemCount: number;
  timeline: TimeboxTimelineEntry[];
}

export interface CarryOverOptions {
  /** Filter which statuses to carry over. Defaults to ['pending', 'in_progress'] */
  statusesToCarryOver?: AgendaItemStatus[];
  /** Specific item IDs to carry over. If omitted, all matching statuses are carried over */
  selectedItemIds?: string[];
  /** Whether to append a visual tag/prefix (e.g., '[Carried Over]') to title */
  prefixTitle?: boolean;
  /** Custom prefix if prefixTitle is true. Defaults to '[Carried Over]' */
  customPrefix?: string;
  /** Whether to preserve existing notes in carried over items */
  preserveNotes?: boolean;
  /** Reason for carry over */
  reason?: string;
  /** Default allocated timebox for carried-over items if you want to override */
  overrideTimeBoxMinutes?: number;
}
