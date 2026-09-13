import React, { useState } from 'react';
import { X, Filter, RotateCcw, Check, Sparkles, Sliders } from 'lucide-react';
import { FilterConditions } from '../../types';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conditions: FilterConditions;
  onApply: (conditions: FilterConditions) => void;
  onReset: () => void;
  availableDistricts?: string[];
  totalMatchesCount?: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  conditions,
  onApply,
  onReset,
  availableDistricts = ['Wayanad', 'Idukki', 'Kozhikode', 'Nilgiris', 'Shimla', 'Chamoli'],
  totalMatchesCount,
}) => {
  const [localConditions, setLocalConditions] = useState<FilterConditions>(conditions);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localConditions);
    onClose();
  };

  const handleClearAll = () => {
    onReset();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-panel-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-md h-full bg-[#0B1018] border-l border-[#253042] flex flex-col justify-between p-6 overflow-y-auto shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#253042]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Filter size={15} />
              </div>
              <div>
                <h2 id="filter-panel-title" className="text-sm font-bold text-white font-sans uppercase tracking-tight">
                  OPERATIONAL DATA FILTERS
                </h2>
                <p className="text-[11px] font-mono text-slate-400">
                  {totalMatchesCount !== undefined ? `${totalMatchesCount} Matching Zones` : 'Multi-parameter query engine'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close filter panel"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Saved Views */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              SAVED PRESETS
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setLocalConditions(prev => ({ ...prev, district: 'Wayanad', riskLevel: 'CRITICAL', minRainfall: 150 }))}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-mono transition-all"
              >
                Wayanad Deluge Surge
              </button>
              <button
                onClick={() => setLocalConditions(prev => ({ ...prev, riskLevel: 'ALL', minRainfall: 0, minSlope: 30 }))}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-all"
              >
                Steep Slopes (&gt;30°)
              </button>
            </div>
          </div>

          {/* District Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              DISTRICT JURISDICTION
            </label>
            <select
              value={localConditions.district}
              onChange={(e) => setLocalConditions(prev => ({ ...prev, district: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[#10151F] border border-[#253042] text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Districts (Western Ghats & Himalayas)</option>
              {availableDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Risk Severity Level */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              RISK SEVERITY THRESHOLD
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLocalConditions(prev => ({ ...prev, riskLevel: lvl }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all border ${
                    localConditions.riskLevel === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      : 'bg-[#10151F] text-slate-400 border-[#253042] hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rainfall Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold">MIN 24H RAINFALL:</span>
              <span className="text-cyan-300 font-black">{localConditions.minRainfall} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={localConditions.minRainfall}
              onChange={(e) => setLocalConditions(prev => ({ ...prev, minRainfall: Number(e.target.value) }))}
              className="w-full accent-cyan-400 h-1.5 bg-[#10151F] rounded-lg"
            />
          </div>

          {/* Minimum Slope Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold">MIN SLOPE GRADIENT:</span>
              <span className="text-amber-300 font-black">{localConditions.minSlope}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={localConditions.minSlope}
              onChange={(e) => setLocalConditions(prev => ({ ...prev, minSlope: Number(e.target.value) }))}
              className="w-full accent-amber-400 h-1.5 bg-[#10151F] rounded-lg"
            />
          </div>

          {/* Time Range Horizon */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              TELEMETRY TIME HORIZON
            </label>
            <select
              value={localConditions.timeRange}
              onChange={(e) => setLocalConditions(prev => ({ ...prev, timeRange: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[#10151F] border border-[#253042] text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="REALTIME">Immediate Realtime (0–6 Hours)</option>
              <option value="24H">Last 24 Hours Cumulative</option>
              <option value="72H">72-Hour Antecedent Saturation (API72)</option>
              <option value="7D">Last 7 Days Storm Sequence</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#253042] flex items-center justify-between gap-3">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-[#253042] text-xs font-mono font-medium transition-all"
          >
            <RotateCcw size={12} />
            <span>Clear All</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-extrabold transition-all shadow-md active:scale-95"
          >
            <Check size={14} />
            <span>Apply Filter Criteria</span>
          </button>
        </div>
      </div>
    </div>
  );
};
