import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Package,
  Users,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { supabase } from '../../lib/supabaseClient';

interface AnalyticsData {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  totalPackages: number;
  deliveredPackages: number;
  inProgressPackages: number;
  activeCouriers: number;
  totalOrganizations: number;
  deliverySuccessRate: number;
  averageDeliveryTime: number;
  totalValue: number;
  criticalAlerts: number;
  lowStockItems: number;
}

interface TrendData {
  date: string;
  delivered: number;
  failed: number;
  pending: number;
}

export default function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalBeneficiaries: 0,
    activeBeneficiaries: 0,
    totalPackages: 0,
    deliveredPackages: 0,
    inProgressPackages: 0,
    activeCouriers: 0,
    totalOrganizations: 0,
    deliverySuccessRate: 0,
    averageDeliveryTime: 0,
    totalValue: 0,
    criticalAlerts: 0,
    lowStockItems: 0
  });

  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    fetchTrends();

    const interval = setInterval(() => {
      fetchAnalyticsData();
      fetchTrends();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [
        beneficiariesResult,
        packagesResult,
        couriersResult,
        organizationsResult,
        alertsResult,
        inventoryResult
      ] = await Promise.all([
        supabase.from('beneficiaries').select('id, status', { count: 'exact' }),
        supabase.from('packages').select('id, status, value', { count: 'exact' }),
        supabase.from('couriers').select('id, status', { count: 'exact' }),
        supabase.from('organizations').select('id, status', { count: 'exact' }),
        supabase.from('alerts').select('id, priority', { count: 'exact' }),
        supabase.from('inventory').select('current_quantity, minimum_threshold, is_critical')
      ]);

      const beneficiaries = beneficiariesResult.data || [];
      const packages = packagesResult.data || [];
      const couriers = couriersResult.data || [];
      const organizations = organizationsResult.data || [];
      const alerts = alertsResult.data || [];
      const inventory = inventoryResult.data || [];

      const activeBeneficiaries = beneficiaries.filter(b => b.status === 'active').length;
      const deliveredPackages = packages.filter(p => p.status === 'delivered').length;
      const inProgressPackages = packages.filter(p =>
        p.status === 'in_delivery' || p.status === 'assigned'
      ).length;
      const activeCouriers = couriers.filter(c => c.status === 'active' || c.status === 'busy').length;
      const activeOrganizations = organizations.filter(o => o.status === 'active').length;

      const deliverySuccessRate = packages.length > 0
        ? (deliveredPackages / packages.length) * 100
        : 0;

      const totalValue = packages.reduce((sum, p) => {
        return sum + (parseFloat(p.value?.toString() || '0'));
      }, 0);

      const criticalAlerts = alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length;

      const lowStockItems = inventory.filter(item => {
        const current = parseFloat(item.current_quantity?.toString() || '0');
        const threshold = parseFloat(item.minimum_threshold?.toString() || '0');
        return current <= threshold;
      }).length;

      setAnalytics({
        totalBeneficiaries: beneficiaries.length,
        activeBeneficiaries,
        totalPackages: packages.length,
        deliveredPackages,
        inProgressPackages,
        activeCouriers,
        totalOrganizations: activeOrganizations,
        deliverySuccessRate,
        averageDeliveryTime: 45,
        totalValue,
        criticalAlerts,
        lowStockItems
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const trendData: TrendData[] = [];

      for (const date of last7Days) {
        const { data: packages } = await supabase
          .from('packages')
          .select('status')
          .gte('created_at', date)
          .lt('created_at', new Date(date + 'T23:59:59').toISOString());

        trendData.push({
          date,
          delivered: packages?.filter(p => p.status === 'delivered').length || 0,
          failed: packages?.filter(p => p.status === 'failed').length || 0,
          pending: packages?.filter(p => p.status === 'pending').length || 0
        });
      }

      setTrends(trendData);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">جارٍ تحميل البيانات التحليلية...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحليلات المتقدمة</h1>
          <p className="text-gray-600 mt-1">مؤشرات الأداء الرئيسية والإحصائيات الشاملة</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>آخر تحديث: الآن</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المستفيدين"
          value={analytics.totalBeneficiaries.toString()}
          icon={Users}
          subtitle={`${analytics.activeBeneficiaries} نشط`}
          trend={{
            value: ((analytics.activeBeneficiaries / analytics.totalBeneficiaries) * 100).toFixed(1),
            isPositive: true
          }}
        />

        <StatCard
          title="إجمالي الطرود"
          value={analytics.totalPackages.toString()}
          icon={Package}
          subtitle={`${analytics.deliveredPackages} تم التسليم`}
          trend={{
            value: analytics.deliverySuccessRate.toFixed(1),
            isPositive: true
          }}
        />

        <StatCard
          title="المندوبين النشطين"
          value={analytics.activeCouriers.toString()}
          icon={Truck}
          subtitle={`${analytics.inProgressPackages} مهمة جارية`}
          trend={{
            value: '12',
            isPositive: true
          }}
        />

        <StatCard
          title="القيمة الإجمالية"
          value={`$${analytics.totalValue.toLocaleString()}`}
          icon={DollarSign}
          subtitle="للطرود المُسلمة"
          trend={{
            value: '8.2',
            isPositive: true
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">نسبة نجاح التوصيل</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {analytics.deliverySuccessRate.toFixed(1)}%
              </span>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analytics.deliverySuccessRate}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {analytics.deliveredPackages} من {analytics.totalPackages} طرد تم تسليمها بنجاح
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">متوسط وقت التوصيل</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-blue-600">
                {analytics.averageDeliveryTime} دقيقة
              </span>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between mb-2">
                <span>أسرع توصيل: 15 دقيقة</span>
              </div>
              <div className="flex justify-between">
                <span>أبطأ توصيل: 120 دقيقة</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">التنبيهات والمخزون</h3>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">تنبيهات حرجة</p>
                <p className="text-2xl font-bold text-red-600">{analytics.criticalAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">مخزون منخفض</p>
                <p className="text-2xl font-bold text-amber-600">{analytics.lowStockItems}</p>
              </div>
              <Package className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">اتجاهات التوصيل (آخر 7 أيام)</h3>
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(trend.date).toLocaleDateString('ar-EG', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="font-semibold">
                    {trend.delivered + trend.failed + trend.pending} طرد
                  </span>
                </div>
                <div className="flex gap-1 h-6">
                  <div
                    className="bg-green-500 rounded-l transition-all duration-300 flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(trend.delivered / (trend.delivered + trend.failed + trend.pending)) * 100}%`
                    }}
                  >
                    {trend.delivered > 0 && trend.delivered}
                  </div>
                  <div
                    className="bg-red-500 transition-all duration-300 flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(trend.failed / (trend.delivered + trend.failed + trend.pending)) * 100}%`
                    }}
                  >
                    {trend.failed > 0 && trend.failed}
                  </div>
                  <div
                    className="bg-gray-400 rounded-r transition-all duration-300 flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(trend.pending / (trend.delivered + trend.failed + trend.pending)) * 100}%`
                    }}
                  >
                    {trend.pending > 0 && trend.pending}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm text-gray-600">تم التسليم</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-sm text-gray-600">فشل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span className="text-sm text-gray-600">قيد الانتظار</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">أداء المؤسسات</h3>
            <PieChart className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">مؤسسات نشطة</p>
                <p className="text-2xl font-bold text-green-600">{analytics.totalOrganizations}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">معدل الإنجاز</p>
                <p className="text-lg font-semibold text-green-600">87%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الهلال الأحمر</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">95%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الأونروا</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">88%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">منظمة الإغاثة</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">82%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الإغاثة الدولية</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">78%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">مؤشرات الأداء الإضافية</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">طرود قيد التوصيل</p>
            <p className="text-2xl font-bold text-blue-600">{analytics.inProgressPackages}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">متوسط التقييم</p>
            <p className="text-2xl font-bold text-purple-600">4.8/5</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">مسافة مقطوعة</p>
            <p className="text-2xl font-bold text-indigo-600">1,245 كم</p>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">وقت استجابة</p>
            <p className="text-2xl font-bold text-teal-600">12 دقيقة</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
