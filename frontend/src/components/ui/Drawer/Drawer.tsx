import React, { useId } from 'react';
import { DrawerProps } from './Drawer.types';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { X } from 'lucide-react';

const WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  position = 'right',
  width = 'md',
  children,
  footer,
}) => {
  const titleId = useId();
  const descId = useId();
  const drawerRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`
          fixed top-0 bottom-0 w-full ${WIDTH_CLASSES[width]} bg-slate-900 border-slate-800
          shadow-2xl flex flex-col z-50 text-left
          ${position === 'right' ? 'right-0 border-l animate-slideInRight' : 'left-0 border-r animate-slideInLeft'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 id={titleId} className="text-base font-bold text-white tracking-wide">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors focus-visible:ring-2 focus-visible:ring-c2-cyan-400 focus-visible:outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
