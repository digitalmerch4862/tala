import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Square,
  Pause,
  Play,
  Shield,
  ShieldAlert,
  Sparkles,
  Building,
  Users,
  Globe,
  LayoutTemplate,
  Loader2,
} from 'lucide-react';
import type { Channel, Meeting, MeetingTemplate } from '../types';
import { MEETING_TEMPLATES } from '../templates/meetingTemplates';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE } from '../languages/languages';
import { AudioRecorderService } from '../services/audioRecorder';
import { getTranscriptionEngine } from '../services/transcription';
import { getAIIntelligenceEngine } from '../services/aiIntelligence';

interface MeetingRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  selectedChannelId: string;
  initialTemplateId?: string;
  onMeetingCreated: (meeting: Meeting) => void;
  llmProvider: string;
  transcriptionProvider: string;
}

export const MeetingRecorderModal: React.FC<MeetingRecorderModalProps> = ({
  isOpen,
  onClose,
  channels,
  selectedChannelId,
  initialTemplateId,
  onMeetingCreated,
  llmProvider,
  transcriptionProvider,
}) => {
  const [title, setTitle] = useState('');
  const [channelId, setChannelId] = useState(selectedChannelId === 'all' ? channels[0]?.id || '' : selectedChannelId);
  const [templateId, setTemplateId] = useState(initialTemplateId || MEETING_TEMPLATES[0].id);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE_CODE);
  const [participantsText, setParticipantsText] = useState('Host, Guest');

  const [recorderState, setRecorderState] = useState<'inactive' | 'recording' | 'paused'>('inactive');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [isOffTheRecord, setIsOffTheRecord] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const [liveUtterances, setLiveUtterances] = useState<string[]>([]);

  const recorderRef = useRef<AudioRecorderService | null>(null);
  const stopLiveTranscriptionRef = useRef<(() => void) | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTemplateId) {
        setTemplateId(initialTemplateId);
      }
      const now = new Date();
      setTitle(`Team Meeting — ${now.toLocaleDateString()}`);
      setRecorderState('inactive');
      setElapsedSeconds(0);
      setAudioVolume(0);
      setIsOffTheRecord(false);
      setIsProcessing(false);
      setLiveUtterances([]);
      recordedBlobRef.current = null;
    } else {
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      if (stopLiveTranscriptionRef.current) {
        stopLiveTranscriptionRef.current();
        stopLiveTranscriptionRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRecording = async () => {
    try {
      recorderRef.current = new AudioRecorderService({
        onStateChange: (state) => setRecorderState(state),
        onTimeUpdate: (secs) => setElapsedSeconds(secs),
        onVolumeChange: (vol) => setAudioVolume(vol),
        onDataAvailable: (blob) => {
          recordedBlobRef.current = blob;
        },
      });

      await recorderRef.current.start();

      // Start live transcription preview
      const engine = getTranscriptionEngine(transcriptionProvider);
      if (engine.startLiveTranscription) {
        stopLiveTranscriptionRef.current = engine.startLiveTranscription(
          (utt) => {
            if (!isOffTheRecord) {
              setLiveUtterances((prev) => [...prev.slice(-4), `${utt.speaker}: ${utt.text}`]);
            }
          },
          language
        );
      }
    } catch (err: any) {
      alert(`Microphone access error: ${err.message || err}`);
    }
  };

  const handlePause = () => {
    recorderRef.current?.pause();
  };

  const handleResume = () => {
    recorderRef.current?.resume();
  };

  const handleToggleOffTheRecord = () => {
    const nextVal = !isOffTheRecord;
    setIsOffTheRecord(nextVal);
    recorderRef.current?.setOffTheRecord(nextVal);
  };

  const handleStopAndSave = async () => {
    setIsProcessing(true);
    setProcessingStatus('Finalizing audio stream...');

    if (stopLiveTranscriptionRef.current) {
      stopLiveTranscriptionRef.current();
      stopLiveTranscriptionRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.getState() !== 'inactive') {
      recorderRef.current.stop();
    }

    // Give a short delay for blob collection
    await new Promise((r) => setTimeout(r, 600));

    try {
      setProcessingStatus('Generating transcript with speaker labels...');
      const transEngine = getTranscriptionEngine(transcriptionProvider);
      const audioBlob = recordedBlobRef.current || new Blob(['mock audio'], { type: 'audio/webm' });

      const participants = participantsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const transcript = await transEngine.transcribeAudio(audioBlob, language, {
        templateId,
        meetingTitle: title,
        participants,
        isOffTheRecord,
      });

      setProcessingStatus('Analyzing meeting notes & executive summary...');
      const aiEngine = getAIIntelligenceEngine(llmProvider);
      const summary = await aiEngine.generateSummary(transcript, templateId, title);

      setProcessingStatus('Extracting action items and owners...');
      const meetingId = `meeting-${Date.now()}`;
      const actionItems = await aiEngine.extractActionItems(transcript, meetingId, title);

      const selectedTemplate = MEETING_TEMPLATES.find((t) => t.id === templateId);
      const selectedChannel = channels.find((c) => c.id === channelId);

      const newMeeting: Meeting = {
        id: meetingId,
        title: title.trim() || 'Untitled Meeting',
        createdAt: new Date().toISOString(),
        durationSeconds: Math.max(elapsedSeconds, 15),
        channelId: channelId || 'team-sync',
        channelName: selectedChannel?.name || 'Team Syncs & Standups',
        templateId: templateId || MEETING_TEMPLATES[0].id,
        templateName: selectedTemplate?.name || 'Team Standup',
        language,
        participants,
        status: 'completed',
        audioFileName: `recording-${meetingId}.webm`,
        audioDuration: Math.max(elapsedSeconds, 15),
        transcript,
        summary,
        actionItems,
        tags: [selectedTemplate?.category || 'real_estate', selectedChannel?.name || 'Meeting'],
        isOffTheRecord,
      };

      onMeetingCreated(newMeeting);
      onClose();
    } catch (err: any) {
      console.error('Processing error:', err);
      alert(`Failed to process meeting: ${err.message || err}`);
      setIsProcessing(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        data-testid="meeting-recorder-modal"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Record Face-to-Face Meeting</h2>
              <p className="text-[11px] text-slate-400">Real-time audio capture, live transcript, and executive recap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Team Standup / Client Review"
              data-testid="record-modal-title-input"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 transition"
            />
          </div>

          {/* Channel and Template Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Channel
              </label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                data-testid="record-modal-channel-select"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 transition"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Meeting Template
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                data-testid="record-modal-template-select"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 transition"
              >
                {MEETING_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Language & Participants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Audio Language (92 Supported)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                data-testid="record-modal-language-select"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 transition"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Participants (comma-separated)
              </label>
              <input
                type="text"
                value={participantsText}
                onChange={(e) => setParticipantsText(e.target.value)}
                placeholder="Host, Guest 1, Guest 2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 transition"
              />
            </div>
          </div>

          {/* Recording Canvas / Controller Box */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
            {/* Timer */}
            <div className="text-3xl font-mono font-bold text-white tracking-widest" data-testid="record-modal-timer">
              {formatTimer(elapsedSeconds)}
            </div>

            {/* Audio Waveform Meter */}
            <div className="w-full max-w-xs flex items-center justify-center space-x-1 h-8">
              {Array.from({ length: 16 }).map((_, i) => {
                const isActive = recorderState === 'recording' && !isOffTheRecord;
                const dynamicHeight = isActive
                  ? Math.max(6, Math.min(32, Math.round((audioVolume * (i % 2 === 0 ? 1 : 0.75)) / 3)))
                  : 4;
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isOffTheRecord
                        ? 'bg-amber-500/40'
                        : isActive
                        ? 'bg-brand-500 shadow-sm shadow-brand-500/40'
                        : 'bg-slate-800'
                    }`}
                    style={{ height: `${dynamicHeight}px` }}
                  />
                );
              })}
            </div>

            {/* Off-The-Record Toggle */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleToggleOffTheRecord}
                data-testid="toggle-off-the-record-btn"
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  isOffTheRecord
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {isOffTheRecord ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                <span>{isOffTheRecord ? 'Off-The-Record Active (Capture Paused)' : 'Enable Off-The-Record'}</span>
              </button>
            </div>

            {isOffTheRecord && (
              <p className="text-[11px] text-amber-300/90 text-center max-w-sm">
                Sensitive details or confidential terms spoken during this mode will NOT be transcribed or included in the AI summary.
              </p>
            )}

            {/* Live Utterance Preview */}
            {liveUtterances.length > 0 && !isOffTheRecord && (
              <div className="w-full bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                  <span>Live Transcript Stream</span>
                </div>
                {liveUtterances.map((u, i) => (
                  <div key={i} className="truncate">
                    {u}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processing Banner */}
          {isProcessing && (
            <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl flex items-center space-x-3 text-xs text-brand-300 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>{processingStatus}</span>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {recorderState === 'inactive' ? (
              <button
                onClick={handleStartRecording}
                disabled={isProcessing}
                data-testid="modal-start-recording-btn"
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Start Recording</span>
              </button>
            ) : (
              <>
                {recorderState === 'recording' ? (
                  <button
                    onClick={handlePause}
                    data-testid="modal-pause-recording-btn"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    data-testid="modal-resume-recording-btn"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  onClick={handleStopAndSave}
                  disabled={isProcessing}
                  data-testid="modal-stop-save-btn"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop & Save Notes</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
