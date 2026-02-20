import { useState, useEffect } from 'react';
import { alertsService } from '../services/supabaseService';
import { useErrorLogger } from '../utils/errorLogger';
import type { Database } from '../types/database';

type Alert = Database['public']['Tables']['alerts']['Row'];
type AlertInsert = Database['public']['Tables']['alerts']['Insert'];
type AlertUpdate = Database['public']['Tables']['alerts']['Update'];

interface UseAlertsOptions {
  isRead?: boolean;
  priority?: string;
  type?: string;
}

export const useAlerts = (options: UseAlertsOptions = {}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logInfo, logError } = useErrorLogger();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await alertsService.getAll();
      let filtered = data;

      if (options.isRead !== undefined) {
        filtered = filtered.filter(a => a.is_read === options.isRead);
      }

      if (options.priority) {
        filtered = filtered.filter(a => a.priority === options.priority);
      }

      if (options.type) {
        filtered = filtered.filter(a => a.type === options.type);
      }

      setAlerts(filtered);
      logInfo(`تم تحميل ${filtered.length} تنبيه من Supabase`, 'useAlerts');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل التنبيهات';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useAlerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [options.isRead, options.priority, options.type]);

  const addAlert = async (alertData: AlertInsert) => {
    try {
      setLoading(true);
      const newAlert = await alertsService.create(alertData);

      if (newAlert) {
        setAlerts(prev => [newAlert, ...prev]);
        logInfo(`تم إضافة تنبيه جديد`, 'useAlerts');
        return newAlert;
      }

      throw new Error('فشل في إضافة التنبيه');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إضافة التنبيه';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useAlerts');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAlert = async (id: string, updates: AlertUpdate) => {
    try {
      setLoading(true);
      const updated = await alertsService.update(id, updates);

      if (updated) {
        setAlerts(prev => prev.map(a => a.id === id ? updated : a));
        logInfo(`تم تحديث التنبيه: ${id}`, 'useAlerts');
        return updated;
      }

      throw new Error('فشل في تحديث التنبيه');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحديث التنبيه';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useAlerts');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      setLoading(true);
      await alertsService.delete(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      logInfo(`تم حذف التنبيه: ${id}`, 'useAlerts');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في حذف التنبيه';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useAlerts');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    return await updateAlert(id, { is_read: true });
  };

  const refetch = () => {
    fetchAlerts();
  };

  return {
    alerts,
    loading,
    error,
    addAlert,
    updateAlert,
    deleteAlert,
    markAsRead,
    refetch
  };
};
