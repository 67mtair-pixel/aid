import { supabase } from '../lib/supabaseClient';
import type { Notification, NotificationInsert } from '../types/database';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async createNotification(notification: NotificationInsert): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async getNotifications(recipientId?: string, recipientType?: string): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (recipientId) {
        query = query.eq('recipient_id', recipientId);
      }

      if (recipientType) {
        query = query.eq('recipient_type', recipientType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadNotifications(recipientId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', recipientId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(recipientId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('recipient_id', recipientId)
        .eq('status', 'pending');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  subscribeToNotifications(
    recipientId: string,
    callback: (notification: Notification) => void
  ) {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${recipientId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToAllNotifications(callback: (notification: Notification) => void) {
    const channel = supabase
      .channel('all_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async sendTaskAssignmentNotification(
    courierId: string,
    taskId: string,
    taskDetails: string
  ): Promise<Notification | null> {
    return this.createNotification({
      recipient_type: 'courier',
      recipient_id: courierId,
      title: 'مهمة توصيل جديدة',
      message: `تم تعيين مهمة توصيل جديدة لك: ${taskDetails}`,
      type: 'info',
      priority: 'high',
      channel: 'app',
      metadata: { task_id: taskId },
      related_entity_type: 'task',
      related_entity_id: taskId
    });
  }

  async sendDeliveryNotification(
    beneficiaryId: string,
    packageName: string,
    estimatedTime: string
  ): Promise<Notification | null> {
    return this.createNotification({
      recipient_type: 'beneficiary',
      recipient_id: beneficiaryId,
      title: 'طردك في الطريق',
      message: `طردك "${packageName}" في طريقه إليك. الوصول المتوقع: ${estimatedTime}`,
      type: 'info',
      priority: 'high',
      channel: 'sms',
      metadata: { estimated_arrival: estimatedTime }
    });
  }

  async sendInventoryLowStockAlert(
    itemName: string,
    currentQuantity: number,
    threshold: number
  ): Promise<Notification | null> {
    return this.createNotification({
      recipient_type: 'all',
      title: 'تنبيه مخزون منخفض',
      message: `المخزون منخفض للعنصر "${itemName}". الكمية الحالية: ${currentQuantity}، الحد الأدنى: ${threshold}`,
      type: 'warning',
      priority: 'high',
      channel: 'app',
      metadata: { item_name: itemName, current_quantity: currentQuantity, threshold }
    });
  }

  async sendPackageDeliveredNotification(
    beneficiaryId: string,
    packageName: string
  ): Promise<Notification | null> {
    return this.createNotification({
      recipient_type: 'beneficiary',
      recipient_id: beneficiaryId,
      title: 'تم تسليم الطرد',
      message: `تم تسليم طردك "${packageName}" بنجاح. نأمل أن تكون راضياً عن خدمتنا.`,
      type: 'success',
      priority: 'normal',
      channel: 'sms',
      metadata: { package_name: packageName }
    });
  }

  async sendDelayedDeliveryAlert(
    beneficiaryId: string,
    packageName: string,
    newEstimatedTime: string
  ): Promise<Notification | null> {
    return this.createNotification({
      recipient_type: 'beneficiary',
      recipient_id: beneficiaryId,
      title: 'تأخير في التوصيل',
      message: `نعتذر عن التأخير في توصيل طردك "${packageName}". الوقت المتوقع الجديد: ${newEstimatedTime}`,
      type: 'warning',
      priority: 'high',
      channel: 'sms',
      metadata: { package_name: packageName, new_time: newEstimatedTime }
    });
  }
}

export const notificationService = NotificationService.getInstance();
