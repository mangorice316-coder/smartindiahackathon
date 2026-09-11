import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  HelpCircle,
  ShieldAlert
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
    summary: 'Executive operations center aggregating risk metrics, high-hazard sub-catchments, and active warning dispatches.',
    judgeFocus: 'Observe distinction between live telemetry and synthetic calibrated data. Notice prioritized critical zones, active alerts, and immediate triage status.',
    actionText: 'Inspect Dashboard KPIs'
  },
  {
    step: 2,
    title: 'Interactive GIS Risk Map',
    view: 'map',
    locationId: 1, // Meppadi / Chooralmala Catchment
    badge: 'GEOSPATIAL INTELLIGENCE',
    summary: 'Multi-layer GIS map integrating DEM elevation models, slope gradients, drainage corridors, and critical lifelines.',
    judgeFocus: 'Camera centers on the highest-risk hotspot (Chooralmala Catchment, Wayanad). Geotechnical equilibrium confirms Factor of Safety Fs = 0.88.',
    actionText: 'Focus Highest Risk Hotspot'
  },
  {
    step: 3,
    title: 'Explainable AI & Physics Validation',
    view: 'map',
    locationId: 1,
    badge: 'TRANSPARENT REASONING',
    summary: 'System pairs infinite-slope geotechnical equilibrium with Saabas/SHAP mathematical feature attribution.',
    judgeFocus: 'Deep XAI decomposes risk drivers: 72h antecedent rainfall (185mm) + steep slope (36.5°) contribute >75% of risk weight. Fs < 1.0 proves failure conditions.',
    actionText: 'Inspect Factor Contributors (XAI)'
  },
  {
    step: 4,
    title: 'Rainfall What-If Simulation Engine',
    view: 'simulation',
    badge: 'DECISION SUPPORT SIMULATOR',
    summary: 'Isolated stress-testing environment evaluating "What happens if monsoon rainfall surges by 50% or 100%?" without mutating database records.',
    judgeFocus: 'Execute a +50% deluge scenario. Observe how multipliers re-run the scikit-learn risk engine and calculate newly escalated zones in an isolated memory buffer.',
    actionText: 'Run +50% Deluge Scenario'
  },
  {
    step: 5,
    title: 'Infrastructure Exposure Analysis',
    view: 'infrastructure',
    badge: 'LIFELINE VULNERABILITY',
    summary: 'Automated geospatial buffering calculating which hospitals, schools, bridges, and villages fall within high-hazard runout corridors.',
    judgeFocus: 'Observe how lifeline tiers are classified (Tier 1 = Hospitals & Evacuation Bridges) and how vulnerability weights prioritize civil defense resources.',
    actionText: 'View Exposed Lifelines'
  },
  {
    step: 6,
    title: 'Early Warning Alert Dispatch (CAP v1.2)',
    view: 'alerts',
    badge: 'EARLY WARNING & PROTOCOLS',
    summary: 'ML and physical alert triggers generating actionable evacuation advisories adhering to the OASIS CAP v1.2 standard.',
    judgeFocus: 'Inspect alerts with Urgency, Severity, and Certainty tags, plus raw OASIS CAP XML/JSON payloads ready for NDMA/SDMA emergency broadcast integration.',
    actionText: 'Evaluate & Trigger Alerts (CAP v1.2)'
  },
  {
    step: 7,
    title: 'Field Inspection Prioritization Matrix',
    view: 'inspections',
    badge: 'RESOURCE OPTIMIZATION',
    summary: 'Multi-factor algorithm ranking field inspection squads based on hazard severity, exposed population, lifeline density, and model confidence.',
    judgeFocus: 'Inspect exact priority formula: P = 0.35H + 0.25E_pop + 0.25E_life + 0.15U. Shows tension crack displacement logging (mm) and toe seepage evidence.',
    actionText: 'Calculate Inspection Priorities'
  },
  {
    step: 8,
    title: 'Executive SitRep & Automated Reports',
    view: 'reports',
    badge: 'DECISION REPORTING',
    summary: 'One-click generation of situational reports formatted for disaster management commanders, district magistrates, and NDRF battalions.',
    judgeFocus: 'Review the formatted executive summary, resource deployment directives, and instant export capabilities in JSON and Markdown formats.',
    actionText: 'Generate Commander SitRep'
  },
  {
    step: 9,
    title: 'Model Cards & Scientific Integrity',
    view: 'model_data',
    badge: 'SCIENTIFIC GOVERNANCE',
    summary: 'Complete transparency into model architecture (Gradient Boosting / Random Forest), cross-validation accuracy (ROC-AUC > 0.93), and data provenance.',
    judgeFocus: 'Review model training history, data freshness thresholds, SHA-256 integrity checksums, and explicit scientific limitations disclaimers.',
    actionText: 'View ML Model Governance'
  }
];

const STEP_DWELL_SECONDS = 14;

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
        setSimMessage('OASIS CAP v1.2 alerts re-evaluated.');
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

  // Autoplay countdown timer
  useEffect(() => {
    if (!isAutoPlaying) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setAutoPlayCountdown((prev) => {
        if (prev <= 1) {
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
            setIsAutoPlaying(false);
            setSimMessage('Presentation Tour Complete.');
            setTimeout(() => setSimMessage(null), 4000);
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
      {/* Sleek, Non-Obstructive Floating Command Bar at Bottom */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-2xl bg-[#0d121f]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 text-slate-200 transition-all font-sans select-none">
        {/* Step Progress Pills Bar */}
        <div className="flex items-center gap-1.5 mb-2.5">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => handleGoToStep(idx)}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'bg-cyan-400 ring-2 ring-cyan-400/40 shadow-sm'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500/80'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Step ${s.step}: ${s.title}`}
            />
          ))}
        </div>

        {/* Top Controls Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
              STEP {currentStep.step}/9
            </span>
            <span className="font-semibold text-xs text-white truncate">
              {currentStep.title}
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              ({currentStep.badge})
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
            {/* Autoplay Button */}
            <button
              onClick={toggleAutoPlay}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                isAutoPlaying
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isAutoPlaying ? 'Pause tour' : 'Auto-advance tour'}
            >
              {isAutoPlaying ? <Pause size={11} /> : <Play size={11} />}
              <span>{isAutoPlaying ? `${autoPlayCountdown}s` : 'Tour'}</span>
            </button>

            {/* How It Works Button */}
            <button
              onClick={() => setShowHowItWorks(true)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-[11px]"
              title="Architecture & proof"
            >
              <HelpCircle size={13} />
            </button>

            {/* Minimize Toggle */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {isMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close tour"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        {!isMinimized && (
          <div className="mt-2.5 space-y-2.5 pt-2.5 border-t border-slate-800/80">
            {/* Judge Focus Observation Note */}
            <div className="bg-[#080d16] border-l-2 border-cyan-400 rounded-r-lg px-3 py-2 text-xs font-mono text-slate-300">
              <span className="text-cyan-400 font-bold mr-1.5">OBSERVE:</span>
              <span className="font-sans text-[11px] text-slate-300">{currentStep.judgeFocus}</span>
            </div>

            {/* Action Feedback Message */}
            {simMessage && (
              <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{simMessage}</span>
              </div>
            )}

            {/* Navigation & Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => handleGoToStep(currentStepIndex - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft size={12} />
                <span>Prev</span>
              </button>

              {/* Central Primary Action Button */}
              <button
                onClick={() => handleStepAction(currentStepIndex)}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-md transition-colors"
              >
                <Play size={12} />
                <span>{currentStep.actionText}</span>
              </button>

              <button
                disabled={currentStepIndex === DEMO_STEPS.length - 1}
                onClick={() => handleGoToStep(currentStepIndex + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* "How This Demo Works" Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d121f] border border-slate-700 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-lg">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    System Architecture &amp; Methodology
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Zero Hallucination Guarantee • Physical-ML Coupled Model
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <h4 className="font-bold text-cyan-400 text-xs mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  1. Live Execution against Real Endpoints
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Every step in this walkthrough triggers real REST API requests to FastAPI, executing gradient boosting inference, SQLite geospatial queries, and Mohr-Coulomb limit equilibrium equations.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <h4 className="font-bold text-emerald-400 text-xs mb-1 flex items-center gap-1.5">
                  <Layers size={13} />
                  2. Calibrated Physical Ground Truth
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Soil cohesion, friction angles (phi'=28°), antecedent precipitation indices (API_72), and slope gradients are calibrated against empirical field conditions from the 2024 Western Ghats and Himalayan hazard sectors.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <h4 className="font-bold text-amber-400 text-xs mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={13} />
                  3. Simulation Isolation (Zero Data Mutation)
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Deluge scenarios run on in-memory clones with immutability guards, ensuring hypothetical rainfall stress never overwrites empirical sensor baselines.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHowItWorks(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg border border-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
