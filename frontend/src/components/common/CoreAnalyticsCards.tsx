import React, { useState } from 'react';
import { CloudRain, MapPin, AlertOctagon, Cpu, ChevronDown, ChevronUp, Layers, Activity, Eye } from 'lucide-react';

interface CoreAnalyticsCardsProps {
  onOpenXai?: (locationName: string) => void;
  onNavigateToGis?: () => void;
  peakRainfall?: number;
  criticalFactorOfSafety?: number;
  exposedPopulation?: number;
  primaryLocationName?: string;
  porePressureKPa?: number;
}

export const CoreAnalyticsCards: React.FC<CoreAnalyticsCardsProps> = ({
  onOpenXai,
  onNavigateToGis,
  peakRainfall = 442.5,
  criticalFactorOfSafety = 0.88,
  exposedPopulation = 1420,
  primaryLocationName = 'Chooralmala (Wayanad)',
  porePressureKPa = 68.4,
}) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedCard(prev => prev === idx ? null : idx);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" role="region" aria-label="Core Analytical Assessment Cards">
      {/* CARD 1: WHAT IS HAPPENING? */}
      <div className="c2-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative overflow-hidden border-[#253042]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-cyan-400 font-extrabold">CARD 1 / DIAGNOSIS</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
            METEOROLOGICAL
          </span>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white font-sans uppercase tracking-tight">WHAT IS HAPPENING?</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">{peakRainfall}</span>
            <span className="text-xs font-mono text-slate-400">mm / 24h</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-sans line-clamp-2">
            Catastrophic cloudburst deluge exceeding 300-year recurrence interval. Regolith saprolite saturation at 98.4%.
          </p>
        </div>

        {/* Mini visualization / status pill */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <CloudRain size={13} className="text-cyan-400" />
            <span>Rain Rate: <strong className="text-white">38.2 mm/h</strong></span>
          </div>
          <span className="text-cyan-300 font-bold">API₇₂: 142mm</span>
        </div>
      </div>

      {/* CARD 2: WHERE IS IT HAPPENING? */}
      <div className="c2-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative overflow-hidden border-[#253042]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-amber-400 font-extrabold">CARD 2 / SPATIAL</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
            CATCHMENT
          </span>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white font-sans uppercase tracking-tight">WHERE IS IT HAPPENING?</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-sans text-white truncate">{primaryLocationName}</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-sans line-clamp-2">
            Upper steep hillslopes (Slope &gt; 34°), Meppadi Taluk. Immediate threat to riverine settlement downstream.
          </p>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin size={13} className="text-amber-400" />
            <span>Slope: <strong className="text-amber-300">38.5°</strong></span>
          </div>
          {onNavigateToGis ? (
            <button
              onClick={onNavigateToGis}
              className="text-amber-300 hover:text-white flex items-center gap-1 text-[10px] underline decoration-amber-500/40"
            >
              <span>View GIS</span>
              <Eye size={10} />
            </button>
          ) : (
            <span className="text-slate-400">Elev: 980m</span>
          )}
        </div>
      </div>

      {/* CARD 3: HOW DANGEROUS IS IT? */}
      <div className="c2-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative overflow-hidden border-[#253042]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-red-400 font-extrabold">CARD 3 / SEVERITY</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px] font-black border border-red-500/40">
            CRITICAL
          </span>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white font-sans uppercase tracking-tight">HOW DANGEROUS IS IT?</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-red-400">Fs {criticalFactorOfSafety}</span>
            <span className="text-xs font-mono text-red-300">&lt; 1.0 (Failure)</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-sans line-clamp-2">
            Factor of Safety &lt; 1.0 indicates mathematical shear failure along planar slip surface. 1,420 citizens exposed.
          </p>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <AlertOctagon size={13} className="text-red-400" />
            <span>Exposed: <strong className="text-red-300">{exposedPopulation.toLocaleString()}</strong></span>
          </div>
          <span className="text-red-300 font-bold">Bridge Scour Risk</span>
        </div>
      </div>

      {/* CARD 4: WHY IS THIS HAPPENING? */}
      <div className="c2-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative overflow-hidden border-[#253042]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-purple-400 font-extrabold">CARD 4 / MECHANICS</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
            XAI PHYSICS
          </span>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white font-sans uppercase tracking-tight">WHY IS THIS HAPPENING?</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-purple-300">Δu = +{porePressureKPa}</span>
            <span className="text-xs font-mono text-slate-400">kPa</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-sans line-clamp-2">
            Pore-water pressure eliminates matric suction along weathered charnockite-colluvium contact interface.
          </p>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu size={13} className="text-purple-400" />
            <span>Mohr-Coulomb Limit</span>
          </div>
          {onOpenXai && (
            <button
              onClick={() => onOpenXai(primaryLocationName)}
              className="text-purple-300 hover:text-white flex items-center gap-1 text-[10px] underline decoration-purple-500/40"
            >
              <span>Explain AI</span>
              <Eye size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
