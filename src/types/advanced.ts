// أنواع البيانات للميزات المتقدمة

export interface CourierLocation {
  id: string;
  courier_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  location_type: 'gps' | 'manual' | 'estimated';
  battery_level?: number;
  signal_strength?: number;
  is_active: boolean;
  address_description?: string;
  landmark?: string;
  created_at: string;
}

export interface CourierLocationInsert {
  courier_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  location_type?: 'gps' | 'manual' | 'estimated';
  battery_level?: number;
  signal_strength?: number;
  address_description?: string;
  landmark?: string;
}

export interface DistributionCenter {
  id: string;
  name: string;
  type: 'main' | 'secondary' | 'mobile' | 'emergency';
  location: { lat: number; lng: number };
  address: string;
  capacity: number;
  current_stock: number;
  manager_name: string;
  manager_phone: string;
  operating_hours?: Record<string, string>;
  facilities?: string[];
  storage_conditions?: string[];
  security_level: 'basic' | 'standard' | 'high' | 'maximum';
  accessibility_features?: string[];
  coverage_radius_km?: number;
  status: 'active' | 'maintenance' | 'closed' | 'emergency_only';
  last_inspection_date?: string;
  certification_status: 'pending' | 'certified' | 'expired' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  distribution_center_id: string;
  item_name: string;
  item_category: string;
  current_quantity: number;
  reserved_quantity: number;
  minimum_threshold: number;
  maximum_capacity: number;
  unit: string;
  cost_per_unit: number;
  supplier?: string;
  batch_number?: string;
  expiry_date?: string;
  storage_location?: string;
  condition_status: 'excellent' | 'good' | 'fair' | 'poor' | 'expired';
  last_counted_date?: string;
  last_restocked_date?: string;
  reorder_point?: number;
  is_critical: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemInsert {
  distribution_center_id: string;
  item_name: string;
  item_category: string;
  current_quantity?: number;
  reserved_quantity?: number;
  minimum_threshold?: number;
  maximum_capacity?: number;
  unit: string;
  cost_per_unit?: number;
  supplier?: string;
  batch_number?: string;
  expiry_date?: string;
  storage_location?: string;
  condition_status?: 'excellent' | 'good' | 'fair' | 'poor' | 'expired';
  reorder_point?: number;
  is_critical?: boolean;
  notes?: string;
}

export interface InventoryItemUpdate {
  item_name?: string;
  item_category?: string;
  current_quantity?: number;
  reserved_quantity?: number;
  minimum_threshold?: number;
  maximum_capacity?: number;
  unit?: string;
  cost_per_unit?: number;
  supplier?: string;
  batch_number?: string;
  expiry_date?: string;
  storage_location?: string;
  condition_status?: 'excellent' | 'good' | 'fair' | 'poor' | 'expired';
  last_counted_date?: string;
  last_restocked_date?: string;
  reorder_point?: number;
  is_critical?: boolean;
  notes?: string;
}

export interface Notification {
  id: string;
  recipient_type: 'user' | 'beneficiary' | 'courier' | 'organization' | 'all';
  recipient_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'urgent';
  priority: 'low' | 'normal' | 'high' | 'critical';
  channel: 'app' | 'sms' | 'email' | 'push' | 'whatsapp';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  read_at?: string;
  metadata?: Record<string, any>;
  template_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  retry_count?: number;
  max_retries?: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationInsert {
  recipient_type: 'user' | 'beneficiary' | 'courier' | 'organization' | 'all';
  recipient_id?: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'urgent';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  channel?: 'app' | 'sms' | 'email' | 'push' | 'whatsapp';
  metadata?: Record<string, any>;
  related_entity_type?: string;
  related_entity_id?: string;
}
