export type TemplateCategory = 'real-estate' | 'general' | 'executive' | 'custom';

export interface TemplateSection {
  /** Unique identifier for section within template */
  id: string;
  /** Human-readable section heading */
  title: string;
  /** Contextual explanation / purpose of this section */
  description?: string;
  /** Suggested default duration in minutes */
  defaultDurationMinutes: number;
  /** Role suggested to lead or own this section */
  suggestedOwnerRole?: string;
  /** Guiding prompt questions to guide the conversation */
  prompts: string[];
  /** Concrete talking points or discussion topics */
  sampleTalkingPoints?: string[];
  /** Actionable checklist items or verification points */
  checklist?: string[];
  /** Whether this section is mandatory for the meeting flow */
  isRequired?: boolean;
}

export interface MeetingTemplate {
  /** Unique slug identifier, e.g. 're-client-discovery' */
  id: string;
  /** Human-readable template title */
  title: string;
  /** Overview of what this template achieves */
  description: string;
  /** Categorization for filtering and organization */
  category: TemplateCategory;
  /** Suggested emoji or icon token for UI cards */
  icon?: string;
  /** Target audience or meeting participants */
  targetAudience: string;
  /** Total suggested duration in minutes */
  suggestedDurationMinutes: number;
  /** Searchable tags */
  tags: string[];
  /** Ordered list of template sections */
  sections: TemplateSection[];
  /** Arbitrary domain metadata (industry, version, author, etc.) */
  metadata?: Record<string, unknown>;
}

export interface TemplateFilterOptions {
  category?: TemplateCategory;
  tag?: string;
  maxDurationMinutes?: number;
  searchTerm?: string;
}
