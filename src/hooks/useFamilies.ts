import { useState, useEffect, useMemo } from 'react';
import { familiesService } from '../services/supabaseService';
import { useErrorLogger } from '../utils/errorLogger';
import type { Database } from '../types/database';

type Family = Database['public']['Tables']['families']['Row'];
type FamilyInsert = Database['public']['Tables']['families']['Insert'];
type FamilyUpdate = Database['public']['Tables']['families']['Update'];

interface UseFamiliesOptions {
  searchTerm?: string;
  location?: string;
}

export const useFamilies = (options: UseFamiliesOptions = {}) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logInfo, logError } = useErrorLogger();

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await familiesService.getAll();
      setFamilies(data);
      logInfo(`تم تحميل ${data.length} عائلة من Supabase`, 'useFamilies');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل العائلات';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useFamilies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const filteredFamilies = useMemo(() => {
    let filtered = [...families];

    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.name?.toLowerCase().includes(searchLower) ||
        f.head_of_family?.toLowerCase().includes(searchLower) ||
        f.phone?.includes(options.searchTerm!)
      );
    }

    if (options.location && options.location !== 'all') {
      filtered = filtered.filter(f => f.location === options.location);
    }

    return filtered;
  }, [families, options.searchTerm, options.location]);

  const statistics = useMemo(() => {
    return {
      total: families.length,
      totalMembers: families.reduce((sum, f) => sum + (f.members_count || 0), 0),
      totalPackages: families.reduce((sum, f) => sum + (f.packages_distributed || 0), 0),
      averageMembers: families.length > 0
        ? families.reduce((sum, f) => sum + (f.members_count || 0), 0) / families.length
        : 0
    };
  }, [families]);

  const addFamily = async (familyData: FamilyInsert) => {
    try {
      setLoading(true);
      const newFamily = await familiesService.create(familyData);

      if (newFamily) {
        setFamilies(prev => [newFamily, ...prev]);
        logInfo(`تم إضافة عائلة جديدة: ${newFamily.name}`, 'useFamilies');
        return newFamily;
      }

      throw new Error('فشل في إضافة العائلة');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إضافة العائلة';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useFamilies');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFamily = async (id: string, updates: FamilyUpdate) => {
    try {
      setLoading(true);
      const updated = await familiesService.update(id, updates);

      if (updated) {
        setFamilies(prev =>
          prev.map(f => f.id === id ? updated : f)
        );
        logInfo(`تم تحديث العائلة: ${id}`, 'useFamilies');
        return updated;
      }

      throw new Error('فشل في تحديث العائلة');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحديث العائلة';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useFamilies');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFamily = async (id: string) => {
    try {
      setLoading(true);
      await familiesService.delete(id);
      setFamilies(prev => prev.filter(f => f.id !== id));
      logInfo(`تم حذف العائلة: ${id}`, 'useFamilies');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في حذف العائلة';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useFamilies');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchFamilies();
  };

  return {
    families: filteredFamilies,
    allFamilies: families,
    loading,
    error,
    statistics,
    addFamily,
    updateFamily,
    deleteFamily,
    refetch
  };
};

export const useFamily = (id: string) => {
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFamily = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await familiesService.getById(id);
          setFamily(data);
          setError(data ? null : 'العائلة غير موجودة');
        } catch (err) {
          setError('خطأ في تحميل العائلة');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFamily();
  }, [id]);

  return { family, loading, error };
};
