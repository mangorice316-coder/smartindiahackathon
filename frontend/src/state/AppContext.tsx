import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SystemStatusType = 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';

export interface AppContextState {
  selectedLocationId: number | null;
  setSelectedLocationId: (id: number | null) => void;
  dataMode: 'DEMO' | 'REAL';
  setDataMode: (mode: 'DEMO' | 'REAL') => void;
  systemStatus: SystemStatusType;
  setSystemStatus: (status: SystemStatusType) => void;
  isBackendConnected: boolean;
  setIsBackendConnected: (connected: boolean) => void;
  lastSyncTime: Date;
  setLastSyncTime: (date: Date) => void;
  isLiveStreaming: boolean;
  setIsLiveStreaming: (streaming: boolean) => void;
  thresholds: {
    LOW_MAX: number;
    MODERATE_MAX: number;
    HIGH_MAX: number;
  };
  setThresholds: React.Dispatch<React.SetStateAction<{ LOW_MAX: number; MODERATE_MAX: number; HIGH_MAX: number }>>;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [dataMode, setDataMode] = useState<'DEMO' | 'REAL'>('REAL');
  const [systemStatus, setSystemStatus] = useState<SystemStatusType>('OPERATIONAL');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [thresholds, setThresholds] = useState<{ LOW_MAX: number; MODERATE_MAX: number; HIGH_MAX: number }>({
    LOW_MAX: 30.0,
    MODERATE_MAX: 50.0,
    HIGH_MAX: 70.0,
  });

  return (
    <AppContext.Provider
      value={{
        selectedLocationId,
        setSelectedLocationId,
        dataMode,
        setDataMode,
        systemStatus,
        setSystemStatus,
        isBackendConnected,
        setIsBackendConnected,
        lastSyncTime,
        setLastSyncTime,
        isLiveStreaming,
        setIsLiveStreaming,
        thresholds,
        setThresholds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
