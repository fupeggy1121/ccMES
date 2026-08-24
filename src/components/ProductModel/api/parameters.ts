// src/api/parameters.ts
import { supabase } from './supabase';
import { Parameter, ParameterGroup } from '../types/Product';

export const parameters = {
  getParameters: async (groupIds?: string[]): Promise<Parameter[]> => {
    console.log('[parameters.getParameters] called with group IDs:', groupIds);
    
    if (!groupIds || groupIds.length === 0) {
      console.log('[parameters.getParameters] No group IDs provided, returning empty array.');
      return [];
    }

    try {
      // 1. Query the join table 'parameter_group_parameters' to get parameter_ids AND their associated parameter_group_ids
      const { data: joinData, error: joinError } = await supabase
        .from('parameter_group_parameters')
        .select('parameter_id, parameter_group_id') // <-- Select both IDs
        .in('parameter_group_id', groupIds);

      if (joinError) {
        console.error('[parameters.getParameters] Error fetching from join table:', joinError);
        return [];
      }

      if (!joinData || joinData.length === 0) {
        console.log('[parameters.getParameters] No parameters found in join table for given group IDs.');
        return [];
      }

      const parameterIds = joinData.map(row => row.parameter_id);
      // Create a map to easily associate parameter_id with its group_id(s)
      // A parameter can belong to multiple groups, so store as an array of group IDs
      const paramGroupMap = new Map<string, string[]>();
      joinData.forEach(row => {
        if (!paramGroupMap.has(row.parameter_id)) {
          paramGroupMap.set(row.parameter_id, []);
        }
        paramGroupMap.get(row.parameter_id)?.push(row.parameter_group_id);
      });

      console.log('[parameters.getParameters] Found parameter IDs from join table:', parameterIds);

      // 2. Use the collected parameter_ids to fetch details from the 'parameters' table
      //    We no longer select 'parameter_group_id' from 'parameters' table itself,
      //    as it might not exist there. We will add it back during mapping.
      const { data, error } = await supabase
        .from('parameters')
        .select('id, name, code, unit, description, parameter_type, lower_limit, upper_limit, target_value') // <-- Removed parameter_group_id from select
        .in('id', parameterIds)
        .order('name', { ascending: true });

      if (error) {
        console.error('[parameters.getParameters] Error fetching parameters:', error);
        return [];
      }
      
      console.log('[parameters.getParameters] Returned raw Supabase data for parameters:', data);
      
      // Map Supabase data to Parameter interface, adding parameter_group_id from our map
      return data.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        unit: p.unit,
        description: p.description,
        type: (p.parameter_type as 'measurement' | 'process' ) || 'measurement', // <-- 已修改：添加默认值处理
        lower_limit: p.lower_limit,
        upper_limit: p.upper_limit,
        target_value: p.target_value,
        // Assign the parameter_group_id from our map.
        // For simplicity, we assign the first group ID found for this parameter.
        // The UI's filtering logic expects a single string ID for `param.parameter_group_id`.
        parameter_group_id: paramGroupMap.get(p.id)?.[0] || null, 
      }));
    } catch (err) {
      console.error('[parameters.getParameters] Unexpected error:', err);
      return [];
    }
  },

  getParameterGroups: async () => {
    const { data, error } = await supabase
      .from('parameter_groups')
      .select('id, name, description') // 移除 parameter_type
      .order('name', { ascending: true });

    if (error) {
      console.error('获取参数组时出错:', error);
      return [];
    }
    return data;
  },

  getParametersByGroupId: async (groupId: string) => {
    // 注意：这个函数现在应该也通过关联表获取参数
    // 首先从关联表获取参数ID
    const { data: joinData, error: joinError } = await supabase
      .from('parameter_group_parameters')
      .select('parameter_id, parameter_group_id')
      .eq('parameter_group_id', groupId);

    if (joinError) {
      console.error(`[parameters.getParametersByGroupId] Error fetching from join table for group ${groupId}:`, joinError);
      return [];
    }

    if (!joinData || joinData.length === 0) {
      console.log(`[parameters.getParametersByGroupId] No parameters found for group ${groupId}`);
      return [];
    }

    const parameterIds = joinData.map(row => row.parameter_id);
    
    const { data, error } = await supabase
      .from('parameters')
      .select('id, name, code, unit, description, parameter_type, lower_limit, upper_limit, target_value')
      .in('id', parameterIds)
      .order('name', { ascending: true });

    if (error) {
      console.error(`[parameters.getParametersByGroupId] Error fetching parameters for group ${groupId}:`, error);
      return [];
    }
    
    // 创建参数ID到参数组ID的映射
    const paramGroupMap = new Map<string, string[]>();
    joinData.forEach(row => {
      if (!paramGroupMap.has(row.parameter_id)) {
        paramGroupMap.set(row.parameter_id, []);
      }
      paramGroupMap.get(row.parameter_id)?.push(row.parameter_group_id);
    });
    
    // 映射 Supabase 数据到 Parameter 接口
    return data.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      unit: p.unit,
      description: p.description,
      type: (p.parameter_type as 'measurement' | 'process' | 'spc') || 'measurement', // <-- 已修改：添加默认值处理
      lower_limit: p.lower_limit,
      upper_limit: p.upper_limit,
      target_value: p.target_value,
      parameter_group_id: paramGroupMap.get(p.id)?.[0] || null,
    }));
  },

  getEquipmentParameters: async (equipmentId: string) => {
    // 假设有 equipment_parameters 关联表
    const { data, error } = await supabase
      .from('equipment_parameters')
      .select(`
        parameter_id,
        parameters (id, name, unit, parameter_type, lower_limit, upper_limit, target_value)
      `)
      .eq('equipment_id', equipmentId);

    if (error) {
      console.error(`获取设备 ${equipmentId} 的参数时出错:`, error);
      return [];
    }
    
    // 提取参数信息
    return data.map(item => item.parameters);
  },

  // 新增：根据ID获取参数组
  getParameterGroupsByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('parameter_groups')
      .select(`
        id,
        name,
        description
      `)
      .in('id', ids)
      .order('name', { ascending: true });

    if (error) {
      console.error('获取指定参数组时出错:', error); 
      return [];
    }
    return data;
  },

  // 新增：根据ID获取参数
  getParametersByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('parameters')
      .select('id, name, code, unit, description, parameter_type, lower_limit, upper_limit, target_value')
      .in('id', ids)
      .order('name', { ascending: true });

    if (error) {
      console.error('获取指定参数时出错:', error);
      return [];
    }
    
    // 映射 Supabase 数据到 Parameter 接口
    return data.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      unit: p.unit,
      description: p.description,
      type: (p.parameter_type as 'measurement' | 'process' | 'spc') || 'measurement', // <-- 已修改：添加默认值处理
      lower_limit: p.lower_limit,
      upper_limit: p.upper_limit,
      target_value: p.target_value,
    }));
  },
};