import React, { useState, useMemo } from 'react';
import { DashboardOverview, RiskAssessment } from '../types';
import { Card, StatCard } from '../components/common/Card';
import { RiskBadge, SeverityBadge, UrgencyBadge } from '../components/common/Badge';
import { Table, Column } from '../components/common/Table';
import { ExplainabilityModal } from '../components/xai/ExplainabilityModal';
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
  Radio
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
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');

  if (!overview) return null;

  // Extract available districts
  const districts = useMemo(() => {
    const dSet = new Set<string>();
    overview.highest_risk_locations.forEach((loc) => {
      if (loc.district) dSet.add(loc.district);
    });
    return Array.from(dSet).sort();
  }, [overview]);

  // Filtered highest-risk locations
  const filteredLocations = useMemo(() => {
    let list = [...overview.highest_risk_locations];
    if (categoryFilter !== 'ALL') {
      list = list.filter((l) => l.risk_category === categoryFilter);
    }
    if (districtFilter !== 'ALL') {
      list = list.filter((l) => l.district?.toLowerCase() === districtFilter.toLowerCase());
    }
    return list;
  }, [overview, categoryFilter, districtFilter]);

  const highestRiskColumns: Column<RiskAssessment>[] = [
    {
      key: 'location_name',
      header: 'Catchment / Sector',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{item.location_name}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono pl-3">{item.district}</div>
        </div>
      ),
    },
    {
      key: 'overall_risk_score',
      header: 'Risk Classification',
      sortable: true,
      render: (item) => <RiskBadge category={item.risk_category} score={item.overall_risk_score} />,
    },
    {
      key: 'geotechnical_fs',
      header: 'Factor of Safety (Fs)',
      sortable: true,
      render: (item) => (
        <span
          className={`font-mono font-bold text-xs ${
            item.geotechnical_fs < 1.0
              ? 'text-red-400 font-extrabold'
              : item.geotechnical_fs < 1.3
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
          title="Planar infinite slope equilibrium: Fs < 1.0 indicates critical shear failure"
        >
          {item.geotechnical_fs.toFixed(2)} ({item.geotechnical_stability})
        </span>
      ),
    },
    {
      key: 'hazard_score',
      header: 'Hazard / Exposure',
      sortable: true,
      render: (item) => (
        <div className="font-mono text-xs text-slate-300">
          <span className="text-orange-400 font-semibold">H: {item.hazard_score.toFixed(0)}</span>
          <span className="text-slate-600 mx-1">/</span>
          <span className="text-cyan-400 font-semibold">E: {item.exposure_score.toFixed(0)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setXaiTarget({ id: item.location_id, name: item.location_name });
            }}
            className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1"
            title="Open Deep Explainable AI (XAI) Attribution"
          >
            <Sparkles size={11} className="text-cyan-400" />
            <span>Explain</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectLocation(item.location_id);
              onNavigate('map');
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-[11px] font-mono transition-colors"
            title="Focus Catchment on GIS Risk Map"
          >
            GIS Map
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP SITUATION COMMAND BAR                                              */}
      {/* ========================================================================= */}
      <div className="p-[1px] rounded-2xl bg-gradient-to-r from-red-500/30 via-white/[0.08] to-cyan-500/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="rounded-[calc(1rem-1px)] bg-gradient-to-r from-[#14080e]/95 via-[#080d18]/95 to-[#06121a]/95 p-5 flex flex-wrap items-center justify-between gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-bold text-lg text-white tracking-tight">
                Operational Situation Briefing
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-red-500/15 text-red-400 border border-red-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <Flame size={11} className="text-red-400" />
                STAGE 3 ESCALATING
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed max-w-3xl">
              Wayanad &amp; Himalayan Foothill Basins • Severe monsoon squall driving elevated pore pressures &amp; shallow slope instability across monitored sub-catchments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            <button
              onClick={() => onNavigate('simulation')}
              className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(6,182,212,0.1)] active:scale-[0.98]"
            >
              <span>Rainfall Simulator</span>
              <ChevronRight size={13} className="text-cyan-400" />
            </button>
            <button
              onClick={() => onNavigate('alerts')}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-[0.98]"
            >
              <span>Dispatch CAP Directives</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FOUR CLEAN KPI METRIC CARDS                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Critical Zones (Fs < 1.0)"
          value={overview.critical_zones_count}
          unit={`/ ${overview.total_monitored_zones}`}
          alert={overview.critical_zones_count > 0}
          icon={<ShieldAlert size={16} />}
          change="Immediate Life-Safety Risk"
          changeType="negative"
        />
        <StatCard
          label="Active CAP Alerts"
          value={overview.active_alerts_count}
          alert={overview.active_alerts_count > 0}
          icon={<AlertTriangle size={16} />}
          change="Evacuation Directives Issued"
          changeType="negative"
        />
        <StatCard
          label="Peak 24h Rainfall"
          value={overview.max_24h_rainfall_mm}
          unit="mm"
          icon={<CloudRain size={16} />}
          change="Antecedent 72h: 320mm"
          changeType="neutral"
        />
        <StatCard
          label="Field Squads Ready"
          value="8 Teams"
          icon={<ClipboardCheck size={16} />}
          change={`${overview.pending_inspections_count} Pending P1 Missions`}
          changeType="positive"
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. BALANCED TWO-COLUMN DASHBOARD GRID                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 of 12 cols): PRIORITY RANKING & ROOT CAUSE */}
        <div className="lg:col-span-7 space-y-4">
          {/* Priority Catchments Table */}
          <Card
            title="Sub-Catchment Threat Priority Ranking"
            subtitle="Ranked by f(Hazard, Exposure, Geotechnical Fs). Select a sector to focus on GIS canvas."
            action={
              <button
                onClick={() => onNavigate('map')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1"
              >
                <span>Full GIS Map</span>
                <ChevronRight size={13} />
              </button>
            }
          >
            {/* Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">Filter Tier:</span>
                {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      categoryFilter === cat
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {districts.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">District:</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Table
              columns={highestRiskColumns}
              data={filteredLocations}
              pageSize={5}
              initialSortKey="overall_risk_score"
              initialSortDirection="desc"
              onRowClick={(item) => {
                onSelectLocation(item.location_id);
                onNavigate('map');
              }}
            />
          </Card>

          {/* Physics & ML Root Cause Decomposition */}
          <Card
            title="Geotechnical & Environmental Root Cause (Physics + ML)"
            subtitle="Coupled Mohr-Coulomb limit equilibrium & explainable ML feature attribution"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              {/* Factor 1 */}
              <div className="p-3.5 bg-white/[0.02] border border-white/[0.07] hover:border-sky-500/30 rounded-xl space-y-2 flex flex-col justify-between transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div>
                  <div className="flex items-center justify-between text-sky-400 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <CloudRain size={13} />
                      <span>ANTECEDENT RAIN</span>
                    </span>
                    <span className="text-[10px] text-sky-300 font-mono">API_72 &gt; 180mm</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    72-hour precipitation has saturated the saprolite mantle, dissipating negative suction stress and raising the perched water table.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.06] flex justify-between">
                  <span>Impact:</span>
                  <strong className="text-red-400">+28.4% to Total Risk</strong>
                </div>
              </div>

              {/* Factor 2 */}
              <div className="p-3.5 bg-white/[0.02] border border-white/[0.07] hover:border-orange-500/30 rounded-xl space-y-2 flex flex-col justify-between transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div>
                  <div className="flex items-center justify-between text-orange-400 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Compass size={13} />
                      <span>TERRAIN GRADIENT</span>
                    </span>
                    <span className="text-[10px] text-orange-300 font-mono">Slope: 36.5°</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Topographic slope angle (36.5°) significantly exceeds the internal friction angle of weathered colluvial soil (phi' = 28.0°).
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.06] flex justify-between">
                  <span>Shear Force:</span>
                  <strong className="text-orange-400">+18.2% Gravitational</strong>
                </div>
              </div>

              {/* Factor 3 */}
              <div className="p-3.5 bg-white/[0.02] border border-white/[0.07] hover:border-red-500/30 rounded-xl space-y-2 flex flex-col justify-between transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div>
                  <div className="flex items-center justify-between text-rose-400 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Layers size={13} />
                      <span>LIMIT EQUILIBRIUM</span>
                    </span>
                    <span className="text-[10px] text-red-400 font-bold font-mono">Fs = 0.88</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Infinite-slope mechanics prove Fs &lt; 1.0 under positive pore pressures (ru = 0.52). Driving gravitational force exceeds resisting shear.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.06] flex justify-between">
                  <span>Stability:</span>
                  <strong className="text-red-400 uppercase">Structurally Unstable</strong>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 of 12 cols): INFRASTRUCTURE, WARNINGS, DIRECTIVES */}
        <div className="lg:col-span-5 space-y-4">
          {/* Lifelines at Risk */}
          <Card
            title="Critical Lifelines at Risk"
            subtitle="Assets located within high-hazard danger runout zones"
            action={
              <button
                onClick={() => onNavigate('infrastructure')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            }
          >
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-xl flex items-center justify-between transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                    <Building2 size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Community Health Centre</div>
                    <div className="text-[11px] text-slate-400 font-sans">Tier 1 Lifeline • Chooralmala</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                  850m Buffer
                </span>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-xl flex items-center justify-between transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Layers size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Chooralmala Bailey Bridge</div>
                    <div className="text-[11px] text-slate-400 font-sans">Sole Evacuation Corridor</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                  Critical
                </span>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] rounded-xl flex items-center justify-between transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Compass size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">State Highway 59 (Pass)</div>
                    <div className="text-[11px] text-slate-400 font-sans">Tier 2 Arterial • Heavy Transit</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Partial Halt
                  </span>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-road-modal'))}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
                    title="Inspect cut-slope stability, culvert clogging risk and safety factor"
                  >
                    Cut-Slope AI
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Active Emergency Alerts */}
          <Card
            title="Active Warning Directives (CAP v1.2)"
            subtitle={`${overview.critical_alerts.length} active civil defense advisories`}
            action={
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1"
              >
                <span>All Alerts</span>
                <ChevronRight size={13} />
              </button>
            }
          >
            <div className="space-y-2">
              {overview.critical_alerts.slice(0, 2).map((alt) => (
                <div key={alt.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <SeverityBadge severity={alt.severity} />
                    <span className="text-[10px] font-mono text-slate-400">{alt.district}</span>
                  </div>
                  <div className="font-semibold text-slate-200">{alt.location_name}</div>
                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2">{alt.trigger_condition}</p>
                </div>
              ))}
              {overview.critical_alerts.length === 0 && (
                <div className="text-center py-3 text-slate-500 font-mono text-xs">
                  No active emergency alerts.
                </div>
              )}
            </div>
          </Card>

          {/* Decision Support Directives */}
          <Card
            title="Emergency Action Directives"
            subtitle="Multi-agency operational protocols generated by Decision Engine"
          >
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-red-400 text-[10px]">DIR 01</span>
                    <span className="text-slate-200 font-sans font-semibold text-xs">Broadcast CAP Evacuation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Chooralmala riverbank settlements (1.5km zone)</p>
                </div>
                <button
                  onClick={() => onNavigate('alerts')}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Dispatch</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-orange-400 text-[10px]">DIR 02</span>
                    <span className="text-slate-200 font-sans font-semibold text-xs">Deploy Geotech Squad Alpha</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Inspect expanding crown tension cracks (18.5mm)</p>
                </div>
                <button
                  onClick={() => onNavigate('inspections')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-300 border border-slate-700 rounded text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Deploy</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-cyan-400 text-[10px]">DIR 03</span>
                    <span className="text-slate-200 font-sans font-semibold text-xs">Stress-Test +50% Deluge</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Simulate overnight cloudburst scenario</p>
                </div>
                <button
                  onClick={() => onNavigate('simulation')}
                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Simulate</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-amber-400 text-[10px]">DIR 04</span>
                    <span className="text-slate-200 font-sans font-semibold text-xs">Record Ground Crack Tension</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Citizen &amp; patrol crack width loop (recalibrates risk)</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-incident-modal'))}
                  className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                  title="Open Ground Crack / Tension Fissure Verification Modal"
                >
                  <span>Report Crack</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-purple-400 text-[10px]">DIR 05</span>
                    <span className="text-slate-200 font-sans font-semibold text-xs">Sentinel-1/2 Satellite AI Analysis</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">Multispectral NDVI delta &amp; SAR coherence loss detection</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-satellite-modal'))}
                  className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                  title="Open Sentinel-2 MSI & Sentinel-1 SAR Remote Sensing Modal"
                >
                  <span>Inspect Radar</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Explainable AI (XAI) Modal */}
      <ExplainabilityModal
        isOpen={!!xaiTarget}
        onClose={() => setXaiTarget(null)}
        locationId={xaiTarget?.id}
        locationName={xaiTarget?.name}
      />
    </div>
  );
};
