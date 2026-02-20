import React, { useState, useEffect } from 'react';
import { Heart, Search, Plus, Eye, Edit, Phone, MapPin, Users, Package, TrendingUp, RefreshCw, UserCheck, Baby, Activity, Calendar } from 'lucide-react';
import { type Family, type Beneficiary, getBeneficiariesByFamily } from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Badge, Modal, Input } from '../ui';
import { familiesService } from '../../services/supabaseService';

export default function FamiliesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const { logError, logInfo } = useErrorLogger();

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      setLoading(true);
      const data = await familiesService.getAll();
      setFamilies(data as any);
    } catch (error) {
      logError(error, 'FamiliesListPage.loadFamilies');
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFamilies = families.filter(family => {
    const matchesSearch = family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         family.headOfFamily.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         family.phone.includes(searchTerm) ||
                         family.location.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalFamilies = families.length;
  const totalMembers = families.reduce((sum, f) => sum + f.membersCount, 0);
  const totalPackages = families.reduce((sum, f) => sum + f.packagesDistributed, 0);
  const averageCompletionRate = families.reduce((sum, f) => sum + f.completionRate, 0) / families.length || 0;

  const handleAddNew = () => {
    setModalType('add');
    setSelectedFamily(null);
    setShowModal(true);
  };

  const handleEdit = (family: Family) => {
    setModalType('edit');
    setSelectedFamily(family);
    setShowModal(true);
  };

  const handleView = (family: Family) => {
    setModalType('view');
    setSelectedFamily(family);
    setShowModal(true);
  };

  const handleDelete = async (family: Family) => {
    if (confirm(`هل أنت متأكد من حذف العائلة "${family.name}"؟`)) {
      logInfo(`محاكاة حذف العائلة: ${family.name}`, 'FamiliesListPage');
      await loadFamilies();
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-600 mb-1">إجمالي العائلات</p>
              <p className="text-3xl font-bold text-pink-900">{totalFamilies}</p>
            </div>
            <div className="bg-pink-200 p-3 rounded-xl">
              <Heart className="w-6 h-6 text-pink-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-1">إجمالي الأفراد</p>
              <p className="text-3xl font-bold text-blue-900">{totalMembers}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">الطرود الموزعة</p>
              <p className="text-3xl font-bold text-green-900">{totalPackages}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <Package className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 mb-1">متوسط نسبة الإنجاز</p>
              <p className="text-3xl font-bold text-purple-900">{averageCompletionRate.toFixed(0)}%</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="البحث عن عائلة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <Button onClick={handleAddNew} className="flex items-center">
              <Plus className="w-5 h-5 ml-2" />
              إضافة عائلة
            </Button>

            <Button variant="secondary" onClick={loadFamilies}>
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFamilies.map((family) => (
            <Card key={family.id} className="hover:shadow-lg transition-shadow border-r-4 border-r-pink-500">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 space-x-reverse flex-1">
                    <div className="bg-pink-100 p-3 rounded-xl">
                      <Heart className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{family.name}</h3>
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-2">
                        <UserCheck className="w-4 h-4" />
                        <span>رب الأسرة: {family.headOfFamily}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 mr-4">
                    <button
                      onClick={() => handleView(family)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(family)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleCall(family.phone)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="اتصال"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">عدد الأفراد</p>
                      <p className="font-semibold text-gray-900">{family.membersCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Baby className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-500">عدد الأطفال</p>
                      <p className="font-semibold text-gray-900">{family.totalChildren}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Activity className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-xs text-gray-500">الحالات الطبية</p>
                      <p className="font-semibold text-gray-900">{family.totalMedicalCases}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">متوسط العمر</p>
                      <p className="font-semibold text-gray-900">{family.averageAge} سنة</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{family.location}</span>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-3">
                    <Phone className="w-4 h-4" />
                    <span>{family.phone}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{family.packagesDistributed}</span> طرد موزع
                      </span>
                    </div>
                    <Badge variant={family.completionRate >= 80 ? 'success' : family.completionRate >= 50 ? 'warning' : 'secondary'}>
                      {family.completionRate}% إنجاز
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredFamilies.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد نتائج</p>
          </div>
        )}
      </Card>

      {showModal && (
        <FamilyModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          family={selectedFamily}
          type={modalType}
          onSave={loadFamilies}
        />
      )}
    </div>
  );
}

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: Family | null;
  type: 'add' | 'edit' | 'view';
  onSave: () => void;
}

function FamilyModal({ isOpen, onClose, family, type, onSave }: FamilyModalProps) {
  const [formData, setFormData] = useState({
    name: family?.name || '',
    headOfFamily: family?.headOfFamily || '',
    phone: family?.phone || '',
    location: family?.location || '',
    membersCount: family?.membersCount || 1,
    totalChildren: family?.totalChildren || 0,
    totalMedicalCases: family?.totalMedicalCases || 0,
    averageAge: family?.averageAge || 30
  });

  const [familyMembers, setFamilyMembers] = useState<Beneficiary[]>([]);

  useEffect(() => {
    if (family) {
      const members = getBeneficiariesByFamily(family.id);
      setFamilyMembers(members);
    }
  }, [family]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
    onClose();
  };

  const isViewMode = type === 'view';
  const title = type === 'add' ? 'إضافة عائلة جديدة' : type === 'edit' ? 'تعديل بيانات العائلة' : 'تفاصيل العائلة';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="اسم العائلة"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isViewMode}
          placeholder="عائلة آل..."
        />

        <Input
          label="رب الأسرة"
          value={formData.headOfFamily}
          onChange={(e) => setFormData({ ...formData, headOfFamily: e.target.value })}
          required
          disabled={isViewMode}
        />

        <Input
          label="رقم الهاتف"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          disabled={isViewMode}
        />

        <Input
          label="الموقع"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
          disabled={isViewMode}
          placeholder="المدينة - الحي"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="عدد أفراد الأسرة"
            type="number"
            value={formData.membersCount}
            onChange={(e) => setFormData({ ...formData, membersCount: parseInt(e.target.value) || 1 })}
            required
            disabled={isViewMode}
            min={1}
          />

          <Input
            label="عدد الأطفال"
            type="number"
            value={formData.totalChildren}
            onChange={(e) => setFormData({ ...formData, totalChildren: parseInt(e.target.value) || 0 })}
            disabled={isViewMode}
            min={0}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="عدد الحالات الطبية"
            type="number"
            value={formData.totalMedicalCases}
            onChange={(e) => setFormData({ ...formData, totalMedicalCases: parseInt(e.target.value) || 0 })}
            disabled={isViewMode}
            min={0}
          />

          <Input
            label="متوسط عمر الأسرة"
            type="number"
            value={formData.averageAge}
            onChange={(e) => setFormData({ ...formData, averageAge: parseInt(e.target.value) || 30 })}
            disabled={isViewMode}
            min={1}
          />
        </div>

        {family && isViewMode && familyMembers.length > 0 && (
          <Card className="bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 ml-2 text-blue-600" />
              أفراد العائلة ({familyMembers.length})
            </h4>
            <div className="space-y-2">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.gender === 'male' ? 'ذكر' : 'أنثى'} - {member.age} سنة</p>
                  </div>
                  {member.medicalConditions && member.medicalConditions.length > 0 && (
                    <Badge variant="warning" className="text-xs">
                      حالة طبية
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {family && isViewMode && (
          <Card className="bg-blue-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">الطرود الموزعة</p>
                <p className="font-semibold text-gray-900">{family.packagesDistributed}</p>
              </div>
              <div>
                <p className="text-gray-600">نسبة الإنجاز</p>
                <p className="font-semibold text-gray-900">{family.completionRate}%</p>
              </div>
              <div>
                <p className="text-gray-600">تاريخ التسجيل</p>
                <p className="font-semibold text-gray-900">{new Date(family.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          </Card>
        )}

        {!isViewMode && (
          <div className="flex space-x-3 space-x-reverse pt-4">
            <Button type="submit" className="flex-1">
              {type === 'add' ? 'إضافة' : 'حفظ التعديلات'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
