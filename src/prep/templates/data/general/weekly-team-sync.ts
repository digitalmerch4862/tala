import type { MeetingTemplate } from '../../../types/template.js';

export const weeklyTeamSyncTemplate: MeetingTemplate = {
  id: 'gen-weekly-team-sync',
  title: 'Weekly Team Alignment & Operational Sync',
  description: 'Fast-paced weekly operational sync to align on team scorecards, review sprint milestones, clear cross-functional bottlenecks, and set priorities.',
  category: 'general',
  icon: 'users',
  targetAudience: 'Product Teams, Operations Teams, Engineering Pods, Business Units, Cross-functional Groups',
  suggestedDurationMinutes: 45,
  tags: ['general', 'weekly-sync', 'team-alignment', 'scorecard', 'blockers', 'sprint'],
  sections: [
    {
      id: 'metrics-scorecard-review',
      title: 'Metrics Scorecard & KPI Review',
      description: 'Review core operational metrics against monthly and quarterly targets.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Team Lead / Ops Lead',
      prompts: [
        'How did our core metrics track against this week\'s targets (revenue, output, response time, quality)?',
        'Are there any anomalies, downward trends, or positive spikes that require team investigation?',
        'What metrics are in red status, and what is our containment plan?'
      ],
      sampleTalkingPoints: [
        'Dashboard walkthrough: target vs actual performance',
        'Customer satisfaction, SLA compliance, or release velocity stats',
        'Root causes behind red or amber scorecard indicators'
      ],
      checklist: [
        'Scorecard dashboard updated before meeting',
        'At-risk metrics flagged with assigned owner for root-cause analysis'
      ],
      isRequired: true
    },
    {
      id: 'roundtable-shipped-work',
      title: 'Roundtable Highlights & Shipped Deliverables',
      description: 'Lightning round of key milestones completed across individual tracks.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'All Team Members',
      prompts: [
        'What major feature, customer deal, or operational milestone did your pod ship this week?',
        'What lessons or reusable patterns emerged from this work that benefit the wider team?'
      ],
      sampleTalkingPoints: [
        '60-second updates per owner on completed deliverables',
        'Sharing demo links, completed collateral, or closed account updates',
        'Immediate peer appreciation'
      ],
      checklist: [
        'All pods represented in shipped highlights',
        'Demos or links cataloged in meeting notes'
      ],
      isRequired: true
    },
    {
      id: 'cross-functional-blockers',
      title: 'Cross-Functional Bottlenecks & Escalations',
      description: 'Surface inter-team dependencies, resource constraints, and blocked deliverables.',
      defaultDurationMinutes: 12,
      suggestedOwnerRole: 'Team Lead',
      prompts: [
        'Where are we blocked by other teams, third-party vendors, or pending approvals?',
        'Do we have conflicting priorities or resource bottlenecks between active workstreams?',
        'Who needs to be pulled in to unblock this by the end of today?'
      ],
      sampleTalkingPoints: [
        'Dependency mapping: e.g. Design waiting on Copy, Dev waiting on API access',
        'Resource reallocation or interim workaround consensus',
        'Formal escalation triggers if blocker persists beyond 24 hours'
      ],
      checklist: [
        'Blockers logged with specific escalation owner',
        'Resolution timeframes established'
      ],
      isRequired: true
    },
    {
      id: 'weekly-focus-priorities',
      title: 'This Week\'s Non-Negotiable Priorities',
      description: 'Lock in the single most critical objective for each team member for the coming week.',
      defaultDurationMinutes: 8,
      suggestedOwnerRole: 'All Team Members',
      prompts: [
        'If our team can only accomplish one high-leverage thing this week, what must it be?',
        'What secondary work will we intentionally say no to or defer?',
        'Are deliverables balanced evenly across team capacity?'
      ],
      sampleTalkingPoints: [
        'Confirmation of top 1-2 sprint commitments per person',
        'Deprioritization of non-essential requests to protect deep work',
        'Milestone target dates for the current week'
      ],
      checklist: [
        'Priorities committed in project board',
        'Capacity constraints verified'
      ],
      isRequired: true
    },
    {
      id: 'decisions-action-items',
      title: 'Consensus Decisions & Action Item Assignment',
      description: 'Verify agreed decisions, clear owners, and due dates before adjourning.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Meeting Scribe / Lead',
      prompts: [
        'What key decisions were agreed upon during today\'s sync?',
        'Does every single action item have one clear owner and a realistic due date?'
      ],
      sampleTalkingPoints: [
        'Read out finalized action item list',
        'Confirm next sync date and any special schedule adjustments'
      ],
      checklist: [
        'Decisions recorded in central meeting log',
        'Action items assigned with deadlines'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'General Business / Product / Engineering',
    version: '1.0.0'
  }
};
