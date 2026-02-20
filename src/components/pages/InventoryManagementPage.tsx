import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { inventoryService } from '../../services/inventoryService';
import type { InventoryItem } from '../../types/database';

export default function InventoryManagementPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'critical' | 'expiring'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [statistics, setStatistics] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    criticalItems: 0,
    averageStockLevel: 0
  });

  useEffect(() => {
    loadInventory();

    const unsubscribe = inventoryService.subscribeToInventoryChanges(() => {
      loadInventory();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, filter]);

  const loadInventory = async () => {
    setLoading(true);
    const data = await inventoryService.getAllInventoryItems();
    setItems(data);

    const stats = await inventoryService.getInventoryStatistics();
    setStatistics(stats);

    setLoading(false);
  };

  const filterItems = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filter) {
      case 'low':
        filtered = filtered.filter(item =>
          parseFloat(item.current_quantity.toString()) <= parseFloat(item.minimum_threshold.toString())
        );
        break;
      case 'critical':
        filtered = filtered.filter(item => item.is_critical);
        break;
      case 'expiring':
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        filtered = filtered.filter(item =>
          item.expiry_date && new Date(item.expiry_date) <= thirtyDaysFromNow
        );
        break;
    }

    setFilteredItems(filtered);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      await inventoryService.deleteInventoryItem(id);
      loadInventory();
    }
  };

  const handleRestock = async (item: InventoryItem) => {
    const quantity = prompt('أدخل الكمية المراد إضافتها:');
    if (quantity) {
      await inventoryService.restockInventory(item.id, parseFloat(quantity));
      loadInventory();
    }
  };

  const handleConsume = async (item: InventoryItem) => {
    const quantity = prompt('أدخل الكمية المراد استهلاكها:');
    if (quantity) {
      await inventoryService.consumeInventory(item.id, parseFloat(quantity));
      loadInventory();
    }
  };

  const getStockLevelColor = (item: InventoryItem) => {
    const current = parseFloat(item.current_quantity.toString());
    const threshold = parseFloat(item.minimum_threshold.toString());
    const max = parseFloat(item.maximum_capacity.toString());

    const percentage = (current / max) * 100;

    if (current <= threshold) return 'text-red-600 bg-red-100';
    if (percentage < 30) return 'text-orange-600 bg-orange-100';
    if (percentage < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockLevelText = (item: InventoryItem) => {
    const current = parseFloat(item.current_quantity.toString());
    const threshold = parseFloat(item.minimum_threshold.toString());

    if (current <= threshold) return 'منخفض جداً';
    if (current <= threshold * 2) return 'منخفض';
    return 'جيد';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">جارٍ تحميل بيانات المخزون...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">إدارة المخزون</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredItems.length} عنصر • {statistics.lowStockItems} منخفض
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => inventoryService.exportDataToCSV('inventory')}>
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة عنصر
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">إجمالي العناصر</span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalItems}</p>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">القيمة الإجمالية</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ${statistics.totalValue.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">مخزون منخفض</span>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{statistics.lowStockItems}</p>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">عناصر حرجة</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{statistics.criticalItems}</p>
        </Card>
      </div>

      <Card className="p-6 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="بحث في المخزون..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              الكل
            </Button>
            <Button
              variant={filter === 'low' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('low')}
            >
              منخفض
            </Button>
            <Button
              variant={filter === 'critical' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
            >
              حرج
            </Button>
            <Button
              variant={filter === 'expiring' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('expiring')}
            >
              ينتهي قريباً
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={loadInventory}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">اسم العنصر</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">الفئة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">الكمية الحالية</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">الحد الأدنى</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">تاريخ الانتهاء</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      {item.is_critical && (
                        <AlertTriangle className="w-4 h-4 text-red-600 ml-2" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{item.item_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{item.item_category}</td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {parseFloat(item.current_quantity.toString()).toFixed(2)} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                    {parseFloat(item.minimum_threshold.toString()).toFixed(2)} {item.unit}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStockLevelColor(item)}`}>
                      {getStockLevelText(item)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestock(item)}
                        title="إعادة التعبئة"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConsume(item)}
                        title="استهلاك"
                      >
                        <TrendingDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAddModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>لا توجد عناصر في المخزون</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
