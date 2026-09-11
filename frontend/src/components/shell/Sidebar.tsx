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
  Settings,
  ShieldCheck
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

interface NavSection {
  title: string;
  items: Array<{ id: NavView; label: string; icon: React.ReactNode; badge?: number }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  alertBadgeCount = 0,
  inspectionBadgeCount = 0,
}) => {
  const sections: NavSection[] = [
    {
      title: 'SITUATION ROOM',
      items: [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
        { id: 'map', label: 'Risk Map', icon: <Map size={15} /> },
        { id: 'conditions', label: 'Live Conditions', icon: <CloudRain size={15} /> },
      ],
    },
    {
      title: 'PHYSICS & IMPACT',
      items: [
        { id: 'infrastructure', label: 'Infrastructure', icon: <Building2 size={15} /> },
        { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={15} />, badge: alertBadgeCount },
        { id: 'simulation', label: 'Simulation', icon: <PlaySquare size={15} /> },
        { id: 'history', label: 'Historical Analysis', icon: <History size={15} /> },
      ],
    },
    {
      title: 'FIELD & ENGINE',
      items: [
        { id: 'inspections', label: 'Inspections', icon: <ClipboardList size={15} />, badge: inspectionBadgeCount },
        { id: 'model_data', label: 'Model & ML', icon: <Cpu size={15} /> },
        { id: 'data_engine', label: 'Data Engine', icon: <Database size={15} /> },
        { id: 'reports', label: 'Reports', icon: <FileText size={15} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-[#060912]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col justify-between shrink-0 p-3 select-none shadow-2xl relative z-20">
      <div className="space-y-4 overflow-y-auto pr-0.5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500 font-bold">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                      isActive
                        ? 'bg-[#121929] text-cyan-300 border-l-2 border-cyan-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="tracking-wide">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono tracking-wider ${
                          item.id === 'alerts'
                            ? 'bg-red-950/80 text-red-300 border border-red-800/80'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Decision Support Compliance Footer */}
      <div className="mt-3 p-2.5 rounded-lg bg-[#0d121f] border border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-1">
        <div className="font-bold text-slate-300 uppercase text-[9px] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>DECISION SUPPORT</span>
          </span>
          <ShieldCheck size={12} className="text-cyan-400" />
        </div>
        <p className="leading-tight text-slate-500 font-sans text-[10px]">
          Coupled limit equilibrium &amp; ML probability. Deterministic ground verification required.
        </p>
      </div>
    </aside>
  );
};
