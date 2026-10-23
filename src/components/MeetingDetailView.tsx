import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Copy,
  Download,
  Share2,
  Check,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Search,
  Sparkles,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Home,
  Tag,
  Building,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Meeting, ActionItem, ActionItemStatus, Priority, TranscriptUtterance, TalaSettings } from '../types';
import { getAIIntelligenceEngine } from '../services/aiIntelligence';
import { AgendaEditorView } from './AgendaEditorView';
import { VersionHistoryModal } from './VersionHistoryModal';
import { RedactionModal } from './RedactionModal';
import { ShareExportModal } from './ShareExportModal';
import { History, ShieldAlert, ListOrdered } from 'lucide-react';

interface MeetingDetailViewProps {
  meeting: Meeting;
  onBack: () => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: string) => void;
  llmProvider: string;
  settings?: TalaSettings;
}

export type DetailTab = 'summary' | 'agenda' | 'transcript' | 'actions' | 'chat';

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  meeting,
  onBack,
  onUpdateMeeting,
  onDeleteMeeting,
  llmProvider,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('summary');
  const [copiedText, setCopiedText] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState('all');

  // Modal states
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isRedactionModalOpen, setIsRedactionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Audio Playback simulation
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ask AI Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `Hello! I have fully processed **${meeting.title}**. You can ask me any question about the property requirements, client discussions, financing terms, or commitments.`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // New action item form
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState(meeting.participants[0] || 'Rad (BDM)');
  const [newActionDueDate, setNewActionDueDate] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split('T')[0]
  );
  const [newActionPriority, setNewActionPriority] = useState<Priority>('medium');

  const totalDuration = meeting.durationSeconds || 1200;

  // Audio player simulation timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalDuration, playbackSpeed]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    setCurrentTimeSec(seconds);
  };

  const formatSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Action Items Management
  const handleToggleActionStatus = (actionId: string) => {
    const updatedActions = meeting.actionItems.map((a) => {
      if (a.id === actionId) {
        const nextStatus: ActionItemStatus = a.status === 'completed' ? 'todo' : 'completed';
        return { ...a, status: nextStatus };
      }
      return a;
    });

    onUpdateMeeting({
      ...meeting,
      actionItems: updatedActions,
    });
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      title: newActionTitle.trim(),
      assignee: newActionAssignee.trim() || 'Rad (BDM)',
      dueDate: newActionDueDate,
      priority: newActionPriority,
      status: 'todo',
      createdAt: new Date().toISOString(),
    };

    onUpdateMeeting({
      ...meeting,
      actionItems: [...meeting.actionItems, newItem],
    });

    setNewActionTitle('');
    setShowAddAction(false);
  };

  const handleDeleteActionItem = (actionId: string) => {
    const updated = meeting.actionItems.filter((a) => a.id !== actionId);
    onUpdateMeeting({ ...meeting, actionItems: updated });
  };

  // Export functions
  const handleCopyMarkdown = () => {
    let md = `# ${meeting.title}\n`;
    md += `- **Date**: ${new Date(meeting.createdAt).toLocaleString()}\n`;
    md += `- **Channel**: ${meeting.channelName}\n`;
    md += `- **Template**: ${meeting.templateName}\n`;
    md += `- **Participants**: ${meeting.participants.join(', ')}\n\n`;

    md += `## Executive Summary\n${meeting.summary.overview}\n\n`;

    if (meeting.summary.realEstateMetrics) {
      const rem = meeting.summary.realEstateMetrics;
      md += `### Real Estate Deal Parameters\n`;
      if (rem.propertyType) md += `- **Property Type**: ${rem.propertyType}\n`;
      if (rem.location) md += `- **Location**: ${rem.location}\n`;
      if (rem.budgetRange) md += `- **Budget / TCP**: ${rem.budgetRange}\n`;
      if (rem.financingType) md += `- **Financing**: ${rem.financingType}\n`;
      if (rem.targetTurnover) md += `- **Target Turnover**: ${rem.targetTurnover}\n`;
      md += '\n';
    }

    md += `### Key Discussion Points\n`;
    meeting.summary.keyDiscussionPoints.forEach((p) => {
      md += `- ${p}\n`;
    });
    md += '\n';

    md += `### Decisions Made\n`;
    meeting.summary.decisionsMade.forEach((d) => {
      md += `- ${d}\n`;
    });
    md += '\n';

    md += `## Action Items\n`;
    meeting.actionItems.forEach((a) => {
      md += `- [${a.status === 'completed' ? 'x' : ' '}] **${a.title}** (Assignee: ${a.assignee}, Due: ${a.dueDate}, Priority: ${a.priority})\n`;
    });
    md += '\n';

    md += `## Full Transcript\n`;
    meeting.transcript.forEach((u) => {
      md += `**[${formatSec(u.startSec)}] ${u.speaker}**: ${u.text}\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    let md = `# ${meeting.title}\n\n## Overview\n${meeting.summary.overview}\n\n## Action Items\n${meeting.actionItems.map((a) => `- [${a.status === 'completed' ? 'x' : ' '}] ${a.title} (${a.assignee})`).join('\n')}\n\n## Transcript\n${meeting.transcript.map((u) => `[${formatSec(u.startSec)}] ${u.speaker}: ${u.text}`).join('\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // AI Chat Submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAsking) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsAsking(true);

    try {
      const aiEngine = getAIIntelligenceEngine(llmProvider);
      const answer = await aiEngine.askAssistant(userText, meeting.transcript, meeting.summary);
      setChatMessages((prev) => [...prev, { sender: 'assistant', text: answer }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to query meeting assistant right now. Please verify your LLM configuration in Settings.',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Filter transcript
  const allSpeakers = Array.from(new Set(meeting.transcript.map((u) => u.speaker)));
  const filteredTranscript = meeting.transcript.filter((u) => {
    if (selectedSpeakerFilter !== 'all' && u.speaker !== selectedSpeakerFilter) {
      return false;
    }
    if (!transcriptSearch.trim()) return true;
    return (
      u.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      u.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
    );
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950" data-testid="meeting-detail-view">
      {/* Top Bar Navigation */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onBack}
            data-testid="detail-back-btn"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition shrink-0"
            title="Back to Meeting Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {meeting.channelName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {meeting.templateName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-400">
                {meeting.language}
              </span>
            </div>
            <h1 className="text-base font-bold text-white truncate mt-1" data-testid="detail-meeting-title">
              {meeting.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsRedactionModalOpen(true)}
            data-testid="redact-transcript-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Redact</span>
          </button>

          <button
            onClick={() => setIsVersionModalOpen(true)}
            data-testid="version-history-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Versions</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            data-testid="share-export-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Share & CRM</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            data-testid="copy-markdown-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadMarkdown}
            data-testid="download-markdown-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .MD</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete meeting "${meeting.title}"?`)) {
                onDeleteMeeting(meeting.id);
                onBack();
              }
            }}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
            title="Delete Meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Audio Player Bar */}
      <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTogglePlay}
            data-testid="audio-play-pause-btn"
            className="w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition shadow-sm"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handleSeek(0)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title="Restart playback"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="text-xs font-mono text-slate-300">
            <span data-testid="player-current-time">{formatSec(currentTimeSec)}</span>
            <span className="text-slate-500"> / </span>
            <span>{formatSec(totalDuration)}</span>
          </div>
        </div>

        {/* Audio Scrubber */}
        <div className="flex-1 max-w-xl mx-4 flex items-center">
          <input
            type="range"
            min={0}
            max={totalDuration}
            value={currentTimeSec}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        {/* Playback speed selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 text-[11px]">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2.0x</option>
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 border-b border-slate-800 flex items-center space-x-4 bg-slate-950">
        <button
          onClick={() => setActiveTab('summary')}
          data-testid="tab-summary-btn"
          className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'summary'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Executive Summary & Brief</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          data-testid="tab-agenda-btn"
          className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'agenda'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Agenda & Pre-Brief</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          data-testid="tab-transcript-btn"
          className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'transcript'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Transcript with Diarization ({meeting.transcript.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          data-testid="tab-actions-btn"
          className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'actions'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Action Items ({meeting.actionItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          data-testid="tab-chat-btn"
          className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'chat'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Meeting AI</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        {/* TAB 1: EXECUTIVE SUMMARY */}
        {activeTab === 'summary' && (
          <div className="max-w-4xl mx-auto space-y-6" data-testid="summary-content">
            {/* Real Estate Deal Brief Card if metrics exist */}
            {meeting.summary.realEstateMetrics && (
              <div className="p-4 bg-slate-900/90 border border-brand-500/30 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
                    <Building className="w-4 h-4" />
                    <span>Real Estate Deal Parameters & Brief</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Tuned for Boss Rad</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {meeting.summary.realEstateMetrics.propertyType && (
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Property Type</div>
                      <div className="font-bold text-white mt-0.5 truncate">
                        {meeting.summary.realEstateMetrics.propertyType}
                      </div>
                    </div>
                  )}

                  {meeting.summary.realEstateMetrics.location && (
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Location / Project</div>
                      <div className="font-bold text-slate-200 mt-0.5 truncate">
                        {meeting.summary.realEstateMetrics.location}
                      </div>
                    </div>
                  )}

                  {meeting.summary.realEstateMetrics.budgetRange && (
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Target Budget / TCP</div>
                      <div className="font-bold text-emerald-400 mt-0.5 truncate">
                        {meeting.summary.realEstateMetrics.budgetRange}
                      </div>
                    </div>
                  )}

                  {meeting.summary.realEstateMetrics.financingType && (
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Financing Scheme</div>
                      <div className="font-bold text-blue-400 mt-0.5 truncate">
                        {meeting.summary.realEstateMetrics.financingType}
                      </div>
                    </div>
                  )}
                </div>

                {meeting.summary.realEstateMetrics.keyObjections &&
                  meeting.summary.realEstateMetrics.keyObjections.length > 0 && (
                    <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs">
                      <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Key Objections & Requirements</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                        {meeting.summary.realEstateMetrics.keyObjections.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* Overview */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Executive Overview</h3>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">{meeting.summary.overview}</p>
            </div>

            {/* Key Discussion Points */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Key Discussion Points</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {meeting.summary.keyDiscussionPoints.map((point, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decisions Made */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Decisions Made</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {meeting.summary.decisionsMade.map((decision, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed font-medium text-white">{decision}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Next Steps</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {meeting.summary.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-brand-400 font-bold shrink-0">→</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <div className="max-w-4xl mx-auto space-y-4" data-testid="transcript-content">
            {/* Filter and Search Bar */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Filter dialogue or speaker in transcript..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 text-[11px]">Speaker:</span>
                <select
                  value={selectedSpeakerFilter}
                  onChange={(e) => setSelectedSpeakerFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Speakers ({allSpeakers.length})</option>
                  {allSpeakers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Utterance List */}
            <div className="space-y-3">
              {filteredTranscript.map((utt) => {
                const isActive = currentTimeSec >= utt.startSec && currentTimeSec <= utt.endSec;
                return (
                  <div
                    key={utt.id}
                    onClick={() => handleSeek(utt.startSec)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-950/30 border-brand-500/50 shadow-md shadow-brand-500/5'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-brand-400">{utt.speaker}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeek(utt.startSec);
                          setIsPlaying(true);
                        }}
                        className="text-[11px] font-mono text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800/60 flex items-center space-x-1"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{formatSec(utt.startSec)}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">{utt.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ACTION ITEMS */}
        {activeTab === 'actions' && (
          <div className="max-w-4xl mx-auto space-y-4" data-testid="actions-content">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Action Items & Commitments</h3>
                <p className="text-xs text-slate-400">Assigned deliverables with due dates and priority tags</p>
              </div>

              <button
                onClick={() => setShowAddAction(!showAddAction)}
                data-testid="add-action-item-btn"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Action Item</span>
              </button>
            </div>

            {/* Add action item mini form */}
            {showAddAction && (
              <form
                onSubmit={handleAddActionItem}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Deliverable / Task
                  </label>
                  <input
                    type="text"
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    placeholder="e.g. Email official BGC showroom computation and reserve parking"
                    data-testid="new-action-title-input"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500/60"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Assignee</label>
                    <input
                      type="text"
                      value={newActionAssignee}
                      onChange={(e) => setNewActionAssignee(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newActionDueDate}
                      onChange={(e) => setNewActionDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Priority</label>
                    <select
                      value={newActionPriority}
                      onChange={(e) => setNewActionPriority(e.target.value as Priority)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAction(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="save-new-action-btn"
                    className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Save Action Item
                  </button>
                </div>
              </form>
            )}

            {/* List of Action Items */}
            <div className="space-y-2">
              {meeting.actionItems.map((item) => {
                const isCompleted = item.status === 'completed';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isCompleted
                        ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <button
                        onClick={() => handleToggleActionStatus(item.id)}
                        data-testid={`action-status-toggle-${item.id}`}
                        className="text-slate-400 hover:text-brand-400 transition shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <span
                          className={`text-xs block truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-white font-medium'
                          }`}
                        >
                          {item.title}
                        </span>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          <span>Owner: {item.assignee}</span>
                          <span>•</span>
                          <span>Due: {item.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : item.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <button
                        onClick={() => handleDeleteActionItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ASK AI CHAT */}
        {activeTab === 'chat' && (
          <div className="max-w-3xl mx-auto flex flex-col h-[520px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg" data-testid="chat-content">
            {/* Chat header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold text-white">Ask Meeting Assistant</span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto text-[11px]">
              <button
                onClick={() => setChatInput('What is the agreed budget range and financing type?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition"
              >
                Budget & Financing?
              </button>
              <button
                onClick={() => setChatInput('What are the key decisions made in this meeting?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition"
              >
                Key Decisions?
              </button>
              <button
                onClick={() => setChatInput('List all action items and who is responsible for each.')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition"
              >
                Assigned Action Items?
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-none p-3 text-xs text-slate-400 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
                    <span>Analyzing meeting transcript and notes...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about this meeting..."
                data-testid="chat-input"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
              />
              <button
                type="submit"
                disabled={isAsking || !chatInput.trim()}
                data-testid="chat-submit-btn"
                className="p-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: AGENDA & PRE-BRIEF */}
        {activeTab === 'agenda' && (
          <AgendaEditorView meeting={meeting} onUpdateMeeting={onUpdateMeeting} />
        )}
      </div>

      {/* Modals */}
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        meeting={meeting}
        onRestoreVersion={(restored) => onUpdateMeeting(restored)}
      />

      <RedactionModal
        isOpen={isRedactionModalOpen}
        onClose={() => setIsRedactionModalOpen(false)}
        meeting={meeting}
        onUpdateMeeting={onUpdateMeeting}
      />

      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        meeting={meeting}
        settings={
          settings || {
            defaultLanguage: 'fil-PH',
            theme: 'dark',
            llmProvider: 'fleet',
            transcriptionProvider: 'browser_speech',
            privacyMode: true,
            retentionDays: 90,
          }
        }
      />
    </div>
  );
};
