import React, { forwardRef } from 'react';
import { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-c2-cyan-500 text-slate-950 font-bold hover:bg-c2-cyan-400 active:bg-c2-cyan-600 shadow-glow-cyan border border-c2-cyan-400',
  secondary:
    'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-900 border border-slate-700',
  danger:
    'bg-red-950/80 text-red-200 hover:bg-red-900/90 active:bg-red-950 border border-red-500/60 shadow-glow-red',
  warning:
    'bg-amber-950/80 text-amber-200 hover:bg-amber-900/90 active:bg-amber-950 border border-amber-500/60 shadow-glow-amber',
  ghost:
    'bg-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white active:bg-slate-800',
  outline:
    'bg-transparent text-c2-cyan-400 border border-c2-cyan-500/50 hover:bg-c2-cyan-950/40 hover:border-c2-cyan-400 active:bg-c2-cyan-950/60',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'text-xs px-2.5 py-1 gap-1.5 min-h-[28px]',
  sm: 'text-xs px-3 py-1.5 gap-2 min-h-[34px]',
  md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
  lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[48px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`
          inline-flex items-center justify-center font-medium rounded transition-all duration-150 select-none
          focus-visible:ring-2 focus-visible:ring-c2-cyan-400 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${VARIANT_CLASSES[variant]}
          ${SIZE_CLASSES[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
