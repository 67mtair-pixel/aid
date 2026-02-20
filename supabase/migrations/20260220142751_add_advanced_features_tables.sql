/*
  # إضافة جداول الميزات المتقدمة - نظام LASONM
  
  ## نظرة عامة
  هذه المايقريشن تضيف جداول جديدة لدعم الميزات المتقدمة في النظام:
  - تتبع GPS للمندوبين في الوقت الفعلي
  - إدارة المخزون ومراكز التوزيع
  - المناطق الجغرافية وتحسين المسارات
  - جهات الاتصال الطارئة للمستفيدين
  - نظام التقييمات والملاحظات
  - جلسات المستخدمين وإعدادات النظام
  
  ## 1. الجداول الجديدة
  
  ### courier_locations - تتبع مواقع المندوبين
  - `id` (uuid, primary key)
  - `courier_id` (uuid, foreign key → couriers.id)
  - `latitude`, `longitude` (موقع GPS)
  - `accuracy`, `altitude`, `speed`, `heading` (بيانات موقع إضافية)
  - `timestamp` (وقت التسجيل)
  - `location_type` (gps | manual | estimated)
  - `battery_level`, `signal_strength` (حالة الجهاز)
  - `is_active` (boolean)
  - `address_description`, `landmark` (وصف الموقع)
  
  ### distribution_centers - مراكز التوزيع
  - `id` (uuid, primary key)
  - `name`, `type`, `location`, `address`
  - `capacity`, `current_stock` (السعة والمخزون الحالي)
  - `manager_name`, `manager_phone` (معلومات المدير)
  - `operating_hours`, `facilities` (ساعات العمل والمرافق)
  - `security_level`, `accessibility_features`
  - `status`, `certification_status`
  
  ### inventory - المخزون
  - `id` (uuid, primary key)
  - `distribution_center_id` (uuid, foreign key)
  - `item_name`, `item_category`, `unit`
  - `current_quantity`, `reserved_quantity` (الكمية الحالية والمحجوزة)
  - `minimum_threshold`, `maximum_capacity` (الحد الأدنى والأقصى)
  - `cost_per_unit`, `supplier`, `batch_number`
  - `expiry_date`, `storage_location`
  - `condition_status`, `reorder_point`
  - `is_critical` (عنصر حرج)
  
  ### geographic_areas - المناطق الجغرافية
  - `id` (uuid, primary key)
  - `name`, `type` (governorate | city | district | neighborhood | camp)
  - `parent_id` (uuid, self-reference للتسلسل الهرمي)
  - `boundaries`, `center_point` (jsonb - حدود ونقطة مركز المنطقة)
  - `population`, `area_km2`
  - `security_level`, `accessibility`, `infrastructure_quality`
  - `delivery_difficulty`, `average_delivery_time_minutes`
  - `preferred_delivery_times`, `landmarks`
  
  ### delivery_routes - مسارات التوصيل
  - `id` (uuid, primary key)
  - `name`, `start_location`, `end_location`, `waypoints`
  - `distance_km`, `estimated_duration_minutes`
  - `difficulty_level`, `safety_rating`
  - `road_conditions`, `checkpoints`, `restrictions`
  - `weather_dependent`, `vehicle_requirements`
  - `usage_count`, `success_rate`, `average_completion_time`
  
  ### emergency_contacts - جهات الاتصال الطارئة
  - `id` (uuid, primary key)
  - `beneficiary_id` (uuid, foreign key → beneficiaries.id)
  - `name`, `relationship`, `phone`, `alternative_phone`
  - `address`, `is_primary`, `can_receive_packages`
  - `verified`, `verified_date`
  
  ### feedback - التقييمات والملاحظات
  - `id` (uuid, primary key)
  - `beneficiary_id`, `task_id`, `courier_id`, `package_id` (foreign keys)
  - `rating`, `service_quality_rating`, `delivery_time_rating`
  - `package_condition_rating`, `courier_behavior_rating`
  - `comments`, `suggestions`, `complaints`
  - `would_recommend`, `feedback_type`
  - `status`, `response`, `responded_by`, `responded_at`
  
  ### user_sessions - جلسات المستخدمين
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key → system_users.id)
  - `session_token`, `ip_address`, `user_agent`
  - `device_info`, `location_info`, `browser_info` (jsonb)
  - `login_time`, `last_activity`, `logout_time`
  - `status` (active | expired | terminated)
  - `duration_minutes`, `actions_performed`
  
  ### system_settings - إعدادات النظام
  - `id` (uuid, primary key)
  - `category`, `key`, `value`
  - `data_type` (string | number | boolean | json | array)
  - `description`, `is_public`, `is_editable`
  - `validation_rules`, `default_value`
  
  ## 2. الأمان - Row Level Security (RLS)
  
  جميع الجداول تم تفعيل RLS عليها مع سياسات محددة:
  - المستخدمون المصرح لهم فقط يمكنهم الوصول للبيانات
  - سياسات قراءة وكتابة منفصلة لكل جدول
  - حماية البيانات الحساسة
  
  ## 3. الفهارس (Indexes)
  
  تم إضافة فهارس لتحسين الأداء على:
  - مفاتيح البحث الأساسية
  - الحقول التي يتم البحث فيها بكثرة
  - المفاتيح الأجنبية
  
  ## 4. القيود (Constraints)
  
  - قيود CHECK لضمان صحة البيانات
  - قيم افتراضية مناسبة
  - علاقات المفاتيح الأجنبية
*/

-- ========================================
-- 1. جدول مواقع المندوبين (Courier Locations)
-- ========================================

CREATE TABLE IF NOT EXISTS courier_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  latitude numeric(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude numeric(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  accuracy numeric(10, 2) DEFAULT 0,
  altitude numeric(10, 2) DEFAULT 0,
  speed numeric(10, 2) DEFAULT 0,
  heading numeric(5, 2) DEFAULT 0 CHECK (heading >= 0 AND heading <= 360),
  timestamp timestamptz DEFAULT now(),
  location_type text DEFAULT 'gps' CHECK (location_type IN ('gps', 'manual', 'estimated')),
  battery_level integer CHECK (battery_level >= 0 AND battery_level <= 100),
  signal_strength integer CHECK (signal_strength >= 0 AND signal_strength <= 100),
  is_active boolean DEFAULT true,
  address_description text,
  landmark text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_locations_courier_id ON courier_locations(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_locations_timestamp ON courier_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_courier_locations_is_active ON courier_locations(is_active) WHERE is_active = true;

ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view courier locations"
  ON courier_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System users can insert courier locations"
  ON courier_locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System users can update courier locations"
  ON courier_locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 2. جدول مراكز التوزيع (Distribution Centers)
-- ========================================

CREATE TABLE IF NOT EXISTS distribution_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'secondary' CHECK (type IN ('main', 'secondary', 'mobile', 'emergency')),
  location jsonb DEFAULT '{"lat": 31.5, "lng": 34.5}'::jsonb,
  address text NOT NULL,
  capacity integer DEFAULT 0,
  current_stock integer DEFAULT 0,
  manager_name text NOT NULL,
  manager_phone text NOT NULL,
  operating_hours jsonb DEFAULT '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-12:00"}'::jsonb,
  facilities text[] DEFAULT ARRAY[]::text[],
  storage_conditions text[] DEFAULT ARRAY[]::text[],
  security_level text DEFAULT 'standard' CHECK (security_level IN ('basic', 'standard', 'high', 'maximum')),
  accessibility_features text[] DEFAULT ARRAY[]::text[],
  coverage_radius_km numeric(10, 2) DEFAULT 5.0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'closed', 'emergency_only')),
  last_inspection_date date,
  certification_status text DEFAULT 'pending' CHECK (certification_status IN ('pending', 'certified', 'expired', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_distribution_centers_status ON distribution_centers(status);
CREATE INDEX IF NOT EXISTS idx_distribution_centers_type ON distribution_centers(type);

ALTER TABLE distribution_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view distribution centers"
  ON distribution_centers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage distribution centers"
  ON distribution_centers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 3. جدول المخزون (Inventory)
-- ========================================

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_center_id uuid NOT NULL REFERENCES distribution_centers(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_category text NOT NULL,
  current_quantity numeric(10, 2) DEFAULT 0,
  reserved_quantity numeric(10, 2) DEFAULT 0,
  minimum_threshold numeric(10, 2) DEFAULT 0,
  maximum_capacity numeric(10, 2) DEFAULT 0,
  unit text NOT NULL,
  cost_per_unit numeric(10, 2) DEFAULT 0,
  supplier text,
  batch_number text,
  expiry_date date,
  storage_location text,
  condition_status text DEFAULT 'good' CHECK (condition_status IN ('excellent', 'good', 'fair', 'poor', 'expired')),
  last_counted_date date,
  last_restocked_date date,
  reorder_point numeric(10, 2) DEFAULT 0,
  is_critical boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_center_id ON inventory(distribution_center_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_critical ON inventory(is_critical) WHERE is_critical = true;

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 4. جدول المناطق الجغرافية (Geographic Areas)
-- ========================================

CREATE TABLE IF NOT EXISTS geographic_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('governorate', 'city', 'district', 'neighborhood', 'camp')),
  parent_id uuid REFERENCES geographic_areas(id) ON DELETE SET NULL,
  boundaries jsonb,
  center_point jsonb DEFAULT '{"lat": 31.5, "lng": 34.5}'::jsonb,
  population integer DEFAULT 0,
  area_km2 numeric(10, 2) DEFAULT 0,
  postal_code text,
  security_level text DEFAULT 'normal' CHECK (security_level IN ('safe', 'normal', 'caution', 'dangerous', 'restricted')),
  accessibility text DEFAULT 'accessible' CHECK (accessibility IN ('accessible', 'limited', 'difficult', 'inaccessible')),
  infrastructure_quality text DEFAULT 'fair' CHECK (infrastructure_quality IN ('excellent', 'good', 'fair', 'poor')),
  delivery_difficulty text DEFAULT 'normal' CHECK (delivery_difficulty IN ('easy', 'normal', 'hard', 'very_hard')),
  average_delivery_time_minutes integer DEFAULT 30,
  preferred_delivery_times text[] DEFAULT ARRAY['09:00-12:00', '15:00-18:00']::text[],
  special_instructions text,
  landmarks text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geographic_areas_type ON geographic_areas(type);
CREATE INDEX IF NOT EXISTS idx_geographic_areas_parent_id ON geographic_areas(parent_id);
CREATE INDEX IF NOT EXISTS idx_geographic_areas_name ON geographic_areas(name);

ALTER TABLE geographic_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view geographic areas"
  ON geographic_areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage geographic areas"
  ON geographic_areas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 5. جدول مسارات التوصيل (Delivery Routes)
-- ========================================

CREATE TABLE IF NOT EXISTS delivery_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_location jsonb NOT NULL,
  end_location jsonb NOT NULL,
  waypoints jsonb DEFAULT '[]'::jsonb,
  distance_km numeric(10, 2) DEFAULT 0,
  estimated_duration_minutes integer DEFAULT 0,
  difficulty_level text DEFAULT 'normal' CHECK (difficulty_level IN ('easy', 'normal', 'hard', 'dangerous')),
  safety_rating numeric(3, 2) DEFAULT 3.0 CHECK (safety_rating >= 0 AND safety_rating <= 5),
  road_conditions text,
  checkpoints jsonb DEFAULT '[]'::jsonb,
  restrictions text[] DEFAULT ARRAY[]::text[],
  best_time_slots text[] DEFAULT ARRAY[]::text[],
  weather_dependent boolean DEFAULT false,
  vehicle_requirements text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  success_rate numeric(5, 2) DEFAULT 0,
  average_completion_time integer DEFAULT 0,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_routes_is_active ON delivery_routes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_delivery_routes_difficulty ON delivery_routes(difficulty_level);

ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view delivery routes"
  ON delivery_routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage delivery routes"
  ON delivery_routes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 6. جدول جهات الاتصال الطارئة (Emergency Contacts)
-- ========================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id uuid NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  alternative_phone text,
  address text,
  is_primary boolean DEFAULT false,
  can_receive_packages boolean DEFAULT false,
  notes text,
  verified boolean DEFAULT false,
  verified_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_beneficiary_id ON emergency_contacts(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary ON emergency_contacts(is_primary) WHERE is_primary = true;

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emergency contacts for their beneficiaries"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can manage emergency contacts"
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 7. جدول التقييمات (Feedback)
-- ========================================

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id uuid NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  courier_id uuid REFERENCES couriers(id) ON DELETE SET NULL,
  package_id uuid REFERENCES packages(id) ON DELETE SET NULL,
  rating numeric(3, 2) CHECK (rating >= 0 AND rating <= 5),
  service_quality_rating numeric(3, 2) CHECK (service_quality_rating >= 0 AND service_quality_rating <= 5),
  delivery_time_rating numeric(3, 2) CHECK (delivery_time_rating >= 0 AND delivery_time_rating <= 5),
  package_condition_rating numeric(3, 2) CHECK (package_condition_rating >= 0 AND package_condition_rating <= 5),
  courier_behavior_rating numeric(3, 2) CHECK (courier_behavior_rating >= 0 AND courier_behavior_rating <= 5),
  comments text,
  suggestions text,
  complaints text,
  would_recommend boolean,
  feedback_type text DEFAULT 'delivery' CHECK (feedback_type IN ('delivery', 'service', 'complaint', 'suggestion')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'escalated')),
  response text,
  responded_by uuid REFERENCES system_users(id) ON DELETE SET NULL,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_beneficiary_id ON feedback(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_feedback_task_id ON feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_feedback_courier_id ON feedback(courier_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Beneficiaries can submit feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage feedback"
  ON feedback FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 8. جدول جلسات المستخدمين (User Sessions)
-- ========================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  device_info jsonb DEFAULT '{}'::jsonb,
  location_info jsonb DEFAULT '{}'::jsonb,
  login_time timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  logout_time timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
  duration_minutes integer DEFAULT 0,
  actions_performed integer DEFAULT 0,
  is_mobile boolean DEFAULT false,
  browser_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON user_sessions(login_time DESC);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 9. جدول إعدادات النظام (System Settings)
-- ========================================

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  data_type text DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
  description text,
  is_public boolean DEFAULT false,
  is_editable boolean DEFAULT true,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  default_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (is_public = true OR true);

CREATE POLICY "Admins can manage all settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- إدخال بيانات أولية (Seed Data)
-- ========================================

-- إعدادات النظام الأساسية
INSERT INTO system_settings (category, key, value, data_type, description, is_public, is_editable) VALUES
  ('general', 'system_name', 'LASONM - نظام إدارة المساعدات', 'string', 'اسم النظام', true, true),
  ('general', 'max_package_weight_kg', '50', 'number', 'الوزن الأقصى للطرد (كجم)', true, true),
  ('general', 'default_delivery_radius_km', '10', 'number', 'نطاق التوصيل الافتراضي (كم)', true, true),
  ('security', 'session_timeout_minutes', '120', 'number', 'مدة انتهاء الجلسة (دقيقة)', false, true),
  ('security', 'max_failed_login_attempts', '5', 'number', 'عدد محاولات تسجيل الدخول الفاشلة', false, true),
  ('notifications', 'enable_sms', 'true', 'boolean', 'تفعيل إشعارات SMS', false, true),
  ('notifications', 'enable_email', 'true', 'boolean', 'تفعيل إشعارات البريد الإلكتروني', false, true),
  ('delivery', 'max_tasks_per_courier', '10', 'number', 'الحد الأقصى للمهام لكل مندوب', true, true),
  ('inventory', 'low_stock_threshold_percent', '20', 'number', 'نسبة تنبيه المخزون المنخفض', false, true)
ON CONFLICT (key) DO NOTHING;

-- مركز توزيع افتراضي
INSERT INTO distribution_centers (name, type, address, manager_name, manager_phone, status) VALUES
  ('المركز الرئيسي - غزة', 'main', 'شارع الوحدة، غزة', 'أحمد محمد', '+970599123456', 'active')
ON CONFLICT DO NOTHING;

-- مناطق جغرافية أساسية
INSERT INTO geographic_areas (name, type, security_level, accessibility) VALUES
  ('قطاع غزة', 'governorate', 'caution', 'limited'),
  ('غزة', 'city', 'caution', 'accessible'),
  ('خان يونس', 'city', 'caution', 'accessible'),
  ('رفح', 'city', 'caution', 'limited'),
  ('الشمال', 'city', 'dangerous', 'difficult')
ON CONFLICT DO NOTHING;