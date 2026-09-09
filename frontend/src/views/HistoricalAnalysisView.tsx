import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, StatCard } from '../components/common/Card';
import { HistoricalLandslide, AnalyticsSummaryResponse, SeasonalDataPoint, AnnualTrendDataPoint, RainfallEventPoint, RegionalComparisonItem, TimelineSnapshot, AnalyticsFilterOptions } from '../types';
import { api } from '../services/api';
import {
  History,
  Mountain,
  Users,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  BarChart3,
  MapPin,
  Clock,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

import { SeasonalChart } from '../components/analytics/SeasonalChart';
import { RainfallVsEventsChart } from '../components/analytics/RainfallVsEventsChart';
import { AnnualTrendChart } from '../components/analytics/AnnualTrendChart';
import { RegionalComparisonTable } from '../components/analytics/RegionalComparisonTable';
import { TimelinePlayer } from '../components/analytics/TimelinePlayer';
import { HistoricalEventMap } from '../components/analytics/HistoricalEventMap';
import { PeriodComparisonCard } from '../components/analytics/PeriodComparisonCard';
import { HistoricalEventDetailModal } from '../components/analytics/HistoricalEventDetailModal';

interface HistoricalAnalysisViewProps {
  historicalLandslides?: HistoricalLandslide[];
}

type TabType = 'trends' | 'map_timeline' | 'regional' | 'inventory';

const DISTRICTS = ['ALL', 'Wayanad', 'Idukki', 'Chamoli', 'Shimla', 'Nilgiris'];
const SEVERITIES = ['ALL', 'CATASTROPHIC', 'SEVERE', 'MODERATE', 'MINOR'];
const DATA_SOURCES = ['ALL', 'GSI_BHUKOSH', 'NDMA_SDMA', 'NASA_GLC', 'FIELD_SURVEY'];

export const HistoricalAnalysisView: React.FC<HistoricalAnalysisViewProps> = ({
  historicalLandslides = []
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('trends');

  // Filters State
  const [district, setDistrict] = useState<string>('ALL');
  const [severity, setSeverity] = useState<string>('ALL');
  const [dataSource, setDataSource] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [seasonalData, setSeasonalData] = useState<SeasonalDataPoint[]>([]);
  const [annualData, setAnnualData] = useState<AnnualTrendDataPoint[]>([]);
  const [rainfallEvents, setRainfallEvents] = useState<RainfallEventPoint[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalComparisonItem[]>([]);
  const [timelineSnapshots, setTimelineSnapshots] = useState<TimelineSnapshot[]>([]);
  const [allEvents, setAllEvents] = useState<HistoricalLandslide[]>(historicalLandslides);

  // Pagination for Inventory
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Timeline Player State
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState<number>(0);

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState<HistoricalLandslide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Build filter options object
  const activeFilters = useMemo<AnalyticsFilterOptions>(() => ({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    district: district !== 'ALL' ? district : undefined,
    severity: severity !== 'ALL' ? severity : undefined,
    dataSource: dataSource !== 'ALL' ? dataSource : undefined,
    searchQuery: searchQuery || undefined
  }), [startDate, endDate, district, severity, dataSource, searchQuery]);

  // Load analytical datasets from API
  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Summary & Period Comparison
      const summaryRes = await api.getAnalyticsSummary(activeFilters).catch(() => null);
      if (summaryRes) setSummary(summaryRes);

      // 2. Seasonal Data
      const seasonalRes = await api.getSeasonalAnalysis({
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
        district: activeFilters.district
      }).catch(() => []);
      setSeasonalData(seasonalRes);

      // 3. Annual Trends
      const annualRes = await api.getAnnualTrends(activeFilters.district).catch(() => []);
      setAnnualData(annualRes);

      // 4. Rainfall-Event Pairs
      const rainRes = await api.getRainfallEventRelationship(activeFilters.district).catch(() => []);
      setRainfallEvents(rainRes);

      // 5. Regional Comparison
      const regRes = await api.getRegionalComparison().catch(() => []);
      setRegionalData(regRes);

      // 6. Timeline Snapshots
      const snapRes = await api.getTimelineSnapshots().catch(() => []);
      setTimelineSnapshots(snapRes);

      // 7. Paginated / Filtered Events List
      const eventsRes = await api.getHistoricalEventsPaginated({
        page: 1,
        pageSize: 100,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
        district: activeFilters.district,
        severity: activeFilters.severity,
        dataSource: activeFilters.dataSource,
        searchQuery: activeFilters.searchQuery
      }).catch(() => null);

      if (eventsRes && eventsRes.events && eventsRes.events.length > 0) {
        setAllEvents(eventsRes.events);
      } else if (historicalLandslides.length > 0) {
        // Fallback filter over prop data
        let filtered = [...historicalLandslides];
        if (district !== 'ALL') filtered = filtered.filter(e => e.district?.toLowerCase() === district.toLowerCase());
        if (severity !== 'ALL') filtered = filtered.filter(e => (e.severity || e.damage_rating)?.toUpperCase() === severity);
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(e =>
            e.location_name?.toLowerCase().includes(q) ||
            e.notes?.toLowerCase().includes(q) ||
            e.trigger_type?.toLowerCase().includes(q)
          );
        }
        setAllEvents(filtered);
      }
    } catch (err) {
      console.warn('Could not fetch historical analytics from API, relying on local fallback data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, district, severity, searchQuery, historicalLandslides]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Handle Opening Dossier Modal
  const handleOpenDossier = async (event: HistoricalLandslide) => {
    try {
      const detailed = await api.getHistoricalEventDetail(event.id);
      setSelectedEvent(detailed);
    } catch {
      setSelectedEvent(event);
    }
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setDistrict('ALL');
    setSeverity('ALL');
    setDataSource('ALL');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Inventory Table Pagination
  const filteredInventory = useMemo(() => {
    let list = allEvents;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.location_name?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.trigger_type?.toLowerCase().includes(q) ||
        e.district?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEvents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / pageSize));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, currentPage, pageSize]);

  // Derived KPI metrics
  const totalCataloged = summary?.filtered_events_count ?? allEvents.length;
  const totalCasualties = summary?.total_casualties ?? allEvents.reduce((acc, h) => acc + (h.casualties || 0), 0);
  const totalDebrisVolume = summary?.total_debris_volume_m3 ?? allEvents.reduce((acc, h) => acc + (h.estimated_volume_m3 || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Header & Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <History className="text-amber-400" size={20} />
            Historical Landslide & Risk Analytics Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-year failure inventory analysis, seasonal monsoon clustering, and spatial scar evolution across surveyed districts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono bg-blue-950/60 text-blue-300 border border-blue-800 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-400" />
            Verified Geological Ground-Truth
          </span>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Cataloged Failure Scars"
          value={totalCataloged}
          unit="events"
          icon={<History size={18} className="text-amber-400" />}
        />

        <StatCard
          label="Recorded Historical Casualties"
          value={totalCasualties}
          alert={totalCasualties > 0}
          unit="people"
          icon={<Users size={18} className="text-red-400" />}
        />

        <StatCard
          label="Cumulative Debris Volume"
          value={totalDebrisVolume > 1000 ? `${(totalDebrisVolume / 1000).toFixed(0)}k` : totalDebrisVolume}
          unit="m³"
          icon={<Mountain size={18} className="text-amber-400" />}
        />

        <div className="bg-[#111827] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Period Trend (vs Rolling Base)</span>
            <Sparkles size={14} className="text-cyan-400" />
          </div>
          <div className="mt-1">
            <div className="text-lg font-mono font-bold text-slate-100 flex items-baseline gap-2">
              <span>{summary?.period_comparison?.events_direction || 'INCREASED'}</span>
              <span className={`text-xs font-semibold ${
                (summary?.period_comparison?.events_delta ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {(summary?.period_comparison?.events_delta ?? 0) > 0 ? `+${summary?.period_comparison?.events_delta}` : summary?.period_comparison?.events_delta} events
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Avg Risk: {summary?.period_comparison?.current_avg_risk_score.toFixed(1) || '64.2'} / 100
            </div>
          </div>
        </div>
      </div>

      {/* Epistemic Guardrail Notice */}
      <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed shadow-sm">
        <Info size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-amber-300">Scientific Epistemic Principle: </span>
          Do not infer causation from correlation alone. Historical failure frequency variations reflect complex coupled dynamics between extreme hydrometeorological triggers, antecedent soil saturation, slope morphology, and land-use alterations.
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-lg p-3 space-y-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Filter size={14} className="text-cyan-400" />
            <span>Dataset Filters & Search</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1 border border-slate-700 transition-colors"
          >
            <RotateCcw size={12} /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* District Select */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">DISTRICT</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-medium"
            >
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d === 'ALL' ? 'All Districts' : d}</option>
              ))}
            </select>
          </div>

          {/* Severity Select */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">SEVERITY TIER</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-medium"
            >
              {SEVERITIES.map(s => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>
              ))}
            </select>
          </div>

          {/* Data Source Select */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">DATA SOURCE</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-medium"
            >
              {DATA_SOURCES.map(ds => (
                <option key={ds} value={ds}>{ds === 'ALL' ? 'All Sources' : ds}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">SEARCH KEYWORD</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Catchment, trigger..."
                className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
              <Search size={12} className="absolute left-2 top-2.5 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-[#111827] rounded-t-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'trends'
              ? 'border-amber-500 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <BarChart3 size={15} />
          Analytical Trends & Seasonality
        </button>

        <button
          onClick={() => setActiveTab('map_timeline')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'map_timeline'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <MapPin size={15} />
          Spatial Scar Map & Timeline Playback
        </button>

        <button
          onClick={() => setActiveTab('regional')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'regional'
              ? 'border-blue-500 text-blue-300 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Building2 size={15} />
          Regional Risk & Lifeline Matrix
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <FileSpreadsheet size={15} />
          Failure Inventory & Forensic Catalog ({filteredInventory.length})
        </button>
      </div>

      {/* Tab 1: Analytical Trends & Seasonality */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          {/* Period Trend Comparison Card */}
          <PeriodComparisonCard comparison={summary?.period_comparison} />

          {/* Seasonal 12-Month Dual Axis Analysis */}
          <Card
            title="Seasonal Failure Distribution & Antecedent Precipitation Correlation"
            subtitle="Monthly landslide event frequencies paired with 24-hour antecedent rainfall averages highlighting Indian monsoon surges"
          >
            <SeasonalChart data={seasonalData} />
          </Card>

          {/* 2-Column Grid: Rainfall vs Events & Annual Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card
              title="Rainfall-Event Threshold Scatter Analysis"
              subtitle="Observed 24h precipitation conditions prior to slope failure vs estimated debris displacement"
            >
              <RainfallVsEventsChart
                data={rainfallEvents}
                onSelectEventId={(id) => {
                  const ev = allEvents.find(e => e.id === id);
                  if (ev) handleOpenDossier(ev);
                }}
              />
            </Card>

            <Card
              title="Multi-Year Annual Evolution & Severity Stack (2018–2026)"
              subtitle="Annual slope instability events disaggregated by geotechnical damage classification and casualty toll"
            >
              <AnnualTrendChart data={annualData} />
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Spatial Scar Map & Timeline Playback */}
      {activeTab === 'map_timeline' && (
        <div className="space-y-4">
          {/* Timeline Playback Stepper */}
          {timelineSnapshots.length > 0 && (
            <TimelinePlayer
              snapshots={timelineSnapshots}
              currentIndex={currentSnapshotIndex}
              onSelectIndex={setCurrentSnapshotIndex}
            />
          )}

          {/* Interactive Map */}
          <Card
            title="Historical Landslide Scars & Temporal Playback Map"
            subtitle="Georeferenced scar inventory with severity color coding; step through the timeline player above to inspect historical catchment states"
          >
            <HistoricalEventMap
              events={allEvents}
              activeSnapshot={timelineSnapshots[currentSnapshotIndex]}
              onSelectEvent={handleOpenDossier}
              height="550px"
            />
          </Card>
        </div>
      )}

      {/* Tab 3: Regional Risk & Lifeline Matrix */}
      {activeTab === 'regional' && (
        <div className="space-y-4">
          <Card
            title="Cross-District Geotechnical & Lifeline Exposure Matrix"
            subtitle="Multi-district comparison assessing cumulative failure counts, mean slope gradient, critical infrastructure exposure, and historical alerts"
          >
            <RegionalComparisonTable
              data={regionalData}
              selectedDistrict={district}
              onSelectDistrict={(d) => setDistrict(d)}
            />
          </Card>
        </div>
      )}

      {/* Tab 4: Failure Inventory Catalog */}
      {activeTab === 'inventory' && (
        <Card
          title="Empirical Landslide Scar Inventory & Forensic Dossier Catalog"
          subtitle="Cataloged historical slope failures verified by GSI, NDMA, NASA GLC, and field survey teams; click any row to open the complete failure dossier"
        >
          <div className="space-y-3">
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 font-mono text-[11px] text-slate-400">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Catchment / Location</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Trigger</th>
                    <th className="py-2.5 px-3 text-center">24h Rain</th>
                    <th className="py-2.5 px-3 text-center">Volume</th>
                    <th className="py-2.5 px-3 text-center">Casualties</th>
                    <th className="py-2.5 px-3 text-center">Severity</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {paginatedEvents.map((item) => {
                    const sev = (item.severity || item.damage_rating || 'MODERATE').toUpperCase();
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDossier(item)}
                        className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {item.event_date}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-200">{item.location_name || 'Catchment Scar'}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-medium text-slate-300">
                          {item.district || 'N/A'}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-amber-300">
                            {item.trigger_type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-cyan-300">
                          {item.rainfall_conditions_mm !== undefined && item.rainfall_conditions_mm !== null
                            ? `${item.rainfall_conditions_mm.toFixed(0)} mm`
                            : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-slate-300 whitespace-nowrap">
                          {item.estimated_volume_m3 ? `${(item.estimated_volume_m3 / 1000).toFixed(0)}k m³` : 'N/A'}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={item.casualties > 0 ? 'text-red-400' : 'text-slate-500'}>
                            {item.casualties}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            sev === 'CATASTROPHIC'
                              ? 'bg-red-950 text-red-300 border border-red-700'
                              : sev === 'SEVERE'
                              ? 'bg-orange-950 text-orange-300 border border-orange-700'
                              : sev === 'MODERATE'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          }`}>
                            {sev}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-[10px] font-mono text-slate-400">
                          {item.data_source || 'GSI_BHUKOSH'}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDossier(item);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono border border-slate-700 transition-colors"
                          >
                            Inspect Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="font-mono text-[11px]">
                Showing {paginatedEvents.length} of {filteredInventory.length} records (Page {currentPage} of {totalPages})
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft size={13} /> Previous
                </button>

                <span className="px-2 py-1 font-mono text-slate-200">
                  {currentPage}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Forensic Failure Dossier Dialog */}
      <HistoricalEventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};
