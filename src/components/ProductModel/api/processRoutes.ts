// src/api/processRoutes.ts
import { supabase } from './supabase';

export const processRoutes = {
  getAllProcessRoutes: async () => {
    const { data, error } = await supabase
      .from('process_routes')
      .select('id, code, name')
      .eq('path_type', 'main') // 仅获取主路径
      .order('name', { ascending: true });

    if (error) {
      console.error('获取所有工艺主路径时出错:', error);
      return [];
    }
    return data;
  },

  getAllSubProcessRoutes: async () => {
    const { data, error } = await supabase
      .from('process_routes')
      .select('id, code, name, description, path_type') // 获取子路径的更多信息
      .in('path_type', ['regular_sub', 'rework', 'lab', 'monitor', 'specialSampling'])
      .order('name', { ascending: true });

    if (error) {
      console.error('获取所有工艺子路径时出错:', error);
      return [];
    }
    // 将数据库的 path_type 映射到 StationSubPath 的 type
    return data.map(route => ({
      id: route.id,
      name: route.name,
      type: route.path_type === 'regular_sub' ? 'regular' : route.path_type, // 映射 'regular_sub' 到 'regular'
      description: route.description || '',
      returnStationCode: '', // 数据库中可能没有此字段，需要根据业务逻辑填充或移除
      canBeDisabled: true, // 假设子路径默认可禁用
      defaultEnabled: true // 假设子路径默认启用
    }));
  },

  getStationsForRoute: async (routeId: string) => {
    const { data, error } = await supabase
      .from('process_route_stations')
      .select(`
        sequence,
        stations (id, code, name, equipment_group_ids, parameter_group_ids, recipe_id) // 修改这里
      `)
      .eq('route_id', routeId)
      .order('sequence', { ascending: true });

    if (error) {
      console.error(`获取工艺路径 ${routeId} 的站点时出错:`, error);
      return [];
    }
    // 返回包含基本站点信息和序列号的数组，包括 recipe_id
    return data.map(item => ({
      id: item.stations.id,
      sequence: item.sequence,
      code: item.stations.code,
      name: item.stations.name,
      equipment_group_ids: item.stations.equipment_group_ids,
      parameter_group_ids: item.stations.parameter_group_ids,
      recipe_id: item.stations.recipe_id // 包含 recipe_id
    }));
  }
};