import React from 'react';
import { Search } from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
  filters?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  placeholder = 'Search catchments, assets, or IDs...',
  filters
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111827] border border-slate-800 rounded-lg">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-700/80 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 font-sans focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>
      {filters && <div className="flex items-center gap-2">{filters}</div>}
    </div>
  );
};
