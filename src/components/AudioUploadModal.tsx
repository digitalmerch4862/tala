import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileAudio,
  CheckCircle2,
  Loader2,
  Building,
  Globe,
  LayoutTemplate,
} from 'lucide-react';
import type { Channel, Meeting } from '../types';
import { MEETING_TEMPLATES } from '../templates/meetingTemplates';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE } from '../languages/languages';
import { getTranscriptionEngine } from '../services/transcription';
import { getAIIntelligenceEngine } from '../services/aiIntelligence';

interface AudioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  selectedChannelId: string;
  initialTemplateId?: string;
  onMeetingCreated: (meeting: Meeting) => void;
  llmProvider: string;
  transcriptionProvider: string;
}

export const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
  isOpen,
  onClose,
  channels,
  selectedChannelId,
  initialTemplateId,
  onMeetingCreated,
  llmProvider,
  transcriptionProvider,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [channelId, setChannelId] = useState(
    selectedChannelId === 'all' ? channels[0]?.id || '' : selectedChannelId
  );
  const [templateId, setTemplateId] = useState(initialTemplateId || MEETING_TEMPLATES[0].id);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE_CODE);
  const [participantsText, setParticipantsText] = useState('Host, Guest');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen && initialTemplateId) {
      setTemplateId(initialTemplateId);
    }
  }, [isOpen, initialTemplateId]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!title) {
      // Auto-populate title from clean filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an audio or video file to process.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Reading and analyzing audio format...');

    try {
      setUploadStatus('Generating transcript with speaker labels...');
      const transEngine = getTranscriptionEngine(transcriptionProvider);

      const participants = participantsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const transcript = await transEngine.transcribeAudio(selectedFile, language, {
        templateId,
        meetingTitle: title || selectedFile.name,
        fileName: selectedFile.name,
        participants,
      });

      setUploadStatus('Synthesizing executive summary & meeting intelligence...');
      const aiEngine = getAIIntelligenceEngine(llmProvider);
      const summary = await aiEngine.generateSummary(transcript, templateId, title || selectedFile.name);

      setUploadStatus('Extracting action items and deliverables...');
      const meetingId = `meeting-upload-${Date.now()}`;
      const actionItems = await aiEngine.extractActionItems(transcript, meetingId, title || selectedFile.name);

      const selectedTemplate = MEETING_TEMPLATES.find((t) => t.id === templateId);
      const selectedChannel = channels.find((c) => c.id === channelId);

      const newMeeting: Meeting = {
        id: meetingId,
        title: title.trim() || selectedFile.name,
        createdAt: new Date().toISOString(),
        durationSeconds: 1200, // standard duration representation
        channelId: channelId || 'general',
        channelName: selectedChannel?.name || 'General',
        templateId: templateId || MEETING_TEMPLATES[0].id,
        templateName: selectedTemplate?.name || 'Team Standup',
        language,
        participants,
        status: 'completed',
        audioFileName: selectedFile.name,
        audioDuration: 1200,
        transcript,
        summary,
        actionItems,
        tags: [selectedTemplate?.category || 'general', selectedChannel?.name || 'Uploaded'],
      };

      onMeetingCreated(newMeeting);
      onClose();
    } catch (err: any) {
      console.error('Upload processing error:', err);
      alert(`Failed to process audio file: ${err.message || err}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        data-testid="audio-upload-modal"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Upload Meeting Audio / Video</h2>
              <p className="text-[11px] text-slate-400">AI speaker diarization, executive recap, and action tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="file-drop-zone"
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
              selectedFile
                ? 'border-brand-500/60 bg-brand-500/5'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
              accept="audio/*,video/*,.mp3,.wav,.m4a,.webm,.mp4,.ogg"
              className="hidden"
              data-testid="upload-file-input"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileAudio className="w-10 h-10 text-brand-400 mb-2" />
                <span className="text-xs font-semibold text-white">{selectedFile.name}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Click to change file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  Click or drag & drop meeting audio/video file here
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supports MP3, WAV, M4A, WEBM, MP4 (Voice memos, Zoom/Meet recordings)
                </span>
              </div>
            )}
          </div>

          {/* Meeting Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rockwell Land — Tripping Notes & Pricing Negotiation"
              data-testid="upload-title-input"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 transition"
              required
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
                data-testid="upload-channel-select"
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
                data-testid="upload-template-select"
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
                Participants
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

          {/* Processing Banner */}
          {isUploading && (
            <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl flex items-center space-x-3 text-xs text-brand-300 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              data-testid="upload-submit-btn"
              className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload & Generate Notes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
