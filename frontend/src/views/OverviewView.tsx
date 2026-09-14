import React, { useState, useMemo } from 'react';
import { DashboardOverview, RiskAssessment, BreadcrumbItem } from '../types';
import { IncidentHeroPanel } from '../components/common/IncidentHeroPanel';
import { CoreAnalyticsCards } from '../components/common/CoreAnalyticsCards';
import { OperationalDirectives } from '../components/common/OperationalDirectives';
import { KpiCard } from '../components/common/KpiCard';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { ExplainabilityModal } from '../components/xai/ExplainabilityModal';
import { ExportReportModal } from '../components/common/ExportReportModal';
import {
  ShieldAlert,
  CloudRain,
  AlertTriangle,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  Compass,
  Layers,
  Building2,
  ChevronRight,
  Flame,
  Radio,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Send,
  Eye,
  Activity,
  Download,
  FileDown
} from 'lucide-react';

interface OverviewViewProps {
  overview: DashboardOverview | null;
  onNavigate: (view: any) => void;
  onSelectLocation: (locId: number) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overview,
  onNavigate,
  onSelectLocation,
}) => {
  const [xaiTarget, setXaiTarget] = useState<{ id: number; name: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeHorizon, setActiveHorizon] = useState<'0-6h' | '24h' | '72h'>('0-6h');
  const [selectedBreadcrumbs, setSelectedBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 'ind', label: 'India', level: 'country' },
    { id: 'kl', label: 'Kerala', level: 'state' },
    { id: 'wynd', label: 'Wayanad', level: 'district' },
    { id: 'mppd', label: 'Meppadi', level: 'taluk' },
    { id: 'chrl', label: 'Chooralmala Catchment', level: 'zone' },
  ]);

  if (!overview) return null;

  const briefing = overview.operational_briefing || {
    primary_incident: 'Monsoon Cloudburst Surge — Wayanad Foothills',
    current_severity: 'CRITICAL',
    risk_trend: 'ESCALATING',
    trend_pct: 14.8,
    time_horizon: 'IMMEDIATE (0-6 Hours)',
    primary_trigger_summary: `Antecedent deluge (${overview.max_24h_rainfall_mm}mm 24h peak) has brought saprolite regolith past critical saturation; Fs dropped to 0.88 in Chooralmala.`,
    top_threat_sector: 'Chooralmala (Wayanad)',
    confidence_score: 96.5,
  };

  const highestRisk = overview.highest_risk_locations[0] || {
    location_id: 1,
    location_name: 'Chooralmala',
    district: 'Wayanad',
    risk_category: 'CRITICAL',
    overall_risk_score: 94.2,
    geotechnical_fs: 0.88,
    precipitation_24h_mm: 442.5,
  };

  const handleBreadcrumbLevel = (item: BreadcrumbItem) => {
    const idx = selectedBreadcrumbs.findIndex(b => b.id === item.id);
    if (idx !== -1) {
      setSelectedBreadcrumbs(selectedBreadcrumbs.slice(0, idx + 1));
    }
  };

  const handleResetBreadcrumbs = () => {
    setSelectedBreadcrumbs([
      { id: 'ind', label: 'India', level: 'country' },
      { id: 'wynd', label: 'All Vulnerable Zones', level: 'zone' },
    ]);
  };

  // Table Columns
  const catchmentColumns: ColumnDef<RiskAssessment>[] = [
    {
      key: 'location_name',
      header: 'CATCHMENT SECTOR',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass size={13} />
          </div>
          <div>
            <span className="font-bold text-white block text-xs">{row.location_name}</span>
            <span className="text-[10px] font-mono text-slate-400">{row.district}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'risk_category',
      header: 'RISK SEVERITY',
      sortable: true,
      render: (row) => {
        const isCritical = row.risk_category === 'CRITICAL';
        const isHigh = row.risk_category === 'HIGH';
        return (
          <span
            className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 w-fit ${
              isCritical
                ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                : isHigh
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-400 animate-ping' : isHigh ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span>{row.risk_category}</span>
          </span>
        );
      },
    },
    {
      key: 'overall_risk_score',
      header: 'RISK INDEX',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-black text-white">
          {row.overall_risk_score.toFixed(1)} / 100
        </span>
      ),
    },
    {
      key: 'geotechnical_fs',
      header: 'FACTOR OF SAFETY (Fs)',
      sortable: true,
      align: 'right',
      render: (row) => {
        const isFailure = row.geotechnical_fs < 1.0;
        return (
          <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
            <span className={`font-black ${isFailure ? 'text-red-400' : 'text-emerald-400'}`}>
              Fs {row.geotechnical_fs.toFixed(2)}
            </span>
            {isFailure && (
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/30 text-red-200 border border-red-500/40">
                LIMIT
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'INVESTIGATION',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setXaiTarget({ id: row.location_id, name: row.location_name })}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-semibold transition-all active:scale-95"
            title="Inspect Saabas Shapley feature attribution tree"
          >
            <Sparkles size={11} className="text-purple-400" />
            <span>XAI Physics</span>
          </button>
          <button
            onClick={() => {
              onSelectLocation(row.location_id);
              onNavigate('map');
            }}
            className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-cyan-300 border border-white/[0.07] transition-all"
            title="Focus Catchment on GIS Map"
          >
            <Eye size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="C2 Situation Room Master Overview">
      {/* LEVEL 1: Breadcrumb Drill-Down Hierarchy */}
      <Breadcrumbs
        items={selectedBreadcrumbs}
        onSelectLevel={handleBreadcrumbLevel}
        onBack={() => {
          if (selectedBreadcrumbs.length > 1) {
            setSelectedBreadcrumbs(selectedBreadcrumbs.slice(0, -1));
          }
        }}
        onReset={handleResetBreadcrumbs}
      />

      {/* LEVEL 1: Visual Centerpiece — Incident Hero Panel */}
      <IncidentHeroPanel
        title={briefing.primary_incident}
        location={`${briefing.top_threat_sector} • 11.5365° N, 76.1322° E`}
        severity="CRITICAL"
        confidence={briefing.confidence_score}
        trendPct={briefing.trend_pct}
        activeHorizon={activeHorizon}
        onSelectHorizon={setActiveHorizon}
        onFocusMap={() => {
          onSelectLocation(highestRisk.location_id);
          onNavigate('map');
        }}
        onExportReport={() => setIsExportModalOpen(true)}
        triggerSummary={briefing.primary_trigger_summary}
      />

      {/* LEVEL 1: The 4 Core Questions (WHAT, WHERE, HOW DANGEROUS, WHY) */}
      <CoreAnalyticsCards
        onOpenXai={(locName) => setXaiTarget({ id: highestRisk.location_id, name: locName })}
        onNavigateToGis={() => {
          onSelectLocation(highestRisk.location_id);
          onNavigate('map');
        }}
        peakRainfall={overview.max_24h_rainfall_mm}
        criticalFactorOfSafety={highestRisk.geotechnical_fs}
        exposedPopulation={1420}
        primaryLocationName={highestRisk.location_name}
        porePressureKPa={68.4}
      />

      {/* LEVEL 2: 12-Column Operational Grid (8 Cols Sector Canvas / 4 Cols Command Directives) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Geotechnical Sector Failure Canvas & Telemetry */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="c2-card rounded-2xl p-5 border-[#253042] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#253042]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-sm font-bold font-sans uppercase tracking-tight text-white">
                  GEOTECHNICAL FAILURE DYNAMICS & TELEMETRY STREAM
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-cyan-300 font-mono text-[10px] font-bold">
                MOHR-COULOMB LIMIT EQUILIBRIUM
              </span>
            </div>

            {/* Geotechnical Telemetry Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">PORE PRESSURE (u)</span>
                <span className="text-lg font-black font-mono text-red-400 mt-0.5 block">68.4 kPa</span>
                <span className="text-[10px] font-mono text-slate-500">Normal: &lt; 40 kPa</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">MATRIC SUCTION</span>
                <span className="text-lg font-black font-mono text-amber-300 mt-0.5 block">0.0 kPa</span>
                <span className="text-[10px] font-mono text-red-400">100% Vanished</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">CRACK SPREAD</span>
                <span className="text-lg font-black font-mono text-purple-300 mt-0.5 block">18.2 mm</span>
                <span className="text-[10px] font-mono text-red-400">+12mm/h Widening</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">SAR COHERENCE</span>
                <span className="text-lg font-black font-mono text-cyan-300 mt-0.5 block">0.21 Loss</span>
                <span className="text-[10px] font-mono text-slate-500">Sentinel-1 Radar</span>
              </div>
            </div>

            {/* Spatial Stability Simulation Preview Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-black/50 to-amber-950/30 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-300 font-sans">
                  <ShieldAlert size={14} className="text-red-400" />
                  <span>Imminent Colluvial Planar Failure in Chooralmala Sector</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Safety factor Fs 0.88 confirms gravitational driving shear stress exceeds Mohr-Coulomb resisting shear capacity.
                </p>
              </div>

              <button
                onClick={() => onNavigate('simulation')}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Run Deluge Simulation</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Operational Command Directives with Audit Confirmation */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="c2-card rounded-2xl p-5 border-[#253042]">
            <OperationalDirectives />
          </div>
        </div>
      </div>

      {/* LEVEL 3: Reusable High-Density KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Critical Zones"
          value={overview.critical_zones_count}
          unit="/ 12"
          status="CRITICAL"
          trend="UP"
          trendValue="+2 Today"
          thresholdLabel="Fs < 1.0 (Planar slip)"
          icon={<ShieldAlert size={15} />}
        />
        <KpiCard
          label="Active CAP Alerts"
          value={overview.active_alerts_count}
          status="CRITICAL"
          trend="UP"
          trendValue="3 Evacuations"
          thresholdLabel="NDMA Warning Grid"
          icon={<AlertTriangle size={15} />}
        />
        <KpiCard
          label="Peak 24h Rainfall"
          value={overview.max_24h_rainfall_mm}
          unit="mm"
          status="WARNING"
          trend="UP"
          trendValue="38.2 mm/h Rate"
          thresholdLabel="Vythiri AWS"
          icon={<CloudRain size={15} />}
        />
        <KpiCard
          label="Field Squads Ready"
          value="8 Teams"
          status="SUCCESS"
          trend="STABLE"
          trendValue="100% Deployed"
          thresholdLabel="GSI & NDRF Units"
          icon={<ClipboardCheck size={15} />}
        />
        <KpiCard
          label="Mean Catchment Fs"
          value="1.14"
          status="WARNING"
          trend="DOWN"
          trendValue="-0.22"
          thresholdLabel="Stability Margins"
          icon={<Activity size={15} />}
        />
        <KpiCard
          label="Exposed Citizens"
          value="1,420"
          unit="Habitants"
          status="CRITICAL"
          trend="UP"
          trendValue="Runout Sector"
          thresholdLabel="Meppadi Catchment"
          icon={<Compass size={15} />}
        />
      </div>

      {/* LEVEL 4: High-Density Monitored Catchments Table */}
      <DataTable
        title="High-Threat Catchment Failure Ranking"
        subtitle="Real-time coupling of infinite-slope Mohr-Coulomb limit equilibrium with HistGradientBoosting AI"
        columns={catchmentColumns}
        data={overview.highest_risk_locations}
        searchPlaceholder="Filter catchments by name or district..."
        searchKey="location_name"
        exportFileName="BHU_SURAKSHA_Catchment_Risk_Index"
      />

      {/* Saabas Shapley XAI Explainability Modal */}
      {xaiTarget && (
        <ExplainabilityModal
          isOpen={!!xaiTarget}
          onClose={() => setXaiTarget(null)}
          locationId={xaiTarget.id}
          locationName={xaiTarget.name}
        />
      )}

      {/* Export Situation Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        incidentTitle={briefing.primary_incident}
        locationName={highestRisk.location_name}
        riskCategory={highestRisk.risk_category}
        factorOfSafety={highestRisk.geotechnical_fs}
        rainfallMm={overview.max_24h_rainfall_mm}
        confidenceScore={briefing.confidence_score}
      />
    </div>
  );
};
