import { supabase } from '../lib/supabaseClient';
import type { CourierLocation, CourierLocationInsert } from '../types/database';

export class CourierTrackingService {
  private static instance: CourierTrackingService;

  private constructor() {}

  static getInstance(): CourierTrackingService {
    if (!CourierTrackingService.instance) {
      CourierTrackingService.instance = new CourierTrackingService();
    }
    return CourierTrackingService.instance;
  }

  async updateCourierLocation(location: CourierLocationInsert): Promise<CourierLocation | null> {
    try {
      await supabase
        .from('courier_locations')
        .update({ is_active: false })
        .eq('courier_id', location.courier_id);

      const { data, error } = await supabase
        .from('courier_locations')
        .insert({
          ...location,
          is_active: true,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating courier location:', error);
      return null;
    }
  }

  async getCourierCurrentLocation(courierId: string): Promise<CourierLocation | null> {
    try {
      const { data, error } = await supabase
        .from('courier_locations')
        .select('*')
        .eq('courier_id', courierId)
        .eq('is_active', true)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching courier location:', error);
      return null;
    }
  }

  async getCourierLocationHistory(
    courierId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CourierLocation[]> {
    try {
      let query = supabase
        .from('courier_locations')
        .select('*')
        .eq('courier_id', courierId)
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }

  async getAllActiveCourierLocations(): Promise<CourierLocation[]> {
    try {
      const { data, error } = await supabase
        .from('courier_locations')
        .select('*')
        .eq('is_active', true)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active courier locations:', error);
      return [];
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async findNearestCourier(
    targetLat: number,
    targetLon: number,
    maxDistanceKm: number = 10
  ): Promise<{ courier_id: string; distance: number; location: CourierLocation } | null> {
    try {
      const locations = await this.getAllActiveCourierLocations();

      let nearest: { courier_id: string; distance: number; location: CourierLocation } | null = null;

      for (const location of locations) {
        const distance = this.calculateDistance(
          targetLat,
          targetLon,
          parseFloat(location.latitude.toString()),
          parseFloat(location.longitude.toString())
        );

        if (distance <= maxDistanceKm) {
          if (!nearest || distance < nearest.distance) {
            nearest = {
              courier_id: location.courier_id,
              distance,
              location
            };
          }
        }
      }

      return nearest;
    } catch (error) {
      console.error('Error finding nearest courier:', error);
      return null;
    }
  }

  subscribeToLocationUpdates(
    courierId: string,
    callback: (location: CourierLocation) => void
  ) {
    const channel = supabase
      .channel(`courier_location_${courierId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'courier_locations',
          filter: `courier_id=eq.${courierId}`
        },
        (payload) => {
          callback(payload.new as CourierLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToAllLocationUpdates(callback: (location: CourierLocation) => void) {
    const channel = supabase
      .channel('all_courier_locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'courier_locations'
        },
        (payload) => {
          callback(payload.new as CourierLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async simulateCourierMovement(
    courierId: string,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    steps: number = 10
  ): Promise<void> {
    const latStep = (endLat - startLat) / steps;
    const lonStep = (endLon - startLon) / steps;

    for (let i = 0; i <= steps; i++) {
      const currentLat = startLat + (latStep * i);
      const currentLon = startLon + (lonStep * i);

      await this.updateCourierLocation({
        courier_id: courierId,
        latitude: currentLat,
        longitude: currentLon,
        location_type: 'gps',
        accuracy: 10,
        speed: 30 + Math.random() * 10,
        heading: Math.random() * 360,
        battery_level: 80 - i * 2,
        signal_strength: 90 - Math.random() * 20
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

export const courierTrackingService = CourierTrackingService.getInstance();
