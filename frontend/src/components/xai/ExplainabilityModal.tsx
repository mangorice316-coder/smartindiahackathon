import React, { useState, useEffect } from 'react';
import {
  XAIExplanationResponse,
  XAIFeatureDetail,
  RiskCategory
} from '../../types';
import { RiskBadge } from '../common/Badge';
import { api } from '../../services/api';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Info,
  Layers,
  HelpCircle,
  Users,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Mountain,
  Droplets,
  Building2,
  Clock,
  Compass,
  FileCheck,
  TrendingUp,
  Activity,
  Zap,
  BookOpen
} from 'lucide-react';

interface ExplainabilityModalProps {
  locationId?: number | null;
  customFeatures?: Record<string, any> | null;
  locationName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  locationId,
  customFeatures,
  locationName,
  isOpen,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'community' | 'analyst'>('community');
  const [data, setData] = useState<XAIExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfidenceMethodology, setShowConfidenceMethodology] = useState<boolean>(false);
  const [featureCategoryFilter, setFeatureCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    const loadExplanation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let res: XAIExplanationResponse;
        if (locationId) {
          res = await api.getLocationExplanation(locationId);
        } else if (customFeatures) {
          res = await api.explainCustomFeatures({
            features: customFeatures,
            location_name: locationName || 'Custom Catchment'
          });
        } else {
          // Fallback demo location 1
          res = await api.getLocationExplanation(1);
        }
        setData(res);
      } catch (err: any) {
        console.error('Failed to load XAI explanation:', err);
        setError(err.message || 'Failed to compute explainability report');
      } finally {
        setIsLoading(false);
      }
    };

    loadExplanation();
  }, [isOpen, locationId, customFeatures, locationName]);

  if (!isOpen) return null;

  const filteredFeatures = data?.analyst_view.all_features.filter((f) => {
    if (featureCategoryFilter === 'ALL') return true;
    return f.category === featureCategoryFilter;
  }) || [];

  const categories = Array.from(new Set(data?.analyst_view.all_features.map((f) => f.category) || []));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in font-sans">
        {/* 1. Header Toolbar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-700 rounded-lg text-cyan-400">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {data?.location_name || locationName || 'Catchment Risk Assessment'}
                </h2>
                {data && (
                  <RiskBadge
                    category={data.analyst_view.risk_category}
                    score={data.analyst_view.risk_score}
                    size="sm"
                  />
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                <span>District: {data?.district || 'Western Ghats'}</span>
                <span>•</span>
                <span>Model: {data?.model_version || 'RF_LANDSLIDE_v2.0'}</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher & Close */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1 border border-slate-800 rounded-lg flex items-center text-xs font-mono">
              <button
                onClick={() => setViewMode('community')}
                className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all ${
                  viewMode === 'community'
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users size={13} />
                <span>Public Community View</span>
              </button>
              <button
                onClick={() => setViewMode('analyst')}
                className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all ${
                  viewMode === 'analyst'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders size={13} />
                <span>Analyst / Geotechnical View</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. Metadata & Confidence Strip */}
        {data && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-3">
              {/* Confidence Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowConfidenceMethodology(!showConfidenceMethodology)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 transition-colors ${
                    data.confidence.tier === 'HIGH'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : data.confidence.tier === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-red-950 text-red-300 border-red-700'
                  }`}
                  title="Click to view confidence methodology breakdown"
                >
                  <ShieldCheck size={12} />
                  <span>{data.confidence.tier} CONFIDENCE</span>
                  <HelpCircle size={10} className="text-slate-400" />
                </button>

                {/* Confidence Methodology Popover */}
                {showConfidenceMethodology && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-80 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-slate-300 text-[11px] space-y-2">
                    <div className="font-bold text-cyan-300 flex justify-between items-center">
                      <span>Confidence Evaluation Methodology</span>
                      <span className="text-[10px] text-slate-400">{data.confidence.tier} TIER</span>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Confidence is not an invented percentage. It is computed from two verified factors:
                    </p>
                    <div className="space-y-1 bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
                      <div className="flex justify-between">
                        <span>Data Completeness (Q_d):</span>
                        <strong className="text-cyan-400">{Math.round(data.confidence.data_quality_score * 100)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Model Ensemble Consensus (A_m):</span>
                        <strong className="text-emerald-400">{Math.round(data.confidence.model_consensus_score * 100)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Inter-Tree Variance (σ²):</span>
                        <strong className="text-slate-300">{data.confidence.tree_agreement_variance}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Imputed Features Count:</span>
                        <strong className="text-amber-400">{data.confidence.imputed_features_count}</strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 italic">
                      "{data.confidence.methodology_rationale}"
                    </p>
                  </div>
                )}
              </div>

              {/* Freshness & Timestamps */}
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Clock size={12} />
                <span>Observed: {new Date(data.data_timestamp).toLocaleTimeString()}</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              Algorithm: <span className="text-slate-300">{data.algorithm}</span> ({data.is_demo ? 'Calibrated Regional Baseline' : 'Live Feeds'})
            </div>
          </div>
        )}

        {/* 3. Main Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="py-20 text-center space-y-3 font-mono text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>Generating Explainable AI (XAI) feature attribution and physical narratives...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/40 border border-red-700 rounded-lg text-red-300 font-mono text-xs">
              {error}
            </div>
          ) : data ? (
            <>
              {/* ========================================================== */}
              {/* PUBLIC / COMMUNITY VIEW                                     */}
              {/* ========================================================== */}
              {viewMode === 'community' && (
                <div className="space-y-4">
                  {/* Public Headline Banner */}
                  <div
                    className={`p-4 rounded-lg border flex items-start gap-3 shadow-md ${
                      data.community_view.risk_level === 'CRITICAL'
                        ? 'bg-red-950/40 border-red-600/70 text-red-200'
                        : data.community_view.risk_level === 'HIGH'
                        ? 'bg-orange-950/40 border-orange-600/70 text-orange-200'
                        : data.community_view.risk_level === 'MODERATE'
                        ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
                        : 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                    }`}
                  >
                    <ShieldAlert size={24} className="shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                        {data.community_view.risk_summary_badge}
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {data.community_view.plain_language_headline}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {data.community_view.affected_area_summary}
                      </p>
                    </div>
                  </div>

                  {/* Why Risk Is Elevated + Mitigating Factors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Drivers */}
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-400">
                        <AlertTriangle size={15} />
                        <span>Why Is the Landslide Risk Elevated?</span>
                      </div>
                      <div className="space-y-2">
                        {data.community_view.why_risk_is_elevated.map((reason, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-950/80 rounded border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mitigating Natural Protectors */}
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
                        <ShieldCheck size={15} />
                        <span>What Is Helping Stabilize the Slope?</span>
                      </div>
                      <div className="space-y-2">
                        {data.community_view.mitigating_protective_factors.map((prot, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-950/80 rounded border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300"
                          >
                            <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                            <span>{prot}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* What Authorities Are Doing & What Citizens Should Do */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Authority Action */}
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
                      <div className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-2">
                        <Activity size={15} />
                        <span>Emergency Authorities Monitoring:</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {data.community_view.active_monitoring_actions.map((act, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Citizen Recommended Safety Guidelines */}
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
                      <div className="text-xs font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
                        <Info size={15} className="text-amber-400" />
                        <span>Recommended Citizen Safety Actions:</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {data.community_view.recommended_citizen_actions.map((act, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* ANALYST / GEOTECHNICAL VIEW                                */}
              {/* ========================================================== */}
              {viewMode === 'analyst' && (
                <div className="space-y-4">
                  {/* Physical Geotechnical Synthesis Banner */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                        <TrendingUp size={14} />
                        Integrated Geotechnical & ML Synthesis
                      </span>
                      {data.analyst_view.geotechnical_fs && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-700">
                          Limit Equilibrium Fs: {' '}
                          <strong
                            className={
                              data.analyst_view.geotechnical_fs < 1.0
                                ? 'text-red-400'
                                : data.analyst_view.geotechnical_fs < 1.25
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {data.analyst_view.geotechnical_fs.toFixed(2)}
                          </strong>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {data.analyst_view.physical_narrative}
                    </p>
                  </div>

                  {/* Waterfall Local Feature Attribution Chart */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                        <Sliders size={14} className="text-amber-400" />
                        Tree-Path Local Feature Attribution (Δp Shifts)
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Base Probability: {Math.round(data.analyst_view.base_probability * 100)}% &rarr; Predicted:{' '}
                        {Math.round(data.analyst_view.predicted_probability * 100)}%
                      </span>
                    </div>

                    {/* Horizontal Bar Chart */}
                    <div className="space-y-2 pt-1">
                      {/* Top Risk Drivers */}
                      <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                        Top Risk Escalators (Pushing Initiation Probability Higher):
                      </div>
                      {data.analyst_view.top_risk_drivers.map((d) => (
                        <div key={d.feature_name} className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-300">
                              {d.display_name} <span className="text-slate-500">({d.observed_value} {d.unit})</span>
                            </span>
                            <span className="text-red-400 font-bold">
                              +{round(d.delta_probability * 100, 1)}% (rel. {d.relative_influence_pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                            <div
                              className="bg-red-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, d.relative_influence_pct)}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Top Protective Factors */}
                      {data.analyst_view.top_protective_factors.length > 0 && (
                        <>
                          <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider pt-2">
                            Top Protective Factors (Mitigating Shear Stress):
                          </div>
                          {data.analyst_view.top_protective_factors.map((p) => (
                            <div key={p.feature_name} className="space-y-0.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-300">
                                  {p.display_name} <span className="text-slate-500">({p.observed_value} {p.unit})</span>
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  {round(p.delta_probability * 100, 1)}% (rel. {p.relative_influence_pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, p.relative_influence_pct)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Comprehensive Feature Detail Matrix */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 font-mono text-xs">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                        <Layers size={14} className="text-cyan-400" />
                        Feature Verification Matrix ({filteredFeatures.length} Features)
                      </span>

                      {/* Category Filter */}
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-slate-500">Filter:</span>
                        <select
                          value={featureCategoryFilter}
                          onChange={(e) => setFeatureCategoryFilter(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-200"
                        >
                          <option value="ALL">All Categories</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[11px] border border-slate-800 rounded">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <tr>
                            <th className="p-2">Feature</th>
                            <th className="p-2">Observed</th>
                            <th className="p-2">Baseline Reference</th>
                            <th className="p-2">Local Δp</th>
                            <th className="p-2">Global Imp.</th>
                            <th className="p-2">Freshness</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Source Attribution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filteredFeatures.map((f) => (
                            <tr key={f.feature_name} className="hover:bg-slate-950/60">
                              <td className="p-2 font-semibold text-slate-200">
                                <div>{f.display_name}</div>
                                <span className="text-[9px] text-slate-500 uppercase">{f.category}</span>
                              </td>
                              <td className="p-2 text-cyan-300 font-bold">
                                {f.observed_value} {f.unit}
                              </td>
                              <td className="p-2 text-slate-400 text-[10px]">
                                {f.reference_comparison_text || `${f.baseline_reference ?? '-'} ${f.unit}`}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                    f.direction === 'INCREASES_RISK'
                                      ? 'bg-red-950 text-red-300 border border-red-800'
                                      : f.direction === 'DECREASES_RISK'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {f.delta_probability > 0
                                    ? `+${round(f.delta_probability * 100, 1)}%`
                                    : `${round(f.delta_probability * 100, 1)}%`}
                                </span>
                              </td>
                              <td className="p-2 text-slate-300">{f.global_importance_pct}%</td>
                              <td className="p-2">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                    f.data_freshness === 'FRESH'
                                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {f.data_freshness}
                                </span>
                              </td>
                              <td className="p-2">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${
                                    f.quality_status === 'MEASURED'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : f.quality_status === 'IMPUTED/ESTIMATED'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {f.quality_status}
                                </span>
                              </td>
                              <td className="p-2 text-slate-400 text-[10px] truncate max-w-[160px]" title={f.source_attribution}>
                                {f.source_attribution}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 4. Footer Disclaimer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info size={12} className="text-cyan-400" />
            <span>
              DECISION SUPPORT NOTICE: Model explanations represent statistical and limit-equilibrium sensitivities.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
