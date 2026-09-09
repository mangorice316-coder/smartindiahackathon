import React, { useState, useMemo } from 'react';
import { DashboardOverview, RiskAssessment, RiskCategory } from '../types';
import { Card, StatCard } from '../components/common/Card';
import { RiskBadge, SeverityBadge, StatusBadge, UrgencyBadge } from '../components/common/Badge';
import { Table, Column } from '../components/common/Table';
import { ExplainabilityModal } from '../components/xai/ExplainabilityModal';
import {
  ShieldAlert,
  MapPin,
  CloudRain,
  AlertTriangle,
  ClipboardCheck,
  Activity,
  Sparkles,
  ArrowRight,
  Compass,
  Layers,
  Building2,
  Users,
  CheckCircle2,
  Flame,
  Radio,
  FileText,
  AlertCircle
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
          <div className="font-semibold text-slate-100">{item.location_name}</div>
          <div className="text-[11px] text-slate-400 font-mono">{item.district}</div>
        </div>
      )
    },
    {
      key: 'overall_risk_score',
      header: 'Risk Classification',
      sortable: true,
      render: (item) => <RiskBadge category={item.risk_category} score={item.overall_risk_score} />
    },
    {
      key: 'geotechnical_fs',
      header: 'Factor of Safety (Fs)',
      sortable: true,
      render: (item) => (
        <span
          className={`font-mono font-bold ${
            item.geotechnical_fs < 1.0 ? 'text-red-400' : item.geotechnical_fs < 1.3 ? 'text-amber-400' : 'text-emerald-400'
          }`}
          title="Planar infinite slope equilibrium: Fs < 1.0 indicates critical shear failure"
        >
          {item.geotechnical_fs.toFixed(2)} ({item.geotechnical_stability})
        </span>
      )
    },
    {
      key: 'hazard_score',
      header: 'Hazard / Exposure',
      sortable: true,
      render: (item) => (
        <div className="font-mono text-[11px]">
          <span className="text-orange-400 font-semibold">H: {item.hazard_score.toFixed(0)}</span>
          <span className="text-slate-500 mx-1">|</span>
          <span className="text-cyan-400 font-semibold">E: {item.exposure_score.toFixed(0)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Operational Actions',
      sortable: false,
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setXaiTarget({ id: item.location_id, name: item.location_name });
            }}
            className="px-2 py-1 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded text-[11px] font-mono transition-colors flex items-center gap-1"
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
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-mono transition-colors"
            title="Focus Catchment on GIS Risk Map"
          >
            GIS Map
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. WHAT IS HAPPENING? (Current Operational Situation & Incident Summary)  */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-800/50 rounded-lg p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-600/90 text-white rounded font-mono font-black text-xs animate-pulse">
              LIVE EOC
            </span>
            <div>
              <h2 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide">
                Operational Situation Summary: Active Monsoon Deluge
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Wayanad & Himalayan Foothill Sectors • Severe convective squall triggering high saturation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Current Threat:</span>
            <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-600 text-red-300 font-bold">
              ESCALATING (STAGE 3)
            </span>
          </div>
        </div>

        {/* 5 Operational Information-Dense Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
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
            label="Peak 24h Precipitation"
            value={overview.max_24h_rainfall_mm}
            unit="mm"
            icon={<CloudRain size={16} />}
            change="Antecedent 72h: 320mm"
            changeType="neutral"
          />
          <StatCard
            label="Exposed Population"
            value="23,100"
            icon={<Users size={16} />}
            change="4 Monitored Basins"
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
      </div>

      {/* ========================================================================= */}
      {/* 2. WHERE IS THE RISK? & 3. WHY IS IT HAPPENING? (Main Dual-Grid Layout)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): WHERE IS THE RISK? Prioritized Sub-Catchments Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="WHERE IS THE RISK? — Sub-Catchment Priority Ranking"
            subtitle="Ranked by f(Hazard, Exposure, Geotechnical Fs). Select a sector to inspect on GIS canvas."
            action={
              <button
                onClick={() => onNavigate('map')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 font-semibold"
              >
                <span>OPEN FULL GIS CANVAS</span>
                <span>&rarr;</span>
              </button>
            }
          >
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">RISK TIER:</span>
                {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      categoryFilter === cat
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {districts.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">DISTRICT:</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-300 font-sans focus:outline-none focus:border-cyan-400"
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

          {/* ===================================================================== */}
          {/* 3. WHY IS IT HAPPENING? (Root Cause & Geotechnical Driver Decomposition) */}
          {/* ===================================================================== */}
          <Card
            title="WHY IS IT HAPPENING? — Geotechnical & Environmental Root Cause"
            subtitle="Physics-ML coupled breakdown: Why the model flags these catchments as unstable"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              {/* Factor 1 */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1.5">
                <div className="flex items-center justify-between text-sky-400 font-bold">
                  <span className="flex items-center gap-1">
                    <CloudRain size={13} />
                    <span>ANTECEDENT RAIN</span>
                  </span>
                  <span className="text-[11px] text-sky-300">API_72 &gt; 180mm</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  Cumulative 72-hour precipitation has saturated the saprolite mantle, dissipating negative pore-water suction stress and raising the perched water table.
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Impact: <strong className="text-red-400">+28.4%</strong> to total risk score
                </div>
              </div>

              {/* Factor 2 */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1.5">
                <div className="flex items-center justify-between text-orange-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Compass size={13} />
                    <span>TERRAIN GRADIENT</span>
                  </span>
                  <span className="text-[11px] text-orange-300">Slope: 36.5°</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  Natural topography slope angle (36.5°) significantly exceeds the effective internal friction angle of weathered colluvial soil (phi' = 28.0°).
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Impact: <strong className="text-orange-400">+18.2%</strong> driving shear stress
                </div>
              </div>

              {/* Factor 3 */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1.5">
                <div className="flex items-center justify-between text-purple-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Layers size={13} />
                    <span>LIMIT EQUILIBRIUM</span>
                  </span>
                  <span className="text-[11px] text-red-400 font-bold">Fs = 0.88</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  Planar infinite-slope mechanics prove Fs &lt; 1.0 under positive pore pressures (ru = 0.52). Driving gravitational force exceeds resisting shear strength.
                </p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Status: <strong className="text-red-400">STRUCTURALLY UNSTABLE</strong>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): WHAT INFRASTRUCTURE IS AFFECTED & ACTIVE ALERTS */}
        <div className="space-y-4">
          {/* ===================================================================== */}
          {/* 4. WHAT INFRASTRUCTURE IS AFFECTED? (Lifeline Exposure Analysis)       */}
          {/* ===================================================================== */}
          <Card
            title="WHAT INFRASTRUCTURE IS AFFECTED?"
            subtitle="Lifelines located within high-hazard runout corridors"
            action={
              <button
                onClick={() => onNavigate('infrastructure')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                VIEW ASSETS &rarr;
              </button>
            }
          >
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-950/80 text-red-400 border border-red-700/60 rounded">
                    <Building2 size={13} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Community Health Centre</div>
                    <div className="text-[10px] text-slate-400 font-sans">Tier 1 Lifeline • Chooralmala Basin</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-600">
                  850m Buffer
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-950/80 text-purple-400 border border-purple-700/60 rounded">
                    <Layers size={13} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Chooralmala Bridge & Culvert</div>
                    <div className="text-[10px] text-slate-400 font-sans">Tier 1 Lifeline • Sole Evacuation Route</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-600">
                  Critical
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-950/80 text-orange-400 border border-orange-700/60 rounded">
                    <Compass size={13} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">State Highway 59 (Pass)</div>
                    <div className="text-[10px] text-slate-400 font-sans">Tier 2 Arterial • Heavy Transit</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600">
                  Partial Closure
                </span>
              </div>
            </div>
          </Card>

          {/* Active Emergency Alerts Card */}
          <Card
            title="Active Warning Directives (CAP v1.2)"
            subtitle={`${overview.critical_alerts.length} active civil protection dispatches`}
            action={
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                VIEW ALL &rarr;
              </button>
            }
          >
            <div className="space-y-2.5">
              {overview.critical_alerts.slice(0, 2).map((alt) => (
                <div key={alt.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <SeverityBadge severity={alt.severity} />
                    <span className="text-[10px] font-mono text-slate-400">{alt.district}</span>
                  </div>
                  <div className="font-semibold text-slate-200">{alt.location_name}</div>
                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2">{alt.trigger_condition}</p>
                </div>
              ))}
              {overview.critical_alerts.length === 0 && (
                <div className="text-center py-4 text-slate-500 font-mono text-xs">
                  No active emergency alerts.
                </div>
              )}
            </div>
          </Card>

          {/* Top Priority Inspections */}
          <Card
            title="Field Inspection Queue"
            subtitle="Prioritized squad deployment (P1 to P4)"
            action={
              <button
                onClick={() => onNavigate('inspections')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                DISPATCH &rarr;
              </button>
            }
          >
            <div className="space-y-2">
              {overview.top_inspections.slice(0, 2).map((insp) => (
                <div key={insp.id} className="p-2 bg-slate-900/60 border border-slate-800 rounded text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">{insp.infrastructure_name || insp.location_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{insp.assigned_team || 'Squad Alpha (Pending)'}</div>
                  </div>
                  <UrgencyBadge tier={insp.urgency_tier} score={insp.priority_score} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. WHAT SHOULD HAPPEN NEXT? (Operational Decision-Support Action Directives) */}
      {/* ========================================================================= */}
      <div className="p-4 bg-[#111827] border border-cyan-800/60 rounded-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-cyan-950 text-cyan-400 border border-cyan-700/60 rounded">
              <CheckCircle2 size={15} />
            </span>
            <div>
              <h3 className="font-display font-bold text-xs uppercase tracking-wide text-cyan-300">
                WHAT SHOULD HAPPEN NEXT? — Emergency Decision Directives
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Actionable multi-agency protocols generated by the Decision Support Engine
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded">
            EOC PROTOCOL LEVEL 2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
          {/* Directive 1 */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-red-400 text-[10px]">DIRECTIVE 01</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-950 text-red-300 border border-red-700">IMMEDIATE</span>
              </div>
              <h4 className="font-bold text-slate-200 font-sans text-xs">Broadcast OASIS CAP Alert</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Send cell-broadcast evacuation order for Chooralmala riverbank settlements within 1.5km runout zone.
              </p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="w-full py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1"
            >
              <span>Dispatch CAP Alert</span>
              <ArrowRight size={11} />
            </button>
          </div>

          {/* Directive 2 */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-orange-400 text-[10px]">DIRECTIVE 02</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-orange-950 text-orange-300 border border-orange-700">P1 SQUADS</span>
              </div>
              <h4 className="font-bold text-slate-200 font-sans text-xs">Deploy Geotech Squad Alpha</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Inspect expanding crown tension cracks (18.5mm reported) and measure toe seepage at transmission tower.
              </p>
            </div>
            <button
              onClick={() => onNavigate('inspections')}
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-orange-300 border border-orange-700/50 font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1"
            >
              <span>Assign Field Squad</span>
              <ArrowRight size={11} />
            </button>
          </div>

          {/* Directive 3 */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-400 text-[10px]">DIRECTIVE 03</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-950 text-amber-300 border border-amber-700">TRANSIT</span>
              </div>
              <h4 className="font-bold text-slate-200 font-sans text-xs">Reroute Heavy Vehicles</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Restrict commercial transit over Chooralmala Bailey Bridge to prevent structural dynamic overload during surge.
              </p>
            </div>
            <button
              onClick={() => onNavigate('infrastructure')}
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-700/50 font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1"
            >
              <span>Manage Lifelines</span>
              <ArrowRight size={11} />
            </button>
          </div>

          {/* Directive 4 */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-cyan-400 text-[10px]">DIRECTIVE 04</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700">PREDICTIVE</span>
              </div>
              <h4 className="font-bold text-slate-200 font-sans text-xs">Stress-Test +50% Deluge</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Run isolated what-if simulation to forecast slope stability if overnight cloudburst dumps an additional 50mm.
              </p>
            </div>
            <button
              onClick={() => onNavigate('simulation')}
              className="w-full py-1.5 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1"
            >
              <span>Run Simulator</span>
              <ArrowRight size={11} />
            </button>
          </div>
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
