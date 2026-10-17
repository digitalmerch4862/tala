import React, { useState } from 'react';
import {
  Search,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  Mic,
  Upload,
  Tag,
  Building,
  Check,
} from 'lucide-react';
import { Meeting, Channel } from '../types';

interface MeetingLibraryProps {
  meetings: Meeting[];
  channels: Channel[];
  selectedChannelId: string;
  onSelectChannel: (channelId: string) => void;
  onSelectMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onOpenRecordModal: () => void;
  onOpenUploadModal: () => void;
}

export const MeetingLibrary: React.FC<MeetingLibraryProps> = ({
  meetings,
  channels,
  selectedChannelId,
  onSelectChannel,
  onSelectMeeting,
  onDeleteMeeting,
  onOpenRecordModal,
  onOpenUploadModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter meetings by channel and search query
  const filteredMeetings = meetings.filter((m) => {
    if (selectedChannelId !== 'all' && m.channelId !== selectedChannelId) {
      return false;
    }
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.templateName.toLowerCase().includes(q) ||
      m.channelName.toLowerCase().includes(q) ||
      m.participants.some((p) => p.toLowerCase().includes(q)) ||
      m.tags.some((t) => t.toLowerCase().includes(q)) ||
      m.summary.overview.toLowerCase().includes(q) ||
      m.transcript.some((t) => t.text.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const totalDurationMinutes = Math.round(
    meetings.reduce((sum, m) => sum + (m.durationSeconds || 0), 0) / 60
  );
  const totalPendingActions = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => a.status !== 'completed').length,
    0
  );

  const handleCopySummary = (e: React.MouseEvent, meeting: Meeting) => {
    e.stopPropagation();
    const text = `# ${meeting.title}\nDate: ${new Date(meeting.createdAt).toLocaleDateString()}\n\n## Overview\n${meeting.summary.overview}\n\n## Key Discussion Points\n${meeting.summary.keyDiscussionPoints.map((p) => `- ${p}`).join('\n')}\n\n## Decisions\n${meeting.summary.decisionsMade.map((d) => `- ${d}`).join('\n')}\n\n## Action Items\n${meeting.actionItems.map((a) => `- [${a.status === 'completed' ? 'x' : ' '}] ${a.title} (${a.assignee}) due ${a.dueDate}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Header */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Meeting Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Searchable meeting notes, transcripts, executive briefs, and action items.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenRecordModal}
            data-testid="header-record-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Meeting</span>
          </button>
          <button
            onClick={onOpenUploadModal}
            data-testid="header-upload-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </header>

      {/* Metrics Summary Strip */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/30 grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white" data-testid="metrics-total-meetings">{meetings.length}</div>
            <div className="text-[11px] text-slate-400">Saved Meetings</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">{totalDurationMinutes} mins</div>
            <div className="text-[11px] text-slate-400">Total Recorded</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white" data-testid="metrics-pending-actions">{totalPendingActions}</div>
            <div className="text-[11px] text-slate-400">Pending Action Items</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts, decisions, properties, or participants..."
            data-testid="meeting-search-input"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 transition"
          />
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => onSelectChannel('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedChannelId === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            All ({meetings.length})
          </button>
          {channels.map((ch) => {
            const count = meetings.filter((m) => m.channelId === ch.id).length;
            const isSelected = selectedChannelId === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChannel(ch.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: ch.color || '#22c55e' }}
                />
                <span>{ch.name}</span>
                <span className="text-[10px] text-slate-400">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meeting Cards List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredMeetings.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Mic className="w-10 h-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No meetings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery
                ? 'Try adjusting your search keywords or clear your channel filter.'
                : 'Record your first face-to-face client meeting or upload an audio file to get instant transcription and AI briefs.'}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={onOpenRecordModal}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Record Meeting
              </button>
              <button
                onClick={onOpenUploadModal}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
              >
                Upload Audio
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="meetings-grid">
            {filteredMeetings.map((meeting) => {
              const pendingCount = meeting.actionItems.filter((a) => a.status !== 'completed').length;
              return (
                <div
                  key={meeting.id}
                  onClick={() => onSelectMeeting(meeting)}
                  data-testid={`meeting-card-${meeting.id}`}
                  className="bg-slate-900/90 border border-slate-800 hover:border-brand-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-brand-400 border border-slate-700/60">
                          {meeting.channelName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300">
                          {meeting.templateName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDuration(meeting.durationSeconds || 0)}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
                      {meeting.title}
                    </h3>

                    {/* Real estate metrics preview if present */}
                    {meeting.summary.realEstateMetrics && (
                      <div className="mt-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                        {meeting.summary.realEstateMetrics.location && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Location:</span>
                            <span className="font-medium text-slate-200 truncate ml-2">
                              {meeting.summary.realEstateMetrics.location}
                            </span>
                          </div>
                        )}
                        {meeting.summary.realEstateMetrics.budgetRange && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Budget / TCP:</span>
                            <span className="font-semibold text-emerald-400">
                              {meeting.summary.realEstateMetrics.budgetRange}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Overview snippet */}
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {meeting.summary.overview}
                    </p>

                    {/* Participants */}
                    {meeting.participants.length > 0 && (
                      <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-400">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{meeting.participants.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">
                        {new Date(meeting.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {meeting.actionItems.length > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            pendingCount > 0
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {pendingCount > 0 ? `${pendingCount} pending` : 'All tasks done'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleCopySummary(e, meeting)}
                        title="Copy Summary"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      >
                        {copiedId === meeting.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete meeting "${meeting.title}"?`)) {
                            onDeleteMeeting(meeting.id);
                          }
                        }}
                        title="Delete Meeting"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
