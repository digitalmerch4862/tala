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
  retentionDays?: number;
  privacyMode: boolean; // no training on data
}
