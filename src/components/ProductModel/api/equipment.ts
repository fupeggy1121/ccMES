// src/api/equipment.ts
import { supabase } from './supabase';

export const equipment = {
  getEquipmentGroups: async () => {
    const { data, error } = await supabase
      .from('equipment_groups')
      .select('id, name, description')
      .order('name', { ascending: true });

    if (error) {
      console.error('获取设备组时出错:', error);
      return [];
    }
    return data;
  },

  getEquipmentByGroupId: async (groupId: string) => {
    const { data, error } = await supabase
      .from('equipment')
      .select('id, name, model, status, equipment_group_id')
      .eq('equipment_group_id', groupId)
      .order('name', { ascending: true });

    if (error) {
      console.error(`获取设备组 ${groupId} 的设备时出错:`, error);
      return [];
    }
    return data;
  },

  getEquipmentRecipes: async (equipmentId?: string) => {
    let query = supabase
      .from('equipment_recipes')
      .select('id, name, description, equipment_id');
    
    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    
    if (error) {
      console.error('获取设备配方时出错:', error);
      return [];
    }
    return data;
  },

  // 新增：获取所有设备
  getAllEquipment: async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select('id, name, code, equipment_group_id, recipe_id') // 确保选择 recipe_id
      .order('name', { ascending: true });

    if (error) {
      console.error('获取所有设备时出错:', error);
      return [];
    }
    return data;
  },

  // 新增：根据ID获取设备组
  getEquipmentGroupsByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('equipment_groups')
      .select('id, name, description')
      .in('id', ids)
      .order('name', { ascending: true });

    if (error) {
      console.error('获取指定设备组时出错:', error);
      return [];
    }
    return data;
  },
};