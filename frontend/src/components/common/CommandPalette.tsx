import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Map, ShieldAlert, AlertTriangle, FileText, Cpu, Compass, Settings, Database, Activity, ArrowRight, X } from 'lucide-react';
import { NavView } from '../shell/Sidebar';

interface CommandItem {
  id: string;
  title: string;
  category: 'NAVIGATION' | 'SECTOR' | 'ACTION' | 'SENSOR';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (view: NavView) => void;
  onSelectLocation?: (locationId: number) => void;
  onOpenReportExport?: () => void;
  onToggleOffline?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateView,
  onSelectLocation,
  onOpenReportExport,
  onToggleOffline,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commandList: CommandItem[] = useMemo(() => [
    // Views
    {
      id: 'nav-overview',
      title: 'Open Situation Room (Overview)',
      category: 'NAVIGATION',
      icon: <Activity size={14} className="text-cyan-400" />,
      action: () => { onNavigateView('overview'); onClose(); },
    },
    {
      id: 'nav-map',
      title: 'Open Live GIS Risk Map Canvas',
      category: 'NAVIGATION',
      icon: <Map size={14} className="text-cyan-400" />,
      action: () => { onNavigateView('map'); onClose(); },
    },
    {
      id: 'nav-alerts',
      title: 'View Active CAP Warnings & Directives',
      category: 'NAVIGATION',
      icon: <ShieldAlert size={14} className="text-red-400" />,
      action: () => { onNavigateView('alerts'); onClose(); },
    },
    {
      id: 'nav-simulation',
      title: 'Open Cloudburst Deluge Sandbox Simulator',
      category: 'NAVIGATION',
      icon: <Compass size={14} className="text-amber-400" />,
      action: () => { onNavigateView('simulation'); onClose(); },
    },
    {
      id: 'nav-inspections',
      title: 'Open Ground Inspections & Field Tasks',
      category: 'NAVIGATION',
      icon: <FileText size={14} className="text-emerald-400" />,
      action: () => { onNavigateView('inspections'); onClose(); },
    },
    {
      id: 'nav-model',
      title: 'Inspect ML Pipeline & Mohr-Coulomb Engine',
      category: 'NAVIGATION',
      icon: <Cpu size={14} className="text-purple-400" />,
      action: () => { onNavigateView('model_data'); onClose(); },
    },
    {
      id: 'nav-engine',
      title: 'View Data Engine & 5-Tier Hierarchy',
      category: 'NAVIGATION',
      icon: <Database size={14} className="text-blue-400" />,
      action: () => { onNavigateView('data_engine'); onClose(); },
    },
    {
      id: 'nav-reports',
      title: 'Open Situation Reports & PDF Export',
      category: 'NAVIGATION',
      icon: <FileText size={14} className="text-slate-300" />,
      action: () => { onNavigateView('reports'); onClose(); },
    },
    // Priority Locations
    {
      id: 'loc-chooralmala',
      title: 'Focus Sector: Chooralmala (Fs 0.88 - Critical)',
      category: 'SECTOR',
      icon: <ShieldAlert size={14} className="text-red-400" />,
      action: () => {
        if (onSelectLocation) onSelectLocation(1);
        onNavigateView('map');
        onClose();
      },
    },
    {
      id: 'loc-mundakkai',
      title: 'Focus Sector: Mundakkai Catchment (High Risk)',
      category: 'SECTOR',
      icon: <AlertTriangle size={14} className="text-orange-400" />,
      action: () => {
        if (onSelectLocation) onSelectLocation(2);
        onNavigateView('map');
        onClose();
      },
    },
    {
      id: 'loc-meppadi',
      title: 'Focus Sector: Meppadi Arterial Bridge Corridor',
      category: 'SECTOR',
      icon: <Compass size={14} className="text-amber-400" />,
      action: () => {
        if (onSelectLocation) onSelectLocation(3);
        onNavigateView('map');
        onClose();
      },
    },
    // Quick Actions
    {
      id: 'action-export',
      title: 'Generate Instant SitRep Briefing (PDF/CSV)',
      category: 'ACTION',
      icon: <FileText size={14} className="text-cyan-300" />,
      action: () => {
        if (onOpenReportExport) onOpenReportExport();
        onClose();
      },
    },
    {
      id: 'action-offline',
      title: 'Toggle Resilient Offline Mode (Local Geopackage)',
      category: 'ACTION',
      icon: <Database size={14} className="text-amber-400" />,
      action: () => {
        if (onToggleOffline) onToggleOffline();
        onClose();
      },
    },
  ], [onNavigateView, onSelectLocation, onOpenReportExport, onToggleOffline, onClose]);

  const filteredCommands = useMemo(() => {
    if (!query) return commandList;
    const lower = query.toLowerCase();
    return commandList.filter(
      cmd => cmd.title.toLowerCase().includes(lower) || cmd.category.toLowerCase().includes(lower)
    );
  }, [commandList, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => (idx + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => (idx - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="C2 Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="c2-card max-w-xl w-full rounded-2xl border-[#253042] overflow-hidden shadow-2xl space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#253042] bg-[#0B1018]">
          <Search size={16} className="text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, location, or view (e.g., 'Chooralmala', 'Map', 'Export')..."
            className="w-full bg-transparent text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-[#10151F]">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No matching commands or sectors found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-mono ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-1 rounded-lg bg-black/40 border border-white/[0.06]">{cmd.icon}</span>
                    <span className="font-medium text-white">{cmd.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{cmd.category}</span>
                    {isSelected && <ArrowRight size={12} className="text-cyan-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-[#070B12] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-cyan-400 font-bold">C2 COMMAND ENGINE</span>
        </div>
      </div>
    </div>
  );
};
