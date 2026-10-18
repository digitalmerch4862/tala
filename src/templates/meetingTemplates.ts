import type { MeetingTemplate } from '../types';

export const MEETING_TEMPLATES: MeetingTemplate[] = [
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
  }
];

export const DEFAULT_TEMPLATE = MEETING_TEMPLATES[0]; // Client Property Discovery
