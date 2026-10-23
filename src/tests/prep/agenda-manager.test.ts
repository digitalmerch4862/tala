import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { AgendaManager } from '../../prep/agenda/agenda-manager.js';
import { getTemplateById } from '../../prep/templates/loader.js';

describe('AgendaManager - Collaborative Agenda Operations', () => {
  it('should create an empty agenda with defaults', () => {
    const mgr = AgendaManager.create({ title: 'Ad-hoc Sync' });
    const raw = mgr.getRaw();

    assert.equal(raw.title, 'Ad-hoc Sync');
    assert.equal(raw.status, 'draft');
    assert.equal(raw.items.length, 0);
  });

  it('should initialize an agenda from a template', () => {
    const template = getTemplateById('gen-weekly-team-sync')!;
    const mgr = AgendaManager.fromTemplate(template);

    assert.equal(mgr.getItems().length, template.sections.length);
    assert.equal(mgr.getRaw().templateId, 'gen-weekly-team-sync');
  });

  it('should add items and keep order 1-indexed and consecutive', () => {
    const mgr = AgendaManager.create({ title: 'Test Agenda' });

    const i1 = mgr.addItem({ title: 'Item 1', timeBoxMinutes: 10 });
    const i2 = mgr.addItem({ title: 'Item 2', timeBoxMinutes: 15 });
    const i3 = mgr.addItem({ title: 'Item 3', timeBoxMinutes: 20 });

    assert.equal(i1.order, 1);
    assert.equal(i2.order, 2);
    assert.equal(i3.order, 3);
    assert.equal(mgr.getItems().length, 3);
  });

  it('should insert items at a specific index and renormalize order', () => {
    const mgr = AgendaManager.create({ title: 'Test Agenda' });
    mgr.addItem({ title: 'First', timeBoxMinutes: 5 });
    mgr.addItem({ title: 'Third', timeBoxMinutes: 5 });

    const inserted = mgr.insertItemAt({ title: 'Second', timeBoxMinutes: 10 }, 1);
    assert.equal(inserted.title, 'Second');

    const items = mgr.getItems();
    assert.equal(items.length, 3);
    assert.equal(items[0].title, 'First');
    assert.equal(items[0].order, 1);
    assert.equal(items[1].title, 'Second');
    assert.equal(items[1].order, 2);
    assert.equal(items[2].title, 'Third');
    assert.equal(items[2].order, 3);
  });

  it('should remove items and re-index remaining items', () => {
    const mgr = AgendaManager.create({ title: 'Test Agenda' });
    const i1 = mgr.addItem({ title: 'One', timeBoxMinutes: 5 });
    const i2 = mgr.addItem({ title: 'Two', timeBoxMinutes: 5 });
    const i3 = mgr.addItem({ title: 'Three', timeBoxMinutes: 5 });

    const removed = mgr.removeItem(i2.id);
    assert.equal(removed, true);

    const items = mgr.getItems();
    assert.equal(items.length, 2);
    assert.equal(items[0].id, i1.id);
    assert.equal(items[0].order, 1);
    assert.equal(items[1].id, i3.id);
    assert.equal(items[1].order, 2);
  });

  it('should update item attributes', () => {
    const mgr = AgendaManager.create({ title: 'Test Agenda' });
    const item = mgr.addItem({ title: 'Initial Title', timeBoxMinutes: 10 });

    const updated = mgr.updateItem(item.id, {
      title: 'Updated Title',
      timeBoxMinutes: 25,
      notes: 'Some detailed meeting notes'
    });

    assert.equal(updated.title, 'Updated Title');
    assert.equal(updated.timeBoxMinutes, 25);
    assert.equal(updated.notes, 'Some detailed meeting notes');
  });

  it('should reorder items with explicit ID sequence', () => {
    const mgr = AgendaManager.create({ title: 'Test Agenda' });
    const a = mgr.addItem({ title: 'A', timeBoxMinutes: 5 });
    const b = mgr.addItem({ title: 'B', timeBoxMinutes: 5 });
    const c = mgr.addItem({ title: 'C', timeBoxMinutes: 5 });

    // Reverse order: C, B, A
    mgr.reorderItems([c.id, b.id, a.id]);

    const items = mgr.getItems();
    assert.equal(items[0].id, c.id);
    assert.equal(items[0].order, 1);
    assert.equal(items[1].id, b.id);
    assert.equal(items[1].order, 2);
    assert.equal(items[2].id, a.id);
    assert.equal(items[2].order, 3);
  });

  it('should move an item up or down', () => {
    const mgr = AgendaManager.create({ title: 'Test Agenda' });
    const a = mgr.addItem({ title: 'A', timeBoxMinutes: 5 });
    const b = mgr.addItem({ title: 'B', timeBoxMinutes: 5 });
    const c = mgr.addItem({ title: 'C', timeBoxMinutes: 5 });

    // Move middle item up
    const movedUp = mgr.moveItem(b.id, 'up');
    assert.equal(movedUp, true);
    assert.equal(mgr.getItems()[0].id, b.id);
    assert.equal(mgr.getItems()[1].id, a.id);

    // Cannot move first item up further
    assert.equal(mgr.moveItem(b.id, 'up'), false);

    // Move first item down
    assert.equal(mgr.moveItem(b.id, 'down'), true);
    assert.equal(mgr.getItems()[1].id, b.id);
  });

  it('should manage item status, talking points, and action items', () => {
    const mgr = AgendaManager.create({ title: 'Test Agenda' });
    const item = mgr.addItem({ title: 'Discussion Item', timeBoxMinutes: 15 });

    mgr.setItemStatus(item.id, 'in_progress');
    assert.equal(mgr.getItemById(item.id)?.status, 'in_progress');

    const tp = mgr.addTalkingPoint(item.id, 'Check feasibility of API');
    assert.equal(tp.completed, false);
    mgr.toggleTalkingPoint(item.id, tp.id);
    assert.equal(mgr.getItemById(item.id)?.talkingPoints[0].completed, true);

    const act = mgr.addActionItem(item.id, 'Follow up with vendor', 'John', '2026-10-20');
    assert.equal(act.task, 'Follow up with vendor');
    assert.equal(act.completed, false);
    mgr.toggleActionItem(item.id, act.id);
    assert.equal(mgr.getItemById(item.id)?.actionItems[0].completed, true);
  });

  it('should calculate timebox summary and timeline offsets correctly', () => {
    const mgr = AgendaManager.create({
      title: 'Timebox Check',
      targetTotalDurationMinutes: 30
    });

    mgr.addItem({ title: 'Intro', timeBoxMinutes: 10, status: 'completed' });
    mgr.addItem({ title: 'Deep Dive', timeBoxMinutes: 15, status: 'in_progress' });
    mgr.addItem({ title: 'Wrap-up', timeBoxMinutes: 10, status: 'pending' });

    const summary = mgr.getTimeboxSummary();

    assert.equal(summary.totalAllocatedMinutes, 35);
    assert.equal(summary.targetDurationMinutes, 30);
    assert.equal(summary.isOverAllocated, true);
    assert.equal(summary.overAllocatedMinutes, 5);
    assert.equal(summary.completedItemCount, 1);
    assert.equal(summary.pendingItemCount, 2); // 1 in_progress + 1 pending
    assert.equal(summary.timeline.length, 3);

    // Offsets check:
    // Item 1: 0 -> 10
    assert.equal(summary.timeline[0].cumulativeStartOffsetMinutes, 0);
    assert.equal(summary.timeline[0].cumulativeEndOffsetMinutes, 10);
    // Item 2: 10 -> 25
    assert.equal(summary.timeline[1].cumulativeStartOffsetMinutes, 10);
    assert.equal(summary.timeline[1].cumulativeEndOffsetMinutes, 25);
    // Item 3: 25 -> 35
    assert.equal(summary.timeline[2].cumulativeStartOffsetMinutes, 25);
    assert.equal(summary.timeline[2].cumulativeEndOffsetMinutes, 35);
  });
});
