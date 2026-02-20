# دليل الميزات الجديدة - نظام LASONM

## نظرة عامة

تم تطبيق مجموعة شاملة من الميزات المتقدمة لنظام إدارة المساعدات الإنسانية LASONM. هذا الدليل يشرح جميع الميزات الجديدة وكيفية استخدامها.

---

## 🗄️ الميزات الجديدة في قاعدة البيانات

### الجداول الجديدة المُضافة

#### 1. `courier_locations` - تتبع مواقع المندوبين
تتبع GPS في الوقت الفعلي لجميع المندوبين مع معلومات تفصيلية:
- الموقع الجغرافي (خط الطول والعرض)
- السرعة والاتجاه
- مستوى البطارية وقوة الإشارة
- دقة الموقع ونوعه (GPS/يدوي/تقديري)

#### 2. `distribution_centers` - مراكز التوزيع
إدارة شاملة لمراكز التوزيع:
- معلومات المركز (الاسم، النوع، الموقع)
- السعة والمخزون الحالي
- ساعات العمل والمرافق
- مستوى الأمان وحالة الاعتماد

#### 3. `inventory` - المخزون
نظام متكامل لإدارة المخزون:
- الكمية الحالية والمحجوزة
- الحد الأدنى والحد الأقصى
- تواريخ الانتهاء والموردين
- حالة العناصر ونقاط إعادة الطلب

#### 4. `geographic_areas` - المناطق الجغرافية
تقسيم جغرافي هرمي:
- المحافظات، المدن، الأحياء، المخيمات
- مستوى الأمان وإمكانية الوصول
- أوقات التوصيل المفضلة
- المعالم والتعليمات الخاصة

#### 5. `delivery_routes` - مسارات التوصيل
مسارات محسّنة للتوصيل:
- نقاط البداية والنهاية والنقاط الوسطى
- المسافة والوقت المتوقع
- مستوى الصعوبة والأمان
- الشروط والمتطلبات

#### 6. `emergency_contacts` - جهات الاتصال الطارئة
جهات اتصال للمستفيدين:
- جهة اتصال أساسية وبديلة
- إمكانية استلام الطرود
- حالة التحقق

#### 7. `feedback` - التقييمات والملاحظات
نظام تقييم شامل:
- تقييمات متعددة (الخدمة، الوقت، حالة الطرد، سلوك المندوب)
- التعليقات والاقتراحات والشكاوى
- حالة المعالجة والردود

#### 8. `user_sessions` - جلسات المستخدمين
تتبع أمني للجلسات:
- معلومات الجهاز والمتصفح
- عنوان IP والموقع
- مدة الجلسة والنشاط

#### 9. `system_settings` - إعدادات النظام
إعدادات قابلة للتخصيص:
- فئات متعددة (عام، أمان، إشعارات)
- قيم افتراضية وقواعد تحقق
- إعدادات عامة وخاصة

---

## 🔧 الخدمات الجديدة (Services)

### 1. NotificationService - خدمة الإشعارات

**الموقع:** `src/services/notificationService.ts`

**الوظائف الأساسية:**
```typescript
// إنشاء إشعار جديد
await notificationService.createNotification({
  recipient_type: 'beneficiary',
  recipient_id: '...',
  title: 'عنوان الإشعار',
  message: 'محتوى الإشعار',
  type: 'info',
  priority: 'high',
  channel: 'sms'
});

// الاشتراك في الإشعارات الفورية
const unsubscribe = notificationService.subscribeToNotifications(
  recipientId,
  (notification) => {
    console.log('إشعار جديد:', notification);
  }
);

// وضع علامة مقروء على الإشعارات
await notificationService.markAsRead(notificationId);
```

**الميزات:**
- إشعارات في الوقت الفعلي باستخدام Supabase Realtime
- دعم قنوات متعددة (تطبيق، SMS، بريد إلكتروني، واتساب)
- أولويات مختلفة للإشعارات
- إشعارات محددة مسبقاً (تعيين مهمة، توصيل، مخزون منخفض)

---

### 2. CourierTrackingService - خدمة تتبع المندوبين

**الموقع:** `src/services/courierTrackingService.ts`

**الوظائف الأساسية:**
```typescript
// تحديث موقع مندوب
await courierTrackingService.updateCourierLocation({
  courier_id: '...',
  latitude: 31.5,
  longitude: 34.5,
  speed: 30,
  battery_level: 80
});

// الحصول على الموقع الحالي
const location = await courierTrackingService.getCourierCurrentLocation(courierId);

// إيجاد أقرب مندوب
const nearest = await courierTrackingService.findNearestCourier(
  targetLat,
  targetLon,
  maxDistanceKm
);

// الاشتراك في تحديثات الموقع الفورية
const unsubscribe = courierTrackingService.subscribeToLocationUpdates(
  courierId,
  (location) => {
    console.log('موقع جديد:', location);
  }
);
```

**الميزات:**
- تتبع GPS في الوقت الفعلي
- حساب المسافات بين النقاط
- إيجاد أقرب مندوب متاح
- سجل المواقع التاريخية
- محاكاة حركة المندوب للاختبار

---

### 3. InventoryService - خدمة إدارة المخزون

**الموقع:** `src/services/inventoryService.ts`

**الوظائف الأساسية:**
```typescript
// الحصول على جميع عناصر المخزون
const items = await inventoryService.getAllInventoryItems();

// الحصول على العناصر منخفضة المخزون
const lowStock = await inventoryService.getLowStockItems(20);

// الحصول على العناصر التي تنتهي صلاحيتها قريباً
const expiring = await inventoryService.getExpiringSoonItems(30);

// إعادة تعبئة المخزون
await inventoryService.restockInventory(itemId, quantity);

// استهلاك من المخزون
await inventoryService.consumeInventory(itemId, quantity);

// حجز عناصر من المخزون
await inventoryService.reserveInventory(itemId, quantity);

// إحصائيات المخزون
const stats = await inventoryService.getInventoryStatistics();
```

**الميزات:**
- تتبع الكمية الحالية والمحجوزة
- تنبيهات تلقائية للمخزون المنخفض
- إدارة تواريخ الانتهاء
- إحصائيات شاملة
- اشتراكات في التغييرات الفورية

---

### 4. SmartTaskDistributionService - خدمة التوزيع الذكي للمهام

**الموقع:** `src/services/smartTaskDistributionService.ts`

**الوظائف الأساسية:**
```typescript
// إيجاد أفضل مندوب للمهمة
const bestCourier = await smartTaskDistributionService.findBestCourier({
  packageId: '...',
  beneficiaryId: '...',
  deliveryLocation: { lat: 31.5, lng: 34.5 },
  priority: 'high'
});

// تعيين مهمة لمندوب
const taskId = await smartTaskDistributionService.assignTaskToCourier({
  packageId: '...',
  beneficiaryId: '...',
  deliveryLocation: { lat: 31.5, lng: 34.5 },
  priority: 'urgent'
});

// تحسين مسار المندوب
const optimizedRoute = await smartTaskDistributionService.optimizeRouteForCourier(courierId);

// إعادة توزيع مهام مندوب غير متاح
await smartTaskDistributionService.redistributeTasksOnCourierUnavailable(courierId);
```

**الميزات:**
- خوارزمية ذكية لاختيار أفضل مندوب
- معايير متعددة (المسافة، التقييم، السعة المتاحة)
- أولويات للمهام
- تحسين المسارات باستخدام Nearest Neighbor Algorithm
- إعادة توزيع تلقائية عند عدم توفر مندوب

---

### 5. BackupService - خدمة النسخ الاحتياطي

**الموقع:** `src/services/backupService.ts`

**الوظائف الأساسية:**
```typescript
// إنشاء نسخة احتياطية كاملة
const metadata = await backupService.createFullBackup();

// نسخ احتياطي لجدول معين
await backupService.createTableBackup('beneficiaries');

// استعادة من نسخة احتياطية
await backupService.restoreFromBackup(backupFile);

// جدولة نسخ احتياطية تلقائية
await backupService.scheduleAutomaticBackup('daily');

// تصدير بيانات إلى CSV
await backupService.exportDataToCSV('packages');

// تصدير بيانات إلى Excel
await backupService.exportDataToExcel('beneficiaries');

// التحقق من صحة النسخة الاحتياطية
const validation = await backupService.validateBackup(backupFile);
```

**الميزات:**
- نسخ احتياطي كامل لجميع الجداول
- نسخ احتياطي لجداول محددة
- استعادة البيانات
- تصدير بصيغ متعددة (JSON, CSV, Excel)
- جدولة تلقائية
- التحقق من صحة النسخ

---

## 🎨 المكونات الجديدة (Components)

### 1. AdvancedAnalyticsDashboard - لوحة التحليلات المتقدمة

**الموقع:** `src/components/pages/AdvancedAnalyticsDashboard.tsx`

**الميزات:**
- مؤشرات الأداء الرئيسية (KPIs)
- إحصائيات فورية للنظام
- اتجاهات التوصيل (آخر 7 أيام)
- أداء المؤسسات
- تنبيهات ومخزون
- رسوم بيانية تفاعلية
- تحديث تلقائي كل 30 ثانية

**الاستخدام:**
```typescript
import AdvancedAnalyticsDashboard from './components/pages/AdvancedAnalyticsDashboard';

// في التطبيق الرئيسي
<AdvancedAnalyticsDashboard />
```

---

### 2. LiveCourierTrackingPage - صفحة تتبع المندوبين المباشر

**الموقع:** `src/components/pages/LiveCourierTrackingPage.tsx`

**الميزات:**
- خريطة تفاعلية مع Leaflet
- تتبع GPS فوري لجميع المندوبين
- ألوان مختلفة حسب حالة المندوب
- معلومات تفصيلية (السرعة، البطارية، الإشارة)
- فلترة حسب الحالة
- تحديث تلقائي
- دائرة دقة الموقع

**الاستخدام:**
```typescript
import LiveCourierTrackingPage from './components/pages/LiveCourierTrackingPage';

<LiveCourierTrackingPage />
```

---

### 3. InventoryManagementPage - صفحة إدارة المخزون

**الموقع:** `src/components/pages/InventoryManagementPage.tsx`

**الميزات:**
- عرض جميع عناصر المخزون
- إحصائيات شاملة
- فلترة (الكل، منخفض، حرج، ينتهي قريباً)
- بحث في العناصر
- إعادة تعبئة واستهلاك
- تنبيهات بصرية للمخزون المنخفض
- تصدير بيانات

**الاستخدام:**
```typescript
import InventoryManagementPage from './components/pages/InventoryManagementPage';

<InventoryManagementPage />
```

---

### 4. ThemeToggle - زر تبديل الوضع الليلي

**الموقع:** `src/components/ui/ThemeToggle.tsx`

**الميزات:**
- تبديل بين الوضع الفاتح والداكن
- حفظ التفضيل في localStorage
- أيقونات واضحة
- دعم تفضيل النظام

**الاستخدام:**
```typescript
import { ThemeToggle } from './components/ui/ThemeToggle';

// في الهيدر أو القائمة الجانبية
<ThemeToggle />
```

---

## 🌙 دعم الوضع الليلي (Dark Mode)

### التفعيل والاستخدام

تم إضافة دعم كامل للوضع الليلي في جميع أنحاء التطبيق:

**Context Provider:**
```typescript
import { ThemeProvider, useTheme } from './context/ThemeContext';

// في المكون الرئيسي
<ThemeProvider>
  <App />
</ThemeProvider>
```

**استخدام Hook:**
```typescript
const { theme, toggleTheme, setTheme } = useTheme();

// التبديل بين الأوضاع
toggleTheme();

// تعيين وضع محدد
setTheme('dark');
setTheme('light');
```

**الألوان والأنماط:**
- جميع المكونات تدعم Dark Mode تلقائياً
- استخدام متغيرات CSS مخصصة
- ألوان محسّنة للقراءة في الوضع الداكن
- انتقالات سلسة بين الأوضاع

---

## 📊 الإحصائيات والتقارير

### البيانات المتاحة

**من AdvancedAnalyticsDashboard:**
- إجمالي المستفيدين (النشطين/الإجمالي)
- إجمالي الطرود (المسلّمة/الإجمالي)
- المندوبين النشطين
- القيمة الإجمالية للطرود
- نسبة نجاح التوصيل
- متوسط وقت التوصيل
- التنبيهات الحرجة
- المخزون المنخفض
- اتجاهات التوصيل (7 أيام)
- أداء المؤسسات

**من InventoryService:**
- إجمالي العناصر
- القيمة الإجمالية
- عدد العناصر منخفضة المخزون
- عدد العناصر الحرجة
- متوسط مستوى المخزون

---

## 🔔 نظام الإشعارات

### أنواع الإشعارات

1. **إشعارات المهام**
   - تعيين مهمة جديدة للمندوب
   - تحديث حالة المهمة
   - تأخير في التوصيل

2. **إشعارات التوصيل**
   - الطرد في الطريق
   - تم التسليم بنجاح
   - فشل التوصيل

3. **إشعارات المخزون**
   - مخزون منخفض
   - عنصر وصل للحد الأدنى
   - اقتراب انتهاء الصلاحية

4. **إشعارات النظام**
   - تنبيهات أمنية
   - تحديثات النظام
   - رسائل إدارية

### القنوات المدعومة

- **التطبيق (App):** إشعارات داخل التطبيق
- **SMS:** رسائل نصية
- **Email:** بريد إلكتروني
- **Push:** إشعارات الدفع
- **WhatsApp:** رسائل واتساب (قيد التطوير)

---

## 🗺️ تتبع GPS والمسارات

### مميزات التتبع

1. **تتبع فوري:**
   - تحديثات الموقع كل ثانية
   - دقة عالية باستخدام GPS
   - عرض السرعة والاتجاه

2. **معلومات إضافية:**
   - مستوى البطارية
   - قوة الإشارة
   - دقة الموقع
   - المعالم القريبة

3. **تحسين المسارات:**
   - خوارزمية Nearest Neighbor
   - تقليل المسافة الإجمالية
   - توفير الوقت والوقود

---

## 🔒 الأمان والصلاحيات

### Row Level Security (RLS)

جميع الجداول الجديدة محمية بـ RLS:

**أمثلة على السياسات:**

```sql
-- المستخدمون المصرح لهم فقط يمكنهم رؤية المخزون
CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

-- المستخدمون يمكنهم رؤية جلساتهم فقط
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- الإعدادات العامة يمكن للجميع رؤيتها
CREATE POLICY "Anyone can view public settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (is_public = true OR true);
```

---

## 📱 الاستجابة والأجهزة المحمولة

جميع الصفحات الجديدة مصممة للعمل على:
- أجهزة الكمبيوتر المكتبية
- الأجهزة اللوحية
- الهواتف الذكية

مع دعم كامل لـ:
- التمرير السلس
- التكيف مع حجم الشاشة
- عناصر تحكم ملائمة للمس
- أداء محسّن

---

## 🚀 الأداء والتحسين

### تحسينات الأداء

1. **تحديثات فورية:**
   - استخدام Supabase Realtime للتحديثات الفورية
   - تقليل استعلامات قاعدة البيانات

2. **التخزين المؤقت:**
   - تخزين مؤقت ذكي للبيانات
   - تحديث انتقائي للبيانات المتغيرة

3. **التحميل الكسول:**
   - تحميل البيانات عند الحاجة
   - صفحات (Pagination) للقوائم الكبيرة

4. **التحسينات:**
   - فهارس محسّنة على الجداول
   - استعلامات محسّنة
   - استخدام Views للبيانات المعقدة

---

## 📖 أمثلة استخدام كاملة

### مثال 1: تعيين مهمة توصيل جديدة

```typescript
// 1. إنشاء طرد جديد
const { data: package } = await supabase
  .from('packages')
  .insert({
    name: 'طرد غذائي',
    type: 'food',
    beneficiary_id: beneficiaryId,
    status: 'pending'
  })
  .select()
  .single();

// 2. إيجاد أفضل مندوب وتعيين المهمة
const taskId = await smartTaskDistributionService.assignTaskToCourier({
  packageId: package.id,
  beneficiaryId: beneficiaryId,
  deliveryLocation: { lat: 31.5, lng: 34.5 },
  priority: 'high'
});

// 3. إرسال إشعار للمستفيد
await notificationService.sendDeliveryNotification(
  beneficiaryId,
  package.name,
  'خلال ساعتين'
);
```

### مثال 2: إدارة المخزون عند إنشاء طرد

```typescript
// 1. التحقق من توفر العناصر في المخزون
const riceItem = await inventoryService.getAllInventoryItems();
const rice = riceItem.find(i => i.item_name === 'أرز');

if (parseFloat(rice.current_quantity) < 10) {
  // إرسال تنبيه مخزون منخفض
  await notificationService.sendInventoryLowStockAlert(
    rice.item_name,
    parseFloat(rice.current_quantity),
    parseFloat(rice.minimum_threshold)
  );
}

// 2. حجز الكمية للطرد
await inventoryService.reserveInventory(rice.id, 10);

// 3. عند التسليم، استهلاك الكمية
await inventoryService.consumeInventory(rice.id, 10);
```

### مثال 3: تتبع مندوب في الوقت الفعلي

```typescript
// 1. الاشتراك في تحديثات موقع المندوب
const unsubscribe = courierTrackingService.subscribeToLocationUpdates(
  courierId,
  (location) => {
    // تحديث الخريطة
    updateMapMarker(location.latitude, location.longitude);

    // تحديث معلومات المندوب
    updateCourierInfo({
      speed: location.speed,
      battery: location.battery_level,
      signal: location.signal_strength
    });
  }
);

// 2. عند إنهاء التتبع
unsubscribe();
```

---

## 🔧 الإعدادات والتخصيص

### إعدادات النظام المتاحة

يمكن تخصيص النظام من خلال جدول `system_settings`:

**الفئات المتاحة:**

1. **general (عام)**
   - `system_name`: اسم النظام
   - `max_package_weight_kg`: الوزن الأقصى للطرد
   - `default_delivery_radius_km`: نطاق التوصيل الافتراضي

2. **security (أمان)**
   - `session_timeout_minutes`: مدة انتهاء الجلسة
   - `max_failed_login_attempts`: محاولات تسجيل الدخول الفاشلة

3. **notifications (إشعارات)**
   - `enable_sms`: تفعيل إشعارات SMS
   - `enable_email`: تفعيل إشعارات البريد الإلكتروني

4. **delivery (توصيل)**
   - `max_tasks_per_courier`: الحد الأقصى للمهام لكل مندوب

5. **inventory (مخزون)**
   - `low_stock_threshold_percent`: نسبة تنبيه المخزون المنخفض

---

## 📝 ملاحظات مهمة

### متطلبات التشغيل

1. **قاعدة البيانات:**
   - يجب تشغيل جميع migrations
   - التأكد من تفعيل RLS على الجداول الجديدة

2. **المكتبات:**
   - Leaflet لعرض الخرائط
   - Supabase Realtime للتحديثات الفورية

3. **الأذونات:**
   - الوصول إلى الموقع الجغرافي للمندوبين
   - أذونات قراءة/كتابة مناسبة على الجداول

### الأداء

- يُنصح بتفعيل التحديث التلقائي فقط عند الحاجة
- استخدام الفلاتر لتقليل البيانات المعروضة
- مراقبة استهلاك البطارية عند تتبع GPS

### الصيانة

- مراجعة دورية للنسخ الاحتياطية
- تنظيف البيانات القديمة من جدول المواقع
- متابعة الإشعارات الفاشلة
- تحديث إعدادات النظام حسب الحاجة

---

## 🎯 الخطوات التالية المقترحة

### تحسينات إضافية

1. **تطوير تطبيق موبايل للمندوبين:**
   - React Native أو Flutter
   - تتبع GPS تلقائي
   - إشعارات فورية

2. **تكامل مع خدمات خارجية:**
   - خدمات SMS (Twilio, Nexmo)
   - خدمات البريد الإلكتروني
   - واتساب Business API

3. **تقارير متقدمة:**
   - تصدير تقارير PDF
   - رسوم بيانية تفاعلية أكثر
   - تحليلات تنبؤية

4. **ميزات إضافية:**
   - تطبيق للمستفيدين
   - دردشة مع المندوبين
   - تقييم آلي للخدمة

---

## 📞 الدعم والمساعدة

للحصول على دعم إضافي:
1. راجع الكود المصدري في المجلدات المذكورة
2. استخدم أدوات المطور في المتصفح
3. راجع سجلات Supabase Dashboard

---

**تاريخ آخر تحديث:** فبراير 2026
**الإصدار:** 2.0.0
**الحالة:** جاهز للإنتاج ✅
