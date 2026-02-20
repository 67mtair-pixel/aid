import { supabase } from '../lib/supabaseClient';
import type { InventoryItem, InventoryItemInsert, InventoryItemUpdate } from '../types/database';
import { notificationService } from './notificationService';

export class InventoryService {
  private static instance: InventoryService;

  private constructor() {}

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
  }

  async getInventoryByCenter(centerId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('distribution_center_id', centerId)
        .order('item_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory by center:', error);
      return [];
    }
  }

  async getLowStockItems(thresholdPercent: number = 20): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('current_quantity', { ascending: true });

      if (error) throw error;

      return (data || []).filter(item => {
        const stockPercent = (item.current_quantity / item.maximum_capacity) * 100;
        return stockPercent <= thresholdPercent;
      });
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  }

  async getExpiringSoonItems(daysThreshold: number = 30): Promise<InventoryItem[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysThreshold);

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .gte('expiry_date', today.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expiring items:', error);
      return [];
    }
  }

  async getCriticalItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('is_critical', true)
        .order('current_quantity', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching critical items:', error);
      return [];
    }
  }

  async addInventoryItem(item: InventoryItemInsert): Promise<InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      return null;
    }
  }

  async updateInventoryItem(id: string, updates: InventoryItemUpdate): Promise<InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data && this.isLowStock(data)) {
        await notificationService.sendInventoryLowStockAlert(
          data.item_name,
          parseFloat(data.current_quantity.toString()),
          parseFloat(data.minimum_threshold.toString())
        );
      }

      return data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return null;
    }
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  async consumeInventory(id: string, quantity: number): Promise<InventoryItem | null> {
    try {
      const { data: item, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = parseFloat(item.current_quantity.toString()) - quantity;

      if (newQuantity < 0) {
        console.error('Insufficient inventory quantity');
        return null;
      }

      return await this.updateInventoryItem(id, {
        current_quantity: newQuantity
      });
    } catch (error) {
      console.error('Error consuming inventory:', error);
      return null;
    }
  }

  async restockInventory(id: string, quantity: number): Promise<InventoryItem | null> {
    try {
      const { data: item, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = parseFloat(item.current_quantity.toString()) + quantity;
      const maxCapacity = parseFloat(item.maximum_capacity.toString());

      if (newQuantity > maxCapacity) {
        console.warn('Restock quantity exceeds maximum capacity');
      }

      return await this.updateInventoryItem(id, {
        current_quantity: Math.min(newQuantity, maxCapacity),
        last_restocked_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error restocking inventory:', error);
      return null;
    }
  }

  async reserveInventory(id: string, quantity: number): Promise<InventoryItem | null> {
    try {
      const { data: item, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const currentQty = parseFloat(item.current_quantity.toString());
      const reservedQty = parseFloat(item.reserved_quantity.toString());
      const availableQty = currentQty - reservedQty;

      if (availableQty < quantity) {
        console.error('Insufficient available inventory');
        return null;
      }

      return await this.updateInventoryItem(id, {
        reserved_quantity: reservedQty + quantity
      });
    } catch (error) {
      console.error('Error reserving inventory:', error);
      return null;
    }
  }

  async releaseReservation(id: string, quantity: number): Promise<InventoryItem | null> {
    try {
      const { data: item, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const reservedQty = parseFloat(item.reserved_quantity.toString());
      const newReservedQty = Math.max(0, reservedQty - quantity);

      return await this.updateInventoryItem(id, {
        reserved_quantity: newReservedQty
      });
    } catch (error) {
      console.error('Error releasing reservation:', error);
      return null;
    }
  }

  private isLowStock(item: InventoryItem): boolean {
    const currentQty = parseFloat(item.current_quantity.toString());
    const threshold = parseFloat(item.minimum_threshold.toString());
    return currentQty <= threshold;
  }

  async getInventoryStatistics(centerId?: string) {
    try {
      let query = supabase.from('inventory').select('*');

      if (centerId) {
        query = query.eq('distribution_center_id', centerId);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      const totalItems = items?.length || 0;
      const totalValue = items?.reduce((sum, item) => {
        return sum + (parseFloat(item.current_quantity.toString()) * parseFloat(item.cost_per_unit.toString()));
      }, 0) || 0;

      const lowStockItems = items?.filter(item => this.isLowStock(item)).length || 0;

      const criticalItems = items?.filter(item => item.is_critical).length || 0;

      const averageStockLevel = items?.reduce((sum, item) => {
        const stockPercent = (parseFloat(item.current_quantity.toString()) / parseFloat(item.maximum_capacity.toString())) * 100;
        return sum + stockPercent;
      }, 0) || 0;

      return {
        totalItems,
        totalValue,
        lowStockItems,
        criticalItems,
        averageStockLevel: totalItems > 0 ? averageStockLevel / totalItems : 0,
        items: items || []
      };
    } catch (error) {
      console.error('Error calculating inventory statistics:', error);
      return {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        criticalItems: 0,
        averageStockLevel: 0,
        items: []
      };
    }
  }

  subscribeToInventoryChanges(callback: (item: InventoryItem) => void) {
    const channel = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as InventoryItem);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const inventoryService = InventoryService.getInstance();
