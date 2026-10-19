import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Meeting, Channel, ActionItem, TalaSettings, NoteVersion, AuditLogEntry } from '../types';
import { DEFAULT_LANGUAGE_CODE } from '../languages/languages';
import {
  cloudEnabled,
  pullCloud,
  pushAll,
  mirrorMeeting,
  mirrorActionItem,
  mirrorMeetingDeleted,
  mirrorChannel,
  mirrorSettings,
  mirrorNoteVersion,
  mirrorAuditLog,
} from './cloud';

interface TalaDB extends DBSchema {
  meetings: {
    key: string;
    value: Meeting;
    indexes: {
      'by-created': string;
      'by-channel': string;
    };
  };
  channels: {
    key: string;
    value: Channel;
  };
  actionItems: {
    key: string;
    value: ActionItem;
    indexes: {
      'by-meeting': string;
      'by-status': string;
    };
  };
  versions: {
    key: string;
    value: NoteVersion;
    indexes: {
      'by-meeting': string;
      'by-timestamp': string;
    };
  };
  auditLogs: {
    key: string;
    value: AuditLogEntry;
    indexes: {
      'by-timestamp': string;
      'by-meeting': string;
    };
  };
  settings: {
    key: string;
    value: TalaSettings;
  };
}

const DB_NAME = 'tala_ai_meetings_db';
const DB_VERSION = 2;

export const DEFAULT_CHANNELS: Channel[] = [
  {
    id: 'team-sync',
    name: 'Team Syncs & Standups',
    description: 'Weekly team cadences, sprints, OKRs, and internal alignment.',
    color: '#22c55e',
    isDefault: true,
  },
  {
    id: 'client-calls',
    name: 'Client Engagements',
    description: 'Customer discovery, design reviews, feedback sessions, and project syncs.',
    color: '#3b82f6',
  },
  {
    id: 'project-planning',
    name: 'Project Planning & Strategy',
    description: 'Roadmaps, feature planning, quarterly OKRs, and technical architecture.',
    color: '#f59e0b',
  },
  {
    id: 'partners-sales',
    name: 'Sales & Partnerships',
    description: 'Prospective partner calls, vendor evaluation, and sales pipeline.',
    color: '#8b5cf6',
  },
];

export const DEFAULT_SETTINGS: TalaSettings = {
  defaultLanguage: DEFAULT_LANGUAGE_CODE,
  theme: 'dark',
  llmProvider: 'fleet',
  transcriptionProvider: 'browser_speech',
  privacyMode: true,
  retentionDays: 365,
};

let dbPromise: Promise<IDBPDatabase<TalaDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<TalaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TalaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('meetings')) {
          const meetingStore = db.createObjectStore('meetings', { keyPath: 'id' });
          meetingStore.createIndex('by-created', 'createdAt');
          meetingStore.createIndex('by-channel', 'channelId');
        }

        if (!db.objectStoreNames.contains('channels')) {
          db.createObjectStore('channels', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('actionItems')) {
          const actionStore = db.createObjectStore('actionItems', { keyPath: 'id' });
          actionStore.createIndex('by-meeting', 'meetingId');
          actionStore.createIndex('by-status', 'status');
        }

        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionStore.createIndex('by-meeting', 'meetingId');
          versionStore.createIndex('by-timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('auditLogs')) {
          const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
          auditStore.createIndex('by-timestamp', 'timestamp');
          auditStore.createIndex('by-meeting', 'meetingId');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export async function initStorage(): Promise<void> {
  const db = await getDb();

  // Seed default channels if empty
  const channelCount = await db.count('channels');
  if (channelCount === 0) {
    const tx = db.transaction('channels', 'readwrite');
    for (const ch of DEFAULT_CHANNELS) {
      await tx.store.put(ch);
    }
    await tx.done;
  }

  // Seed default settings if empty
  const settings = await db.get('settings', 'current');
  if (!settings) {
    await db.put('settings', DEFAULT_SETTINGS, 'current');
  }

  // Seed demo meetings if empty
  const meetingCount = await db.count('meetings');
  if (meetingCount === 0) {
    await seedInitialDemoMeetings();
  }

  // Cloud sync (Supabase): pull remote, merge into IndexedDB, then push
  // any local-only rows so a fresh device backfills the cloud copy.
  if (cloudEnabled()) {
    const delta = await pullCloud();
    if (delta) {
      const byId = new Map<string, Meeting>();
      const localMeetings = await db.getAll('meetings');
      for (const m of localMeetings) byId.set(m.id, m);
      let merged = 0;
      for (const remote of delta.meetings) {
        if (!remote || typeof remote.id !== 'string') continue;
        if (!byId.has(remote.id)) {
          byId.set(remote.id, remote);
          await db.put('meetings', remote);
          merged++;
        }
      }
      const localItemIds = new Set(
        (await db.getAll('actionItems')).map((a) => a.id),
      );
      for (const remote of delta.actionItems) {
        if (!remote || typeof remote.id !== 'string') continue;
        if (!localItemIds.has(remote.id)) {
          await db.put('actionItems', remote);
        }
      }
      const localChannelIds = new Set(
        (await db.getAll('channels')).map((c) => c.id),
      );
      for (const remote of delta.channels) {
        if (!remote || typeof remote.id !== 'string') continue;
        if (!localChannelIds.has(remote.id)) {
          await db.put('channels', remote);
        }
      }
      // Backfill: push any local rows the cloud is missing (covers first
      // sync AND a previous partial push that was aborted mid-flight).
      const cloudIds = new Set(delta.meetings.map((m) => m.id));
      const missing = [...byId.values()].filter((m) => !cloudIds.has(m.id));
      const cloudChannelIds = new Set(delta.channels.map((c) => c.id));
      const missingChannels = (await db.getAll('channels')).filter(
        (c) => !cloudChannelIds.has(c.id),
      );
      if (missing.length > 0 || missingChannels.length > 0 || !delta.settings) {
        const currentSettings =
          (await db.get('settings', 'current')) || DEFAULT_SETTINGS;
        await pushAll(missing, missingChannels, currentSettings);
      }
      if (merged > 0) {
        console.info(`[tala-cloud] merged ${merged} remote meeting(s)`);
      }
    }
  }
}

export async function getAllMeetings(): Promise<Meeting[]> {
  const db = await getDb();
  const meetings = await db.getAllFromIndex('meetings', 'by-created');
  return meetings.reverse(); // newest first
}

export async function getMeetingById(id: string): Promise<Meeting | undefined> {
  const db = await getDb();
  return db.get('meetings', id);
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['meetings', 'actionItems'], 'readwrite');
  await tx.objectStore('meetings').put(meeting);

  // Sync action items in actionItems store
  for (const item of meeting.actionItems) {
    await tx.objectStore('actionItems').put(item);
  }

  await tx.done;
  mirrorMeeting(meeting);
}

export async function deleteMeeting(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['meetings', 'actionItems'], 'readwrite');
  await tx.objectStore('meetings').delete(id);

  // Delete associated action items
  const actionStore = tx.objectStore('actionItems');
  const index = actionStore.index('by-meeting');
  const items = await index.getAllKeys(id);
  for (const key of items) {
    await actionStore.delete(key);
  }

  await tx.done;
  mirrorMeetingDeleted(id);
}

export async function getAllChannels(): Promise<Channel[]> {
  const db = await getDb();
  return db.getAll('channels');
}

export async function saveChannel(channel: Channel): Promise<void> {
  const db = await getDb();
  await db.put('channels', channel);
  mirrorChannel(channel);
}

export async function getAllActionItems(): Promise<ActionItem[]> {
  const db = await getDb();
  return db.getAll('actionItems');
}

export async function updateActionItemStatus(
  id: string,
  status: ActionItem['status']
): Promise<void> {
  const db = await getDb();
  const item = await db.get('actionItems', id);
  if (!item) return;

  item.status = status;
  await db.put('actionItems', item);
  mirrorActionItem(item);

  // Update in meeting record too
  const meeting = await db.get('meetings', item.meetingId);
  if (meeting) {
    const target = meeting.actionItems.find((a) => a.id === id);
    if (target) {
      target.status = status;
      await db.put('meetings', meeting);
      mirrorMeeting(meeting);
    }
  }
}

export async function getSettings(): Promise<TalaSettings> {
  const db = await getDb();
  const settings = await db.get('settings', 'current');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: TalaSettings): Promise<void> {
  const db = await getDb();
  await db.put('settings', settings, 'current');
  mirrorSettings(settings);
}

export async function saveAuditLog(entry: AuditLogEntry): Promise<void> {
  const db = await getDb();
  await db.put('auditLogs', entry);
  mirrorAuditLog(entry);
}

export async function getAllAuditLogs(): Promise<AuditLogEntry[]> {
  const db = await getDb();
  const logs = await db.getAllFromIndex('auditLogs', 'by-timestamp');
  return logs.reverse(); // newest first
}

export async function saveNoteVersion(version: NoteVersion): Promise<void> {
  const db = await getDb();
  await db.put('versions', version);
  mirrorNoteVersion(version);

  // Also sync in meeting record
  const meeting = await db.get('meetings', version.meetingId);
  if (meeting) {
    const existing = meeting.versions || [];
    meeting.versions = [version, ...existing.slice(0, 19)]; // keep up to 20 versions
    await db.put('meetings', meeting);
  }
}

export async function getNoteVersions(meetingId: string): Promise<NoteVersion[]> {
  const db = await getDb();
  const versions = await db.getAllFromIndex('versions', 'by-meeting', meetingId);
  return versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function purgeExpiredMeetings(retentionDays: number): Promise<number> {
  if (retentionDays <= 0) return 0;
  const db = await getDb();
  const all = await db.getAll('meetings');
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  let purgedCount = 0;
  for (const m of all) {
    const meetingTime = new Date(m.createdAt).getTime();
    if (meetingTime < cutoffTime) {
      await deleteMeeting(m.id);
      purgedCount++;
    }
  }

  if (purgedCount > 0) {
    await saveAuditLog({
      id: `audit-purge-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'retention_purged',
      details: `Purged ${purgedCount} meeting(s) older than ${retentionDays} day(s) retention threshold.`,
      actor: 'System Auto-Purge',
    });
  }

  return purgedCount;
}

export function searchMeetings(meetings: Meeting[], query: string, channelId?: string): Meeting[] {
  const q = query.trim().toLowerCase();
  return meetings.filter((m) => {
    if (channelId && channelId !== 'all' && m.channelId !== channelId) {
      return false;
    }

    if (!q) return true;

    // Search in title
    if (m.title.toLowerCase().includes(q)) return true;

    // Search in participants
    if (m.participants.some((p) => p.toLowerCase().includes(q))) return true;

    // Search in tags
    if (m.tags.some((t) => t.toLowerCase().includes(q))) return true;

    // Search in overview & discussion
    if (m.summary.overview.toLowerCase().includes(q)) return true;
    if (m.summary.keyDiscussionPoints.some((p) => p.toLowerCase().includes(q))) return true;
    if (m.summary.decisionsMade.some((d) => d.toLowerCase().includes(q))) return true;

    // Search in action items
    if (m.actionItems.some((a) => a.title.toLowerCase().includes(q) || a.assignee.toLowerCase().includes(q))) {
      return true;
    }

    // Search in transcript
    if (m.transcript.some((t) => t.text.toLowerCase().includes(q) || t.speaker.toLowerCase().includes(q))) {
      return true;
    }

    // Search in real estate metrics
    if (m.summary.realEstateMetrics) {
      const rem = m.summary.realEstateMetrics;
      if (rem.propertyType?.toLowerCase().includes(q)) return true;
      if (rem.location?.toLowerCase().includes(q)) return true;
      if (rem.budgetRange?.toLowerCase().includes(q)) return true;
    }

    return false;
  });
}

async function seedInitialDemoMeetings(): Promise<void> {
  const db = await getDb();

  const demoMeetings: Meeting[] = [
    {
      id: 'meeting-seed-01',
      title: 'Weekly Team Standup',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
      durationSeconds: 1200,
      channelId: 'team-sync',
      channelName: 'Team Syncs & Standups',
      templateId: 'team-standup',
      templateName: 'Team Standup',
      language: 'fil-PH',
      participants: ['Host', 'Alex Chen', 'Sam Rivera'],
      status: 'completed',
      tags: ['Engineering', 'Standup', 'Sprint', 'Internal'],
      isOffTheRecord: false,
      transcript: [
        {
          id: 'u-1',
          speaker: 'Host',
          text: 'Magandang umaga team! Let us do a quick sync on our sprint deliverables and any blockers before tomorrow deployment.',
          startSec: 0,
          endSec: 10,
        },
        {
          id: 'u-2',
          speaker: 'Alex Chen',
          text: 'Yesterday I finished the backend API caching layer and pushed database migration scripts. Today I am completing integration telemetry tests. No blockers on my end.',
          startSec: 11,
          endSec: 26,
        },
        {
          id: 'u-3',
          speaker: 'Sam Rivera',
          text: 'I finalized the dashboard revamp UI components. Currently waiting on telemetry response payload verification from backend, then I can run full verification.',
          startSec: 27,
          endSec: 41,
        },
        {
          id: 'u-4',
          speaker: 'Host',
          text: 'Great. Alex, please sync with Sam right after standup to confirm the telemetry payload schema. Let us make sure our staging environment is green before 3 PM.',
          startSec: 42,
          endSec: 55,
        },
      ],
      summary: {
        overview: 'Weekly engineering team standup covering completed backend caching migrations, frontend dashboard UI finalization, and staging deployment readiness.',
        keyDiscussionPoints: [
          'Backend API caching layer and database migration scripts successfully merged.',
          'Dashboard UI revamp completed; awaiting telemetry API contract verification.',
          'Targeting clean staging environment deployment by 3:00 PM today.',
        ],
        decisionsMade: [
          'Approved deployment schedule for staging release v2.4 at 3:00 PM.',
          'Agreed on JSON contract format for client telemetry reporting.',
        ],
        nextSteps: [
          'Alex to sync with Sam on telemetry API response schema by 11:00 AM.',
          'Sam to verify end-to-end dashboard integration on staging environment.',
          'Host to review release deployment checklist prior to change freeze.',
        ],
      },
      actionItems: [
        {
          id: 'act-1',
          meetingId: 'meeting-seed-01',
          meetingTitle: 'Weekly Team Standup',
          title: 'Deploy v2.4 staging release and verify telemetry',
          assignee: 'Alex Chen',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // tomorrow
          priority: 'high',
          status: 'in_progress',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-2',
          meetingId: 'meeting-seed-01',
          meetingTitle: 'Weekly Team Standup',
          title: 'Review Figma prototype and design tokens',
          assignee: 'Sam Rivera',
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0], // yesterday
          priority: 'medium',
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-3',
          meetingId: 'meeting-seed-01',
          meetingTitle: 'Weekly Team Standup',
          title: 'Prepare changelog notes for product release announcement',
          assignee: 'Host',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split('T')[0], // in 2 days
          priority: 'medium',
          status: 'todo',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'meeting-seed-02',
      title: 'Client Call — Website Redesign',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      durationSeconds: 1800,
      channelId: 'client-calls',
      channelName: 'Client Engagements',
      templateId: 'client-call',
      templateName: 'Client Call',
      language: 'en-US',
      participants: ['Host', 'Elena Vance', 'David Cole'],
      status: 'completed',
      tags: ['Client', 'Design', 'Milestone', 'Redesign'],
      isOffTheRecord: false,
      transcript: [
        {
          id: 'u-10',
          speaker: 'Host',
          text: 'Thank you for joining today milestone check-in Elena and David. Today we want to walk through the approved wireframes and confirm content delivery timelines.',
          startSec: 0,
          endSec: 14,
        },
        {
          id: 'u-11',
          speaker: 'Elena Vance',
          text: 'The updated brand guidelines look sharp. Our leadership reviewed the interactive mockups and approved the new navigation structure and checkout flow.',
          startSec: 15,
          endSec: 30,
        },
        {
          id: 'u-12',
          speaker: 'David Cole',
          text: 'We have the product photography and revised copy ready in our shared drive. When do you need final sign-off before frontend coding starts?',
          startSec: 31,
          endSec: 45,
        },
        {
          id: 'u-13',
          speaker: 'Host',
          text: 'We need asset delivery by Friday so engineering can begin component implementation on Monday without schedule friction.',
          startSec: 46,
          endSec: 58,
        },
      ],
      summary: {
        overview: 'Client consultation with Elena Vance and David Cole regarding the corporate website redesign. Approved navigation hierarchy, interactive checkout prototype, and scheduled asset handoffs.',
        keyDiscussionPoints: [
          'Client leadership gave formal approval on updated brand guidelines and navigation flow.',
          'Product photography and revised copy finalized in shared drive.',
          'Frontend implementation sprint scheduled to start Monday following final asset delivery.',
        ],
        decisionsMade: [
          'Approved interactive mockup and responsive mobile navigation.',
          'Confirmed Friday 5:00 PM cutoff for final photography and copy sign-off.',
        ],
        nextSteps: [
          'David to upload high-resolution asset archive to design repository by Thursday.',
          'Host to share staging environment preview link and QA feedback form.',
        ],
      },
      actionItems: [
        {
          id: 'act-10',
          meetingId: 'meeting-seed-02',
          meetingTitle: 'Client Call — Website Redesign',
          title: 'Send staging environment preview link and feedback form',
          assignee: 'Host',
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
          priority: 'high',
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-11',
          meetingId: 'meeting-seed-02',
          meetingTitle: 'Client Call — Website Redesign',
          title: 'Upload high-resolution photography and revised copy assets',
          assignee: 'David Cole',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString().split('T')[0],
          priority: 'high',
          status: 'in_progress',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'meeting-seed-03',
      title: 'Project Planning — Q4 Launch',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      durationSeconds: 2100,
      channelId: 'project-planning',
      channelName: 'Project Planning & Strategy',
      templateId: 'project-planning',
      templateName: 'Project Planning',
      language: 'en-US',
      participants: ['Host', 'Marcus Brody', 'Tanya Vance'],
      status: 'completed',
      tags: ['Planning', 'Q4', 'Roadmap', 'Strategy'],
      isOffTheRecord: false,
      transcript: [
        {
          id: 'u-20',
          speaker: 'Host',
          text: 'Welcome everyone to our Q4 roadmap session. Our focus today is locking milestone phase gates and finalizing risk mitigations.',
          startSec: 0,
          endSec: 12,
        },
        {
          id: 'u-21',
          speaker: 'Marcus Brody',
          text: 'Core onboarding workflows and analytics exports are scheduled for release candidate freeze by mid-November.',
          startSec: 13,
          endSec: 25,
        },
        {
          id: 'u-22',
          speaker: 'Tanya Vance',
          text: 'QA test suites are written for core happy paths. We need dedicated test fixtures for high-volume enterprise customer loads.',
          startSec: 26,
          endSec: 39,
        },
      ],
      summary: {
        overview: 'Comprehensive project planning and roadmap review for the Q4 product launch. Defined milestone boundaries, beta testing rollout, and security audit requirements.',
        keyDiscussionPoints: [
          'Scope locked for Q4 release: user onboarding revamp, analytics dashboard, and automated exports.',
          'Third-party security audit scheduled for late November before public release.',
          'Staged rollout strategy: 10% beta users first week, followed by full availability.',
        ],
        decisionsMade: [
          'Agreed on freeze date of November 15 for new feature commits.',
          'Selected external firm for third-party penetration testing and SOC2 compliance review.',
        ],
        nextSteps: [
          'Marcus to draft end-user beta release notes and documentation.',
          'Tanya to prepare automated regression test suites for core user journeys.',
        ],
      },
      actionItems: [
        {
          id: 'act-20',
          meetingId: 'meeting-seed-03',
          meetingTitle: 'Project Planning — Q4 Launch',
          title: 'Finalize regression test plan for Q4 launch features',
          assignee: 'Tanya Vance',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString().split('T')[0],
          priority: 'high',
          status: 'todo',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'meeting-seed-04',
      title: 'Sales Call — Prospective Partner',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      durationSeconds: 1650,
      channelId: 'partners-sales',
      channelName: 'Sales & Partnerships',
      templateId: 'sales-call',
      templateName: 'Sales/Prospect Call',
      language: 'en-US',
      participants: ['Host', 'Ryan Miller', 'Nina Patel'],
      status: 'completed',
      tags: ['Sales', 'Partnership', 'B2B', 'Enterprise'],
      isOffTheRecord: false,
      transcript: [
        {
          id: 'u-30',
          speaker: 'Host',
          text: 'Good afternoon Ryan and Nina. We are thrilled to discuss how our platforms can integrate to provide seamless meeting intelligence for enterprise teams.',
          startSec: 0,
          endSec: 15,
        },
        {
          id: 'u-31',
          speaker: 'Ryan Miller',
          text: 'Our enterprise clients have been requesting automated meeting summaries synced directly into their CRM and workflow dashboards.',
          startSec: 16,
          endSec: 30,
        },
        {
          id: 'u-32',
          speaker: 'Nina Patel',
          text: 'We are eager to review your webhook schemas and API documentation so our engineering team can test a sandbox proof of concept.',
          startSec: 31,
          endSec: 46,
        },
      ],
      summary: {
        overview: 'B2B partnership exploration with Ryan Miller and Nina Patel regarding enterprise integration and joint go-to-market initiatives.',
        keyDiscussionPoints: [
          'Identified mutual customer demand for native CRM and workflow integrations.',
          'Evaluated enterprise tier pricing model and co-marketing opportunities.',
          'Agreed to create a joint proof-of-concept for pilot enterprise accounts.',
        ],
        decisionsMade: [
          'Approved technical POC scope focusing on API webhook exchange.',
          'Scheduled follow-up commercial terms review for next Tuesday.',
        ],
        nextSteps: [
          'Host to share API authentication and sandbox endpoint documentation.',
          'Ryan to submit list of 3 pilot accounts for joint trial program.',
        ],
      },
      actionItems: [
        {
          id: 'act-30',
          meetingId: 'meeting-seed-04',
          meetingTitle: 'Sales Call — Prospective Partner',
          title: 'Send API sandbox documentation and sample webhook payload',
          assignee: 'Host',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0],
          priority: 'medium',
          status: 'todo',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ];

  const tx = db.transaction(['meetings', 'actionItems'], 'readwrite');
  for (const m of demoMeetings) {
    await tx.objectStore('meetings').put(m);
    for (const a of m.actionItems) {
      await tx.objectStore('actionItems').put(a);
    }
  }
  await tx.done;
}
