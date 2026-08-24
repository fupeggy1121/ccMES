// src/services/productionOrdersService.ts
import { supabase } from '../lib/supabaseClient';
import { ProductionOrder, BOMItem } from '../types';

const TABLE_NAME = 'production_orders';

// 辅助函数：将数据库行转换为 ProductionOrder 接口
const mapRowToProductionOrder = (row: any): ProductionOrder => ({
  id: row.id,
  orderType: row.order_type,
  orderNumber: row.order_number,
  planName: row.plan_name,
  productRefId: row.product_ref_id,
  productName: row.product_name, // 映射到 productName
  targetQuantity: row.target_quantity,
  currentProgress: row.current_progress,
  startProcessStationCode: row.start_process_station_code,
  endProcessStationCode: row.end_process_station_code,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  status: row.status,
  priority: row.priority,
  assignedOperator: row.assigned_operator,
  notes: row.notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  bomItems: row.bom_items || [], // JSONB 字段直接映射
});

// 辅助函数：将 ProductionOrder 接口转换为数据库行
const mapProductionOrderToRow = (order: Partial<ProductionOrder>): any => ({
  order_type: order.orderType,
  order_number: order.orderNumber,
  plan_name: order.planName,
  product_ref_id: order.productRefId,
  product_name: order.productName,
  target_quantity: order.targetQuantity,
  current_progress: order.currentProgress,
  start_process_station_code: order.startProcessStationCode,
  end_process_station_code: order.endProcessStationCode,
  start_date: order.startDate?.toISOString(),
  end_date: order.endDate?.toISOString(),
  status: order.status,
  priority: order.priority,
  assigned_operator: order.assignedOperator,
  notes: order.notes,
  bom_items: order.bomItems, // JSONB 字段直接映射
});

export const productionOrdersService = {
  async fetchProductionOrders(): Promise<ProductionOrder[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching production orders:', error);
      throw error;
    }
    return data.map(mapRowToProductionOrder);
  },

  async createProductionOrder(order: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt' | 'currentProgress'>): Promise<ProductionOrder> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(mapProductionOrderToRow(order))
      .select()
      .single();

    if (error) {
      console.error('Error creating production order:', error);
      throw error;
    }
    return mapRowToProductionOrder(data);
  },

  async updateProductionOrder(id: string, updates: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(mapProductionOrderToRow(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating production order:', error);
      throw error;
    }
    return mapRowToProductionOrder(data);
  },

  async deleteProductionOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting production order:', error);
      throw error;
    }
  },

  // 假设您需要获取产品列表来填充下拉菜单
  async fetchProducts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('products') // 假设您的产品表名为 'products'
      .select('supabase_id, product_name, product_code');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    return data;
  }
};
