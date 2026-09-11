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
  AlertCircle,
  ExternalLink,
  ChevronRight
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
          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] border ${
            item.geotechnical_fs < 1.0
              ? 'bg-red-950/70 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
              : item.geotechnical_fs < 1.3
              ? 'bg-amber-950/70 text-amber-300 border-amber-500/50'
              : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
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
        <div className="font-mono text-[11px] flex items-center gap-1.5">
          <span className="text-orange-400 font-semibold">H: {item.hazard_score.toFixed(0)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-400 font-semibold">E: {item.exposure_score.toFixed(0)}</span>
        </div>
      ),
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
            className="group px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 rounded-full text-[11px] font-mono transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.15)] hover:scale-105"
            title="Open Deep Explainable AI (XAI) Attribution"
          >
            <Sparkles size={11} className="text-cyan-400 transition-transform group-hover:rotate-12" />
            <span>Explain</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectLocation(item.location_id);
              onNavigate('map');
            }}
            className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 rounded-full text-[11px] font-mono transition-all hover:border-white/20"
            title="Focus Catchment on GIS Risk Map"
          >
            GIS Map
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* ========================================================================= */}
      {/* 1. SITUATIONAL COMMAND HERO (High-Impact Operational Situation Strip)    */}
      {/* ========================================================================= */}
      <div className="p-[1.5px] rounded-3xl bg-gradient-to-r from-red-500/40 via-amber-500/20 to-cyan-500/20 shadow-2xl">
        <div className="p-4 sm:p-5 rounded-[calc(1.5rem-1.5px)] bg-gradient-to-b from-[#130d18]/95 via-[#0b101b]/95 to-[#070b14]/98 backdrop-blur-2xl space-y-4 relative overflow-hidden shadow-inner">
          {/* Ambient Top Glow Line */}
          <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-red-400/40 to-transparent pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span className="font-mono font-bold text-[11px] text-red-300 tracking-wider">LIVE EOC INCIDENT</span>
              </div>
              <div>
                <h2 className="font-display font-extrabold text-sm sm:text-base text-slate-100 tracking-tight flex items-center gap-2">
                  <span>Operational Situation: Active Monsoon Deluge</span>
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Wayanad &amp; Himalayan Foothills • Severe convective squall triggering high ground saturation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 font-semibold text-[11px]">THREAT STAGE:</span>
              <span className="px-3 py-1 rounded-full bg-red-950/90 border border-red-500 text-red-200 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-1.5">
                <Flame size={12} className="text-red-400 animate-pulse" />
                <span>ESCALATING (STAGE 3)</span>
              </span>
            </div>
          </div>

          {/* 5 High-Density Operational Telemetry StatCards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              label="Critical Zones (Fs < 1.0)"
              value={overview.critical_zones_count}
              unit={`/ ${overview.total_monitored_zones}`}
              alert={overview.critical_zones_count > 0}
              icon={<ShieldAlert size={16} />}
              change="Immediate Life-Safety Risk"
              changeType="negative"
              glow="rose"
            />
            <StatCard
              label="Active CAP Alerts"
              value={overview.active_alerts_count}
              alert={overview.active_alerts_count > 0}
              icon={<AlertTriangle size={16} />}
              change="Evacuation Directives Active"
              changeType="negative"
              glow="rose"
            />
            <StatCard
              label="Peak 24h Rainfall"
              value={overview.max_24h_rainfall_mm}
              unit="mm"
              icon={<CloudRain size={16} />}
              change="Antecedent 72h: 320mm"
              changeType="neutral"
              glow="cyan"
            />
            <StatCard
              label="Exposed Population"
              value="23,100"
              icon={<Users size={16} />}
              change="4 Monitored Basins"
              changeType="neutral"
              glow="amber"
            />
            <StatCard
              label="Field Squads"
              value="8 Teams"
              icon={<ClipboardCheck size={16} />}
              change={`${overview.pending_inspections_count} Pending P1 Missions`}
              changeType="positive"
              glow="emerald"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ASYMMETRICAL BENTO GRID: WHERE IS RISK? & WHY IS IT HAPPENING?         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): WHERE IS THE RISK? Prioritized Sub-Catchments Table */}
        <div className="lg:col-span-2 space-y-5">
          <Card
            title="WHERE IS THE RISK? — Sub-Catchment Priority Ranking"
            subtitle="Ranked by f(Hazard, Exposure, Geotechnical Fs). Select a sector to focus on GIS canvas."
            action={
              <button
                onClick={() => onNavigate('map')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 font-bold transition-all hover:translate-x-0.5"
              >
                <span>OPEN FULL GIS CANVAS</span>
                <ChevronRight size={13} />
              </button>
            }
          >
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-white/[0.06] text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">RISK TIER:</span>
                {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      categoryFilter === cat
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                        : 'text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {districts.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">DISTRICT:</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="bg-[#0b101b] border border-white/10 rounded-full px-3 py-0.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400 shadow-inner"
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
          {/* 3. WHY IS IT HAPPENING? (Physical-ML Root Cause Decomposition)         */}
          {/* ===================================================================== */}
          <Card
            title="WHY IS IT HAPPENING? — Geotechnical & Environmental Root Cause"
            subtitle="Physics-ML coupled breakdown: Explainable factors driving high slope instability"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-mono">
              {/* Factor 1 */}
              <div className="p-[1px] rounded-xl bg-gradient-to-b from-sky-500/30 to-transparent">
                <div className="p-3.5 bg-gradient-to-b from-[#0c1322] to-[#080d16] rounded-[calc(0.75rem-1px)] space-y-2 h-full flex flex-col justify-between shadow-inner">
                  <div>
                    <div className="flex items-center justify-between text-sky-400 font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CloudRain size={14} />
                        <span>ANTECEDENT RAIN</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/40 text-sky-300">
                        API_72 &gt; 180mm
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      Cumulative 72-hour precipitation has saturated the saprolite mantle, dissipating negative suction stress and elevating pore water pressure.
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span>Impact Attribution:</span>
                    <strong className="text-red-400 font-bold font-mono">+28.4% Risk</strong>
                  </div>
                </div>
              </div>

              {/* Factor 2 */}
              <div className="p-[1px] rounded-xl bg-gradient-to-b from-orange-500/30 to-transparent">
                <div className="p-3.5 bg-gradient-to-b from-[#140e11] to-[#080d16] rounded-[calc(0.75rem-1px)] space-y-2 h-full flex flex-col justify-between shadow-inner">
                  <div>
                    <div className="flex items-center justify-between text-orange-400 font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Compass size={14} />
                        <span>TERRAIN GRADIENT</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-300">
                        Slope: 36.5°
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      Natural topography slope angle (36.5°) significantly exceeds the internal friction angle of weathered colluvial soil (phi' = 28.0°).
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span>Shear Stress:</span>
                    <strong className="text-orange-400 font-bold font-mono">+18.2% Gravitational</strong>
                  </div>
                </div>
              </div>

              {/* Factor 3 */}
              <div className="p-[1px] rounded-xl bg-gradient-to-b from-purple-500/30 to-transparent">
                <div className="p-3.5 bg-gradient-to-b from-[#120c1c] to-[#080d16] rounded-[calc(0.75rem-1px)] space-y-2 h-full flex flex-col justify-between shadow-inner">
                  <div>
                    <div className="flex items-center justify-between text-purple-400 font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Layers size={14} />
                        <span>LIMIT EQUILIBRIUM</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-bold">
                        Fs = 0.88
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      Infinite-slope planar failure mechanics prove Fs &lt; 1.0 under positive pore pressures (ru = 0.52). Driving gravitational force exceeds resisting shear.
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span>Stability Status:</span>
                    <strong className="text-red-400 font-bold font-mono uppercase">Unstable</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): WHAT INFRASTRUCTURE IS AFFECTED & ACTIVE DIRECTIVES */}
        <div className="space-y-5">
          {/* ===================================================================== */}
          {/* 4. WHAT INFRASTRUCTURE IS AFFECTED? (Lifeline Exposure Analysis)       */}
          {/* ===================================================================== */}
          <Card
            title="AFFECTED INFRASTRUCTURE"
            subtitle="Lifelines inside high-hazard runout corridors"
            action={
              <button
                onClick={() => onNavigate('infrastructure')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
              >
                <span>ASSETS</span>
                <ChevronRight size={12} />
              </button>
            }
          >
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-950/80 text-red-400 border border-red-500/40 rounded-lg">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">Community Health Centre</div>
                    <div className="text-[10px] text-slate-400 font-sans">Tier 1 Lifeline • Chooralmala</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/50">
                  850m Buffer
                </span>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-950/80 text-purple-400 border border-purple-500/40 rounded-lg">
                    <Layers size={14} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">Chooralmala Bailey Bridge</div>
                    <div className="text-[10px] text-slate-400 font-sans">Sole Evacuation Corridor</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/50">
                  Critical
                </span>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-950/80 text-amber-400 border border-amber-500/40 rounded-lg">
                    <Compass size={14} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">State Highway 59 (Pass)</div>
                    <div className="text-[10px] text-slate-400 font-sans">Tier 2 Arterial • Heavy Transit</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
                  Partial Halt
                </span>
              </div>
            </div>
          </Card>

          {/* Active Emergency Warning Directives (CAP v1.2) */}
          <Card
            title="Active Warning Directives (CAP v1.2)"
            subtitle={`${overview.critical_alerts.length} active civil protection dispatches`}
            action={
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
              >
                <span>ALERTS</span>
                <ChevronRight size={12} />
              </button>
            }
          >
            <div className="space-y-2.5">
              {overview.critical_alerts.slice(0, 2).map((alt) => (
                <div key={alt.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs space-y-1.5 hover:bg-white/[0.04] transition-colors">
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

          {/* Field Squad Deployments */}
          <Card
            title="Field Inspection Deployment"
            subtitle="Prioritized squad tasking queue (P1 - P4)"
            action={
              <button
                onClick={() => onNavigate('inspections')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
              >
                <span>QUEUE</span>
                <ChevronRight size={12} />
              </button>
            }
          >
            <div className="space-y-2.5">
              {overview.top_inspections.slice(0, 2).map((insp) => (
                <div key={insp.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs flex items-center justify-between hover:bg-white/[0.04] transition-colors">
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
      {/* 5. WHAT SHOULD HAPPEN NEXT? (Decision-Support Directives with Nested CTAs)  */}
      {/* ========================================================================= */}
      <div className="p-[1px] rounded-2xl bg-gradient-to-b from-cyan-500/40 via-blue-500/20 to-transparent shadow-2xl">
        <div className="p-5 rounded-[calc(1rem-1px)] bg-gradient-to-b from-[#0e1626]/95 via-[#0b101b]/95 to-[#070b14]/98 space-y-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-500/50 rounded-xl shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <h3 className="font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider text-cyan-300">
                  WHAT SHOULD HAPPEN NEXT? — Emergency Decision Directives
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Actionable multi-agency protocols generated by the Decision Support Engine
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full font-bold shadow-sm">
              EOC PROTOCOL LEVEL 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {/* Directive 1 */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3 flex flex-col justify-between hover:border-red-500/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-red-400 text-[10px] tracking-wider">DIRECTIVE 01</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-red-950/80 text-red-200 border border-red-500/60 font-bold">IMMEDIATE</span>
                </div>
                <h4 className="font-bold text-slate-100 font-sans text-xs">Broadcast OASIS CAP Alert</h4>
                <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                  Send cell-broadcast evacuation order for Chooralmala riverbank settlements within 1.5km runout zone.
                </p>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="w-full py-2 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-full text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Dispatch CAP Alert</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Directive 2 */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3 flex flex-col justify-between hover:border-orange-500/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-orange-400 text-[10px] tracking-wider">DIRECTIVE 02</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-950/80 text-orange-200 border border-orange-500/60 font-bold">P1 SQUADS</span>
                </div>
                <h4 className="font-bold text-slate-100 font-sans text-xs">Deploy Geotech Squad Alpha</h4>
                <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                  Inspect expanding crown tension cracks (18.5mm reported) and measure toe seepage at transmission tower.
                </p>
              </div>
              <button
                onClick={() => onNavigate('inspections')}
                className="w-full py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-orange-300 border border-orange-500/40 font-bold rounded-full text-[11px] transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Assign Field Squad</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Directive 3 */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-400 text-[10px] tracking-wider">DIRECTIVE 03</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-950/80 text-amber-200 border border-amber-500/60 font-bold">TRANSIT</span>
                </div>
                <h4 className="font-bold text-slate-100 font-sans text-xs">Reroute Heavy Vehicles</h4>
                <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                  Restrict commercial transit over Chooralmala Bailey Bridge to prevent structural dynamic overload during surge.
                </p>
              </div>
              <button
                onClick={() => onNavigate('infrastructure')}
                className="w-full py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-amber-500/40 font-bold rounded-full text-[11px] transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Manage Lifelines</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Directive 4 */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3 flex flex-col justify-between hover:border-cyan-500/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-cyan-400 text-[10px] tracking-wider">DIRECTIVE 04</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-cyan-950/80 text-cyan-200 border border-cyan-500/60 font-bold">PREDICTIVE</span>
                </div>
                <h4 className="font-bold text-slate-100 font-sans text-xs">Stress-Test +50% Deluge</h4>
                <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                  Run isolated what-if simulation to forecast slope stability if overnight cloudburst dumps an additional 50mm.
                </p>
              </div>
              <button
                onClick={() => onNavigate('simulation')}
                className="w-full py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-full text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Run Simulator</span>
                <ArrowRight size={12} />
              </button>
            </div>
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
