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
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(37,199,232,0.2)]">
          <Activity size={16} />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm tracking-[0.08em] text-white">
            LRIDS
          </span>
          <span className="text-white/20">/</span>
          <span className="font-sans font-medium text-xs text-slate-300 hidden md:inline tracking-tight">
            Disaster Risk Intelligence C2
          </span>
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

      {/* Center Operational Incident Banner & Telemetry Strip */}
      <div className="hidden xl:flex items-center gap-2.5">
        {/* Active Incident Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-300 shadow-[0_0_12px_rgba(255,59,77,0.15)]">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(255,59,77,0.8)]" />
          <span className="font-bold text-white tracking-wide text-[11px]">INCIDENT: WAYANAD DELUGE</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">CRITICAL</span>
        </div>

        {/* Compact Telemetry Badges */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[10px] font-mono text-slate-300">
          <span className="flex items-center gap-1 text-emerald-400" title="Open-Meteo REST Weather Stream">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Rain: LIVE
          </span>
          <span className="text-white/20">•</span>
          <span className="text-purple-300" title="Sentinel-1 SAR Radar pass">
            SAR: READY
          </span>
          <span className="text-white/20">•</span>
          <span className="text-cyan-300" title="In-situ piezometer sensor mesh">
            Sensors: 8/8
          </span>
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
            <option value="ADMIN">CMD: Admin</option>
            <option value="ANALYST">ANL: Geologist</option>
            <option value="FIELD_OFFICER">FLD: Inspection</option>
            <option value="READ_ONLY">OBS: Read Only</option>
          </select>
        </div>
      </div>
    </header>
  );
};
