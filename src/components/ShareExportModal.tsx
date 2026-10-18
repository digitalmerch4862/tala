import React, { useState } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Send,
  FileCode,
  FileSpreadsheet,
  Globe,
  Database,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Meeting, TalaSettings } from '../types';
import {
  exportToCRMJson,
  exportToCRMCSV,
  dispatchWebhook,
  exportToNotionMarkdown,
} from '../services/integrations';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  settings: TalaSettings;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  meeting,
  settings,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNotion, setCopiedNotion] = useState(false);
  const [isPushingWebhook, setIsPushingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  // Generate self-contained, standalone guest HTML export
  const handleDownloadStandaloneHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(meeting.title)} — Tala AI Note Summary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 1rem; border: 1px solid #334155; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
    h1 { font-size: 1.5rem; color: #38bdf8; margin-top: 0; }
    .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #0369a1; color: #e0f2fe; margin-right: 0.5rem; }
    .meta { font-size: 0.85rem; color: #94a3b8; margin: 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid #334155; }
    .section { margin-top: 1.5rem; }
    h2 { font-size: 1.1rem; color: #f1f5f9; border-bottom: 1px solid #334155; padding-bottom: 0.4rem; }
    ul { padding-left: 1.25rem; }
    li { margin-bottom: 0.4rem; }
    .action-item { background: #0f172a; padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
    .transcript-box { background: #0f172a; border-radius: 0.5rem; padding: 1rem; max-height: 400px; overflow-y: auto; font-size: 0.85rem; border: 1px solid #334155; }
    .speaker { font-weight: 700; color: #38bdf8; }
    .timestamp { font-size: 0.75rem; color: #64748b; margin-left: 0.5rem; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <span class="badge">${escapeHTML(meeting.channelName)}</span>
      <span class="badge">${escapeHTML(meeting.templateName)}</span>
    </div>
    <h1>${escapeHTML(meeting.title)}</h1>
    <div class="meta">
      <strong>Date:</strong> ${new Date(meeting.createdAt).toLocaleString()} | 
      <strong>Participants:</strong> ${escapeHTML(meeting.participants.join(', '))}
    </div>

    <div class="section">
      <h2>Executive Summary</h2>
      <p>${escapeHTML(meeting.summary.overview)}</p>
    </div>

    <div class="section">
      <h2>Key Discussion Points</h2>
      <ul>
        ${meeting.summary.keyDiscussionPoints.map((p) => `<li>${escapeHTML(p)}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2>Decisions Made</h2>
      <ul>
        ${meeting.summary.decisionsMade.map((d) => `<li><strong>${escapeHTML(d)}</strong></li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2>Action Items</h2>
      ${meeting.actionItems
        .map(
          (a) => `
        <div class="action-item">
          <div>
            <strong>[${a.status === 'completed' ? '✓' : ' '}] ${escapeHTML(a.title)}</strong>
            <div style="font-size: 0.75rem; color: #94a3b8;">Assignee: ${escapeHTML(a.assignee)} | Priority: ${escapeHTML(a.priority)}</div>
          </div>
          <div style="font-size: 0.75rem; color: #cbd5e1;">Due: ${escapeHTML(a.dueDate)}</div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="section">
      <h2>Meeting Transcript</h2>
      <div class="transcript-box">
        ${meeting.transcript
          .map(
            (u) => `
          <div style="margin-bottom: 0.75rem;">
            <span class="speaker">${escapeHTML(u.speaker)}</span>
            <span class="timestamp">[${Math.floor(u.startSec / 60).toString().padStart(2, '0')}:${Math.floor(u.startSec % 60).toString().padStart(2, '0')}]</span>
            <div>${escapeHTML(u.text)}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <footer>
      Exported via Tala AI Meeting Hub • Local-First Zero Training Architecture
    </footer>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_share.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/#meeting-${meeting.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadCRMJson = () => {
    const json = exportToCRMJson(meeting);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_crm.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCRMCSV = () => {
    const csv = exportToCRMCSV(meeting);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_deals.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyNotionMarkdown = () => {
    const md = exportToNotionMarkdown(meeting);
    navigator.clipboard.writeText(md);
    setCopiedNotion(true);
    setTimeout(() => setCopiedNotion(false), 2500);
  };

  const handlePushWebhook = async () => {
    if (!settings.webhookConfig || !settings.webhookConfig.enabled) {
      setWebhookResult({
        success: false,
        message: 'Webhook is not enabled or configured in Settings. Please set your Webhook URL in Settings first.',
      });
      return;
    }

    setIsPushingWebhook(true);
    setWebhookResult(null);

    try {
      const result = await dispatchWebhook(settings.webhookConfig, meeting);
      setWebhookResult({
        success: result.success,
        message: result.message,
      });
    } finally {
      setIsPushingWebhook(false);
    }
  };

  function escapeHTML(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" data-testid="share-export-modal">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Guest Sharing & CRM Integrations</h2>
              <p className="text-[11px] text-slate-400">Export deal summaries, standalone HTML, and push to Webhooks/CRM.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Section 1: Guest Sharing */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Guest Sharing (Local-First Offline Bundle)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Share complete notes, action items, and transcripts with clients or external stakeholders without requiring them to install Tala.
            </p>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadStandaloneHTML}
                data-testid="download-standalone-html-btn"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Standalone HTML</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareLink}
                data-testid="copy-guest-share-link-btn"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: CRM Push & Webhook Dispatch */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                CRM Push & Webhook Adapter
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Export deal parameters, stage, and action items in HubSpot/Salesforce format or push directly to your webhook.
            </p>

            <div className="flex items-center space-x-2 flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadCRMJson}
                data-testid="download-crm-json-btn"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Export CRM JSON</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCRMCSV}
                data-testid="download-crm-csv-btn"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Deals CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePushWebhook}
                disabled={isPushingWebhook}
                data-testid="push-crm-webhook-btn"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                {isPushingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isPushingWebhook ? 'Pushing...' : 'Push to Webhook'}</span>
              </button>
            </div>

            {webhookResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  webhookResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
                data-testid="webhook-dispatch-result"
              >
                {webhookResult.success ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{webhookResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 3: Notion / Confluence Markdown */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Notion & Confluence Markdown
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Copy formatted Markdown with structured tables, checkable tasks, and real estate deal attributes.
            </p>
            <button
              type="button"
              onClick={handleCopyNotionMarkdown}
              data-testid="copy-notion-md-btn"
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition"
            >
              {copiedNotion ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotion ? 'Copied to Clipboard!' : 'Copy Notion/Confluence Markdown'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
