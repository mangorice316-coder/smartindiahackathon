import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Radio, UserCheck, Play, Bot, AlertTriangle, Satellite, Compass, AlertCircle, Palette, Layers } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({
  activeAlertCount,
  systemStatus,
  onRoleChange,
  onSyncLive,
  isSyncing = false,
  onOpenAssistant,
  onOpenStitch,
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
    <header className="h-15 bg-[#06080e]/90 backdrop-blur-2xl border-b border-white/[0.07] flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 shadow-lg relative">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.2)]">
          <Activity size={16} />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-display font-bold text-sm tracking-[0.08em] text-white">
            LRIDS
          </span>
          <span className="text-white/20">/</span>
          <span className="font-sans font-medium text-xs text-slate-300 hidden md:inline tracking-tight">
            Landslide Risk Intelligence System
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE C2
          </span>
        </div>
      </div>

      {/* Center Operational Incident Banner & Telemetry Strip */}
      <div className="hidden xl:flex items-center gap-3">
        {/* Active Incident Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="font-bold text-white tracking-wide text-[11px]">INCIDENT: WAYANAD MONSOON SURGE</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">CRITICAL</span>
        </div>

        {/* Compact Telemetry Badges */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[10px] font-mono text-slate-300">
          <span className="flex items-center gap-1 text-emerald-400" title="Open-Meteo REST Weather Stream">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Rain: LIVE
          </span>
          <span className="text-white/20">•</span>
          <span className="text-purple-300" title="Sentinel-1 SAR / Sentinel-2 MSI Multi-Spectral pass today">
            Satellite: READY
          </span>
          <span className="text-white/20">•</span>
          <span className="text-cyan-300" title="In-situ piezometer, tiltmeter, and acoustic emission sensor nodes">
            Sensors: 8/8
          </span>
          <span className="text-white/20">•</span>
          <span className="text-amber-300" title="12 Arterial Lifeline road and bridge corridors monitored">
            Roads: 12
          </span>
        </div>
      </div>

      {/* Right Command Actions Dock */}
      <div className="flex items-center gap-2">
        {/* 1-Click Guided Scenario Button (Judge Evaluation Tour) */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('start-disaster-scenario'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400/60 text-xs font-mono font-bold transition-all shadow-[0_0_16px_rgba(245,158,11,0.2)] active:scale-95"
          title="Run 12-Step Guided Disaster Demonstration Scenario for Hackathon Judges"
        >
          <Play size={11} className="text-amber-400 fill-amber-400" />
          <span className="hidden sm:inline">Scenario Tour</span>
        </button>

        {/* Data Hierarchy & Decoupled Pipeline Modal Button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-data-hierarchy-modal'))}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/10 hover:from-blue-500/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400/60 text-xs font-mono font-bold transition-all shadow-[0_0_16px_rgba(6,182,212,0.2)] active:scale-95"
          title="Open Authoritative 5-Tier Data Hierarchy & Pipeline Lineage Modal (GSI NLFC, ISRO NRSC Atlas, IMD, Sentinel-1/2, OSM ODbL 1.0)"
        >
          <Layers size={12} className="text-cyan-400" />
          <span className="hidden lg:inline">Hierarchy & Lineage</span>
          <span className="px-1.5 py-0.2 text-[9px] rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-mono">v2.1</span>
        </button>

        {/* Quick Geospatial & Intelligence Tool Island */}
        <div className="hidden md:flex items-center rounded-xl bg-white/[0.03] border border-white/[0.08] p-0.5 shadow-sm">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-live-gps-modal'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/[0.06] text-slate-300 hover:text-cyan-300 text-xs font-mono rounded-lg transition-all"
            title="Inspect real-time weather and run landslide model on ANY GPS coordinates"
          >
            <Compass size={12} className="text-cyan-400" />
            <span>GPS</span>
          </button>
          <span className="w-[1px] h-3.5 bg-white/[0.08]" />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-satellite-modal'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/[0.06] text-slate-300 hover:text-purple-300 text-xs font-mono rounded-lg transition-all"
            title="Open Sentinel-1/2 Satellite Change Detection"
          >
            <Satellite size={12} className="text-purple-400" />
            <span>Satellite</span>
          </button>
          <span className="w-[1px] h-3.5 bg-white/[0.08]" />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-road-modal'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/[0.06] text-slate-300 hover:text-amber-300 text-xs font-mono rounded-lg transition-all"
            title="Open Road & Arterial Lifeline Vulnerability Assessment"
          >
            <Radio size={12} className="text-amber-400" />
            <span>Roads</span>
          </button>
          <span className="w-[1px] h-3.5 bg-white/[0.08]" />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-incident-modal'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/[0.06] text-slate-300 hover:text-emerald-300 text-xs font-mono rounded-lg transition-all"
            title="Record Citizen / Field Patrol Ground Crack Tension Fissure"
          >
            <AlertCircle size={12} className="text-emerald-400" />
            <span>Crack</span>
          </button>
        </div>

        {/* Live Weather Sync Button */}
        {onSyncLive && (
          <button
            onClick={onSyncLive}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-medium transition-all shadow-[0_0_12px_rgba(16,185,129,0.1)] disabled:opacity-50"
            title="Ingest real-time Open-Meteo weather and recalculate risk"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        )}

        {/* AI Assistant Button */}
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-cyan-300 text-xs font-mono font-medium border border-cyan-500/30 hover:border-cyan-400/50 transition-all shadow-[0_0_12px_rgba(6,182,212,0.1)]"
            title="Open grounded AI Disaster Intelligence Assistant"
          >
            <Bot size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}

        {/* Google Stitch Studio Button */}
        {onOpenStitch && (
          <button
            onClick={onOpenStitch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 text-xs font-mono font-medium border border-purple-500/30 hover:border-purple-400/50 transition-all shadow-[0_0_12px_rgba(168,85,247,0.15)]"
            title="Open Google Stitch AI Studio Bridge for Next-Gen UI Generation"
          >
            <Palette size={13} className="text-purple-400" />
            <span className="hidden sm:inline">Stitch Studio</span>
          </button>
        )}

        {/* Active Alert Capsule */}
        {activeAlertCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-mono text-xs font-semibold shadow-[0_0_16px_rgba(239,68,68,0.25)]">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>{activeAlertCount} Alerts</span>
          </div>
        )}

        {/* Operator Role Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-slate-300 hover:border-white/[0.15] transition-all">
          <UserCheck size={12} className="text-slate-400" />
          <select
            value={currentRole}
            disabled={isSwitching}
            onChange={(e) => handleRoleChange(e.target.value as any)}
            className="bg-transparent font-medium cursor-pointer focus:outline-none pr-0.5 text-xs text-slate-200"
            title="Switch operator role to evaluate RBAC endpoints"
          >
            <option value="ADMIN" className="bg-[#0b0f19] text-white">Admin</option>
            <option value="ANALYST" className="bg-[#0b0f19] text-white">Analyst</option>
            <option value="FIELD_OFFICER" className="bg-[#0b0f19] text-white">Field Officer</option>
            <option value="READ_ONLY" className="bg-[#0b0f19] text-white">Public</option>
          </select>
        </div>
      </div>
    </header>
  );
};
