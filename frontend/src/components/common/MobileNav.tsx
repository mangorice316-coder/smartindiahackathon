import React from 'react';
import { LayoutDashboard, Map, AlertTriangle, ClipboardList, Menu } from 'lucide-react';
import { NavView } from '../shell/Sidebar';

interface MobileNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onToggleSidebar: () => void;
  alertBadgeCount?: number;
  inspectionBadgeCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onSelectView,
  onToggleSidebar,
  alertBadgeCount = 0,
  inspectionBadgeCount = 0,
}) => {
  const navItems: Array<{ id: NavView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'map', label: 'Risk Map', icon: <Map size={18} /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={18} />, badge: alertBadgeCount },
    { id: 'inspections', label: 'Field', icon: <ClipboardList size={18} />, badge: inspectionBadgeCount },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070B12]/95 backdrop-blur-xl border-t border-[#253042] px-3 py-2 flex items-center justify-around shadow-2xl"
    >
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectView(item.id)}
            className={`flex flex-col items-center justify-center relative p-1.5 transition-all ${
              isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono bg-red-500 text-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}

      {/* More / Menu Drawer button */}
      <button
        onClick={onToggleSidebar}
        className="flex flex-col items-center justify-center p-1.5 text-slate-400 hover:text-white transition-all"
      >
        <Menu size={18} />
        <span className="text-[10px] font-mono mt-1 font-medium">Menu</span>
      </button>
    </nav>
  );
};
