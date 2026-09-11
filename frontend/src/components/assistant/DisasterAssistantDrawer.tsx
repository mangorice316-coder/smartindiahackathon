import React, { useState } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  Compass,
  ArrowRight,
  Database,
  Layers,
  HelpCircle,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';
import { NavView } from '../shell/Sidebar';

interface DisasterAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (view: NavView) => void;
}

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: string[];
  recommendedView?: string;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  'Which catchments currently have the highest risk?',
  'Why is Chooralmala in a critical failure state?',
  'Which bridges and roads are in the danger runout zone?',
  'What happens if rainfall surges by +50%?',
  'Show historical landslide activity in this region'
];

export const DisasterAssistantDrawer: React.FC<DisasterAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateView
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### 🤖 Landslide Risk Intelligence Assistant\n\nI am connected to the **live operational database**, Open-Meteo telemetry, and Mohr-Coulomb geotechnical physics engine.\n\nAsk any question about current hazard hotspots, Factor of Safety ($F_s$), lifeline exposure, or what-if monsoon cloudburst projections.`,
      citations: ['Live SQLite Database', 'HistGradientBoosting (ROC-AUC 0.934)', 'Open-Meteo REST API'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.queryDisasterAssistant(queryText);
      const botMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        citations: response.citations,
        recommendedView: response.recommended_view,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: AssistantMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Error querying operational state**: ${err.message || 'Unable to connect to assistant service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400">
            <Bot size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm font-mono tracking-tight">DISASTER INTELLIGENCE ASSISTANT</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                LIVE GROUNDED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Operational Decision Support & Geotechnical Physics Q&A</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-3 border-b border-slate-800/70 bg-slate-900/40">
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" />
          <span>SUGGESTED EVALUATION QUERIES:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(q)}
              disabled={isLoading}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded transition-all text-left truncate max-w-full"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-lg p-3.5 ${
                msg.sender === 'user'
                  ? 'bg-red-600 text-white font-mono'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              {/* Message Content */}
              <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>

              {/* Citations & Verified Provenance */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 font-mono text-[10px]">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <Database size={10} className="text-cyan-400" />
                    <span>REFERENCED DATABASE ENTITIES:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {msg.citations.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended View Action */}
              {msg.recommendedView && (
                <div className="mt-3 pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onNavigateView(msg.recommendedView as NavView);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono border border-slate-700 transition-colors"
                  >
                    <span>Inspect in {msg.recommendedView.toUpperCase()} View</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-3 bg-slate-900 rounded border border-slate-800">
            <Activity size={14} className="text-red-400 animate-spin" />
            <span>Querying live database state and geotechnical physics equations...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything (e.g., 'Why is Chooralmala dangerous?', 'What bridges are cut off?')..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 font-sans"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
            title="Send operational query"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
