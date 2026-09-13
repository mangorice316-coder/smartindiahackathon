import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight, Clock, MapPin, Send, AlertOctagon, Sparkles, Lock } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { AuditLogger } from '../../services/auditLogger';
import { OperationalDirective } from '../../types';

interface OperationalDirectivesProps {
  directives?: OperationalDirective[];
  onDirectiveExecuted?: (directive: OperationalDirective) => void;
}

const DEFAULT_DIRECTIVES: OperationalDirective[] = [
  {
    id: 'DIR-01',
    action_type: 'EVACUATION',
    title: 'Mandatory Tier-1 Evacuation: Chooralmala Sector',
    target: 'Chooralmala Riverine Basin',
    urgency: 'P1_IMMEDIATE',
    rationale: 'Factor of Safety Fs 0.88 with 1,420 citizens directly along debris runout path.',
    status: 'PENDING_DISPATCH',
    affected_population: 1420,
    evidence_metric: 'Fs 0.88 | API₇₂ 142mm',
  },
  {
    id: 'DIR-02',
    action_type: 'ROAD_CLOSURE',
    title: 'Arterial Road Closure: Meppadi-Chooralmala Bridge Corridor (SH-59)',
    target: 'SH-59 Highway & Bridge Abutment',
    urgency: 'P1_IMMEDIATE',
    rationale: 'High pore-water pressure and debris surge threaten structural bridge stability.',
    status: 'ACTIVE',
    affected_population: 0,
    evidence_metric: 'Piezometer P-04: 68.4 kPa',
  },
  {
    id: 'DIR-03',
    action_type: 'FIELD_DISPATCH',
    title: 'Deploy Geological Rapid Response Survey Squad Alpha',
    target: 'Upper Ridge Tension Crack Scar',
    urgency: 'P2_HIGH',
    rationale: 'Inspect continuous crack aperture widening rate (> 12mm/h) via portable extensometer.',
    status: 'PENDING_DISPATCH',
    affected_population: 0,
    evidence_metric: 'Crack Aperture: 18.2mm',
  },
  {
    id: 'DIR-04',
    action_type: 'RELIEF_SHELTER',
    title: 'Activate Government High School Meppadi Emergency Relief Shelter',
    target: 'Meppadi Safe Zone (Elev: 1,020m)',
    urgency: 'P2_HIGH',
    rationale: 'Pre-position emergency medical supplies, water purification kits, and shelter capacity.',
    status: 'PENDING_DISPATCH',
    affected_population: 800,
    evidence_metric: 'Safe Geotechnical Buffer: 2.4 km',
  }
];

export const OperationalDirectives: React.FC<OperationalDirectivesProps> = ({
  directives = DEFAULT_DIRECTIVES,
  onDirectiveExecuted,
}) => {
  const [activeList, setActiveList] = useState<OperationalDirective[]>(directives);
  const [confirmTarget, setConfirmTarget] = useState<OperationalDirective | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenConfirm = (dir: OperationalDirective) => {
    setConfirmTarget(dir);
  };

  const handleConfirmExecution = (authNote?: string) => {
    if (!confirmTarget) return;

    // Record audit log
    AuditLogger.logAction({
      user_role: 'INCIDENT_COMMANDER',
      action_type: confirmTarget.action_type,
      action_title: confirmTarget.title,
      target: confirmTarget.target,
      rationale: authNote ? `${confirmTarget.rationale} [Note: ${authNote}]` : confirmTarget.rationale,
      previous_state: confirmTarget.status,
      new_state: 'EXECUTED_COMMITTED',
      authorized_by: 'Incident Commander (C2-EOC)',
      status: 'COMMITTED',
    });

    // Update directive status locally
    const updated = activeList.map(d =>
      d.id === confirmTarget.id ? { ...d, status: 'EXECUTED' as const } : d
    );
    setActiveList(updated);

    if (onDirectiveExecuted) {
      onDirectiveExecuted({ ...confirmTarget, status: 'EXECUTED' });
    }

    setToastMessage(`Directive [${confirmTarget.id}] Dispatched: ${confirmTarget.title}`);
    setTimeout(() => setToastMessage(null), 4000);
    setConfirmTarget(null);
  };

  const handleStatusChange = (id: string, newStatus: OperationalDirective['status']) => {
    setActiveList(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
  };

  return (
    <div className="space-y-3" role="region" aria-label="Operational Command Directives">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
          <h2 className="text-sm font-bold font-sans uppercase tracking-tight text-white">
            OPERATIONAL COMMAND DIRECTIVES
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {activeList.filter(d => d.status !== 'EXECUTED').length} Active Action(s)
        </span>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {activeList.map((directive) => {
          const isP1 = directive.urgency === 'P1_IMMEDIATE';
          const isExecuted = directive.status === 'EXECUTED';

          return (
            <div
              key={directive.id}
              className={`p-4 rounded-xl border transition-all ${
                isExecuted
                  ? 'bg-[#0B1018]/60 border-white/[0.05] opacity-75'
                  : isP1
                  ? 'bg-[#151B26] border-red-500/30 hover:border-red-500/50 shadow-md'
                  : 'bg-[#10151F] border-[#253042] hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      isP1
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {directive.urgency.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{directive.id}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[11px] font-mono text-cyan-300 font-semibold">{directive.action_type}</span>
                </div>

                {isExecuted ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>EXECUTED</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">
                    Target: <strong className="text-white">{directive.target}</strong>
                  </span>
                )}
              </div>

              <div className="mt-2">
                <h3 className="text-xs sm:text-sm font-bold text-white font-sans">{directive.title}</h3>
                <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">{directive.rationale}</p>
              </div>

              {directive.evidence_metric && (
                <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Evidence: <strong className="text-slate-200">{directive.evidence_metric}</strong></span>
                  {directive.affected_population ? (
                    <span className="text-red-300 font-bold">{directive.affected_population.toLocaleString()} exposed</span>
                  ) : null}
                </div>
              )}

              {/* Action Buttons: EXECUTE, REVIEW, SCHEDULE, DISMISS, ESCALATE */}
              {!isExecuted && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(directive.id, 'ACTIVE')}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 text-[10px] font-mono font-medium border border-white/[0.06]"
                    >
                      REVIEW
                    </button>
                    <button
                      onClick={() => handleStatusChange(directive.id, 'DISMISSED')}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 text-[10px] font-mono font-medium border border-white/[0.06]"
                    >
                      DISMISS
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenConfirm(directive)}
                    className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                      isP1
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_12px_rgba(255,59,77,0.3)]'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold'
                    }`}
                  >
                    <Lock size={11} />
                    <span>EXECUTE DIRECTIVE</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <ConfirmDialog
          isOpen={!!confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirm={handleConfirmExecution}
          title={confirmTarget.title}
          description={confirmTarget.rationale}
          target={confirmTarget.target}
          affectedCount={confirmTarget.affected_population}
          urgency={confirmTarget.urgency}
          actionLabel="Authorize Order"
          isDestructive={confirmTarget.action_type === 'EVACUATION' || confirmTarget.action_type === 'ROAD_CLOSURE'}
        />
      )}
    </div>
  );
};
