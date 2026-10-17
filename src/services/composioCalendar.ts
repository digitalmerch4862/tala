import { Meeting } from '../types';

export interface ComposioCalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  attendees: string[];
  location?: string;
  htmlLink?: string;
}

export interface CreateFollowUpEventInput {
  title: string;
  description: string;
  startTime: string;
  durationMinutes: number;
  attendees: string[];
  location?: string;
}

export interface ComposioCalendarRouteResponse {
  enabled: boolean;
  status: 'active' | 'off';
  provider: 'composio';
  toolkit: 'googlecalendar';
  message?: string;
  events?: ComposioCalendarEvent[];
  event?: ComposioCalendarEvent;
  linkedMeeting?: {
    meetingId: string;
    calendarEventId: string;
    title: string;
    attendees: string[];
    startTime: string;
    endTime: string;
  };
}

export interface ComposioToolkitAdapter {
  isConfigured(): boolean;
  listUpcomingEvents(params?: { timeMin?: string; maxResults?: number }): Promise<ComposioCalendarEvent[]>;
  createFollowUpEvent(input: CreateFollowUpEventInput): Promise<ComposioCalendarEvent>;
  getEventById(eventId: string): Promise<ComposioCalendarEvent | null>;
}

/**
 * Normalizes raw Google Calendar event payload from Composio GOOGLECALENDAR actions
 */
export function normalizeGoogleCalendarItem(raw: any): ComposioCalendarEvent {
  const startStr =
    raw?.start?.dateTime ||
    raw?.start?.date ||
    raw?.start_datetime ||
    new Date().toISOString();
  const endStr =
    raw?.end?.dateTime ||
    raw?.end?.date ||
    raw?.end_datetime ||
    new Date(new Date(startStr).getTime() + 45 * 60000).toISOString();

  const startMs = new Date(startStr).getTime();
  const endMs = new Date(endStr).getTime();
  const durationMinutes =
    !isNaN(startMs) && !isNaN(endMs) && endMs > startMs
      ? Math.round((endMs - startMs) / 60000)
      : 45;

  const attendees: string[] = Array.isArray(raw?.attendees)
    ? raw.attendees.map((a: any) =>
        typeof a === 'string' ? a : a?.displayName || a?.email || 'Guest'
      )
    : ['Rad (BDM)'];

  return {
    id: String(raw?.id || `gcal-${Date.now()}`),
    title: String(raw?.summary || raw?.title || 'Untitled Calendar Event'),
    description: String(raw?.description || ''),
    startTime: new Date(startMs || Date.now()).toISOString(),
    endTime: new Date(endMs || Date.now() + 45 * 60000).toISOString(),
    durationMinutes,
    attendees: attendees.length > 0 ? attendees : ['Rad (BDM)'],
    location: raw?.location ? String(raw.location) : undefined,
    htmlLink: raw?.htmlLink ? String(raw.htmlLink) : undefined,
  };
}

/**
 * Server-side Composio adapter that calls Composio v2 Action Execution API.
 * Must only be instantiated in serverless route (`/api/calendar`) with process.env.COMPOSIO_API_KEY.
 */
export class ServerComposioCalendarAdapter implements ComposioToolkitAdapter {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl = 'https://backend.composio.dev/api/v2') {
    this.apiKey = apiKey?.trim() || undefined;
    this.baseUrl = baseUrl;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  private async executeAction(actionName: string, input: Record<string, unknown>): Promise<any> {
    if (!this.apiKey) {
      throw new Error('COMPOSIO_API_KEY is not configured');
    }

    const response = await fetch(`${this.baseUrl}/actions/${actionName}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        appName: 'googlecalendar',
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Composio action ${actionName} failed with status ${response.status}`);
    }

    return response.json();
  }

  public async listUpcomingEvents(params?: {
    timeMin?: string;
    maxResults?: number;
  }): Promise<ComposioCalendarEvent[]> {
    const payload = await this.executeAction('GOOGLECALENDAR_FIND_EVENT', {
      calendar_id: 'primary',
      timeMin: params?.timeMin || new Date().toISOString(),
      max_results: params?.maxResults || 15,
      single_events: true,
      order_by: 'startTime',
    });

    const rawItems =
      payload?.data?.event_data?.event_data ||
      payload?.data?.items ||
      payload?.response_data?.items ||
      payload?.items ||
      [];

    if (!Array.isArray(rawItems)) {
      return [];
    }

    return rawItems.map((item: any) => normalizeGoogleCalendarItem(item));
  }

  public async createFollowUpEvent(
    input: CreateFollowUpEventInput
  ): Promise<ComposioCalendarEvent> {
    const durationHours = Math.floor(input.durationMinutes / 60);
    const durationMins = input.durationMinutes % 60;

    const payload = await this.executeAction('GOOGLECALENDAR_CREATE_EVENT', {
      calendar_id: 'primary',
      summary: input.title,
      description: input.description,
      start_datetime: input.startTime,
      event_duration_hour: durationHours,
      event_duration_minutes: durationMins,
      attendees: input.attendees,
      location: input.location || '',
    });

    const rawCreated =
      payload?.data?.response_data ||
      payload?.data ||
      payload?.response_data || {
        id: `gcal-created-${Date.now()}`,
        summary: input.title,
        description: input.description,
        start: { dateTime: input.startTime },
        end: {
          dateTime: new Date(
            new Date(input.startTime).getTime() + input.durationMinutes * 60000
          ).toISOString(),
        },
        attendees: input.attendees.map((email) => ({ email })),
        location: input.location,
      };

    return normalizeGoogleCalendarItem(rawCreated);
  }

  public async getEventById(eventId: string): Promise<ComposioCalendarEvent | null> {
    const events = await this.listUpcomingEvents({ maxResults: 30 });
    return events.find((e) => e.id === eventId) || null;
  }
}

/**
 * Fake Composio adapter for unit and E2E testing without real API keys or live account calls.
 */
export class FakeComposioCalendarAdapter implements ComposioToolkitAdapter {
  private configured: boolean;
  private events: ComposioCalendarEvent[];

  constructor(configured = true, initialEvents?: ComposioCalendarEvent[]) {
    this.configured = configured;
    this.events = initialEvents || [
      {
        id: 'gcal-evt-bgc-101',
        title: 'Ayala Land Premier — BGC Penthouse Client Walkthrough',
        description: 'Review 3BR penthouse floor plan, turnover schedule, and bank financing terms.',
        startTime: '2026-10-22T09:00:00.000Z',
        endTime: '2026-10-22T10:00:00.000Z',
        durationMinutes: 60,
        attendees: ['Rad (BDM)', 'Atty. Marco Tan', 'Elena Vance (Broker)'],
        location: 'One Bonifacio High Street, BGC, Taguig',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=gcal-evt-bgc-101',
      },
      {
        id: 'gcal-evt-nuvali-202',
        title: 'Nuvali Commercial Lot — Developer Commission Alignment',
        description: 'Finalize broker network 4.5% commission tier and LOI submission deadline.',
        startTime: '2026-10-24T14:00:00.000Z',
        endTime: '2026-10-24T14:45:00.000Z',
        durationMinutes: 45,
        attendees: ['Rad (BDM)', 'Carlos Mendoza (VP Sales)'],
        location: 'Makati Diamond Residences',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=gcal-evt-nuvali-202',
      },
    ];
  }

  public isConfigured(): boolean {
    return this.configured;
  }

  public async listUpcomingEvents(): Promise<ComposioCalendarEvent[]> {
    if (!this.configured) {
      return [];
    }
    return [...this.events];
  }

  public async createFollowUpEvent(
    input: CreateFollowUpEventInput
  ): Promise<ComposioCalendarEvent> {
    if (!this.configured) {
      throw new Error('Calendar sync off');
    }
    const startMs = new Date(input.startTime).getTime() || Date.now();
    const endMs = startMs + input.durationMinutes * 60000;
    const created: ComposioCalendarEvent = {
      id: `gcal-followup-${this.events.length + 1}`,
      title: input.title,
      description: input.description,
      startTime: new Date(startMs).toISOString(),
      endTime: new Date(endMs).toISOString(),
      durationMinutes: input.durationMinutes,
      attendees: input.attendees.length > 0 ? input.attendees : ['Rad (BDM)'],
      location: input.location,
      htmlLink: `https://calendar.google.com/calendar/event?eid=gcal-followup-${this.events.length + 1}`,
    };
    this.events.push(created);
    return created;
  }

  public async getEventById(eventId: string): Promise<ComposioCalendarEvent | null> {
    if (!this.configured) return null;
    return this.events.find((e) => e.id === eventId) || null;
  }
}

/**
 * Links a Google Calendar event (from Composio) to a Tala Meeting object,
 * preserving title, attendees, and scheduled time.
 */
export function linkCalendarEventToMeeting(
  event: ComposioCalendarEvent,
  existingMeeting?: Meeting
): Meeting {
  if (existingMeeting) {
    return {
      ...existingMeeting,
      title: event.title || existingMeeting.title,
      participants:
        event.attendees && event.attendees.length > 0
          ? event.attendees
          : existingMeeting.participants,
      createdAt: event.startTime || existingMeeting.createdAt,
      durationSeconds: (event.durationMinutes || 45) * 60,
      calendarEventId: event.id,
      calendarEventLink: event.htmlLink,
      tags: Array.from(new Set([...existingMeeting.tags, 'Google Calendar', 'Composio Sync'])),
    };
  }

  const meetingId = `mtg-gcal-${Date.now()}`;
  return {
    id: meetingId,
    title: event.title,
    createdAt: event.startTime,
    durationSeconds: (event.durationMinutes || 45) * 60,
    channelId: 'residential-preselling',
    channelName: 'Residential Pre-selling',
    templateId: 'client-discovery',
    templateName: 'Client Property Discovery',
    participants: event.attendees.length > 0 ? event.attendees : ['Rad (BDM)'],
    language: 'fil-PH (Tagalog / English)',
    status: 'completed',
    calendarEventId: event.id,
    calendarEventLink: event.htmlLink,
    summary: {
      overview:
        event.description ||
        `Google Calendar meeting synced via Composio: ${event.title}. Location: ${
          event.location || 'Remote / Office'
        }`,
      keyDiscussionPoints: [
        `Synced from Google Calendar event (${event.id}).`,
        event.location ? `Location: ${event.location}` : 'Virtual / Office session',
        `Scheduled duration: ${event.durationMinutes} minutes.`,
      ],
      decisionsMade: ['Agenda and attendee roster linked from Google Calendar.'],
      nextSteps: ['Conduct meeting and record executive notes.'],
      realEstateMetrics: {
        location: event.location || 'Metro Manila',
        propertyType: 'Residential / Commercial Asset',
        budgetRange: 'PHP 25M - 45M',
        financingType: 'Bank',
      },
    },
    actionItems: [
      {
        id: `act-${Date.now()}-1`,
        meetingId,
        meetingTitle: event.title,
        title: `Prepare briefing deck for ${event.title}`,
        assignee: event.attendees[0] || 'Rad (BDM)',
        dueDate: event.startTime.split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'todo',
        priority: 'high',
        createdAt: new Date().toISOString(),
      },
    ],
    transcript: [
      {
        id: `utt-${Date.now()}-1`,
        speaker: event.attendees[0] || 'Rad (BDM)',
        text: `Meeting linked to Google Calendar event "${event.title}" (${new Date(
          event.startTime
        ).toLocaleString()}).`,
        startSec: 0,
        endSec: 8,
      },
    ],
    tags: ['Google Calendar', 'Composio Sync'],
  };
}

/**
 * Browser-only client functions that talk exclusively to the serverless route `/api/calendar`.
 * Local-first fallback: if `/api/calendar` is unreachable or COMPOSIO_API_KEY is absent,
 * returns `{ enabled: false, status: 'off' }` so `.ics` import continues working seamlessly.
 */
export async function fetchCalendarSyncStatus(): Promise<ComposioCalendarRouteResponse> {
  try {
    const res = await fetch('/api/calendar?action=status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: 'Calendar sync off',
      };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: 'Calendar sync off',
      };
    }
    const data = await res.json();
    return {
      enabled: Boolean(data.enabled),
      status: data.enabled ? 'active' : 'off',
      provider: 'composio',
      toolkit: 'googlecalendar',
      message: data.message || (data.enabled ? 'Calendar sync active' : 'Calendar sync off'),
    };
  } catch {
    return {
      enabled: false,
      status: 'off',
      provider: 'composio',
      toolkit: 'googlecalendar',
      message: 'Calendar sync off',
    };
  }
}

export async function fetchUpcomingCalendarEvents(
  timeMin?: string
): Promise<ComposioCalendarRouteResponse> {
  try {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'list_events', timeMin }),
    });
    if (!res.ok) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        events: [],
        message: 'Calendar sync off',
      };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        events: [],
        message: 'Calendar sync off',
      };
    }
    return await res.json();
  } catch {
    return {
      enabled: false,
      status: 'off',
      provider: 'composio',
      toolkit: 'googlecalendar',
      events: [],
      message: 'Calendar sync off',
    };
  }
}

export async function pushFollowUpCalendarEvent(
  input: CreateFollowUpEventInput
): Promise<ComposioCalendarRouteResponse> {
  try {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action: 'create_event',
        ...input,
      }),
    });
    if (!res.ok) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: 'Calendar sync off',
      };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: 'Calendar sync off',
      };
    }
    return await res.json();
  } catch {
    return {
      enabled: false,
      status: 'off',
      provider: 'composio',
      toolkit: 'googlecalendar',
      message: 'Calendar sync off',
    };
  }
}

export async function requestLinkCalendarEvent(
  eventId: string,
  meetingId: string
): Promise<ComposioCalendarRouteResponse> {
  try {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action: 'link_event',
        eventId,
        meetingId,
      }),
    });
    if (!res.ok) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: 'Calendar sync off',
      };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: 'Calendar sync off',
      };
    }
    return await res.json();
  } catch {
    return {
      enabled: false,
      status: 'off',
      provider: 'composio',
      toolkit: 'googlecalendar',
      message: 'Calendar sync off',
    };
  }
}
