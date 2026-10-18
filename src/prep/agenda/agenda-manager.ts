import type { ActionItem, Agenda, AgendaItem, AgendaItemStatus, CarryOverOptions, Participant, TalkingPoint, TimeboxSummary } from '../types/agenda.js';
import type { MeetingTemplate } from '../types/template.js';
import { calculateTimeboxSummary } from './timebox.js';
import { 
  carryOverUnfinishedItems, 
  extractUnfinishedItems, 
  createFollowUpAgendaWithCarryOver 
} from './carry-over.js';
import { instantiateAgendaFromTemplate } from '../templates/loader.js';
import type { InstantiateAgendaOptions } from '../templates/loader.js';

export type NewAgendaItemInput = {
  id?: string;
  title: string;
  description?: string;
  owner?: Participant;
  timeBoxMinutes: number;
  actualDurationMinutes?: number;
  status?: AgendaItemStatus;
  order?: number;
  talkingPoints?: Array<{ id?: string; text: string; completed?: boolean; notes?: string }>;
  notes?: string;
  decision?: string;
  actionItems?: Array<{ id?: string; task: string; assignee?: Participant | string; dueDate?: string; completed?: boolean }>;
  tags?: string[];
  isCarriedOver?: boolean;
};

/**
 * Manages operations on a collaborative meeting agenda.
 */
export class AgendaManager {
  private agenda: Agenda;

  constructor(agenda: Agenda) {
    this.agenda = {
      ...agenda,
      items: [...agenda.items]
    };
    this.normalizeOrder();
  }

  /**
   * Creates an AgendaManager wrapping a new empty or partially defined agenda.
   */
  public static create(initial: Partial<Agenda> = {}): AgendaManager {
    const now = new Date().toISOString();
    return new AgendaManager({
      id: initial.id || `agenda-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: initial.title || 'Untitled Meeting',
      description: initial.description,
      meetingDate: initial.meetingDate,
      templateId: initial.templateId,
      participants: initial.participants ? [...initial.participants] : [],
      items: initial.items ? [...initial.items] : [],
      status: initial.status || 'draft',
      targetTotalDurationMinutes: initial.targetTotalDurationMinutes,
      createdAt: initial.createdAt || now,
      updatedAt: initial.updatedAt || now
    });
  }

  /**
   * Creates an AgendaManager initialized from a meeting template.
   */
  public static fromTemplate(
    templateOrId: MeetingTemplate | string,
    options?: InstantiateAgendaOptions
  ): AgendaManager {
    const agenda = instantiateAgendaFromTemplate(templateOrId, options);
    return new AgendaManager(agenda);
  }

  /**
   * Retrieves the raw underlying Agenda data object.
   */
  public getRaw(): Agenda {
    return JSON.parse(JSON.stringify(this.agenda));
  }

  /**
   * Serializes the agenda to a JSON-ready object.
   */
  public toJSON(): Agenda {
    return this.getRaw();
  }

  /**
   * Retrieves the agenda ID.
   */
  public getId(): string {
    return this.agenda.id;
  }

  /**
   * Retrieves all items in the agenda.
   */
  public getItems(): AgendaItem[] {
    return [...this.agenda.items];
  }

  /**
   * Retrieves an item by its ID.
   */
  public getItemById(itemId: string): AgendaItem | undefined {
    return this.agenda.items.find(i => i.id === itemId);
  }

  /**
   * Adds an item to the end of the agenda.
   */
  public addItem(input: NewAgendaItemInput): AgendaItem {
    const now = new Date().toISOString();
    const order = this.agenda.items.length + 1;
    const itemId = input.id || `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newItem: AgendaItem = {
      id: itemId,
      title: input.title,
      description: input.description,
      owner: input.owner,
      timeBoxMinutes: Math.max(0, input.timeBoxMinutes),
      actualDurationMinutes: input.actualDurationMinutes,
      status: input.status || 'pending',
      order,
      talkingPoints: (input.talkingPoints || []).map((tp, idx) => ({
        id: tp.id || `tp-${itemId}-${idx + 1}`,
        text: tp.text,
        completed: tp.completed ?? false,
        notes: tp.notes
      })),
      notes: input.notes,
      decision: input.decision,
      actionItems: (input.actionItems || []).map((act, idx) => ({
        id: act.id || `act-${itemId}-${idx + 1}`,
        task: act.task,
        assignee: act.assignee,
        dueDate: act.dueDate,
        completed: act.completed ?? false
      })),
      tags: input.tags ? [...input.tags] : [],
      isCarriedOver: input.isCarriedOver ?? false,
      createdAt: now,
      updatedAt: now
    };

    this.agenda.items.push(newItem);
    this.touch();
    return newItem;
  }

  /**
   * Inserts an item at a specific 0-based index.
   */
  public insertItemAt(input: NewAgendaItemInput, targetIndex: number): AgendaItem {
    const now = new Date().toISOString();
    const itemId = input.id || `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newItem: AgendaItem = {
      id: itemId,
      title: input.title,
      description: input.description,
      owner: input.owner,
      timeBoxMinutes: Math.max(0, input.timeBoxMinutes),
      actualDurationMinutes: input.actualDurationMinutes,
      status: input.status || 'pending',
      order: targetIndex + 1,
      talkingPoints: (input.talkingPoints || []).map((tp, idx) => ({
        id: tp.id || `tp-${itemId}-${idx + 1}`,
        text: tp.text,
        completed: tp.completed ?? false,
        notes: tp.notes
      })),
      notes: input.notes,
      decision: input.decision,
      actionItems: (input.actionItems || []).map((act, idx) => ({
        id: act.id || `act-${itemId}-${idx + 1}`,
        task: act.task,
        assignee: act.assignee,
        dueDate: act.dueDate,
        completed: act.completed ?? false
      })),
      tags: input.tags ? [...input.tags] : [],
      isCarriedOver: input.isCarriedOver ?? false,
      createdAt: now,
      updatedAt: now
    };

    const safeIndex = Math.max(0, Math.min(targetIndex, this.agenda.items.length));
    this.agenda.items.splice(safeIndex, 0, newItem);
    this.normalizeOrder();
    this.touch();
    return newItem;
  }

  /**
   * Removes an item from the agenda by ID and re-indexes remaining items.
   */
  public removeItem(itemId: string): boolean {
    const idx = this.agenda.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    this.agenda.items.splice(idx, 1);
    this.normalizeOrder();
    this.touch();
    return true;
  }

  /**
   * Partially updates an existing agenda item.
   */
  public updateItem(itemId: string, patch: Partial<AgendaItem>): AgendaItem {
    const item = this.agenda.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Agenda item not found: ${itemId}`);
    }

    if (patch.title !== undefined) item.title = patch.title;
    if (patch.description !== undefined) item.description = patch.description;
    if (patch.owner !== undefined) item.owner = patch.owner;
    if (patch.timeBoxMinutes !== undefined) item.timeBoxMinutes = Math.max(0, patch.timeBoxMinutes);
    if (patch.actualDurationMinutes !== undefined) item.actualDurationMinutes = patch.actualDurationMinutes;
    if (patch.status !== undefined) item.status = patch.status;
    if (patch.notes !== undefined) item.notes = patch.notes;
    if (patch.decision !== undefined) item.decision = patch.decision;
    if (patch.tags !== undefined) item.tags = [...patch.tags];
    if (patch.talkingPoints !== undefined) item.talkingPoints = [...patch.talkingPoints];
    if (patch.actionItems !== undefined) item.actionItems = [...patch.actionItems];

    item.updatedAt = new Date().toISOString();
    this.touch();
    return item;
  }

  /**
   * Reorders all items according to an explicit array of item IDs.
   */
  public reorderItems(orderedItemIds: string[]): AgendaItem[] {
    const itemMap = new Map(this.agenda.items.map(item => [item.id, item]));

    if (orderedItemIds.length !== this.agenda.items.length) {
      throw new Error(`Cannot reorder: expected ${this.agenda.items.length} item IDs, received ${orderedItemIds.length}`);
    }

    for (const id of orderedItemIds) {
      if (!itemMap.has(id)) {
        throw new Error(`Cannot reorder: item ID '${id}' is not in this agenda.`);
      }
    }

    const reordered: AgendaItem[] = orderedItemIds.map((id, index) => {
      const item = itemMap.get(id)!;
      item.order = index + 1;
      return item;
    });

    this.agenda.items = reordered;
    this.touch();
    return this.getItems();
  }

  /**
   * Moves a single item one position 'up' (earlier) or 'down' (later).
   */
  public moveItem(itemId: string, direction: 'up' | 'down'): boolean {
    const idx = this.agenda.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= this.agenda.items.length) {
      return false; // Already at boundary
    }

    const temp = this.agenda.items[idx];
    this.agenda.items[idx] = this.agenda.items[targetIdx];
    this.agenda.items[targetIdx] = temp;

    this.normalizeOrder();
    this.touch();
    return true;
  }

  /**
   * Updates an item's status, optionally recording actual duration.
   */
  public setItemStatus(itemId: string, status: AgendaItemStatus, actualDurationMinutes?: number): AgendaItem {
    return this.updateItem(itemId, {
      status,
      actualDurationMinutes: actualDurationMinutes ?? this.getItemById(itemId)?.actualDurationMinutes
    });
  }

  /**
   * Assigns or clears the owner of an item.
   */
  public setItemOwner(itemId: string, owner?: Participant): AgendaItem {
    return this.updateItem(itemId, { owner });
  }

  /**
   * Appends a talking point to an item.
   */
  public addTalkingPoint(itemId: string, text: string): TalkingPoint {
    const item = this.agenda.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Agenda item not found: ${itemId}`);
    }

    const tp: TalkingPoint = {
      id: `tp-${itemId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      text,
      completed: false
    };

    item.talkingPoints.push(tp);
    item.updatedAt = new Date().toISOString();
    this.touch();
    return tp;
  }

  /**
   * Toggles completion status of a talking point.
   */
  public toggleTalkingPoint(itemId: string, talkingPointId: string, completed?: boolean): boolean {
    const item = this.agenda.items.find(i => i.id === itemId);
    if (!item) return false;

    const tp = item.talkingPoints.find(t => t.id === talkingPointId);
    if (!tp) return false;

    tp.completed = completed !== undefined ? completed : !tp.completed;
    item.updatedAt = new Date().toISOString();
    this.touch();
    return true;
  }

  /**
   * Appends an action item to an agenda item.
   */
  public addActionItem(
    itemId: string,
    task: string,
    assignee?: Participant | string,
    dueDate?: string
  ): ActionItem {
    const item = this.agenda.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Agenda item not found: ${itemId}`);
    }

    const actionItem: ActionItem = {
      id: `act-${itemId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      task,
      assignee,
      dueDate,
      completed: false
    };

    item.actionItems.push(actionItem);
    item.updatedAt = new Date().toISOString();
    this.touch();
    return actionItem;
  }

  /**
   * Toggles completion status of an action item.
   */
  public toggleActionItem(itemId: string, actionItemId: string, completed?: boolean): boolean {
    const item = this.agenda.items.find(i => i.id === itemId);
    if (!item) return false;

    const act = item.actionItems.find(a => a.id === actionItemId);
    if (!act) return false;

    act.completed = completed !== undefined ? completed : !act.completed;
    item.updatedAt = new Date().toISOString();
    this.touch();
    return true;
  }

  /**
   * Calculates timebox totals, over-allocation warnings, and chronologically builds a timeline.
   */
  public getTimeboxSummary(): TimeboxSummary {
    return calculateTimeboxSummary(
      this.agenda.items,
      this.agenda.targetTotalDurationMinutes
    );
  }

  /**
   * Returns list of unfinished items (pending, in_progress, etc.).
   */
  public getUnfinishedItems(statuses?: AgendaItemStatus[]): AgendaItem[] {
    return extractUnfinishedItems(this.agenda, {
      statusesToCarryOver: statuses
    });
  }

  /**
   * Carries over unfinished items into another AgendaManager or Agenda instance.
   */
  public carryOverTo(
    target: AgendaManager | Agenda,
    options: CarryOverOptions = {}
  ): AgendaItem[] {
    const targetAgenda = target instanceof AgendaManager ? target.agenda : target;
    const { target: updatedTarget, carriedOverItems } = carryOverUnfinishedItems(
      this.agenda,
      targetAgenda,
      options
    );

    if (target instanceof AgendaManager) {
      target.agenda = updatedTarget;
      target.touch();
    }

    return carriedOverItems;
  }

  /**
   * Creates a new follow-up AgendaManager containing unfinished items from this agenda.
   */
  public createFollowUp(
    meta: { title: string; meetingDate?: string; targetTotalDurationMinutes?: number },
    options: CarryOverOptions = {}
  ): AgendaManager {
    const followUpAgenda = createFollowUpAgendaWithCarryOver(this.agenda, meta, options);
    return new AgendaManager(followUpAgenda);
  }

  /**
   * Re-numbers items 1 to N consecutively.
   */
  private normalizeOrder(): void {
    this.agenda.items.forEach((item, idx) => {
      item.order = idx + 1;
    });
  }

  private touch(): void {
    this.agenda.updatedAt = new Date().toISOString();
  }
}
