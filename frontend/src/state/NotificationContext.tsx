import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { C2Notification } from '../components/common/NotificationCenter';

export type { C2Notification };

export interface NotificationContextState {
  notifications: C2Notification[];
  unreadCount: number;
  criticalCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<C2Notification, 'id' | 'isRead'>) => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

const INITIAL_NOTIFICATIONS: C2Notification[] = [
  {
    id: 'NOTIF-01',
    timestamp: '10:42 IST',
    severity: 'CRITICAL',
    title: 'Pore Pressure Limit Exceeded at Chooralmala',
    message: 'GSI Piezometer PZ-01 recorded 68.4 kPa. Infinite slope Factor of Safety dropped to 0.88.',
    source: 'GSI Telemetry Mesh',
    isRead: false,
    actionView: 'overview',
    locationId: 1,
  },
  {
    id: 'NOTIF-02',
    timestamp: '10:35 IST',
    severity: 'CRITICAL',
    title: 'IMD Red Alert: Deluge Threshold Crossed',
    message: 'Vythiri AWS logged 442.5mm in 24h (Extremely Heavy Rainfall). Failure probability 94.2%.',
    source: 'IMD AWS & Radar',
    isRead: false,
    actionView: 'overview',
    locationId: 1,
  },
  {
    id: 'NOTIF-03',
    timestamp: '10:20 IST',
    severity: 'WARNING',
    title: 'NDMA Sachet CAP-CP Geofence Broadcasted',
    message: 'Targeted SMS evacuation alert issued via DoT telecom towers across Meppadi Taluk.',
    source: 'NDMA Sachet Portal',
    isRead: false,
    actionView: 'alerts',
  },
  {
    id: 'NOTIF-04',
    timestamp: '10:05 IST',
    severity: 'INFO',
    title: 'NDRF 4th Battalion Squad Alpha Mobilized',
    message: '60 disaster response personnel with sonar detectors and canine teams dispatched to Chooralmala.',
    source: 'NDMA NEOC Control',
    isRead: true,
    actionView: 'inspections',
  },
  {
    id: 'NOTIF-05',
    timestamp: '09:50 IST',
    severity: 'INFO',
    title: 'ISRO Bhuvan InSAR Coherence Refreshed',
    message: 'RISAT & Cartosat radar scene ingested. Slope velocity: -18mm/yr along upper escarpment.',
    source: 'ISRO NRSC Bhuvan',
    isRead: true,
    actionView: 'overview',
  },
];

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<C2Notification[]>(INITIAL_NOTIFICATIONS);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addNotification = useCallback((notif: Omit<C2Notification, 'id' | 'isRead'>) => {
    const newNotif: C2Notification = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalCount = notifications.filter((n) => !n.isRead && n.severity === 'CRITICAL').length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        criticalCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        dismissNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextState => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
