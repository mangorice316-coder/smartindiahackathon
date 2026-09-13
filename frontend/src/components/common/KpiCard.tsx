import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Activity, ShieldAlert } from 'lucide-react';

export type KpiStatus = 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'INFO' | 'NEUTRAL';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: KpiStatus;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  trendValue?: string | number;
  previousValue?: string | number;
  lastUpdated?: string;
  thresholdLabel?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  status = 'NEUTRAL',
  trend,
  trendValue,
  previousValue,
  lastUpdated,
  thresholdLabel,
  icon,
  subtitle,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'WARNING':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'SUCCESS':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'INFO':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      default:
        return 'text-slate-300 border-white/[0.08] bg-white/[0.02]';
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'CRITICAL':
        return <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />;
      case 'WARNING':
        return <span className="w-2 h-2 rounded-full bg-amber-400" />;
      case 'SUCCESS':
        return <span className="w-2 h-2 rounded-full bg-emerald-400" />;
      case 'INFO':
        return <span className="w-2 h-2 rounded-full bg-cyan-400" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-500" />;
    }
  };

  return (
    <div
      role="article"
      aria-label={`${label}: ${value} ${unit || ''}`}
      className="c2-card-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative overflow-hidden"
    >
      {/* Header with status pill and icon */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {getStatusIndicator()}
          {icon && <span className="text-slate-400">{icon}</span>}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {/* Supporting details: Trend, Comparison, Threshold, Subtitle */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
        {trend && (
          <div className="flex items-center gap-1">
            {trend === 'UP' && <TrendingUp size={13} className={status === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'} />}
            {trend === 'DOWN' && <TrendingDown size={13} className="text-emerald-400" />}
            {trend === 'STABLE' && <Minus size={13} className="text-slate-400" />}
            <span className={status === 'CRITICAL' ? 'text-red-300 font-semibold' : 'text-slate-300'}>
              {trendValue ? `${trendValue}` : trend}
            </span>
          </div>
        )}

        {thresholdLabel && (
          <span className="text-slate-400 text-[10px] truncate max-w-[120px]" title={thresholdLabel}>
            {thresholdLabel}
          </span>
        )}

        {previousValue !== undefined && !thresholdLabel && (
          <span className="text-slate-500 text-[10px]">Prev: {previousValue}</span>
        )}

        {lastUpdated && (
          <span className="text-slate-500 text-[10px] hidden sm:inline">{lastUpdated}</span>
        )}
      </div>
    </div>
  );
};
