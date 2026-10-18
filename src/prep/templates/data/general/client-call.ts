import type { MeetingTemplate } from '../../../types/template.js';

export const clientCallTemplate: MeetingTemplate = {
  id: 'gen-client-call',
  title: 'Client Call & Account Alignment',
  description: 'Structured framework for client consultation, relationship management, progress updates, requirements gathering, and next milestone agreements.',
  category: 'general',
  icon: 'phone-call',
  targetAudience: 'Account Managers, Client Partners, Consultants, Agency Leads, Customer Success Managers',
  suggestedDurationMinutes: 45,
  tags: ['general', 'client-call', 'account-management', 'consultation', 'customer-success', 'status-update'],
  sections: [
    {
      id: 'relationship-pulse-check',
      title: 'Relationship Pulse & Context Check',
      description: 'Welcome client, establish rapport, confirm meeting agenda, and verify overall satisfaction pulse.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Account Lead',
      prompts: [
        'How has your team\'s experience been since our last project milestone?',
        'Are there any urgent questions or agenda items you would like to prioritize today?'
      ],
      sampleTalkingPoints: [
        'Rapport building and quick context review',
        'Agenda confirmation and time management'
      ],
      checklist: [
        'Client sentiment and tone noted',
        'Meeting agenda agreed upon'
      ],
      isRequired: true
    },
    {
      id: 'deliverables-status-review',
      title: 'Deliverables Status & Milestone Review',
      description: 'Present progress against committed milestones, demo completed work, and provide timeline transparency.',
      defaultDurationMinutes: 15,
      suggestedOwnerRole: 'Project Lead / Account Manager',
      prompts: [
        'Here is what our team delivered and completed over the past sprint/period.',
        'What feedback or questions do you have regarding the shipped deliverables?'
      ],
      sampleTalkingPoints: [
        'Walkthrough of completed features, deliverables, or reports',
        'Demonstration of working functionality or assets',
        'Status against original milestone roadmap'
      ],
      checklist: [
        'Client sign-off or notes on delivered items recorded',
        'Timeline pacing confirmed'
      ],
      isRequired: true
    },
    {
      id: 'client-feedback-requests',
      title: 'Client Feedback, Scope & Open Topics',
      description: 'Gather specific feedback, address emerging customer requirements, and triage scope modifications.',
      defaultDurationMinutes: 15,
      suggestedOwnerRole: 'Both Participants',
      prompts: [
        'What adjustments or new priorities are on your radar for the upcoming phase?',
        'Are there any upcoming stakeholder presentations or company deadlines we should plan around?'
      ],
      sampleTalkingPoints: [
        'Client feedback details and change requests',
        'Budget or scope impact discussion if changes are requested',
        'Stakeholder alignment needs'
      ],
      checklist: [
        'Actionable client requests cataloged',
        'Scope boundaries clarified'
      ],
      isRequired: true
    },
    {
      id: 'agreed-actions-deadlines',
      title: 'Agreed Next Steps & Follow-Up Deadlines',
      description: 'Consolidate agreed decisions, assign deliverable owners with target dates, and schedule the next sync.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Account Lead',
      prompts: [
        'Let us recap the key commitments and action items we agreed upon today.',
        'When would you like our team to submit the revised preview or deliverables?'
      ],
      sampleTalkingPoints: [
        'Summary of action items, owners, and due dates',
        'Next review meeting date and time confirmed'
      ],
      checklist: [
        'All follow-up items assigned to clear owners with deadlines',
        'Meeting recap email commitment scheduled'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Consulting / Professional Services / Client Success',
    version: '1.0.0'
  }
};
