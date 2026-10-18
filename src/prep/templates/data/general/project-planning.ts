import type { MeetingTemplate } from '../../../types/template.js';

export const projectPlanningTemplate: MeetingTemplate = {
  id: 'gen-project-planning',
  title: 'Project Planning & Sprint Roadmap',
  description: 'Comprehensive project planning framework covering scope definition, resource allocation, technical dependencies, milestone schedule, and risk management.',
  category: 'general',
  icon: 'calendar-range',
  targetAudience: 'Project Managers, Technical Leads, Product Managers, Engineering Leads, Delivery Teams',
  suggestedDurationMinutes: 60,
  tags: ['general', 'project-planning', 'roadmap', 'sprint-planning', 'scope', 'dependencies', 'milestones'],
  sections: [
    {
      id: 'objectives-and-scope',
      title: 'Project Objectives, Scope & Success Metrics',
      description: 'Anchor the team around core deliverables, define what is strictly in-scope versus out-of-scope, and define success KPIs.',
      defaultDurationMinutes: 15,
      suggestedOwnerRole: 'Project Manager / Product Lead',
      prompts: [
        'What specific problem does this project solve, and what is our target completion timeframe?',
        'What features or requirements are explicitly out-of-scope for this phase?',
        'What quantifiable metrics will determine project success?'
      ],
      sampleTalkingPoints: [
        'Business justification and expected user impact',
        'In-scope vs deferred backlog items',
        'Target launch date and key external constraints'
      ],
      checklist: [
        'Scope boundary document confirmed',
        'Success metrics established'
      ],
      isRequired: true
    },
    {
      id: 'technical-architecture-dependencies',
      title: 'Technical Approach & Cross-Team Dependencies',
      description: 'Map out architecture, infrastructure prerequisites, API contracts, and external team dependencies.',
      defaultDurationMinutes: 15,
      suggestedOwnerRole: 'Technical Lead / Architect',
      prompts: [
        'What technical architecture or infrastructure changes are required to deliver this?',
        'What dependencies exist on other teams, third-party APIs, or vendor tools?',
        'Are there any technical spikes needed before implementation begins?'
      ],
      sampleTalkingPoints: [
        'System diagram walkthrough and data flow',
        'API contracts and dependency sequencing',
        'Tooling and environment readiness'
      ],
      checklist: [
        'Technical prerequisites documented',
        'Critical dependencies flagged with contact points'
      ],
      isRequired: true
    },
    {
      id: 'work-breakdown-milestones',
      title: 'Work Breakdown, Milestones & Timeline',
      description: 'Break project down into phase milestones, sprint tasks, and delivery target dates.',
      defaultDurationMinutes: 15,
      suggestedOwnerRole: 'Project Manager',
      prompts: [
        'What are the key phase gates (e.g. Design Freeze, Alpha, Beta, Production Release)?',
        'What is the estimated level of effort and capacity allocation across team members?'
      ],
      sampleTalkingPoints: [
        'Gantt or timeline milestone schedule',
        'Sprint-by-sprint deliverable targets',
        'Capacity buffers for unexpected delays'
      ],
      checklist: [
        'Key milestone dates mapped onto calendar',
        'Workstreams assigned to lead owners'
      ],
      isRequired: true
    },
    {
      id: 'risks-assumptions-mitigations',
      title: 'Risk Register & Mitigation Strategy',
      description: 'Identify highest probability risks, critical path bottlenecks, and establish pre-emptive mitigation plans.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'All Participants',
      prompts: [
        'What could go wrong that would jeopardize our delivery date or product quality?',
        'What early warning indicators will we monitor, and what are our fallback options?'
      ],
      sampleTalkingPoints: [
        'Resource turnover or allocation risks',
        'Third-party integration delay risks',
        'Compliance, security, or performance hurdles'
      ],
      checklist: [
        'Top 3 risks logged with assigned mitigation owner',
        'Escalation trigger thresholds agreed'
      ],
      isRequired: true
    },
    {
      id: 'commitments-and-next-actions',
      title: 'Commitments & Immediate Action Items',
      description: 'Confirm RACI ownership, align on sprint task creation, and schedule recurring project check-ins.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Project Manager',
      prompts: [
        'Does every workstream lead understand their deliverables and milestones?',
        'When will the next planning checkpoint or sprint review take place?'
      ],
      sampleTalkingPoints: [
        'Review assignees and immediate task assignments for sprint kickoff',
        'Recurring sync schedule confirmed'
      ],
      checklist: [
        'All immediate kickoff tasks assigned with deadlines',
        'Recurring sync invite scheduled on team calendar'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Engineering / Product / Operations',
    version: '1.0.0'
  }
};
