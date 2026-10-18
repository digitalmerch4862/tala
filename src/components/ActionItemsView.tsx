import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { ActionItem, ActionItemStatus, Priority, Meeting } from '../types';

interface ActionItemsViewProps {
  actionItems: ActionItem[];
  meetings: Meeting[];
  onToggleStatus: (actionId: string, status: ActionItemStatus) => void;
  onOpenMeeting: (meetingId: string) => void;
}

export const ActionItemsView: React.FC<ActionItemsViewProps> = ({
  actionItems,
  meetings,
  onToggleStatus,
  onOpenMeeting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ActionItemStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');

  const filteredItems = actionItems.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.assignee.toLowerCase().includes(q) ||
      item.meetingTitle.toLowerCase().includes(q)
    );
  });

  const pendingCount = actionItems.filter((i) => i.status !== 'completed').length;
  const completedCount = actionItems.filter((i) => i.status === 'completed').length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950" data-testid="action-items-view">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Action Items Hub</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated deliverables, broker commitments, and client follow-ups across all meetings.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
            {pendingCount} Pending
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-semibold">
            {completedCount} Completed
          </span>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action items, assignees, or meeting titles..."
            data-testid="actions-search-input"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
          />
        </div>

        {/* Status and Priority Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            data-testid="actions-status-filter"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses ({actionItems.length})</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            data-testid="actions-priority-filter"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Action Items List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <CheckSquare className="w-10 h-10 text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No action items found</h3>
            <p className="text-xs text-slate-500 mt-1">
              All tasks are clear or none matched your current filter criteria.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = item.status === 'completed';
            return (
              <div
                key={item.id}
                data-testid={`action-card-${item.id}`}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isCompleted
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => onToggleStatus(item.id, isCompleted ? 'todo' : 'completed')}
                    data-testid={`global-action-toggle-${item.id}`}
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
                      className={`text-xs block ${
                        isCompleted ? 'line-through text-slate-500' : 'text-white font-medium'
                      }`}
                    >
                      {item.title}
                    </span>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 flex-wrap gap-y-1">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{item.assignee}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Due: {item.dueDate}</span>
                      </span>
                      <span>•</span>
                      <button
                        onClick={() => onOpenMeeting(item.meetingId)}
                        className="text-brand-400 hover:underline flex items-center space-x-1"
                      >
                        <span className="truncate max-w-xs">{item.meetingTitle}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
