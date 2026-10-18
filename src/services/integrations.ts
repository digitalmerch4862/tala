import type { Meeting, WebhookConfig } from '../types';

export interface ParsedICSEvent {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  durationMinutes: number;
  location?: string;
  attendees: string[];
}

/**
 * Parses an iCalendar (.ics) string into structured meeting events
 */
export function parseICS(icsData: string): ParsedICSEvent[] {
  const events: ParsedICSEvent[] = [];
  const lines = icsData.split(/\r\n|\n|\r/);

  let inEvent = false;
  let current: Partial<ParsedICSEvent> = { attendees: [] };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Unfold wrapped lines in RFC 5545
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].slice(1);
      i++;
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      current = { attendees: [] };
      continue;
    }

    if (line.startsWith('END:VEVENT')) {
      if (inEvent && current.title) {
        events.push({
          title: current.title || 'Imported Calendar Meeting',
          description: current.description || '',
          startDate: current.startDate || new Date().toISOString(),
          endDate: current.endDate,
          durationMinutes: current.durationMinutes || 60,
          location: current.location,
          attendees: current.attendees && current.attendees.length > 0 ? current.attendees : ['Rad (BDM)'],
        });
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    if (line.startsWith('SUMMARY:')) {
      current.title = line.replace('SUMMARY:', '').trim();
    } else if (line.startsWith('DESCRIPTION:')) {
      current.description = line.replace('DESCRIPTION:', '').replace(/\\n/g, '\n').trim();
    } else if (line.startsWith('LOCATION:')) {
      current.location = line.replace('LOCATION:', '').trim();
    } else if (line.startsWith('DTSTART')) {
      const raw = line.split(':')[1] || '';
      current.startDate = parseICSDate(raw);
    } else if (line.startsWith('DTEND')) {
      const raw = line.split(':')[1] || '';
      current.endDate = parseICSDate(raw);
    } else if (line.startsWith('ATTENDEE')) {
      const match = line.match(/CN=([^;:]+)/i) || line.split(':');
      const attendeeName = match[1] ? match[1].replace(/"/g, '').trim() : '';
      if (attendeeName && !current.attendees?.includes(attendeeName)) {
        current.attendees?.push(attendeeName);
      }
    }
  }

  // Calculate duration if end date present
  for (const ev of events) {
    if (ev.startDate && ev.endDate) {
      const diffMs = new Date(ev.endDate).getTime() - new Date(ev.startDate).getTime();
      if (diffMs > 0) {
        ev.durationMinutes = Math.round(diffMs / (1000 * 60));
      }
    }
  }

  return events;
}

function parseICSDate(raw: string): string {
  // Format: YYYYMMDDTHHMMSSZ or YYYYMMDD
  if (!raw) return new Date().toISOString();
  try {
    const cleaned = raw.trim();
    if (cleaned.length >= 8) {
      const year = cleaned.slice(0, 4);
      const month = cleaned.slice(4, 6);
      const day = cleaned.slice(6, 8);
      if (cleaned.includes('T')) {
        const timePart = cleaned.split('T')[1].replace('Z', '');
        const hour = timePart.slice(0, 2) || '00';
        const min = timePart.slice(2, 4) || '00';
        const sec = timePart.slice(4, 6) || '00';
        return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`).toISOString();
      }
      return new Date(`${year}-${month}-${day}T09:00:00Z`).toISOString();
    }
  } catch {}
  return new Date().toISOString();
}

/**
 * CRM Push Export Formats (HubSpot & Salesforce compatible)
 */
export function exportToCRMJson(meeting: Meeting): string {
  const rem = meeting.summary.realEstateMetrics;
  const payload = {
    deal_properties: {
      dealname: meeting.title,
      dealstage: rem?.keyObjections?.length ? 'qualified_to_buy' : 'presentation_scheduled',
      amount: rem?.budgetRange?.replace(/[^0-9]/g, '') || '0',
      pipeline: 'real_estate_philippines',
      property_type: rem?.propertyType || 'Condominium Pre-selling',
      target_location: rem?.location || 'Metro Manila',
      financing_vehicle: rem?.financingType || 'Bank',
      broker_notes: rem?.commissionNotes || 'Standard brokerage',
      created_date: meeting.createdAt,
    },
    meeting_notes: {
      overview: meeting.summary.overview,
      discussion_points: meeting.summary.keyDiscussionPoints,
      decisions: meeting.summary.decisionsMade,
      next_steps: meeting.summary.nextSteps,
    },
    action_items: meeting.actionItems.map((a) => ({
      task: a.title,
      assignee: a.assignee,
      due_date: a.dueDate,
      status: a.status,
      priority: a.priority,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

export function exportToCRMCSV(meeting: Meeting): string {
  const rem = meeting.summary.realEstateMetrics;
  const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const headers = [
    'Deal Name',
    'Date',
    'Location',
    'Property Type',
    'Budget Range',
    'Financing Type',
    'Participants',
    'Overview',
    'Decisions',
    'Pending Tasks',
  ].join(',');

  const pendingTasks = meeting.actionItems
    .filter((a) => a.status !== 'completed')
    .map((a) => `${a.title} (${a.assignee})`)
    .join('; ');

  const row = [
    escapeCsv(meeting.title),
    escapeCsv(new Date(meeting.createdAt).toLocaleDateString()),
    escapeCsv(rem?.location || 'BGC / Taguig'),
    escapeCsv(rem?.propertyType || 'Residential'),
    escapeCsv(rem?.budgetRange || 'PHP 25M - 35M'),
    escapeCsv(rem?.financingType || 'Bank'),
    escapeCsv(meeting.participants.join(', ')),
    escapeCsv(meeting.summary.overview),
    escapeCsv(meeting.summary.decisionsMade.join('; ')),
    escapeCsv(pendingTasks),
  ].join(',');

  return `${headers}\n${row}`;
}

/**
 * Dispatch meeting payload to user-configured Webhook
 */
export async function dispatchWebhook(
  config: WebhookConfig,
  meeting: Meeting
): Promise<{ success: boolean; status: number; message: string }> {
  if (!config.url || !config.enabled) {
    return {
      success: false,
      status: 400,
      message: 'Webhook URL is missing or webhook is currently disabled in Settings.',
    };
  }

  try {
    const payload = JSON.parse(exportToCRMJson(meeting));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tala-Event': 'meeting.summary.ready',
      'X-Tala-Meeting-Id': meeting.id,
    };

    if (config.secretHeader && config.secretToken) {
      headers[config.secretHeader] = config.secretToken;
    }

    const res = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return {
      success: res.ok,
      status: res.status,
      message: res.ok
        ? `Successfully pushed meeting deal payload to webhook (HTTP ${res.status}).`
        : `Webhook server responded with HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      message: `Failed to dispatch webhook: ${err.message || err}`,
    };
  }
}

/**
 * Notion / Confluence formatted export
 */
export function exportToNotionMarkdown(meeting: Meeting): string {
  let md = `# 🏛️ ${meeting.title}\n\n`;
  md += `> **Channel**: ${meeting.channelName} | **Template**: ${meeting.templateName} | **Date**: ${new Date(meeting.createdAt).toLocaleDateString()}\n`;
  md += `> **Participants**: ${meeting.participants.map((p) => `@${p}`).join(' ')}\n\n`;

  if (meeting.summary.realEstateMetrics) {
    const rem = meeting.summary.realEstateMetrics;
    md += `### 🏢 Deal Card\n`;
    md += `| Attribute | Details |\n|---|---|\n`;
    if (rem.propertyType) md += `| Property Type | ${rem.propertyType} |\n`;
    if (rem.location) md += `| Location | ${rem.location} |\n`;
    if (rem.budgetRange) md += `| Budget / TCP | **${rem.budgetRange}** |\n`;
    if (rem.financingType) md += `| Financing | ${rem.financingType} |\n\n`;
  }

  md += `### 📌 Executive Summary\n${meeting.summary.overview}\n\n`;

  md += `### 💡 Key Discussion Points\n`;
  meeting.summary.keyDiscussionPoints.forEach((p) => {
    md += `- [ ] ${p}\n`;
  });
  md += '\n';

  md += `### ✅ Agreed Decisions\n`;
  meeting.summary.decisionsMade.forEach((d) => {
    md += `- **${d}**\n`;
  });
  md += '\n';

  md += `### 📋 Action Items Tracker\n`;
  meeting.actionItems.forEach((a) => {
    md += `- [${a.status === 'completed' ? 'x' : ' '}] **${a.title}** 👤 ${a.assignee} 📅 Due: ${a.dueDate} ⚡ Priority: ${a.priority}\n`;
  });

  return md;
}

/**
 * Explicit "Needs Keys" Adapter Interfaces
 * Required by brief: Declare clean interface, config, test with fake; say so in UI and README.
 */
export interface NeedsKeysAdapterStatus {
  adapterId: 'hubspot-crm' | 'salesforce-crm' | 'meeting-bots';
  name: string;
  isConfigured: boolean;
  missingCredentials: string[];
  setupInstructions: string;
}

export const COMPOSIO_CALENDAR_ADAPTER_SPEC = {
  adapterId: 'composio-google-calendar',
  name: 'Google Calendar Two-Way Sync (Composio)',
  route: '/api/calendar',
  toolkit: 'googlecalendar',
  envVarName: 'COMPOSIO_API_KEY',
  description:
    'Server-side Google Calendar sync powered by Composio (`googlecalendar` toolkit) via `/api/calendar`. When `COMPOSIO_API_KEY` is absent, UI shows "Calendar sync off" and local-first `.ics` import remains active.',
};

export const NEEDS_KEYS_ADAPTERS: NeedsKeysAdapterStatus[] = [
  {
    adapterId: 'hubspot-crm',
    name: 'HubSpot Live Bi-Directional CRM Sync',
    isConfigured: false,
    missingCredentials: ['HUBSPOT_ACCESS_TOKEN', 'HUBSPOT_PORTAL_ID'],
    setupInstructions:
      'Requires a private app access token in HubSpot Developer Portal with crm.objects.deals.write and crm.objects.contacts.write permissions.',
  },
  {
    adapterId: 'salesforce-crm',
    name: 'Salesforce Opportunity & Contact Live Push',
    isConfigured: false,
    missingCredentials: ['SALESFORCE_CONSUMER_KEY', 'SALESFORCE_CONSUMER_SECRET'],
    setupInstructions:
      'Requires a Connected App in Salesforce Setup with OAuth Enabled and api, refresh_token scopes.',
  },
  {
    adapterId: 'meeting-bots',
    name: 'Google Meet & MS Teams In-Call Notetaker Bot',
    isConfigured: false,
    missingCredentials: ['AZURE_BOT_APP_ID', 'GOOGLE_WORKSPACE_SERVICE_ACCOUNT'],
    setupInstructions:
      'Requires headless Chromium bot infrastructure or Azure Communications Services bot registration to automatically join meeting URLs.',
  },
];
