import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, Plus, Eye, Edit, Phone, Mail, CheckCircle, Clock, AlertTriangle, Users, Package, Star, TrendingUp, Download, MapPin, Calendar, RefreshCw } from 'lucide-react';
import type { Database } from '../../types/database';

type Organization = Database['public']['Tables']['organizations']['Row'];
import { useErrorLogger } from '../../utils/errorLogger';
import { Button } from '../ui';
import { organizationsService } from '../../services/supabaseService';
import OrganizationForm from '../OrganizationForm';

interface OrganizationsListPageProps {
  loggedInUser?: any;
  highlightOrganizationId?: string;
}

export default function OrganizationsListPage({ loggedInUser, highlightOrganizationId }: OrganizationsListPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { logError, logInfo } = useErrorLogger();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationsService.getAll();
      setOrganizations(data as any);
    } catch (error) {
      logError(error, 'OrganizationsListPage.loadOrganizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadOrganizations();
  };

  const insert = async (data: Partial<Organization>) => {
    try {
      await organizationsService.create(data as any);
      await loadOrganizations();
      return true;
    } catch (error) {
      logError(error, 'OrganizationsListPage.insert');
      return false;
    }
  };

  const update = async (id: string, data: Partial<Organization>) => {
    try {
      await organizationsService.update(id, data);
      await loadOrganizations();
      return true;
    } catch (error) {
      logError(error, 'OrganizationsListPage.update');
      return false;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      logInfo(`حذف مؤسسة: ${id}`, 'OrganizationsListPage');
      await loadOrganizations();
      return true;
    } catch (error) {
      logError(error, 'OrganizationsListPage.delete');
      return false;
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter(o => o.status === 'active').length;
  const totalBeneficiaries = organizations.reduce((sum, o) => sum + (o.beneficiariesCount || 0), 0);
  const totalPackages = organizations.reduce((sum, o) => sum + (o.packagesCount || 0), 0);

  const handleAddNew = () => {
    setModalType('add');
    setSelectedOrganization(null);
    setShowModal(true);
  };

  const handleView = (org: Organization) => {
    setModalType('view');
    setSelectedOrganization(org);
    setShowModal(true);
  };

  const handleEdit = (org: Organization) => {
    setModalType('edit');
    setSelectedOrganization(org);
    setShowModal(true);
  };

  const handleSave = async (data: Partial<Organization>) => {
    if (modalType === 'add') {
      await insert(data);
    } else if (modalType === 'edit' && selectedOrganization) {
      await update(selectedOrganization.id, data);
    }
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المؤسسات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة المؤسسات</h1>
            <p className="text-gray-600">إدارة المؤسسات الإنسانية والجهات المانحة</p>
          </div>
          <Button onClick={handleAddNew} className="flex items-center space-x-2 space-x-reverse">
            <Plus className="w-4 h-4" />
            <span>إضافة مؤسسة</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المؤسسات</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrganizations}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">المؤسسات النشطة</p>
                <p className="text-2xl font-bold text-green-600">{activeOrganizations}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المستفيدين</p>
                <p className="text-2xl font-bold text-gray-900">{totalBeneficiaries}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الطرود</p>
                <p className="text-2xl font-bold text-gray-900">{totalPackages}</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في المؤسسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="pending">قيد المراجعة</option>
            <option value="suspended">معلق</option>
          </select>
          <Button onClick={refetch} variant="secondary" className="flex items-center space-x-2 space-x-reverse">
            <RefreshCw className="w-4 h-4" />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrganizations.map((org) => (
          <div
            key={org.id}
            className={`bg-white p-6 rounded-xl border transition-all ${
              highlightOrganizationId === org.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      org.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : org.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {org.status === 'active' ? 'نشط' : org.status === 'pending' ? 'قيد المراجعة' : 'معلق'}
                  </span>
                  {org.isPopular && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{org.type}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{org.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{org.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{org.email}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 space-x-reverse mt-4">
                  <div className="text-sm">
                    <span className="text-gray-600">المستفيدون: </span>
                    <span className="font-semibold text-gray-900">{org.beneficiariesCount || 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">الطرود: </span>
                    <span className="font-semibold text-gray-900">{org.packagesCount || 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">معدل الإنجاز: </span>
                    <span className="font-semibold text-green-600">{org.completionRate || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse mr-4">
                <button
                  onClick={() => handleView(org)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="عرض"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(org)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="تعديل"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد مؤسسات</p>
          </div>
        )}
      </div>

      {showModal && (
        <OrganizationForm
          mode={modalType}
          organization={selectedOrganization}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
