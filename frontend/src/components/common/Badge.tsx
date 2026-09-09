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
  const styles: Record<RiskCategory, { bg: string; text: string; border: string }> = {
    LOW: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-600/50' },
    MODERATE: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-600/50' },
    HIGH: { bg: 'bg-orange-950/60', text: 'text-orange-400', border: 'border-orange-600/50' },
    CRITICAL: { bg: 'bg-red-950/70', text: 'text-red-400', border: 'border-red-600/60' },
  };

  const current = styles[category] || styles.LOW;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded border ${current.bg} ${current.text} ${current.border} ${padding}`}
      title={`Risk Category: ${category}${score !== undefined ? ` (Score: ${score.toFixed(0)})` : ''}`}
    >
      <span className="font-bold text-[10px] opacity-90">{RISK_SYMBOLS[category] || '●'}</span>
      <span>{category}</span>
      {score !== undefined && <span className="opacity-80 font-normal">({score.toFixed(0)})</span>}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  const styles: Record<AlertSeverity, { bg: string; text: string; border: string; symbol: string }> = {
    ADVISORY: { bg: 'bg-amber-950/50', text: 'text-amber-300', border: 'border-amber-700/50', symbol: '●' },
    WATCH: { bg: 'bg-orange-950/60', text: 'text-orange-300', border: 'border-orange-600/50', symbol: '■' },
    WARNING: { bg: 'bg-red-950/60', text: 'text-red-300', border: 'border-red-600/60', symbol: '▲' },
    EVACUATION: { bg: 'bg-red-900/80', text: 'text-red-200', border: 'border-red-500', symbol: '▲!' },
  };

  const current = styles[severity] || styles.ADVISORY;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border ${current.bg} ${current.text} ${current.border}`}>
      <span className="text-[10px] opacity-90">{current.symbol}</span>
      <span>{severity}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority?: AlertPriority | string }> = ({ priority = 'MEDIUM' }) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-red-950/80', text: 'text-red-300', border: 'border-red-600' },
    HIGH: { bg: 'bg-orange-950/70', text: 'text-orange-300', border: 'border-orange-600/70' },
    MEDIUM: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-600/60' },
    LOW: { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700' },
  };
  const current = styles[p] || styles.MEDIUM;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${current.bg} ${current.text} ${current.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${p === 'CRITICAL' ? 'bg-red-400 animate-ping' : current.text.replace('text-', 'bg-')}`} />
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
  if (isGenerated) {
    style = 'bg-red-950/60 text-red-300 border-red-700/60';
  } else if (isProgress) {
    style = 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${style}`}
    >
      {s.replace('_', ' ')}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ tier: UrgencyTier; score?: number }> = ({ tier, score }) => {
  const labels: Record<UrgencyTier, { text: string; color: string }> = {
    P1_IMMEDIATE: { text: 'P1 IMMEDIATE', color: 'bg-red-950/70 text-red-300 border-red-600' },
    P2_HIGH: { text: 'P2 HIGH', color: 'bg-orange-950/60 text-orange-300 border-orange-600' },
    P3_MEDIUM: { text: 'P3 MEDIUM', color: 'bg-amber-950/60 text-amber-300 border-amber-600' },
    P4_LOW: { text: 'P4 LOW', color: 'bg-slate-900 text-slate-300 border-slate-700' },
  };
  const current = labels[tier] || labels.P4_LOW;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold border ${current.color}`}>
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
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-600/50',
    warning: 'bg-orange-950/60 text-orange-400 border-orange-600/50',
    caution: 'bg-amber-950/60 text-amber-400 border-amber-600/50',
    danger: 'bg-red-950/70 text-red-400 border-red-600/60',
    info: 'bg-cyan-950/60 text-cyan-400 border-cyan-600/50',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700',
  };
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded border ${styles[variant] || styles.neutral} ${pad}`}>
      {children}
    </span>
  );
};

