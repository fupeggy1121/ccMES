// src/types/Product.ts

// 参数类型定义
export type ParameterType = 'measurement' | 'process'; // 移除 'spc'

// 参数接口
export interface Parameter {
  id: string;
  name: string;
  code: string;
  unit: string;
  description?: string;
  type: ParameterType;
  lower_limit?: number;
  upper_limit?: number;
  target_value?: number;
  parameter_group_id?: string | null;
}

// 参数组接口
export interface ParameterGroup {
  id: string;
  name: string;
  description?: string;
}

// 设备接口
export interface Equipment {
  id: string;
  name: string;
  code: string;
  equipment_group_id?: string;
  equipment_group_ids?: string[];
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  parameters?: Parameter[];
}

// 设备组接口
export interface EquipmentGroup {
  id: string;
  name: string;
  description?: string;
  equipment_list?: Equipment[];
}

// 子路径类型
export type SubPathType = 'regular' | 'rework' | 'lab' | 'monitor' | 'specialSampling';

// 站点子路径配置
export interface StationSubPath {
  id: string;
  name: string;
  type: SubPathType;
  description?: string;
  returnStationCode?: string;
  canBeDisabled: boolean;
  defaultEnabled: boolean;
  isEnabled?: boolean; // 添加 isEnabled 字段用于存储覆盖状态
}

// 站点接口
export interface Station {
  id: string;
  sequence: number;
  stationName: string;
  stationCode: string;
  equipment_group_ids?: string[];
  recipe_id?: string;
  recipe?: string;
  parameter_group_ids?: string[];
  samplingRule?: string;
  remarks?: string[];
  associatedSubPaths: StationSubPath[];
  
  // 展示用数据
  parameterGroups?: ParameterGroup[];
  measurementParameters: Parameter[];
  processParameters: Parameter[];
  spcParameters: Parameter[]; // 保留此字段但将始终为空数组
  
  // 用于存储简化版本
  simplifiedForStorage?: any;
}

// 产品站点子路径覆盖
export interface ProductStationSubPathOverride {
  id: string;
  subPathId: string;
  isEnabled?: boolean;
  configuredStations?: Station[];
  remarks?: string[];
}

// 子流程配置
export interface SubProcessConfig {
  id: string;
  name: string;
  subPathId: string;
  conditions: string[];
  stations: Station[];
}

// 产品状态
export type ProductStatus = 'DRAFT' | 'APPROVED' | 'ARCHIVED' | 'EXPERIMENTAL';

// 站点规格
export interface StationSpecification {
  stationId: string;
  stationName: string;
  category: 'main' | 'regular' | 'rework' | 'lab' | 'monitor' | 'specialSampling';
  subPathId?: string;
  subPathName?: string;
  parameters: Array<{
    parameterId: string;
    parameterName: string;
    unit: string;
    lowerLimit: number;
    upperLimit: number;
    target: number;
    type?: ParameterType; // 添加type字段用于前端过滤
  }>;
}

// 产品接口
export interface Product {
  id: number;
  productCode: string;
  productName: string;
  productCategory: string;
  productCategoryVersion: string;
  productType: string;
  customerName?: string;
  description?: string;
  mainProcessRouteId?: number;
  specifications: Record<string, any>;
  processStations: Station[];
  stationSubPathOverrides: ProductStationSubPathOverride[];
  status: ProductStatus;
  revisionHistory: any[];
  experimentalDeviationConfig?: any;
  subProcessConfigs: SubProcessConfig[];
}

// 辅助函数：将 Supabase 行数据映射到 Product 类型
// 接受 availableSubPaths 参数用于重新构建完整的 StationSubPath 对象
export const mapSupabaseProductToProductType = (supabaseProduct: any, availableSubPaths: StationSubPath[] = []): Product => {
  return {
    id: supabaseProduct.id, // 原始的数字 ID
    productCode: supabaseProduct.product_code,
    productName: supabaseProduct.product_name,
    productCategory: supabaseProduct.product_category,
    productCategoryVersion: supabaseProduct.product_category_version,
    productType: supabaseProduct.product_type,
    customerName: supabaseProduct.customer_name,
    description: supabaseProduct.description,
    mainProcessRouteId: supabaseProduct.main_process_route_id,
    // Supabase 客户端通常会自动解析 JSONB 字段，所以这里直接使用
    specifications: supabaseProduct.specifications || {},
    processStations: supabaseProduct.process_stations ? supabaseProduct.process_stations.map((station: any) => {
      const stationCode = station.stationCode || station.station_code || station.code || '';
      const stationName = station.stationName || station.station_name || station.name || '';

      // 重新构建 associatedSubPaths
      const rehydratedAssociatedSubPaths = (station.associatedSubPaths || []).map((storedSubPath: { id: string; isEnabled: boolean }) => {
        const fullSubPathDef = availableSubPaths.find(sp => sp.id === storedSubPath.id);
        if (fullSubPathDef) {
          return {
            ...fullSubPathDef,
            isEnabled: storedSubPath.isEnabled // 使用存储的 isEnabled 标志
          };
        }
        // 如果找不到完整的定义，提供一个回退（理论上数据一致时不会发生）
        return {
          id: storedSubPath.id,
          name: `Unknown SubPath (${storedSubPath.id})`,
          type: 'regular', // 默认类型
          description: '',
          canBeDisabled: true,
          defaultEnabled: storedSubPath.isEnabled,
          isEnabled: storedSubPath.isEnabled // 确保 isEnabled 已设置
        };
      });

      return {
        ...station,
        stationCode,
        stationName,
        equipment_group_ids: station.equipment_group_ids || [],
        parameter_group_ids: station.parameter_group_ids || [],
        associatedSubPaths: rehydratedAssociatedSubPaths, // 使用重新构建的子路径
      };
    }) : [],
    stationSubPathOverrides: supabaseProduct.station_sub_path_overrides || [],
    status: supabaseProduct.status as ProductStatus,
    revisionHistory: supabaseProduct.revision_history || [],
    experimentalDeviationConfig: supabaseProduct.experimental_deviation_config,
    subProcessConfigs: supabaseProduct.sub_process_configs || [],
  };
};

// 产品模型（用于审批模板配置）
export interface ProductModel {
  id: string;
  name: string;
  modelNumber: string;
  version: string;
  productType: string;
  productUsage: string;
  processRoute: string | null;
  updatedAt: string;
  specifications: StationSpecification[];
  approvalTemplate: any;
}

// 审批项接口
export interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  approverRole: string;
  required: boolean;
  order: number;
}

// 审批模板接口
export interface ApprovalTemplate {
  id: string;
  productModelId: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  approvalItems: ApprovalItem[];
}