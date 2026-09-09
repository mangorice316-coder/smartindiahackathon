import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#111827] border-l border-slate-700 h-full flex flex-col shadow-2xl animate-slide-left">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-900/70">
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-100 uppercase tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 font-sans mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4 font-sans text-xs text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};
