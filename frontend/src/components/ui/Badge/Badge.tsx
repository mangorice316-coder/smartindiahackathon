import React from 'react';
import { BadgeProps, BadgeVariant, BadgeSize } from './Badge.types';

const VARIANT_CLASSES: Record<BadgeVariant, { container: string; dot: string }> = {
  critical: {
    container: 'bg-red-950/70 text-red-300 border-red-500/60 shadow-glow-red/20',
    dot: 'bg-red-400',
  },
  high: {
    container: 'bg-orange-950/70 text-orange-300 border-orange-500/60 shadow-glow-amber/20',
    dot: 'bg-orange-400',
  },
  warning: {
    container: 'bg-amber-950/70 text-amber-300 border-amber-500/60',
    dot: 'bg-amber-400',
  },
  moderate: {
    container: 'bg-yellow-950/70 text-yellow-300 border-yellow-500/60',
    dot: 'bg-yellow-400',
  },
  low: {
    container: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60',
    dot: 'bg-emerald-400',
  },
  success: {
    container: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60',
    dot: 'bg-emerald-400',
  },
  info: {
    container: 'bg-cyan-950/70 text-cyan-300 border-c2-cyan-500/60 shadow-glow-cyan/20',
    dot: 'bg-c2-cyan-400',
  },
  purple: {
    container: 'bg-purple-950/70 text-purple-300 border-purple-500/60 shadow-glow-purple/20',
    dot: 'bg-purple-400',
  },
  neutral: {
    container: 'bg-slate-800/80 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
  },
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1 font-semibold tracking-wider uppercase',
  sm: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
  md: 'text-xs px-2.5 py-1 gap-2 font-semibold',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  icon,
  className = '',
  children,
  ...props
}) => {
  const styles = VARIANT_CLASSES[variant];

  return (
    <span
      className={`
        inline-flex items-center rounded border transition-colors select-none font-mono
        ${styles.container}
        ${SIZE_CLASSES[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot} ${pulse ? 'animate-ping' : ''}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
