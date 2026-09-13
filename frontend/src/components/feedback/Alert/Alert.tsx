import React from 'react';
import { AlertProps, AlertSeverity } from './Alert.types';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { container: string; icon: React.ReactNode; iconColor: string }
> = {
  critical: {
    container: 'bg-red-950/80 border-red-500/60 text-red-200 shadow-glow-red/20',
    icon: <AlertCircle className="w-5 h-5 shrink-0" />,
    iconColor: 'text-red-400',
  },
  warning: {
    container: 'bg-amber-950/80 border-amber-500/60 text-amber-200 shadow-glow-amber/20',
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    iconColor: 'text-amber-400',
  },
  info: {
    container: 'bg-cyan-950/80 border-c2-cyan-500/60 text-cyan-200 shadow-glow-cyan/20',
    icon: <Info className="w-5 h-5 shrink-0" />,
    iconColor: 'text-c2-cyan-400',
  },
  success: {
    container: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200',
    icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    iconColor: 'text-emerald-400',
  },
};

export const Alert: React.FC<AlertProps> = ({
  severity = 'info',
  title,
  description,
  onDismiss,
  action,
  className = '',
}) => {
  const config = SEVERITY_CONFIG[severity];

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm text-left
        ${config.container}
        ${className}
      `.trim()}
    >
      <div className={`mt-0.5 ${config.iconColor}`} aria-hidden="true">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
        {description && <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{description}</p>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-semibold underline hover:no-underline focus-visible:ring-2 focus-visible:ring-c2-cyan-400 focus-visible:outline-none"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-white p-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-c2-cyan-400 focus-visible:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
