import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler, { handleCalendarApiRequest } from '../../api/calendar';
import {
  FakeComposioCalendarAdapter,
  ServerComposioCalendarAdapter,
  linkCalendarEventToMeeting,
  ComposioCalendarRouteResponse,
} from '../services/composioCalendar';

describe('Composio Google Calendar Serverless Route & Adapter', () => {
  beforeEach(() => {
    delete process.env.COMPOSIO_API_KEY;
  });

  it('returns Calendar sync off when COMPOSIO_API_KEY is absent', async () => {
    const res = await handleCalendarApiRequest({
      method: 'GET',
      query: { action: 'status' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.enabled).toBe(false);
    expect(res.body.status).toBe('off');
    expect(res.body.message).toBe('Calendar sync off');
  });

  it('lists upcoming events via FakeComposioCalendarAdapter on /api/calendar', async () => {
    const fakeAdapter = new FakeComposioCalendarAdapter(true);
    const res = await handleCalendarApiRequest(
      {
        method: 'POST',
        body: { action: 'list_events' },
      },
      fakeAdapter
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.enabled).toBe(true);
    expect(res.body.status).toBe('active');
    expect(res.body.events).toBeDefined();
    expect(res.body.events?.length).toBeGreaterThanOrEqual(2);
    expect(res.body.events?.[0].title).toContain('Ayala Land Premier');
  });

  it('creates a follow-up meeting event via FakeComposioCalendarAdapter on /api/calendar', async () => {
    const fakeAdapter = new FakeComposioCalendarAdapter(true);
    const res = await handleCalendarApiRequest(
      {
        method: 'POST',
        body: {
          action: 'create_event',
          title: 'Follow-up: Shang Residences BGC — Contract Signing',
          description: 'Review carried-over reservation agreement items.',
          startTime: '2026-10-28T10:00:00.000Z',
          durationMinutes: 45,
          attendees: ['Rad (BDM)', 'Atty. Marco Tan'],
          location: 'Shangri-La at the Fort, BGC',
        },
      },
      fakeAdapter
    );

    expect(res.statusCode).toBe(201);
    expect(res.body.enabled).toBe(true);
    expect(res.body.event).toBeDefined();
    expect(res.body.event?.title).toBe('Follow-up: Shang Residences BGC — Contract Signing');
    expect(res.body.event?.attendees).toEqual(['Rad (BDM)', 'Atty. Marco Tan']);
    expect(res.body.event?.durationMinutes).toBe(45);
  });

  it('links a calendar event to a Tala meeting via /api/calendar link_event action', async () => {
    const fakeAdapter = new FakeComposioCalendarAdapter(true);
    const res = await handleCalendarApiRequest(
      {
        method: 'POST',
        body: {
          action: 'link_event',
          eventId: 'gcal-evt-bgc-101',
          meetingId: 'mtg-local-999',
        },
      },
      fakeAdapter
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.linkedMeeting).toBeDefined();
    expect(res.body.linkedMeeting?.meetingId).toBe('mtg-local-999');
    expect(res.body.linkedMeeting?.calendarEventId).toBe('gcal-evt-bgc-101');
    expect(res.body.linkedMeeting?.title).toContain('Ayala Land Premier');
    expect(res.body.linkedMeeting?.attendees).toContain('Atty. Marco Tan');
  });

  it('maps Composio event title, attendees, and time into a Tala Meeting record', () => {
    const fakeAdapter = new FakeComposioCalendarAdapter(true);
    return fakeAdapter.listUpcomingEvents().then((events) => {
      const linked = linkCalendarEventToMeeting(events[0]);
      expect(linked.title).toBe(events[0].title);
      expect(linked.participants).toEqual(events[0].attendees);
      expect(linked.createdAt).toBe(events[0].startTime);
      expect(linked.calendarEventId).toBe('gcal-evt-bgc-101');
      expect(linked.tags).toContain('Composio Sync');
    });
  });

  it('executes Vercel default handler and formats JSON response', async () => {
    let statusCode = 0;
    let jsonPayload: ComposioCalendarRouteResponse | null = null;

    await handler(
      { method: 'GET', query: { action: 'status' } },
      {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(payload: ComposioCalendarRouteResponse) {
          jsonPayload = payload;
        },
      }
    );

    expect(statusCode).toBe(200);
    expect(jsonPayload).not.toBeNull();
    expect((jsonPayload as unknown as ComposioCalendarRouteResponse).status).toBe('off');
  });

  it('ServerComposioCalendarAdapter calls GOOGLECALENDAR_FIND_EVENT and GOOGLECALENDAR_CREATE_EVENT via fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          items: [
            {
              id: 'composio-live-1',
              summary: 'BGC Executive Portfolio Sync',
              description: 'Quarterly portfolio review',
              start: { dateTime: '2026-10-30T08:00:00.000Z' },
              end: { dateTime: '2026-10-30T09:00:00.000Z' },
              attendees: [{ displayName: 'Rad (BDM)' }, { email: 'client@ayala.ph' }],
              location: 'BGC Taguig',
            },
          ],
        },
      }),
    });
    globalThis.fetch = mockFetch;

    const adapter = new ServerComposioCalendarAdapter('test-env-placeholder', 'https://backend.composio.dev/api/v2');
    expect(adapter.isConfigured()).toBe(true);

    const events = await adapter.listUpcomingEvents();
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('BGC Executive Portfolio Sync');
    expect(events[0].attendees).toEqual(['Rad (BDM)', 'client@ayala.ph']);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://backend.composio.dev/api/v2/actions/GOOGLECALENDAR_FIND_EVENT/execute',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
