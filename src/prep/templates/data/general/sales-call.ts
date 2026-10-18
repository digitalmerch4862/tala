import type { MeetingTemplate } from '../../../types/template.js';

export const salesCallTemplate: MeetingTemplate = {
  id: 'gen-sales-call',
  title: 'B2B Sales Discovery & Qualification Framework',
  description: 'Structured framework for consultative enterprise sales discovery to uncover prospect pain points, business impact, decision process, budget, and mutual action plan.',
  category: 'general',
  icon: 'target',
  targetAudience: 'Account Executives, Business Development Managers, Sales Engineers, Sales Leaders',
  suggestedDurationMinutes: 30,
  tags: ['general', 'sales-call', 'discovery', 'b2b', 'qualification', 'meddic', 'closing'],
  sections: [
    {
      id: 'prospect-context-current-state',
      title: 'Prospect Context & Current Operational State',
      description: 'Build rapport, confirm meeting agenda, and understand existing systems and team structure.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Account Executive',
      prompts: [
        'Could you share a brief overview of your current team structure and workflow in this domain?',
        'What tools or internal manual processes are you currently using to handle this problem?',
        'What initiated your search for a better solution at this particular time?'
      ],
      sampleTalkingPoints: [
        'Agenda confirmation and time check',
        'Current software stack and operational workflow',
        'Trigger event: growth milestone, painful incident, executive mandate'
      ],
      checklist: [
        'Agenda confirmed with prospect',
        'Current tools and workflow documented',
        'Trigger event identified'
      ],
      isRequired: true
    },
    {
      id: 'pain-points-quantified-impact',
      title: 'Core Pain Points & Quantified Business Impact',
      description: 'Dig beneath surface symptoms to measure the true cost of inaction on revenue, productivity, and risk.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Account Executive',
      prompts: [
        'What is the single biggest bottleneck or point of failure in your current process?',
        'How many hours per week does your team spend working around this limitation?',
        'What happens if this problem is not solved within the next 3 to 6 months? What is the financial or operational cost of inaction?'
      ],
      sampleTalkingPoints: [
        'Quantifying hours lost to manual repetitive work',
        'Direct business costs: churned revenue, missed deadlines, compliance liabilities',
        'Emotional impact on team frustration and turnover'
      ],
      checklist: [
        'Top 2 business pain points articulated in prospect\'s own words',
        'Cost of inaction quantified with metrics or estimates'
      ],
      isRequired: true
    },
    {
      id: 'decision-process-budget-timeline',
      title: 'Decision Process, Stakeholders & Budget Range',
      description: 'Map out the evaluation criteria, economic buyer, legal/procurement steps, and go-live target.',
      defaultDurationMinutes: 7,
      suggestedOwnerRole: 'Account Executive',
      prompts: [
        'Besides yourself, who else will be involved in evaluating and approving this initiative (VP, CFO, IT Security)?',
        'What are the key technical and business criteria your team will use to select a solution?',
        'Is there dedicated budget allocated for this initiative this fiscal cycle, and what is your targeted go-live date?'
      ],
      sampleTalkingPoints: [
        'Decision maker hierarchy and economic buyer identity',
        'Procurement, security review, and legal contracting timeline',
        'Budget bracket confirmation and fiscal year expiration dates'
      ],
      checklist: [
        'Economic buyer identified',
        'Target decision date and go-live date captured',
        'Procurement / security requirements noted'
      ],
      isRequired: true
    },
    {
      id: 'tailored-solution-alignment',
      title: 'Tailored Solution Value Alignment & Preliminary Demo',
      description: 'Demonstrate how specific solution capabilities directly eliminate the prospect\'s quantified pain points.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Account Executive / Solutions Engineer',
      prompts: [
        'Based on the friction you described in [specific pain point], here is exactly how our platform automates that step...',
        'How does this approach compare with how your team envisioned solving the problem?'
      ],
      sampleTalkingPoints: [
        'High-leverage feature highlights focused solely on prospect\'s stated pains (avoid generic feature dumping)',
        'Relevant customer case study or reference metric from the same industry',
        'Preliminary answers to security or data privacy considerations'
      ],
      checklist: [
        'Targeted demonstration mapped strictly to stated pains',
        'Prospect resonance validated'
      ],
      isRequired: false
    },
    {
      id: 'mutual-action-plan-next-steps',
      title: 'Mutual Action Plan (MAP) & Next Milestone',
      description: 'Establish clear mutually committed next steps with concrete calendar dates.',
      defaultDurationMinutes: 3,
      suggestedOwnerRole: 'Account Executive',
      prompts: [
        'What makes the most sense as our next collaborative step: a technical deep-dive with your engineering lead, or a formal customized proposal?',
        'Can we open our calendars now to lock in that session for [proposed day/time next week]?'
      ],
      sampleTalkingPoints: [
        'Set date for technical review / stakeholder demo',
        'Commitment on collateral or ROI calculation to send before the call',
        'Mutual confirmation of evaluation timeline'
      ],
      checklist: [
        'Follow-up calendar invite sent before hanging up',
        'Mutual action plan email drafted and scheduled'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'B2B Sales / Enterprise Software',
    methodology: 'Consultative / MEDDPICC-Aligned',
    version: '1.0.0'
  }
};
