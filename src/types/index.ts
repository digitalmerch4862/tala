import { Agenda } from '../prep/types/agenda';

export type MeetingStatus = 'recorded' | 'uploaded' | 'transcribing' | 'completed';

export type Priority = 'low' | 'medium' | 'high';
export type ActionItemStatus = 'todo' | 'in_progress' | 'completed';

export interface ActionItem {
  id: string;
  meetingId: string;
  meetingTitle: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: Priority;
  status: ActionItemStatus;
  createdAt: string;
}

export interface NoteVersion {
  id: string;
  meetingId: string;
  versionNumber: number;
  timestamp: string;
  author: string;
  title: string;
  summary: MeetingSummary;
  actionItems: ActionItem[];
  changeDescription: string;
}

export interface PreMeetingBrief {
  meetingTitle: string;
  context: string;
  keyObjectives: string[];
  potentialObjections: string[];
  suggestedQuestions: string[];
  carryOverNotes?: string[];
  generatedAt?: string;
  contextOverview?: string;
  recommendedTalkingPoints?: string[];
  riskFactors?: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType:
    | 'meeting_created'
    | 'meeting_recorded'
    | 'meeting_uploaded'
    | 'note_edited'
    | 'version_restored'
    | 'transcript_redacted'
    | 'meeting_deleted'
    | 'export_generated'
    | 'retention_purged'
    | 'webhook_dispatched'
    | 'policy_updated';
  meetingId?: string;
  meetingTitle?: string;
  details: string;
  actor: string;
}

export interface WebhookConfig {
  url: string;
  secretHeader?: string;
  secretToken?: string;
  enabled: boolean;
  lastTriggered?: string;
  lastStatus?: string;
}

export interface TranscriptUtterance {
  id: string;
  speaker: string;
  text: string;
  startSec: number;
  endSec: number;
  confidence?: number;
  isOffTheRecord?: boolean;
}

export interface RealEstateMetrics {
  propertyType?: string; // e.g. "2-Bedroom Pre-selling Condo", "Commercial Lot"
  location?: string; // e.g. "BGC, Taguig", "Cebu City"
  budgetRange?: string; // e.g. "PHP 8M - 12M"
  financingType?: 'Bank' | 'Pag-IBIG' | 'Cash / Spot' | 'Deferred' | 'In-House';
  targetTurnover?: string;
  keyObjections?: string[];
  commissionNotes?: string;
}

export interface MeetingSummary {
  overview: string;
  keyDiscussionPoints: string[];
  decisionsMade: string[];
  nextSteps: string[];
  realEstateMetrics?: RealEstateMetrics;
}

export interface Meeting {
  id: string;
  title: string;
  createdAt: string;
  durationSeconds: number;
  channelId: string;
  channelName: string;
  templateId: string;
  templateName: string;
  language: string;
  participants: string[];
  status: MeetingStatus;
  audioFileName?: string;
  audioDuration?: number;
  transcript: TranscriptUtterance[];
  summary: MeetingSummary;
  actionItems: ActionItem[];
  tags: string[];
  isOffTheRecord?: boolean;
  agenda?: Agenda;
  preMeetingBrief?: PreMeetingBrief;
  versions?: NoteVersion[];
  redactedPhrases?: string[];
  calendarEventId?: string;
  calendarEventLink?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  color: string;
  isDefault?: boolean;
}

export interface MeetingTemplate {
  id: string;
  name: string;
  category: 'real_estate' | 'executive' | 'general';
  description: string;
  suggestedAgenda: string[];
  systemInstructions: string;
  iconName: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export interface TalaSettings {
  defaultLanguage: string;
  theme: 'dark' | 'light';
  llmProvider: 'fleet' | 'local' | 'mock' | 'gemini';
  transcriptionProvider: 'browser_speech' | 'fleet_whisper' | 'mock';
  apiKey?: string;
  retentionDays: number;
  privacyMode: boolean; // no training on user data
  webhookConfig?: WebhookConfig;
  autoPurgeEnabled?: boolean;
}
