import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  ChevronRight,
  RotateCcw,
  ListOrdered,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { Meeting } from '../types';
import { AgendaManager, calculateTimeboxSummary, createFollowUpAgendaWithCarryOver, getAllTemplates, instantiateAgendaFromTemplate, REAL_ESTATE_TEMPLATES } from '../prep';
import type { Agenda, AgendaItem, TalkingPoint, MeetingTemplate as PrepTemplate } from '../prep';
import { generatePreMeetingBrief } from '../services/aiIntelligence';
import { saveMeeting } from '../services/storage';
import { pushFollowUpCalendarEvent } from '../services/composioCalendar';

interface AgendaEditorViewProps {
  meeting: Meeting;
  onUpdateMeeting: (meeting: Meeting) => void;
  onOpenFollowUpMeeting?: (meeting: Meeting) => void;
}

export const AgendaEditorView: React.FC<AgendaEditorViewProps> = ({
  meeting,
  onUpdateMeeting,
  onOpenFollowUpMeeting,
}) => {
  const templates: PrepTemplate[] = getAllTemplates();
  const realEstateTemplates: readonly PrepTemplate[] = REAL_ESTATE_TEMPLATES;

  // If meeting already has an agenda, use it; otherwise initialize a default one
  const [currentAgenda, setCurrentAgenda] = useState<Agenda>(() => {
    if (meeting.agenda) return meeting.agenda;
    const initialTpl = realEstateTemplates[0] || templates[0];
    return instantiateAgendaFromTemplate(initialTpl, {
      title: `${meeting.title} — Agenda`,
      participants: meeting.participants.map((name, i) => ({
        id: `p-${i}`,
        name,
      })),
    });
  });

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemTimebox, setNewItemTimebox] = useState<number>(15);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [carryOverNotice, setCarryOverNotice] = useState<string | null>(null);

  // Synchronize changes to parent meeting
  const saveAgendaState = (updatedAgenda: Agenda) => {
    setCurrentAgenda(updatedAgenda);
    onUpdateMeeting({
      ...meeting,
      agenda: updatedAgenda,
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const nextAgenda = instantiateAgendaFromTemplate(tpl, {
      title: `${meeting.title} — Agenda`,
      participants: meeting.participants.map((name, i) => ({
        id: `p-${i}`,
        name,
      })),
    });
    saveAgendaState(nextAgenda);
  };

  const handleMoveUp = (itemId: string, currentOrder: number) => {
    if (currentOrder <= 1) return;
    const manager = new AgendaManager(currentAgenda);
    manager.moveItem(itemId, 'up');
    saveAgendaState(manager.getRaw());
  };

  const handleMoveDown = (itemId: string, currentOrder: number) => {
    if (currentOrder >= currentAgenda.items.length) return;
    const manager = new AgendaManager(currentAgenda);
    manager.moveItem(itemId, 'down');
    saveAgendaState(manager.getRaw());
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    const manager = new AgendaManager(currentAgenda);
    manager.addItem({
      title: newItemTitle.trim(),
      timeBoxMinutes: newItemTimebox,
    });
    saveAgendaState(manager.getRaw());
    setNewItemTitle('');
  };

  const handleRemoveItem = (itemId: string) => {
    const manager = new AgendaManager(currentAgenda);
    manager.removeItem(itemId);
    saveAgendaState(manager.getRaw());
  };

  const handleToggleTalkingPoint = (itemId: string, pointId: string) => {
    const manager = new AgendaManager(currentAgenda);
    manager.toggleTalkingPoint(itemId, pointId);
    saveAgendaState(manager.getRaw());
  };

  const handleAddTalkingPoint = (itemId: string, text: string) => {
    if (!text.trim()) return;
    const manager = new AgendaManager(currentAgenda);
    manager.addTalkingPoint(itemId, text.trim());
    saveAgendaState(manager.getRaw());
  };

  // Generate Pre-Meeting AI Brief
  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      const brief = await generatePreMeetingBrief(meeting, currentAgenda);
      onUpdateMeeting({
        ...meeting,
        agenda: currentAgenda,
        preMeetingBrief: brief,
      });
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Carry Over Agenda to Follow-up Meeting
  const handleCarryOver = async () => {
    const followUpTitle = `Follow-up: ${meeting.title}`;
    const manager = new AgendaManager(currentAgenda);
    const followUpManager = manager.createFollowUp({
      title: followUpTitle,
    });
    const nextAgenda = followUpManager.getRaw();

    const followUpMeeting: Meeting = {
      id: `mtg-followup-${Date.now()}`,
      title: followUpTitle,
      createdAt: new Date().toISOString(),
      durationSeconds: 1800,
      channelId: meeting.channelId,
      channelName: meeting.channelName,
      templateId: meeting.templateId,
      templateName: meeting.templateName,
      participants: meeting.participants,
      language: meeting.language,
      status: 'completed',
      agenda: nextAgenda,
      summary: {
        overview: `Follow-up meeting generated from ${meeting.title}. Carried over unfinished discussion topics and commitments.`,
        keyDiscussionPoints: nextAgenda.items.map((i: AgendaItem) => `Carried over topic: ${i.title}`),
        decisionsMade: [],
        nextSteps: ['Complete remaining deal review items.'],
      },
      actionItems: meeting.actionItems.filter((a) => a.status !== 'completed'),
      transcript: [],
      tags: [...meeting.tags, 'Follow-up'],
    };

    const calRes = await pushFollowUpCalendarEvent({
      title: followUpTitle,
      description: `Follow-up meeting carried over from ${meeting.title}. Topics: ${nextAgenda.items
        .map((i: AgendaItem) => i.title)
        .join(', ')}`,
      startTime: new Date(Date.now() + 7 * 86400000).toISOString(),
      durationMinutes: manager.getTimeboxSummary().totalAllocatedMinutes || 45,
      attendees: meeting.participants,
      location: meeting.summary.realEstateMetrics?.location,
    });

    if (calRes.enabled && calRes.event) {
      followUpMeeting.calendarEventId = calRes.event.id;
      followUpMeeting.calendarEventLink = calRes.event.htmlLink;
      followUpMeeting.tags.push('Google Calendar', 'Composio Sync');
    }

    await saveMeeting(followUpMeeting);
    setCarryOverNotice(
      calRes.enabled && calRes.event
        ? `Follow-up meeting "${followUpTitle}" created with ${nextAgenda.items.length} carried-over topics and synced to Google Calendar (${calRes.event.id}).`
        : `Follow-up meeting "${followUpTitle}" created with ${nextAgenda.items.length} carried-over topics.`
    );

    if (onOpenFollowUpMeeting) {
      onOpenFollowUpMeeting(followUpMeeting);
    }
  };

  const manager = new AgendaManager(currentAgenda);
  const totalMinutes = manager.getTimeboxSummary().totalAllocatedMinutes;

  return (
    <div
      className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6"
      data-testid="agenda-editor-view"
    >
      {carryOverNotice && (
        <div
          data-testid="carry-over-notice-banner"
          className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center space-x-2"
        >
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{carryOverNotice}</span>
        </div>
      )}

      {/* Top Controls Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <ListOrdered className="w-4 h-4 text-brand-400" />
            <span>Collaborative Meeting Agenda & Prep</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Configure structured timeboxes, reorder talking points, and generate pre-meeting briefs.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {/* Template Selector */}
          <div className="flex items-center space-x-1.5">
            <label className="text-[11px] font-medium text-slate-400">Template:</label>
            <select
              value={currentAgenda.templateId || ''}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              data-testid="agenda-template-picker"
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <optgroup label="Real Estate Templates">
                {realEstateTemplates.map((t: PrepTemplate) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="General Business">
                {templates
                  .filter((t: PrepTemplate) => t.category !== 'real-estate')
                  .map((t: PrepTemplate) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Pre-Meeting Brief Generator Button */}
          <button
            onClick={handleGenerateBrief}
            disabled={isGeneratingBrief}
            data-testid="generate-pre-brief-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingBrief ? 'Generating Brief...' : 'Generate AI Brief'}</span>
          </button>

          {/* Carry Over Button */}
          <button
            onClick={handleCarryOver}
            data-testid="carry-over-agenda-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Carry-Over to Follow-Up</span>
          </button>
        </div>
      </div>

      {/* Timebox Metric Strip */}
      <div className="grid grid-cols-3 gap-4" data-testid="agenda-timebox-summary">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">{totalMinutes} Minutes Total</div>
            <div className="text-[11px] text-slate-400">Planned Duration</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">{currentAgenda.items.length} Agenda Items</div>
            <div className="text-[11px] text-slate-400">Structured Topics</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {currentAgenda.items.reduce((s, i) => s + (i.talkingPoints?.length || 0), 0)} Points
            </div>
            <div className="text-[11px] text-slate-400">Collaborative Talking Points</div>
          </div>
        </div>
      </div>

      {/* Pre-Meeting Brief Card (if generated) */}
      {(meeting.preMeetingBrief || isGeneratingBrief) && (
        <div
          className="p-4 rounded-2xl bg-gradient-to-br from-brand-950/40 to-slate-900 border border-brand-500/30 space-y-3"
          data-testid="pre-meeting-brief-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Pre-Meeting Executive Brief
              </h3>
            </div>
            {meeting.preMeetingBrief?.generatedAt && (
              <span className="text-[10px] text-slate-400">
                Generated {new Date(meeting.preMeetingBrief.generatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {meeting.preMeetingBrief ? (
            <div className="space-y-3 text-xs text-slate-200">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-brand-400">Context Overview: </span>
                {meeting.preMeetingBrief.contextOverview || meeting.preMeetingBrief.context}
              </div>

              {(meeting.preMeetingBrief.recommendedTalkingPoints || []).length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Recommended Talking Points:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    {(meeting.preMeetingBrief.recommendedTalkingPoints || []).map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(meeting.preMeetingBrief.riskFactors || []).length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                    Potential Objections & Risk Factors:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-amber-200/90">
                    {(meeting.preMeetingBrief.riskFactors || []).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 animate-pulse">
              Synthesizing participants, deal history, and talking points into executive pre-meeting brief...
            </div>
          )}
        </div>
      )}

      {/* Agenda Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Agenda Items & Timeboxes ({currentAgenda.items.length})
          </h3>
        </div>

        <div className="space-y-3">
          {currentAgenda.items.map((item, index) => (
            <div
              key={item.id}
              data-testid={`agenda-item-${item.id}`}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 transition"
            >
              {/* Item Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-center shrink-0">
                    {item.order || index + 1}
                  </span>
                  <span
                    className="text-xs font-bold text-white truncate"
                    data-testid={`agenda-item-title-${item.id}`}
                  >
                    {item.title}
                  </span>
                  {item.carryOverHistory && item.carryOverHistory.carryOverCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Carried Over (x{item.carryOverHistory.carryOverCount})
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60"
                    data-testid={`timebox-${item.id}`}
                  >
                    {item.timeBoxMinutes} mins
                  </span>

                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveUp(item.id, item.order || index + 1)}
                    disabled={index === 0}
                    data-testid={`move-up-${item.id}`}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveDown(item.id, item.order || index + 1)}
                    disabled={index === currentAgenda.items.length - 1}
                    data-testid={`move-down-${item.id}`}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    data-testid={`remove-item-${item.id}`}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className="text-[11px] text-slate-400 pl-7">{item.description}</p>
              )}

              {/* Talking Points List */}
              <div className="pl-7 space-y-1.5">
                {(item.talkingPoints || []).map((pt) => (
                  <div
                    key={pt.id}
                    onClick={() => handleToggleTalkingPoint(item.id, pt.id)}
                    data-testid={`talking-point-${pt.id}`}
                    className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                  >
                    {pt.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className={pt.completed ? 'line-through text-slate-500' : ''}>
                      {pt.text}
                    </span>
                  </div>
                ))}

                {/* Quick Add Talking Point */}
                <input
                  type="text"
                  placeholder="+ Add talking point (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTalkingPoint(item.id, (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New Agenda Item Form */}
        <form
          onSubmit={handleAddItem}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3"
        >
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="New agenda topic (e.g. Discuss Letter of Intent terms)..."
            data-testid="new-agenda-item-input"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400">Minutes:</span>
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={newItemTimebox}
              onChange={(e) => setNewItemTimebox(Number(e.target.value))}
              data-testid="new-agenda-timebox-input"
              className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-center text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newItemTitle.trim()}
            data-testid="add-agenda-item-btn"
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </form>
      </div>
    </div>
  );
};
