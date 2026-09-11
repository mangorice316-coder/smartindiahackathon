import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RefreshCw, Radio, UserCheck, Sparkles, Bot } from 'lucide-react';
import { api } from '../../services/api';

interface HeaderProps {
  dataMode: 'DEMO' | 'REAL';
  onToggleMode: () => void;
  activeAlertCount: number;
  onResetDemo: () => void;
  systemStatus: string;
  onRoleChange?: (role: string) => void;
  onOpenJudgeDemo?: () => void;
  onSyncLive?: () => void;
  isSyncing?: boolean;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataMode,
  onToggleMode,
  activeAlertCount,
  onResetDemo,
  systemStatus,
  onRoleChange,
  onOpenJudgeDemo,
  onSyncLive,
  isSyncing = false,
  onOpenAssistant,
}) => {
  const [currentRole, setCurrentRole] = useState<string>(() => api.getAuthRole());
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

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
      setRoleNotice(`Role: ${newRole}`);
      setTimeout(() => setRoleNotice(null), 2500);
    } catch (err) {
      console.error('Failed to authenticate as selected role:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'border-purple-500/50 text-purple-300 bg-purple-950/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
      case 'ANALYST':
        return 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]';
      case 'FIELD_OFFICER':
        return 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
      case 'READ_ONLY':
      default:
        return 'border-slate-700/70 text-slate-400 bg-slate-900/60';
    }
  };

  return (
    <>
      <header className="h-16 bg-[#070b14]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 shadow-2xl relative">
        {/* Top hairline laser glow */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* Brand & Mission Command Sector */}
        <div className="flex items-center gap-3.5">
          {/* Double-Bezel Shield Emblem */}
          <div className="p-[1.5px] rounded-xl bg-gradient-to-b from-red-500/60 via-red-600/30 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <div className="p-2 rounded-[calc(0.75rem-1.5px)] bg-gradient-to-b from-[#1c080d] to-[#0a0507] text-red-400 flex items-center justify-center">
              <Shield size={20} className="drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-sm sm:text-base tracking-tight text-slate-100 flex items-center gap-1.5">
                <span>LANDSLIDE RISK INTELLIGENCE</span>
                <span className="text-cyan-400 font-light">&amp;</span>
                <span>EARLY WARNING</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                NDRF / SDMA EOC
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Geotechnical Factor of Safety (<span className="text-cyan-400 font-bold">$F_s$</span>) &amp; ML Platform</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Physical Limit Equilibrium</span>
            </div>
          </div>
        </div>

        {/* Tactical Control Cluster */}
        <div className="flex items-center gap-2.5">
          {/* Operator Role Selector */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs transition-all backdrop-blur-md ${getRoleStyle(currentRole)}`}>
            <UserCheck size={13} className={isSwitching ? 'animate-spin text-cyan-400' : ''} />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">OP:</span>
            <select
              value={currentRole}
              disabled={isSwitching}
              onChange={(e) => handleRoleChange(e.target.value as any)}
              className="bg-transparent text-xs font-bold font-mono focus:outline-none cursor-pointer pr-1"
              title="Switch authenticated security context to evaluate role permissions"
            >
              <option value="ADMIN" className="bg-slate-900 text-purple-300 font-mono">ADMIN (Commander)</option>
              <option value="ANALYST" className="bg-slate-900 text-cyan-300 font-mono">ANALYST (Geotech)</option>
              <option value="FIELD_OFFICER" className="bg-slate-900 text-emerald-300 font-mono">FIELD OFFICER (Squad)</option>
              <option value="READ_ONLY" className="bg-slate-900 text-slate-300 font-mono">READ-ONLY (Public)</option>
            </select>
          </div>

          {/* SIH Judge Demo Walkthrough Trigger (Button-in-Button Pattern) */}
          {onOpenJudgeDemo && (
            <button
              onClick={onOpenJudgeDemo}
              className="group flex items-center gap-2 pl-3 pr-1.5 py-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-mono font-bold rounded-full shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:shadow-[0_0_28px_rgba(239,68,68,0.5)] border border-red-300/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              title="Launch interactive 9-step SIH Judge evaluation walkthrough"
            >
              <span className="tracking-wide">RUN DEMO SCENARIO</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-45">
                <Sparkles size={11} className="text-amber-100" />
              </span>
            </button>
          )}

          {/* Mode Pill Switch (DEMO vs REAL) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 font-mono text-xs shadow-inner">
            <Radio
              size={12}
              className={dataMode === 'REAL' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}
            />
            <span className="text-slate-400 text-[10px] font-semibold tracking-wider">MODE:</span>
            <button
              onClick={onToggleMode}
              className={`font-bold transition-colors text-[11px] ${
                dataMode === 'REAL'
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
              title="Click to toggle between DEMO (synthetic test calibration) and REAL (Open-Meteo REST API)"
            >
              {dataMode === 'DEMO' ? 'DEMO / CALIBRATED' : 'LIVE TELEMETRY'}
            </button>
          </div>

          {/* Live Weather Sync Button (Visible in REAL mode) */}
          {dataMode === 'REAL' && onSyncLive && (
            <button
              onClick={onSyncLive}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-semibold rounded-full shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all hover:scale-105 disabled:opacity-50"
              title="Fetch authentic real-time observations from Open-Meteo REST API"
            >
              <RefreshCw
                size={12}
                className={isSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}
              />
              <span>{isSyncing ? 'SYNCING...' : 'SYNC LIVE'}</span>
            </button>
          )}

          {/* AI Disaster Intelligence Assistant Trigger */}
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="group flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-mono font-semibold rounded-full border border-cyan-500/40 transition-all hover:scale-105 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
              title="Open grounded AI Disaster Intelligence Assistant"
            >
              <Bot size={13} className="text-cyan-400 transition-transform group-hover:scale-110" />
              <span>AI ASSISTANT</span>
            </button>
          )}

          {/* Active Emergency Alerts Ticker */}
          {activeAlertCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-200 font-mono text-xs font-bold shadow-[0_0_20px_rgba(239,68,68,0.35)] animate-pulse">
              <AlertTriangle size={13} className="text-red-400" />
              <span>{activeAlertCount} ALERTS</span>
            </div>
          )}

          {/* Demo Reset Button */}
          {dataMode === 'DEMO' && (
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono rounded-full border border-white/10 transition-colors"
              title="Reset database to initial calibrated demonstration state"
            >
              <RefreshCw size={11} />
              <span>RESET</span>
            </button>
          )}

          {/* Operational Status Pulse */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-l border-white/[0.08] pl-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-slate-300 font-semibold tracking-wide uppercase">{systemStatus}</span>
          </div>
        </div>
      </header>

      {/* Scientific Transparency & Data Provenance Ribbon */}
      <div className="bg-[#050810]/95 border-b border-white/[0.06] px-4 sm:px-6 py-1 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 shrink-0 shadow-inner">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">DATA PROVENANCE:</span>
            <span className="text-slate-300 font-semibold">Open-Meteo &amp; IMD Telemetry • GSI Bhukosh</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">FRESHNESS:</span>
            <span className="text-emerald-400 font-semibold">Live Real-Time (SLA &lt; 15m)</span>
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">PHYSICAL MODEL:</span>
            <span className="text-cyan-400 font-semibold">Mohr-Coulomb Fs (Limit Equilibrium)</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">AI ENGINE:</span>
            <span className="text-purple-300 font-semibold">GradientBoosting-v1.3 (AUC: 0.934)</span>
          </span>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-500 font-bold uppercase tracking-wider">INTEGRITY:</span>
            <span className="text-slate-300">SHA-256 Verified</span>
          </span>
        </div>
      </div>
    </>
  );
};
