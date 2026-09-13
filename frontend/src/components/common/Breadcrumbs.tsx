import React from 'react';
import { ChevronRight, ArrowLeft, RotateCcw, Home, MapPin } from 'lucide-react';
import { BreadcrumbItem } from '../../types';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onSelectLevel: (item: BreadcrumbItem) => void;
  onBack?: () => void;
  onReset?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onSelectLevel,
  onBack,
  onReset,
}) => {
  return (
    <nav aria-label="Geographic Hierarchy Breadcrumb" className="flex flex-wrap items-center justify-between gap-2 py-1 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
        <Home size={12} className="text-slate-500" />
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={item.id}>
              {index > 0 && <ChevronRight size={11} className="text-slate-600" />}
              {isLast ? (
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1">
                  <MapPin size={10} className="text-cyan-400" />
                  <span>{item.label}</span>
                </span>
              ) : (
                <button
                  onClick={() => onSelectLevel(item)}
                  className="hover:text-white transition-colors text-slate-400 px-1 py-0.5 rounded hover:bg-white/[0.04]"
                >
                  {item.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {onBack && items.length > 1 && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/[0.07] text-[11px] font-mono transition-all"
            title="Go up one administrative level"
          >
            <ArrowLeft size={11} />
            <span>Up One Level</span>
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.07] text-[11px] font-mono transition-all"
            title="Reset to National Overview"
          >
            <RotateCcw size={10} />
            <span>Reset View</span>
          </button>
        )}
      </div>
    </nav>
  );
};
