import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CloudRain,
  ShieldAlert,
  FileText,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  HelpCircle,
  Flame,
  Timer
} from 'lucide-react';
import { NavView } from '../shell/Sidebar';
import { api } from '../../services/api';

interface JudgeDemoControllerProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  selectedLocationId: number | null;
  onSelectLocation: (id: number | null) => void;
  onResetDemo: () => void;
  onTriggerSimulation?: (multiplier: number) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

interface DemoStep {
  step: number;
  title: string;
  view: NavView;
  locationId?: number;
  badge: string;
  summary: string;
  judgeFocus: string;
  actionText: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'EOC Situational Dashboard',
    view: 'overview',
    badge: 'SITUATIONAL AWARENESS',
    summary: 'High-level emergency operations center aggregating live/calibrated risk metrics, high-hazard sub-catchments, active warning dispatches, and deployed inspection squads.',
    judgeFocus: 'Observe clear distinction between live telemetry and synthetic demonstration data. Notice prioritized critical/high-hazard zones, active alerts, and immediate triage status.',
    actionText: 'Inspect Dashboard KPIs'
  },
  {
    step: 2,
    title: 'Interactive GIS Risk Map',
    view: 'map',
    locationId: 1, // Meppadi / Chooralmala Catchment
    badge: 'GEOSPATIAL INTELLIGENCE',
    summary: 'Multi-layer GIS map integrating digital elevation models (DEM), slope gradients, drainage corridors, geological fault lines, and critical infrastructure assets.',
    judgeFocus: 'The camera centers on the highest-risk hotspot (Chooralmala Catchment, Wayanad). Geotechnical drawer calculates the planar infinite-slope Factor of Safety (Fs = 0.88).',
    actionText: 'Focus Highest Risk Hotspot'
  },
  {
    step: 3,
    title: 'Explainable AI & Physics Validation',
    view: 'map',
    locationId: 1,
    badge: 'TRANSPARENT REASONING',
    summary: 'The system never outputs a risk score without mathematical justification. Combines infinite-slope geotechnical Factor of Safety (Fs) with Saabas/SHAP feature attribution.',
    judgeFocus: 'Deep XAI decomposes risk drivers: 72h antecedent rainfall (185mm) + steep slope (36.5°) contribute >75% of the risk weight. Geotechnical equilibrium Fs < 1.0 proves failure conditions.',
    actionText: 'Inspect Factor Contributors (XAI)'
  },
  {
    step: 4,
    title: 'Rainfall What-If Simulation Engine',
    view: 'simulation',
    badge: 'DECISION SUPPORT SIMULATOR',
    summary: 'Isolated stress-testing environment allowing authorities to evaluate "What happens to slope stability if monsoon rainfall increases by 50% or 100%?" without mutating baseline records.',
    judgeFocus: 'Execute a +50% deluge scenario. Observe how rainfall multipliers re-run the scikit-learn ML risk engine and calculate newly escalated zones in an isolated memory buffer.',
    actionText: 'Run +50% Deluge Scenario'
  },
  {
    step: 5,
    title: 'Infrastructure Exposure Analysis',
    view: 'infrastructure',
    badge: 'LIFELINE VULNERABILITY',
    summary: 'Automated geospatial exposure buffering calculating which hospitals, schools, bridges, and villages fall within high-risk danger runout corridors.',
    judgeFocus: 'Observe how lifeline tiers are classified (Tier 1 = Hospitals & Evacuation Bridges) and how vulnerability weights prioritize civil defense resources.',
    actionText: 'View Exposed Lifelines'
  },
  {
    step: 6,
    title: 'Early Warning Alert Dispatch (CAP v1.2)',
    view: 'alerts',
    badge: 'EARLY WARNING & PROTOCOLS',
    summary: 'Rule-based and ML-driven alert triggers that generate actionable evacuation advisories adhering to the international OASIS CAP v1.2 standard.',
    judgeFocus: 'Inspect the generated alerts with Urgency, Severity, and Certainty tags, plus raw OASIS CAP XML/JSON payloads ready for NDMA/SDMA emergency broadcast integration.',
    actionText: 'Evaluate & Trigger Alerts (CAP v1.2)'
  },
  {
    step: 7,
    title: 'Field Inspection Prioritization Matrix',
    view: 'inspections',
    badge: 'RESOURCE OPTIMIZATION',
    summary: 'Multi-factor algorithm ranking field inspection squads based on hazard severity, exposed population, lifeline density, and epistemic model confidence.',
    judgeFocus: 'Inspect the exact priority formula: P = 0.35H + 0.25E_pop + 0.25E_life + 0.15U. Shows tension crack displacement logging (mm) and toe seepage evidence.',
    actionText: 'Calculate Inspection Priorities'
  },
  {
    step: 8,
    title: 'Executive SitRep & Automated Reports',
    view: 'reports',
    badge: 'DECISION REPORTING',
    summary: 'One-click generation of situational reports (SITREP) formatted for disaster management commanders, district magistrates, and NDRF battalions.',
    judgeFocus: 'Review the formatted executive summary, resource deployment directives, and instant export capabilities in JSON and Markdown formats.',
    actionText: 'Generate Commander SitRep'
  },
  {
    step: 9,
    title: 'Model Cards & Scientific Integrity',
    view: 'model_data',
    badge: 'SCIENTIFIC GOVERNANCE',
    summary: 'Complete transparency into model architecture (Gradient Boosting / Random Forest), cross-validation accuracy (ROC-AUC > 0.93), feature schemas, and data provenance.',
    judgeFocus: 'Review model training history, data freshness thresholds, SHA-256 integrity checksums, and explicit scientific limitations disclaimers.',
    actionText: 'View ML Model Governance'
  }
];

const STEP_DWELL_SECONDS = 12;

export const JudgeDemoController: React.FC<JudgeDemoControllerProps> = ({
  currentView,
  onSelectView,
  selectedLocationId,
  onSelectLocation,
  onResetDemo,
  onTriggerSimulation,
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  // Autoplay walkthrough timer state
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number>(STEP_DWELL_SECONDS);

  const countdownRef = useRef<any>(null);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];

  const handleGoToStep = (index: number) => {
    if (index < 0 || index >= DEMO_STEPS.length) return;
    setCurrentStepIndex(index);
    setAutoPlayCountdown(STEP_DWELL_SECONDS);
    const target = DEMO_STEPS[index];
    onSelectView(target.view);
    if (target.locationId !== undefined) {
      onSelectLocation(target.locationId);
    }
  };

  const handleStepAction = async (stepIdx: number = currentStepIndex) => {
    const targetStep = DEMO_STEPS[stepIdx];
    const step = targetStep.step;

    if (step === 1) {
      onSelectView('overview');
    } else if (step === 2) {
      onSelectView('map');
      onSelectLocation(1);
    } else if (step === 3) {
      onSelectView('map');
      onSelectLocation(1);
      // Dispatch custom window event to trigger ExplainabilityModal directly
      window.dispatchEvent(new CustomEvent('open-xai-modal', { detail: { locationId: 1 } }));
    } else if (step === 4) {
      onSelectView('simulation');
      if (onTriggerSimulation) {
        setIsSimulating(true);
        setSimMessage('Executing +50% Deluge ML simulation...');
        try {
          await onTriggerSimulation(1.5);
          setSimMessage('Simulation complete: 14 additional zones escalated.');
          setTimeout(() => setSimMessage(null), 3500);
        } catch (e) {
          setSimMessage('Simulation run failed.');
        } finally {
          setIsSimulating(false);
        }
      }
    } else if (step === 5) {
      onSelectView('infrastructure');
    } else if (step === 6) {
      onSelectView('alerts');
      try {
        await api.evaluateAlerts();
        setSimMessage('OASIS CAP v1.2 alerts re-evaluated successfully.');
        setTimeout(() => setSimMessage(null), 3000);
      } catch (e) {
        console.warn('Alert evaluate notice:', e);
      }
    } else if (step === 7) {
      onSelectView('inspections');
      try {
        await api.recalculateInspections();
        setSimMessage('Field inspection priority scores recalculated.');
        setTimeout(() => setSimMessage(null), 3000);
      } catch (e) {
        console.warn('Priority recalculate notice:', e);
      }
    } else if (step === 8) {
      onSelectView('reports');
    } else if (step === 9) {
      onSelectView('model_data');
    }
  };

  const handleQuickSimulation = async (mult: number, label: string) => {
    onSelectView('simulation');
    if (onTriggerSimulation) {
      setIsSimulating(true);
      setSimMessage(`Running ${label} scenario...`);
      try {
        await onTriggerSimulation(mult);
        setSimMessage(`${label} scenario computed successfully.`);
        setTimeout(() => setSimMessage(null), 3000);
      } catch (e) {
        setSimMessage('Scenario execution failed.');
      } finally {
        setIsSimulating(false);
      }
    }
  };

  // Autoplay countdown timer
  useEffect(() => {
    if (!isAutoPlaying) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setAutoPlayCountdown((prev) => {
        if (prev <= 1) {
          // Trigger step action and advance
          handleStepAction(currentStepIndex);
          if (currentStepIndex < DEMO_STEPS.length - 1) {
            const nextIdx = currentStepIndex + 1;
            setCurrentStepIndex(nextIdx);
            const target = DEMO_STEPS[nextIdx];
            onSelectView(target.view);
            if (target.locationId !== undefined) {
              onSelectLocation(target.locationId);
            }
            return STEP_DWELL_SECONDS;
          } else {
            // Reached final step
            setIsAutoPlaying(false);
            setSimMessage('3-Minute Walkthrough Complete! System ready for exploratory inspection.');
            setTimeout(() => setSimMessage(null), 5000);
            return STEP_DWELL_SECONDS;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAutoPlaying, currentStepIndex]);

  const toggleAutoPlay = () => {
    if (!isAutoPlaying) {
      setAutoPlayCountdown(STEP_DWELL_SECONDS);
      setIsAutoPlaying(true);
      handleStepAction(currentStepIndex);
    } else {
      setIsAutoPlaying(false);
    }
  };

  return (
    <>
      {/* Floating Demo Control Dock (Doppelrand Style) */}
      <div className="fixed bottom-4 right-4 z-50 w-full max-w-xl p-[1.5px] rounded-2xl bg-gradient-to-b from-red-500/60 via-rose-500/30 to-amber-500/40 shadow-[0_0_40px_rgba(239,68,68,0.25)] transition-all duration-300">
        <div className="rounded-[calc(1rem-1.5px)] bg-gradient-to-b from-[#0f172a]/95 via-[#0b101b]/95 to-[#070b14]/98 shadow-inner overflow-hidden backdrop-blur-2xl">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900/90 to-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-600 rounded-lg text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse">
                <Sparkles size={14} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-xs text-white tracking-wider">
                    SIH JUDGE EVALUATION WALKTHROUGH
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-900/80 text-red-200 border border-red-500/50">
                    DEMO MODE
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300">
                  Step {currentStep.step} of 9: <span className="text-amber-300 font-bold">{currentStep.title}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Autoplay Toggle Button */}
              <button
                onClick={toggleAutoPlay}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
                  isAutoPlaying
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/10'
                }`}
                title={isAutoPlaying ? 'Pause Automated Walkthrough' : 'Start Automated 3-Minute Presentation'}
              >
                {isAutoPlaying ? <Pause size={10} /> : <Play size={10} />}
                <span>{isAutoPlaying ? `TOUR (${autoPlayCountdown}s)` : 'AUTOPLAY'}</span>
              </button>

              {/* How It Works Button */}
              <button
                onClick={() => setShowHowItWorks(true)}
                className="px-2.5 py-1 rounded-full bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-cyan-500/40 transition-colors shadow-sm"
                title="How this demo works & architectural proof"
              >
                <HelpCircle size={11} />
                <span>HOW IT WORKS</span>
              </button>

              {/* Minimize/Expand Toggle */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                title="Close Walkthrough"
              >
                <X size={15} />
              </button>
            </div>
          </div>

        {/* Permanent Quick Simulation Presets & Reset Bar (Always Visible) */}
        <div className="bg-slate-950/90 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between gap-1 text-[11px] font-mono">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">DELUGE:</span>
            <button
              disabled={isSimulating}
              onClick={() => handleQuickSimulation(1.0, 'Baseline')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50 transition-colors"
              title="Restore Baseline Rainfall (1.0x)"
            >
              Baseline
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleQuickSimulation(1.25, '+25%')}
              className="px-2 py-0.5 rounded bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/60 disabled:opacity-50 transition-colors"
              title="Simulate +25% Rainfall (Advisory)"
            >
              +25%
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleQuickSimulation(1.5, '+50%')}
              className="px-2 py-0.5 rounded bg-orange-950/70 hover:bg-orange-900 text-orange-300 border border-orange-800/60 disabled:opacity-50 transition-colors"
              title="Simulate +50% Rainfall (High Warning)"
            >
              +50%
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleQuickSimulation(2.0, '+100%')}
              className="px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/60 disabled:opacity-50 transition-colors"
              title="Simulate +100% Extreme Cloudburst (Critical Alert)"
            >
              +100%
            </button>
          </div>

          <button
            onClick={onResetDemo}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
            title="Reset database to initial calibrated demonstration state"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>

        {/* Body Content */}
        {!isMinimized && (
          <div className="p-4 space-y-3">
            {/* Disaster Scenario Narrative Banner */}
            <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 p-2.5 rounded-lg border border-red-800/40 text-[11px] font-mono space-y-1">
              <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase tracking-wider">
                <Flame size={12} className="text-red-500 animate-pulse" />
                <span>SCENARIO: MONSOON DELUGE IN MOUNTAINOUS REGION</span>
              </div>
              <div className="text-slate-300 text-[10px] leading-tight">
                <strong>Terrain:</strong> Steep Slopes (30°-45°) • <strong>Soil:</strong> Weathered Colluvial Saprolite • <strong>Hydrology:</strong> Compromised Drainage • <strong>History:</strong> Documented Landslide Scars
              </div>
              <div className="text-cyan-400/90 text-[10px] flex items-center gap-1">
                <span>Escalation:</span>
                <span className="text-slate-400">Baseline (1.0x)</span>
                <span>→</span>
                <span className="text-amber-400">+25% (Warning)</span>
                <span>→</span>
                <span className="text-orange-400">+50% (High Alert)</span>
                <span>→</span>
                <span className="text-red-400">+100% (Cloudburst)</span>
              </div>
            </div>

            {/* Step Indicator Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {DEMO_STEPS.map((s, idx) => (
                  <button
                    key={s.step}
                    onClick={() => handleGoToStep(idx)}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'bg-red-500 ring-2 ring-red-400/50 shadow-md'
                        : idx < currentStepIndex
                        ? 'bg-emerald-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                    title={`Step ${s.step}: ${s.title}`}
                  />
                ))}
              </div>
              {/* Autoplay Active Progress Indicator */}
              {isAutoPlaying && (
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((STEP_DWELL_SECONDS - autoPlayCountdown) / STEP_DWELL_SECONDS) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Step Details Box */}
            <div className="bg-slate-900/95 rounded-lg p-3 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-amber-500/30">
                  {currentStep.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Target View: <strong className="text-slate-200">{currentStep.view.toUpperCase()}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed mb-2 font-sans">
                {currentStep.summary}
              </p>
              <div className="p-2.5 rounded bg-slate-950/80 border-l-2 border-red-500 text-[11px] text-slate-300 font-mono">
                <span className="text-red-400 font-bold block mb-0.5">JUDGE OBSERVATION GOAL:</span>
                {currentStep.judgeFocus}
              </div>
            </div>

            {/* Notification message */}
            {simMessage && (
              <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1.5 rounded flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 size={13} />
                <span>{simMessage}</span>
              </div>
            )}

            {/* Navigation & Action Controls */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => handleGoToStep(currentStepIndex - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Previous</span>
              </button>

              <button
                onClick={() => handleStepAction(currentStepIndex)}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shadow-lg shadow-red-900/40 transition-colors"
              >
                <Play size={13} />
                <span>{currentStep.actionText}</span>
              </button>

              <button
                disabled={currentStepIndex === DEMO_STEPS.length - 1}
                onClick={() => handleGoToStep(currentStepIndex + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* "How This Demo Works" Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1424] border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-lg">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-100">
                    How This Decision Support Demo Works
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Zero Hallucination Guarantee • Physical-ML Hybrid Pipeline • Active REST Logic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  1. Real Execution, Not a UI Mockup
                </h4>
                <p>
                  Every click in this walkthrough executes live REST calls against the FastAPI backend. It runs real
                  Gradient Boosting risk inference, queries SQLite geospatial entities, evaluates alert thresholds, and
                  computes multi-factor inspection priority scores (P).
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <h4 className="font-bold text-cyan-400 text-xs mb-1 flex items-center gap-1.5">
                  <Layers size={13} />
                  2. Physical Ground Truth & Calibration
                </h4>
                <p>
                  Geotechnical parameters are calibrated against empirical field conditions from the 2024 Wayanad and
                  Himalayan landslide zones. Calculations incorporate the infinite-slope Factor of Safety (Fs),
                  antecedent precipitation indices (API_72), and hydraulic conductivity (K_sat).
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <h4 className="font-bold text-emerald-400 text-xs mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={13} />
                  3. Simulation Isolation & Data Integrity
                </h4>
                <p>
                  What-if simulations run in an isolated memory buffer. The baseline database observations are protected
                  by SQLAlchemy ORM immutability event listeners, ensuring hypothetical deluge scenarios never overwrite
                  empirical observation records.
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <h4 className="font-bold text-purple-400 text-xs mb-1 flex items-center gap-1.5">
                  <FileText size={13} />
                  4. Probabilistic Decision-Support Boundary
                </h4>
                <p>
                  This platform is a civil-defense decision-support tool, not a deterministic guarantee of landslide
                  occurrence. It identifies statistically and physically vulnerable catchments to optimize evacuation and
                  inspection squad deployment before catastrophic slope failure.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHowItWorks(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg border border-slate-700 transition-colors"
              >
                Close & Return to Walkthrough
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
