// src/utils/stationEnrichment.ts
import { Station, Parameter, StationSubPath, EquipmentGroup, ParameterGroup, Equipment } from '../types/Product';
import { supabase } from '../api/supabase';
import { parameters } from '../api/parameters';
import { equipment } from '../api/equipment';
import { processRoutes } from '../api/processRoutes';

// 帮助函数：获取基本站点的详细信息
const getStationDetails = async (basicStation: {
  id: string;
  code: string;
  name: string;
  sequence?: number;
  equipment_group_ids?: string[]; // 修改为数组类型
  parameter_group_ids?: string[];
  recipe_id?: string; // 接收 recipe_id
  remarks?: string[];
  sub_path_configs?: StationSubPath[];
  samplingRule?: string;
  sampling_rule?: string;
}): Promise<Station> => {
  // --- ADD THIS LOG ---
  console.log(`[getStationDetails] Entering for station: ${basicStation.name} (ID: ${basicStation.id}), parameter_group_ids received:`, basicStation.parameter_group_ids);
  // --- END ADDED LOG ---
  
  // 1. 获取配方名称
  let recipeName = '';
  if (basicStation.recipe_id) {
    try {
      const { data: recipeData, error } = await supabase
        .from('equipment_recipes') // 假设存在 equipment_recipes 表
        .select('name')
        .eq('id', basicStation.recipe_id)
        .single();
      if (!error && recipeData) {
        recipeName = recipeData.name;
      } else {
        console.warn(`未找到配方 ID: ${basicStation.recipe_id} 的名称`, error);
      }
    } catch (error) {
      console.error('Failed to fetch recipe name:', error);
    }
  }

  // 2. 获取参数组详细信息及其关联参数
  let parameterGroups: ParameterGroup[] = [];
  let allStationParameters: Parameter[] = []; // 用于存储当前站点所有相关参数

  if (basicStation.parameter_group_ids && basicStation.parameter_group_ids.length > 0) {
    console.log(`[getStationDetails] Fetching parameter groups and parameters for station: ${basicStation.name} (ID: ${basicStation.id}) with parameter_group_ids:`, basicStation.parameter_group_ids); // 新增日志
    try {
      // 仅获取参数组本身
      parameterGroups = await parameters.getParameterGroupsByIds(basicStation.parameter_group_ids);
      // 获取这些参数组下的所有参数
      allStationParameters = await parameters.getParameters(basicStation.parameter_group_ids);
      console.log(`[getStationDetails] Fetched allStationParameters for ${basicStation.name}:`, allStationParameters); // 新增日志
    } catch (error) {
      console.error('[getStationDetails] Failed to fetch parameter groups or parameters for station:', error);
    }
  } else {
    console.log(`[getStationDetails] No parameter_group_ids for station: ${basicStation.name} (ID: ${basicStation.id})`); // 新增日志
  }

  // 从所有站点参数中提取参数并分类
  const measurementParameters: Parameter[] = [];
  const processParameters: Parameter[] = [];
  const spcParameters: Parameter[] = [];

  allStationParameters.forEach(param => {
    switch (param.type) { // 使用 Parameter 接口中的 type 字段
      case 'measurement':
        measurementParameters.push(param);
        break;
      case 'process':
        processParameters.push(param);
        break;
      case 'spc':
        spcParameters.push(param);
        break;
      default:
        console.warn(`[getStationDetails] Unknown parameter type for param ${param.name}: ${param.type}`); // 新增日志
    }
  });
  
  console.log(`[getStationDetails] Categorized parameters for ${basicStation.name}: Measurement=${measurementParameters.length}, Process=${processParameters.length}, SPC=${spcParameters.length}`); // 新增日志

  return {
    id: basicStation.id,
    sequence: basicStation.sequence || 0,
    stationName: basicStation.name || '',
    stationCode: basicStation.code || '',
    equipment_group_ids: basicStation.equipment_group_ids || [], // 修改这里，确保是数组
    recipe_id: basicStation.recipe_id,
    recipe: recipeName,
    parameter_group_ids: basicStation.parameter_group_ids || [],
    samplingRule: basicStation.samplingRule || basicStation.sampling_rule || '',
    remarks: basicStation.remarks || [],
    associatedSubPaths: basicStation.sub_path_configs || [],

    // 展示用数据
    parameterGroups, // 保留参数组，如果前端需要展示组信息
    measurementParameters,
    processParameters,
    spcParameters
  };
};

// Function to enrich a basic station with default product-specific details
export const enrichStationWithDefaults = async (
  basicStation: {
    id: string;
    code: string;
    name: string;
    sequence?: number;
    equipment_group_ids?: string[]; // 修改为数组类型
    parameter_group_ids?: string[];
    recipe_id?: string; // 接收 recipe_id
    remarks?: string[];
    sub_path_configs?: StationSubPath[];
    samplingRule?: string;
    sampling_rule?: string;
  },
  availableSubPaths: StationSubPath[] = []
): Promise<Station> => {
  // 获取站点详细信息
  const station = await getStationDetails(basicStation);

  // 处理子路径配置
  let associatedSubPaths: StationSubPath[] = [];

  // 优先使用从数据库获取的 sub_path_configs
  if (basicStation.sub_path_configs && basicStation.sub_path_configs.length > 0) {
    associatedSubPaths = basicStation.sub_path_configs.map(config => {
      // 尝试从 availableSubPaths 中找到完整的子路径定义，以补充可能缺失的字段
      const fullSubPath = availableSubPaths.find(sp => sp.id === config.id || sp.name === config.name);
      return {
        ...fullSubPath, // 包含所有默认属性
        ...config,      // 覆盖来自数据库配置的属性
        // 确保默认值，如果数据库配置中没有明确指定
        canBeDisabled: config.canBeDisabled !== undefined ? config.canBeDisabled : (fullSubPath?.canBeDisabled ?? true),
        defaultEnabled: config.defaultEnabled !== undefined ? config.defaultEnabled : (fullSubPath?.defaultEnabled ?? true),
        description: config.description || fullSubPath?.description || '',
        returnStationCode: config.returnStationCode || fullSubPath?.returnStationCode || '',
        type: config.type || fullSubPath?.type || 'regular' // 确保 type 字段有值
      };
    });
  } else {
    // 如果数据库中没有配置子路径，则默认不关联任何子路径
    associatedSubPaths = [];
  }

  // 更新站点的关联子路径
  station.associatedSubPaths = associatedSubPaths;

  return station;
};

// Function to populate stations for a sub-path (used in StationSubPathConfigModal)
export const populateStationsForSubPath = async (subPathId: string): Promise<Station[]> => {
  // 从数据库获取子路径的站点
  const basicStations = await processRoutes.getStationsForRoute(subPathId);
  const availableSubPaths = await processRoutes.getAllSubProcessRoutes(); // 获取所有子路径定义

  // 并行丰富这些基本站点
  const stationsPromises = basicStations.map(async (bs: any, index: number) => {
    const stationData = {
      id: bs.id || `${bs.stationCode}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      code: bs.code || bs.stationCode,
      name: bs.name || bs.stationName,
      sequence: bs.sequence || index + 1,
      equipment_group_ids: bs.equipment_group_ids, // 修改这里
      parameter_group_ids: bs.parameter_group_ids || [],
      recipe_id: bs.recipe_id, // 确保传递 recipe_id
      remarks: bs.remarks || [],
      sub_path_configs: bs.sub_path_configs
    };

    return enrichStationWithDefaults(stationData, availableSubPaths);
  });

  return Promise.all(stationsPromises);
};

// 根据设备组ID获取设备列表
export const getEquipmentByGroupIds = async (equipmentGroupIds: string[]): Promise<Equipment[]> => {
  if (!equipmentGroupIds || equipmentGroupIds.length === 0) {
    return [];
  }

  try {
    const equipmentList = await equipment.getEquipmentByGroupIds(equipmentGroupIds);
    return equipmentList;
  } catch (error) {
    console.error('Failed to fetch equipment:', error);
    return [];
  }
};
