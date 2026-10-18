import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Meeting, Channel, ActionItem, TalaSettings, NoteVersion, AuditLogEntry } from '../types';
import { DEFAULT_LANGUAGE_CODE } from '../languages/languages';

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
    id: 'residential-preselling',
    name: 'Residential Pre-selling',
    description: 'High-end condos, townhouses, and masterplanned communities in Metro Manila & Cebu.',
    color: '#22c55e',
    isDefault: true,
  },
  {
    id: 'commercial-land',
    name: 'Commercial & Land Deals',
    description: 'Commercial leasing, office spaces, warehouses, and raw land parcels.',
    color: '#3b82f6',
  },
  {
    id: 'broker-network',
    name: 'Broker & Agent Network',
    description: 'Accreditation meetings, sales briefings, commission alignment, and incentives.',
    color: '#f59e0b',
  },
  {
    id: 'executive-internal',
    name: 'Executive & Strategic Syncs',
    description: 'Business development pipeline, quarterly OKRs, and partner board reviews.',
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
}

export async function getAllChannels(): Promise<Channel[]> {
  const db = await getDb();
  return db.getAll('channels');
}

export async function saveChannel(channel: Channel): Promise<void> {
  const db = await getDb();
  await db.put('channels', channel);
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

  // Update in meeting record too
  const meeting = await db.get('meetings', item.meetingId);
  if (meeting) {
    const target = meeting.actionItems.find((a) => a.id === id);
    if (target) {
      target.status = status;
      await db.put('meetings', meeting);
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
}

export async function saveAuditLog(entry: AuditLogEntry): Promise<void> {
  const db = await getDb();
  await db.put('auditLogs', entry);
}

export async function getAllAuditLogs(): Promise<AuditLogEntry[]> {
  const db = await getDb();
  const logs = await db.getAllFromIndex('auditLogs', 'by-timestamp');
  return logs.reverse(); // newest first
}

export async function saveNoteVersion(version: NoteVersion): Promise<void> {
  const db = await getDb();
  await db.put('versions', version);

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
      title: 'Shang Residences BGC — Client Discovery with Atty. Marco & Sarah Tan',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      durationSeconds: 1540,
      channelId: 'residential-preselling',
      channelName: 'Residential Pre-selling',
      templateId: 'client-discovery',
      templateName: 'Client Property Discovery',
      language: 'fil-PH',
      participants: ['Rad (BDM)', 'Atty. Marco Tan', 'Sarah Tan'],
      status: 'completed',
      tags: ['BGC', 'Luxury Condo', 'Pre-selling', 'High Net Worth'],
      isOffTheRecord: false,
      transcript: [
        {
          id: 'u-1',
          speaker: 'Rad (BDM)',
          text: 'Magandang hapon Atty. Marco and Ms. Sarah! Thank you for taking the time to meet today. To start, could you share what made you consider looking at Bonifacio Global City properties for your next investment?',
          startSec: 0,
          endSec: 12,
        },
        {
          id: 'u-2',
          speaker: 'Atty. Marco Tan',
          text: 'Good afternoon Rad. Well, we have two kids who will be attending university in Manila soon, but primarily Sarah and I want a high-yield asset that preserves capital and has proven rental demand from multinational expats in BGC.',
          startSec: 13,
          endSec: 28,
        },
        {
          id: 'u-3',
          speaker: 'Sarah Tan',
          text: 'Yes, we are looking at 2-Bedroom or Junior 3-Bedroom units, minimum 95 square meters. We prefer a corner unit with an unobstructed view of the Manila Golf Course or Bonifacio High Street.',
          startSec: 29,
          endSec: 42,
        },
        {
          id: 'u-4',
          speaker: 'Rad (BDM)',
          text: 'Understood. That fits Shang Residences at Wack Wack and the newer Aurelia / Shang Residences BGC portfolio perfectly. In terms of investment budget and equity schedule, what total contract price (TCP) range are you targeting?',
          startSec: 43,
          endSec: 57,
        },
        {
          id: 'u-5',
          speaker: 'Atty. Marco Tan',
          text: 'Our budget envelope is around PHP 32M to PHP 40M. We are very comfortable with a 30% downpayment stretched over 36 months pre-selling equity, then bank financing or spot cash balance upon turnover.',
          startSec: 58,
          endSec: 74,
        },
        {
          id: 'u-6',
          speaker: 'Rad (BDM)',
          text: 'Excellent. I have exclusive developer allocations on Tower 2 corner 2BR with parking. I will prepare the sample computation sheet and arrange a private showroom visit for this Saturday morning.',
          startSec: 75,
          endSec: 90,
        },
      ],
      summary: {
        overview: 'Productive client discovery meeting with Atty. Marco and Sarah Tan regarding a pre-selling luxury 2-Bedroom corner unit in BGC. The clients seek a capital preservation and expat rental yield asset with a flexible 36-month equity term.',
        keyDiscussionPoints: [
          'Clients targeting high-end luxury corner 2BR/3BR units (min. 95 sqm) overlooking Manila Golf or High Street.',
          'Primary motivation is dual-purpose: future children university residence and expat rental income.',
          'Comfortable with 30% equity spread over 36 months pre-selling term; balance via bank financing or spot cash.',
        ],
        decisionsMade: [
          'Agreed to focus on Shang Residences BGC and Aurelia portfolio inventory.',
          'Scheduled private showroom tripping for this coming Saturday at 10:00 AM.',
        ],
        nextSteps: [
          'Rad to send official developer computation sheet for Tower 2 corner units by Thursday.',
          'Rad to pre-register Atty. and Mrs. Tan for VIP showroom pass and parking.',
          'Atty. Tan to review proposed payment terms with family wealth manager.',
        ],
        realEstateMetrics: {
          propertyType: '2-Bedroom Luxury Corner Condo',
          location: 'Bonifacio Global City (BGC), Taguig',
          budgetRange: 'PHP 32M - PHP 40M',
          financingType: 'Bank',
          targetTurnover: 'Q4 2028',
          keyObjections: ['Wants guaranteed unblocked golf course view', 'Must include 2 tandem parking slots'],
        },
      },
      actionItems: [
        {
          id: 'act-1',
          meetingId: 'meeting-seed-01',
          meetingTitle: 'Shang Residences BGC — Client Discovery with Atty. Marco & Sarah Tan',
          title: 'Prepare official Tower 2 2BR computation sheet (30/70 bank scheme)',
          assignee: 'Rad (BDM)',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // tomorrow
          priority: 'high',
          status: 'todo',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-2',
          meetingId: 'meeting-seed-01',
          meetingTitle: 'Shang Residences BGC — Client Discovery with Atty. Marco & Sarah Tan',
          title: 'Confirm Saturday 10:00 AM VIP showroom appointment with developer sales director',
          assignee: 'Rad (BDM)',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split('T')[0], // in 2 days
          priority: 'high',
          status: 'in_progress',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-3',
          meetingId: 'meeting-seed-01',
          meetingTitle: 'Shang Residences BGC — Client Discovery with Atty. Marco & Sarah Tan',
          title: 'Consult family wealth manager on bank financing pre-approval letter',
          assignee: 'Atty. Marco Tan',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString().split('T')[0],
          priority: 'medium',
          status: 'todo',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'meeting-seed-02',
      title: 'Nuvali Commercial Lot & Vermosa Tripping — Broker Partner Briefing',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      durationSeconds: 1980,
      channelId: 'broker-network',
      channelName: 'Broker & Agent Network',
      templateId: 'developer-broker-alignment',
      templateName: 'Developer & Broker Alignment',
      language: 'en-US',
      participants: ['Rad (BDM)', 'Broker Director Carlos Ramos', 'Senior Realty Assoc'],
      status: 'completed',
      tags: ['Nuvali', 'Vermosa', 'Commercial Lot', 'Broker Incentives'],
      isOffTheRecord: false,
      transcript: [
        {
          id: 'u-10',
          speaker: 'Rad (BDM)',
          text: 'Good morning Carlos. We are seeing unprecedented demand for commercial lots along the CALAX corridor, especially in Nuvali and Ayala Vermosa estate. Today we want to lock down our broker partnership tiers for Q4.',
          startSec: 0,
          endSec: 15,
        },
        {
          id: 'u-11',
          speaker: 'Broker Director Carlos Ramos',
          text: 'Hi Rad. Our network of corporate retail buyers and institutional clinic operators have active mandates for 1,000 to 2,500 sqm commercial parcels. What is the commission rate and payment guarantee for direct broker closings this quarter?',
          startSec: 16,
          endSec: 32,
        },
        {
          id: 'u-12',
          speaker: 'Rad (BDM)',
          text: 'For direct closings above PHP 100M gross volume, we offer 4.5% commission with a 50% advance release upon 10% cleared downpayment and approved buyer reservation agreement. Plus an international incentive trip to Tokyo for top producers.',
          startSec: 33,
          endSec: 50,
        },
      ],
      summary: {
        overview: 'Strategic broker network alignment session with Carlos Ramos regarding commercial land parcels in Nuvali and Vermosa. Agreed on tiered commission incentives (4.5% + Tokyo incentive trip) and dedicated inventory blocks for corporate buyers.',
        keyDiscussionPoints: [
          'High demand along CALAX corridor for commercial lots between 1,000 sqm and 2,500 sqm.',
          'Commission structure confirmed at 4.5% with expedited 50% advance release on 10% cleared equity.',
          'Quarterly incentive campaign: Tokyo trip for brokerage teams exceeding PHP 120M sales volume.',
        ],
        decisionsMade: [
          'Reserved priority option on Commercial Blocks 4 and 7 for Carlos Ramos Realty clients until end of month.',
          'Finalized marketing co-op budget for targeted digital campaigns targeting clinic operators.',
        ],
        nextSteps: [
          'Rad to provide updated cadastral lot maps and master deed restrictions for Block 4 & 7.',
          'Carlos to submit list of 5 accredited buyers for formal LOI endorsement.',
        ],
        realEstateMetrics: {
          propertyType: 'Commercial Lot & Estate Parcel',
          location: 'Nuvali, Santa Rosa & Vermosa, Cavite',
          budgetRange: 'PHP 85M - PHP 160M',
          financingType: 'Cash / Spot',
          commissionNotes: '4.5% standard + 50% advance on 10% cleared equity',
        },
      },
      actionItems: [
        {
          id: 'act-10',
          meetingId: 'meeting-seed-02',
          meetingTitle: 'Nuvali Commercial Lot & Vermosa Tripping — Broker Partner Briefing',
          title: 'Send cadastral lot layout and zoning guideline PDF to Carlos Ramos',
          assignee: 'Rad (BDM)',
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
          priority: 'high',
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act-11',
          meetingId: 'meeting-seed-02',
          meetingTitle: 'Nuvali Commercial Lot & Vermosa Tripping — Broker Partner Briefing',
          title: 'Submit top 5 LOI client endorsements for Nuvali Block 4 commercial lot',
          assignee: 'Broker Director Carlos Ramos',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
          priority: 'high',
          status: 'in_progress',
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
