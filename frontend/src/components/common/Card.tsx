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
  const borderAlert =
    alertLevel === 'critical'
      ? 'border-red-600/70 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
      : alertLevel === 'warning'
      ? 'border-amber-600/60'
      : 'border-slate-800';

  return (
    <div className={`bg-[#111827] border ${borderAlert} rounded-lg overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            {title && <h3 className="font-display font-semibold text-sm text-slate-100 tracking-wide uppercase">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 font-sans mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
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
  return (
    <div className={`bg-[#111827] border ${alert ? 'border-red-600/70' : 'border-slate-800'} rounded-lg p-3.5 relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-2xl font-display font-bold ${alert ? 'text-red-400' : 'text-slate-100'}`}>
              {value}
            </span>
            {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
          </div>
          {change && (
            <div className={`text-[11px] font-mono mt-1 ${
              changeType === 'negative' ? 'text-red-400' : changeType === 'positive' ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {change}
            </div>
          )}
        </div>
        {icon && <div className="text-slate-500 p-1.5 bg-slate-800/50 rounded">{icon}</div>}
      </div>
    </div>
  );
};
