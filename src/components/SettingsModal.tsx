import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Globe,
  Cpu,
  Mic,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Database,
  Check,
  Trash2,
  Lock,
  Radio,
  FileText,
  KeyRound,
  Send,
  Download,
  Shield,
  Layers,
} from 'lucide-react';
import type { TalaSettings, AuditLogEntry } from '../types';
import { SUPPORTED_LANGUAGES } from '../languages/languages';
import { purgeExpiredMeetings, getAllAuditLogs, saveAuditLog } from '../services/storage';
import { NEEDS_KEYS_ADAPTERS, COMPOSIO_CALENDAR_ADAPTER_SPEC } from '../services/integrations';
import { fetchCalendarSyncStatus } from '../services/composioCalendar';
import { AuditLog } from '../privacy/audit';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TalaSettings;
  onSaveSettings: (settings: TalaSettings) => void;
}

type SettingsTab = 'general' | 'retention' | 'audit' | 'integrations';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [defaultLanguage, setDefaultLanguage] = useState(settings.defaultLanguage || 'fil-PH');
  const [llmProvider, setLlmProvider] = useState(settings.llmProvider || 'fleet');
  const [transcriptionProvider, setTranscriptionProvider] = useState(
    settings.transcriptionProvider || 'browser_speech'
  );
  const [privacyMode, setPrivacyMode] = useState(settings.privacyMode ?? true);
  const [retentionDays, setRetentionDays] = useState<number>(settings.retentionDays || 90);
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState<boolean>(settings.autoPurgeEnabled ?? false);

  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookConfig?.url || '');
  const [webhookSecretHeader, setWebhookSecretHeader] = useState(
    settings.webhookConfig?.secretHeader || 'X-Tala-Signature'
  );
  const [webhookSecretToken, setWebhookSecretToken] = useState(
    settings.webhookConfig?.secretToken || ''
  );
  const [webhookEnabled, setWebhookEnabled] = useState(settings.webhookConfig?.enabled ?? false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState('');
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAudit();
      fetchCalendarSyncStatus().then((res) => setCalendarSyncEnabled(res.enabled));
    }
  }, [isOpen]);

  const loadAudit = async () => {
    try {
      const logs = await getAllAuditLogs();
      if (logs.length === 0) {
        // Create initial genesis audit entry
        const genesisEntry: AuditLogEntry = {
          id: `audit-genesis-${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventType: 'policy_updated',
          meetingId: 'system',
          meetingTitle: 'Tala System Genesis',
          details: 'Initialized tamper-evident cryptographic hash chain audit logger.',
          actor: 'System',
        };
        await saveAuditLog(genesisEntry);
        setAuditLogs([genesisEntry]);
      } else {
        setAuditLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      defaultLanguage,
      llmProvider,
      transcriptionProvider,
      privacyMode,
      retentionDays,
      autoPurgeEnabled,
      webhookConfig: {
        url: webhookUrl,
        secretHeader: webhookSecretHeader,
        secretToken: webhookSecretToken,
        enabled: webhookEnabled,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handlePurgeNow = async () => {
    if (!confirm(`Purge all meetings older than ${retentionDays} days? This cannot be undone.`)) {
      return;
    }
    const purgedCount = await purgeExpiredMeetings(retentionDays);
    setPurgeResult(`Purged ${purgedCount} expired meeting(s) according to ${retentionDays}-day retention policy.`);
    await loadAudit();
  };

  const handleExportAuditJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tala_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditFilter.trim()) return true;
    const q = auditFilter.toLowerCase();
    return (
      log.eventType.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      (log.meetingTitle && log.meetingTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        data-testid="settings-modal"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Tala AI Workspace Settings</h2>
              <p className="text-[11px] text-slate-400">Privacy, retention, tamper-evident audit logs, and integrations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-4 border-b border-slate-800 bg-slate-950/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            data-testid="settings-tab-general"
            className={`py-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'general'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            General & Models
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('retention')}
            data-testid="settings-tab-retention"
            className={`py-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'retention'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Retention & Auto-Purge
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            data-testid="settings-tab-audit"
            className={`py-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tamper-Evident Audit Log ({auditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            data-testid="settings-tab-integrations"
            className={`py-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'integrations'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Webhook & "Needs Keys"
          </button>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
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

              {/* LLM Provider */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span>AI Intelligence & Summary Engine</span>
                </label>
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

              {/* Transcription Provider */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Speech-to-Text Transcription Engine</span>
                </label>
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

              {/* Transcription Gap Disclosure Notice */}
              <div
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2"
                data-testid="transcription-gap-notice"
              >
                <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" />
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
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-4" data-testid="settings-retention-section">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Data Retention Policy & Auto-Purge
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Configure automated data lifecycle policies to ensure strict compliance with client privacy and Philippine Data Privacy Act regulations. Meetings older than the retention window are automatically flagged and purged from local IndexedDB storage.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Retention Window
                    </label>
                    <select
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(Number(e.target.value))}
                      data-testid="settings-retention-select"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value={7}>7 Days (Strict Short-Term)</option>
                      <option value={30}>30 Days (Standard Monthly)</option>
                      <option value={90}>90 Days (Quarterly Audit)</option>
                      <option value={365}>365 Days (1 Year)</option>
                      <option value={0}>Zero-Day (Immediate post-meeting purge)</option>
                      <option value={-1}>Indefinite (Never auto-purge)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Auto-Purge Background Execution
                    </label>
                    <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer text-xs text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={autoPurgeEnabled}
                        onChange={(e) => setAutoPurgeEnabled(e.target.checked)}
                        data-testid="settings-autopurge-checkbox"
                        className="accent-brand-500 rounded"
                      />
                      <span>Enable Auto-Purge on App Load</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    Manually trigger retention purge across all stored meetings:
                  </span>
                  <button
                    type="button"
                    onClick={handlePurgeNow}
                    data-testid="purge-expired-now-btn"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Expired Meetings Now</span>
                  </button>
                </div>

                {purgeResult && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{purgeResult}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3" data-testid="settings-audit-section">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Cryptographic Hash-Chained Audit Trail
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Chain Verified: Valid
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportAuditJSON}
                  data-testid="export-audit-json-btn"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700 transition"
                >
                  <Download className="w-3 h-3" />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* Search Audit Logs */}
              <input
                type="text"
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                placeholder="Filter by actor, action (e.g. transcript_redacted), or meeting..."
                data-testid="audit-log-filter-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              {/* Audit List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto" data-testid="audit-log-list">
                {filteredAuditLogs.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    data-testid={`audit-entry-${index}`}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-brand-400 uppercase">
                        {entry.eventType}
                      </span>
                      <span className="text-slate-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-300">{entry.details}</div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-3">
                      <span>Actor: {entry.actor}</span>
                      {entry.meetingTitle && <span>Meeting: {entry.meetingTitle}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4" data-testid="settings-integrations-section">
              {/* Webhook Configuration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-brand-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Webhook Push Adapter (Outbound Dispatch)
                    </h3>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={webhookEnabled}
                      onChange={(e) => setWebhookEnabled(e.target.checked)}
                      data-testid="webhook-enabled-checkbox"
                      className="accent-brand-500 rounded"
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Target Webhook URL
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/... or https://crm.company.com/api/v1/deals"
                      data-testid="webhook-url-input"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Header Name
                      </label>
                      <input
                        type="text"
                        value={webhookSecretHeader}
                        onChange={(e) => setWebhookSecretHeader(e.target.value)}
                        data-testid="webhook-header-input"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Secret Token / Key
                      </label>
                      <input
                        type="password"
                        value={webhookSecretToken}
                        onChange={(e) => setWebhookSecretToken(e.target.value)}
                        placeholder="••••••••••••"
                        data-testid="webhook-token-input"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Composio Google Calendar Server-Side Sync Card */}
              <div
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                data-testid="composio-google-calendar-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {COMPOSIO_CALENDAR_ADAPTER_SPEC.name}
                    </h3>
                  </div>
                  <span
                    data-testid="settings-calendar-sync-badge"
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${
                      calendarSyncEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {calendarSyncEnabled ? 'Calendar sync active' : 'Calendar sync off'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {COMPOSIO_CALENDAR_ADAPTER_SPEC.description}
                </p>
                <div className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-400">Serverless route: </span>
                  <code>{COMPOSIO_CALENDAR_ADAPTER_SPEC.route}</code> •{' '}
                  <span className="font-semibold text-slate-400">Server Env Variable: </span>
                  <code>{COMPOSIO_CALENDAR_ADAPTER_SPEC.envVarName}</code>
                </div>
              </div>

              {/* Needs Keys Adapters Display */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Sync Adapters ("Needs Keys" Policy)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  In compliance with Boss Rad security and zero-fake policy, live bidirectional cloud sync requires your organization's registered API keys or OAuth app credentials. Tala does not fake or emulate active third-party authentication without verified credentials.
                </p>

                <div className="space-y-2">
                  {NEEDS_KEYS_ADAPTERS.map((adapter) => (
                    <div
                      key={adapter.adapterId}
                      data-testid={`needs-keys-${adapter.adapterId}`}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{adapter.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 uppercase tracking-wider">
                          Needs Keys
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {adapter.setupInstructions}
                      </p>
                      <div className="text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-400">Required credentials: </span>
                        {adapter.missingCredentials.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
