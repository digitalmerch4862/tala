import { describe, it, expect } from 'vitest';
import { MEETING_TEMPLATES } from '../templates/meetingTemplates';

describe('Tala Meeting Templates Catalog', () => {
  it('includes all required general, real estate, and executive templates', () => {
    const ids = MEETING_TEMPLATES.map((t) => t.id);

    expect(ids).toContain('team-standup');
    expect(ids).toContain('client-call');
    expect(ids).toContain('one-on-one');
    expect(ids).toContain('sales-call');
    expect(ids).toContain('project-planning');
    expect(ids).toContain('client-discovery');
    expect(ids).toContain('site-viewing');
    expect(ids).toContain('developer-broker-alignment');
    expect(ids).toContain('financing-mortgage');
    expect(ids).toContain('closing-reservation');
    expect(ids).toContain('executive-one-on-one');
    expect(ids).toContain('general-meeting');
  });

  it('validates each template has structured agendas and instructions', () => {
    for (const tmpl of MEETING_TEMPLATES) {
      expect(tmpl.name.length).toBeGreaterThan(0);
      expect(tmpl.suggestedAgenda.length).toBeGreaterThanOrEqual(3);
      expect(tmpl.systemInstructions).toContain('Tala AI');
    }
  });
});
