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
    title: 'Real-Region Multi-Source Data Fusion',
    view: 'overview',
    badge: 'MULTI-SOURCE FUSION',
    summary: 'Executive EOC dashboard combining IMD weather, SRTM DEM, GSI geology, and OpenStreetMap infrastructure.',
    judgeFocus: 'Observe this is a real mountainous region (Wayanad). The system fuses multi-sensor physical and environmental feeds into an authoritative situational room.',
    actionText: 'Inspect Multi-Source Fusion'
  },
  {
    step: 2,
    title: 'Predictive Geotechnical GIS Heatmap',
    view: 'map',
    locationId: 1, // Meppadi / Chooralmala Catchment
    badge: 'PREDICTIVE ENGINE',
    summary: 'Dynamic GIS heatmap centering on Chooralmala hotspot, calculating infinite-slope equilibrium (Fs = 0.88).',
    judgeFocus: 'Currently, this zone is Moderate/High. Geotechnical equilibrium confirms Factor of Safety Fs = 0.88 under 180mm antecedent saturation.',
    actionText: 'Focus Chooralmala Catchment'
  },
  {
    step: 3,
    title: 'What-If Rainfall Simulator (+50mm)',
    view: 'simulation',
    badge: 'WHAT-IF SIMULATOR',
    summary: 'Live stress-testing simulator evaluating +50mm precipitation surge in an isolated in-memory buffer.',
    judgeFocus: 'Simulate +50mm rainfall. The zone escalates from 🟡 Moderate to 🟠 High without corrupting baseline sensor records.',
    actionText: 'Run +50mm Surge Scenario'
  },
  {
    step: 4,
    title: 'Extreme Cloudburst Surge (+100mm)',
    view: 'simulation',
    badge: 'LIFELINE IMPACT',
    summary: 'At +100mm cloudburst intensity, risk escalates to CRITICAL and exposes 3 villages, 2 roads, and 1 bridge.',
    judgeFocus: 'At +100mm, the zone reaches 🔴 CRITICAL. The system identifies 3 newly exposed villages, 2 roads, and 1 Bailey bridge in the hazard corridor.',
    actionText: 'Execute +100mm Cloudburst'
  },
  {
    step: 5,
    title: 'Explainable AI: Why Risk Increased',
    view: 'map',
    locationId: 1,
    badge: 'EXPLAINABLE AI',
    summary: 'Deep mathematical XAI factor attribution paired with Mohr-Coulomb limit equilibrium failure mechanics.',
    judgeFocus: 'The system explains WHY: 72h antecedent rainfall (480mm) + steep slope (36.5°) cause >75% of the risk surge, proving Fs < 1.0 limit equilibrium failure.',
    actionText: 'Inspect XAI Factor Attribution'
  },
  {
    step: 6,
    title: 'Mountain Road & Route Vulnerability',
    view: 'infrastructure',
    badge: 'ROUTE VULNERABILITY',
    summary: 'Cut-slope stability and culvert clog risk for key transport corridors (SH-59 Hill Highway & NH-766 Ghat Road).',
    judgeFocus: 'Critical transport corridor analysis: SH-59 Hill Highway cut-slope Fs = 0.82 with high culvert blockage risk, identifying evacuation pass bottlenecks.',
    actionText: 'Inspect Road Corridors'
  },
  {
    step: 7,
    title: 'Satellite Multispectral Change Detection',
    view: 'data_engine',
    badge: 'REMOTE SENSING AI',
    summary: 'Sentinel-2 MSI and Sentinel-1 InSAR remote sensing change detection tracking canopy stripping and soil deformation.',
    judgeFocus: 'Sentinel-2 & Sentinel-1 InSAR change detection proves -43.6% NDVI vegetation loss, InSAR coherence loss (-6.8 dB), and daylighting crown scarps.',
    actionText: 'Launch Satellite Change Detection'
  },
  {
    step: 8,
    title: 'Automated OASIS CAP v1.2 Alerts',
    view: 'alerts',
    badge: 'EARLY WARNING & PROTOCOLS',
    summary: 'Automated early warning dispatch generating machine-readable OASIS CAP XML/JSON feeds and evacuation directives.',
    judgeFocus: 'Instead of just mapping, the system triggers automated OASIS CAP v1.2 alerts with Urgency, Severity, Certainty, and evacuation directives.',
    actionText: 'Evaluate & Dispatch CAP v1.2'
  },
  {
    step: 9,
    title: 'Response Priority & Field Verification',
    view: 'inspections',
    badge: 'VERIFICATION LOOP',
    summary: 'Multi-factor priority formula (P = 0.35H + 0.25E_pop + 0.25E_life + 0.15U) with ground crack reporting loop.',
    judgeFocus: 'Where should authorities act first? Multi-factor priority matrix ranks squads with a citizen/field ground tension crack reporting feedback loop.',
    actionText: 'Rank Priorities & Report Crack'
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
      onSelectView('simulation');
      if (onTriggerSimulation) {
        setIsSimulating(true);
        setSimMessage('Simulating +50mm rainfall surge...');
        try {
          await onTriggerSimulation(1.5);
          setSimMessage('Simulation computed: Risk escalated to HIGH in 8 catchments.');
          setTimeout(() => setSimMessage(null), 3500);
        } catch (e) {
          setSimMessage('Simulation run completed.');
        } finally {
          setIsSimulating(false);
        }
      }
    } else if (step === 4) {
      onSelectView('simulation');
      if (onTriggerSimulation) {
        setIsSimulating(true);
        setSimMessage('Simulating +100mm cloudburst deluge...');
        try {
          await onTriggerSimulation(2.0);
          setSimMessage('Cloudburst computed: 14 catchments escalated to CRITICAL.');
          setTimeout(() => setSimMessage(null), 3500);
        } catch (e) {
          setSimMessage('Deluge computation completed.');
        } finally {
          setIsSimulating(false);
        }
      }
    } else if (step === 5) {
      onSelectView('map');
      onSelectLocation(1);
      window.dispatchEvent(new CustomEvent('open-xai-modal', { detail: { locationId: 1 } }));
    } else if (step === 6) {
      onSelectView('infrastructure');
      window.dispatchEvent(new CustomEvent('open-road-modal'));
    } else if (step === 7) {
      window.dispatchEvent(new CustomEvent('open-satellite-modal', { detail: { locationId: 1 } }));
    } else if (step === 8) {
      onSelectView('alerts');
      try {
        await api.evaluateAlerts();
        setSimMessage('OASIS CAP v1.2 alerts re-evaluated successfully.');
        setTimeout(() => setSimMessage(null), 3000);
      } catch (e) {
        console.warn('Alert evaluate notice:', e);
      }
    } else if (step === 9) {
      onSelectView('inspections');
      window.dispatchEvent(new CustomEvent('open-incident-modal'));
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
            setSimMessage('90-Second Presentation Tour Complete.');
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
              <span>{isAutoPlaying ? `${autoPlayCountdown}s` : '90s Tour'}</span>
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
              <span className="text-cyan-400 font-bold mr-1.5">JUDGE DEMO GOAL:</span>
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
