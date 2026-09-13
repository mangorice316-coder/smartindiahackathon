import React from 'react';
import { NavView } from '../../components/navigation';
import { ErrorBoundary } from '../../components/feedback/ErrorBoundary';
import {
  SituationRoomView,
  RiskMapView,
  LiveConditionsView,
  InfrastructureView,
  ExposureView,
  AlertsView,
  SimulationView,
  HistoricalAnalysisView,
  InspectionsView,
  SensorsView,
  ModelDataView,
  DataEngineView,
  ReportsView,
  AuditLogsView,
  SettingsView,
} from '../../features';
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
} from '../../types';

export interface AppRouterProps {
  currentView: NavView;
  overview: DashboardOverview | null;
  locations: LocationSummary[];
  selectedLocationId: number | null;
  onSelectLocation: (id: number | null) => void;
  assessments: RiskAssessment[];
  alerts: AlertItem[];
  onAcknowledgeAlert: (id: number, acknowledged_by: string, notes?: string) => Promise<void>;
  inspections: InspectionTask[];
  onRecalculateInspections: () => Promise<void>;
  onUpdateInspectionTask: (id: number, update: { status?: string; assigned_team?: string; assigned_officer?: string; field_notes?: string }) => Promise<void>;
  infrastructure: InfrastructureAsset[];
  historicalLandslides: HistoricalLandslide[];
  riskZonesGeoJSON: any;
  infrastructureGeoJSON: any;
  historicalLandslidesGeoJSON: any;
  sourcesHealth: DataSourceHealth[];
  modelInfo: any;
  onRetrainModel: (algo: string) => Promise<void>;
  sitRep: any;
  thresholds: any;
  onUpdateThresholds: (thresholds: Record<string, number>) => Promise<void>;
  dataMode: 'DEMO' | 'REAL';
  onToggleMode: () => Promise<void>;
  onResetDemo: () => Promise<void>;
  onRunSimulation: (params: any) => Promise<SimulationResponse | null>;
  onRefresh: () => void;
  onNavigateView: (view: NavView) => void;
}

/**
 * Route / View Coordinator with per-feature Error Boundaries.
 * Implements Section 3 & 21 of the Master UI Rebuild Specification.
 */
export const AppRouter: React.FC<AppRouterProps> = ({
  currentView,
  overview,
  locations,
  selectedLocationId,
  onSelectLocation,
  assessments,
  alerts,
  onAcknowledgeAlert,
  inspections,
  onRecalculateInspections,
  onUpdateInspectionTask,
  infrastructure,
  historicalLandslides,
  riskZonesGeoJSON,
  infrastructureGeoJSON,
  historicalLandslidesGeoJSON,
  sourcesHealth,
  modelInfo,
  onRetrainModel,
  sitRep,
  thresholds,
  onUpdateThresholds,
  dataMode,
  onToggleMode,
  onResetDemo,
  onRunSimulation,
  onRefresh,
  onNavigateView,
}) => {
  return (
    <ErrorBoundary
      key={currentView}
      level="feature"
      fallbackTitle={`Error Rendering ${currentView.toUpperCase()} View`}
      fallbackMessage="A localized operational rendering error occurred. You can safely switch views or recover this view."
      onReset={onRefresh}
    >
      {currentView === 'overview' && (
        <SituationRoomView
          overview={overview}
          onNavigate={onNavigateView}
          onSelectLocation={(locId) => {
            onSelectLocation(locId);
            onNavigateView('map');
          }}
        />
      )}

      {currentView === 'map' && (
        <RiskMapView
          locations={locations}
          assessments={assessments}
          selectedLocationId={selectedLocationId}
          onSelectLocation={onSelectLocation}
          riskZonesGeoJSON={riskZonesGeoJSON}
          infrastructureGeoJSON={infrastructureGeoJSON}
          historicalLandslidesGeoJSON={historicalLandslidesGeoJSON}
          onNavigate={onNavigateView}
          dataMode={dataMode}
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
            onSelectLocation(locId);
            onNavigateView('map');
          }}
        />
      )}

      {currentView === 'exposure' && (
        <ExposureView
          infrastructure={infrastructure}
          locations={locations}
          onSelectLocation={(locId) => {
            onSelectLocation(locId);
            onNavigateView('map');
          }}
        />
      )}

      {currentView === 'alerts' && (
        <AlertsView
          alerts={alerts}
          onAcknowledgeAlert={onAcknowledgeAlert}
          onRefresh={onRefresh}
        />
      )}

      {currentView === 'simulation' && (
        <SimulationView onRunSimulation={onRunSimulation} />
      )}

      {currentView === 'history' && (
        <HistoricalAnalysisView historicalLandslides={historicalLandslides} />
      )}

      {currentView === 'inspections' && (
        <InspectionsView
          inspections={inspections}
          onRecalculate={onRecalculateInspections}
          onUpdateTask={onUpdateInspectionTask}
          onRefresh={onRefresh}
        />
      )}

      {currentView === 'sensors' && <SensorsView />}

      {currentView === 'model_data' && (
        <ModelDataView
          modelInfo={modelInfo}
          sourcesHealth={sourcesHealth}
          onRetrainModel={onRetrainModel}
          onRefresh={onRefresh}
        />
      )}

      {currentView === 'data_engine' && <DataEngineView />}

      {currentView === 'reports' && (
        <ReportsView sitRep={sitRep} onRefresh={onRefresh} />
      )}

      {currentView === 'audit_logs' && <AuditLogsView />}

      {currentView === 'settings' && (
        <SettingsView
          dataMode={dataMode}
          onToggleMode={async () => onToggleMode()}
          onResetDemo={onResetDemo}
          thresholds={thresholds}
          onUpdateThresholds={onUpdateThresholds}
        />
      )}
    </ErrorBoundary>
  );
};
