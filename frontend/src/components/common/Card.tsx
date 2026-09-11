import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  alertLevel?: 'none' | 'warning' | 'critical';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  alertLevel = 'none',
}) => {
  const alertStyles =
    alertLevel === 'critical'
      ? 'border-red-500/60 bg-[#140b0e]'
      : alertLevel === 'warning'
      ? 'border-amber-500/50 bg-[#130f0a]'
      : 'border-slate-800/80 bg-[#0d121f]';

  return (
    <div className={`rounded-xl border ${alertStyles} overflow-hidden transition-all duration-200 ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="font-display font-semibold text-xs text-slate-200 tracking-wider uppercase flex items-center gap-2">
                {alertLevel === 'critical' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                )}
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  alert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  change,
  changeType = 'neutral',
  icon,
  alert = false,
}) => {
  const cardBorder = alert
    ? 'border-red-500/60 bg-[#140b0e]'
    : 'border-slate-800/80 bg-[#0d121f] hover:border-slate-700/80';

  return (
    <div
      className={`rounded-xl border ${cardBorder} p-4 transition-all duration-200 flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && (
          <div
            className={`p-1.5 rounded-lg ${
              alert ? 'bg-red-950/60 text-red-400' : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-display font-bold tracking-tight ${
              alert ? 'text-red-400' : 'text-slate-100'
            }`}
          >
            {value}
          </span>
          {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
        </div>

        {change && (
          <div
            className={`text-[11px] font-mono tracking-normal flex items-center gap-1.5 mt-1 ${
              changeType === 'negative'
                ? 'text-red-400'
                : changeType === 'positive'
                ? 'text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${
                changeType === 'negative'
                  ? 'bg-red-400'
                  : changeType === 'positive'
                  ? 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
            />
            {change}
          </div>
        )}
      </div>
    </div>
  );
};
