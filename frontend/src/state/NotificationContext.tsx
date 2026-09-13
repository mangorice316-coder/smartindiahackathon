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
    severity: 'WARNING',
    title: 'Cumulative Rainfall Threshold Crossed',
    message: 'Meppadi AWS logged 184mm in 24h. Slope failure probability elevated to 74%.',
    source: 'IMD AWS Station',
    isRead: false,
    actionView: 'overview',
    locationId: 2,
  },
  {
    id: 'NOTIF-03',
    timestamp: '10:15 AM',
    severity: 'WARNING',
    title: 'Culvert Debris Jam Reported',
    message: 'Field inspection task #INSP-2024-008 flagged drainage block near Puthumala.',
    source: 'Civil Defense Drone',
    isRead: true,
    actionView: 'inspections',
  },
  {
    id: 'NOTIF-04',
    timestamp: '09:50 AM',
    severity: 'INFO',
    title: 'SAR Satellite Coherence Map Refreshed',
    message: 'Sentinel-1 InSAR scene ingested. Ground deformation velocity: -18mm/yr.',
    source: 'ESA Sentinel-1 API',
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
