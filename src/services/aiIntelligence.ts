import { TranscriptUtterance, MeetingSummary, ActionItem, Priority } from '../types';

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
}

export function getAIIntelligenceEngine(provider: string): AIIntelligenceEngine {
  if (provider === 'fleet') {
    return new FleetAIProvider();
  }
  return new MockAIProvider();
}
