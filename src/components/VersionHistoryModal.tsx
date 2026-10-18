import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, Check, Calendar, User, Eye, FileText, ArrowRight } from 'lucide-react';
import type { Meeting, NoteVersion, ActionItem } from '../types';
import { getNoteVersions, saveNoteVersion } from '../services/storage';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  onRestoreVersion: (restoredMeeting: Meeting) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  meeting,
  onRestoreVersion,
}) => {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, meeting.id]);

  const loadVersions = async () => {
    const loaded = await getNoteVersions(meeting.id);
    if (loaded.length === 0) {
      // Create initial snapshot if none exists
      const initialVer: NoteVersion = {
        id: `ver-${Date.now()}-1`,
        meetingId: meeting.id,
        versionNumber: 1,
        timestamp: meeting.createdAt,
        author: 'System (AI Initial Draft)',
        changeDescription: 'Initial AI synthesis & note generation',
        title: meeting.title,
        summary: meeting.summary,
        actionItems: meeting.actionItems,
      };
      await saveNoteVersion(initialVer);
      setVersions([initialVer]);
      setSelectedVersion(initialVer);
    } else {
      setVersions(loaded.sort((a, b) => b.versionNumber - a.versionNumber));
      setSelectedVersion(loaded[0]);
    }
  };

  if (!isOpen) return null;

  const handleCreateSnapshot = async () => {
    const nextVerNumber =
      versions.length > 0 ? Math.max(...versions.map((v) => v.versionNumber)) + 1 : 1;
    const newVer: NoteVersion = {
      id: `ver-${Date.now()}`,
      meetingId: meeting.id,
      versionNumber: nextVerNumber,
      timestamp: new Date().toISOString(),
      author: 'Rad (BDM)',
      changeDescription: `Manual snapshot (Version ${nextVerNumber})`,
      title: meeting.title,
      summary: meeting.summary,
      actionItems: meeting.actionItems,
    };

    await saveNoteVersion(newVer);
    await loadVersions();
  };

  const handleRestore = async (version: NoteVersion) => {
    setIsRestoring(true);
    try {
      // Save current state first before restoring
      const snapshotVer: NoteVersion = {
        id: `ver-${Date.now()}`,
        meetingId: meeting.id,
        versionNumber: Math.max(...versions.map((v) => v.versionNumber)) + 1,
        timestamp: new Date().toISOString(),
        author: 'System Auto-Save',
        changeDescription: `Auto-saved before rollback to Version ${version.versionNumber}`,
        title: meeting.title,
        summary: meeting.summary,
        actionItems: meeting.actionItems,
      };
      await saveNoteVersion(snapshotVer);

      const restoredMeeting: Meeting = {
        ...meeting,
        title: version.title,
        summary: version.summary,
        actionItems: version.actionItems,
      };

      onRestoreVersion(restoredMeeting);
      onClose();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        data-testid="version-history-modal"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Notes Version History & Rollback</h2>
              <p className="text-[11px] text-slate-400">View previous snapshots and restore previous revisions.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateSnapshot}
              data-testid="create-snapshot-btn"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              + Create Snapshot
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-Column Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List Sidebar */}
          <div className="w-72 border-r border-slate-800 p-3 space-y-1.5 overflow-y-auto shrink-0 bg-slate-950/40">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1">
              Snapshots ({versions.length})
            </div>
            {versions.map((ver) => {
              const isSelected = selectedVersion?.id === ver.id;
              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  data-testid={`version-item-${ver.versionNumber}`}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-brand-500/15 border-brand-500/40 text-white'
                      : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Version {ver.versionNumber}</span>
                    <span className="text-[10px] text-slate-400">{ver.author}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{ver.changeDescription}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {new Date(ver.timestamp).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Version Content Preview */}
          <div
            className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-900/60"
            data-testid="version-preview-container"
          >
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Version {selectedVersion.versionNumber} Preview
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Captured on {new Date(selectedVersion.timestamp).toLocaleString()} by{' '}
                      {selectedVersion.author}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    disabled={isRestoring}
                    data-testid="confirm-restore-version-btn"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRestoring ? 'Restoring...' : 'Restore This Version'}</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Executive Overview
                    </h4>
                    <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                      {selectedVersion.summary.overview}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Key Discussion Points ({selectedVersion.summary.keyDiscussionPoints.length})
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      {selectedVersion.summary.keyDiscussionPoints.map((pt: string, i: number) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Decisions Made ({selectedVersion.summary.decisionsMade.length})
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      {selectedVersion.summary.decisionsMade.map((dec: string, i: number) => (
                        <li key={i}>{dec}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Action Items ({selectedVersion.actionItems.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedVersion.actionItems.map((act: ActionItem) => (
                        <div
                          key={act.id}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between"
                        >
                          <span>
                            {act.title} ({act.assignee})
                          </span>
                          <span className="text-[10px] text-slate-500">Due: {act.dueDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a version to preview its contents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
