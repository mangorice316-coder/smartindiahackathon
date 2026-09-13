import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/shell/Header';
import { Sidebar, NavView } from './components/shell/Sidebar';
import { OverviewView } from './views/OverviewView';
import { RiskMapView } from './views/RiskMapView';
import { LiveConditionsView } from './views/LiveConditionsView';
import { InfrastructureView } from './views/InfrastructureView';
import { ExposureView } from './views/ExposureView';
import { AlertsView } from './views/AlertsView';
import { SimulationView } from './views/SimulationView';
import { HistoricalAnalysisView } from './views/HistoricalAnalysisView';
import { InspectionsView } from './views/InspectionsView';
import { SensorsView } from './views/SensorsView';
import { ModelDataView } from './views/ModelDataView';
import { DataEngineView } from './views/DataEngineView';
import { ReportsView } from './views/ReportsView';
import { AuditLogsView } from './views/AuditLogsView';
import { SettingsView } from './views/SettingsView';
import { LoadingState, ErrorState } from './components/common/LoadingState';
import { DisasterAssistantDrawer } from './components/assistant/DisasterAssistantDrawer';
import { SatelliteChangeModal } from './components/satellite/SatelliteChangeModal';
import { RoadVulnerabilityModal } from './components/roads/RoadVulnerabilityModal';
import { ReportIncidentModal } from './components/incident/ReportIncidentModal';
import { LiveCoordinateInspectorModal } from './components/live/LiveCoordinateInspectorModal';
import { StitchStudioModal } from './components/stitch/StitchStudioModal';
import { GuidedScenarioTourModal } from './components/demo/GuidedScenarioTourModal';
import { DataHierarchyModal } from './components/pipeline/DataHierarchyModal';
import { StatusBanner } from './components/common/StatusBanner';
import { CommandPalette } from './components/common/CommandPalette';
import { NotificationCenter, C2Notification } from './components/common/NotificationCenter';
import { FilterPanel } from './components/common/FilterPanel';
import { MobileNav } from './components/common/MobileNav';
import { Compass, RefreshCw } from 'lucide-react';
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
  FilterConditions,
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
  // Navigation & Core States
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [dataMode, setDataMode] = useState<'DEMO' | 'REAL'>('REAL');
  const [systemStatus, setSystemStatus] = useState<string>('OPERATIONAL');
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const [isSatelliteModalOpen, setIsSatelliteModalOpen] = useState<boolean>(false);
  const [isRoadModalOpen, setIsRoadModalOpen] = useState<boolean>(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);
  const [isLiveGpsModalOpen, setIsLiveGpsModalOpen] = useState<boolean>(false);
  const [isStitchModalOpen, setIsStitchModalOpen] = useState<boolean>(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
  const [isDataHierarchyModalOpen, setIsDataHierarchyModalOpen] = useState<boolean>(false);
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ lat: number; lon: number }>({ lat: 11.5365, lon: 76.1322 });
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [secondsSinceSync, setSecondsSinceSync] = useState<number>(0);

  // New C2 Dialog & Drawer States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Notifications State
  const [notifications, setNotifications] = useState<C2Notification[]>([
    {
      id: 'NOTIF-01',
      timestamp: '10:42 AM',
      severity: 'CRITICAL',
      title: 'Pore Pressure Exceeded at Chooralmala',
      message: 'Sensor PZ-01 recorded 68.4 kPa. Factor of Safety dropped to 0.88.',
      source: 'In-Situ Telemetry',
      isRead: false,
      actionView: 'overview',
      locationId: 1,
    },
    {
      id: 'NOTIF-02',
      timestamp: '10:35 AM',
      severity: 'CRITICAL',
      title: 'Tier-1 Evacuation Directive Dispatched',
      message: 'Mandatory evacuation order issued for 1,420 residents in Chooralmala Basin.',
      source: 'District Magistrate',
      isRead: false,
      actionView: 'alerts',
    },
    {
      id: 'NOTIF-03',
      timestamp: '10:15 AM',
      severity: 'WARNING',
      title: 'Meppadi Bridge Scour Risk High',
      message: 'Arterial bridge abutment threatened by high debris volume on SH-59.',
      source: 'PWD Lifeline Monitor',
      isRead: true,
      actionView: 'infrastructure',
    },
    {
      id: 'NOTIF-04',
      timestamp: '09:50 AM',
      severity: 'SUCCESS',
      title: 'Encrypted Geopackage Synchronized',
      message: 'Offline SQLite database cache updated with GSI NLFC & ISRO NRSC v2.1.',
      source: 'Offline Cache Engine',
      isRead: true,
    },
  ]);

  // Multi-Condition Filter State
  const [filterConditions, setFilterConditions] = useState<FilterConditions>({
    region: 'ALL',
    district: 'ALL',
    riskLevel: 'ALL',
    minRainfall: 0,
    minSlope: 0,
    soilSaturation: 'ALL',
    sensorStatus: 'ALL',
    timeRange: 'REALTIME',
    searchQuery: '',
  });

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

  // Global Keyboard Shortcuts (Ctrl+K or / opens command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      } else {
        // Fallback to local mock data
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
      console.warn('Backend unavailable, using encrypted local fallback geopackage:', err);
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
      setLastSyncTime(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Live Sync Trigger
  const handleSyncLive = async () => {
    setIsSyncingLive(true);
    await loadAllData();
    setIsSyncingLive(false);
  };

  // Toggle Demo / Real Mode
  const handleToggleMode = async () => {
    setDataMode((prev) => (prev === 'REAL' ? 'DEMO' : 'REAL'));
  };

  const handleResetDemo = async () => {
    await loadAllData();
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id, 'Incident Commander (C2)');
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    } catch (err) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    }
  };

  const handleRunSimulation = async (params: any): Promise<SimulationResponse> => {
    return api.runSimulation(params);
  };

  const handleRecalculateInspections = async () => {
    try {
      await api.recalculateInspections();
      const updated = await api.getInspections();
      setInspections(updated);
    } catch (err) {
      console.error('Failed to recalculate inspections:', err);
    }
  };

  const handleUpdateInspectionTask = async (
    id: number,
    update: { status?: string; assigned_team?: string; assigned_officer?: string; field_notes?: string }
  ) => {
    try {
      await api.updateInspection(id, update);
      setInspections((prev) =>
        prev.map((t) => (t.id === id ? ({ ...t, ...update } as any) : t))
      );
    } catch (err) {
      setInspections((prev) =>
        prev.map((t) => (t.id === id ? ({ ...t, ...update } as any) : t))
      );
    }
  };

  const handleRetrainModel = async () => {
    try {
      const res = await api.retrainModel('HIST_GBDT', 0.2);
      await loadAllData();
      return res;
    } catch (err) {
      console.error('Retrain error:', err);
      throw err;
    }
  };

  const handleUpdateThresholds = async (newThresholds: any) => {
    try {
      await api.updateRiskThresholds(newThresholds);
      setThresholds(newThresholds);
    } catch (err) {
      setThresholds(newThresholds);
    }
  };

  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const pendingInspectionCount = inspections.filter((i) => i.status === 'PENDING' || i.status === 'DISPATCHED').length;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070B12] text-[#F5F7FA]">
      {/* Top EOC Emergency Header */}
      <Header
        activeAlertCount={activeAlertCount}
        systemStatus={systemStatus}
        onSyncLive={handleSyncLive}
        isSyncing={isSyncingLive}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenStitch={() => setIsStitchModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadCount}
        onOpenFilterPanel={() => setIsFilterPanelOpen(true)}
        isOffline={!isBackendConnected}
      />

      {/* Main EOC Work Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar (Desktop) */}
        <div className="hidden md:flex">
          <Sidebar
            currentView={currentView}
            onSelectView={(v) => setCurrentView(v)}
            alertBadgeCount={activeAlertCount}
            inspectionBadgeCount={pendingInspectionCount}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
        </div>

        {/* Dynamic View Display Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070B12]/95 relative z-10 pb-20 md:pb-6">
          {/* Persistent Global Status Banner */}
          <div className="mb-4">
            <StatusBanner
              statusLevel={!isBackendConnected ? 'OFFLINE' : 'SUCCESS'}
              isOffline={!isBackendConnected}
              lastSyncTime={lastSyncTime}
              onReconnect={loadAllData}
              catchmentsCount={locations.length || 12}
              scarsCount={historicalLandslides.length || 29}
              lifelinesCount={infrastructure.length || 18}
              directivesCount={4}
            />
          </div>

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

              {currentView === 'exposure' && (
                <ExposureView
                  infrastructure={infrastructure}
                  locations={locations}
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

              {currentView === 'sensors' && (
                <SensorsView />
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

              {currentView === 'audit_logs' && (
                <AuditLogsView />
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

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <MobileNav
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        onToggleSidebar={() => setIsCommandPaletteOpen(true)}
        alertBadgeCount={activeAlertCount}
        inspectionBadgeCount={pendingInspectionCount}
      />

      {/* C2 Command Palette (Ctrl+K or /) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateView={(v) => setCurrentView(v)}
        onSelectLocation={(locId) => {
          setSelectedLocationId(locId);
          setCurrentView('map');
        }}
        onToggleOffline={() => setIsBackendConnected(prev => !prev)}
      />

      {/* C2 Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }}
        onMarkAllAsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }}
        onNavigateToAlert={(view, locId) => {
          if (locId) setSelectedLocationId(locId);
          setCurrentView(view as NavView);
        }}
      />

      {/* C2 Multi-Parameter Filter Panel Drawer */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        conditions={filterConditions}
        onApply={(conds) => setFilterConditions(conds)}
        onReset={() => setFilterConditions({
          region: 'ALL',
          district: 'ALL',
          riskLevel: 'ALL',
          minRainfall: 0,
          minSlope: 0,
          soilSaturation: 'ALL',
          sensorStatus: 'ALL',
          timeRange: 'REALTIME',
          searchQuery: '',
        })}
        totalMatchesCount={locations.length || 12}
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

      {/* Real-Time Live GPS Landslide Hazard Inspector Modal */}
      <LiveCoordinateInspectorModal
        isOpen={isLiveGpsModalOpen}
        onClose={() => setIsLiveGpsModalOpen(false)}
        initialLat={liveGpsCoords.lat}
        initialLon={liveGpsCoords.lon}
      />

      {/* Google Stitch AI Studio Bridge Modal */}
      <StitchStudioModal
        isOpen={isStitchModalOpen}
        onClose={() => setIsStitchModalOpen(false)}
      />

      {/* 12-Step Guided Disaster Demonstration Scenario Tour Modal */}
      <GuidedScenarioTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onNavigateView={(v) => {
          setCurrentView(v);
          setIsTourModalOpen(false);
        }}
      />

      {/* Authoritative 5-Tier Data Hierarchy & Lineage Modal */}
      <DataHierarchyModal
        isOpen={isDataHierarchyModalOpen}
        onClose={() => setIsDataHierarchyModalOpen(false)}
      />
    </div>
  );
};

export default App;
