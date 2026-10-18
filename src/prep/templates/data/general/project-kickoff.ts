import type { MeetingTemplate } from '../../../types/template.js';

export const projectKickoffTemplate: MeetingTemplate = {
  id: 'gen-project-kickoff',
  title: 'Project Kickoff & Charter Alignment',
  description: 'Comprehensive kickoff framework to align project stakeholders on problem statements, business goals, scope boundaries, RACI matrices, timeline milestones, and risk mitigation.',
  category: 'general',
  icon: 'rocket',
  targetAudience: 'Project Managers, Product Managers, Technical Leads, Stakeholders, Delivery Teams',
  suggestedDurationMinutes: 60,
  tags: ['general', 'kickoff', 'project-charter', 'scope', 'raci', 'milestones', 'planning'],
  sections: [
    {
      id: 'vision-goals-success-metrics',
      title: 'Problem Statement, Vision & Success Metrics',
      description: 'Anchor the team around the core customer problem and measurable business outcomes.',
      defaultDurationMinutes: 12,
      suggestedOwnerRole: 'Project Champion / Product Lead',
      prompts: [
        'What specific customer pain point or market opportunity is this project solving?',
        'What business metrics (OKRs/KPIs) define success for this initiative?',
        'What does failure look like, and what are the core assumptions being tested?'
      ],
      sampleTalkingPoints: [
        'Strategic rationale: why this project now?',
        'Target quantifiable outcomes (e.g. increase conversion by 15%, reduce manual processing by 40%)',
        'Customer quotes, telemetry, or user research supporting the initiative'
      ],
      checklist: [
        'Problem statement documented and approved',
        'Primary and secondary success metrics defined with baseline values'
      ],
      isRequired: true
    },
    {
      id: 'scope-boundaries-non-goals',
      title: 'Scope Boundaries, Deliverables & Explicit Non-Goals',
      description: 'Prevent scope creep by establishing what is strictly inside v1 versus intentionally deferred.',
      defaultDurationMinutes: 15,
      suggestedOwnerRole: 'Technical Lead / Product Lead',
      prompts: [
        'What core deliverables constitute the Minimum Viable Scope (MVS) for phase 1?',
        'What related features or enhancements are explicitly ruled out as non-goals for this phase?',
        'What are the technical constraints or regulatory boundaries governing delivery?'
      ],
      sampleTalkingPoints: [
        'Must-have feature checklist versus nice-to-have items',
        'Explicit list of non-goals to guard against scope inflation',
        'Technical trade-offs and architectural constraints'
      ],
      checklist: [
        'Phase 1 scope boundaries formally agreed',
        'Non-goals documented and communicated to stakeholders'
      ],
      isRequired: true
    },
    {
      id: 'raci-roles-governance',
      title: 'Stakeholder Roles & RACI Framework',
      description: 'Define clear governance across Responsible, Accountable, Consulted, and Informed parties.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Project Manager',
      prompts: [
        'Who is the single Accountable individual for project delivery?',
        'Who are the hands-on Responsible team members executing design, code, marketing, and QA?',
        'Who needs to be Consulted on architectural/legal decisions, and who simply needs to be Informed via status updates?'
      ],
      sampleTalkingPoints: [
        'RACI chart walkthrough across project workstreams',
        'Escalation pathway for resolving design or architectural impasses',
        'Decision-making authority thresholds'
      ],
      checklist: [
        'Single Accountable owner confirmed',
        'RACI matrix documented with named individuals'
      ],
      isRequired: true
    },
    {
      id: 'timeline-phases-milestones',
      title: 'Timeline, Delivery Phases & Review Gates',
      description: 'Establish the project critical path, target release dates, and intermediate testing gates.',
      defaultDurationMinutes: 13,
      suggestedOwnerRole: 'Project Manager / Tech Lead',
      prompts: [
        'What are the target dates for design freeze, alpha release, beta pilot, and general availability?',
        'Where are the critical path bottlenecks where delays cannot be absorbed?',
        'What review gates or acceptance sign-offs are required before proceeding between phases?'
      ],
      sampleTalkingPoints: [
        'Phase breakdown: Discovery & Prototyping -> Core Implementation -> QA & Security -> Staged Rollout',
        'Key milestone dates and stakeholder demo checkpoints',
        'Buffer strategies for unforeseen integration delays'
      ],
      checklist: [
        'High-level timeline mapped with milestone milestones',
        'Review gate acceptance criteria defined'
      ],
      isRequired: true
    },
    {
      id: 'risks-cadence-next-steps',
      title: 'Risk Register, Communication Cadence & Kickoff Actions',
      description: 'Identify top project risks and agree on communication rhythms.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Project Manager',
      prompts: [
        'What are the top 3 risks that could derail this timeline or quality bar, and what are their mitigation plans?',
        'What will be the team sync frequency (daily async standup, weekly sync) and default communication channels?',
        'What are the immediate tasks due within the first 48 hours following this kickoff?'
      ],
      sampleTalkingPoints: [
        'Top 3 risks cataloged with severity, likelihood, and mitigation actions',
        'Collaboration channels: dedicated project channel, documentation workspace, issue tracker',
        'Immediate 48-hour onboarding and environment setup checklist'
      ],
      checklist: [
        'Top risks documented in project risk register',
        'Slack/chat channel created with all core participants',
        'Immediate sprint 1 planning session scheduled'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Technology / Operations / Project Delivery',
    version: '1.0.0'
  }
};
