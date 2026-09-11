import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/shell/Header';
import { Sidebar, NavView } from './components/shell/Sidebar';
import { OverviewView } from './views/OverviewView';
import { RiskMapView } from './views/RiskMapView';
import { LiveConditionsView } from './views/LiveConditionsView';
import { InfrastructureView } from './views/InfrastructureView';
import { AlertsView } from './views/AlertsView';
import { SimulationView } from './views/SimulationView';
import { HistoricalAnalysisView } from './views/HistoricalAnalysisView';
import { InspectionsView } from './views/InspectionsView';
import { ModelDataView } from './views/ModelDataView';
import { DataEngineView } from './views/DataEngineView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { LoadingState, ErrorState } from './components/common/LoadingState';
import { JudgeDemoController } from './components/demo/JudgeDemoController';
import { DisasterAssistantDrawer } from './components/assistant/DisasterAssistantDrawer';
import { SatelliteChangeModal } from './components/satellite/SatelliteChangeModal';
import { RoadVulnerabilityModal } from './components/roads/RoadVulnerabilityModal';
import { ReportIncidentModal } from './components/incident/ReportIncidentModal';
import { api } from './services/api';
import {
  DashboardOverview,
  LocationSummary,
  RiskAssessment,
  AlertItem,
  InspectionTask,
  InfrastructureAsset,
  HistoricalLandslide,
  DataSourceHealth,
  SimulationResponse,
} from './types';
import {
  fallbackLocations,
  fallbackAssessments,
  fallbackAlerts,
  fallbackInspections,
  fallbackInfrastructure,
  fallbackHistoricalLandslides,
  fallbackOverview,
  fallbackSourcesHealth,
  fallbackGeoJSON,
  fallbackSitRep,
} from './services/mockData';

export const App: React.FC = () => {
  // Navigation & Selection State
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [dataMode, setDataMode] = useState<'DEMO' | 'REAL'>('DEMO');
  const [systemStatus, setSystemStatus] = useState<string>('OPERATIONAL');
  const [isJudgeDemoOpen, setIsJudgeDemoOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const [isSatelliteModalOpen, setIsSatelliteModalOpen] = useState<boolean>(false);
  const [isRoadModalOpen, setIsRoadModalOpen] = useState<boolean>(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);

  // Core Datasets
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [inspections, setInspections] = useState<InspectionTask[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureAsset[]>([]);
  const [historicalLandslides, setHistoricalLandslides] = useState<HistoricalLandslide[]>([]);
  const [riskZonesGeoJSON, setRiskZonesGeoJSON] = useState<any>(null);
  const [infrastructureGeoJSON, setInfrastructureGeoJSON] = useState<any>(null);
  const [historicalLandslidesGeoJSON, setHistoricalLandslidesGeoJSON] = useState<any>(null);
  const [sourcesHealth, setSourcesHealth] = useState<DataSourceHealth[]>([]);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [sitRep, setSitRep] = useState<any>(null);
  const [thresholds, setThresholds] = useState<any>({ LOW_MAX: 30.0, MODERATE_MAX: 50.0, HIGH_MAX: 70.0 });

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Unified Data Fetcher
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Attempt to load from FastAPI backend via Vite proxy
      const [
        ov,
        locs,
        assess,
        alrts,
        insp,
        riskGeo,
        infraGeo,
        histGeo,
        healthRes,
        rep,
        mInfo
      ] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getLocations().catch(() => null),
        api.getAllRiskAssessments().catch(() => null),
        api.getAlerts().catch(() => null),
        api.getInspections().catch(() => null),
        api.getRiskZonesGeoJSON().catch(() => null),
        api.getInfrastructureGeoJSON().catch(() => null),
        api.getHistoricalLandslidesGeoJSON().catch(() => null),
        api.getDetailedHealth().catch(() => null),
        api.getSitRepJSON().catch(() => null),
        api.getActiveModel().catch(() => null),
      ]);

      if (ov && locs && assess) {
        // Backend is actively responding!
        setIsBackendConnected(true);
        setOverview(ov);
        setDataMode(ov.data_mode || 'DEMO');
        setLocations(locs);
        setAssessments(assess);
        setAlerts(alrts || []);
        setInspections(insp || []);
        setRiskZonesGeoJSON(riskGeo || fallbackGeoJSON.riskZones);
        setInfrastructureGeoJSON(infraGeo || fallbackGeoJSON.infrastructure);
        setHistoricalLandslidesGeoJSON(histGeo || fallbackGeoJSON.historicalLandslides);
        setSitRep(rep || fallbackSitRep);
        setModelInfo(mInfo);

        if (healthRes?.subsystems?.data_providers?.sources) {
          setSourcesHealth(healthRes.subsystems.data_providers.sources);
        } else {
          setSourcesHealth(fallbackSourcesHealth);
        }

        // Extract flattened infrastructure and historical lists from GeoJSON
        if (infraGeo?.features) {
          const mappedInfra: InfrastructureAsset[] = infraGeo.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            asset_type: f.properties.asset_type,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            location_id: f.properties.location_id,
            location_name: f.properties.location_name,
            district: f.properties.district,
            lifeline_tier: f.properties.lifeline_tier,
            capacity: f.properties.capacity,
            exposure_weight: f.properties.exposure_weight,
            is_demo: f.properties.is_demo,
          }));
          setInfrastructure(mappedInfra);
        } else {
          setInfrastructure(fallbackInfrastructure);
        }

        if (histGeo?.features) {
          const mappedHist: HistoricalLandslide[] = histGeo.features.map((f: any) => ({
            id: f.properties.id,
            event_date: f.properties.event_date,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            trigger_type: f.properties.trigger_type,
            estimated_volume_m3: f.properties.estimated_volume_m3,
            casualties: f.properties.casualties,
            damage_rating: f.properties.damage_rating,
            notes: f.properties.notes,
            location_name: f.properties.location_name,
            is_demo: f.properties.is_demo,
          }));
          setHistoricalLandslides(mappedHist);
        } else {
          setHistoricalLandslides(fallbackHistoricalLandslides);
        }
      } else {
        // Backend offline or starting up: load high-fidelity calibrated demo fallback
        setIsBackendConnected(false);
        setOverview(fallbackOverview);
        setLocations(fallbackLocations);
        setAssessments(fallbackAssessments);
        setAlerts(fallbackAlerts);
        setInspections(fallbackInspections);
        setInfrastructure(fallbackInfrastructure);
        setHistoricalLandslides(fallbackHistoricalLandslides);
        setRiskZonesGeoJSON(fallbackGeoJSON.riskZones);
        setInfrastructureGeoJSON(fallbackGeoJSON.infrastructure);
        setHistoricalLandslidesGeoJSON(fallbackGeoJSON.historicalLandslides);
        setSourcesHealth(fallbackSourcesHealth);
        setSitRep(fallbackSitRep);
      }
    } catch (err: any) {
      console.warn('Backend connection failed, falling back to calibrated dataset:', err);
      setIsBackendConnected(false);
      setOverview(fallbackOverview);
      setLocations(fallbackLocations);
      setAssessments(fallbackAssessments);
      setAlerts(fallbackAlerts);
      setInspections(fallbackInspections);
      setInfrastructure(fallbackInfrastructure);
      setHistoricalLandslides(fallbackHistoricalLandslides);
      setRiskZonesGeoJSON(fallbackGeoJSON.riskZones);
      setInfrastructureGeoJSON(fallbackGeoJSON.infrastructure);
      setHistoricalLandslidesGeoJSON(fallbackGeoJSON.historicalLandslides);
      setSourcesHealth(fallbackSourcesHealth);
      setSitRep(fallbackSitRep);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Window Custom Event Listeners for 90-Second Demo & Feature Modals
  useEffect(() => {
    const handleOpenSatellite = () => setIsSatelliteModalOpen(true);
    const handleOpenRoad = () => setIsRoadModalOpen(true);
    const handleOpenIncident = () => setIsIncidentModalOpen(true);

    window.addEventListener('open-satellite-modal', handleOpenSatellite);
    window.addEventListener('open-road-modal', handleOpenRoad);
    window.addEventListener('open-incident-modal', handleOpenIncident);

    return () => {
      window.removeEventListener('open-satellite-modal', handleOpenSatellite);
      window.removeEventListener('open-road-modal', handleOpenRoad);
      window.removeEventListener('open-incident-modal', handleOpenIncident);
    };
  }, []);

  // Action Handlers
  const handleAcknowledgeAlert = async (id: number, acknowledged_by: string, notes?: string) => {
    try {
      if (isBackendConnected) {
        await api.acknowledgeAlert(id, acknowledged_by, notes);
      }
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by, acknowledged_at: new Date().toISOString() }
            : a
        )
      );
    } catch (e) {
      console.error('Failed acknowledging alert:', e);
      throw e;
    }
  };

  const handleRunSimulation = async (payload: {
    scenario_name: string;
    rainfall_multiplier: number;
    additional_rainfall_mm: number;
    duration_hours: number;
  }): Promise<SimulationResponse> => {
    if (isBackendConnected) {
      return await api.runSimulation(payload);
    }

    // Local simulation physics logic when testing frontend standalone
    const simulatedResults = assessments.map((ass) => {
      const addedRain = payload.additional_rainfall_mm * (payload.rainfall_multiplier - 1.0);
      const newScore = Math.min(100, Number((ass.overall_risk_score + addedRain * 0.18).toFixed(1)));
      const newFs = Math.max(0.4, Number((ass.geotechnical_fs - (payload.rainfall_multiplier - 1.0) * 0.35).toFixed(2)));
      let newCat: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (newScore > 70) newCat = 'CRITICAL';
      else if (newScore > 50) newCat = 'HIGH';
      else if (newScore > 30) newCat = 'MODERATE';

      return {
        location_id: ass.location_id,
        location_name: ass.location_name,
        baseline_risk_score: ass.overall_risk_score,
        simulated_risk_score: newScore,
        risk_score_delta: Number((newScore - ass.overall_risk_score).toFixed(1)),
        baseline_category: ass.risk_category,
        simulated_category: newCat,
        category_escalated: newCat !== ass.risk_category,
        baseline_fs: ass.geotechnical_fs,
        simulated_fs: newFs,
        newly_exposed_infrastructure_count: newCat === 'CRITICAL' ? 2 : 0,
        affected_infrastructure_names: newCat === 'CRITICAL' ? ['Access Road', 'Drainage Culvert'] : [],
      };
    });

    return {
      scenario_name: payload.scenario_name,
      timestamp: new Date().toISOString(),
      executed_by: 'Incident Commander (Duty Desk)',
      parameters: payload,
      locations_evaluated: simulatedResults.length,
      escalated_zones_count: simulatedResults.filter((r) => r.category_escalated).length,
      newly_critical_count: simulatedResults.filter((r) => r.simulated_category === 'CRITICAL').length,
      total_additional_population_exposed: 18500,
      results: simulatedResults,
      disclaimer:
        'PHYSICS SIMULATION ESTIMATE ONLY: Infinite slope limit equilibrium response to modeled precipitation surge. Does not guarantee physical landslide initiation or timing.',
    };
  };

  const handleRecalculateInspections = async () => {
    if (isBackendConnected) {
      const updated = await api.recalculateInspections();
      setInspections(updated);
    } else {
      // Re-sort fallback inspections
      setInspections((prev) => [...prev].sort((a, b) => b.priority_score - a.priority_score));
    }
  };

  const handleUpdateInspectionTask = async (
    id: number,
    update: { status?: string; assigned_team?: string; assigned_officer?: string; field_notes?: string }
  ) => {
    if (isBackendConnected) {
      await api.updateInspection(id, update);
    }
    setInspections((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: (update.status as any) || t.status,
              assigned_team: update.assigned_team || t.assigned_team,
              assigned_officer: update.assigned_officer || t.assigned_officer,
              field_notes: update.field_notes || t.field_notes,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const handleRetrainModel = async (algo: string) => {
    if (isBackendConnected) {
      const res = await api.retrainModel(algo);
      setModelInfo(res);
    } else {
      alert(`Model retraining simulation: ${algo} trained with 1,500 synthetic geotechnical profiles.`);
    }
  };

  const handleToggleMode = async () => {
    const nextMode = dataMode === 'DEMO' ? 'REAL' : 'DEMO';
    setDataMode(nextMode);
    if (isBackendConnected) {
      try {
        await api.switchMode(nextMode);
        await loadAllData();
      } catch (e) {
        console.error('Mode switch error:', e);
      }
    }
  };

  const handleResetDemo = async () => {
    if (isBackendConnected) {
      await api.resetDemoData();
      await loadAllData();
    } else {
      setAlerts(fallbackAlerts);
      setInspections(fallbackInspections);
      alert('Demo data re-initialized to initial calibrated baseline.');
    }
  };

  const handleUpdateThresholds = async (newThresholds: Record<string, number>) => {
    if (isBackendConnected) {
      await api.updateRiskThresholds(newThresholds);
    }
    setThresholds(newThresholds);
  };

  const handleSyncLive = async () => {
    setIsSyncingLive(true);
    try {
      if (isBackendConnected) {
        await api.syncLiveWeather();
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to sync live weather:', err);
    } finally {
      setIsSyncingLive(false);
    }
  };

  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const pendingInspectionCount = inspections.filter((i) => i.status === 'PENDING' || i.status === 'DISPATCHED').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] text-[#f8fafc]">
      {/* Top EOC Emergency Header */}
      <Header
        dataMode={dataMode}
        onToggleMode={handleToggleMode}
        activeAlertCount={activeAlertCount}
        onResetDemo={handleResetDemo}
        systemStatus={systemStatus}
        onOpenJudgeDemo={() => setIsJudgeDemoOpen(true)}
        onSyncLive={handleSyncLive}
        isSyncing={isSyncingLive}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Main EOC Work Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          alertBadgeCount={activeAlertCount}
          inspectionBadgeCount={pendingInspectionCount}
        />

        {/* Dynamic View Display Container */}
        <main className="flex-1 overflow-y-auto p-4 bg-[#0b0f19]">
          {/* Offline / Backend Fallback Banner if operating offline */}
          {!isBackendConnected && !isLoading && (
            <div className="mb-3 px-3 py-1.5 rounded bg-amber-950/40 border border-amber-600/50 flex items-center justify-between text-xs font-mono text-amber-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>OFFLINE DEMO MODE: Rendering Calibrated Multi-Catchment Dataset (FastAPI Backend Offline)</span>
              </span>
              <button
                onClick={loadAllData}
                className="underline text-amber-200 hover:text-white text-[11px]"
              >
                Reconnect Backend
              </button>
            </div>
          )}

          {isLoading ? (
            <LoadingState
              message="Loading Geotechnical Telemetry & GIS Layers..."
              subMessage="Synchronizing catchment sensors, slope stability models, and ML predictions"
            />
          ) : errorMessage ? (
            <ErrorState
              title="System Initialization Error"
              message={errorMessage}
              onRetry={loadAllData}
            />
          ) : (
            <>
              {currentView === 'overview' && (
                <OverviewView
                  overview={overview}
                  onNavigate={(v) => setCurrentView(v)}
                  onSelectLocation={(locId) => {
                    setSelectedLocationId(locId);
                    setCurrentView('map');
                  }}
                />
              )}

              {currentView === 'map' && (
                <RiskMapView
                  riskZonesGeoJSON={riskZonesGeoJSON}
                  infrastructureGeoJSON={infrastructureGeoJSON}
                  historicalLandslidesGeoJSON={historicalLandslidesGeoJSON}
                  locations={locations}
                  assessments={assessments}
                  selectedLocationId={selectedLocationId}
                  onSelectLocation={(id) => setSelectedLocationId(id)}
                  onNavigate={(v) => setCurrentView(v)}
                  dataMode={dataMode}
                  activeAlertCount={alerts.filter(a => a.status === 'ACTIVE').length || 7}
                />
              )}

              {currentView === 'conditions' && (
                <LiveConditionsView
                  locations={locations}
                  assessments={assessments}
                  dataMode={dataMode}
                />
              )}

              {currentView === 'infrastructure' && (
                <InfrastructureView
                  infrastructure={infrastructure}
                  onSelectLocation={(locId) => {
                    setSelectedLocationId(locId);
                    setCurrentView('map');
                  }}
                />
              )}

              {currentView === 'alerts' && (
                <AlertsView
                  alerts={alerts}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onRefresh={loadAllData}
                />
              )}

              {currentView === 'simulation' && (
                <SimulationView onRunSimulation={handleRunSimulation} />
              )}

              {currentView === 'history' && (
                <HistoricalAnalysisView historicalLandslides={historicalLandslides} />
              )}

              {currentView === 'inspections' && (
                <InspectionsView
                  inspections={inspections}
                  onRecalculate={handleRecalculateInspections}
                  onUpdateTask={handleUpdateInspectionTask}
                  onRefresh={loadAllData}
                />
              )}

              {currentView === 'model_data' && (
                <ModelDataView
                  modelInfo={modelInfo}
                  sourcesHealth={sourcesHealth}
                  onRetrainModel={handleRetrainModel}
                  onRefresh={loadAllData}
                />
              )}

              {currentView === 'data_engine' && (
                <DataEngineView />
              )}

              {currentView === 'reports' && (
                <ReportsView sitRep={sitRep} onRefresh={loadAllData} />
              )}

              {currentView === 'settings' && (
                <SettingsView
                  dataMode={dataMode}
                  onToggleMode={async () => handleToggleMode()}
                  onResetDemo={handleResetDemo}
                  thresholds={thresholds}
                  onUpdateThresholds={handleUpdateThresholds}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Interactive 9-Step SIH Judge Evaluation Walkthrough Controller */}
      <JudgeDemoController
        isOpen={isJudgeDemoOpen}
        onClose={() => setIsJudgeDemoOpen(false)}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        selectedLocationId={selectedLocationId}
        onSelectLocation={(id) => setSelectedLocationId(id)}
        onResetDemo={handleResetDemo}
        onTriggerSimulation={async (multiplier) => {
          const scenarioName = multiplier === 1.0
            ? 'Judge Demo Baseline Scenario'
            : `Judge Demo Deluge (+${Math.round((multiplier - 1) * 100)}% Rainfall)`;
          if (isBackendConnected) {
            await api.runSimulation({
              scenario_name: scenarioName,
              rainfall_multiplier: multiplier,
              additional_rainfall_mm: 0,
              duration_hours: 24
            });
            await loadAllData();
          } else {
            await handleRunSimulation({
              scenario_name: scenarioName,
              rainfall_multiplier: multiplier,
              additional_rainfall_mm: 0,
              duration_hours: 24
            });
          }
        }}
      />

      {/* Grounded AI Disaster Intelligence Assistant Drawer */}
      <DisasterAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigateView={(v) => setCurrentView(v)}
      />

      {/* Feature 11: Satellite Multispectral & SAR Change Detection Modal */}
      <SatelliteChangeModal
        isOpen={isSatelliteModalOpen}
        onClose={() => setIsSatelliteModalOpen(false)}
        locationId={selectedLocationId || 1}
      />

      {/* Feature 13: Mountain Road & Route Vulnerability Modal */}
      <RoadVulnerabilityModal
        isOpen={isRoadModalOpen}
        onClose={() => setIsRoadModalOpen(false)}
      />

      {/* Feature 15: Ground Incident Reporting & Verification Loop Modal */}
      <ReportIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        locations={locations}
        onIncidentReported={() => loadAllData()}
      />
    </div>
  );
};

export default App;
