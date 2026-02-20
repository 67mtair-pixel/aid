import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Database } from '../types/database';
import { alertsService } from '../services/supabaseService';

type Alert = Database['public']['Tables']['alerts']['Row'];
type AlertInsert = Database['public']['Tables']['alerts']['Insert'];

interface AlertsContextType {
  alerts: Alert[];
  unreadAlerts: Alert[];
  criticalAlerts: Alert[];
  addAlert: (alert: AlertInsert) => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  removeAlert: (alertId: string) => Promise<void>;
  clearAllAlerts: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};

interface AlertsProviderProps {
  children: ReactNode;
}

export const AlertsProvider: React.FC<AlertsProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = async () => {
    try {
      const data = await alertsService.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const unreadAlerts = useMemo(() =>
    alerts.filter(alert => !alert.is_read),
    [alerts]
  );

  const criticalAlerts = useMemo(() =>
    alerts.filter(alert => alert.priority === 'critical' && !alert.is_read),
    [alerts]
  );

  const addAlert = async (alertData: AlertInsert) => {
    try {
      const newAlert = await alertsService.create(alertData);
      if (newAlert) {
        setAlerts(prev => [newAlert, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add alert:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await alertsService.update(alertId, { is_read: true });
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, is_read: true }
            : alert
        )
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const removeAlert = async (alertId: string) => {
    try {
      await alertsService.delete(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to remove alert:', error);
    }
  };

  const clearAllAlerts = async () => {
    try {
      for (const alert of alerts) {
        await alertsService.delete(alert.id);
      }
      setAlerts([]);
    } catch (error) {
      console.error('Failed to clear alerts:', error);
    }
  };

  const value = {
    alerts,
    unreadAlerts,
    criticalAlerts,
    addAlert,
    markAsRead,
    removeAlert,
    clearAllAlerts,
    refetch: fetchAlerts
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
};