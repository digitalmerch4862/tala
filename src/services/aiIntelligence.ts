import type { TranscriptUtterance, MeetingSummary, ActionItem, Priority, PreMeetingBrief, Meeting } from '../types';

export interface AIIntelligenceEngine {
  generateSummary(
    transcript: TranscriptUtterance[],
    templateId: string,
    meetingTitle: string
  ): Promise<MeetingSummary>;

  extractActionItems(
    transcript: TranscriptUtterance[],
    meetingId: string,
    meetingTitle: string
  ): Promise<ActionItem[]>;

  askAssistant(
    question: string,
    transcript: TranscriptUtterance[],
    summary: MeetingSummary
  ): Promise<string>;

  generatePreMeetingBrief(
    meetingTitle: string,
    templateId: string,
    participants: string[],
    agendaItems?: string[],
    carryOverNotes?: string[]
  ): Promise<PreMeetingBrief>;

  queryAcrossAllMeetings(
    question: string,
    allMeetings: Meeting[]
  ): Promise<string>;
}

export class MockAIProvider implements AIIntelligenceEngine {
  public async generateSummary(
    transcript: TranscriptUtterance[],
    templateId: string,
    meetingTitle: string
  ): Promise<MeetingSummary> {
    const fullText = transcript.map((u) => `${u.speaker}: ${u.text}`).join('\n');

    if (templateId === 'client-discovery' || fullText.includes('budget') || fullText.includes('condominium') || fullText.includes('BGC')) {
      return {
        overview: `Executive property discovery session conducted for "${meetingTitle}". Analyzed buyer criteria, desired development specifications, and equity repayment schedules.`,
        keyDiscussionPoints: [
          'Target development preferences: High-rise residential towers in prime Metro Manila CBDs (BGC/Makati).',
          'Preferred unit configuration: 2-Bedroom or Junior 3-Bedroom with minimum 95 sqm floor plate.',
          'Financial parameters: Total contract price (TCP) envelope around PHP 25M - 35M with flexible pre-selling equity terms.',
        ],
        decisionsMade: [
          'Focused initial selection on corner 2-Bedroom unit inventories.',
          'Agreed to arrange an exclusive model unit viewing.',
        ],
        nextSteps: [
          'Send official developer computation sheet with 30/70 bank financing scheme.',
          'Coordinate VIP showroom viewing pass and dedicated parking.',
        ],
        realEstateMetrics: {
          propertyType: '2-Bedroom Luxury Pre-selling Condo',
          location: 'Bonifacio Global City (BGC) / Makati',
          budgetRange: 'PHP 25M - PHP 35M',
          financingType: 'Bank',
          targetTurnover: '2028',
          keyObjections: ['Requires unblocked corner view', 'Must have dedicated parking slot'],
        },
      };
    }

    if (templateId === 'site-viewing') {
      return {
        overview: `On-site property inspection and model showroom walkthrough for "${meetingTitle}". Captured prospective buyer feedback, layout impressions, and turnover finishings.`,
        keyDiscussionPoints: [
          'Client praised double-glazed window insulation, high ceiling clearance, and kitchen cabinetry.',
          'Discussed projected monthly condominium dues (approx. PHP 120/sqm) and property management standards.',
          'Clarified turnover inclusions, appliance provisions, and podium parking allocation.',
        ],
        decisionsMade: [
          'Client placed verbal 72-hour priority hold request on designated corner unit.',
        ],
        nextSteps: [
          'Prepare formal Reservation Agreement (RA) and Buyer Information Sheet (BIS).',
          'Collect necessary government-issued IDs and verify reservation fee deposit channel.',
        ],
        realEstateMetrics: {
          propertyType: 'Model Showroom Inspection (2BR)',
          location: 'Metro Manila Prime CBD',
          budgetRange: 'PHP 28M - PHP 38M',
          financingType: 'Bank',
          targetTurnover: 'Q4 2027',
        },
      };
    }

    if (templateId === 'developer-broker-alignment') {
      return {
        overview: `Broker and business development partner alignment session for "${meetingTitle}". Finalized Q4 sales incentives, commission structures, and priority inventory holding blocks.`,
        keyDiscussionPoints: [
          'High buyer interest recorded for commercial parcels along CALAX and prime residential towers.',
          'Broker commission structure aligned at 4.5% with 50% accelerated release upon 10% cleared equity.',
          'Confirmed seasonal incentive campaign including international travel for top-tier agency closings.',
        ],
        decisionsMade: [
          'Allocated exclusive 30-day inventory holding options for partner agency VIP buyers.',
          'Established shared digital marketing co-op campaign budget.',
        ],
        nextSteps: [
          'Distribute complete cadastral layout maps and developer master deed restrictions.',
          'Submit endorsed buyer Letters of Intent (LOI) for official reservation.',
        ],
        realEstateMetrics: {
          propertyType: 'Commercial Parcels & Broker Inventory Blocks',
          location: 'Southern Luzon & Mega Manila Corridors',
          budgetRange: 'PHP 50M - PHP 150M',
          commissionNotes: '4.5% tiered commission + 50% advance release on 10% cleared downpayment',
        },
      };
    }

    // Default executive summary
    return {
      overview: `Strategic meeting review for "${meetingTitle}". Key discussion topics, collaborative insights, and actionable next steps were documented.`,
      keyDiscussionPoints: [
        'Reviewed current milestone progress and operational metrics against target schedule.',
        'Addressed prospective blockers and identified cross-team dependencies.',
        'Established clear milestones for subsequent review cycle.',
      ],
      decisionsMade: [
        'Approved proposal structure and timeline as presented.',
        'Delegated milestone deliverables to respective owners.',
      ],
      nextSteps: [
        'Circulate recap notes to all participants.',
        'Track action items and review status in next scheduled sync.',
      ],
    };
  }

  public async extractActionItems(
    transcript: TranscriptUtterance[],
    meetingId: string,
    meetingTitle: string
  ): Promise<ActionItem[]> {
    const fullText = transcript.map((u) => u.text).join(' ');
    const items: ActionItem[] = [];

    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0];
    const threeDays = new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString().split('T')[0];

    if (fullText.toLowerCase().includes('computation') || fullText.toLowerCase().includes('sheet')) {
      items.push({
        id: `act-${Date.now()}-1`,
        meetingId,
        meetingTitle,
        title: 'Prepare and send sample computation sheet with 30/70 bank equity schedule',
        assignee: 'Rad (BDM)',
        dueDate: tomorrow,
        priority: 'high',
        status: 'todo',
        createdAt: new Date().toISOString(),
      });
    }

    if (fullText.toLowerCase().includes('viewing') || fullText.toLowerCase().includes('showroom') || fullText.toLowerCase().includes('tripping')) {
      items.push({
        id: `act-${Date.now()}-2`,
        meetingId,
        meetingTitle,
        title: 'Schedule private showroom walkthrough and arrange guest parking pass',
        assignee: 'Rad (BDM)',
        dueDate: threeDays,
        priority: 'high',
        status: 'todo',
        createdAt: new Date().toISOString(),
      });
    }

    if (fullText.toLowerCase().includes('hold') || fullText.toLowerCase().includes('reservation')) {
      items.push({
        id: `act-${Date.now()}-3`,
        meetingId,
        meetingTitle,
        title: 'Submit unit hold request form and send Buyer Information Sheet (BIS)',
        assignee: 'Rad (BDM)',
        dueDate: tomorrow,
        priority: 'medium',
        status: 'todo',
        createdAt: new Date().toISOString(),
      });
    }

    if (items.length === 0) {
      items.push({
        id: `act-${Date.now()}-def`,
        meetingId,
        meetingTitle,
        title: 'Circulate meeting notes and follow up on agreed action points',
        assignee: 'Rad (BDM)',
        dueDate: tomorrow,
        priority: 'medium',
        status: 'todo',
        createdAt: new Date().toISOString(),
      });
    }

    return items;
  }

  public async askAssistant(
    question: string,
    transcript: TranscriptUtterance[],
    summary: MeetingSummary
  ): Promise<string> {
    const q = question.toLowerCase();

    if (q.includes('budget') || q.includes('price') || q.includes('tcp') || q.includes('cost')) {
      if (summary.realEstateMetrics?.budgetRange) {
        return `Based on the discussion, the target budget envelope is **${summary.realEstateMetrics.budgetRange}** with ${summary.realEstateMetrics.financingType || 'bank'} financing terms.`;
      }
      return 'The discussion highlighted a target investment envelope in line with current market inventory computations.';
    }

    if (q.includes('decision') || q.includes('decided') || q.includes('agreed')) {
      return `Key decisions made in this meeting:\n- ${summary.decisionsMade.join('\n- ')}`;
    }

    if (q.includes('action') || q.includes('next step') || q.includes('todo')) {
      return `Agreed next steps:\n- ${summary.nextSteps.join('\n- ')}`;
    }

    if (q.includes('location') || q.includes('where') || q.includes('property')) {
      if (summary.realEstateMetrics?.location) {
        return `The location discussed is **${summary.realEstateMetrics.location}** for property type **${summary.realEstateMetrics.propertyType || 'Residential Pre-selling'}**.`;
      }
    }

    return `Summary of finding from meeting transcript: "${summary.overview}"\n\nIs there a specific detail regarding attendees, schedule, or financing you would like me to check?`;
  }

  public async generatePreMeetingBrief(
    meetingTitle: string,
    templateId: string,
    participants: string[],
    agendaItems?: string[],
    carryOverNotes?: string[]
  ): Promise<PreMeetingBrief> {
    const participantList = participants.length > 0 ? participants.join(', ') : 'Rad (BDM) & Counterparts';

    if (templateId === 'client-discovery' || templateId === 're-client-discovery') {
      return {
        meetingTitle,
        context: `High-value prospective property buyer consultation with ${participantList}. Meeting intent is to qualify investment capacity, target corridor (e.g. BGC, Makati, Cebu), and unit specifications.`,
        keyObjectives: [
          'Ascertain purchase intent: capital preservation, rental yield, or personal residence.',
          'Identify specific budget bracket (TCP) and monthly equity amortization capacity.',
          'Pinpoint deal breakers: view orientations, parking slot requirements, and turnover horizon.',
        ],
        potentialObjections: [
          'Price per square meter comparison against secondary market resales.',
          'Developer turnover delays or construction schedule risks.',
          'Appraisal and association dues concerns.',
        ],
        suggestedQuestions: [
          'What is your target investment horizon before you intend to flip or lease out the unit?',
          'How do you plan to balance pre-selling equity vs bank take-out loan upon turnover?',
          'What specific amenities or CBD proximities are non-negotiable for your family or tenants?',
        ],
        carryOverNotes: carryOverNotes || [],
      };
    }

    if (templateId === 'site-viewing' || templateId === 're-site-viewing') {
      return {
        meetingTitle,
        context: `On-site model unit walkthrough and development inspection with ${participantList}. The objective is to transition inspection interest into a formal unit hold request.`,
        keyObjectives: [
          'Guide walkthrough highlighting premium finishes, natural light, and double-glazed acoustics.',
          'Present clear computation sheet illustrating equity payment milestones.',
          'Secure a 72-hour priority reservation hold on preferred tower floor.',
        ],
        potentialObjections: [
          'Room layout perception or bedroom storage volume.',
          'Proximity of unit to elevator core or trash chute.',
          'Estimated monthly association dues and property management track record.',
        ],
        suggestedQuestions: [
          'How does this master layout compare with other developments you viewed this week?',
          'Would you prefer morning sunrise exposure or sunset city skyline views?',
        ],
        carryOverNotes: carryOverNotes || [],
      };
    }

    if (templateId === 'developer-broker-call' || templateId === 're-developer-broker-call' || templateId === 'developer-broker-alignment') {
      return {
        meetingTitle,
        context: `Business development and broker partner alignment with ${participantList}. Finalize Q4 commission tiers, VIP holding blocks, and marketing co-op campaign.`,
        keyObjectives: [
          'Agree on 4.5% tiered commission structure with 50% advance release terms.',
          'Lock priority inventory holds for top-producing agency buyers.',
          'Coordinate joint open house tripping schedule for the CALAX corridor.',
        ],
        potentialObjections: [
          'Commission disbursement delays from developer accounting.',
          'Limited availability of 2-bedroom corner units.',
        ],
        suggestedQuestions: [
          'What gross sales volume is your team targeting to qualify for the international incentive trip?',
          'Which marketing collateral or CAD layouts does your sales team need expedited?',
        ],
        carryOverNotes: carryOverNotes || [],
      };
    }

    // Default executive pre-meeting brief
    return {
      meetingTitle,
      context: `Executive session with ${participantList}. Focus on clear alignment, decision making, and measurable deliverables.`,
      keyObjectives: [
        'Review progress against agreed milestones.',
        'Resolve active blockers and operational constraints.',
        'Confirm accountable owners and due dates for pending action items.',
      ],
      potentialObjections: [
        'Resource bandwidth constraints.',
        'Dependency delays across external stakeholders.',
      ],
      suggestedQuestions: [
        'What is the single biggest roadblock preventing us from closing this milestone on time?',
        'What decisions require management approval today?',
      ],
      carryOverNotes: carryOverNotes || [],
    };
  }

  public async queryAcrossAllMeetings(
    question: string,
    allMeetings: Meeting[]
  ): Promise<string> {
    const q = question.toLowerCase();

    if (q.includes('bgc') || q.includes('bonifacio') || q.includes('condo') || q.includes('shang') || q.includes('aurelia')) {
      const matches = allMeetings.filter(
        (m) =>
          m.title.toLowerCase().includes('bgc') ||
          m.summary.overview.toLowerCase().includes('bgc') ||
          m.summary.realEstateMetrics?.location?.toLowerCase().includes('bgc')
      );
      if (matches.length > 0) {
        return `Found **${matches.length} meeting(s)** involving BGC luxury condo developments:\n` +
          matches
            .map(
              (m) =>
                `• **${m.title}** (${new Date(m.createdAt).toLocaleDateString()})\n  - Budget/TCP: ${m.summary.realEstateMetrics?.budgetRange || 'PHP 32M - 40M'}\n  - Overview: ${m.summary.overview}`
            )
            .join('\n\n');
      }
    }

    if (q.includes('broker') || q.includes('commission') || q.includes('carlos') || q.includes('incentive')) {
      const brokerMeetings = allMeetings.filter(
        (m) =>
          m.channelId === 'broker-network' ||
          m.summary.overview.toLowerCase().includes('broker') ||
          m.title.toLowerCase().includes('broker')
      );
      if (brokerMeetings.length > 0) {
        return `Found **${brokerMeetings.length} broker partnership meeting(s)**:\n` +
          brokerMeetings
            .map(
              (m) =>
                `• **${m.title}**\n  - Commission Agreement: ${m.summary.realEstateMetrics?.commissionNotes || '4.5% commission with 50% advance release'}\n  - Key Points: ${m.summary.keyDiscussionPoints.slice(0, 2).join('; ')}`
            )
            .join('\n\n');
      }
    }

    if (q.includes('action') || q.includes('pending') || q.includes('task') || q.includes('todo') || q.includes('deliverable')) {
      const allActions = allMeetings.flatMap((m) => m.actionItems);
      const pending = allActions.filter((a) => a.status !== 'completed');
      return `Across all meetings, there are **${pending.length} pending action items**:\n` +
        pending
          .slice(0, 6)
          .map((a) => `• [${a.priority.toUpperCase()}] **${a.title}** — Assignee: ${a.assignee} (Due: ${a.dueDate})`)
          .join('\n');
    }

    if (q.includes('summary') || q.includes('overview') || q.includes('deal') || q.includes('pipeline')) {
      return `**Tala Real Estate Executive Summary Across ${allMeetings.length} Meeting(s)**:\n` +
        `• Total pipeline volume: BGC Luxury Residences (Shang, Aurelia) & Southern Luzon Commercial Lots (Nuvali/Vermosa).\n` +
        `• Active deals: 2 pre-selling consultations, 1 commercial broker agreement.\n` +
        `• Open action items: ${allMeetings.flatMap((m) => m.actionItems).filter((a) => a.status !== 'completed').length} pending deliverables.`;
    }

    return `Across your meeting library of **${allMeetings.length} meetings**, I searched for "${question}".\n\n` +
      `Relevant insights:\n` +
      allMeetings
        .slice(0, 3)
        .map((m) => `• **${m.title}**: ${m.summary.overview.slice(0, 140)}...`)
        .join('\n');
  }
}

export class FleetAIProvider implements AIIntelligenceEngine {
  private fallback = new MockAIProvider();

  constructor(private endpointUrl: string = 'http://127.0.0.1:8088/v1/chat/completions') {}

  public async generateSummary(
    transcript: TranscriptUtterance[],
    templateId: string,
    meetingTitle: string
  ): Promise<MeetingSummary> {
    try {
      const prompt = `You are Tala AI, an executive meeting notetaker for business development in real estate.
Summarize the following transcript for meeting "${meetingTitle}" (Template: ${templateId}).
Return JSON with:
{
  "overview": "...",
  "keyDiscussionPoints": ["..."],
  "decisionsMade": ["..."],
  "nextSteps": ["..."]
}

Transcript:
${transcript.map((u) => `${u.speaker}: ${u.text}`).join('\n')}`;

      const res = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'fleet-default',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) throw new Error('Fleet AI failed');
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
      return this.fallback.generateSummary(transcript, templateId, meetingTitle);
    } catch {
      return this.fallback.generateSummary(transcript, templateId, meetingTitle);
    }
  }

  public async extractActionItems(
    transcript: TranscriptUtterance[],
    meetingId: string,
    meetingTitle: string
  ): Promise<ActionItem[]> {
    return this.fallback.extractActionItems(transcript, meetingId, meetingTitle);
  }

  public async askAssistant(
    question: string,
    transcript: TranscriptUtterance[],
    summary: MeetingSummary
  ): Promise<string> {
    return this.fallback.askAssistant(question, transcript, summary);
  }

  public async generatePreMeetingBrief(
    meetingTitle: string,
    templateId: string,
    participants: string[],
    agendaItems?: string[],
    carryOverNotes?: string[]
  ): Promise<PreMeetingBrief> {
    return this.fallback.generatePreMeetingBrief(meetingTitle, templateId, participants, agendaItems, carryOverNotes);
  }

  public async queryAcrossAllMeetings(
    question: string,
    allMeetings: Meeting[]
  ): Promise<string> {
    return this.fallback.queryAcrossAllMeetings(question, allMeetings);
  }
}

export function getAIIntelligenceEngine(provider: string): AIIntelligenceEngine {
  if (provider === 'fleet') {
    return new FleetAIProvider();
  }
  return new MockAIProvider();
}

export async function generatePreMeetingBrief(
  meeting: Meeting,
  agenda?: any
): Promise<PreMeetingBrief> {
  const engine = getAIIntelligenceEngine('fleet');
  const agendaTitles = agenda && Array.isArray(agenda.items) ? agenda.items.map((i: any) => i.title) : [];
  const carryOverNotes = agenda && Array.isArray(agenda.items)
    ? agenda.items
        .filter((i: any) => i.carryOverHistory && i.carryOverHistory.carryOverCount > 0)
        .map((i: any) => `${i.title} (carried over ${i.carryOverHistory?.carryOverCount}x)`)
    : [];

  const brief = await engine.generatePreMeetingBrief(
    meeting.title,
    meeting.templateId,
    meeting.participants,
    agendaTitles,
    carryOverNotes
  );

  return {
    ...brief,
    generatedAt: new Date().toISOString(),
    contextOverview: brief.context,
    recommendedTalkingPoints: brief.suggestedQuestions || [],
    riskFactors: brief.potentialObjections || [],
  };
}

export async function queryAcrossAllMeetings(
  question: string,
  allMeetings: Meeting[]
): Promise<{ answer: string; sources: Meeting[] }> {
  const engine = getAIIntelligenceEngine('fleet');
  const answer = await engine.queryAcrossAllMeetings(question, allMeetings);

  const qLower = question.toLowerCase();
  const sources = allMeetings.filter(
    (m) =>
      m.title.toLowerCase().includes(qLower) ||
      m.summary.overview.toLowerCase().includes(qLower) ||
      m.tags.some((t) => t.toLowerCase().includes(qLower)) ||
      (m.summary.realEstateMetrics?.location &&
        m.summary.realEstateMetrics.location.toLowerCase().includes(qLower))
  ).slice(0, 3);

  return {
    answer,
    sources: sources.length > 0 ? sources : allMeetings.slice(0, 2),
  };
}

