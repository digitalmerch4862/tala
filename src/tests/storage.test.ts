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
import type { Meeting } from '../types';

describe('Tala Storage & Meeting Library Engine', () => {
  beforeEach(async () => {
    await initStorage();
  });

  it('initializes default channels for team collaboration and syncs', async () => {
    const channels = await getAllChannels();
    expect(channels.length).toBeGreaterThanOrEqual(4);
    const names = channels.map((c) => c.name);
    expect(names).toContain('Team Syncs & Standups');
    expect(names).toContain('Client Engagements');
    expect(names).toContain('Project Planning & Strategy');
    expect(names).toContain('Sales & Partnerships');
  });

  it('seeds initial realistic general demo meetings', async () => {
    const meetings = await getAllMeetings();
    expect(meetings.length).toBeGreaterThanOrEqual(4);

    const standupMeeting = meetings.find((m) => m.title.includes('Weekly Team Standup'));
    expect(standupMeeting).toBeDefined();
    expect(standupMeeting?.summary.overview).toContain('Weekly engineering team standup');
    expect(standupMeeting?.transcript.length).toBeGreaterThan(0);
    expect(standupMeeting?.summary.realEstateMetrics).toBeUndefined();
  });

  it('saves, retrieves, and deletes a meeting correctly', async () => {
    const testMeeting: Meeting = {
      id: 'test-meeting-101',
      title: 'Project Kickoff — Client Onboarding',
      createdAt: new Date().toISOString(),
      durationSeconds: 1800,
      channelId: 'client-calls',
      channelName: 'Client Engagements',
      templateId: 'client-call',
      templateName: 'Client Call',
      language: 'fil-PH',
      participants: ['Host', 'Client Partner'],
      status: 'completed',
      tags: ['Onboarding', 'Client', 'Kickoff'],
      transcript: [
        {
          id: 't-1',
          speaker: 'Host',
          text: 'Magandang umaga, welcome to our onboarding session.',
          startSec: 0,
          endSec: 10,
        },
      ],
      summary: {
        overview: 'Onboarding sync with client partner to review deliverables.',
        keyDiscussionPoints: ['Scope confirmed', 'Timeline set for 4 weeks'],
        decisionsMade: ['Agreed to weekly progress check-ins'],
        nextSteps: ['Prepare project kickoff charter'],
      },
      actionItems: [
        {
          id: 'act-test-1',
          meetingId: 'test-meeting-101',
          meetingTitle: 'Project Kickoff — Client Onboarding',
          title: 'Draft Project Kickoff Charter',
          assignee: 'Host',
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
    expect(retrieved?.title).toBe('Project Kickoff — Client Onboarding');

    // Update action item status
    await updateActionItemStatus('act-test-1', 'completed');
    const updated = await getMeetingById('test-meeting-101');
    expect(updated?.actionItems[0].status).toBe('completed');

    // Delete meeting
    await deleteMeeting('test-meeting-101');
    const deleted = await getMeetingById('test-meeting-101');
    expect(deleted).toBeUndefined();
  });

  it('searches meetings across titles, tags, and discussion points', async () => {
    const meetings = await getAllMeetings();

    const standupResults = searchMeetings(meetings, 'Standup');
    expect(standupResults.length).toBeGreaterThan(0);

    const redesignResults = searchMeetings(meetings, 'Redesign');
    expect(redesignResults.length).toBeGreaterThan(0);

    const nonExistent = searchMeetings(meetings, 'xyz_random_nonexistent_keyword_999');
    expect(nonExistent.length).toBe(0);
  });
});
