import { supabase } from '../lib/supabaseClient';
import { courierTrackingService } from './courierTrackingService';
import { notificationService } from './notificationService';

interface TaskDistributionParams {
  packageId: string;
  beneficiaryId: string;
  deliveryLocation: { lat: number; lng: number };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: string;
}

interface CourierScore {
  courierId: string;
  score: number;
  distance: number;
  availableCapacity: number;
  rating: number;
  completionRate: number;
}

export class SmartTaskDistributionService {
  private static instance: SmartTaskDistributionService;

  private constructor() {}

  static getInstance(): SmartTaskDistributionService {
    if (!SmartTaskDistributionService.instance) {
      SmartTaskDistributionService.instance = new SmartTaskDistributionService();
    }
    return SmartTaskDistributionService.instance;
  }

  async findBestCourier(params: TaskDistributionParams): Promise<string | null> {
    try {
      const { data: availableCouriers, error } = await supabase
        .from('couriers')
        .select('*')
        .in('status', ['active', 'busy']);

      if (error) throw error;
      if (!availableCouriers || availableCouriers.length === 0) {
        console.warn('No available couriers found');
        return null;
      }

      const courierScores: CourierScore[] = [];

      for (const courier of availableCouriers) {
        const location = await courierTrackingService.getCourierCurrentLocation(courier.id);

        if (!location) {
          continue;
        }

        const distance = courierTrackingService.calculateDistance(
          params.deliveryLocation.lat,
          params.deliveryLocation.lng,
          parseFloat(location.latitude.toString()),
          parseFloat(location.longitude.toString())
        );

        const { data: currentTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('courier_id', courier.id)
          .in('status', ['assigned', 'in_progress']);

        const currentTaskCount = currentTasks?.length || 0;
        const maxTasksPerCourier = 10;
        const availableCapacity = Math.max(0, maxTasksPerCourier - currentTaskCount);

        if (availableCapacity === 0) {
          continue;
        }

        const score = this.calculateCourierScore(
          distance,
          courier.rating,
          availableCapacity,
          maxTasksPerCourier,
          params.priority
        );

        courierScores.push({
          courierId: courier.id,
          score,
          distance,
          availableCapacity,
          rating: courier.rating,
          completionRate: courier.completed_tasks > 0 ? (courier.completed_tasks / (courier.completed_tasks + 10)) * 100 : 50
        });
      }

      if (courierScores.length === 0) {
        console.warn('No suitable couriers found after scoring');
        return null;
      }

      courierScores.sort((a, b) => b.score - a.score);

      return courierScores[0].courierId;
    } catch (error) {
      console.error('Error finding best courier:', error);
      return null;
    }
  }

  private calculateCourierScore(
    distance: number,
    rating: number,
    availableCapacity: number,
    maxCapacity: number,
    priority: string
  ): number {
    const distanceScore = Math.max(0, 100 - (distance * 5));

    const ratingScore = (rating / 5) * 100;

    const capacityScore = (availableCapacity / maxCapacity) * 100;

    const priorityMultiplier = priority === 'urgent' ? 1.5 : priority === 'high' ? 1.2 : 1.0;

    const weights = {
      distance: 0.4,
      rating: 0.3,
      capacity: 0.3
    };

    const totalScore = (
      distanceScore * weights.distance +
      ratingScore * weights.rating +
      capacityScore * weights.capacity
    ) * priorityMultiplier;

    return totalScore;
  }

  async assignTaskToCourier(params: TaskDistributionParams): Promise<string | null> {
    try {
      const bestCourierId = await this.findBestCourier(params);

      if (!bestCourierId) {
        console.error('Could not find suitable courier for task');
        return null;
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          package_id: params.packageId,
          beneficiary_id: params.beneficiaryId,
          courier_id: bestCourierId,
          status: 'assigned',
          scheduled_at: params.scheduledAt || new Date().toISOString(),
          delivery_location: params.deliveryLocation
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('packages')
        .update({ status: 'assigned' })
        .eq('id', params.packageId);

      await supabase
        .from('couriers')
        .update({ status: 'busy' })
        .eq('id', bestCourierId);

      const { data: courier } = await supabase
        .from('couriers')
        .select('name')
        .eq('id', bestCourierId)
        .single();

      const { data: packageData } = await supabase
        .from('packages')
        .select('name')
        .eq('id', params.packageId)
        .single();

      await notificationService.sendTaskAssignmentNotification(
        bestCourierId,
        task.id,
        `توصيل طرد: ${packageData?.name || 'طرد جديد'}`
      );

      return task.id;
    } catch (error) {
      console.error('Error assigning task to courier:', error);
      return null;
    }
  }

  async optimizeRouteForCourier(courierId: string): Promise<any[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*, beneficiaries!tasks_beneficiary_id_fkey(location)')
        .eq('courier_id', courierId)
        .in('status', ['assigned', 'in_progress'])
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      if (!tasks || tasks.length === 0) return [];

      const courierLocation = await courierTrackingService.getCourierCurrentLocation(courierId);
      if (!courierLocation) return tasks;

      const startPoint = {
        lat: parseFloat(courierLocation.latitude.toString()),
        lng: parseFloat(courierLocation.longitude.toString())
      };

      const optimizedRoute = this.nearestNeighborAlgorithm(startPoint, tasks);

      for (let i = 0; i < optimizedRoute.length; i++) {
        await supabase
          .from('tasks')
          .update({
            scheduled_at: new Date(Date.now() + (i * 30 * 60000)).toISOString()
          })
          .eq('id', optimizedRoute[i].id);
      }

      return optimizedRoute;
    } catch (error) {
      console.error('Error optimizing route:', error);
      return [];
    }
  }

  private nearestNeighborAlgorithm(start: { lat: number; lng: number }, tasks: any[]): any[] {
    const unvisited = [...tasks];
    const route: any[] = [];
    let currentPoint = start;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const task = unvisited[i];
        const location = task.beneficiaries?.location || task.delivery_location;

        if (!location) continue;

        const distance = courierTrackingService.calculateDistance(
          currentPoint.lat,
          currentPoint.lng,
          location.lat,
          location.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      const nearestTask = unvisited.splice(nearestIndex, 1)[0];
      route.push(nearestTask);

      const nextLocation = nearestTask.beneficiaries?.location || nearestTask.delivery_location;
      if (nextLocation) {
        currentPoint = { lat: nextLocation.lat, lng: nextLocation.lng };
      }
    }

    return route;
  }

  async redistributeTasksOnCourierUnavailable(unavailableCourierId: string): Promise<void> {
    try {
      const { data: affectedTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('courier_id', unavailableCourierId)
        .in('status', ['assigned', 'in_progress']);

      if (error) throw error;
      if (!affectedTasks || affectedTasks.length === 0) return;

      for (const task of affectedTasks) {
        const { data: packageData } = await supabase
          .from('packages')
          .select('*')
          .eq('id', task.package_id)
          .single();

        if (!packageData) continue;

        const deliveryLocation = task.delivery_location || { lat: 31.5, lng: 34.5 };

        const newCourierId = await this.findBestCourier({
          packageId: task.package_id,
          beneficiaryId: task.beneficiary_id,
          deliveryLocation,
          priority: 'high'
        });

        if (newCourierId) {
          await supabase
            .from('tasks')
            .update({
              courier_id: newCourierId,
              status: 'assigned',
              notes: `تم إعادة التوزيع من المندوب السابق`
            })
            .eq('id', task.id);

          await notificationService.sendTaskAssignmentNotification(
            newCourierId,
            task.id,
            `مهمة معاد توزيعها: ${packageData.name}`
          );
        }
      }

      await supabase
        .from('couriers')
        .update({ status: 'offline' })
        .eq('id', unavailableCourierId);
    } catch (error) {
      console.error('Error redistributing tasks:', error);
    }
  }

  async getTaskDistributionStatistics() {
    try {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('courier_id, status, created_at, delivered_at');

      if (!tasks) return null;

      const courierStats: { [key: string]: any } = {};

      tasks.forEach(task => {
        if (!task.courier_id) return;

        if (!courierStats[task.courier_id]) {
          courierStats[task.courier_id] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            failed: 0,
            averageTime: 0,
            totalTime: 0
          };
        }

        courierStats[task.courier_id].total++;

        if (task.status === 'delivered') {
          courierStats[task.courier_id].completed++;

          if (task.created_at && task.delivered_at) {
            const timeMs = new Date(task.delivered_at).getTime() - new Date(task.created_at).getTime();
            courierStats[task.courier_id].totalTime += timeMs;
          }
        } else if (task.status === 'in_progress' || task.status === 'assigned') {
          courierStats[task.courier_id].inProgress++;
        } else if (task.status === 'failed') {
          courierStats[task.courier_id].failed++;
        }
      });

      Object.keys(courierStats).forEach(courierId => {
        const stats = courierStats[courierId];
        if (stats.completed > 0) {
          stats.averageTime = Math.round(stats.totalTime / stats.completed / 60000);
        }
      });

      return courierStats;
    } catch (error) {
      console.error('Error getting task distribution statistics:', error);
      return null;
    }
  }
}

export const smartTaskDistributionService = SmartTaskDistributionService.getInstance();
