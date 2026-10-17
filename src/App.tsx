import React, { useState, useEffect } from 'react';
import { Meeting, Channel, TalaSettings, ActionItemStatus } from './types';
import {
  initStorage,
  getAllMeetings,
  getAllChannels,
  getSettings,
  saveMeeting,
  deleteMeeting,
  updateActionItemStatus,
  saveSettings,
} from './services/storage';
import { Sidebar, MainView } from './components/Sidebar';
import { MeetingLibrary } from './components/MeetingLibrary';
import { MeetingDetailView } from './components/MeetingDetailView';
import { ActionItemsView } from './components/ActionItemsView';
import { TemplatesView } from './components/TemplatesView';
import { MeetingRecorderModal } from './components/MeetingRecorderModal';
import { AudioUploadModal } from './components/AudioUploadModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [currentView, setCurrentView] = useState<MainView>('library');
  const [settings, setSettingsState] = useState<TalaSettings>({
    defaultLanguage: 'fil-PH',
    theme: 'dark',
    llmProvider: 'fleet',
    transcriptionProvider: 'browser_speech',
    privacyMode: true,
  });

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Pre-selected template for modals
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        await initStorage();
        const [loadedMeetings, loadedChannels, loadedSettings] = await Promise.all([
          getAllMeetings(),
          getAllChannels(),
          getSettings(),
        ]);
        setMeetings(loadedMeetings);
        setChannels(loadedChannels);
        setSettingsState(loadedSettings);
      } catch (err) {
        console.error('Storage initialization error:', err);
      }
    })();
  }, []);

  const handleMeetingCreated = async (newMeeting: Meeting) => {
    await saveMeeting(newMeeting);
    const updated = await getAllMeetings();
    setMeetings(updated);
    setActiveMeeting(newMeeting);
  };

  const handleUpdateMeeting = async (updated: Meeting) => {
    await saveMeeting(updated);
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (activeMeeting?.id === updated.id) {
      setActiveMeeting(updated);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    await deleteMeeting(id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (activeMeeting?.id === id) {
      setActiveMeeting(null);
    }
  };

  const handleToggleActionStatus = async (actionId: string, status: ActionItemStatus) => {
    await updateActionItemStatus(actionId, status);
    const updatedMeetings = await getAllMeetings();
    setMeetings(updatedMeetings);
    if (activeMeeting) {
      const refreshedActive = updatedMeetings.find((m) => m.id === activeMeeting.id);
      if (refreshedActive) setActiveMeeting(refreshedActive);
    }
  };

  const handleStartWithTemplate = (templateId: string, mode: 'record' | 'upload') => {
    setPreselectedTemplateId(templateId);
    if (mode === 'record') {
      setIsRecordModalOpen(true);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  const handleSaveSettings = async (newSettings: TalaSettings) => {
    await saveSettings(newSettings);
    setSettingsState(newSettings);
  };

  // Compute pending actions count for badge
  const pendingActionsCount = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => a.status !== 'completed').length,
    0
  );

  // Aggregate all action items across meetings
  const allActionItems = meetings.flatMap((m) => m.actionItems);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setActiveMeeting(null);
          setCurrentView(view);
        }}
        selectedChannelId={selectedChannelId}
        onSelectChannel={(chId) => {
          setSelectedChannelId(chId);
          setActiveMeeting(null);
          setCurrentView('library');
        }}
        channels={channels}
        meetingsCount={meetings.length}
        pendingActionsCount={pendingActionsCount}
        onOpenRecordModal={() => {
          setPreselectedTemplateId(undefined);
          setIsRecordModalOpen(true);
        }}
        onOpenUploadModal={() => {
          setPreselectedTemplateId(undefined);
          setIsUploadModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeMeeting ? (
          <MeetingDetailView
            meeting={activeMeeting}
            onBack={() => setActiveMeeting(null)}
            onUpdateMeeting={handleUpdateMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            llmProvider={settings.llmProvider}
          />
        ) : currentView === 'library' ? (
          <MeetingLibrary
            meetings={meetings}
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
            onSelectMeeting={(m) => setActiveMeeting(m)}
            onDeleteMeeting={handleDeleteMeeting}
            onOpenRecordModal={() => {
              setPreselectedTemplateId(undefined);
              setIsRecordModalOpen(true);
            }}
            onOpenUploadModal={() => {
              setPreselectedTemplateId(undefined);
              setIsUploadModalOpen(true);
            }}
          />
        ) : currentView === 'actions' ? (
          <ActionItemsView
            actionItems={allActionItems}
            meetings={meetings}
            onToggleStatus={handleToggleActionStatus}
            onOpenMeeting={(meetingId) => {
              const target = meetings.find((m) => m.id === meetingId);
              if (target) {
                setActiveMeeting(target);
              }
            }}
          />
        ) : (
          <TemplatesView onStartWithTemplate={handleStartWithTemplate} />
        )}
      </main>

      {/* Modals */}
      <MeetingRecorderModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        channels={channels}
        selectedChannelId={selectedChannelId}
        initialTemplateId={preselectedTemplateId}
        onMeetingCreated={handleMeetingCreated}
        llmProvider={settings.llmProvider}
        transcriptionProvider={settings.transcriptionProvider}
      />

      <AudioUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        channels={channels}
        selectedChannelId={selectedChannelId}
        initialTemplateId={preselectedTemplateId}
        onMeetingCreated={handleMeetingCreated}
        llmProvider={settings.llmProvider}
        transcriptionProvider={settings.transcriptionProvider}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
};
