import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProviders } from '../../src/app/providers/AppProviders';
import { AppLayout } from '../../src/app/layouts/AppLayout';
import { useNotifications } from '../../src/state/NotificationContext';
import { useFilters } from '../../src/state/FilterContext';

// Helper component to test context consumers
const ContextTester: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { filterConditions, setFilterConditions, isFilterActive } = useFilters();

  return (
    <div>
      <span data-testid="unread-count">{unreadCount}</span>
      <span data-testid="is-filter-active">{isFilterActive ? 'yes' : 'no'}</span>
      <button onClick={() => markAsRead(notifications[0]?.id || '')}>Mark First Read</button>
      <button onClick={() => setFilterConditions((prev) => ({ ...prev, minRainfall: 150 }))}>
        Set Filter
      </button>
    </div>
  );
};

describe('Application Layout & State Integration', () => {
  it('renders application shell layout with accessible skip link and header', () => {
    const handleNavigate = vi.fn();
    const handleRefresh = vi.fn();

    render(
      <AppProviders>
        <AppLayout
          currentView="overview"
          onNavigateView={handleNavigate}
          onRefresh={handleRefresh}
          isSyncingLive={false}
          secondsSinceSync={5}
          activeAlertCount={2}
          pendingInspectionCount={3}
          locations={[]}
          isAssistantOpen={false}
          setIsAssistantOpen={vi.fn()}
          isTourModalOpen={false}
          setIsTourModalOpen={vi.fn()}
          isStitchModalOpen={false}
          setIsStitchModalOpen={vi.fn()}
          isLiveGpsModalOpen={false}
          setIsLiveGpsModalOpen={vi.fn()}
          isRoadModalOpen={false}
          setIsRoadModalOpen={vi.fn()}
          isSatelliteModalOpen={false}
          setIsSatelliteModalOpen={vi.fn()}
          isIncidentModalOpen={false}
          setIsIncidentModalOpen={vi.fn()}
          isDataHierarchyModalOpen={false}
          setIsDataHierarchyModalOpen={vi.fn()}
          liveGpsCoords={{ lat: 11.5365, lon: 76.1322 }}
        >
          <div data-testid="content-area">Mission Control Overview</div>
        </AppLayout>
      </AppProviders>
    );

    // Verify skip link
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    // Verify content slot
    expect(screen.getByTestId('content-area')).toBeInTheDocument();
  });

  it('updates notification unread count and filter active flag across contexts', () => {
    render(
      <AppProviders>
        <ContextTester />
      </AppProviders>
    );

    const initialUnread = Number(screen.getByTestId('unread-count').textContent);
    expect(initialUnread).toBeGreaterThan(0);

    // Mark first notification read
    fireEvent.click(screen.getByText('Mark First Read'));
    const updatedUnread = Number(screen.getByTestId('unread-count').textContent);
    expect(updatedUnread).toBe(initialUnread - 1);

    // Set filter condition
    expect(screen.getByTestId('is-filter-active').textContent).toBe('no');
    fireEvent.click(screen.getByText('Set Filter'));
    expect(screen.getByTestId('is-filter-active').textContent).toBe('yes');
  });
});
