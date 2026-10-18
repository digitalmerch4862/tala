import React, { useState } from 'react';
import { X, ShieldAlert, Check, AlertCircle, Eye, RefreshCw, Lock } from 'lucide-react';
import type { Meeting } from '../types';
import { redactMeetingContent } from '../services/privacy';
import { redactText as redactPIIText } from '../privacy/redaction';
import type { PiiCategory } from '../privacy/types/pii';

interface RedactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  onUpdateMeeting: (updated: Meeting) => void;
}

export const RedactionModal: React.FC<RedactionModalProps> = ({
  isOpen,
  onClose,
  meeting,
  onUpdateMeeting,
}) => {
  const [targetPhrase, setTargetPhrase] = useState('');
  const [selectedPiiCategories, setSelectedPiiCategories] = useState<PiiCategory[]>([
    'email',
    'phone',
    'credit_card',
    'gov_id',
  ]);
  const [previewSnippet, setPreviewSnippet] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPhraseRedaction = async () => {
    if (!targetPhrase.trim()) return;
    setIsApplying(true);
    try {
      const updated = await redactMeetingContent(meeting, targetPhrase.trim(), 'Rad (BDM)');
      onUpdateMeeting(updated);
      setSuccessMessage(`Successfully redacted "${targetPhrase.trim()}" and recorded tamper-evident audit log.`);
      setTargetPhrase('');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyPiiRedaction = async () => {
    setIsApplying(true);
    try {
      // Run PII redaction across transcript utterances and summary
      const updatedTranscript = meeting.transcript.map((u) => {
        const res = redactPIIText(u.text, { categories: selectedPiiCategories });
        return { ...u, text: res.redactedText };
      });

      const updatedOverview = redactPIIText(meeting.summary.overview, {
        categories: selectedPiiCategories,
      }).redactedText;

      const updatedPoints = meeting.summary.keyDiscussionPoints.map(
        (p) => redactPIIText(p, { categories: selectedPiiCategories }).redactedText
      );

      const updatedDecisions = meeting.summary.decisionsMade.map(
        (d) => redactPIIText(d, { categories: selectedPiiCategories }).redactedText
      );

      const updatedActions = meeting.actionItems.map((a) => ({
        ...a,
        title: redactPIIText(a.title, { categories: selectedPiiCategories }).redactedText,
      }));

      const updatedMeeting: Meeting = {
        ...meeting,
        transcript: updatedTranscript,
        summary: {
          ...meeting.summary,
          overview: updatedOverview,
          keyDiscussionPoints: updatedPoints,
          decisionsMade: updatedDecisions,
        },
        actionItems: updatedActions,
      };

      onUpdateMeeting(updatedMeeting);
      setSuccessMessage('PII patterns (Emails, Philippine Phones, IDs, Credit Cards) successfully redacted.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsApplying(false);
    }
  };

  const toggleCategory = (cat: PiiCategory) => {
    setSelectedPiiCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" data-testid="redaction-modal">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Transcript & Notes Redaction</h2>
              <p className="text-[11px] text-slate-400">Irreversibly redact PII, sensitive pricing, or custom confidential terms.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Redact Custom Term or Specific Name */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Redact Specific Phrase / Term</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              Enter any confidential client name, property price, or sensitive phrase to replace with [REDACTED] across the entire meeting record.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={targetPhrase}
                onChange={(e) => setTargetPhrase(e.target.value)}
                placeholder="e.g. Underwriting Secret or 0917-888-9999"
                data-testid="redaction-phrase-input"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleApplyPhraseRedaction}
                disabled={!targetPhrase.trim() || isApplying}
                data-testid="apply-phrase-redaction-btn"
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                {isApplying ? 'Redacting...' : 'Redact Phrase'}
              </button>
            </div>

            {meeting.redactedPhrases && meeting.redactedPhrases.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Previously Redacted Terms:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {meeting.redactedPhrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      data-testid={`previously-redacted-${idx}`}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Automated PII Redaction */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Automated PII Sanitization Engine</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Detect and redact standard personally identifiable information matching Philippine compliance formats:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'email', label: 'Email Addresses' },
                { id: 'phone', label: 'Philippine Mobile & Landline' },
                { id: 'credit_card', label: 'Credit Cards (Luhn Validated)' },
                { id: 'gov_id', label: 'TIN, SSS, PhilHealth, Pag-IBIG' },
                { id: 'address', label: 'Street Addresses' },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 text-slate-300 select-none text-[11px]"
                >
                  <input
                    type="checkbox"
                    checked={selectedPiiCategories.includes(item.id as PiiCategory)}
                    onChange={() => toggleCategory(item.id as PiiCategory)}
                    className="accent-brand-500 rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={handleApplyPiiRedaction}
              disabled={isApplying || selectedPiiCategories.length === 0}
              data-testid="apply-pii-redaction-btn"
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              Sanitize Selected PII Patterns Across Entire Meeting
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Audit logging: All redaction actions are cryptographically hash-chained.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
