import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Truck,
  Clock,
  Battery,
  Signal,
  MapPin,
  RefreshCw,
  Filter,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { courierTrackingService } from '../../services/courierTrackingService';
import type { CourierLocation } from '../../types/database';
import { supabase } from '../../lib/supabaseClient';

interface CourierWithLocation {
  id: string;
  name: string;
  phone: string;
  status: string;
  rating: number;
  completed_tasks: number;
  location?: CourierLocation;
}

const activeCourierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const busyCourierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const offlineCourierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LiveCourierTrackingPage() {
  const [couriers, setCouriers] = useState<CourierWithLocation[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<CourierWithLocation | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'busy' | 'offline'>('all');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadCouriersWithLocations();

    const unsubscribe = courierTrackingService.subscribeToAllLocationUpdates((location) => {
      setCouriers(prev =>
        prev.map(courier =>
          courier.id === location.courier_id
            ? { ...courier, location }
            : courier
        )
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadCouriersWithLocations();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadCouriersWithLocations = async () => {
    try {
      const { data: couriersData, error: couriersError } = await supabase
        .from('couriers')
        .select('*');

      if (couriersError) throw couriersError;

      const locations = await courierTrackingService.getAllActiveCourierLocations();

      const couriersWithLocations: CourierWithLocation[] = (couriersData || []).map(courier => ({
        ...courier,
        location: locations.find(loc => loc.courier_id === courier.id)
      }));

      setCouriers(couriersWithLocations);
      setLoading(false);
    } catch (error) {
      console.error('Error loading couriers:', error);
      setLoading(false);
    }
  };

  const filteredCouriers = couriers.filter(courier => {
    if (filter === 'all') return true;
    return courier.status === filter;
  });

  const handleCourierClick = (courier: CourierWithLocation) => {
    setSelectedCourier(courier);
    if (courier.location && mapRef.current) {
      mapRef.current.flyTo(
        [parseFloat(courier.location.latitude.toString()), parseFloat(courier.location.longitude.toString())],
        15,
        { duration: 1 }
      );
    }
  };

  const getCourierIcon = (status: string) => {
    switch (status) {
      case 'active':
        return activeCourierIcon;
      case 'busy':
        return busyCourierIcon;
      default:
        return offlineCourierIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'busy':
        return 'مشغول';
      default:
        return 'غير متصل';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">جارٍ تحميل بيانات المندوبين...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تتبع المندوبين المباشر</h1>
            <p className="text-gray-600 text-sm mt-1">
              {filteredCouriers.length} مندوب • {filteredCouriers.filter(c => c.status === 'active').length} نشط
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                الكل ({couriers.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                نشط ({couriers.filter(c => c.status === 'active').length})
              </Button>
              <Button
                variant={filter === 'busy' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('busy')}
              >
                مشغول ({couriers.filter(c => c.status === 'busy').length})
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
            </Button>

            <Button variant="outline" size="sm" onClick={loadCouriersWithLocations}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-96 bg-white border-l overflow-y-auto">
          <div className="p-4 space-y-3">
            {filteredCouriers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا يوجد مندوبين {filter !== 'all' && getStatusText(filter)}</p>
              </div>
            ) : (
              filteredCouriers.map(courier => (
                <Card
                  key={courier.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedCourier?.id === courier.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleCourierClick(courier)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{courier.name}</h3>
                      <p className="text-sm text-gray-600">{courier.phone}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(courier.status)}`}>
                      {getStatusText(courier.status)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Truck className="w-4 h-4 ml-2 text-gray-400" />
                      <span className="text-gray-600">المهام المكتملة: {courier.completed_tasks}</span>
                    </div>

                    {courier.location && (
                      <>
                        <div className="flex items-center text-sm">
                          <Navigation className="w-4 h-4 ml-2 text-gray-400" />
                          <span className="text-gray-600">
                            السرعة: {parseFloat(courier.location.speed?.toString() || '0').toFixed(0)} كم/س
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <Battery className={`w-4 h-4 ml-2 ${
                            (courier.location.battery_level || 0) < 20 ? 'text-red-500' : 'text-gray-400'
                          }`} />
                          <span className="text-gray-600">
                            البطارية: {courier.location.battery_level || 0}%
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <Signal className="w-4 h-4 ml-2 text-gray-400" />
                          <span className="text-gray-600">
                            الإشارة: {courier.location.signal_strength || 0}%
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 ml-2 text-gray-400" />
                          <span className="text-gray-600">
                            آخر تحديث: {new Date(courier.location.timestamp).toLocaleTimeString('ar-EG')}
                          </span>
                        </div>

                        {courier.location.landmark && (
                          <div className="flex items-center text-sm">
                            <MapPin className="w-4 h-4 ml-2 text-gray-400" />
                            <span className="text-gray-600">{courier.location.landmark}</span>
                          </div>
                        )}
                      </>
                    )}

                    {!courier.location && (
                      <div className="text-sm text-amber-600 flex items-center">
                        <AlertCircle className="w-4 h-4 ml-2" />
                        لا توجد بيانات موقع حالية
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          <MapContainer
            center={[31.5, 34.5]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {filteredCouriers.map(courier => {
              if (!courier.location) return null;

              return (
                <React.Fragment key={courier.id}>
                  <Marker
                    position={[
                      parseFloat(courier.location.latitude.toString()),
                      parseFloat(courier.location.longitude.toString())
                    ]}
                    icon={getCourierIcon(courier.status)}
                  >
                    <Popup>
                      <div className="text-right p-2" dir="rtl">
                        <h3 className="font-bold text-lg mb-2">{courier.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p>الحالة: <span className="font-semibold">{getStatusText(courier.status)}</span></p>
                          <p>المهام المكتملة: {courier.completed_tasks}</p>
                          <p>التقييم: {courier.rating.toFixed(1)} ⭐</p>
                          <p>السرعة: {parseFloat(courier.location.speed?.toString() || '0').toFixed(0)} كم/س</p>
                          <p>البطارية: {courier.location.battery_level}%</p>
                          {courier.location.landmark && (
                            <p className="text-gray-600">📍 {courier.location.landmark}</p>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  <Circle
                    center={[
                      parseFloat(courier.location.latitude.toString()),
                      parseFloat(courier.location.longitude.toString())
                    ]}
                    radius={(courier.location.accuracy || 10) * 10}
                    pathOptions={{
                      color: courier.status === 'active' ? 'green' : courier.status === 'busy' ? 'orange' : 'gray',
                      fillOpacity: 0.1,
                      weight: 1
                    }}
                  />
                </React.Fragment>
              );
            })}
          </MapContainer>

          {selectedCourier && selectedCourier.location && (
            <Card className="absolute bottom-6 right-6 left-6 p-4 shadow-lg z-[1000]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{selectedCourier.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">الحالة</p>
                      <p className="font-semibold">{getStatusText(selectedCourier.status)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">السرعة</p>
                      <p className="font-semibold">
                        {parseFloat(selectedCourier.location.speed?.toString() || '0').toFixed(0)} كم/س
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">البطارية</p>
                      <p className="font-semibold">{selectedCourier.location.battery_level}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">الإشارة</p>
                      <p className="font-semibold">{selectedCourier.location.signal_strength}%</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourier(null)}
                >
                  إغلاق
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
