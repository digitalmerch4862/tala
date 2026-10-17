import { describe, it, expect, vi } from 'vitest';
import {
  parseICS,
  exportToCRMJson,
  exportToCRMCSV,
  dispatchWebhook,
  exportToNotionMarkdown,
  NEEDS_KEYS_ADAPTERS,
} from '../services/integrations';
import { Meeting, WebhookConfig } from '../types';

describe('Integrations Service', () => {
  const sampleMeeting: Meeting = {
    id: 'm-sample-123',
    title: 'Acme Property Acquisition Review',
    createdAt: '2026-10-17T09:00:00.000Z',
    durationSeconds: 1800,
    channelId: 'ch-acquisitions',
    channelName: 'Acquisitions',
    templateId: 'tpl-commercial-real-estate',
    templateName: 'Commercial Real Estate Acquisition',
    participants: ['Rad (BDM)', 'John (Investor)', 'Maria (Legal)'],
    summary: {
      overview: 'High-level review of Makati office building acquisition.',
      keyDiscussionPoints: [
        'Zoning permits are verified by Taguig City hall.',
        'CAPEX allocation approved at PHP 45M.'
      ],
      decisionsMade: [
        'Proceed with formal Letter of Intent (LOI) submission.',
        'Escrow account opening by Friday.'
      ],
      nextSteps: [
        'Draft SPA with legal team.',
        'Schedule technical building inspection.'
      ],
      realEstateMetrics: {
        propertyType: 'Commercial Office Building',
        location: 'Makati CBD',
        budgetRange: 'PHP 45,000,000',
        financingType: 'Bank',
        commissionNotes: '3% standard buyer broker split',
      },
    },
    actionItems: [
      {
        id: 'act-1',
        meetingId: 'm-sample-123',
        meetingTitle: 'Acme Property Acquisition Review',
        title: 'Submit Letter of Intent to Seller',
        assignee: 'Rad (BDM)',
        dueDate: '2026-10-20',
        status: 'todo',
        priority: 'high',
        createdAt: '2026-10-17T09:00:00.000Z',
      },
      {
        id: 'act-2',
        meetingId: 'm-sample-123',
        meetingTitle: 'Acme Property Acquisition Review',
        title: 'Review Title and Encumbrances',
        assignee: 'Maria (Legal)',
        dueDate: '2026-10-22',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2026-10-17T09:00:00.000Z',
      },
    ],
    transcript: [
      {
        id: 'utt-1',
        speaker: 'Rad (BDM)',
        text: 'Welcome everyone, let us finalize our offer terms today.',
        startSec: 15,
        endSec: 25,
      },
    ],
    status: 'completed',
    language: 'fil-PH (Tagalog / English)',
    tags: ['Acquisitions', 'Makati', 'High Priority'],
  };

  describe('ICS Calendar Import Parser', () => {
    it('should parse standard RFC 5545 ICS calendar content', () => {
      const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tala AI//Calendar//EN
BEGIN:VEVENT
UID:evt-20261017-001@tala.ai
SUMMARY:BGC Prime Tower Due Diligence Meeting
DESCRIPTION:Executive review with land owners and appraisal surveyors.
LOCATION:Taguig City, Metro Manila
DTSTART:20261020T090000Z
DTEND:20261020T100000Z
ATTENDEE;CN=Rad BDM:mailto:rad@dmerch.ph
ATTENDEE;CN=Atty Santos:mailto:santos@legal.ph
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(ics);
      expect(events.length).toBe(1);
      expect(events[0].title).toBe('BGC Prime Tower Due Diligence Meeting');
      expect(events[0].description).toBe('Executive review with land owners and appraisal surveyors.');
      expect(events[0].location).toBe('Taguig City, Metro Manila');
      expect(events[0].startDate).toBe('2026-10-20T09:00:00.000Z');
      expect(events[0].endDate).toBe('2026-10-20T10:00:00.000Z');
      expect(events[0].durationMinutes).toBe(60);
      expect(events[0].attendees).toEqual(['Rad BDM', 'Atty Santos']);
    });

    it('should handle multi-event ICS calendar content', () => {
      const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Meeting One
DTSTART:20261020T090000Z
END:VEVENT
BEGIN:VEVENT
SUMMARY:Meeting Two
DTSTART:20261021T140000Z
END:VEVENT
END:VCALENDAR`;

      const events = parseICS(ics);
      expect(events.length).toBe(2);
      expect(events[0].title).toBe('Meeting One');
      expect(events[1].title).toBe('Meeting Two');
    });
  });

  describe('CRM Export', () => {
    it('should export meeting to CRM formatted JSON', () => {
      const jsonStr = exportToCRMJson(sampleMeeting);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.deal_properties.dealname).toBe('Acme Property Acquisition Review');
      expect(parsed.deal_properties.target_location).toBe('Makati CBD');
      expect(parsed.deal_properties.amount).toBe('45000000');
      expect(parsed.meeting_notes.overview).toBe(sampleMeeting.summary.overview);
      expect(parsed.action_items.length).toBe(2);
      expect(parsed.action_items[0].task).toBe('Submit Letter of Intent to Seller');
    });

    it('should export action items to CRM formatted CSV', () => {
      const csvStr = exportToCRMCSV(sampleMeeting);
      const lines = csvStr.split('\n');

      expect(lines[0]).toBe('Deal Name,Date,Location,Property Type,Budget Range,Financing Type,Participants,Overview,Decisions,Pending Tasks');
      expect(lines.length).toBe(2);
      expect(lines[1]).toContain('Acme Property Acquisition Review');
      expect(lines[1]).toContain('Makati CBD');
      expect(lines[1]).toContain('Commercial Office Building');
    });
  });

  describe('Webhook Dispatcher', () => {
    it('should successfully dispatch webhook payload via fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
      globalThis.fetch = mockFetch;

      const webhookConfig: WebhookConfig = {
        enabled: true,
        url: 'https://webhook.site/test-hook',
        secretHeader: 'X-Tala-Signature',
        secretToken: 'secret-token-123'
      };

      const result = await dispatchWebhook(webhookConfig, sampleMeeting);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://webhook.site/test-hook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Tala-Event': 'meeting.summary.ready',
            'X-Tala-Meeting-Id': sampleMeeting.id,
            'X-Tala-Signature': 'secret-token-123'
          })
        })
      );
    });

    it('should handle disabled or missing webhook configuration gracefully', async () => {
      const disabledConfig: WebhookConfig = {
        enabled: false,
        url: 'https://webhook.site/test-hook'
      };

      const result = await dispatchWebhook(disabledConfig, sampleMeeting);
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toContain('disabled');
    });
  });

  describe('Notion and Confluence Markdown Export', () => {
    it('should format meeting into structured Notion/Confluence Markdown', () => {
      const md = exportToNotionMarkdown(sampleMeeting);

      expect(md).toContain('# 🏛️ Acme Property Acquisition Review');
      expect(md).toContain('> **Channel**: Acquisitions');
      expect(md).toContain('### 📌 Executive Summary');
      expect(md).toContain('### 💡 Key Discussion Points');
      expect(md).toContain('### ✅ Agreed Decisions');
      expect(md).toContain('### 📋 Action Items Tracker');
      expect(md).toContain('- [ ] **Submit Letter of Intent to Seller**');
      expect(md).toContain('### 🏢 Deal Card');
      expect(md).toContain('Makati CBD');
    });
  });

  describe('Needs Keys & Composio Adapters Specification', () => {
    it('should replace Google OAuth needs_keys with Composio spec and declare remaining 3 live sync integrations clearly as needs_keys', () => {
      expect(NEEDS_KEYS_ADAPTERS.length).toBe(3);

      const hubspot = NEEDS_KEYS_ADAPTERS.find((a) => a.adapterId === 'hubspot-crm');
      expect(hubspot).toBeDefined();
      expect(hubspot?.isConfigured).toBe(false);
      expect(hubspot?.missingCredentials).toContain('HUBSPOT_ACCESS_TOKEN');

      const salesforce = NEEDS_KEYS_ADAPTERS.find((a) => a.adapterId === 'salesforce-crm');
      expect(salesforce).toBeDefined();
      expect(salesforce?.isConfigured).toBe(false);

      const meetingBot = NEEDS_KEYS_ADAPTERS.find((a) => a.adapterId === 'meeting-bots');
      expect(meetingBot).toBeDefined();
      expect(meetingBot?.isConfigured).toBe(false);
    });
  });
});
