import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { AgendaManager } from '../../prep/agenda/agenda-manager.js';

describe('Carry-Over Engine - Unfinished Agenda Items', () => {
  it('should extract pending and in_progress items by default', () => {
    const mgr = AgendaManager.create({ title: 'Meeting 1' });
    mgr.addItem({ title: 'Done Item', timeBoxMinutes: 10, status: 'completed' });
    mgr.addItem({ title: 'Pending Item', timeBoxMinutes: 15, status: 'pending' });
    mgr.addItem({ title: 'Halfway Item', timeBoxMinutes: 10, status: 'in_progress' });
    mgr.addItem({ title: 'Skipped Item', timeBoxMinutes: 5, status: 'skipped' });

    const unfinished = mgr.getUnfinishedItems();
    assert.equal(unfinished.length, 2);
    assert.equal(unfinished[0].title, 'Pending Item');
    assert.equal(unfinished[1].title, 'Halfway Item');
  });

  it('should allow including skipped items in carry-over when requested', () => {
    const mgr = AgendaManager.create({ title: 'Meeting 1' });
    mgr.addItem({ title: 'Done Item', timeBoxMinutes: 10, status: 'completed' });
    mgr.addItem({ title: 'Skipped Item', timeBoxMinutes: 5, status: 'skipped' });

    const unfinished = mgr.getUnfinishedItems(['pending', 'in_progress', 'skipped']);
    assert.equal(unfinished.length, 1);
    assert.equal(unfinished[0].title, 'Skipped Item');
  });

  it('should carry over unfinished items to an existing target agenda', () => {
    const sourceMgr = AgendaManager.create({ id: 'm1', title: 'Sprint 1 Review' });
    sourceMgr.addItem({ title: 'Architecture RFC', timeBoxMinutes: 20, status: 'in_progress', notes: 'Needs another review pass' });
    sourceMgr.addItem({ title: 'Demo Shipped Feature', timeBoxMinutes: 10, status: 'completed' });

    const targetMgr = AgendaManager.create({ id: 'm2', title: 'Sprint 2 Planning' });
    targetMgr.addItem({ title: 'Sprint 2 Goal Setting', timeBoxMinutes: 15 });

    const carried = sourceMgr.carryOverTo(targetMgr, {
      prefixTitle: true,
      reason: 'Ran out of time during sprint review'
    });

    assert.equal(carried.length, 1);
    assert.equal(targetMgr.getItems().length, 2);

    const carriedItem = targetMgr.getItems()[1];
    assert.equal(carriedItem.order, 2);
    assert.equal(carriedItem.title, '[Carried Over] Architecture RFC');
    assert.equal(carriedItem.status, 'pending');
    assert.equal(carriedItem.isCarriedOver, true);
    assert.equal(carriedItem.notes, 'Needs another review pass');

    // Verify lineage history
    assert.ok(carriedItem.carryOverHistory);
    assert.equal(carriedItem.carryOverHistory!.originalMeetingId, 'm1');
    assert.equal(carriedItem.carryOverHistory!.originalMeetingTitle, 'Sprint 1 Review');
    assert.equal(carriedItem.carryOverHistory!.carryOverCount, 1);
    assert.equal(carriedItem.carryOverHistory!.carriedOverReason, 'Ran out of time during sprint review');
  });

  it('should increment carry-over counter on multi-hop carry-overs', () => {
    const meeting1 = AgendaManager.create({ id: 'm1', title: 'Sync 1' });
    meeting1.addItem({ title: 'Stubborn Topic', timeBoxMinutes: 10, status: 'pending' });

    const meeting2 = AgendaManager.create({ id: 'm2', title: 'Sync 2' });
    meeting1.carryOverTo(meeting2);

    // Topic remains unfinished in meeting 2
    assert.equal(meeting2.getItems()[0].carryOverHistory?.carryOverCount, 1);

    const meeting3 = AgendaManager.create({ id: 'm3', title: 'Sync 3' });
    meeting2.carryOverTo(meeting3);

    // Topic should now have carryOverCount = 2
    const finalItem = meeting3.getItems()[0];
    assert.equal(finalItem.carryOverHistory?.carryOverCount, 2);
    assert.equal(finalItem.carryOverHistory?.originalMeetingId, 'm2');
  });

  it('should create a complete follow-up agenda directly via createFollowUp', () => {
    const sourceMgr = AgendaManager.create({
      id: 'm1',
      title: 'Real Estate Developer Negotiation Session',
      participants: [
        { id: 'p1', name: 'Broker Rad' },
        { id: 'p2', name: 'Developer Rep' }
      ]
    });

    sourceMgr.addItem({ title: 'Review Floorplans', timeBoxMinutes: 15, status: 'completed' });
    sourceMgr.addItem({ title: 'Negotiate Co-Broker Commission Split', timeBoxMinutes: 20, status: 'pending' });
    sourceMgr.addItem({ title: 'Signing Protocols for Overseas Buyers', timeBoxMinutes: 15, status: 'in_progress' });

    const followUpMgr = sourceMgr.createFollowUp({
      title: 'Developer Negotiation - Part 2 Follow-Up'
    }, {
      prefixTitle: false
    });

    const followUpRaw = followUpMgr.getRaw();
    assert.equal(followUpRaw.title, 'Developer Negotiation - Part 2 Follow-Up');
    assert.equal(followUpRaw.participants.length, 2);
    assert.equal(followUpRaw.items.length, 2);
    assert.equal(followUpRaw.items[0].title, 'Negotiate Co-Broker Commission Split');
    assert.equal(followUpRaw.items[0].status, 'pending');
    assert.equal(followUpRaw.items[0].order, 1);
    assert.equal(followUpRaw.items[1].title, 'Signing Protocols for Overseas Buyers');
    assert.equal(followUpRaw.items[1].status, 'pending');
    assert.equal(followUpRaw.items[1].order, 2);
  });

  it('should filter selected item IDs when specified in options', () => {
    const source = AgendaManager.create({ title: 'Session A' });
    source.addItem({ title: 'Item 1', timeBoxMinutes: 10, status: 'pending' });
    const item2 = source.addItem({ title: 'Item 2', timeBoxMinutes: 10, status: 'pending' });

    const target = AgendaManager.create({ title: 'Session B' });
    source.carryOverTo(target, {
      selectedItemIds: [item2.id]
    });

    assert.equal(target.getItems().length, 1);
    assert.equal(target.getItems()[0].description, item2.description);
  });

  it('should preserve open action items during carry over', () => {
    const source = AgendaManager.create({ title: 'Session A' });
    const item = source.addItem({ title: 'Contract Review', timeBoxMinutes: 15, status: 'in_progress' });
    source.addActionItem(item.id, 'Finished Task', undefined, undefined);
    source.addActionItem(item.id, 'Unfinished Task', undefined, undefined);

    // Mark first task completed
    source.getItemById(item.id)!.actionItems[0].completed = true;

    const followUp = source.createFollowUp({ title: 'Session B' });
    const carriedItem = followUp.getItems()[0];

    // Only unfinished action item should be carried over
    assert.equal(carriedItem.actionItems.length, 1);
    assert.equal(carriedItem.actionItems[0].task, 'Unfinished Task');
  });
});
