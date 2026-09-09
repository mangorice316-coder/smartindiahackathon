import React, { useState, useEffect, useMemo } from 'react';
import { Card, StatCard } from '../components/common/Card';
import { Table, Column } from '../components/common/Table';
import { RiskBadge } from '../components/common/Badge';
import { SimulationMap } from '../components/simulation/SimulationMap';
import {
  SimulationResponse,
  SimulationResult,
  SimulationDifferenceClass,
  SimulationTimeSeriesResponse,
  SimulationComparisonResponse,
  SimulationReportResponse
} from '../types';
import { api } from '../services/api';
import {
  PlaySquare,
  AlertTriangle,
  ArrowUpRight,
  CloudRain,
  Building2,
  ShieldAlert,
  Layers,
  BarChart3,
  GitCompare,
  FileText,
  Printer,
  Download,
  RotateCcw,
  Zap,
  Info,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface SimulationViewProps {
  onRunSimulation?: (payload: {
    scenario_name: string;
    rainfall_multiplier: number;
    additional_rainfall_mm: number;
    duration_hours: number;
    saturation_override?: number;
  }) => Promise<SimulationResponse>;
}

type SimulationTab = 'map_matrix' | 'timeseries' | 'compare' | 'report';

const PRESETS = [
  { label: 'Baseline', mult: 1.0, extra: 0, hours: 24, name: 'Baseline Conditions (0% Surge)' },
  { label: '+10% Surge', mult: 1.1, extra: 10, hours: 12, name: 'Minor Surge (+10% / +10mm)' },
  { label: '+25% Surge', mult: 1.25, extra: 25, hours: 24, name: 'Moderate Monsoon Surge (+25% / +25mm)' },
  { label: '+50% Deluge', mult: 1.50, extra: 50, hours: 24, name: 'Severe Deluge (+50% / +50mm)' },
  { label: '+75% Squall', mult: 1.75, extra: 75, hours: 24, name: 'Intense Synoptic Squall (+75% / +75mm)' },
  { label: '+100% 10-Yr', mult: 2.00, extra: 100, hours: 24, name: '10-Year Cloudburst Storm (+100% / +100mm)' },
  { label: '+150% 50-Yr', mult: 2.50, extra: 150, hours: 48, name: '50-Year Return Inundation (+150% / +150mm)' },
  { label: '+200% Catastrophic', mult: 3.00, extra: 200, hours: 48, name: 'Catastrophic Extreme Deluge (+200% / +200mm)' }
];

export const SimulationView: React.FC<SimulationViewProps> = ({ onRunSimulation }) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<SimulationTab>('map_matrix');

  // Simulation Parameters
  const [multiplier, setMultiplier] = useState<number>(1.5);
  const [additionalMm, setAdditionalMm] = useState<number>(50.0);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [saturationOverride, setSaturationOverride] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>('Severe Deluge (+50% / +50mm)');

  // Execution & Output State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [mapLayer, setMapLayer] = useState<'difference' | 'scenario' | 'baseline'>('difference');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [cacheStats, setCacheStats] = useState<{ hits: number; misses: number; size: number } | null>(null);

  // Table Filters
  const [diffFilter, setDiffFilter] = useState<'ALL' | SimulationDifferenceClass>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Timeseries Projection State
  const [timeseriesLocationId, setTimeseriesLocationId] = useState<number>(1);
  const [timeseriesData, setTimeseriesData] = useState<SimulationTimeSeriesResponse | null>(null);
  const [isLoadingTimeseries, setIsLoadingTimeseries] = useState<boolean>(false);

  // Comparison State
  const [compareMultA, setCompareMultA] = useState<number>(1.25);
  const [compareExtraA, setCompareExtraA] = useState<number>(25.0);
  const [compareMultB, setCompareMultB] = useState<number>(2.00);
  const [compareExtraB, setCompareExtraB] = useState<number>(100.0);
  const [comparisonResult, setComparisonResult] = useState<SimulationComparisonResponse | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState<boolean>(false);

  // SITREP Report State
  const [reportData, setReportData] = useState<SimulationReportResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  // Execute Simulation
  const handleExecute = async () => {
    setIsRunning(true);
    try {
      const payload = {
        scenario_name: scenarioName,
        rainfall_multiplier: multiplier,
        additional_rainfall_mm: additionalMm,
        duration_hours: durationHours,
        saturation_override: saturationOverride ? 0.95 : undefined
      };

      let res: SimulationResponse;
      if (onRunSimulation) {
        res = await onRunSimulation(payload);
      } else {
        res = await api.runSimulation(payload);
      }
      setSimResult(res);

      // Refresh cache stats
      api.getSimulationCacheStats().then(setCacheStats).catch(() => null);

      // If location is selected, refresh timeseries
      if (timeseriesLocationId) {
        loadTimeseries(timeseriesLocationId, multiplier, additionalMm, durationHours);
      }
    } catch (err: any) {
      console.error('Simulation run failed:', err);
      alert(err.message || 'Simulation execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleExecute();
  }, []);

  // Preset setter
  const applyPreset = (mult: number, extra: number, hours: number, name: string) => {
    setMultiplier(mult);
    setAdditionalMm(extra);
    setDurationHours(hours);
    setScenarioName(name);
  };

  // Load timeseries projection
  const loadTimeseries = async (locId: number, mult: number, extra: number, hours: number) => {
    setIsLoadingTimeseries(true);
    try {
      const ts = await api.getSimulationTimeSeries({
        location_id: locId,
        rainfall_multiplier: mult,
        additional_rainfall_mm: extra,
        duration_hours: hours
      });
      setTimeseriesData(ts);
    } catch (e) {
      console.warn('Could not fetch live timeseries projection:', e);
    } finally {
      setIsLoadingTimeseries(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'timeseries' && timeseriesLocationId) {
      loadTimeseries(timeseriesLocationId, multiplier, additionalMm, durationHours);
    }
  }, [activeTab, timeseriesLocationId]);

  // Run Scenario Comparison
  const handleRunComparison = async () => {
    setIsLoadingComparison(true);
    try {
      const res = await api.compareSimulations({
        scenario_a: {
          rainfall_multiplier: compareMultA,
          additional_rainfall_mm: compareExtraA,
          duration_hours: durationHours
        },
        scenario_b: {
          rainfall_multiplier: compareMultB,
          additional_rainfall_mm: compareExtraB,
          duration_hours: durationHours
        }
      });
      setComparisonResult(res);
    } catch (e: any) {
      alert(e.message || 'Comparison failed');
    } finally {
      setIsLoadingComparison(false);
    }
  };

  // Load SITREP report
  const handleLoadReport = async () => {
    setIsLoadingReport(true);
    try {
      const rep = await api.getSimulationReport({
        scenario_name: scenarioName,
        rainfall_multiplier: multiplier,
        additional_rainfall_mm: additionalMm,
        duration_hours: durationHours,
        saturation_override: saturationOverride ? 0.95 : undefined
      });
      setReportData(rep);
    } catch (e: any) {
      alert(e.message || 'Report generation failed');
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'report' && (!reportData || reportData.scenario_name !== scenarioName)) {
      handleLoadReport();
    }
  }, [activeTab]);

  // Filtered Catchment Results
  const filteredResults = useMemo(() => {
    if (!simResult?.results) return [];
    return simResult.results.filter((item) => {
      // Diff class filter
      if (diffFilter !== 'ALL') {
        const itemClass = item.difference_class || (item.risk_score_delta >= 5 ? 'RISK_INCREASED' : 'UNCHANGED');
        if (itemClass !== diffFilter) return false;
      }
      // District filter
      if (districtFilter !== 'ALL' && item.district && item.district !== districtFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.location_name.toLowerCase().includes(q);
        const matchDist = (item.district || '').toLowerCase().includes(q);
        if (!matchName && !matchDist) return false;
      }
      return true;
    });
  }, [simResult, diffFilter, districtFilter, searchQuery]);

  // Unique districts for filter
  const districts = useMemo(() => {
    if (!simResult?.results) return [];
    const set = new Set<string>();
    simResult.results.forEach((r) => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set);
  }, [simResult]);

  // Table Columns
  const tableColumns: Column<SimulationResult>[] = [
    {
      key: 'location_name',
      header: 'Catchment Zone',
      render: (item) => (
        <div
          onClick={() => {
            setSelectedLocationId(item.location_id);
            setTimeseriesLocationId(item.location_id);
          }}
          className="cursor-pointer group"
        >
          <div className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
            <span>{item.location_name}</span>
            {selectedLocationId === item.location_id && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
            <span>{item.district || 'Western Ghats'}</span>
            {item.affected_population && (
              <span>Pop: {item.affected_population.toLocaleString()}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'baseline_risk_score',
      header: 'Baseline',
      render: (item) => (
        <div className="space-y-1">
          <RiskBadge category={item.baseline_category} score={item.baseline_risk_score} size="sm" />
          <div className="text-[10px] font-mono text-slate-500">Fs: {item.baseline_fs.toFixed(2)}</div>
        </div>
      )
    },
    {
      key: 'simulated_risk_score',
      header: 'Simulated',
      render: (item) => (
        <div className="space-y-1">
          <RiskBadge category={item.simulated_category} score={item.simulated_risk_score} size="sm" />
          <div className="text-[10px] font-mono">
            Fs:{' '}
            <span
              className={
                item.simulated_fs < 1.0
                  ? 'text-red-400 font-bold underline'
                  : item.simulated_fs < 1.2
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }
            >
              {item.simulated_fs.toFixed(2)}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'risk_score_delta',
      header: 'Delta (ΔR)',
      render: (item) => {
        const isSurge = item.risk_score_delta >= 5;
        const isDrop = item.risk_score_delta < 0;
        return (
          <div className="space-y-0.5">
            <span
              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                isSurge
                  ? 'bg-red-950/70 text-red-300 border border-red-800/60'
                  : isDrop
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {item.risk_score_delta > 0 ? `+${item.risk_score_delta.toFixed(1)}` : item.risk_score_delta.toFixed(1)}
            </span>
            <div className="text-[9px] font-mono uppercase text-slate-500 mt-1">
              {item.difference_class?.replace('_', ' ') || 'STEADY'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'affected_infrastructure',
      header: 'Threatened Infrastructure',
      render: (item) => (
        item.affected_infrastructure_names && item.affected_infrastructure_names.length > 0 ? (
          <div className="space-y-0.5 font-mono text-[11px] text-amber-300">
            {item.affected_infrastructure_names.slice(0, 2).map((name, i) => (
              <div key={i} className="truncate max-w-[180px]">
                • {name}
              </div>
            ))}
            {item.affected_infrastructure_names.length > 2 && (
              <span className="text-slate-500 text-[10px]">
                +{item.affected_infrastructure_names.length - 2} more lifelines
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-600 font-mono text-[11px]">No active breaches</span>
        )
      )
    },
    {
      key: 'actions',
      header: 'Analysis',
      render: (item) => (
        <button
          onClick={() => {
            setTimeseriesLocationId(item.location_id);
            setActiveTab('timeseries');
          }}
          className="px-2 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 rounded text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition-colors"
        >
          <BarChart3 size={11} />
          <span>Hyetograph</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* 1. Mandatory Scientific Decision Support Banner */}
      <div className="p-3.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-slate-300 shadow-md flex items-start gap-3">
        <Info size={20} className="text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-300 uppercase tracking-wide">
              Scientific Decision Support Notice (Zero-Mutation Policy)
            </span>
            <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 rounded text-[10px] border border-cyan-800">
              PHYSICS + ML COUPLED
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            What-if simulations evaluate geotechnical slope equilibrium ($F_s$) and active machine learning risk
            inferences against in-memory scenario clones. Historical sensor records and database baselines remain 100%
            immutable. Non-rainfall physical parameters (slope, elevation, soil cohesion, bulk density, internal friction
            angle, geology, and land cover) are strictly preserved.
          </p>
        </div>
      </div>

      {/* 2. Simulation Control Deck */}
      <Card
        title="Rainfall What-If Simulation Deck"
        subtitle="Configure hypothetical precipitation surge scenarios and recalculate catchment hazard in real-time"
        action={
          cacheStats && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              <Zap size={12} className="text-amber-400" />
              <span>
                Cache: {cacheStats.hits} hits / {cacheStats.misses} misses ({cacheStats.size} active)
              </span>
              <button
                onClick={async () => {
                  await api.clearSimulationCache();
                  setCacheStats(null);
                }}
                title="Flush scenario LRU cache"
                className="text-slate-500 hover:text-red-400 transition-colors ml-1"
              >
                <RotateCcw size={10} />
              </button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {/* Presets */}
          <div>
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <span>Standard Presets & Return Periods:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
              {PRESETS.map((p) => {
                const isActive = multiplier === p.mult && additionalMm === p.extra;
                return (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.mult, p.extra, p.hours, p.name)}
                    className={`px-2 py-1.5 text-center rounded font-mono text-xs transition-all border ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-500 shadow-sm font-bold'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <div className="truncate font-semibold">{p.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">+{p.extra}mm</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
            {/* Multiplier Slider */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Precipitation Multiplier</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {multiplier.toFixed(2)}x ({((multiplier - 1.0) * 100).toFixed(0)}%)
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3.5}
                step={0.05}
                value={multiplier}
                onChange={(e) => {
                  const m = parseFloat(e.target.value);
                  setMultiplier(m);
                  setScenarioName(`Custom Deluge (${(m * 100).toFixed(0)}% Rainfall / +${additionalMm}mm)`);
                }}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5x (-50%)</span>
                <span>1.0x (Base)</span>
                <span>2.0x (+100%)</span>
                <span>3.5x (+250%)</span>
              </div>
            </div>

            {/* Direct Additional Rainfall Slider */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Direct Additional Deluge</span>
                <span className="text-orange-400 font-bold text-sm">+{additionalMm.toFixed(0)} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={5}
                value={additionalMm}
                onChange={(e) => {
                  const mm = parseFloat(e.target.value);
                  setAdditionalMm(mm);
                  setScenarioName(`Custom Deluge (${(multiplier * 100).toFixed(0)}% Rainfall / +${mm}mm)`);
                }}
                className="w-full accent-orange-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>+0 mm</span>
                <span>+100 mm</span>
                <span>+200 mm</span>
                <span>+300 mm</span>
              </div>
            </div>

            {/* Storm Duration */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Deluge Duration</span>
                <span className="text-slate-200 font-bold">{durationHours} Hours</span>
              </div>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={3}>3 Hours (Flash Cloudburst)</option>
                <option value={6}>6 Hours (Severe Convective Cell)</option>
                <option value={12}>12 Hours (Torrential Squall Line)</option>
                <option value={24}>24 Hours (Diurnal Monsoon Surge)</option>
                <option value={48}>48 Hours (Continuous Synoptic Low)</option>
                <option value={72}>72 Hours (Multi-Day Tropical Depression)</option>
              </select>
              <div className="text-[10px] text-slate-500">Pore pressure saturation timeframe</div>
            </div>

            {/* Saturation Override & Scenario Title */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pore-Water Saturation</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saturationOverride}
                    onChange={(e) => setSaturationOverride(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span className={`text-[11px] font-bold ${saturationOverride ? 'text-amber-400' : 'text-slate-400'}`}>
                    {saturationOverride ? 'FORCED (95%)' : 'Coupled (Δθ)'}
                  </span>
                </label>
              </div>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario Label..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              {simResult?.active_model_version && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Model: {simResult.active_model_version}
                </span>
              )}
              {simResult?.from_cache && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Zap size={11} />
                  Instant Cache Hit
                </span>
              )}
            </div>

            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all shadow-lg shadow-cyan-500/20"
            >
              <PlaySquare size={14} />
              <span>{isRunning ? 'CALCULATING GEOTECHNICAL SLOPES...' : 'EXECUTE WHAT-IF SIMULATION'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Top KPI Stat Cards */}
      {simResult && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Evaluated Catchments"
            value={simResult.locations_evaluated}
            unit="zones"
            icon={<Layers size={18} />}
          />
          <StatCard
            label="Escalated Zones"
            value={simResult.escalated_zones_count}
            unit={`/ ${simResult.locations_evaluated}`}
            alert={simResult.escalated_zones_count > 0}
            change={simResult.escalated_zones_count > 0 ? 'Risk category escalated' : 'No tier transitions'}
            changeType={simResult.escalated_zones_count > 0 ? 'negative' : 'positive'}
            icon={<ArrowUpRight size={18} />}
          />
          <StatCard
            label="Newly Critical Zones"
            value={simResult.newly_critical_count}
            alert={simResult.newly_critical_count > 0}
            change={simResult.newly_critical_count > 0 ? 'Critical intervention alert' : '0 zones breached 70'}
            changeType={simResult.newly_critical_count > 0 ? 'negative' : 'neutral'}
            icon={<ShieldAlert size={18} />}
          />
          <StatCard
            label="Additional Pop. At Risk"
            value={simResult.total_additional_population_exposed.toLocaleString()}
            unit="residents"
            icon={<Building2 size={18} />}
          />
          <StatCard
            label="Applied Rainfall Surge"
            value={`${(simResult.parameters.rainfall_multiplier * 100).toFixed(0)}%`}
            unit={`+${simResult.parameters.additional_rainfall_mm}mm`}
            icon={<CloudRain size={18} />}
          />
        </div>
      )}

      {/* 4. Tab Navigation */}
      <div className="flex border-b border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab('map_matrix')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'map_matrix'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={14} />
          <span>Spatial Map & Catchment Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('timeseries')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'timeseries'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 size={14} />
          <span>Hourly Storm Hyetograph & Decay</span>
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'compare'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare size={14} />
          <span>Scenario Comparison (A vs B)</span>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'report'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={14} />
          <span>SITREP Report & Export</span>
        </button>
      </div>

      {/* 5. TAB CONTENT */}

      {/* TAB 1: SPATIAL MAP & CATCHMENT MATRIX */}
      {activeTab === 'map_matrix' && simResult && (
        <div className="space-y-4">
          {/* Map Section */}
          <SimulationMap
            results={simResult.results}
            activeLayer={mapLayer}
            onChangeLayer={setMapLayer}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(locId) => {
              setSelectedLocationId(locId);
              setTimeseriesLocationId(locId);
            }}
            height="440px"
          />

          {/* Matrix & Filtering Card */}
          <Card
            title={`Catchment Impact Matrix (${filteredResults.length} / ${simResult.results.length} Zones)`}
            subtitle="Detailed geotechnical equilibrium (Fs) and active ML risk transition per catchment"
            action={
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search catchment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-36"
                />

                {/* District Filter */}
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="ALL">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Difference Class Filter */}
                <select
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="ALL">All Transitions</option>
                  <option value="NEWLY_CRITICAL">Newly Critical</option>
                  <option value="NEWLY_HIGH">Newly High</option>
                  <option value="RISK_INCREASED">Risk Increased (ΔR ≥ 5)</option>
                  <option value="UNCHANGED">Unchanged / Resilient</option>
                </select>
              </div>
            }
          >
            <Table columns={tableColumns} data={filteredResults} emptyMessage="No catchments match active filters." />
          </Card>
        </div>
      )}

      {/* TAB 2: HOURLY STORM HYETOGRAPH & DECAY */}
      {activeTab === 'timeseries' && (
        <div className="space-y-4">
          <Card
            title="Hourly Deluge Hyetograph & Factor of Safety Degradation"
            subtitle="Projects hourly rainfall distribution, cumulative precipitation, and progressive geotechnical slope decay"
            action={
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Target Catchment:</span>
                <select
                  value={timeseriesLocationId}
                  onChange={(e) => setTimeseriesLocationId(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                >
                  {simResult?.results.map((r) => (
                    <option key={r.location_id} value={r.location_id}>
                      {r.location_name} ({r.district})
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            {isLoadingTimeseries ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                Computing hourly rainfall distribution and slope pore-pressure decay...
              </div>
            ) : timeseriesData ? (
              <div className="space-y-6">
                {/* Meta Banner */}
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 flex flex-wrap justify-between items-center text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Zone: </span>
                    <strong className="text-cyan-300">{timeseriesData.location_name}</strong>
                    <span className="text-slate-500 ml-2">({timeseriesData.district})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Duration: </span>
                    <strong className="text-slate-200">{timeseriesData.duration_hours} Hours</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">End Fs: </span>
                    <strong
                      className={
                        timeseriesData.series[timeseriesData.series.length - 1]?.projected_fs < 1.0
                          ? 'text-red-400 font-bold'
                          : 'text-cyan-400'
                      }
                    >
                      {timeseriesData.series[timeseriesData.series.length - 1]?.projected_fs.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Peak Risk: </span>
                    <strong className="text-amber-400">
                      {Math.max(...timeseriesData.series.map((p) => p.projected_risk_score)).toFixed(1)}
                    </strong>
                  </div>
                </div>

                {/* Responsive Dual-Axis SVG Hyetograph & Risk Decay Chart */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <span className="w-3 h-3 bg-cyan-500 rounded-sm" />
                        Simulated Hourly Rain (mm)
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <span className="w-3 h-1 bg-blue-400 rounded-sm" />
                        Cumulative Rain (mm)
                      </span>
                      <span className="flex items-center gap-1.5 text-red-400 font-bold">
                        <span className="w-3 h-1 bg-red-400 rounded-sm" />
                        Risk Score (0-100)
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-3 h-1 bg-emerald-400 rounded-sm" />
                        Factor of Safety (Fs)
                      </span>
                    </div>
                    <span className="text-slate-500">Pore pressure threshold Fs = 1.0 (Limit Equilibrium)</span>
                  </div>

                  {/* SVG Chart Visualization */}
                  <div className="w-full overflow-x-auto">
                    <svg viewBox="0 0 800 240" className="w-full h-56 font-mono text-[9px] select-none">
                      {/* Grid Lines */}
                      <line x1="40" y1="30" x2="770" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="40" y1="80" x2="770" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="40" y1="130" x2="770" y2="130" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="40" y1="180" x2="770" y2="180" stroke="#1e293b" strokeDasharray="3 3" />

                      {/* Critical Threshold Line (Risk = 70) */}
                      <line x1="40" y1="65" x2="770" y2="65" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                      <text x="772" y="68" fill="#ef4444" fontSize="8">
                        CRITICAL (70)
                      </text>

                      {/* Failure Threshold Line (Fs = 1.0) */}
                      <line x1="40" y1="145" x2="770" y2="145" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                      <text x="772" y="148" fill="#f59e0b" fontSize="8">
                        Fs = 1.0
                      </text>

                      {/* Left Axis Label */}
                      <text x="10" y="25" fill="#94a3b8" fontSize="8">
                        Score / Fs
                      </text>
                      <text x="15" y="68" fill="#94a3b8">
                        70
                      </text>
                      <text x="15" y="115" fill="#94a3b8">
                        50
                      </text>
                      <text x="15" y="160" fill="#94a3b8">
                        25
                      </text>
                      <text x="15" y="205" fill="#94a3b8">
                        0
                      </text>

                      {/* Hourly Bars & Lines */}
                      {(() => {
                        const count = timeseriesData.series.length;
                        const stepX = (730 - 40) / Math.max(1, count - 1);
                        const maxRain = Math.max(10, ...timeseriesData.series.map((p) => p.simulated_hourly_mm));

                        // Generate Path Points
                        const riskPoints = timeseriesData.series.map((p, i) => {
                          const x = 40 + i * stepX;
                          // Risk score 0 to 100 mapped to y=200 down to y=20
                          const y = 200 - (p.projected_risk_score / 100) * 180;
                          return `${x},${y}`;
                        });

                        const fsPoints = timeseriesData.series.map((p, i) => {
                          const x = 40 + i * stepX;
                          // Fs 0.0 to 2.5 mapped to y=200 down to y=30
                          const clampedFs = Math.max(0, Math.min(2.5, p.projected_fs));
                          const y = 200 - (clampedFs / 2.5) * 170;
                          return `${x},${y}`;
                        });

                        return (
                          <>
                            {/* Rainfall Bars */}
                            {timeseriesData.series.map((p, i) => {
                              const x = 40 + i * stepX - 4;
                              const barH = (p.simulated_hourly_mm / maxRain) * 70;
                              const y = 200 - barH;
                              return (
                                <g key={`bar-${i}`}>
                                  <rect
                                    x={x}
                                    y={y}
                                    width={Math.max(3, stepX * 0.4)}
                                    height={barH}
                                    fill="#06b6d4"
                                    opacity="0.65"
                                    rx="1"
                                  />
                                  {/* X-axis label */}
                                  {(i % 3 === 0 || i === count - 1) && (
                                    <text x={x} y="215" fill="#64748b" textAnchor="middle" fontSize="8">
                                      T+{p.hour}h
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* Risk Score Polyline */}
                            <polyline
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={riskPoints.join(' ')}
                            />

                            {/* Factor of Safety Polyline */}
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                              strokeDasharray="2 1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={fsPoints.join(' ')}
                            />

                            {/* Points on lines */}
                            {timeseriesData.series.map((p, i) => {
                              const x = 40 + i * stepX;
                              const ry = 200 - (p.projected_risk_score / 100) * 180;
                              return (
                                <circle
                                  key={`c-${i}`}
                                  cx={x}
                                  cy={ry}
                                  r="3"
                                  fill={p.projected_risk_score >= 70 ? '#ef4444' : '#f59e0b'}
                                  stroke="#0f172a"
                                  strokeWidth="1"
                                />
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Hourly Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border border-slate-800 rounded">
                    <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2">Hour</th>
                        <th className="p-2">Simulated Rain (mm)</th>
                        <th className="p-2">Cumulative Rain (mm)</th>
                        <th className="p-2">Projected Risk</th>
                        <th className="p-2">Factor of Safety (Fs)</th>
                        <th className="p-2">Risk Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {timeseriesData.series.map((pt) => (
                        <tr key={pt.hour} className="hover:bg-slate-900/40">
                          <td className="p-2 text-slate-300 font-bold">T + {pt.hour}h</td>
                          <td className="p-2 text-cyan-400 font-semibold">{pt.simulated_hourly_mm.toFixed(1)} mm</td>
                          <td className="p-2 text-blue-300">{pt.cumulative_simulated_mm.toFixed(1)} mm</td>
                          <td className="p-2 font-bold text-amber-300">{pt.projected_risk_score.toFixed(1)}</td>
                          <td className="p-2">
                            <span className={pt.projected_fs < 1.0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                              {pt.projected_fs.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-2">
                            <RiskBadge category={pt.projected_category as any} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                Select a catchment zone to visualize hourly deluge evolution.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: SCENARIO COMPARISON (A vs B) */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <Card
            title="Scenario Differential Analysis (Scenario A vs Scenario B)"
            subtitle="Quantifies differential catchment risk shifts and population exposure between two distinct precipitation surges"
          >
            <div className="space-y-4">
              {/* Configuration Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scenario A */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2 font-mono text-xs">
                  <div className="text-cyan-400 font-bold uppercase flex items-center justify-between">
                    <span>Scenario A (Moderate Reference)</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                      {(compareMultA * 100).toFixed(0)}% (+{compareExtraA}mm)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px]">Multiplier</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.5"
                        max="3.0"
                        value={compareMultA}
                        onChange={(e) => setCompareMultA(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Additional mm</span>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="300"
                        value={compareExtraA}
                        onChange={(e) => setCompareExtraA(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Scenario B */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2 font-mono text-xs">
                  <div className="text-red-400 font-bold uppercase flex items-center justify-between">
                    <span>Scenario B (Severe Surge)</span>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">
                      {(compareMultB * 100).toFixed(0)}% (+{compareExtraB}mm)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px]">Multiplier</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.5"
                        max="3.5"
                        value={compareMultB}
                        onChange={(e) => setCompareMultB(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Additional mm</span>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="300"
                        value={compareExtraB}
                        onChange={(e) => setCompareExtraB(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRunComparison}
                  disabled={isLoadingComparison}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5"
                >
                  <GitCompare size={14} />
                  <span>{isLoadingComparison ? 'COMPUTING DIFFERENTIAL MATRIX...' : 'COMPUTE SCENARIO A vs B'}</span>
                </button>
              </div>

              {/* Comparison Results */}
              {comparisonResult && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard
                      label="Escalated in Scenario B"
                      value={comparisonResult.escalated_in_b_count}
                      unit={`/ ${comparisonResult.total_locations_compared} zones`}
                      alert={comparisonResult.escalated_in_b_count > 0}
                      icon={<ArrowUpRight size={18} />}
                    />
                    <StatCard
                      label="Newly Critical in B"
                      value={comparisonResult.newly_critical_in_b_count}
                      alert={comparisonResult.newly_critical_in_b_count > 0}
                      icon={<ShieldAlert size={18} />}
                    />
                    <StatCard
                      label="Net Additional Pop. Exposed"
                      value={comparisonResult.net_additional_population_exposed.toLocaleString()}
                      unit="residents"
                      icon={<Building2 size={18} />}
                    />
                  </div>

                  {/* Differential Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border border-slate-800 rounded">
                      <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-2">Catchment Zone</th>
                          <th className="p-2">Scenario A</th>
                          <th className="p-2">Scenario B</th>
                          <th className="p-2">Differential (B - A)</th>
                          <th className="p-2">Fs Shift</th>
                          <th className="p-2">Newly Exposed Lifelines in B</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {comparisonResult.results.map((r) => (
                          <tr key={r.location_id} className="hover:bg-slate-900/40">
                            <td className="p-2 font-semibold text-slate-200">
                              <div>{r.location_name}</div>
                              <span className="text-[10px] text-slate-500">{r.district}</span>
                            </td>
                            <td className="p-2">
                              <RiskBadge category={r.category_a} score={r.score_a} size="sm" />
                            </td>
                            <td className="p-2">
                              <RiskBadge category={r.category_b} score={r.score_b} size="sm" />
                            </td>
                            <td className="p-2">
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  r.score_delta_b_minus_a > 0
                                    ? 'bg-red-950 text-red-300 border border-red-800'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {r.score_delta_b_minus_a > 0 ? `+${r.score_delta_b_minus_a.toFixed(1)}` : r.score_delta_b_minus_a.toFixed(1)}
                              </span>
                            </td>
                            <td className="p-2 text-slate-400 text-[11px]">
                              {r.fs_a.toFixed(2)} &rarr;{' '}
                              <strong className={r.fs_b < 1.0 ? 'text-red-400' : 'text-slate-200'}>
                                {r.fs_b.toFixed(2)}
                              </strong>
                            </td>
                            <td className="p-2 text-amber-300 text-[11px]">
                              {r.newly_exposed_lifelines_in_b && r.newly_exposed_lifelines_in_b.length > 0 ? (
                                r.newly_exposed_lifelines_in_b.join(', ')
                              ) : (
                                <span className="text-slate-600">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: SITREP REPORT & EXPORT */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <Card
            title="EOC Situation Assessment Report (Simulation SITREP)"
            subtitle="Standardized disaster authority decision-support document with executive metrics and lifeline exposure"
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700 flex items-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Print SITREP</span>
                </button>
                {reportData && (
                  <>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `SITREP_Simulation_${reportData.report_id}.json`;
                        a.click();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700 flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        const content = reportData.formatted_content || JSON.stringify(reportData, null, 2);
                        const blob = new Blob([content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `SITREP_Simulation_${reportData.report_id}.md`;
                        a.click();
                      }}
                      className="px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 rounded text-xs font-mono border border-cyan-700 flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Markdown</span>
                    </button>
                  </>
                )}
              </div>
            }
          >
            {isLoadingReport ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                Compiling multi-catchment SITREP report...
              </div>
            ) : reportData ? (
              <div className="space-y-6 text-slate-200 font-mono text-xs">
                {/* Header Header */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-red-400 font-bold uppercase tracking-wider text-sm">
                        [SIMULATION EXERCISE // FOR SITUATIONAL PLANNING ONLY]
                      </div>
                      <h2 className="text-base font-bold text-slate-100 mt-1">
                        SITREP: {reportData.scenario_name}
                      </h2>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <div>Report ID: {reportData.report_id}</div>
                      <div>Generated: {new Date(reportData.generated_at).toLocaleString()}</div>
                      <div>Model: {reportData.model_version}</div>
                    </div>
                  </div>
                </div>

                {/* Executive Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded">
                    <span className="text-slate-400 text-[10px] uppercase">Evaluated Catchments</span>
                    <div className="text-xl font-bold text-slate-100 mt-0.5">
                      {reportData.executive_summary.total_locations_evaluated}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/80 border border-red-900/40 rounded">
                    <span className="text-red-400 text-[10px] uppercase">Newly Critical Zones</span>
                    <div className="text-xl font-bold text-red-400 mt-0.5">
                      {reportData.executive_summary.newly_critical_count}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/80 border border-orange-900/40 rounded">
                    <span className="text-orange-400 text-[10px] uppercase">Newly High Zones</span>
                    <div className="text-xl font-bold text-orange-400 mt-0.5">
                      {reportData.executive_summary.newly_high_count}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded">
                    <span className="text-slate-400 text-[10px] uppercase">Threatened Lifeline Assets</span>
                    <div className="text-xl font-bold text-amber-300 mt-0.5">
                      {reportData.executive_summary.total_threatened_lifeline_assets}
                    </div>
                  </div>
                </div>

                {/* Critical Lifelines Breached */}
                {reportData.critical_lifelines_exposed.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-bold text-amber-400 uppercase text-xs">
                      Critical Lifelines Exposed in Saturated Run ({reportData.critical_lifelines_exposed.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {reportData.critical_lifelines_exposed.map((asset, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-slate-900/60 border border-amber-800/40 rounded flex justify-between items-center text-[11px]"
                        >
                          <div>
                            <div className="font-bold text-slate-200">{asset.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {asset.location} ({asset.district}) • {asset.asset_type}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">
                            Tier {asset.lifeline_tier}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catchment Details Table */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-300 uppercase text-xs">Catchment Shift Matrix:</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border border-slate-800 rounded">
                      <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-2">Location</th>
                          <th className="p-2">Baseline</th>
                          <th className="p-2">Simulated</th>
                          <th className="p-2">Delta</th>
                          <th className="p-2">Fs Shift</th>
                          <th className="p-2">Transition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {reportData.catchment_details.map((c) => (
                          <tr key={c.location_id}>
                            <td className="p-2 font-semibold text-slate-200">
                              {c.location_name} <span className="text-[10px] text-slate-500">({c.district})</span>
                            </td>
                            <td className="p-2">
                              {c.baseline_score.toFixed(1)} ({c.baseline_category})
                            </td>
                            <td className="p-2 font-bold text-red-400">
                              {c.simulated_score.toFixed(1)} ({c.simulated_category})
                            </td>
                            <td className="p-2 font-bold text-amber-300">
                              {c.delta > 0 ? `+${c.delta.toFixed(1)}` : c.delta.toFixed(1)}
                            </td>
                            <td className="p-2 text-slate-400">
                              {c.baseline_fs.toFixed(2)} &rarr;{' '}
                              <strong className={c.simulated_fs < 1.0 ? 'text-red-400' : 'text-slate-200'}>
                                {c.simulated_fs.toFixed(2)}
                              </strong>
                            </td>
                            <td className="p-2 text-[10px] uppercase text-cyan-300">
                              {c.difference_class.replace('_', ' ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Limitations & Legal Disclaimer */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-300 uppercase">Scientific Assumptions & Modeling Limitations:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                    {reportData.limitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                  <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-900">
                    {reportData.disclaimer}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                Click above to generate the formal situation assessment report.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
