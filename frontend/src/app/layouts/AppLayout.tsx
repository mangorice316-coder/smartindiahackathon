import React, { ReactNode } from 'react';
import { NavView, Header, Sidebar, MobileNav, CommandPalette, NotificationCenter, FilterPanel } from '../../components/navigation';
import { StatusBanner } from '../../components/common/StatusBanner';
import { DisasterAssistantDrawer } from '../../components/assistant/DisasterAssistantDrawer';
import { GuidedScenarioTourModal } from '../../components/demo/GuidedScenarioTourModal';
import { StitchStudioModal } from '../../components/stitch/StitchStudioModal';
import { LiveCoordinateInspectorModal } from '../../components/live/LiveCoordinateInspectorModal';
import { RoadVulnerabilityModal } from '../../components/roads/RoadVulnerabilityModal';
import { SatelliteChangeModal } from '../../components/satellite/SatelliteChangeModal';
import { ReportIncidentModal } from '../../components/incident/ReportIncidentModal';
import { DataHierarchyModal } from '../../components/pipeline/DataHierarchyModal';
import { useNotifications } from '../../state/NotificationContext';
import { useFilters } from '../../state/FilterContext';
import { useApp } from '../../state/AppContext';
import { LocationSummary } from '../../types';

export interface AppLayoutProps {
  currentView: NavView;
  onNavigateView: (view: NavView) => void;
  onRefresh: () => void;
  isSyncingLive: boolean;
  secondsSinceSync: number;
  activeAlertCount: number;
  pendingInspectionCount: number;
  locations: LocationSummary[];
  // Modals & drawers
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  isTourModalOpen: boolean;
  setIsTourModalOpen: (open: boolean) => void;
  isStitchModalOpen: boolean;
  setIsStitchModalOpen: (open: boolean) => void;
  isLiveGpsModalOpen: boolean;
  setIsLiveGpsModalOpen: (open: boolean) => void;
  isRoadModalOpen: boolean;
  setIsRoadModalOpen: (open: boolean) => void;
  isSatelliteModalOpen: boolean;
  setIsSatelliteModalOpen: (open: boolean) => void;
  isIncidentModalOpen: boolean;
  setIsIncidentModalOpen: (open: boolean) => void;
  isDataHierarchyModalOpen: boolean;
  setIsDataHierarchyModalOpen: (open: boolean) => void;
  liveGpsCoords: { lat: number; lon: number };
  children: ReactNode;
}

/**
 * C2 Application Shell Layout with Screen-Reader Skip Link & Focus Isolation.
 * Implements Section 13, 14, 15, and 56 of the Master UI Rebuild Specification.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigateView,
  onRefresh,
  isSyncingLive,
  secondsSinceSync,
  activeAlertCount,
  pendingInspectionCount,
  locations,
  isAssistantOpen,
  setIsAssistantOpen,
  isTourModalOpen,
  setIsTourModalOpen,
  isStitchModalOpen,
  setIsStitchModalOpen,
  isLiveGpsModalOpen,
  setIsLiveGpsModalOpen,
  isRoadModalOpen,
  setIsRoadModalOpen,
  isSatelliteModalOpen,
  setIsSatelliteModalOpen,
  isIncidentModalOpen,
  setIsIncidentModalOpen,
  isDataHierarchyModalOpen,
  setIsDataHierarchyModalOpen,
  liveGpsCoords,
  children,
}) => {
  const { isBackendConnected, setIsBackendConnected, setSelectedLocationId, systemStatus, dataMode } = useApp();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { filterConditions, setFilterConditions, resetFilters } = useFilters();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState<boolean>(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState<boolean>(false);

  // Global Keyboard Shortcuts (Ctrl+K or / opens command palette)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* WCAG 2.1 AA Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-3 focus:bg-c2-cyan-500 focus:text-slate-950 focus:font-bold focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* C2 Persistent Status Banner */}
      <StatusBanner
        statusLevel={isBackendConnected ? 'SUCCESS' : 'WARNING'}
        isOffline={!isBackendConnected}
        lastSyncTime={new Date(Date.now() - secondsSinceSync * 1000)}
        onReconnect={onRefresh}
      />

      {/* Top Header */}
      <Header
        activeAlertCount={activeAlertCount}
        systemStatus={systemStatus}
        dataMode={dataMode}
        isSyncing={isSyncingLive}
        onSyncLive={onRefresh}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenStitch={() => setIsStitchModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenFilterPanel={() => setIsFilterPanelOpen(true)}
        unreadNotificationsCount={unreadCount}
        isOffline={!isBackendConnected}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Navigation Rail (Desktop & Tablet) */}
        <Sidebar
          currentView={currentView}
          onSelectView={onNavigateView}
          alertBadgeCount={activeAlertCount}
          inspectionBadgeCount={pendingInspectionCount}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 custom-scrollbar focus:outline-none"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <MobileNav
        currentView={currentView}
        onSelectView={onNavigateView}
        onToggleSidebar={() => setIsCommandPaletteOpen(true)}
        alertBadgeCount={activeAlertCount}
        inspectionBadgeCount={pendingInspectionCount}
      />

      {/* Command Palette (Ctrl+K or /) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateView={onNavigateView}
        onSelectLocation={(locId) => {
          setSelectedLocationId(locId);
          onNavigateView('map');
        }}
        onToggleOffline={() => setIsBackendConnected(!isBackendConnected)}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onNavigateToAlert={(view, locId) => {
          if (locId) setSelectedLocationId(locId);
          onNavigateView(view as NavView);
        }}
      />

      {/* Multi-Parameter Filter Panel Drawer */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        conditions={filterConditions}
        onApply={(conds) => setFilterConditions(conds)}
        onReset={resetFilters}
      />

      {/* Specialized Incident, Simulation, & GIS Modals */}
      <DisasterAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigateView={onNavigateView}
      />

      <GuidedScenarioTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onNavigateView={onNavigateView}
      />

      <StitchStudioModal
        isOpen={isStitchModalOpen}
        onClose={() => setIsStitchModalOpen(false)}
      />

      <LiveCoordinateInspectorModal
        isOpen={isLiveGpsModalOpen}
        onClose={() => setIsLiveGpsModalOpen(false)}
        initialLat={liveGpsCoords.lat}
        initialLon={liveGpsCoords.lon}
      />

      <RoadVulnerabilityModal
        isOpen={isRoadModalOpen}
        onClose={() => setIsRoadModalOpen(false)}
      />

      <SatelliteChangeModal
        isOpen={isSatelliteModalOpen}
        onClose={() => setIsSatelliteModalOpen(false)}
      />

      <ReportIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        locations={locations}
      />

      <DataHierarchyModal
        isOpen={isDataHierarchyModalOpen}
        onClose={() => setIsDataHierarchyModalOpen(false)}
      />
    </div>
  );
};
