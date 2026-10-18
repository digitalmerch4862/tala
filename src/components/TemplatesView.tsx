import React, { useState } from 'react';
import {
  LayoutTemplate,
  Home,
  Eye,
  Handshake,
  DollarSign,
  CheckCircle2,
  Users,
  FileText,
  Mic,
  Upload,
} from 'lucide-react';
import { MEETING_TEMPLATES } from '../templates/meetingTemplates';
import type { MeetingTemplate } from '../types';

interface TemplatesViewProps {
  onStartWithTemplate: (templateId: string, mode: 'record' | 'upload') => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onStartWithTemplate }) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'general' | 'real_estate' | 'executive'>('all');

  const filteredTemplates = MEETING_TEMPLATES.filter((tmpl) => {
    if (categoryFilter !== 'all' && tmpl.category !== categoryFilter) return false;
    return true;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="w-5 h-5 text-emerald-400" />;
      case 'Eye':
        return <Eye className="w-5 h-5 text-blue-400" />;
      case 'Handshake':
        return <Handshake className="w-5 h-5 text-amber-400" />;
      case 'DollarSign':
        return <DollarSign className="w-5 h-5 text-purple-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-brand-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-cyan-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950" data-testid="templates-view">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Meeting Templates</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Turnkey agenda structures and domain-specific extraction prompts for meetings.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              categoryFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Templates
          </button>
          <button
            onClick={() => setCategoryFilter('general')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              categoryFilter === 'general'
                ? 'bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            General & Team
          </button>
          <button
            onClick={() => setCategoryFilter('real_estate')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              categoryFilter === 'real_estate'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Real Estate
          </button>
          <button
            onClick={() => setCategoryFilter('executive')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              categoryFilter === 'executive'
                ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Executive & Strategic
          </button>
        </div>
      </header>

      {/* Grid of Templates */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              data-testid={`template-card-${tmpl.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    {getIcon(tmpl.iconName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{tmpl.name}</h3>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      {tmpl.category === 'real_estate' ? 'Real Estate' : tmpl.category === 'general' ? 'General' : tmpl.category === 'executive' ? 'Executive' : tmpl.category}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{tmpl.description}</p>

                {/* Suggested Agenda */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 mb-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Suggested Agenda Points:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    {tmpl.suggestedAgenda.map((item, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-brand-500 shrink-0 font-bold">•</span>
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center space-x-2">
                <button
                  onClick={() => onStartWithTemplate(tmpl.id, 'record')}
                  data-testid={`template-record-${tmpl.id}`}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record</span>
                </button>
                <button
                  onClick={() => onStartWithTemplate(tmpl.id, 'upload')}
                  data-testid={`template-upload-${tmpl.id}`}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
