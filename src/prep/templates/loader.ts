import { 
  MeetingTemplate, 
  TemplateCategory, 
  TemplateFilterOptions, 
  TemplateSection 
} from '../types/template.js';
import { 
  Agenda, 
  AgendaItem, 
  Participant 
} from '../types/agenda.js';
import { BUILTIN_TEMPLATES } from './registry.js';

export interface InstantiateAgendaOptions {
  agendaId?: string;
  title?: string;
  description?: string;
  meetingDate?: string;
  participants?: Participant[];
  targetTotalDurationMinutes?: number;
  /** Role-to-participant mappings to automatically assign owners to sections */
  roleAssignments?: Record<string, Participant>;
  /** Optional override for section durations keyed by section id */
  durationOverrides?: Record<string, number>;
  /** Only include required sections if true */
  requiredOnly?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates the schema and internal consistency of a meeting template.
 */
export function validateTemplate(template: MeetingTemplate): ValidationResult {
  const errors: string[] = [];

  if (!template.id || typeof template.id !== 'string' || template.id.trim() === '') {
    errors.push('Template id is required and must be a non-empty string.');
  }

  if (!template.title || typeof template.title !== 'string' || template.title.trim() === '') {
    errors.push('Template title is required and must be a non-empty string.');
  }

  if (!template.description || typeof template.description !== 'string') {
    errors.push('Template description is required and must be a string.');
  }

  if (!template.category || !['real-estate', 'general', 'executive', 'custom'].includes(template.category)) {
    errors.push(`Template category '${template.category}' is invalid.`);
  }

  if (typeof template.suggestedDurationMinutes !== 'number' || template.suggestedDurationMinutes <= 0) {
    errors.push('Template suggestedDurationMinutes must be a positive number.');
  }

  if (!Array.isArray(template.sections) || template.sections.length === 0) {
    errors.push('Template must contain at least one section.');
  } else {
    const sectionIds = new Set<string>();
    template.sections.forEach((sec, idx) => {
      if (!sec.id || typeof sec.id !== 'string') {
        errors.push(`Section at index ${idx} must have a valid string id.`);
      } else if (sectionIds.has(sec.id)) {
        errors.push(`Duplicate section id '${sec.id}' found in template.`);
      } else {
        sectionIds.add(sec.id);
      }

      if (!sec.title || typeof sec.title !== 'string') {
        errors.push(`Section '${sec.id || idx}' must have a valid title.`);
      }

      if (typeof sec.defaultDurationMinutes !== 'number' || sec.defaultDurationMinutes <= 0) {
        errors.push(`Section '${sec.id || idx}' duration must be a positive number.`);
      }

      if (!Array.isArray(sec.prompts)) {
        errors.push(`Section '${sec.id || idx}' prompts must be an array.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Converts a template section into a ready-to-run AgendaItem.
 */
export function sectionToAgendaItem(
  section: TemplateSection,
  order: number,
  options?: {
    owner?: Participant;
    durationMinutes?: number;
  }
): AgendaItem {
  const now = new Date().toISOString();
  const talkingPoints = (section.sampleTalkingPoints || []).map((tp, idx) => ({
    id: `tp-${section.id}-${idx + 1}`,
    text: tp,
    completed: false
  }));

  const promptsFormatted = section.prompts.length > 0 
    ? `Guiding Prompts:\n${section.prompts.map(p => `• ${p}`).join('\n')}` 
    : undefined;

  const notes = [
    section.description ? `Purpose: ${section.description}` : undefined,
    promptsFormatted
  ].filter(Boolean).join('\n\n');

  return {
    id: `item-${section.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: section.title,
    description: section.description,
    owner: options?.owner,
    timeBoxMinutes: options?.durationMinutes ?? section.defaultDurationMinutes,
    status: 'pending',
    order,
    talkingPoints,
    notes: notes || undefined,
    actionItems: (section.checklist || []).map((chk, idx) => ({
      id: `act-${section.id}-${idx + 1}`,
      task: chk,
      completed: false
    })),
    tags: [section.id],
    isCarriedOver: false,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Manages the template registry, search, validation, and agenda instantiation.
 */
export class TemplateLoader {
  private templates: Map<string, MeetingTemplate> = new Map();

  constructor(initialTemplates: readonly MeetingTemplate[] = BUILTIN_TEMPLATES) {
    for (const t of initialTemplates) {
      this.registerTemplate(t);
    }
  }

  /**
   * Registers a new template or replaces an existing one by id.
   */
  public registerTemplate(template: MeetingTemplate): void {
    const validation = validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Cannot register invalid template '${template.id}': ${validation.errors.join('; ')}`);
    }
    this.templates.set(template.id, template);
  }

  /**
   * Retrieves all registered templates.
   */
  public getAll(): MeetingTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Retrieves a template by its unique identifier.
   */
  public getById(id: string): MeetingTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Filters templates by category.
   */
  public getByCategory(category: TemplateCategory): MeetingTemplate[] {
    return this.getAll().filter(t => t.category === category);
  }

  /**
   * Filters templates matching a given tag.
   */
  public getByTag(tag: string): MeetingTemplate[] {
    const normalized = tag.toLowerCase().trim();
    return this.getAll().filter(t => t.tags.some(tg => tg.toLowerCase() === normalized));
  }

  /**
   * Full-text search across titles, descriptions, tags, and section headers.
   */
  public search(query: string): MeetingTemplate[] {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return this.getAll();

    return this.getAll().filter(t => {
      if (t.title.toLowerCase().includes(normalized)) return true;
      if (t.description.toLowerCase().includes(normalized)) return true;
      if (t.tags.some(tag => tag.toLowerCase().includes(normalized))) return true;
      if (t.sections.some(s => s.title.toLowerCase().includes(normalized) || 
                               (s.description && s.description.toLowerCase().includes(normalized)))) {
        return true;
      }
      return false;
    });
  }

  /**
   * Multi-criteria filter for templates.
   */
  public filter(options: TemplateFilterOptions): MeetingTemplate[] {
    return this.getAll().filter(t => {
      if (options.category && t.category !== options.category) {
        return false;
      }
      if (options.tag) {
        const normTag = options.tag.toLowerCase();
        if (!t.tags.some(tg => tg.toLowerCase() === normTag)) {
          return false;
        }
      }
      if (options.maxDurationMinutes !== undefined && t.suggestedDurationMinutes > options.maxDurationMinutes) {
        return false;
      }
      if (options.searchTerm) {
        const norm = options.searchTerm.toLowerCase();
        const matches = t.title.toLowerCase().includes(norm) ||
                        t.description.toLowerCase().includes(norm) ||
                        t.tags.some(tg => tg.toLowerCase().includes(norm));
        if (!matches) return false;
      }
      return true;
    });
  }

  /**
   * Instantiates a fully populated Agenda model from a template.
   */
  public instantiateAgenda(
    templateOrId: MeetingTemplate | string,
    options: InstantiateAgendaOptions = {}
  ): Agenda {
    const template = typeof templateOrId === 'string' 
      ? this.getById(templateOrId) 
      : templateOrId;

    if (!template) {
      throw new Error(`Template not found: ${templateOrId}`);
    }

    const now = new Date().toISOString();
    const agendaId = options.agendaId || `agenda-${template.id}-${Date.now().toString(36)}`;
    const sectionsToInclude = options.requiredOnly
      ? template.sections.filter(s => s.isRequired)
      : template.sections;

    const items: AgendaItem[] = sectionsToInclude.map((section, idx) => {
      const assignedOwner = section.suggestedOwnerRole && options.roleAssignments 
        ? options.roleAssignments[section.suggestedOwnerRole]
        : undefined;

      const duration = options.durationOverrides?.[section.id] ?? section.defaultDurationMinutes;

      return sectionToAgendaItem(section, idx + 1, {
        owner: assignedOwner,
        durationMinutes: duration
      });
    });

    return {
      id: agendaId,
      title: options.title || template.title,
      description: options.description || template.description,
      meetingDate: options.meetingDate,
      templateId: template.id,
      participants: options.participants || [],
      items,
      status: 'draft',
      targetTotalDurationMinutes: options.targetTotalDurationMinutes || template.suggestedDurationMinutes,
      createdAt: now,
      updatedAt: now
    };
  }
}

// Global default singleton instance
const defaultLoader = new TemplateLoader();

export function getAllTemplates(): MeetingTemplate[] {
  return defaultLoader.getAll();
}

export function getTemplateById(id: string): MeetingTemplate | undefined {
  return defaultLoader.getById(id);
}

export function getTemplatesByCategory(category: TemplateCategory): MeetingTemplate[] {
  return defaultLoader.getByCategory(category);
}

export function searchTemplates(query: string): MeetingTemplate[] {
  return defaultLoader.search(query);
}

export function filterTemplates(options: TemplateFilterOptions): MeetingTemplate[] {
  return defaultLoader.filter(options);
}

export function instantiateAgendaFromTemplate(
  templateOrId: MeetingTemplate | string,
  options?: InstantiateAgendaOptions
): Agenda {
  return defaultLoader.instantiateAgenda(templateOrId, options);
}
