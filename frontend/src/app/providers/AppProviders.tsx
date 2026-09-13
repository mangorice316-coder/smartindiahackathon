import React, { ReactNode } from 'react';
import { AppProvider } from '../../state/AppContext';
import { NotificationProvider } from '../../state/NotificationContext';
import { FilterProvider } from '../../state/FilterContext';

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Unified application provider composition.
 * Encapsulates global state slices without prop drilling.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AppProvider>
      <NotificationProvider>
        <FilterProvider>{children}</FilterProvider>
      </NotificationProvider>
    </AppProvider>
  );
};
