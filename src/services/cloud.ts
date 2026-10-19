/**
 * Tala cloud sync — DigitalMerch Supabase (PostgREST).
 *
 * Design:
 * - Zero-dependency: plain fetch against the PostgREST REST API.
 * - Offline-first: IndexedDB stays the primary store; this layer mirrors
 *   writes to Supabase and merges remote rows on boot (union by id,
 *   local wins on conflict so in-flight edits are never clobbered).
 * - No-op when env vars are absent (tests, local dev without .env) —
 *   every public function returns silently.
 */

import type {
  Meeting,
  Channel,
  ActionItem,
  TalaSettings,
  NoteVersion,
  AuditLogEntry,
} from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function cloudEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function headers(prefer?: string): Record<string, string> {
  const h: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) h.Prefer = prefer;
  return h;
}

async function req(
  table: string,
  init: RequestInit & { prefer?: string },
): Promise<unknown> {
  if (!cloudEnabled()) return null;
  const { prefer, ...rest } = init;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    ...rest,
    headers: { ...headers(prefer), ...(rest.headers as Record<string, string>) },
  });
  if (!res.ok) {
    // Swallow: cloud sync must never break the local-first app.
    console.warn(`[tala-cloud] ${table} ${rest.method || 'GET'} -> ${res.status}`);
    return null;
  }
  if (res.status === 204) return null;
  return res.json();
}

function iso(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ---------- write mirrors (fire-and-forget) ----------

export function mirrorMeeting(meeting: Meeting): void {
  if (!cloudEnabled()) return;
  void req('tala_meetings', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify({
      id: meeting.id,
      channel_id: meeting.channelId,
      created_at: iso(meeting.createdAt),
      updated_at: new Date().toISOString(),
      data: meeting,
    }),
  });
  for (const item of meeting.actionItems) mirrorActionItem(item);
}

export function mirrorActionItem(item: ActionItem): void {
  if (!cloudEnabled()) return;
  void req('tala_action_items', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify({
      id: item.id,
      meeting_id: item.meetingId,
      status: item.status,
      created_at: iso(item.createdAt),
      updated_at: new Date().toISOString(),
      data: item,
    }),
  });
}

export function mirrorMeetingDeleted(meetingId: string): void {
  if (!cloudEnabled()) return;
  void req(`tala_meetings?id=eq.${encodeURIComponent(meetingId)}`, { method: 'DELETE' });
  void req(`tala_action_items?meeting_id=eq.${encodeURIComponent(meetingId)}`, {
    method: 'DELETE',
  });
}

export function mirrorChannel(channel: Channel): void {
  if (!cloudEnabled()) return;
  void req('tala_channels', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify({ id: channel.id, data: channel }),
  });
}

export function mirrorSettings(settings: TalaSettings): void {
  if (!cloudEnabled()) return;
  void req('tala_settings', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify({ id: 'current', data: settings }),
  });
}

export function mirrorNoteVersion(version: NoteVersion): void {
  if (!cloudEnabled()) return;
  void req('tala_note_versions', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify({
      id: version.id,
      meeting_id: version.meetingId,
      ts: iso(version.timestamp),
      data: version,
    }),
  });
}

export function mirrorAuditLog(entry: AuditLogEntry): void {
  if (!cloudEnabled()) return;
  void req('tala_audit_logs', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify({
      id: entry.id,
      ts: iso(entry.timestamp),
      meeting_id: entry.meetingId ?? null,
      data: entry,
    }),
  });
}

// ---------- boot sync (pull remote, merge, push local-only) ----------

interface MeetingRow {
  id: string;
  data: Meeting;
}
interface ActionItemRow {
  id: string;
  data: ActionItem;
}
interface ChannelRow {
  id: string;
  data: Channel;
}
interface SettingsRow {
  id: string;
  data: TalaSettings;
}

async function pull<T>(table: string, select = 'id,data'): Promise<T[]> {
  const rows = (await req(`${table}?select=${select}`, { method: 'GET' })) as
    | T[]
    | null;
  return Array.isArray(rows) ? rows : [];
}

export interface CloudDelta {
  meetings: Meeting[];
  actionItems: ActionItem[];
  channels: Channel[];
  settings?: TalaSettings;
}

/** Pull everything from the cloud. Caller merges into IndexedDB. */
export async function pullCloud(): Promise<CloudDelta | null> {
  if (!cloudEnabled()) return null;
  try {
    const [meetingRows, itemRows, channelRows, settingsRows] = await Promise.all([
      pull<MeetingRow>('tala_meetings'),
      pull<ActionItemRow>('tala_action_items'),
      pull<ChannelRow>('tala_channels'),
      pull<SettingsRow>('tala_settings'),
    ]);
    return {
      meetings: meetingRows.map((r) => r.data),
      actionItems: itemRows.map((r) => r.data),
      channels: channelRows.map((r) => r.data),
      settings: settingsRows.find((r) => r.id === 'current')?.data,
    };
  } catch (err) {
    console.warn('[tala-cloud] pull failed', err);
    return null;
  }
}

/** Push the full local dataset (initial migration / new device backfill). */
export async function pushAll(
  meetings: Meeting[],
  channels: Channel[],
  settings: TalaSettings,
): Promise<void> {
  if (!cloudEnabled()) return;
  // Each step independently guarded: a failure in one must not skip the rest.
  try {
    if (meetings.length > 0) {
      await req('tala_meetings', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify(
          meetings.map((m) => ({
            id: m.id,
            channel_id: m.channelId,
            created_at: iso(m.createdAt),
            updated_at: new Date().toISOString(),
            data: m,
          })),
        ),
      });
    }
  } catch (err) {
    console.warn('[tala-cloud] meetings push failed', err);
  }
  try {
    const items = meetings.flatMap((m) => m.actionItems);
    if (items.length > 0) {
      await req('tala_action_items', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify(
          items.map((i) => ({
            id: i.id,
            meeting_id: i.meetingId,
            status: i.status,
            created_at: iso(i.createdAt),
            updated_at: new Date().toISOString(),
            data: i,
          })),
        ),
      });
    }
  } catch (err) {
    console.warn('[tala-cloud] action items push failed', err);
  }
  try {
    if (channels.length > 0) {
      await req('tala_channels', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify(channels.map((c) => ({ id: c.id, data: c }))),
      });
    }
  } catch (err) {
    console.warn('[tala-cloud] channels push failed', err);
  }
  try {
    await mirrorSettings(settings);
  } catch (err) {
    console.warn('[tala-cloud] settings push failed', err);
  }
}
