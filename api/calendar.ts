import { ServerComposioCalendarAdapter } from '../src/services/composioCalendar';
import type { ComposioToolkitAdapter, ComposioCalendarRouteResponse } from '../src/services/composioCalendar';

export interface ServerlessRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
}

export interface ServerlessResponse {
  status(code: number): ServerlessResponse;
  json(payload: ComposioCalendarRouteResponse): void;
  setHeader?(name: string, value: string): void;
}

/**
 * Core route handler logic for `/api/calendar`.
 * Reads `COMPOSIO_API_KEY` from server environment when no custom adapter is injected.
 */
export async function handleCalendarApiRequest(
  req: ServerlessRequest,
  injectedAdapter?: ComposioToolkitAdapter
): Promise<{ statusCode: number; body: ComposioCalendarRouteResponse }> {
  const apiKey =
    typeof process !== 'undefined' && process.env ? process.env.COMPOSIO_API_KEY : undefined;
  const adapter = injectedAdapter || new ServerComposioCalendarAdapter(apiKey);

  if (!adapter.isConfigured()) {
    return {
      statusCode: 200,
      body: {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        events: [],
        message: 'Calendar sync off',
      },
    };
  }

  const method = (req.method || 'GET').toUpperCase();
  const parsedBody =
    typeof req.body === 'string' && req.body.trim().startsWith('{')
      ? JSON.parse(req.body)
      : req.body || {};

  const queryAction = Array.isArray(req.query?.action)
    ? req.query?.action[0]
    : req.query?.action;
  const action = parsedBody.action || queryAction || (method === 'GET' ? 'status' : '');

  try {
    if (action === 'status') {
      return {
        statusCode: 200,
        body: {
          enabled: true,
          status: 'active',
          provider: 'composio',
          toolkit: 'googlecalendar',
          message: 'Calendar sync active',
        },
      };
    }

    if (action === 'list_events' || action === 'list') {
      const events = await adapter.listUpcomingEvents({
        timeMin: parsedBody.timeMin,
        maxResults: parsedBody.maxResults,
      });
      return {
        statusCode: 200,
        body: {
          enabled: true,
          status: 'active',
          provider: 'composio',
          toolkit: 'googlecalendar',
          events,
          message: `Loaded ${events.length} upcoming event(s)`,
        },
      };
    }

    if (action === 'create_event') {
      if (!parsedBody.title || !parsedBody.startTime) {
        return {
          statusCode: 400,
          body: {
            enabled: true,
            status: 'active',
            provider: 'composio',
            toolkit: 'googlecalendar',
            message: 'Missing required fields: title and startTime',
          },
        };
      }

      const created = await adapter.createFollowUpEvent({
        title: String(parsedBody.title),
        description: String(parsedBody.description || ''),
        startTime: String(parsedBody.startTime),
        durationMinutes: Number(parsedBody.durationMinutes) || 45,
        attendees: Array.isArray(parsedBody.attendees) ? parsedBody.attendees : ['Rad (BDM)'],
        location: parsedBody.location ? String(parsedBody.location) : undefined,
      });

      return {
        statusCode: 201,
        body: {
          enabled: true,
          status: 'active',
          provider: 'composio',
          toolkit: 'googlecalendar',
          event: created,
          message: 'Follow-up event created on Google Calendar',
        },
      };
    }

    if (action === 'link_event') {
      const eventId = String(parsedBody.eventId || '');
      const meetingId = String(parsedBody.meetingId || `mtg-${Date.now()}`);
      if (!eventId) {
        return {
          statusCode: 400,
          body: {
            enabled: true,
            status: 'active',
            provider: 'composio',
            toolkit: 'googlecalendar',
            message: 'Missing required field: eventId',
          },
        };
      }

      const found = await adapter.getEventById(eventId);
      if (!found) {
        return {
          statusCode: 404,
          body: {
            enabled: true,
            status: 'active',
            provider: 'composio',
            toolkit: 'googlecalendar',
            message: `Calendar event ${eventId} not found`,
          },
        };
      }

      return {
        statusCode: 200,
        body: {
          enabled: true,
          status: 'active',
          provider: 'composio',
          toolkit: 'googlecalendar',
          event: found,
          linkedMeeting: {
            meetingId,
            calendarEventId: found.id,
            title: found.title,
            attendees: found.attendees,
            startTime: found.startTime,
            endTime: found.endTime,
          },
          message: `Linked event "${found.title}" to Tala meeting`,
        },
      };
    }

    return {
      statusCode: 400,
      body: {
        enabled: true,
        status: 'active',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: `Unsupported calendar action: ${action}`,
      },
    };
  } catch (err: any) {
    return {
      statusCode: 502,
      body: {
        enabled: false,
        status: 'off',
        provider: 'composio',
        toolkit: 'googlecalendar',
        message: `Calendar sync error: ${err?.message || 'Upstream Composio error'}`,
      },
    };
  }
}

/**
 * Vercel Serverless Function entrypoint (`GET /api/calendar`, `POST /api/calendar`)
 */
export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (res.setHeader) {
    res.setHeader('Cache-Control', 'no-store');
  }
  const result = await handleCalendarApiRequest(req);
  res.status(result.statusCode).json(result.body);
}
