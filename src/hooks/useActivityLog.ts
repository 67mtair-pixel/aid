import { useState, useEffect, useMemo } from 'react';
import { activityLogService } from '../services/supabaseService';
import { useErrorLogger } from '../utils/errorLogger';
import type { Database } from '../types/database';

type ActivityLog = Database['public']['Tables']['activity_log']['Row'];
type ActivityLogInsert = Database['public']['Tables']['activity_log']['Insert'];

interface UseActivityLogOptions {
  beneficiaryId?: string;
  type?: string;
  role?: string;
  limit?: number;
}

export const useActivityLog = (options: UseActivityLogOptions = {}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logInfo, logError } = useErrorLogger();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await activityLogService.getAll();
      let filtered = data;

      if (options.beneficiaryId) {
        filtered = filtered.filter(a => a.beneficiary_id === options.beneficiaryId);
      }

      if (options.type) {
        filtered = filtered.filter(a => a.type === options.type);
      }

      if (options.role) {
        filtered = filtered.filter(a => a.role === options.role);
      }

      filtered.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      setActivities(filtered);
      logInfo(`تم تحميل ${filtered.length} نشاط من Supabase`, 'useActivityLog');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل سجل الأنشطة';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useActivityLog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [options.beneficiaryId, options.type, options.role, options.limit]);

  const statistics = useMemo(() => {
    return {
      total: activities.length,
      byType: activities.reduce((acc, activity) => {
        const type = activity.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byRole: activities.reduce((acc, activity) => {
        const role = activity.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [activities]);

  const addActivity = async (activityData: ActivityLogInsert) => {
    try {
      setLoading(true);
      const newActivity = await activityLogService.create(activityData);

      if (newActivity) {
        setActivities(prev => [newActivity, ...prev]);
        logInfo(`تم إضافة نشاط جديد`, 'useActivityLog');
        return newActivity;
      }

      throw new Error('فشل في إضافة النشاط');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إضافة النشاط';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useActivityLog');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchActivities();
  };

  return {
    activities,
    loading,
    error,
    statistics,
    addActivity,
    refetch
  };
};
