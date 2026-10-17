import { MeetingTemplate } from '../../../types/template.js';

export const oneOnOneTemplate: MeetingTemplate = {
  id: 'gen-one-on-one',
  title: 'Collaborative 1:1 Check-In & Coaching',
  description: 'Bi-directional 1-on-1 meeting template for managers and direct reports focusing on wellbeing, current sprint priorities, unblocking roadblocks, and long-term professional growth.',
  category: 'general',
  icon: 'user-check',
  targetAudience: 'Team Leads, Managers, Mentors, Direct Reports, Individual Contributors',
  suggestedDurationMinutes: 30,
  tags: ['general', 'one-on-one', 'management', 'coaching', 'feedback', 'alignment'],
  sections: [
    {
      id: 'wellbeing-pulse-check',
      title: 'Personal Pulse & Wellbeing Check',
      description: 'Create psychological safety and understand personal energy, workload balance, and context outside work.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Direct Report / Lead',
      prompts: [
        'On a scale of 1 to 5, how has your energy and workload stress felt over the past week?',
        'What gave you the most energy recently, and what felt draining?',
        'Is there anything happening outside of work that affects your availability or focus?'
      ],
      sampleTalkingPoints: [
        'Workload sustainability and context switching',
        'Recent personal highlights or balance challenges',
        'Upcoming time-off or schedule adjustments'
      ],
      checklist: [
        'Wellbeing score or sentiment noted',
        'Capacity risks flagged if overloaded'
      ],
      isRequired: true
    },
    {
      id: 'wins-progress-highlights',
      title: 'Wins & Key Deliverables Since Last Sync',
      description: 'Recognize recent accomplishments, shipped work, and positive outcomes.',
      defaultDurationMinutes: 7,
      suggestedOwnerRole: 'Direct Report',
      prompts: [
        'What achievements or milestones shipped since our last sync are you most proud of?',
        'Which teammate or cross-functional partner was instrumental in helping you deliver?',
        'What went smoother than anticipated?'
      ],
      sampleTalkingPoints: [
        'Completed project tasks or closed customer conversations',
        'Process improvements introduced',
        'Peer recognition and shout-outs'
      ],
      checklist: [
        'Notable accomplishments documented for performance tracking',
        'Peer shout-outs recorded'
      ],
      isRequired: false
    },
    {
      id: 'priorities-and-blockers',
      title: 'Current Priorities, Dependencies & Blockers',
      description: 'Surface critical path blockers where managerial escalation or cross-team support is required.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Direct Report',
      prompts: [
        'What are your top 2-3 focus outcomes for the rest of this sprint / week?',
        'Where are you stuck, experiencing friction, or waiting on external approvals/dependencies?',
        'How can I step in as your manager to clear the path for you?'
      ],
      sampleTalkingPoints: [
        'Blocker escalation: stakeholder delays, tool access, technical hurdles',
        'Priority triage: what can be deprioritized or delegated if time is constrained',
        'Clarity on competing requirements or changing requirements'
      ],
      checklist: [
        'Clear list of blockers requiring manager action identified',
        'Top 2-3 focus deliverables aligned'
      ],
      isRequired: true
    },
    {
      id: 'growth-feedback-career',
      title: 'Growth, Mutual Feedback & Career Development',
      description: 'Dedicate time to skill development, career trajectory, and bi-directional feedback.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Both Participants',
      prompts: [
        'What skills or domain areas are you excited to develop over the next quarter?',
        'What feedback do you have for me on how I can better support your daily execution?',
        'Is there a specific project or responsibility you want exposure to next?'
      ],
      sampleTalkingPoints: [
        'Progress on personal development goals or learning resources',
        'Mutual constructive feedback on recent interactions or decisions',
        'Upcoming stretch assignments or mentorship opportunities'
      ],
      checklist: [
        'Development goal progress updated',
        'Feedback exchanged cleanly'
      ],
      isRequired: false
    },
    {
      id: 'action-items-commitments',
      title: 'Action Commitments & Follow-Up Deadlines',
      description: 'Summarize clear actions, owners, and deliverables before the next session.',
      defaultDurationMinutes: 3,
      suggestedOwnerRole: 'Both Participants',
      prompts: [
        'What specific action items are we each committing to complete before next week?',
        'Do we need an interim check-in on any high-risk task?'
      ],
      sampleTalkingPoints: [
        'Review assignees, task descriptions, and realistic target dates',
        'Confirm date and agenda additions for the next 1:1'
      ],
      checklist: [
        'All action items assigned to an owner with due dates',
        'Next meeting date confirmed'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Cross-functional / Team Management',
    version: '1.0.0'
  }
};
