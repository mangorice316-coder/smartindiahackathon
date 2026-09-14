import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Flame,
  CloudRain,
  Layers,
  Send,
  Compass,
  Bot,
  Building2,
  Radio,
  FileText,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface GuidedScenarioTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (view: any) => void;
}

interface ScenarioStep {
  stepNumber: number;
  title: string;
  category: string;
  view: string;
  icon: any;
  summary: string;
  details: string;
  actionPrompt: string;
  expectedOutcome: string;
}

const SCENARIO_STEPS: ScenarioStep[] = [
  {
    stepNumber: 1,
    title: 'Severe Meteorological Cloudburst (572mm Deluge)',
    category: 'ATMOSPHERIC TELEMETRY',
    view: 'conditions',
    icon: CloudRain,
    summary: 'Antecedent precipitation over Western Ghats reaches historic disaster levels, saturating saprolite soils.',
    details: 'The live Open-Meteo REST adapter syncs rainfall data from ECMWF and GFS global models. In Wayanad, 24h peak rain reaches >180mm with 72h antecedent saturation exceeding 320mm.',
    actionPrompt: 'Navigate to Live Conditions view to observe real-time rainfall graphs and volumetric soil moisture.',
    expectedOutcome: 'Weather telemetry shows 100% real-time streaming status with zero mock data.'
  },
  {
    stepNumber: 2,
    title: 'Sub-Catchment Threat Escalation to CRITICAL',
    category: 'EARLY WARNING ENGINE',
    view: 'overview',
    icon: Flame,
    summary: 'The risk engine calculates severe multi-factor threat across Chooralmala, Mundakkai, and Meppadi.',
    details: 'The Top Situation Briefing answers all 5 operational questions in 10 seconds: WHAT is happening, WHERE it is, HOW dangerous (Fs < 1.0), WHY it is failing, and WHAT to do next.',
    actionPrompt: 'Navigate to Overview Command Center to evaluate the 10-Second Hero Decision Deck.',
    expectedOutcome: 'Active incident banner displays "INCIDENT: WAYANAD MONSOON SURGE" with escalating trend (+14.8%).'
  },
  {
    stepNumber: 3,
    title: 'Factor of Safety (Fs) Drops Below 1.0',
    category: 'GEOTECHNICAL PHYSICS',
    view: 'overview',
    icon: Layers,
    summary: 'Planar infinite-slope mechanics prove imminent shear failure (Fs = 0.88) as pore pressure spikes.',
    details: 'Unlike black-box AI systems, BHU-SURAKSHA couples Mohr-Coulomb limit equilibrium equations with machine learning. Operators can toggle between plain English and technical geotechnical formulas.',
    actionPrompt: 'Inspect the Factor of Safety column in the Sub-Catchment Priority Ranking table.',
    expectedOutcome: 'Fs = 0.88 is flagged as CRITICAL SHEAR FAILURE with explanation of loss of matric suction.'
  },
  {
    stepNumber: 4,
    title: 'NDMA Sachet CAP-CP Warning Directive Generated',
    category: 'CIVIL DEFENSE ALERTS (NDMA & KSDMA)',
    view: 'alerts',
    icon: Send,
    summary: 'Standardized Common Alerting Protocol (CAP-CP / Sachet) emergency ticket is generated for district broadcast.',
    details: 'Alerts are not passive rows: each ticket contains physical evidence, exposed population, threatened bridges, and 1-click execution buttons to acknowledge, assign squad, or broadcast.',
    actionPrompt: 'Navigate to Alerts view to inspect the emergency action ticket and broadcast protocol.',
    expectedOutcome: 'CAP ticket specifies 850m hazard buffer and prescribes immediate Tier-1 evacuation.'
  },
  {
    stepNumber: 5,
    title: 'GIS Multi-Basemap & Lifeline Runout Analysis',
    category: 'TACTICAL GIS CANVAS',
    view: 'map',
    icon: Compass,
    summary: 'Interactive GIS canvas overlays hazard catchments, 250m micro-grid, and threatened lifelines.',
    details: 'Operators can switch between Tactical Dark, Esri High-Resolution Satellite, and OpenTopoMap elevation relief basemaps. Selecting any catchment opens the Contextual Zone Intelligence dossier.',
    actionPrompt: 'Navigate to GIS Risk Map, toggle between Satellite and Topo basemaps, and click Chooralmala.',
    expectedOutcome: 'Zone Intelligence panel details WHY this zone is failing, WHAT could happen, and WHAT to do.'
  },
  {
    stepNumber: 6,
    title: 'AI Disaster Assistant Consultation',
    category: 'EVIDENCE-BASED AI',
    view: 'overview',
    icon: Bot,
    summary: 'Grounded operational AI assistant answers complex queries with concrete physical measurements.',
    details: 'Ask the assistant: "Why is Chooralmala in a critical state?" or "Which zones became more dangerous in the last 6 hours?". The response provides facts, evidence metrics, confidence %, and action directives.',
    actionPrompt: 'Open the AI Assistant drawer from the top header and click a recommended operational query.',
    expectedOutcome: 'AI returns structured answer citing 572mm rain, Fs = 0.88, and recommended bridge closure.'
  },
  {
    stepNumber: 7,
    title: 'Ephemeral What-If Cloudburst Simulation (+50%)',
    category: 'SCENARIO PROJECTION',
    view: 'simulation',
    icon: CloudRain,
    summary: 'Incident commander runs a +50% rainfall scenario against ephemeral memory buffers.',
    details: 'The simulator calculates downstream slope destabilization and newly exposed infrastructure without altering the operational baseline records in the database.',
    actionPrompt: 'Navigate to Simulation view and execute a +50% deluge scenario.',
    expectedOutcome: 'Simulation reveals 3,200 additional residents and 2 secondary bridges enter the critical danger zone.'
  },
  {
    stepNumber: 8,
    title: 'Field Squad Tactical Dispatch',
    category: 'OPERATIONAL COMMAND',
    view: 'inspections',
    icon: Radio,
    summary: 'Rapid response squads are deployed to high-hazard sectors with specific inspection mandates.',
    details: 'The field inspection lifecycle tracks tasks through NEW -> ASSIGNED -> EN_ROUTE -> ON_SITE -> INSPECTING -> SUBMITTED -> SYNCED.',
    actionPrompt: 'Navigate to Inspections view and assign Squad Alpha to Upper Chooralmala Ridge.',
    expectedOutcome: 'Priority mission queue reflects assigned team and establishes field inspection tracking.'
  },
  {
    stepNumber: 9,
    title: 'Field Geotechnical Evidence Logging',
    category: 'GROUND TRUTH VERIFICATION',
    view: 'inspections',
    icon: CheckCircle2,
    summary: 'Field inspectors record crown tension crack dilation (18.5mm/h) and hydrostatic seepage.',
    details: 'Data collected includes exact millimeter fissure displacement, creep severity, water seepage, photo references, and GPS coordinates for complete legal auditability.',
    actionPrompt: 'Click "Attach Evidence" on the top mission to log tension crack measurements.',
    expectedOutcome: 'Observation is cryptographically timestamped and committed to the SQLite audit log.'
  },
  {
    stepNumber: 10,
    title: 'Resilient Offline Queue & Encrypted Geopackage',
    category: 'DISASTER RESILIENCE',
    view: 'inspections',
    icon: ShieldCheck,
    summary: 'Field teams in cellular dead-zones continue recording inspections via local offline storage.',
    details: 'When connectivity drops, BHU-SURAKSHA operates seamlessly on local encrypted geopackage data with exact cached counts (12 catchments, 29 historical scars, 18 lifelines), queuing field reports for auto-sync.',
    actionPrompt: 'Notice the offline sync status badge and local queue counter in the Inspections view.',
    expectedOutcome: 'Transparent offline indicator displays exact cached metrics with 1-click sync capability.'
  },
  {
    stepNumber: 11,
    title: 'Live Coordinate GPS Hazard Inspector',
    category: 'UNIVERSAL RECONNAISSANCE',
    view: 'map',
    icon: Compass,
    summary: 'Inspect geotechnical risk for ANY custom latitude and longitude coordinates across India.',
    details: 'Clicking "GPS Inspector" in the header pulls live Open-Meteo weather on the fly and passes terrain, soil, and slope parameters through the calibrated machine learning model.',
    actionPrompt: 'Open the GPS Inspector from the header toolbar to test arbitrary coordinates in Wayanad or Chamoli.',
    expectedOutcome: 'Model executes inference in <350ms returning instant hazard rating and slope stability.'
  },
  {
    stepNumber: 12,
    title: 'Executive Situation Report (SitRep) Export',
    category: 'GOVERNMENT REPORTING',
    view: 'reports',
    icon: FileText,
    summary: 'Generate standardized District Emergency Situation Report for District Collector and SDMA.',
    details: 'The executive SitRep compiles current threat levels, active alerts, vulnerable lifelines, and field squad deployments with explicit LIVE vs SIMULATION provenance stamps.',
    actionPrompt: 'Navigate to Reports view to inspect and export the Emergency Situation Briefing.',
    expectedOutcome: 'Official SitRep ready for PDF download or digital transmission to state emergency operations.'
  }
];

export const GuidedScenarioTourModal: React.FC<GuidedScenarioTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateView,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const step = SCENARIO_STEPS[currentStepIndex];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStepIndex < SCENARIO_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleJumpToView = () => {
    onNavigateView(step.view);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#070b14]/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 font-mono text-xs shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.2)] space-y-4 animate-in fade-in zoom-in duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.3)]">
              <Play size={16} className="fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-display font-extrabold text-sm tracking-tight">
                  12-Step Guided Disaster Scenario Tour
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  JUDGE EVALUATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Wayanad Cloudburst to Field Mitigation — End-to-End Operational Workflow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Tracker Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Step {step.stepNumber} of {SCENARIO_STEPS.length}: <strong className="text-amber-300">{step.category}</strong></span>
            <span className="text-slate-500">{Math.round((step.stepNumber / SCENARIO_STEPS.length) * 100)}% Completed</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              style={{ width: `${(step.stepNumber / SCENARIO_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step Content Card */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <StepIcon size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white leading-snug">
                {step.stepNumber}. {step.title}
              </h3>
              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                {step.summary}
              </p>
            </div>
          </div>

          {/* Detailed Explanation */}
          <div className="p-3 rounded-lg bg-[#050811] border border-white/[0.06] text-[11px] font-sans text-slate-300 leading-relaxed">
            <strong className="text-amber-400 font-mono text-[10px] uppercase block mb-1">Operational Architecture:</strong>
            {step.details}
          </div>

          {/* Action Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
            <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
              <strong className="text-cyan-400 block text-[10px] uppercase mb-0.5">Recommended Action:</strong>
              {step.actionPrompt}
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
              <strong className="text-emerald-400 block text-[10px] uppercase mb-0.5">Expected System Outcome:</strong>
              {step.expectedOutcome}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
          <button
            onClick={handleJumpToView}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 text-xs font-mono font-medium transition-all flex items-center gap-1.5 active:scale-95"
          >
            <ExternalLink size={12} />
            <span>Open {step.view.toUpperCase()} Screen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 disabled:opacity-40 disabled:hover:bg-white/[0.04] transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={currentStepIndex === SCENARIO_STEPS.length - 1 ? onClose : handleNext}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-[0_0_16px_rgba(245,158,11,0.4)] transition-all flex items-center gap-1 active:scale-95"
            >
              <span>{currentStepIndex === SCENARIO_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};