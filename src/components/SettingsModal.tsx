import React, { useState } from 'react';
import {
  X,
  Settings,
  Globe,
  Cpu,
  Mic,
  ShieldCheck,
  AlertTriangle,
  Database,
  Check,
  Building,
} from 'lucide-react';
import { TalaSettings } from '../types';
import { SUPPORTED_LANGUAGES } from '../languages/languages';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TalaSettings;
  onSaveSettings: (settings: TalaSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [defaultLanguage, setDefaultLanguage] = useState(settings.defaultLanguage || 'fil-PH');
  const [llmProvider, setLlmProvider] = useState(settings.llmProvider || 'fleet');
  const [transcriptionProvider, setTranscriptionProvider] = useState(
    settings.transcriptionProvider || 'browser_speech'
  );
  const [privacyMode, setPrivacyMode] = useState(settings.privacyMode ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      defaultLanguage,
      llmProvider,
      transcriptionProvider,
      privacyMode,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        data-testid="settings-modal"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Tala AI Settings</h2>
              <p className="text-[11px] text-slate-400">Languages, AI models, transcription engines, and privacy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Default Language (92 Languages) */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>Default Meeting Language (92 Supported)</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select your primary meeting language. Supports bilingual Filipino / Taglish, Cebuano, English, and 89 international languages.
            </p>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              data-testid="settings-default-language-select"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500/60"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* LLM Provider Configuration */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Intelligence & Summary Engine</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Boss Rad directive: Powered by the internal agy fleet subscription pool (no paid API key required).
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setLlmProvider('fleet')}
                data-testid="llm-fleet-btn"
                className={`p-3 rounded-xl border text-left transition ${
                  llmProvider === 'fleet'
                    ? 'border-brand-500 bg-brand-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-brand-400">Fleet Subscription</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Zero paid key • High accuracy</div>
              </button>

              <button
                type="button"
                onClick={() => setLlmProvider('mock')}
                data-testid="llm-mock-btn"
                className={`p-3 rounded-xl border text-left transition ${
                  llmProvider === 'mock'
                    ? 'border-brand-500 bg-brand-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-200">Local Rule Engine</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Zero network • Instant preview</div>
              </button>
            </div>
          </div>

          {/* Transcription Provider Configuration */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center space-x-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Speech-to-Text Transcription Engine</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Configurable transcription layer for real-time live browser speech or background file transcription.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTranscriptionProvider('browser_speech')}
                data-testid="transcription-browser-btn"
                className={`p-3 rounded-xl border text-left transition ${
                  transcriptionProvider === 'browser_speech'
                    ? 'border-brand-500 bg-brand-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-emerald-400">Browser Speech API</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Live mic • Zero latency</div>
              </button>

              <button
                type="button"
                onClick={() => setTranscriptionProvider('fleet_whisper')}
                data-testid="transcription-fleet-btn"
                className={`p-3 rounded-xl border text-left transition ${
                  transcriptionProvider === 'fleet_whisper'
                    ? 'border-brand-500 bg-brand-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-200">Fleet Whisper Worker</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Background audio file batches</div>
              </button>
            </div>
          </div>

          {/* Transcription Gap Disclosure */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1.5" data-testid="transcription-gap-notice">
            <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Transcription Capability Matrix & Gap Disclosure</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Fleet Subscription Coverage:</strong> The agy fleet subscription fully powers LLM summarization, action item extraction, and Q&A chat.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Transcription Coverage:</strong> Live face-to-face meetings run through native browser speech recognition (zero API cost). Uploaded audio files run through the local diarization adapter and fleet whisper pipeline, completely avoiding paid third-party cloud transcription subscriptions.
            </p>
          </div>

          {/* Zero Training & Local Storage Guarantee */}
          <div className="p-3 bg-brand-500/5 rounded-xl border border-brand-500/20 text-[11px] space-y-1">
            <div className="text-brand-400 font-bold uppercase tracking-wider flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Training & Privacy Guarantee</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Your meeting recordings, transcripts, and client real estate deal terms are stored securely in browser <strong>IndexedDB</strong>. Data is never used for model training or shared with third parties.
            </p>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              data-testid="save-settings-btn"
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
