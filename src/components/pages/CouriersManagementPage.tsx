import React, { useState, useEffect } from 'react';
import { Truck, Search, Filter, Plus, Eye, Edit, Phone, Mail, Star, MapPin, Clock, CheckCircle, AlertTriangle, RefreshCw, Award, TrendingUp, BarChart3 } from 'lucide-react';
import type { Database } from '../../types/database';

type Courier = Database['public']['Tables']['couriers']['Row'];
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Badge, Modal, Input } from '../ui';
import { couriersService } from '../../services/supabaseService';

export default function CouriersManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const { logError, logInfo } = useErrorLogger();

  useEffect(() => {
    loadCouriers();
  }, []);

  const loadCouriers = async () => {
    try {
      setLoading(true);
      const data = await couriersService.getAll();
      setCouriers(data as any);
    } catch (error) {
      logError(error, 'CouriersManagementPage.loadCouriers');
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCouriers = couriers.filter(courier => {
    const matchesSearch = courier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courier.phone.includes(searchTerm) ||
                         courier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || courier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCouriers = couriers.length;
  const activeCouriers = couriers.filter(c => c.status === 'active').length;
  const busyCouriers = couriers.filter(c => c.status === 'busy').length;
  const totalCompletedTasks = couriers.reduce((sum, c) => sum + c.completedTasks, 0);
  const averageRating = couriers.reduce((sum, c) => sum + c.rating, 0) / couriers.length || 0;

  const handleAddNew = () => {
    setModalType('add');
    setSelectedCourier(null);
    setShowModal(true);
  };

  const handleEdit = (courier: Courier) => {
    setModalType('edit');
    setSelectedCourier(courier);
    setShowModal(true);
  };

  const handleView = (courier: Courier) => {
    setModalType('view');
    setSelectedCourier(courier);
    setShowModal(true);
  };

  const handleDelete = async (courier: Courier) => {
    if (confirm(`هل أنت متأكد من حذف المندوب "${courier.name}"؟`)) {
      logInfo(`محاكاة حذف المندوب: ${courier.name}`, 'CouriersManagementPage');
      await loadCouriers();
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">نشط</Badge>;
      case 'busy':
        return <Badge variant="warning">مشغول</Badge>;
      case 'offline':
        return <Badge variant="secondary">غير متصل</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1 space-x-reverse">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 mr-1">{rating.toFixed(1)}</span>
      </div>
    );
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-1">إجمالي المندوبين</p>
              <p className="text-3xl font-bold text-blue-900">{totalCouriers}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Truck className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">مندوبون نشطون</p>
              <p className="text-3xl font-bold text-green-900">{activeCouriers}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 mb-1">مندوبون مشغولون</p>
              <p className="text-3xl font-bold text-orange-900">{busyCouriers}</p>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-orange-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 mb-1">إجمالي التوصيلات</p>
              <p className="text-3xl font-bold text-purple-900">{totalCompletedTasks}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 mb-1">متوسط التقييم</p>
              <p className="text-3xl font-bold text-yellow-900">{averageRating.toFixed(1)}</p>
            </div>
            <div className="bg-yellow-200 p-3 rounded-xl">
              <Award className="w-6 h-6 text-yellow-700" />
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
                placeholder="البحث عن مندوب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="busy">مشغول</option>
              <option value="offline">غير متصل</option>
            </select>

            <Button onClick={handleAddNew} className="flex items-center">
              <Plus className="w-5 h-5 ml-2" />
              إضافة مندوب
            </Button>

            <Button variant="secondary" onClick={loadCouriers}>
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCouriers.map((courier) => (
            <Card key={courier.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 space-x-reverse flex-1">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{courier.name}</h3>
                      {getStatusBadge(courier.status)}
                      {courier.isHumanitarianApproved && (
                        <Badge variant="success" className="text-xs">
                          معتمد
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {getRatingStars(courier.rating)}

                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{courier.phone}</span>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{courier.email}</span>
                      </div>

                      {courier.currentLocation && (
                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {courier.currentLocation.lat.toFixed(4)}, {courier.currentLocation.lng.toFixed(4)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 space-x-reverse pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-1 space-x-reverse text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-gray-900">{courier.completedTasks}</span>
                          <span className="text-gray-600">مهمة مكتملة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 mr-4">
                  <button
                    onClick={() => handleView(courier)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="عرض التفاصيل"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(courier)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCall(courier.phone)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="اتصال"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCouriers.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد نتائج</p>
          </div>
        )}
      </Card>

      {showModal && (
        <CourierModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          courier={selectedCourier}
          type={modalType}
          onSave={loadCouriers}
        />
      )}
    </div>
  );
}

interface CourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: Courier | null;
  type: 'add' | 'edit' | 'view';
  onSave: () => void;
}

function CourierModal({ isOpen, onClose, courier, type, onSave }: CourierModalProps) {
  const [formData, setFormData] = useState({
    name: courier?.name || '',
    phone: courier?.phone || '',
    email: courier?.email || '',
    status: courier?.status || 'active',
    rating: courier?.rating || 5,
    isHumanitarianApproved: courier?.isHumanitarianApproved || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
    onClose();
  };

  const isViewMode = type === 'view';
  const title = type === 'add' ? 'إضافة مندوب جديد' : type === 'edit' ? 'تعديل بيانات المندوب' : 'تفاصيل المندوب';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="الاسم الكامل"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          label="البريد الإلكتروني"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isViewMode}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            disabled={isViewMode}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">نشط</option>
            <option value="busy">مشغول</option>
            <option value="offline">غير متصل</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="checkbox"
            id="isHumanitarianApproved"
            checked={formData.isHumanitarianApproved}
            onChange={(e) => setFormData({ ...formData, isHumanitarianApproved: e.target.checked })}
            disabled={isViewMode}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isHumanitarianApproved" className="text-sm font-medium text-gray-700">
            معتمد للعمل الإنساني
          </label>
        </div>

        {courier && (
          <Card className="bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">التقييم</p>
                <p className="font-semibold text-gray-900">{courier.rating} / 5</p>
              </div>
              <div>
                <p className="text-gray-600">المهام المكتملة</p>
                <p className="font-semibold text-gray-900">{courier.completedTasks}</p>
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
