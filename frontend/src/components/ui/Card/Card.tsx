import React from 'react';
import { CardProps, CardVariant } from './Card.types';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-slate-900/90 border-slate-800 text-slate-100',
  elevated: 'bg-slate-900/95 border-slate-700/80 shadow-lg text-slate-100',
  interactive:
    'bg-slate-900/90 border-slate-800 text-slate-100 hover:border-c2-cyan-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-150 active:scale-[0.99]',
  bordered: 'bg-transparent border-slate-700 text-slate-100',
  cyan: 'bg-slate-900/90 border-c2-cyan-500/40 shadow-glow-cyan/10 text-slate-100',
  amber: 'bg-slate-900/90 border-amber-500/40 shadow-glow-amber/10 text-slate-100',
  red: 'bg-slate-900/90 border-red-500/40 shadow-glow-red/10 text-slate-100',
};

const PADDING_CLASSES: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  header,
  footer,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-lg border backdrop-blur-sm transition-colors
        ${VARIANT_CLASSES[variant]}
        ${className}
      `.trim()}
      {...props}
    >
      {header && (
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={PADDING_CLASSES[padding]}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/20 flex items-center justify-between text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};
