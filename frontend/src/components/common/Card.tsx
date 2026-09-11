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
  // Double-bezel outer ring styling with subtle ambient glow
  const outerBorder =
    alertLevel === 'critical'
      ? 'bg-gradient-to-b from-red-500/40 via-red-500/10 to-transparent shadow-[0_0_25px_rgba(239,68,68,0.15)]'
      : alertLevel === 'warning'
      ? 'bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.1)]'
      : 'bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-white/[0.01] hover:from-white/[0.16] shadow-[0_12px_32px_rgba(0,0,0,0.5)]';

  const innerBg =
    alertLevel === 'critical'
      ? 'bg-[#10070a]/95'
      : alertLevel === 'warning'
      ? 'bg-[#0f0c07]/95'
      : 'bg-[#090d16]/90 backdrop-blur-2xl';

  return (
    <div className={`p-[1px] rounded-2xl ${outerBorder} transition-all duration-300 ${className}`}>
      <div className={`rounded-[calc(1rem-1px)] ${innerBg} h-full overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between`}>
        {(title || action) && (
          <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0">
            <div>
              {title && (
                <h3 className="font-display font-semibold text-xs text-slate-100 tracking-wider uppercase flex items-center gap-2">
                  {alertLevel === 'critical' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  ) : alertLevel === 'warning' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  ) : null}
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-slate-400 font-sans mt-0.5 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0 ml-3">{action}</div>}
          </div>
        )}
        <div className="p-4 flex-1">{children}</div>
      </div>
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
  const outerBorder = alert
    ? 'bg-gradient-to-b from-red-500/40 via-red-500/10 to-transparent shadow-[0_0_25px_rgba(239,68,68,0.2)]'
    : 'bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-white/[0.01] hover:from-cyan-500/30 shadow-[0_8px_24px_rgba(0,0,0,0.4)]';

  const innerBg = alert
    ? 'bg-[#10070a]/95'
    : 'bg-[#090d16]/90 backdrop-blur-xl';

  return (
    <div className={`p-[1px] rounded-2xl ${outerBorder} transition-all duration-300 group`}>
      <div className={`rounded-[calc(1rem-1px)] ${innerBg} p-4 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]`}>
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-400 group-hover:text-slate-300 transition-colors">
            {label}
          </span>
          {icon && (
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                alert
                  ? 'bg-red-500/15 border border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : 'bg-white/[0.04] border border-white/[0.08] text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/30 shadow-sm'
              }`}
            >
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-display font-bold tracking-tight ${
                alert ? 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'text-white'
              }`}
            >
              {value}
            </span>
            {unit && <span className="text-xs text-slate-400 font-mono font-medium">{unit}</span>}
          </div>

          {change && (
            <div
              className={`text-[11px] font-mono tracking-normal flex items-center gap-1.5 mt-1.5 ${
                changeType === 'negative'
                  ? 'text-red-400'
                  : changeType === 'positive'
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  changeType === 'negative'
                    ? 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                    : changeType === 'positive'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                    : 'bg-slate-500'
                }`}
              />
              <span className="truncate">{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
