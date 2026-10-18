import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../services/aiIntelligence';
import type { TranscriptUtterance } from '../types';

describe('Tala AI Intelligence Engine', () => {
  const provider = new MockAIProvider();

  const mockClientDiscoveryTranscript: TranscriptUtterance[] = [
    {
      id: 'utt-1',
      speaker: 'Rad (BDM)',
      text: 'Good day! Thanks for meeting today. What specific condominium properties are you exploring in BGC?',
      startSec: 0,
      endSec: 10,
    },
    {
      id: 'utt-2',
      speaker: 'Sarah Tan',
      text: 'Hi Rad. We want a 2-bedroom pre-selling unit with a budget of PHP 32M to 35M in Bonifacio Global City.',
      startSec: 11,
      endSec: 25,
    },
  ];

  it('generates structured executive summary with real estate parameters', async () => {
    const summary = await provider.generateSummary(
      mockClientDiscoveryTranscript,
      'client-discovery',
      'Shang Residences BGC Discovery'
    );

    expect(summary.overview).toContain('Executive property discovery session');
    expect(summary.keyDiscussionPoints.length).toBeGreaterThan(0);
    expect(summary.decisionsMade.length).toBeGreaterThan(0);
    expect(summary.nextSteps.length).toBeGreaterThan(0);

    expect(summary.realEstateMetrics).toBeDefined();
    expect(summary.realEstateMetrics?.location).toContain('BGC');
    expect(summary.realEstateMetrics?.budgetRange).toBe('PHP 25M - PHP 35M');
  });

  it('extracts prioritized action items with assignees and due dates', async () => {
    const transcriptWithComputation: TranscriptUtterance[] = [
      {
        id: 'u-1',
        speaker: 'Rad (BDM)',
        text: 'I will prepare the official computation sheet and schedule a private showroom viewing.',
        startSec: 0,
        endSec: 10,
      },
    ];

    const actionItems = await provider.extractActionItems(
      transcriptWithComputation,
      'meeting-1',
      'Showroom Consultation'
    );

    expect(actionItems.length).toBeGreaterThanOrEqual(1);
    const computationTask = actionItems.find((a) => a.title.toLowerCase().includes('computation'));
    expect(computationTask).toBeDefined();
    expect(computationTask?.assignee).toBe('Rad (BDM)');
    expect(computationTask?.priority).toBe('high');
    expect(computationTask?.status).toBe('todo');
  });

  it('answers meeting assistant questions using transcript and summary context', async () => {
    const summary = await provider.generateSummary(
      mockClientDiscoveryTranscript,
      'client-discovery',
      'BGC Consultation'
    );

    const budgetAnswer = await provider.askAssistant('What is the budget?', mockClientDiscoveryTranscript, summary);
    expect(budgetAnswer).toContain('PHP 25M - PHP 35M');

    const decisionsAnswer = await provider.askAssistant('What was decided?', mockClientDiscoveryTranscript, summary);
    expect(decisionsAnswer).toContain('Key decisions made');

    const actionAnswer = await provider.askAssistant('What are the next steps?', mockClientDiscoveryTranscript, summary);
    expect(actionAnswer).toContain('Agreed next steps');
  });
});
