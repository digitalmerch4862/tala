import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { getAllTemplates, getTemplateById, getTemplatesByCategory, searchTemplates, filterTemplates, validateTemplate, instantiateAgendaFromTemplate, REAL_ESTATE_TEMPLATES, GENERAL_TEMPLATES, BUILTIN_TEMPLATES } from '../../prep/templates/index.js';
import type { MeetingTemplate } from '../../prep/templates/index.js';

describe('Meeting Template Library & Registry', () => {
  it('should register built-in templates (5 real-estate, 8 general)', () => {
    assert.equal(BUILTIN_TEMPLATES.length, 13);
    assert.equal(REAL_ESTATE_TEMPLATES.length, 5);
    assert.equal(GENERAL_TEMPLATES.length, 8);

    const all = getAllTemplates();
    assert.equal(all.length, 13);
  });

  it('should contain all required 5 real-estate templates', () => {
    const expectedIds = [
      're-client-discovery',
      're-site-viewing',
      're-developer-broker-call',
      're-financing-consultation',
      're-closing-followup'
    ];

    for (const id of expectedIds) {
      const template = getTemplateById(id);
      assert.ok(template, `Expected template '${id}' to exist`);
      assert.equal(template!.category, 'real-estate');
      assert.ok(template!.sections.length >= 4, `Template '${id}' should have detailed sections`);
      assert.ok(template!.suggestedDurationMinutes > 0);
    }
  });

  it('should contain all required general templates', () => {
    const expectedIds = [
      'gen-team-standup',
      'gen-client-call',
      'gen-one-on-one',
      'gen-sales-call',
      'gen-project-planning',
      'gen-weekly-team-sync',
      'gen-project-kickoff',
      'gen-retrospective'
    ];

    for (const id of expectedIds) {
      const template = getTemplateById(id);
      assert.ok(template, `Expected template '${id}' to exist`);
      assert.equal(template!.category, 'general');
      assert.ok(template!.sections.length >= 4, `Template '${id}' should have detailed sections`);
      assert.ok(template!.suggestedDurationMinutes > 0);
    }
  });

  it('should validate all built-in templates successfully with no schema errors', () => {
    for (const template of BUILTIN_TEMPLATES) {
      const result = validateTemplate(template);
      assert.equal(result.valid, true, `Validation failed for ${template.id}: ${result.errors.join(', ')}`);
      assert.equal(result.errors.length, 0);
    }
  });

  it('should detect invalid templates during validation', () => {
    const invalidTemplate: MeetingTemplate = {
      id: '',
      title: '',
      description: '',
      category: 'custom',
      targetAudience: '',
      suggestedDurationMinutes: -5,
      tags: [],
      sections: []
    };

    const res = validateTemplate(invalidTemplate);
    assert.equal(res.valid, false);
    assert.ok(res.errors.length >= 4);
  });

  it('should filter templates by category', () => {
    const reTemplates = getTemplatesByCategory('real-estate');
    assert.equal(reTemplates.length, 5);
    assert.ok(reTemplates.every(t => t.category === 'real-estate'));

    const genTemplates = getTemplatesByCategory('general');
    assert.equal(genTemplates.length, 8);
    assert.ok(genTemplates.every(t => t.category === 'general'));
  });

  it('should search templates by keyword across title, description, and sections', () => {
    const searchBroker = searchTemplates('broker');
    assert.ok(searchBroker.some(t => t.id === 're-developer-broker-call'));

    const searchFinancing = searchTemplates('mortgage');
    assert.ok(searchFinancing.some(t => t.id === 're-financing-consultation'));

    const searchKickoff = searchTemplates('RACI');
    assert.ok(searchKickoff.some(t => t.id === 'gen-project-kickoff'));
  });

  it('should filter templates with multi-criteria options', () => {
    const filtered = filterTemplates({
      category: 'real-estate',
      maxDurationMinutes: 45
    });

    assert.ok(filtered.length > 0);
    assert.ok(filtered.every(t => t.category === 'real-estate' && t.suggestedDurationMinutes <= 45));
  });

  it('should allow instantiating an agenda model from a template', () => {
    const template = getTemplateById('re-client-discovery')!;
    const agenda = instantiateAgendaFromTemplate(template, {
      title: 'Tripping Prep for John Doe',
      participants: [
        { id: 'u1', name: 'Agent Rad', role: 'Property Consultant' },
        { id: 'u2', name: 'Buyer John', role: 'Prospective Buyer' }
      ],
      roleAssignments: {
        'Property Consultant': { id: 'u1', name: 'Agent Rad' }
      }
    });

    assert.equal(agenda.title, 'Tripping Prep for John Doe');
    assert.equal(agenda.templateId, 're-client-discovery');
    assert.equal(agenda.participants.length, 2);
    assert.equal(agenda.items.length, template.sections.length);

    // Verify ordering is sequential 1..N
    agenda.items.forEach((item, idx) => {
      assert.equal(item.order, idx + 1);
      assert.equal(item.status, 'pending');
      assert.equal(item.isCarriedOver, false);
    });

    // Check role assignment worked
    const firstItem = agenda.items[0];
    assert.equal(firstItem.owner?.name, 'Agent Rad');
  });

  it('should support duration overrides when instantiating from template', () => {
    const agenda = instantiateAgendaFromTemplate('gen-one-on-one', {
      durationOverrides: {
        'wellbeing-pulse-check': 15
      }
    });

    const wellbeingItem = agenda.items.find(i => i.tags?.includes('wellbeing-pulse-check'));
    assert.ok(wellbeingItem);
    assert.equal(wellbeingItem!.timeBoxMinutes, 15);
  });
});
