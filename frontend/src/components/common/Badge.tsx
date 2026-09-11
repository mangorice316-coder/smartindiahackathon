import React from 'react';
import { RiskCategory, AlertSeverity, UrgencyTier, AlertStatus, AlertPriority } from '../../types';

const RISK_SYMBOLS: Record<RiskCategory, string> = {
  CRITICAL: '▲!',
  HIGH: '▲',
  MODERATE: '■',
  LOW: '●'
};

export const RiskBadge: React.FC<{ category: RiskCategory; score?: number; size?: 'sm' | 'md' }> = ({
  category,
  score,
  size = 'md'
}) => {
  const styles: Record<RiskCategory, { outer: string; dot: string; text: string }> = {
    LOW: {
      outer: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      dot: 'bg-emerald-400',
      text: 'text-emerald-300',
    },
    MODERATE: {
      outer: 'bg-amber-950/70 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
    },
    HIGH: {
      outer: 'bg-orange-950/70 border-orange-500/50 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
      dot: 'bg-orange-400 animate-pulse',
      text: 'text-orange-300',
    },
    CRITICAL: {
      outer: 'bg-red-950/80 border-red-500/60 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      dot: 'bg-red-400 animate-ping',
      text: 'text-red-200',
    },
  };

  const current = styles[category] || styles.LOW;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded-full border backdrop-blur-md transition-transform hover:scale-105 ${current.outer} ${padding}`}
      title={`Risk Category: ${category}${score !== undefined ? ` (Score: ${score.toFixed(0)})` : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span className="font-bold tracking-wider">{category}</span>
      {score !== undefined && <span className="opacity-80 font-normal">[{score.toFixed(0)}]</span>}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  const styles: Record<AlertSeverity, { outer: string; dot: string; text: string }> = {
    ADVISORY: {
      outer: 'bg-amber-950/60 border-amber-600/40 text-amber-300',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
    },
    WATCH: {
      outer: 'bg-orange-950/70 border-orange-500/50 text-orange-300',
      dot: 'bg-orange-400',
      text: 'text-orange-300',
    },
    WARNING: {
      outer: 'bg-red-950/70 border-red-500/60 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
      dot: 'bg-red-400 animate-pulse',
      text: 'text-red-300',
    },
    EVACUATION: {
      outer: 'bg-gradient-to-r from-red-600 to-rose-700 border-red-400 text-white font-black shadow-[0_0_20px_rgba(239,68,68,0.4)]',
      dot: 'bg-white animate-ping',
      text: 'text-white',
    },
  };

  const current = styles[severity] || styles.ADVISORY;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border backdrop-blur-md ${current.outer}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{severity}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority?: AlertPriority | string }> = ({ priority = 'MEDIUM' }) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  const styles: Record<string, { outer: string; dot: string }> = {
    CRITICAL: { outer: 'bg-red-950/80 border-red-500/60 text-red-300 shadow-sm', dot: 'bg-red-400 animate-ping' },
    HIGH: { outer: 'bg-orange-950/70 border-orange-500/50 text-orange-300', dot: 'bg-orange-400' },
    MEDIUM: { outer: 'bg-amber-950/60 border-amber-500/40 text-amber-300', dot: 'bg-amber-400' },
    LOW: { outer: 'bg-slate-900 border-slate-700 text-slate-300', dot: 'bg-slate-400' },
  };
  const current = styles[p] || styles.MEDIUM;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${current.outer}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      OP: {p}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: AlertStatus | string }> = ({ status }) => {
  const s = (status || '').toUpperCase();
  const isResolved = s === 'RESOLVED' || s === 'CLEARED' || s === 'CLOSED';
  const isProgress = s === 'ACKNOWLEDGED' || s === 'ASSIGNED' || s === 'UNDER_INSPECTION' || s === 'DISPATCHED' || s === 'INSPECTED';
  const isGenerated = s === 'GENERATED' || s === 'ACTIVE' || s === 'PENDING';

  let style = 'bg-slate-900 text-slate-400 border-slate-700';
  let dot = 'bg-slate-500';
  if (isGenerated) {
    style = 'bg-red-950/70 text-red-300 border-red-500/50';
    dot = 'bg-red-400 animate-pulse';
  } else if (isProgress) {
    style = 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50';
    dot = 'bg-cyan-400';
  } else if (isResolved) {
    style = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50';
    dot = 'bg-emerald-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase border font-semibold ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {s.replace('_', ' ')}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ tier: UrgencyTier; score?: number }> = ({ tier, score }) => {
  const labels: Record<UrgencyTier, { outer: string; dot: string; text: string }> = {
    P1_IMMEDIATE: { outer: 'bg-red-950/80 text-red-200 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]', dot: 'bg-red-400 animate-ping', text: 'P1 IMMEDIATE' },
    P2_HIGH: { outer: 'bg-orange-950/70 text-orange-200 border-orange-500/50', dot: 'bg-orange-400', text: 'P2 HIGH' },
    P3_MEDIUM: { outer: 'bg-amber-950/60 text-amber-200 border-amber-500/40', dot: 'bg-amber-400', text: 'P3 MEDIUM' },
    P4_LOW: { outer: 'bg-slate-900 text-slate-300 border-slate-700', dot: 'bg-slate-400', text: 'P4 LOW' },
  };
  const current = labels[tier] || labels.P4_LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${current.outer}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.text}
      {score !== undefined && <span className="opacity-80">[{score}]</span>}
    </span>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'caution' | 'danger' | 'neutral' | 'info';
  size?: 'sm' | 'md';
}> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const styles: Record<string, string> = {
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
    warning: 'bg-orange-950/60 text-orange-300 border-orange-500/40',
    caution: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
    danger: 'bg-red-950/70 text-red-300 border-red-500/50',
    info: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
    neutral: 'bg-slate-900 border-slate-700/80 text-slate-300',
  };
  const pad = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded-full border backdrop-blur-md ${styles[variant] || styles.neutral} ${pad}`}>
      {children}
    </span>
  );
};

