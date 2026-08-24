
// src/types.ts

export interface BatchData {
  id: string;
  batchCode: string;
  productCode: string;
  productName: string;
  totalQty: number;
  goodQty: number;
  defectQty: number;
  status: string;
  station: string; // 当前站点编码
  stationName: string; // 当前站点名称
  equipmentCode: string; // 设备编码
  equipmentName: string; // 设备名称
  equipmentChamber: string; // 设备腔室
  nextStationCode: string; // 下一站点编码
  nextStationName: string; // 下一站点名称
  productVersion: number; // 产品版本
  recipeCode: string; // 配方编码
  ingotId: string; // 晶棒ID
  isSmallBatch: boolean; // 新增：是否小批量
  isHold: boolean; // 新增：是否处于Hold状态
  defectDisposal?: '返工' | '报废' | '残值回收'; // 不良处置
  ledgerCode?: string; // 台账号（进站设备编号-设备总炉次-备件生命周期炉次）
}

export interface SubBatchData {
  id: string; // 新增：子批次的UUID
  sublotId: string;
  carrierId: string;
  totalQty: number;
  goodQty: number;
  defectQty: number;
  defectDisposal?: '返工' | '报废' | '残值回收'; // 不良处置
  status: string;
  station: string;
  stationName: string;
  equipment: string;
  packagingBarcode?: string; // 新增：包装条码，可选
}

export interface BatchDataItem {
  id: number;
  seq: number;
  name: string;
  code: string;
  totalQty: number;
  defectQty: number;
  path: string;
  version: number;
}

export interface ProductData {
  id: string;
  productCode: string;
  productName: string;
  productVersion: number;
  productType: string;
  specParams: string; // 产品规格参数
  processPathName: string; // 工艺路径名称
}

export interface CarrierData {
  id: string;
  sublotId: string;
  goodQty: number;
  defectQty: number;
  totalQty?: number; // 新增：总数量，用于生成晶圆数据时使用
  masterBatchCode?: string; // 新增：批次编码，用于晶圆片重组模块
  productCode?: string; // 新增：材料号
}

// New types for inspection parameters
export interface InspectionParameter {
  name: string;
  value: number;
  unit: string;
  min?: number; // Optional min value for validation/grading
  max?: number; // Optional max value for validation/grading
}

// Extend WaferData
export interface WaferData {
  id: string; // 将 id 类型从 number 更改为 string
  slotNo: number;
  type: 'GOOD' | 'REJECT' | 'LOSS' | 'Select' | 'GoodSample'; // Updated wafer types: REJECT for不良, LOSS for 损失, GoodSample for 良品留样
  waferId: string;
  sublotId: string; // Added for MeasurementParameters display
  carrierId: string; // Added for MeasurementParameters display
  lotId?: string; // 新增：批次ID (Lot ID)
  markingCode?: string; // For marking station
  markingStatus: '待打标' | '已生成码' | '已确认' | '已完成' | '跳过'; // For marking station
  disposition?: 'REWORK_WASH' | 'REWORK_POLISH' | 'HOLD' | 'NONE'; // New: Disposition for inspection stations
  grade?: string; // New: Grade for geometric inspection
  inspectionParameters?: InspectionParameter[]; // New: Inspection parameters for inspection stations
  inspectionStatus: '待检验' | '已检验' | '已标记'; // New: Status for inspection process
  materialCode?: string; // 材料号（炉次工艺追溯码：设备编号-设备总炉次-备件生命周期炉次）
  // 新增：按站点存储的检验结果
  inspectionResultsByStation?: { 
    [stationCode: string]: { 
      parameters: InspectionParameter[], 
      defectType?: string, 
      defectCode?: string, 
      waferType?: WaferData['type'], 
      disposition?: WaferData['disposition'], 
      grade?: string 
    } 
  };
  recycleGrade?: 'A级' | 'B级' | 'C级'; // 回收等级
  defectDisposal?: '返工' | '残值回收' | '报废'; // 不良处置（不良录入专用）
  // 注意：根据要求，已移除顶层的 defectType 和 defectCode 字段
}

export interface LossWaferData extends WaferData {
  originalSublotId: string; // 原始子批次ID
  originalLotId: string; // 原始批次ID
  originalCarrierId: string; // 原始载具ID
}

// 新增：晶圆损失记录接口
export interface WaferLossRecord {
  id: string; // 唯一的损失记录ID
  waferId: string; // 晶圆ID
  originalSublotId: string; // 原始子批次ID
  originalLotId: string; // 原始批次ID
  originalCarrierId: string; // 原始载具ID
  reason: string; // 损失原因
  lossDate: string; // 损失日期
  operator: string; // 操作员
}

export interface TargetCarrier {
  id: string;
  goodQty: number; // 新增：良品数量
  defectQty: number; // 新增：不良品数量
}

// 新增包装数据结构
export interface PackagingData {
  id: string; // 唯一的包装记录ID
  packagingBarcode: string; // 包装条码
  sublotId: string; // 关联的子批次ID
  productCode: string; // 产品料号，用于匹配模板
  productName: string; // 产品名称
  totalQty: number; // 包装数量
  status: 'Pending' | 'Packaged' | 'Printed'; // 包装状态
  timestamp: string; // 包装时间戳
}

// src/types.ts (新增接口)

export interface ParameterDetail {
  id: string; // 新增：参数的唯一ID
  name: string;
  value?: any; // 可以是数字、字符串、布尔值等
  unit?: string;
  min?: number;
  max?: number;
  // 根据需要添加其他参数属性
}

export interface StationConfig {
  id: string; // 返工路径内站点的唯一ID
  stationCode: string; // 原始站点编码
  stationName: string;
  equipmentGroup?: string;
  recipe?: string;
  measurementParameters?: ParameterDetail[];
  processParameters?: ParameterDetail[];
  spcParameters?: ParameterDetail[];
  remarks?: string[]; // 备注字符串数组
  // 添加其他站点特定配置
}

export interface ReworkPath {
  id: string;
  name: string;
  description?: string;
  stations: StationConfig[];
}

export interface ReturnStation {
  code: string;
  name: string;
}

// 新增：站点数据结构
export interface StationData {
  code: string;
  name: string;
}

// 新增：Q-Time规则接口 - 更新以匹配模拟数据结构
export interface QTimeRule {
  id: string;
  sourceStation: string; // 起始站点
  targetStation: string; // 目标站点
  maxDurationHours: number; // 最大允许时长（小时）
  description?: string; // 规则描述
  isActive: boolean; // 是否启用
}

// 新增：批次Q-Time剩余信息接口 - 更新以匹配模拟数据结构
export interface BatchQTimeInfo {
  batchCode: string;
  productCode: string;
  productName: string; // 产品名称
  totalQty: number;
  qTimeRemainingHours: number; // Q-Time剩余时长（小时）
  status: string;
  currentStation: string; // 当前站点
  rules: QTimeRule[]; // 触发的Q-Time规则
  minRemainingHours: number; // 最小剩余时长（取所有规则中的最小值）
}
