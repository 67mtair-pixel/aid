import React, { useState } from 'react';
import { Database, Upload, Check, AlertCircle, Loader } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { seedMockData } from '../../scripts/seedMockData';

export default function DataMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleSeedData = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setLogs([]);

    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')]);
      originalLog(...args);
    };

    console.error = (...args) => {
      setLogs(prev => [...prev, '❌ ' + args.join(' ')]);
      originalError(...args);
    };

    try {
      await seedMockData();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            إدارة البيانات الوهمية
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إضافة بيانات تجريبية شاملة لاختبار النظام
          </p>
        </div>

        <Card className="p-8 dark:bg-gray-800">
          <div className="text-center mb-8">
            <Database className="w-20 h-20 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              إضافة بيانات وهمية للنظام
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              سيتم إضافة بيانات تجريبية شاملة تشمل:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">المؤسسات والعائلات</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 5 مؤسسات إنسانية</li>
                <li>• 5 عائلات</li>
                <li>• 8 مستفيدين</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">المندوبين والتوصيل</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 6 مندوبين</li>
                <li>• 8 طرود</li>
                <li>• 8 مهام توصيل</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">المخزون والمراكز</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 3 مراكز توزيع</li>
                <li>• 6 عناصر مخزون</li>
                <li>• 4 مناطق جغرافية</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">التنبيهات والإشعارات</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 6 مواقع مندوبين</li>
                <li>• 3 تنبيهات</li>
                <li>• 3 إشعارات</li>
                <li>• تقييمات وجهات اتصال</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    تمت الإضافة بنجاح!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    تم إضافة جميع البيانات الوهمية بنجاح. يمكنك الآن تصفح الصفحات المختلفة.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100">حدث خطأ</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="bg-gray-900 dark:bg-black rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="font-mono text-sm space-y-1">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.includes('✅') || log.includes('✓') ? 'text-green-400' :
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('🌱') ? 'text-blue-400' :
                        'text-gray-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleSeedData}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 ml-2 animate-spin" />
                  جارٍ إضافة البيانات...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 ml-2" />
                  إضافة البيانات الوهمية
                </>
              )}
            </Button>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              ملاحظة: يمكن تشغيل هذه العملية عدة مرات بأمان. البيانات المكررة سيتم تحديثها تلقائياً.
            </p>
          </div>
        </Card>

        <Card className="mt-6 p-6 dark:bg-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
            ملاحظات مهمة
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>هذه البيانات للاختبار فقط ولا تمثل بيانات حقيقية</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>يمكنك حذف البيانات من لوحة Supabase Dashboard إذا لزم الأمر</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>تأكد من وجود اتصال بقاعدة البيانات قبل البدء</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <span>قد تستغرق العملية بضع ثوان حسب سرعة الاتصال</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
