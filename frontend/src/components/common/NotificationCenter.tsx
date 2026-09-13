import React, { useState } from 'react';
import { Bell, ShieldAlert, AlertTriangle, Info, CheckCircle2, X, Check, ArrowRight } from 'lucide-react';

export interface C2Notification {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  source: string;
  isRead: boolean;
  actionView?: string;
  locationId?: number;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: C2Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToAlert?: (view: string, locationId?: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToAlert,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filterSeverity === 'ALL') return true;
    return n.severity === filterSeverity;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getSeverityBadge = (severity: C2Notification['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px] font-bold border border-red-500/40 flex items-center gap-1">
            <ShieldAlert size={10} />
            <span>CRITICAL</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40 flex items-center gap-1">
            <AlertTriangle size={10} />
            <span>WARNING</span>
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 size={10} />
            <span>SUCCESS</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40 flex items-center gap-1">
            <Info size={10} />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="C2 Notification Center"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[#0B1018] border-l border-[#253042] flex flex-col justify-between shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#253042] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Bell size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white font-sans uppercase tracking-tight">
                  NOTIFICATION CENTER
                </h2>
                <p className="text-[11px] font-mono text-slate-400">
                  {unreadCount} Unread Operational Message{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all border ${
                    filterSeverity === s
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-white/[0.02] text-slate-400 border-transparent hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline decoration-cyan-500/40"
              >
                <Check size={11} />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-slate-500">
              No notifications matching severity "{filterSeverity}".
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkAsRead(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-[#10151F]/60 border-white/[0.05] opacity-75'
                    : item.severity === 'CRITICAL'
                    ? 'bg-[#151B26] border-red-500/30 hover:border-red-500/50 shadow-md'
                    : 'bg-[#10151F] border-[#253042] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(item.severity)}
                    <span className="text-[10px] font-mono text-slate-500">{item.source}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                </div>

                <div className="mt-2">
                  <h3 className="text-xs font-bold text-white font-sans">{item.title}</h3>
                  <p className="text-xs text-slate-300 font-sans mt-0.5 leading-relaxed">{item.message}</p>
                </div>

                {item.actionView && onNavigateToAlert && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToAlert(item.actionView!, item.locationId);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] font-mono font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <span>Jump to Incident</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#253042] bg-[#070B12] text-center text-[10px] font-mono text-slate-500">
          C2 Operational Telemetry Dispatch • All alerts cryptographically signed
        </div>
      </div>
    </div>
  );
};
