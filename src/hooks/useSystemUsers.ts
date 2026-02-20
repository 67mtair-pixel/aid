import { useState, useEffect, useMemo } from 'react';
import { systemUsersService } from '../services/supabaseService';
import { useErrorLogger } from '../utils/errorLogger';
import type { Database } from '../types/database';

type SystemUser = Database['public']['Tables']['system_users']['Row'];
type SystemUserInsert = Database['public']['Tables']['system_users']['Insert'];
type SystemUserUpdate = Database['public']['Tables']['system_users']['Update'];

interface UseSystemUsersOptions {
  searchTerm?: string;
  roleId?: string;
  status?: string;
}

export const useSystemUsers = (options: UseSystemUsersOptions = {}) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logInfo, logError } = useErrorLogger();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await systemUsersService.getAll();
      setUsers(data);
      logInfo(`تم تحميل ${data.length} مستخدم من Supabase`, 'useSystemUsers');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل المستخدمين';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useSystemUsers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.includes(options.searchTerm!)
      );
    }

    if (options.roleId) {
      filtered = filtered.filter(u => u.role_id === options.roleId);
    }

    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(u => u.status === options.status);
    }

    return filtered;
  }, [users, options.searchTerm, options.roleId, options.status]);

  const statistics = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      suspended: users.filter(u => u.status === 'suspended').length
    };
  }, [users]);

  const addUser = async (userData: SystemUserInsert) => {
    try {
      setLoading(true);
      const newUser = await systemUsersService.create(userData);

      if (newUser) {
        setUsers(prev => [newUser, ...prev]);
        logInfo(`تم إضافة مستخدم جديد: ${newUser.name}`, 'useSystemUsers');
        return newUser;
      }

      throw new Error('فشل في إضافة المستخدم');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إضافة المستخدم';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useSystemUsers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, updates: SystemUserUpdate) => {
    try {
      setLoading(true);
      const updated = await systemUsersService.update(id, updates);

      if (updated) {
        setUsers(prev =>
          prev.map(u => u.id === id ? updated : u)
        );
        logInfo(`تم تحديث المستخدم: ${id}`, 'useSystemUsers');
        return updated;
      }

      throw new Error('فشل في تحديث المستخدم');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحديث المستخدم';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useSystemUsers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setLoading(true);
      await systemUsersService.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      logInfo(`تم حذف المستخدم: ${id}`, 'useSystemUsers');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في حذف المستخدم';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useSystemUsers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchUsers();
  };

  return {
    users: filteredUsers,
    allUsers: users,
    loading,
    error,
    statistics,
    addUser,
    updateUser,
    deleteUser,
    refetch
  };
};

export const useSystemUser = (id: string) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await systemUsersService.getById(id);
          setUser(data);
          setError(data ? null : 'المستخدم غير موجود');
        } catch (err) {
          setError('خطأ في تحميل المستخدم');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, [id]);

  return { user, loading, error };
};
