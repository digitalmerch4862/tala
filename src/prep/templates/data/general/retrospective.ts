import { MeetingTemplate } from '../../../types/template.js';

export const retrospectiveTemplate: MeetingTemplate = {
  id: 'gen-retrospective',
  title: 'Sprint & Milestone Retrospective',
  description: 'Blameless team retrospective framework to reflect on completed work, analyze friction points, extract actionable insights, and commit to process improvements.',
  category: 'general',
  icon: 'refresh-cw',
  targetAudience: 'Engineering Teams, Scrum Masters, Product Pods, Project Teams',
  suggestedDurationMinutes: 45,
  tags: ['general', 'retrospective', 'agile', 'continuous-improvement', 'post-mortem', 'sprint-review'],
  sections: [
    {
      id: 'objective-and-data-recap',
      title: 'Milestone Recap & Delivery Telemetry',
      description: 'Review the facts: what was planned, what was completed, and delivery velocity metrics.',
      defaultDurationMinutes: 8,
      suggestedOwnerRole: 'Scrum Master / Facilitator',
      prompts: [
        'What was our committed sprint backlog versus what was actually merged and shipped?',
        'Did our team experience unplanned work, scope changes, or production incidents during the cycle?',
        'What do the objective metrics indicate regarding cycle time and code review turnaround?'
      ],
      sampleTalkingPoints: [
        'Sprint completion percentage and carry-over stories',
        'Review of burndown / velocity trends',
        'Review of any production bugs or emergency hotfixes deployed'
      ],
      checklist: [
        'Sprint facts and metrics visible to all participants',
        'Ground rule reminder: blameless retrospective focused on systems and processes'
      ],
      isRequired: true
    },
    {
      id: 'what-went-well',
      title: 'What Went Well (Celebrate & Keep Doing)',
      description: 'Highlight successful patterns, effective collaboration, and practices to institutionalize.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'All Team Members',
      prompts: [
        'What tooling, workflows, or team practices worked exceptionally well this cycle?',
        'What helped us move quickly and maintain high product quality?',
        'Which team members stepped up with standout contributions or mentorship?'
      ],
      sampleTalkingPoints: [
        'Effective pairing, documentation breakthroughs, or clean test suites',
        'Cross-discipline cooperation that accelerated delivery',
        'Shout-outs to team members'
      ],
      checklist: [
        'Positive practices noted for standard team playbook',
        'Kudos shared openly'
      ],
      isRequired: true
    },
    {
      id: 'friction-and-pain-points',
      title: 'Friction Points & What Slowed Us Down',
      description: 'Surface operational bottlenecks, ambiguous requirements, and technical frustration without finger-pointing.',
      defaultDurationMinutes: 12,
      suggestedOwnerRole: 'All Team Members',
      prompts: [
        'Where did we encounter unexpected delays, thrash, or context-switching?',
        'Were there unclear acceptance criteria, late requirement changes, or communication gaps?',
        'What developer tooling, environment, or dependency friction held back velocity?'
      ],
      sampleTalkingPoints: [
        'Flaky CI/CD pipelines, slow reviews, or staging environment instability',
        'Vague user stories or scope changes introduced mid-sprint',
        'Unplanned meetings or notification interruptions breaking flow state'
      ],
      checklist: [
        'Top 3 systemic friction points clustered and voted on',
        'Focus on systemic fixes rather than personal critique'
      ],
      isRequired: true
    },
    {
      id: 'root-cause-analysis',
      title: 'Root Cause Analysis (The 5 Whys)',
      description: 'Drill into the root cause of the highest-voted friction point.',
      defaultDurationMinutes: 8,
      suggestedOwnerRole: 'Facilitator',
      prompts: [
        'Why did this specific delay or breakdown occur?',
        'What underlying system deficiency, missing checklist, or assumption allowed it to happen?',
        'How can we error-proof our workflow so this issue cannot recur in the next cycle?'
      ],
      sampleTalkingPoints: [
        'Trace problem step-by-step from surface symptom to fundamental root cause',
        'Identify systemic gaps in definition of ready or definition of done',
        'Identify missing automated guardrails'
      ],
      checklist: [
        'Root cause identified and agreed upon by the team'
      ],
      isRequired: false
    },
    {
      id: 'actionable-commitments',
      title: 'Actionable Process Adjustments & Single Owners',
      description: 'Commit to maximum 2-3 high-leverage process improvements with designated owners for the next sprint.',
      defaultDurationMinutes: 7,
      suggestedOwnerRole: 'Facilitator / Team',
      prompts: [
        'What are the 1-2 specific, measurable workflow experiments we will run in the upcoming sprint?',
        'Who is the single owner accountable for driving each adjustment?',
        'How will we measure whether the experiment was successful in the next retrospective?'
      ],
      sampleTalkingPoints: [
        'Commitment limit: maximum 2 action items to ensure focus and follow-through',
        'Assigning explicit owner and success check date for each item',
        'Adding action items to sprint backlog as first-class tasks'
      ],
      checklist: [
        'Maximum 2-3 action items confirmed',
        'Each action item assigned to a specific named owner',
        'Action items scheduled for review in next retro'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Agile Software / Operations / Cross-functional',
    version: '1.0.0'
  }
};
