import React from 'react';
import {
  Mic,
  Upload,
  Calendar,
  CheckSquare,
  LayoutTemplate,
  Settings,
  ShieldCheck,
  FolderOpen,
  Sparkles,
  Building2,
} from 'lucide-react';
import { Channel } from '../types';

export type MainView = 'library' | 'actions' | 'templates';

interface SidebarProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
  selectedChannelId: string;
  onSelectChannel: (channelId: string) => void;
  channels: Channel[];
  meetingsCount: number;
  pendingActionsCount: number;
  onOpenRecordModal: () => void;
  onOpenUploadModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  selectedChannelId,
  onSelectChannel,
  channels,
  meetingsCount,
  pendingActionsCount,
  onOpenRecordModal,
  onOpenUploadModal,
  onOpenSettingsModal,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base tracking-tight text-white">Tala AI</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded">
                BDM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">Real Estate Meeting Hub</p>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="p-3 space-y-2">
        <button
          onClick={onOpenRecordModal}
          data-testid="start-record-btn"
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
        >
          <Mic className="w-4 h-4 animate-pulse" />
          <span>Record Face-to-Face</span>
        </button>

        <button
          onClick={onOpenUploadModal}
          data-testid="start-upload-btn"
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800/80 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700/60 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span>Upload Audio / Video</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <button
          onClick={() => {
            onNavigate('library');
            onSelectChannel('all');
          }}
          data-testid="nav-library-btn"
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            currentView === 'library' && selectedChannelId === 'all'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <FolderOpen className="w-4 h-4 text-brand-400" />
            <span>All Meetings</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/40">
            {meetingsCount}
          </span>
        </button>

        <button
          onClick={() => onNavigate('actions')}
          data-testid="nav-actions-btn"
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            currentView === 'actions'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>Action Items</span>
          </div>
          {pendingActionsCount > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              {pendingActionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('templates')}
          data-testid="nav-templates-btn"
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            currentView === 'templates'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <LayoutTemplate className="w-4 h-4 text-emerald-400" />
          <span>Real Estate Templates</span>
        </button>

        {/* Channels Section */}
        <div className="pt-4 pb-1">
          <div className="px-3 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Channels</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        <div className="space-y-0.5">
          {channels.map((ch) => {
            const isSelected = currentView === 'library' && selectedChannelId === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  onNavigate('library');
                  onSelectChannel(ch.id);
                }}
                data-testid={`channel-${ch.id}-btn`}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ch.color || '#22c55e' }}
                />
                <span className="truncate">{ch.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer & Privacy Guarantee */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 px-2 py-1.5 bg-slate-800/50 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="leading-tight">Zero-Training & Local Storage Policy</span>
        </div>

        <button
          onClick={onOpenSettingsModal}
          data-testid="settings-btn"
          className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
        >
          <Settings className="w-4 h-4" />
          <span>Settings & 92 Languages</span>
        </button>
      </div>
    </aside>
  );
};
