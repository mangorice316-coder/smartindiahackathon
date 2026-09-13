import React, { forwardRef, useId } from 'react';
import { InputProps } from './Input.types';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id: propId,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = propId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const isInvalid = Boolean(error);

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={isInvalid}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`
              w-full bg-slate-950/80 border rounded text-sm text-slate-100 placeholder-slate-500
              py-2 transition-colors duration-150 font-mono
              ${leftIcon ? 'pl-9' : 'pl-3'}
              ${rightIcon ? 'pr-9' : 'pr-3'}
              ${
                isInvalid
                  ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'border-slate-700 focus:border-c2-cyan-400 focus:ring-1 focus:ring-c2-cyan-400'
              }
              focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `.trim()}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-slate-400 pointer-events-none shrink-0" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <span id={errorId} role="alert" className="text-xs text-red-400 font-medium">
            {error}
          </span>
        ) : helperText ? (
          <span id={helperId} className="text-xs text-slate-500">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
