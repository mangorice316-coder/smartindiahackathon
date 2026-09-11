import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  alertLevel?: 'none' | 'warning' | 'critical';
  glowColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  alertLevel = 'none',
  glowColor = 'cyan',
}) => {
  // Outer Bezel Gradient
  const outerBorder =
    alertLevel === 'critical'
      ? 'bg-gradient-to-b from-red-500/50 via-red-900/30 to-red-950/20 shadow-[0_0_35px_rgba(239,68,68,0.18)]'
      : alertLevel === 'warning'
      ? 'bg-gradient-to-b from-amber-500/40 via-amber-900/20 to-amber-950/10 shadow-[0_0_30px_rgba(245,158,11,0.12)]'
      : 'bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-white/[0.01] shadow-2xl';

  // Laser glow accent along the top edge
  const laserAccent =
    alertLevel === 'critical'
      ? 'after:via-red-500/50'
      : alertLevel === 'warning'
      ? 'after:via-amber-500/40'
      : glowColor === 'emerald'
      ? 'after:via-emerald-400/30'
      : glowColor === 'purple'
      ? 'after:via-purple-400/30'
      : 'after:via-cyan-400/30';

  return (
    <div className={`p-[1px] rounded-2xl ${outerBorder} transition-all duration-300 ${className}`}>
      {/* Inner Machined Core */}
      <div className={`relative rounded-[calc(1rem-1px)] bg-gradient-to-b from-[#0f172a]/95 via-[#0b101b]/95 to-[#070b14]/98 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] after:absolute after:top-0 after:left-8 after:right-8 after:h-[1px] after:bg-gradient-to-r after:from-transparent ${laserAccent} after:to-transparent`}>
        {(title || action) && (
          <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.015]">
            <div>
              {title && (
                <h3 className="font-display font-bold text-xs sm:text-sm text-slate-100 tracking-wider uppercase flex items-center gap-2">
                  {alertLevel === 'critical' && (
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  )}
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-slate-400 font-sans mt-0.5 tracking-normal">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div className="p-4 sm:p-5">{children}</div>
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
  glow?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  change,
  changeType = 'neutral',
  icon,
  alert = false,
  glow = 'cyan',
}) => {
  const outerBorder = alert
    ? 'bg-gradient-to-b from-red-500/50 via-red-900/30 to-red-950/20 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
    : 'bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-white/[0.01] hover:from-cyan-500/40 hover:via-white/[0.05] shadow-xl';

  const glowBg = alert
    ? 'bg-red-500/10'
    : glow === 'rose'
    ? 'bg-rose-500/10'
    : glow === 'emerald'
    ? 'bg-emerald-500/10'
    : glow === 'amber'
    ? 'bg-amber-500/10'
    : glow === 'purple'
    ? 'bg-purple-500/10'
    : 'bg-cyan-500/10';

  return (
    <div
      className={`group p-[1px] rounded-2xl ${outerBorder} transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5`}
    >
      <div className="relative rounded-[calc(1rem-1px)] bg-gradient-to-b from-[#0f172a]/95 via-[#0b101b]/95 to-[#070b14]/98 p-4 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
        {/* Subtle Ambient Radial Backlight */}
        <div
          className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${glowBg} blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`}
        />

        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-400 block">
              {label}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl sm:text-3xl font-display font-bold tracking-tight ${
                  alert ? 'text-red-400' : 'text-slate-100'
                }`}
              >
                {value}
              </span>
              {unit && <span className="text-xs text-slate-400 font-mono font-normal">{unit}</span>}
            </div>

            {change && (
              <div
                className={`text-[10px] font-mono tracking-wide flex items-center gap-1 mt-1 ${
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

          {icon && (
            <div
              className={`p-2 rounded-xl border border-white/10 ${
                alert ? 'bg-red-950/60 text-red-400' : 'bg-white/[0.03] text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/40'
              } transition-colors shadow-inner`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
