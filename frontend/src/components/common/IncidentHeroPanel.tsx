import React, { useState } from 'react';
import { Flame, ShieldAlert, TrendingUp, Compass, Clock, CheckCircle2, ChevronRight, FileDown, AlertTriangle, Layers } from 'lucide-react';

interface IncidentHeroPanelProps {
  title?: string;
  location?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  confidence?: number;
  trendPct?: number;
  activeHorizon?: '0-6h' | '24h' | '72h';
  onSelectHorizon?: (horizon: '0-6h' | '24h' | '72h') => void;
  onFocusMap?: () => void;
  onExportReport?: () => void;
  triggerSummary?: string;
}

export const IncidentHeroPanel: React.FC<IncidentHeroPanelProps> = ({
  title = 'MONSOON CLOUDBURST SURGE',
  location = 'Wayanad Foothills (Chooralmala — Meppadi Corridor)',
  severity = 'CRITICAL',
  confidence = 96.5,
  trendPct = 14.8,
  activeHorizon = '0-6h',
  onSelectHorizon,
  onFocusMap,
  onExportReport,
  triggerSummary = 'Antecedent rainfall of 442.5mm has driven saprolite colluvium past pore-pressure failure threshold; Factor of Safety dropped to Fs 0.88 with active crown tension crack progression.',
}) => {
  const [horizon, setHorizon] = useState<'0-6h' | '24h' | '72h'>(activeHorizon);

  const handleHorizonClick = (h: '0-6h' | '24h' | '72h') => {
    setHorizon(h);
    if (onSelectHorizon) onSelectHorizon(h);
  };

  return (
    <section
      aria-label="Current Major Incident Status"
      className="relative rounded-2xl bg-gradient-to-b from-[#151B26] via-[#10151F] to-[#0B1018] border border-[#253042] p-5 sm:p-6 shadow-2xl overflow-hidden"
    >
      {/* Subtle top severity accent glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Main Incident Overview Block */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Severity Badge with double indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 font-mono text-xs font-black tracking-wider shadow-[0_0_12px_rgba(255,59,77,0.3)]">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <ShieldAlert size={14} className="text-red-400" />
              <span>{severity} DISASTER STATE</span>
            </div>

            {/* Trend Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold">
              <TrendingUp size={13} className="text-amber-400" />
              <span>Escalating +{trendPct}%</span>
            </div>

            {/* System Confidence */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Model Confidence: {confidence}%</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              <span>{title}</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-300 flex items-center gap-1.5 mt-0.5">
              <Compass size={13} className="text-cyan-400 shrink-0" />
              <span className="text-white font-medium">{location}</span>
              <span className="text-slate-500 hidden sm:inline">• 11.5365° N, 76.1322° E</span>
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans border-l-2 border-red-500/40 pl-3 py-0.5 bg-white/[0.01]">
            {triggerSummary}
          </p>
        </div>

        {/* Forecast Horizon Tabs & Immediate C2 Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0">
          {/* Horizon Switcher */}
          <div className="space-y-1.5 w-full sm:w-auto">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left lg:text-right font-bold">
              FORECAST TIME HORIZON
            </div>
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-[#253042]">
              <button
                onClick={() => handleHorizonClick('0-6h')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  horizon === '0-6h'
                    ? 'bg-red-500/20 text-red-200 border border-red-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                0–6h Immediate
              </button>
              <button
                onClick={() => handleHorizonClick('24h')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  horizon === '24h'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                24h Forecast
              </button>
              <button
                onClick={() => handleHorizonClick('72h')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  horizon === '72h'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                72h Antecedent
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onFocusMap && (
              <button
                onClick={onFocusMap}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Compass size={13} className="text-cyan-400" />
                <span>Focus on Map</span>
              </button>
            )}
            {onExportReport && (
              <button
                onClick={onExportReport}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-[#253042] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <FileDown size={13} className="text-slate-400" />
                <span>Export Briefing</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
