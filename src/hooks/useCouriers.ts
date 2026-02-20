import { useState, useEffect, useMemo } from 'react';
import { couriersService } from '../services/supabaseService';
import { useErrorLogger } from '../utils/errorLogger';
import type { Database } from '../types/database';

type Courier = Database['public']['Tables']['couriers']['Row'];
type CourierInsert = Database['public']['Tables']['couriers']['Insert'];
type CourierUpdate = Database['public']['Tables']['couriers']['Update'];

interface UseCouriersOptions {
  searchTerm?: string;
  status?: string;
}

export const useCouriers = (options: UseCouriersOptions = {}) => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logInfo, logError } = useErrorLogger();

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await couriersService.getAll();
      setCouriers(data);
      logInfo(`تم تحميل ${data.length} ساعي من Supabase`, 'useCouriers');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل السعاة';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useCouriers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const filteredCouriers = useMemo(() => {
    let filtered = [...couriers];

    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(options.searchTerm!) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }

    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(c => c.status === options.status);
    }

    return filtered;
  }, [couriers, options.searchTerm, options.status]);

  const statistics = useMemo(() => {
    return {
      total: couriers.length,
      active: couriers.filter(c => c.status === 'active').length,
      busy: couriers.filter(c => c.status === 'busy').length,
      offline: couriers.filter(c => c.status === 'offline').length,
      totalTasks: couriers.reduce((sum, c) => sum + (c.completed_tasks || 0), 0),
      averageRating: couriers.length > 0
        ? couriers.reduce((sum, c) => sum + (Number(c.rating) || 0), 0) / couriers.length
        : 0
    };
  }, [couriers]);

  const addCourier = async (courierData: CourierInsert) => {
    try {
      setLoading(true);
      const newCourier = await couriersService.create(courierData);

      if (newCourier) {
        setCouriers(prev => [newCourier, ...prev]);
        logInfo(`تم إضافة ساعي جديد: ${newCourier.name}`, 'useCouriers');
        return newCourier;
      }

      throw new Error('فشل في إضافة الساعي');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إضافة الساعي';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useCouriers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCourier = async (id: string, updates: CourierUpdate) => {
    try {
      setLoading(true);
      const updated = await couriersService.update(id, updates);

      if (updated) {
        setCouriers(prev =>
          prev.map(c => c.id === id ? updated : c)
        );
        logInfo(`تم تحديث الساعي: ${id}`, 'useCouriers');
        return updated;
      }

      throw new Error('فشل في تحديث الساعي');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحديث الساعي';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useCouriers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCourier = async (id: string) => {
    try {
      setLoading(true);
      await couriersService.delete(id);
      setCouriers(prev => prev.filter(c => c.id !== id));
      logInfo(`تم حذف الساعي: ${id}`, 'useCouriers');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في حذف الساعي';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useCouriers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCouriers();
  };

  return {
    couriers: filteredCouriers,
    allCouriers: couriers,
    loading,
    error,
    statistics,
    addCourier,
    updateCourier,
    deleteCourier,
    refetch
  };
};

export const useCourier = (id: string) => {
  const [courier, setCourier] = useState<Courier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourier = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await couriersService.getById(id);
          setCourier(data);
          setError(data ? null : 'الساعي غير موجود');
        } catch (err) {
          setError('خطأ في تحميل الساعي');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCourier();
  }, [id]);

  return { courier, loading, error };
};
