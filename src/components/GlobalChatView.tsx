import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Building2,
  Calendar,
  ArrowRight,
  Search,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import type { Meeting } from '../types';
import { queryAcrossAllMeetings } from '../services/aiIntelligence';

interface GlobalChatViewProps {
  meetings: Meeting[];
  onOpenMeeting: (meetingId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: Array<{ meetingId: string; meetingTitle: string }>;
}

export const GlobalChatView: React.FC<GlobalChatViewProps> = ({
  meetings,
  onOpenMeeting,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Kumusta! I am your **Tala AI Executive Assistant**. I have indexed all **${meetings.length} meetings** across your workspaces. Ask me anything about project milestones, pending action items, client feedback, or team decisions across all recordings.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const suggestedQueries = [
    'Which action items are currently pending or overdue?',
    'Summarize key decisions across all team meetings this month.',
    'What are the active project blockers and deliverables?',
    'What client feedback and scope adjustments were discussed?',
  ];

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || isSearching) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSearching(true);

    try {
      const response = await queryAcrossAllMeetings(q, meetings);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources.map((m) => ({
          meetingId: m.id,
          meetingTitle: m.title,
        })),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to query across meetings right now. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 overflow-hidden" data-testid="global-chat-view">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Ask AI Assistant Across All Meetings</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Cross-meeting semantic intelligence covering {meetings.length} saved meetings.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            data-testid={`global-chat-msg-${msg.sender}`}
            className={`flex space-x-3 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm ml-auto max-w-xl'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                {msg.text}

                {/* Sources Pill Links */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Referenced Meetings:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.sources.map((src) => (
                        <button
                          key={src.meetingId}
                          onClick={() => onOpenMeeting(src.meetingId)}
                          data-testid={`source-meeting-${src.meetingId}`}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-brand-300 hover:text-brand-200 text-[11px] border border-slate-700/60 transition"
                        >
                          <span className="truncate max-w-[200px]">{src.meetingTitle}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div
                className={`text-[10px] text-slate-500 px-1 ${
                  msg.sender === 'user' ? 'text-right' : ''
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isSearching && (
          <div className="flex space-x-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-brand-600/30 text-brand-400 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm text-xs text-slate-400 flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
              <span>Analyzing transcripts and summaries across all {meetings.length} meetings...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts Suggestions */}
      {messages.length <= 2 && (
        <div className="px-6 py-2 bg-slate-900/30 border-t border-slate-800/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Suggested Prompts:
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(query)}
                data-testid={`suggested-query-${idx}`}
                className="text-left px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <footer className="p-4 border-t border-slate-800 bg-slate-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask across all meetings (e.g. 'What were our key decisions on BGC office acquisition?')..."
            data-testid="global-chat-input"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSearching}
            data-testid="global-chat-send-btn"
            className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-brand-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};
