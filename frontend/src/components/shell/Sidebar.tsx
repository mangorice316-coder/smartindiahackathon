import React from 'react';
import {
  LayoutDashboard,
  Map,
  CloudRain,
  Building2,
  AlertTriangle,
  PlaySquare,
  History,
  ClipboardList,
  Cpu,
  Database,
  FileText,
  Settings
} from 'lucide-react';

export type NavView =
  | 'overview'
  | 'map'
  | 'conditions'
  | 'infrastructure'
  | 'alerts'
  | 'simulation'
  | 'history'
  | 'inspections'
  | 'model_data'
  | 'data_engine'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  alertBadgeCount?: number;
  inspectionBadgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  alertBadgeCount = 0,
  inspectionBadgeCount = 0,
}) => {
  const navItems: Array<{ id: NavView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'map', label: 'Risk Map', icon: <Map size={16} /> },
    { id: 'conditions', label: 'Live Conditions', icon: <CloudRain size={16} /> },
    { id: 'infrastructure', label: 'Infrastructure', icon: <Building2 size={16} /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={16} />, badge: alertBadgeCount },
    { id: 'simulation', label: 'Simulation', icon: <PlaySquare size={16} /> },
    { id: 'history', label: 'Historical Analysis', icon: <History size={16} /> },
    { id: 'inspections', label: 'Inspections', icon: <ClipboardList size={16} />, badge: inspectionBadgeCount },
    { id: 'model_data', label: 'Model & ML', icon: <Cpu size={16} /> },
    { id: 'data_engine', label: 'Data Engine', icon: <Database size={16} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <aside className="w-56 bg-[#090d16] border-r border-slate-800 flex flex-col justify-between shrink-0 p-2 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
          Navigation Control
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  item.id === 'alerts' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Safety Notice Footer */}
      <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded text-[10px] font-sans text-slate-500 space-y-1">
        <div className="font-mono font-bold text-slate-400 uppercase text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Decision Support System
        </div>
        <p className="leading-tight">
          Estimates geotechnical probability. Does not guarantee whether a failure will occur.
        </p>
      </div>
    </aside>
  );
};
