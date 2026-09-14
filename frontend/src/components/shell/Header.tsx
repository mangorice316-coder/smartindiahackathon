import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Radio,
  UserCheck,
  Play,
  Bot,
  AlertTriangle,
  Satellite,
  Compass,
  AlertCircle,
  Palette,
  Layers,
  Search,
  Bell,
  SlidersHorizontal,
  FileDown
} from 'lucide-react';
import { api } from '../../services/api';

interface HeaderProps {
  dataMode?: 'DEMO' | 'REAL';
  onToggleMode?: () => void;
  activeAlertCount: number;
  systemStatus: string;
  onRoleChange?: (role: string) => void;
  onSyncLive?: () => void;
  isSyncing?: boolean;
  onOpenAssistant?: () => void;
  onOpenStitch?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onOpenFilterPanel?: () => void;
  isOffline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeAlertCount,
  systemStatus,
  onRoleChange,
  onSyncLive,
  isSyncing = false,
  onOpenAssistant,
  onOpenStitch,
  onOpenCommandPalette,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenFilterPanel,
  isOffline = false,
}) => {
  const [currentRole, setCurrentRole] = useState<string>(() => api.getAuthRole());
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  useEffect(() => {
    if (!api.getAuthToken()) {
      api.switchRole(currentRole as any).catch((err) => console.warn('Initial session auth notice:', err));
    }
  }, []);

  const handleRoleChange = async (newRole: 'ADMIN' | 'ANALYST' | 'FIELD_OFFICER' | 'READ_ONLY') => {
    setIsSwitching(true);
    try {
      await api.switchRole(newRole);
      setCurrentRole(newRole);
      if (onRoleChange) onRoleChange(newRole);
    } catch (err) {
      console.error('Failed to authenticate as selected role:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="h-14 bg-[#070B12]/95 backdrop-blur-2xl border-b border-[#253042] flex items-center justify-between px-3 sm:px-6 z-30 shrink-0 shadow-lg relative">
      {/* Brand & Sovereign System Title */}
      <div className="flex items-center gap-3">
        {/* Tricolor Emblem Crest */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF9933]/20 via-white/10 to-[#138808]/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_18px_rgba(255,153,51,0.25)] relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FF9933]/15 via-transparent to-[#138808]/15" />
          <Activity size={16} className="text-amber-400 relative z-10 animate-pulse" />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm tracking-[0.08em] text-white">
                BHU-SURAKSHA
              </span>
              <span className="text-[11px] font-bold text-amber-400 font-sans tracking-wide">
                भू-सुरक्षा
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 hidden sm:block tracking-tight">
              Govt. of India • NDMA & GSI Nodal C2
            </span>
          </div>
          {isOffline ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              OFFLINE GEOPACKAGE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE C2
            </span>
          )}
        </div>
      </div>

      {/* Center Operational Incident Banner & Indian Nodal Telemetry Strip */}
      <div className="hidden xl:flex items-center gap-2.5">
        {/* Active Incident Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-300 shadow-[0_0_12px_rgba(255,59,77,0.15)]">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(255,59,77,0.8)]" />
          <span className="font-bold text-white tracking-wide text-[11px]">INCIDENT: WAYANAD CLOUDBURST</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">CRITICAL</span>
        </div>

        {/* Compact Indian Telemetry Badges */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[10px] font-mono text-slate-300">
          <span className="flex items-center gap-1 text-emerald-400" title="India Meteorological Department Radar">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> IMD Radar: LIVE
          </span>
          <span className="text-white/20">•</span>
          <span className="text-purple-300" title="ISRO NRSC Bhuvan & Cartosat-3 InSAR Stream">
            ISRO Bhuvan: SYNC
          </span>
          <span className="text-white/20">•</span>
          <span className="text-cyan-300" title="GSI National Landslide Susceptibility Mapping & Sensors">
            GSI NLSM: 1:10K
          </span>
        </div>

        {/* 24x7 Emergency Helplines Strip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-red-500/15 via-orange-500/10 to-transparent border border-red-500/30 text-[10px] font-mono font-bold text-red-300">
          <Radio size={11} className="text-red-400 animate-pulse" />
          <span className="text-slate-400">EMERGENCY:</span>
          <span className="text-white px-1.5 py-0.2 rounded bg-red-500/20 border border-red-500/40" title="National Emergency Response Support System">112</span>
          <span className="text-slate-400">/</span>
          <span className="text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40" title="NDMA National Control Room">1078</span>
        </div>
      </div>

      {/* Right Command Actions Dock */}
      <div className="flex items-center gap-2">
        {/* Global Search / Command Palette Shortcut */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white border border-[#253042] text-xs font-mono transition-all"
            title="Search C2 Platform (Ctrl+K or /)"
          >
            <Search size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline px-1.5 py-0.2 rounded bg-white/[0.08] text-[9px] font-mono text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Filter Drawer Trigger */}
        {onOpenFilterPanel && (
          <button
            onClick={onOpenFilterPanel}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-[#253042] text-xs font-mono transition-all flex items-center gap-1"
            title="Open Multi-Parameter Data Filters"
          >
            <SlidersHorizontal size={13} className="text-slate-400" />
            <span className="hidden lg:inline">Filters</span>
          </button>
        )}

        {/* Notification Bell */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-[#253042] text-xs font-mono transition-all flex items-center gap-1"
            title="View Operational Notifications"
          >
            <Bell size={13} className="text-amber-400" />
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500 text-white shadow-sm">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* 1-Click Guided Scenario Button (Judge Evaluation Tour) */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('start-disaster-scenario'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400/60 text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
          title="Run 12-Step Guided Disaster Demonstration Scenario for Hackathon Judges"
        >
          <Play size={11} className="text-amber-400 fill-amber-400" />
          <span className="hidden sm:inline">Scenario Tour</span>
        </button>

        {/* Data Hierarchy & Decoupled Pipeline Modal Button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-data-hierarchy-modal'))}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/10 hover:from-blue-500/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all active:scale-95"
          title="Open Authoritative 5-Tier Data Hierarchy Modal"
        >
          <Layers size={12} className="text-cyan-400" />
          <span>Hierarchy v2.1</span>
        </button>

        {/* Grounded AI Assistant Drawer Button */}
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold transition-all active:scale-95"
            title="Open Grounded AI Disaster Intelligence Assistant"
          >
            <Bot size={13} className="text-purple-400" />
            <span className="hidden md:inline">AI Assistant</span>
          </button>
        )}

        {/* Role Switcher */}
        <div className="relative">
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value as any)}
            disabled={isSwitching}
            className="px-2.5 py-1.5 rounded-xl bg-[#10151F] border border-[#253042] text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            title="Switch Operator Role & Permissions"
          >
            <option value="ADMIN">NDMA Commander (NEOC)</option>
            <option value="ANALYST">GSI Nodal Geologist</option>
            <option value="FIELD_OFFICER">DEOC Collector / NDRF</option>
            <option value="READ_ONLY">Aapda Mitra Observer</option>
          </select>
        </div>
      </div>
    </header>
  );
};
