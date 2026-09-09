import React from 'react';
import { PeriodTrendComparison } from '../../types';
import { TrendingUp, TrendingDown, Minus, AlertCircle, ShieldAlert, Sparkles, Scale } from 'lucide-react';

interface PeriodComparisonCardProps {
  comparison?: PeriodTrendComparison;
}

export const PeriodComparisonCard: React.FC<PeriodComparisonCardProps> = ({ comparison }) => {
  if (!comparison) return null;

  const renderDeltaPill = (
    direction: 'INCREASED' | 'DECREASED' | 'UNCHANGED',
    delta: number,
    pct: number,
    reverseColors = false // By default, increased events/risk is red (warning)
  ) => {
    if (direction === 'UNCHANGED' || delta === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <Minus size={12} /> 0.0% Unchanged
        </span>
      );
    }

    const isPositive = delta > 0;
    const isBad = reverseColors ? !isPositive : isPositive;

    const bgClass = isBad
      ? 'bg-red-950/70 text-red-300 border-red-700/60'
      : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold border ${bgClass}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isPositive ? `+${delta}` : `${delta}`} ({isPositive ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`})
      </span>
    );
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-3.5 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">
            <Scale size={16} />
          </div>
          <div>
            <h4 className="text-xs font-display font-semibold uppercase tracking-wider text-slate-200">
              Period-Over-Period Trend Comparison
            </h4>
            <p className="text-[11px] text-slate-400">
              Evaluating <span className="text-cyan-300 font-medium">{comparison.current_period_label}</span> vs{' '}
              <span className="text-slate-300 font-medium">{comparison.previous_period_label}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
          <Sparkles size={11} className="text-amber-400" />
          Multi-Year Rolling Baseline
        </div>
      </div>

      {/* Comparison Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Failure Occurrences */}
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Recorded Landslides</span>
            {renderDeltaPill(comparison.events_direction, comparison.events_delta, comparison.events_pct_change)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-bold text-slate-100">
              {comparison.current_events_count}
            </span>
            <span className="text-xs font-mono text-slate-500">
              prev: {comparison.previous_events_count}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
            Cataloged slope failure events verified by geological survey agencies
          </div>
        </div>

        {/* Metric 2: Average Risk Score */}
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Mean Model Risk Score</span>
            {renderDeltaPill(comparison.risk_direction, comparison.risk_score_delta, comparison.risk_pct_change)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-bold text-amber-300">
              {comparison.current_avg_risk_score.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-500">
              prev: {comparison.previous_avg_risk_score.toFixed(1)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
            Average ensemble predictive risk index across all active monitoring catchments
          </div>
        </div>

        {/* Metric 3: Historical Alerts */}
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Early Warning Alerts</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
              comparison.alerts_delta > 0
                ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {comparison.alerts_delta > 0 ? `+${comparison.alerts_delta}` : comparison.alerts_delta} delta
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-bold text-red-300">
              {comparison.current_alerts_count}
            </span>
            <span className="text-xs font-mono text-slate-500">
              prev: {comparison.previous_alerts_count}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
            Operational warning triggers dispatched to district emergency authorities
          </div>
        </div>
      </div>

      {/* Mandatory Scientific Causation Caveat */}
      <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded flex items-start gap-2 text-[11px] text-amber-200/90 leading-relaxed">
        <AlertCircle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-amber-300">Epistemic Standard: </span>
          {comparison.scientific_causation_caveat ||
            'Correlation does not imply univariate causation. Historical frequency variations reflect coupled geotechnical, hydrometeorological, and anthropogenic factors.'}
        </div>
      </div>
    </div>
  );
};
