import React, { useState, useEffect, useCallback } from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppLayout } from './layouts/AppLayout';
import { AppRouter } from './routes/AppRouter';
import { NavView } from '../components/navigation';
import { LoadingState, ErrorState } from '../components/common/LoadingState';
import { useApp } from '../state/AppContext';
import { useNotifications } from '../state/NotificationContext';
import { useFilters } from '../state/FilterContext';
import { api } from '../services/api';
import { auditLogger } from '../services/auditLogger';
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
} from '../types';
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
} from '../services/mockData';

const AppContent: React.FC = () => {
  const {
    selectedLocationId,
    setSelectedLocationId,
    dataMode,
    setDataMode,
    isBackendConnected,
    setIsBackendConnected,
    lastSyncTime,
    setLastSyncTime,
    isLiveStreaming,
    thresholds,
    setThresholds,
  } = useApp();

  const { addNotification } = useNotifications();
  const { filterConditions } = useFilters();

  // Navigation
  const [currentView, setCurrentView] = useState<NavView>('overview');

  // Operational Dialog & Modal States
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
  const [isStitchModalOpen, setIsStitchModalOpen] = useState<boolean>(false);
  const [isLiveGpsModalOpen, setIsLiveGpsModalOpen] = useState<boolean>(false);
  const [isRoadModalOpen, setIsRoadModalOpen] = useState<boolean>(false);
  const [isSatelliteModalOpen, setIsSatelliteModalOpen] = useState<boolean>(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);
  const [isDataHierarchyModalOpen, setIsDataHierarchyModalOpen] = useState<boolean>(false);
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ lat: number; lon: number }>({ lat: 11.5365, lon: 76.1322 });

  // Sync & Telemetry States
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const [secondsSinceSync, setSecondsSinceSync] = useState<number>(0);

  // Data Entities
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

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unified Data Fetcher
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
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
        mInfo,
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
      } else {
        // High-fidelity fallback
        setIsBackendConnected(false);
        setOverview(fallbackOverview);
        setDataMode('DEMO');
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
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.warn('Backend unavailable, using fallback data:', err);
      setIsBackendConnected(false);
      setOverview(fallbackOverview);
      setLocations(fallbackLocations);
      setAssessments(fallbackAssessments);
      setAlerts(fallbackAlerts);
      setInspections(fallbackInspections);
      setInfrastructure(fallbackInfrastructure);
      setHistoricalLandslides(fallbackHistoricalLandslides);
    } finally {
      setIsLoading(false);
    }
  }, [setDataMode, setIsBackendConnected, setLastSyncTime]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sync Timer Heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastSyncTime) {
        const diff = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
        setSecondsSinceSync(diff);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  // Action Handlers
  const handleAcknowledgeAlert = async (
    id: number,
    acknowledged_by: string = 'Incident Commander (C2)',
    notes?: string
  ) => {
    try {
      if (isBackendConnected) {
        await api.acknowledgeAlert(id, acknowledged_by, notes);
      }
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledged_by } : a
        )
      );
      auditLogger.logAction({
        user_role: 'INCIDENT_COMMANDER',
        action_type: 'ACKNOWLEDGE_ALERT',
        action_title: `Alert #${id} Acknowledged`,
        target: `Alert #${id}`,
        rationale: notes || 'Confirmed operational receipt',
        previous_state: 'ACTIVE',
        new_state: 'ACKNOWLEDGED',
        authorized_by: acknowledged_by,
        status: 'COMMITTED',
      });
    } catch (err) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledged_by } : a
        )
      );
    }
  };

  const handleUpdateInspectionTask = async (
    id: number,
    update: { status?: string; assigned_team?: string; assigned_officer?: string; field_notes?: string }
  ) => {
    try {
      if (isBackendConnected) {
        await api.updateInspection(id, update);
      }
      setInspections((prev) =>
        prev.map((t) => (t.id === id ? ({ ...t, ...update } as any) : t))
      );
      auditLogger.logAction({
        user_role: 'FIELD_OFFICER',
        action_type: 'UPDATE_INSPECTION',
        action_title: `Inspection Task #${id} Updated`,
        target: `Inspection #${id}`,
        rationale: update.field_notes || 'Task status updated by field team',
        previous_state: 'IN_PROGRESS',
        new_state: update.status || 'UPDATED',
        authorized_by: update.assigned_officer || 'Duty Officer',
        status: 'COMMITTED',
      });
    } catch {
      setInspections((prev) =>
        prev.map((t) => (t.id === id ? ({ ...t, ...update } as any) : t))
      );
    }
  };

  const handleRecalculateInspections = async () => {
    try {
      if (isBackendConnected) {
        await api.recalculateInspections();
        const updated = await api.getInspections();
        if (updated) setInspections(updated);
      }
    } catch (err) {
      console.error('Failed to recalculate inspections:', err);
    }
  };

  const handleRetrainModel = async (algo: string = 'HIST_GBDT') => {
    try {
      if (isBackendConnected) {
        await api.retrainModel(algo, 0.2);
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to retrain model:', err);
    }
  };

  const handleToggleMode = async () => {
    setDataMode(dataMode === 'REAL' ? 'DEMO' : 'REAL');
  };

  const handleResetDemo = async () => {
    await loadAllData();
  };

  const handleUpdateThresholds = async (newThresholds: Record<string, number>) => {
    try {
      if (isBackendConnected) {
        await api.updateRiskThresholds(newThresholds);
      }
      setThresholds(newThresholds as any);
    } catch {
      setThresholds(newThresholds as any);
    }
  };

  const handleRunSimulation = async (params: any): Promise<SimulationResponse | null> => {
    try {
      if (isBackendConnected) {
        return await api.runSimulation(params);
      }
      return null;
    } catch (err) {
      console.error('Failed to run simulation:', err);
      return null;
    }
  };

  const activeAlertCount = alerts.filter(
    (a) => a.status === 'ACTIVE' || a.status === 'GENERATED'
  ).length;
  const pendingInspectionCount = inspections.filter(
    (i) => i.status === 'PENDING' || i.status === 'DISPATCHED'
  ).length;

  return (
    <AppLayout
      currentView={currentView}
      onNavigateView={(v) => setCurrentView(v)}
      onRefresh={loadAllData}
      isSyncingLive={isSyncingLive}
      secondsSinceSync={secondsSinceSync}
      activeAlertCount={activeAlertCount}
      pendingInspectionCount={pendingInspectionCount}
      locations={locations}
      isAssistantOpen={isAssistantOpen}
      setIsAssistantOpen={setIsAssistantOpen}
      isTourModalOpen={isTourModalOpen}
      setIsTourModalOpen={setIsTourModalOpen}
      isStitchModalOpen={isStitchModalOpen}
      setIsStitchModalOpen={setIsStitchModalOpen}
      isLiveGpsModalOpen={isLiveGpsModalOpen}
      setIsLiveGpsModalOpen={setIsLiveGpsModalOpen}
      isRoadModalOpen={isRoadModalOpen}
      setIsRoadModalOpen={setIsRoadModalOpen}
      isSatelliteModalOpen={isSatelliteModalOpen}
      setIsSatelliteModalOpen={setIsSatelliteModalOpen}
      isIncidentModalOpen={isIncidentModalOpen}
      setIsIncidentModalOpen={setIsIncidentModalOpen}
      isDataHierarchyModalOpen={isDataHierarchyModalOpen}
      setIsDataHierarchyModalOpen={setIsDataHierarchyModalOpen}
      liveGpsCoords={liveGpsCoords}
    >
      {isLoading ? (
        <LoadingState message="Initializing Tactical C2 Mission Control..." />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={loadAllData} />
      ) : (
        <AppRouter
          currentView={currentView}
          overview={overview}
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelectLocation={(id) => setSelectedLocationId(id)}
          assessments={assessments}
          alerts={alerts}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          inspections={inspections}
          onRecalculateInspections={handleRecalculateInspections}
          onUpdateInspectionTask={handleUpdateInspectionTask}
          infrastructure={infrastructure}
          historicalLandslides={historicalLandslides}
          riskZonesGeoJSON={riskZonesGeoJSON}
          infrastructureGeoJSON={infrastructureGeoJSON}
          historicalLandslidesGeoJSON={historicalLandslidesGeoJSON}
          sourcesHealth={sourcesHealth}
          modelInfo={modelInfo}
          onRetrainModel={handleRetrainModel}
          sitRep={sitRep}
          thresholds={thresholds}
          onUpdateThresholds={handleUpdateThresholds}
          dataMode={dataMode}
          onToggleMode={handleToggleMode}
          onResetDemo={handleResetDemo}
          onRunSimulation={handleRunSimulation}
          onRefresh={loadAllData}
          onNavigateView={(v) => setCurrentView(v)}
        />
      )}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
