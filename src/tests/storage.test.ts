import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  initStorage,
  getAllMeetings,
  getMeetingById,
  saveMeeting,
  deleteMeeting,
  getAllChannels,
  updateActionItemStatus,
  searchMeetings,
} from '../services/storage';
import { Meeting } from '../types';

describe('Tala Storage & Meeting Library Engine', () => {
  beforeEach(async () => {
    await initStorage();
  });

  it('initializes default channels for real estate business development', async () => {
    const channels = await getAllChannels();
    expect(channels.length).toBeGreaterThanOrEqual(4);
    const names = channels.map((c) => c.name);
    expect(names).toContain('Residential Pre-selling');
    expect(names).toContain('Commercial & Land Deals');
    expect(names).toContain('Broker & Agent Network');
  });

  it('seeds initial realistic demo meetings for Boss Rad', async () => {
    const meetings = await getAllMeetings();
    expect(meetings.length).toBeGreaterThanOrEqual(2);

    const bgcMeeting = meetings.find((m) => m.title.includes('Shang Residences BGC'));
    expect(bgcMeeting).toBeDefined();
    expect(bgcMeeting?.summary.realEstateMetrics?.location).toBe('Bonifacio Global City (BGC), Taguig');
    expect(bgcMeeting?.summary.realEstateMetrics?.budgetRange).toBe('PHP 32M - PHP 40M');
    expect(bgcMeeting?.transcript.length).toBeGreaterThan(0);
  });

  it('saves, retrieves, and deletes a meeting correctly', async () => {
    const testMeeting: Meeting = {
      id: 'test-meeting-101',
      title: 'Aurelia Residences — VIP Client Tripping',
      createdAt: new Date().toISOString(),
      durationSeconds: 1800,
      channelId: 'residential-preselling',
      channelName: 'Residential Pre-selling',
      templateId: 'site-viewing',
      templateName: 'Site Viewing & Tripping Notes',
      language: 'fil-PH',
      participants: ['Rad (BDM)', 'Dr. Jose Santos'],
      status: 'completed',
      tags: ['BGC', 'Aurelia', 'Penthouse'],
      transcript: [
        {
          id: 't-1',
          speaker: 'Rad (BDM)',
          text: 'Magandang umaga Dr. Santos, welcome to Aurelia model suite.',
          startSec: 0,
          endSec: 10,
        },
      ],
      summary: {
        overview: 'Showroom inspection with Dr. Santos for Aurelia 3BR Penthouse.',
        keyDiscussionPoints: ['Target price PHP 80M', 'Prefers high floor'],
        decisionsMade: ['Agreed to reserve parking on podium 3'],
        nextSteps: ['Prepare reservation agreement'],
      },
      actionItems: [
        {
          id: 'act-test-1',
          meetingId: 'test-meeting-101',
          meetingTitle: 'Aurelia Residences — VIP Client Tripping',
          title: 'Draft Reservation Agreement for Penthouse Unit',
          assignee: 'Rad (BDM)',
          dueDate: '2026-10-20',
          priority: 'high',
          status: 'todo',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    await saveMeeting(testMeeting);
    const retrieved = await getMeetingById('test-meeting-101');
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Aurelia Residences — VIP Client Tripping');

    // Update action item status
    await updateActionItemStatus('act-test-1', 'completed');
    const updated = await getMeetingById('test-meeting-101');
    expect(updated?.actionItems[0].status).toBe('completed');

    // Delete meeting
    await deleteMeeting('test-meeting-101');
    const deleted = await getMeetingById('test-meeting-101');
    expect(deleted).toBeUndefined();
  });

  it('searches meetings across titles, tags, and real estate parameters', async () => {
    const meetings = await getAllMeetings();

    const bgcResults = searchMeetings(meetings, 'BGC');
    expect(bgcResults.length).toBeGreaterThan(0);

    const vermosaResults = searchMeetings(meetings, 'Vermosa');
    expect(vermosaResults.length).toBeGreaterThan(0);

    const nonExistent = searchMeetings(meetings, 'xyz_random_nonexistent_keyword_999');
    expect(nonExistent.length).toBe(0);
  });
});
