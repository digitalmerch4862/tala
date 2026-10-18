import type { MeetingTemplate } from '../types';

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    id: 'team-standup',
    name: 'Team Standup',
    category: 'general',
    description: 'Fast-paced team standup to synchronize on completed tasks from yesterday, current priorities for today, and immediate blockers.',
    iconName: 'Users',
    suggestedAgenda: [
      'Roundtable: Completed tasks and deliverables since last sync',
      'Roundtable: Today top focus outcomes and commitments',
      'Blockers, dependencies, and escalation points',
      'Immediate action item assignments and handoffs'
    ],
    systemInstructions: `You are Tala AI. Summarize the team standup.
Extract:
1. Key accomplishments and completed work per participant.
2. High-priority focus areas committed for today.
3. Blockers and dependencies requiring escalation with assigned unblocker owners.
4. Concrete action items with realistic deadlines.`
  },
  {
    id: 'client-call',
    name: 'Client Call',
    category: 'general',
    description: 'Client consultation, relationship pulse, status update, open feedback requests, and agreed next deliverables.',
    iconName: 'Handshake',
    suggestedAgenda: [
      'Relationship pulse, check-in, and agenda confirmation',
      'Milestone progress review and deliverable demonstration',
      'Client feedback, requirement clarifications, and open requests',
      'Agreed next steps, deliverables, and next sync date'
    ],
    systemInstructions: `You are Tala AI. Summarize the client consultation.
Extract:
1. Client sentiment, expectations, and core feedback.
2. Agreed decisions, deliverable timelines, and scope adjustments.
3. Critical questions or dependencies raised by the client.
4. Assigned next actions with clear owners and due dates.`
  },
  {
    id: 'one-on-one',
    name: '1-on-1',
    category: 'general',
    description: 'Collaborative 1-on-1 meeting for managers and direct reports focusing on wellbeing, current priorities, unblocking roadblocks, and growth.',
    iconName: 'Users',
    suggestedAgenda: [
      'Personal pulse, workload balance, and wellbeing check',
      'Recent accomplishments and highlights since last sync',
      'Current sprint priorities, friction points, and manager support needed',
      'Growth, feedback, and long-term development topics',
      'Agreed action commitments and follow-up deadlines'
    ],
    systemInstructions: `You are Tala AI. Summarize the 1-on-1 check-in.
Extract:
1. Personal pulse and workload sustainability notes.
2. Core deliverables in flight and manager support requested.
3. Roadblocks and organizational friction points surfaced.
4. Mutual commitments and action items with target dates.`
  },
  {
    id: 'sales-call',
    name: 'Sales/Prospect Call',
    category: 'general',
    description: 'Consultative B2B sales discovery and qualification call to uncover prospect pain points, business impact, budget, and mutual action plan.',
    iconName: 'CheckCircle2',
    suggestedAgenda: [
      'Prospect background, operational context, and current toolchain',
      'Core business pain points, urgency drivers, and negative consequences',
      'Solution capabilities alignment and customer questions',
      'Qualification parameters (Budget, Authority, Need, Timeline)',
      'Agreed next steps and mutual evaluation roadmap'
    ],
    systemInstructions: `You are Tala AI. Structure this as a sales discovery and qualification brief.
Extract:
1. Prospect pain points and business impact metrics.
2. Decision process, economic buyer, and timeline parameters.
3. Objections or competitive considerations mentioned.
4. Next steps in the mutual action plan with owners.`
  },
  {
    id: 'project-planning',
    name: 'Project Planning',
    category: 'general',
    description: 'Project planning and roadmap alignment covering scope boundaries, technical dependencies, milestone schedule, and risk management.',
    iconName: 'FileText',
    suggestedAgenda: [
      'Problem statement, project objectives, and measurable success criteria',
      'Scope boundaries: strictly in-scope versus deferred backlog',
      'Technical architecture approach, prerequisites, and dependencies',
      'Milestone delivery schedule, phase gates, and RACI roles',
      'Risk register, mitigation plans, and immediate kickoff actions'
    ],
    systemInstructions: `You are Tala AI. Structure a comprehensive project planning recap.
Extract:
1. Project goals, approved scope boundaries, and non-negotiables.
2. Key milestone dates and phase gate requirements.
3. Technical and cross-team dependencies with assigned points of contact.
4. High-priority risk factors and immediate next actions.`
  },
  {
    id: 'general-meeting',
    name: 'General Discussion & Team Sync',
    category: 'general',
    description: 'General purpose meeting note taking, collaborative agenda, discussion summary, and assigned action items.',
    iconName: 'FileText',
    suggestedAgenda: [
      'Meeting objective and agenda overview',
      'Key updates and announcements',
      'Open discussion and problem solving',
      'Next steps and assigned responsibilities'
    ],
    systemInstructions: `You are Tala AI. Transcribe, extract core insights, highlight decisions, and structure concrete next steps.`
  },
  {
    id: 'executive-one-on-one',
    name: 'Executive 1-on-1 & Strategic Review',
    category: 'executive',
    description: 'Quarterly business development targets, partner pipeline, deal blockers, resource allocation, and leadership alignment.',
    iconName: 'Users',
    suggestedAgenda: [
      'Pipeline health & revenue target pacing against quota',
      'Top 3 active deal negotiations & potential roadblocks',
      'Resource support needed from management or developers',
      'Strategic expansion areas or new broker agency partnerships',
      'Direct agreements and accountability commitments'
    ],
    systemInstructions: `You are Tala AI. Deliver an executive level summary: concise takeaways, hard decisions, high-priority action items, and strategic commitments.`
  },
  {
    id: 'client-discovery',
    name: 'Client Property Discovery',
    category: 'real_estate',
    description: 'Buyer qualification, budget range, preferred locations (BGC, Makati, Ortigas, Cebu), unit specifications, pre-selling vs RFO, and buying timeline.',
    iconName: 'Home',
    suggestedAgenda: [
      'Buyer background and investment vs end-use intent',
      'Preferred location and proximity requirements (CBD, schools, transit)',
      'Unit preferences (Studio, 1BR, 2BR, Penthouse, parking)',
      'Total contract price (TCP) budget & monthly equity allocation',
      'Decision maker timeline & target move-in date'
    ],
    systemInstructions: `You are Tala AI, an executive real estate assistant in the Philippines.
Extract:
1. Buyer profile & intent (End-use home vs Rental yield investment).
2. Preferred developments/areas.
3. Target price point, equity payment capacity.
4. Specific layout or amenity must-haves.
5. Action items with clear owners (e.g. Rad / Buyer) and target dates.`
  },
  {
    id: 'site-viewing',
    name: 'Site Viewing & Tripping Notes',
    category: 'real_estate',
    description: 'On-site model unit walkthrough, layout inspection, buyer feedback, developer finishes, dues estimate, and immediate interest level.',
    iconName: 'Eye',
    suggestedAgenda: [
      'Project & tower visited with model unit types inspected',
      'Client reactions to layout, views, sunlight, and finishes',
      'Developer turnover inclusions (fixtures, AC units, modular cabinets)',
      'Estimated association dues, property management, amenities',
      'Next step: computation sheet or unit hold request'
    ],
    systemInstructions: `You are Tala AI. Summarize the site viewing inspection. Note specific client objections (e.g. room size, view orientation, high floor vs low floor), positive reactions, and prompt follow-up computations.`
  },
  {
    id: 'developer-broker-alignment',
    name: 'Developer & Broker Alignment',
    category: 'real_estate',
    description: 'Master project launch briefing, broker commission tiers, project inventory allocation, sales quotas, and marketing co-op campaigns.',
    iconName: 'Handshake',
    suggestedAgenda: [
      'New project phase launch dates and masterplan updates',
      'Commission structure, tiered incentives, and release schedules',
      'Priority inventory holding and VIP client allocations',
      'Co-branded digital ads, open house events, and buyer promos',
      'Action items and sales commitments for the month'
    ],
    systemInstructions: `You are Tala AI. Focus on business development partnership points: commission percentages, inventory block allocations, promotion mechanics, and reciprocal commitments.`
  },
  {
    id: 'financing-mortgage',
    name: 'Financing & Mortgage Brief',
    category: 'real_estate',
    description: 'Bank pre-approval vs Pag-IBIG loan, downpayment schedule, required ITR/COE documentation, interest rate lock-in, and loan take-out plan.',
    iconName: 'DollarSign',
    suggestedAgenda: [
      'Downpayment percentage and monthly equity amortization term',
      'Financing vehicle comparison: Top bank loans vs Pag-IBIG Fund',
      'Income documentation readiness (ITR 2316/1701, COE, Payslips, Bank Statements)',
      'Appraisal fees, transfer taxes, title registration (Bank charges vs developer fees)',
      'Document submission deadlines and bank endorsement timeline'
    ],
    systemInstructions: `You are Tala AI. Summarize mortgage and financing details. Clearly specify TCP, downpayment breakdown, bank financing balance, target interest rate, and required documentation deliverables with deadlines.`
  },
  {
    id: 'closing-reservation',
    name: 'Closing & Reservation Follow-up',
    category: 'real_estate',
    description: 'Reservation agreement (RA) signing, earnest money deposit, buyer ID verification, and Contract-to-Sell (CTS) turnover checklist.',
    iconName: 'CheckCircle2',
    suggestedAgenda: [
      'Selected specific unit, floor number, and parking slot assignment',
      'Reservation fee payment verification and official receipt status',
      'Completed Buyer Information Sheet (BIS) and government IDs check',
      'PDC (Post-Dated Check) requirement or auto-debit arrangement',
      'Contract-to-Sell (CTS) draft review and target notary schedule'
    ],
    systemInstructions: `You are Tala AI. Structure this as a deal closing protocol. Capture reservation amount paid, exact unit designation, payment schedule date, and critical document compliance checklist.`
  }
];

export const DEFAULT_TEMPLATE = MEETING_TEMPLATES[0]; // Team Standup
