import React from 'react';
import { ShieldCheck, AlertTriangle, WifiOff, RefreshCw, Database, Layers, Radio, CheckCircle2 } from 'lucide-react';

export type SystemStatusLevel = 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'ERROR';

interface StatusBannerProps {
  statusLevel: SystemStatusLevel;
  isOffline: boolean;
  lastSyncTime?: Date;
  onReconnect?: () => void;
  queuedActionsCount?: number;
  catchmentsCount?: number;
  scarsCount?: number;
  lifelinesCount?: number;
  directivesCount?: number;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  statusLevel,
  isOffline,
  lastSyncTime = new Date(),
  onReconnect,
  queuedActionsCount = 0,
  catchmentsCount = 12,
  scarsCount = 29,
  lifelinesCount = 18,
  directivesCount = 6,
}) => {
  // If online and fully healthy with no issues, display compact mission-readiness bar
  const isHealthy = !isOffline && (statusLevel === 'SUCCESS' || statusLevel === 'CRITICAL');

  const formatTime = (date: Date) => {
    return `${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} IST`;
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-300 font-mono text-xs shadow-md ${
        isOffline
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-[0_4px_20px_rgba(242,184,75,0.12)]'
          : statusLevel === 'CRITICAL'
          ? 'bg-red-950/30 border-red-500/30 text-red-200'
          : 'bg-[#10151F]/90 border-[#253042] text-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Status Indicator */}
        <div className="flex items-center gap-2.5">
          {isOffline ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider border border-amber-500/30">
                ● OFFLINE
              </span>
              <strong className="text-white tracking-wide text-xs">RESILIENT OFFLINE MODE:</strong>
              <span className="text-amber-300 text-xs hidden sm:inline">Western Ghats &amp; Himalayan Geopackage Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider border border-emerald-500/30">
                ● LIVE
              </span>
              <span className="font-semibold text-white tracking-wide text-xs">BHARAT C2 OPERATIONS (NDMA &amp; GSI):</span>
              <span className="text-emerald-400 text-xs hidden sm:inline">IMD AWS • ISRO Bhuvan InSAR • GSI NLSM Telemetry Synced</span>
            </div>
          )}

          {queuedActionsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
              {queuedActionsCount} Action{queuedActionsCount > 1 ? 's' : ''} Queued
            </span>
          )}
        </div>

        {/* Right Controls & Telemetry Counts */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px] hidden md:inline">
            Last Sync: {formatTime(lastSyncTime)}
          </span>

          {isOffline && onReconnect && (
            <button
              onClick={onReconnect}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw size={11} className="animate-spin-slow" />
              <span>Reconnect</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 pl-2 border-l border-white/[0.08]">
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-amber-300 font-bold">
              {catchmentsCount} Catchments
            </span>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-purple-300 font-bold">
              {scarsCount} Scars
            </span>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-cyan-300 font-bold">
              {lifelinesCount} Lifelines
            </span>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-emerald-300 font-bold">
              {directivesCount} Directives
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
