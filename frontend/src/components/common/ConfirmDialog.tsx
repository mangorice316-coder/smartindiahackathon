import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X, Lock } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (authNote?: string) => void;
  title: string;
  description: string;
  target: string;
  affectedCount?: number;
  urgency?: string;
  actionLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  target,
  affectedCount,
  urgency = 'P1_IMMEDIATE',
  actionLabel = 'Authorize & Execute Directive',
  isDestructive = true,
}) => {
  const [authNote, setAuthNote] = useState<string>('');
  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(authNote);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="c2-card max-w-lg w-full rounded-2xl border-[#253042] p-6 space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header with Warning Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,59,77,0.25)]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px] font-bold border border-red-500/40">
                {urgency} DIRECTIVE
              </span>
              <span className="text-[10px] font-mono text-slate-400">REQUIRES OPERATIONAL AUDIT</span>
            </div>
            <h2 id="confirm-dialog-title" className="text-base font-bold text-white mt-1 font-sans">
              {title}
            </h2>
          </div>
        </div>

        {/* Operational Context Box */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.07] space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>TARGET SECTOR:</span>
            <strong className="text-white">{target}</strong>
          </div>
          {affectedCount !== undefined && affectedCount > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>AFFECTED RESIDENTS:</span>
              <strong className="text-red-300">{affectedCount.toLocaleString()} Citizens</strong>
            </div>
          )}
          <div className="text-slate-300 pt-1 border-t border-white/[0.06] text-[11px] leading-relaxed">
            {description}
          </div>
        </div>

        {/* Operational Acknowledgement Checkbox */}
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 font-sans select-none">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 text-red-500 focus:ring-red-400 bg-[#0B1018]"
            />
            <span>
              I confirm authorization as Incident Commander under National Disaster Management Authority (NDMA) protocol. This action will generate an immutable audit log entry.
            </span>
          </label>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              OPERATIONAL RATIONALE / DISPATCH ORDER NOTES (OPTIONAL)
            </label>
            <input
              type="text"
              value={authNote}
              onChange={(e) => setAuthNote(e.target.value)}
              placeholder="e.g., Fs dropped to 0.88; verified by in-situ piezometer P-04"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-[#253042] text-xs font-mono text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#253042]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-[#253042] text-xs font-mono font-semibold transition-all"
          >
            Cancel / Abort
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasAcknowledged}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
              hasAcknowledged
                ? isDestructive
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_16px_rgba(255,59,77,0.3)] active:scale-95'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Lock size={12} />
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
