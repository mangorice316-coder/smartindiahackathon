import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Radio, UserCheck, Play, Bot, AlertTriangle, Satellite, Compass, AlertCircle } from 'lucide-react';
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
    <header className="h-14 bg-[#0a0e17] border-b border-slate-800/90 flex items-center justify-between px-4 sm:px-5 z-30 shrink-0">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-sm">
          <Activity size={18} />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm tracking-tight text-white">
            LRIDS
          </span>
          <span className="text-slate-600">/</span>
          <span className="font-sans font-medium text-xs text-slate-300 hidden sm:inline">
            Landslide Risk Intelligence &amp; Early Warning
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            EOC ACTIVE
          </span>
        </div>
      </div>

      {/* Center Segmented Mode Controller */}
      <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
        <button
          onClick={() => dataMode !== 'DEMO' && onToggleMode()}
          className={`px-3 py-1 rounded-md transition-all ${
            dataMode === 'DEMO'
              ? 'bg-slate-800 text-amber-300 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Calibrated Wayanad 2024 ground truth baseline dataset"
        >
          Calibrated Demo
        </button>
        <button
          onClick={() => dataMode !== 'REAL' && onToggleMode()}
          className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
            dataMode === 'REAL'
              ? 'bg-emerald-950/80 text-emerald-300 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Live meteorological observations from Open-Meteo REST API"
        >
          <Radio size={11} className={dataMode === 'REAL' ? 'text-emerald-400 animate-pulse' : ''} />
          <span>Live Telemetry</span>
        </button>
      </div>

      {/* Right Command Actions */}
      <div className="flex items-center gap-2">
        {/* Live Weather Sync (Only in REAL mode) */}
        {dataMode === 'REAL' && onSyncLive && (
          <button
            onClick={onSyncLive}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-mono rounded-lg transition-colors disabled:opacity-50"
            title="Ingest real-time Open-Meteo weather and recalculate risk"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        )}

        {/* SIH Judge Demo Walkthrough Button */}
        {onOpenJudgeDemo && (
          <button
            onClick={onOpenJudgeDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            title="Launch interactive 9-step evaluation walkthrough"
          >
            <Play size={12} fill="currentColor" />
            <span>Run Demo Tour</span>
          </button>
        )}

        {/* AI Assistant Button */}
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono rounded-lg border border-slate-700 transition-colors"
            title="Open grounded AI Disaster Intelligence Assistant"
          >
            <Bot size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}

        {/* Quick Decision & Remote Sensing Tools */}
        <div className="hidden xl:flex items-center gap-1.5 pl-1.5 border-l border-slate-800/80">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-satellite-modal'))}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 hover:border-purple-700/60 text-xs font-mono rounded-lg transition-colors"
            title="Open Sentinel-1/2 Satellite Change Detection (Feature 11)"
          >
            <Satellite size={12} className="text-purple-400" />
            <span>Satellite AI</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-road-modal'))}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-700/60 text-xs font-mono rounded-lg transition-colors"
            title="Open Road & Arterial Lifeline Vulnerability Assessment (Feature 13)"
          >
            <Compass size={12} className="text-amber-400" />
            <span>Road Risk</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-incident-modal'))}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 hover:border-emerald-700/60 text-xs font-mono rounded-lg transition-colors"
            title="Record Citizen / Field Patrol Ground Crack Tension Fissure (Feature 15)"
          >
            <AlertCircle size={12} className="text-emerald-400" />
            <span>Report Crack</span>
          </button>
        </div>

        {/* Active Alert Ticker */}
        {activeAlertCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/70 border border-red-600/60 text-red-300 font-mono text-xs font-semibold">
            <AlertTriangle size={13} />
            <span>{activeAlertCount} Alerts</span>
          </div>
        )}

        {/* Operator Role Selector */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <UserCheck size={12} className="text-slate-400" />
          <select
            value={currentRole}
            disabled={isSwitching}
            onChange={(e) => handleRoleChange(e.target.value as any)}
            className="bg-transparent font-medium cursor-pointer focus:outline-none pr-0.5 text-xs text-slate-300"
            title="Switch operator role to evaluate RBAC endpoints"
          >
            <option value="ADMIN" className="bg-slate-900">Admin</option>
            <option value="ANALYST" className="bg-slate-900">Analyst</option>
            <option value="FIELD_OFFICER" className="bg-slate-900">Field Officer</option>
            <option value="READ_ONLY" className="bg-slate-900">Public</option>
          </select>
        </div>
      </div>
    </header>
  );
};
