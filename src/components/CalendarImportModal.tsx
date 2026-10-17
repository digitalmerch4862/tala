import React, { useState } from 'react';
import { X, Calendar, Upload, FileText, Check, AlertCircle, Plus } from 'lucide-react';
import { parseICS, ParsedICSEvent } from '../services/integrations';
import { Meeting } from '../types';

interface CalendarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMeeting: (meeting: Meeting) => void;
  channelId?: string;
  channelName?: string;
}

export const CalendarImportModal: React.FC<CalendarImportModalProps> = ({
  isOpen,
  onClose,
  onImportMeeting,
  channelId = 'ch-acquisitions',
  channelName = 'Acquisitions',
}) => {
  const [icsText, setIcsText] = useState('');
  const [parsedEvents, setParsedEvents] = useState<ParsedICSEvent[]>([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setIcsText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleParse = (content: string) => {
    setError(null);
    try {
      const events = parseICS(content);
      if (events.length === 0) {
        setError('No valid VEVENT records found in this .ics file.');
      } else {
        setParsedEvents(events);
        setSelectedEventIndex(0);
      }
    } catch (err: any) {
      setError(`Failed to parse iCalendar format: ${err.message || err}`);
    }
  };

  const handleImportSelected = () => {
    if (selectedEventIndex === null || !parsedEvents[selectedEventIndex]) return;
    const ev = parsedEvents[selectedEventIndex];

    const newMeeting: Meeting = {
      id: `mtg-${Date.now()}`,
      title: ev.title,
      createdAt: ev.startDate || new Date().toISOString(),
      durationSeconds: ev.durationMinutes * 60,
      channelId,
      channelName,
      templateId: 'tpl-property-discovery',
      templateName: 'Client Property Discovery & Brief',
      participants: ev.attendees.length > 0 ? ev.attendees : ['Rad (BDM)', 'Prospective Buyer'],
      language: 'fil-PH (Tagalog / English)',
      summary: {
        overview: ev.description || `Scheduled calendar meeting: ${ev.title}. Location: ${ev.location || 'Remote/Office'}`,
        keyDiscussionPoints: [
          `Meeting scheduled via Calendar import.`,
          ev.location ? `Location: ${ev.location}` : 'Online conference',
          `Duration planned: ${ev.durationMinutes} minutes.`
        ],
        decisionsMade: [
          'Meeting agenda established from imported calendar booking.'
        ],
        nextSteps: [
          'Conduct face-to-face discovery meeting.',
          'Record and summarize key discussion points.'
        ],
        realEstateMetrics: {
          location: ev.location || 'Metro Manila',
          propertyType: 'Residential Condominium',
          budgetRange: 'PHP 10M - 25M',
          financingType: 'Bank',
        },
      },
      actionItems: [
        {
          id: `act-${Date.now()}-1`,
          meetingId: `mtg-${Date.now()}`,
          meetingTitle: ev.title,
          title: `Prepare presentation materials for ${ev.title}`,
          assignee: 'Rad (BDM)',
          dueDate: ev.startDate.split('T')[0] || new Date().toISOString().split('T')[0],
          status: 'todo',
          priority: 'high',
          createdAt: new Date().toISOString(),
        },
      ],
      transcript: [
        {
          id: `utt-${Date.now()}-1`,
          speaker: 'Rad (BDM)',
          text: `Welcome! This session was scheduled for ${ev.title}.`,
          startSec: 5,
          endSec: 10,
        },
      ],
      status: 'completed',
      tags: ['Calendar Import', 'Scheduled'],
    };

    onImportMeeting(newMeeting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" data-testid="calendar-import-modal">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Import Calendar (.ics)</h2>
              <p className="text-[11px] text-slate-400">Import Google Calendar, Outlook, or Apple iCal events.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* File Upload / Paste */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Upload .ics File
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-xl p-4 cursor-pointer bg-slate-950/60 transition group">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-400 mb-1" />
              <span className="text-xs text-slate-300 font-medium">Click to select .ics file</span>
              <span className="text-[10px] text-slate-500 mt-0.5">RFC 5545 iCalendar standard</span>
              <input
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileUpload}
                data-testid="ics-file-input"
                className="hidden"
              />
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-2 text-slate-500 uppercase text-[10px] font-bold">Or Paste Raw ICS</span>
            </div>
          </div>

          <div>
            <textarea
              rows={4}
              value={icsText}
              onChange={(e) => {
                setIcsText(e.target.value);
                if (e.target.value.includes('BEGIN:VCALENDAR')) {
                  handleParse(e.target.value);
                }
              }}
              data-testid="ics-raw-textarea"
              placeholder="BEGIN:VCALENDAR&#10;VERSION:2.0&#10;BEGIN:VEVENT&#10;SUMMARY:Shang Residences Viewing&#10;..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Events List */}
          {parsedEvents.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Found {parsedEvents.length} Calendar Event{parsedEvents.length > 1 ? 's' : ''}:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {parsedEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedEventIndex(idx)}
                    data-testid={`parsed-event-${idx}`}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedEventIndex === idx
                        ? 'bg-brand-500/10 border-brand-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{ev.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(ev.startDate).toLocaleString()} • {ev.durationMinutes} mins
                        {ev.location && ` • ${ev.location}`}
                      </div>
                      {ev.attendees.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Attendees: {ev.attendees.join(', ')}
                        </div>
                      )}
                    </div>
                    {selectedEventIndex === idx && (
                      <Check className="w-4 h-4 text-brand-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImportSelected}
            disabled={selectedEventIndex === null || parsedEvents.length === 0}
            data-testid="confirm-import-calendar-btn"
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import as Meeting</span>
          </button>
        </div>
      </div>
    </div>
  );
};
