import type { MeetingTemplate } from '../../../types/template.js';

export const teamStandupTemplate: MeetingTemplate = {
  id: 'gen-team-standup',
  title: 'Team Daily Standup & Blockers Sync',
  description: 'Fast-paced team standup to synchronize on completed tasks from yesterday, current commitments for today, and immediate blockers requiring escalation.',
  category: 'general',
  icon: 'users',
  targetAudience: 'Engineering Pods, Product Teams, Operations Pods, Agile Scrum Teams, Cross-functional Squads',
  suggestedDurationMinutes: 15,
  tags: ['general', 'standup', 'daily-sync', 'agile', 'scrum', 'blockers', 'team-alignment'],
  sections: [
    {
      id: 'yesterday-accomplishments',
      title: 'Yesterday Completed Work & Progress',
      description: 'Quick check on shipped deliverables, merged pull requests, and resolved customer tickets.',
      defaultDurationMinutes: 4,
      suggestedOwnerRole: 'All Team Members',
      prompts: [
        'What major tasks, pull requests, or deliverables did you close or ship yesterday?',
        'Did any task take longer than anticipated?'
      ],
      sampleTalkingPoints: [
        'Merged features, hotfixes, or content updates',
        'Customer outreach or tickets closed',
        'Interim milestone completion'
      ],
      checklist: [
        'Sprint board updated to reflect closed work',
        'Notable accomplishments shared'
      ],
      isRequired: true
    },
    {
      id: 'today-priorities',
      title: 'Today Focus & Sprint Commitments',
      description: 'Align on individual top focus outcomes to prevent multitasking and ensure sprint goals remain on track.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'All Team Members',
      prompts: [
        'What is your single most critical focus deliverable for today?',
        'Do you expect to ship or complete it before the end of the day?'
      ],
      sampleTalkingPoints: [
        'Primary sprint user story or deliverable in progress',
        'Pair programming or code review commitments',
        'Expected completion timeframe'
      ],
      checklist: [
        'Top 1-2 priorities confirmed per team member',
        'WIP (Work in Progress) limits respected'
      ],
      isRequired: true
    },
    {
      id: 'blockers-and-escalations',
      title: 'Blockers, Dependencies & Escalations',
      description: 'Surface technical blockers, waiting dependencies, or access hurdles that impede team execution.',
      defaultDurationMinutes: 4,
      suggestedOwnerRole: 'All Team Members',
      prompts: [
        'Are you blocked by third-party APIs, pending code reviews, or design assets?',
        'Who on the team or in leadership can unblock this today?'
      ],
      sampleTalkingPoints: [
        'Cross-pod dependency delays',
        'Environment or tooling failures',
        'Design or requirement ambiguities'
      ],
      checklist: [
        'Each blocker assigned to a specific unblocker owner',
        'Direct breakout conversation scheduled for complex blockers'
      ],
      isRequired: true
    },
    {
      id: 'parking-lot-and-handoffs',
      title: 'Parking Lot Topics & Quick Handoffs',
      description: 'Schedule follow-up 1-on-1 syncs for discussions that exceed the standup scope.',
      defaultDurationMinutes: 2,
      suggestedOwnerRole: 'Facilitator / Scrum Master',
      prompts: [
        'Which topics require a targeted 10-minute breakout sync after standup?',
        'Who needs to be present for the breakout discussion?'
      ],
      sampleTalkingPoints: [
        'Pairing sessions scheduled',
        'Technical architectural questions tagged for post-standup'
      ],
      checklist: [
        'Breakout participants confirmed',
        'Standup adjourned on time within 15 minutes'
      ],
      isRequired: false
    }
  ],
  metadata: {
    industry: 'Engineering / Product / Operations',
    version: '1.0.0'
  }
};
