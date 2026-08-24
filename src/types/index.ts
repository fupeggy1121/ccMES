// src/types/index.ts

export interface Material {
  id: string;
  lotNumber: string;
  materialType: 'large-box' | 'small-box' | 'material-box' | 'substrate'; // 新增 'substrate'
  quantity: number;
  batchId: string;
  status: 'pending' | 'assigned' | 'bound' | 'processing';
  createdAt: Date;
  updatedAt: Date;
  qrCode: string;
  boxNumber?: string; // For material-box type
  specifications: {
    width: number;
    height: number;
    thickness: number;
    grade: string;
  };
  // For material boxes - each contains 1200 wafers
  // For small boxes - each contains 100 wafers
  // For substrate - each contains 1 wafer
  waferCount?: number;
  // For tracking which small boxes are in a stacking box
  smallBoxIds?: string[];
}

export interface Carrier {
  id: string;
  carrierId: string;
  type: 'stacking-box' | 'wafer-basket' | 'platen'; // 载具模型
  capacity: number; // 200 wafers per stacking box
  currentLoad: number;
  status: 'unoccupied' | 'occupied'; // 占用状态：未占用、已占用
  cleaningStatus: 'good' | 'needs-cleaning' | 'in-cleaning'; // 清洗状态：正常、待清洗、清洗中
  currentLocation?: string; // 新增：当前位置
  createdAt: Date;
  updatedAt: Date;
  cleaningCount: number; // 新增：清洗次数
  // Track which small boxes are loaded
  loadedSmallBoxes: string[];
  carrierGroupId?: string; // 新增：关联载具组ID
}

// 更新 Binding 接口为 PreloadRecord
export interface PreloadRecord {
  id: string;
  substrateId: string; // 衬底片ID
  platenId: string; // Platen ID
  preloadTime: Date; // 装片时间
  operatorId: string;
  operatorName: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  processStep: 'not-degassed' | 'completed' | 'degassed' | 'unbound';   // 预装片流程步骤
  equipmentId: string; // 设备ID (MD/ME)
  chamberId: string; // 腔室 (L1/L2)
  rackPosition: string; // 架子位置 (X01/X02/X03/X04)
  degasTime?: Date; // 新增：除气时间
  degasOperatorId?: string; // 新增：除气操作员ID
  degasOperatorName?: string; // 新增：除气操作员姓名
  platenPositions: { // Platen 上每个位置的绑定信息
    id: number; // 位置编号 (1-9)
    substrateLotNumber: string | null; // 绑定的衬底片批次号
    substrateId: string | null; // 绑定的衬底片ID
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CarrierGroup {
  id: string;
  groupName: string;
  description: string;
  carrierCount: number;
  carrierIds: string[];
  groupType: 'production' | 'maintenance' | 'storage';
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  maintenanceCycle?: number; // 新增：保养周期
  maintenanceCycleUnit?: string; // 新增：保养周期单位 (e.g., '天', '周', '月')
}

export interface ProductionMetrics {
  totalMaterials: number;
  boundMaterials: number;
  availableCarriers: number;
  activeBindings: number; // 保持名称，但实际指代 PreloadRecord
  completedToday: number;
  efficiency: number;
}

export interface ProductionOrder {
  id: string;
  orderType: string;
  orderNumber: string;
  planName: string;
  productRefId: string; // 新增：关联 products 表的 supabase_id
  productName: string; // 新增：存储 products 表中的 product_name，对应前端的 productType
  targetQuantity: number;
  currentProgress: number;
  startProcessStationCode: string;
  endProcessStationCode: string;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'partially scheduled' | 'completed' | 'delayed';
  priority: 'high' | 'medium' | 'low';
  assignedOperator: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  bomItems?: BOMItem[];
}

export interface BOMItem {
  id: string;
  materialCode: string;
  materialName: string;
  specification: string;
  unit: string;
  requiredQuantity: number;
  stockQuantity?: number;
  supplier: string;
  unitPrice: number;
  notes?: string;
  processStationCode?: string; // 新增：关联工艺站点
  selectionMode?: 'manual' | 'rule'; // 新增：物料选择方式（手动或规则驱动）
  ruleConfig?: Omit<MaterialSelectionRule, 'id'>; // 新增：内联规则配置
  alternatives?: any[];
  attributes?: MaterialAttribute[];
}

// 新增：物料属性接口
export interface MaterialAttribute {
  key: string; // 属性键，例如 "groovePitch", "materialType", "slicingThickness"
  value: any;  // 属性值，可以是数值、字符串、布尔值等
  unit?: string; // 单位，例如 "mm", "g", "℃"
  type: 'number' | 'string' | 'boolean' | 'enum'; // 属性类型
}

// ============== 新增BOM模板项接口 ============== //
export interface BOMTemplateItem {
  id: string;
  materialCode: string;
  materialName: string;
  specification: string;
  unit: string;
  requiredQuantity: number;
  materialType: 'raw' | 'auxiliary'; // 新增：区分原料和辅料
  supplier: string;
  unitPrice: number;
  notes?: string;
  attributes?: MaterialAttribute[]; // 新增：物料的动态属性列表
  selectionMode?: 'manual' | 'rule-driven'; // 新增：物料选择方式
  ruleId?: string; // 新增：关联的规则ID
  drivingAttribute?: string; // 新增：驱动属性（从产品属性推导）
}

// ============== 新增MaterialConfig接口 ============== //
export interface MaterialConfig {
  id: string;
  auxiliaryId: string; // 辅料ID
  materialName: string; // 物料名称
  materialCode: string; // 物料代码
  auxiliaryGroup: string; // 新增：辅料组信息
  specifications?: {
    [key: string]: any; // 规格参数，可根据具体物料类型定义
  };
  supplier?: string; // 供应商
  unit?: string; // 单位
  // 其他可能的字段...
}

interface MaterialPickingRequest {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  requestDate: Date;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bomItems: BOMPickingItem[];
  totalAmount: number;
  notes?: string;
  approvedBy?: string;
  approvedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BOMPickingItem extends BOMItem {
  requestedQuantity: number;
  availableQuantity: number;
  pickingQuantity: number;
}

interface WarehouseOutboundRequest {
  id: string;
  pickingRequestId: string;
  workOrderNumber: string;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  approvedBy?: string;
  approvedDate?: Date;
  items: OutboundItem[];
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OutboundItem {
  materialCode: string;
  materialName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  actualQuantity?: number;
  batchNumber?: string;
  lotNumber?: string;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface MaterialFeedingRecord {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  lotId: string;
  feedingDate: Date;
  operator: string;
  materials: FeedingMaterial[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedingMaterial {
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  lotNumber: string;
  feedingQuantity: number;
  unit: string;
  location: string;
  waferBasketId?: string; // 新增：片篮编号
  slotNumber?: number;    // 新增：槽位编号
}

// ============== 工艺路径和站点接口 ============== //
export interface ProcessRoute {
  id: string;
  routeName: string;
  stations: ProcessStation[];
  totalEstimatedTime: number; // in minutes
}

export interface ProcessStation {
  id: string;
  stationCode: string;
  stationName: string;
  sequence: number;
  estimatedTime: number; // in minutes
  isQualityCheckPoint: boolean;
  requiredSkills: string[];
  equipment: string[];
}

interface QualityInspection {
  id: string;
  batchId: string;
  stationId: string;
  inspector: string;
  inspectionDate: Date;
  inspectionType: 'incoming' | 'in-process' | 'final';
  sampleSize: number;
  passQuantity: number;
  failQuantity: number;
  defectTypes: DefectType[];
  overallResult: 'pass' | 'fail' | 'conditional-pass';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DefectType {
  code: string;
  name: string;
  quantity: number;
  severity: 'critical' | 'major' | 'minor';
  description?: string;
}

// ============== 完善后的辅料接口 ============== //
export interface AuxiliaryMaterial {
  id: string;
  instanceUniqueCode?: string; // 新增：辅料的唯一实例码
  auxiliaryBatch?: string; // 辅料批号（修改为可选字段）
  auxiliaryGroup: string; // 辅料组 (e.g., AAA, Glue)
  auxiliaryId: string; // 辅料ID (e.g., GL002)
  auxiliaryCode: string; // 确保存在此字段
  auxiliaryName: string; // 辅料名称
  auxiliaryDescription: string; // 辅料描述
  calculationMethod: string; // 计算方式 (e.g., 3 Wafer number, 8 days number)
  initialLifetime: number; // 设定值 (初始寿命值)
  currentWaferLot: string | null; // 加工硅片批号
  subLot: string | null; // 子批号
  consumptionBefore: number | null; // 消耗前值
  consumptionAfter: number | null; // 消耗后值
  equipmentId: string | null; // 设备ID (如果已安装)
  isInstalled: boolean; // 是否安装
  specifications: { // 新增：规格参数
    [key: string]: any;
  };
  supplier: string; // 新增：供应商
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'scrapped' | 'returned'; // 新增：辅料状态
}

// ============== 寿命管控模型相关接口 ============== //
export type CalculationMethodType = 'by_time' | 'by_batch' | 'by_wafer' | 'custom';

export interface AuxiliaryLifetimeRule {
  auxiliaryId: string;
  calculationMethod: CalculationMethodType;
  ratedLifetime: number;
}

// ============== 完善后的寿命管控模型接口 ============== //
export interface LifetimeControlModel {
  id: string;
  modelName: string;
  description: string;
  equipmentIds: string[];
  materialConfigs: MaterialConfig[]; // 使用materialConfigs替代auxiliaryRules
  createdAt: Date;
  updatedAt: Date;
}

// ============== 辅料申请相关接口 ============== //

/**
 * 辅料申请单中的单个辅料项
 */
export interface AuxiliaryRequestItem {
  id: string;
  auxiliaryId: string;
  auxiliaryCode: string;
  auxiliaryName: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  unit: string;
  specifications?: {
    [key: string]: any;
  };
  notes?: string;
}

/**
 * 辅料申请单
 */
export interface AuxiliaryMaterialRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  requestDate: Date;
  targetEquipmentId?: string;
  targetEquipmentName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  items: AuxiliaryRequestItem[];
  totalAmount: number;
  notes?: string;
  approvedBy?: string;
  approvedDate?: Date;
  completedBy?: string;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface ProcessingHistoryRecord {
  id: string;
  auxiliaryId: string; // Link to the auxiliary material
  lotNumber: string; // The wafer lot processed
  processingTime: Date;
  equipmentId: string;
  operator: string;
  parameters: { [key: string]: any }; // e.g., temperature, pressure, duration
  consumptionChange: number; // How much lifetime was consumed in this batch
}

export interface AuxiliaryReturnItem {
  id: string; // 列表中项目的唯一ID (可以是 auxiliaryMaterial.id)
  auxiliaryId: string;
  auxiliaryCode: string;
  auxiliaryName: string;
  instanceUniqueCode?: string;
  auxiliaryBatch?: string;
  quantityToReturn: number;
  unit?: string; // 假设单位是 AuxiliaryMaterial 的一部分
}

export interface AuxiliaryReturnRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  requestDate: Date;
  returnType: 'regular' | 'repair'; // 常规入库 或 返修入库
  items: AuxiliaryReturnItem[];
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CleaningRecord {
  id: string;
  carrierId: string; // 载具ID (可能是主载具ID或多个ID的汇总字符串)
  carrierIds: string[]; // 新增：包含所有参与清洗的载具ID数组
  operator: string; // 清洗操作员
  equipment: string; // 清洗设备
  startTime: Date; // 清洗开始时间
  endTime?: Date; // 清洗结束时间
  status: 'in-progress' | 'completed'; // 清洗状态
  notes?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

// src/types/index.ts
// ... (existing interfaces)

export interface PickedMaterialBatch {
  id: string; // 唯一标识符，例如批次记录ID
  workOrderId: string; // 新增：关联的工单ID
  bomItemId: string; // 关联的BOM物料项ID
  materialCode: string; // 物料编码
  materialName: string; // 物料名称
  specification: string; // 规格
  unit: string; // 单位
  pickedQuantity: number; // 本批次领取的数量
  batchNumber: string; // 实际的物料批次号
  lotNumber?: string; // 实际的物料批号（如果与batchNumber不同）
  supplier: string; // 供应商
  pickedDate: Date; // 领取日期
  location?: string; // 领取时的库存位置
  inboundStatus?: 'pending' | 'completed' | 'cancelled' | 'returned' | 'transferred_out' | 'transferred_in'; // 修改：新增'transferred_out'和'transferred_in'状态
  // 可以根据需要添加更多字段，例如 expiryDate, serialNumber等
}

// ============== 新增成品批次接口 ============== //
export interface FinishedProductBatch {
  id: string;
  batchNumber: string; // 批次号
  productType: string; // 产品类型
  productName: string; // 产品名称
  packageCount: number; // 包装盒数
  productCount: number; // 产品数量
  totalWafers: number; // 总硅片数
  qualityGrade: 'A' | 'B' | 'C' | 'D'; // 质量等级
  status: 'pending_inbound' | 'inbound_verifying' | 'approved' | 'pending_outbound' | 'outbounded' | 'shipped'; // 状态
  completionTime: Date; // 完成时间
  inboundTime?: Date; // 入库时间
  outboundTime?: Date; // 出库时间
  warehouseLocation?: string; // 仓库位置
  inspectionResult: 'pass' | 'fail' | 'conditional'; // 检验结果
  inspector?: string; // 检验员
  inspectionDate?: Date; // 检验日期
  notes?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
  productionOrderId?: string; // 关联的生产工单ID
  operatorId?: string; // 操作员ID
  operatorName?: string; // 操作员姓名
  packagingTemplate?: string; // 包装模板
  storageConditions?: { // 存储条件
    temperature?: string;
    humidity?: string;
    specialRequirements?: string;
  };
}

// ============== 新增BOM模板接口 ============== //
export interface BOMTemplate {
  id: string;
  templateName: string;
  templateCode: string;
  productType: string; // Links to product_name in products table
  version: string;
  description?: string;
  status: 'active' | 'archived';
  bomItems: BOMTemplateItem[];
  totalAmount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 新增：产品工艺规范接口 (假设从产品主数据中获取)
export interface ProductProcessSpec {
  productRefId: string; // 产品ID
  processStationCode: string; // 工艺站点编码
  slicingThicknessTarget?: number; // 切片厚度目标值，作为规则输入
  // ... 其他产品工艺相关属性
}

// 新增：物料选择规则接口
export interface MaterialSelectionRule {
  id: string;
  ruleName: string;
  processStationCode: string; // 规则适用的工艺站点
  materialCategory: string; // 规则适用的物料类别 (例如 "导轮", "化学品")
  targetMaterialAttribute: string; // 规则要筛选的物料属性 (例如 "groovePitch")
  ruleType: 'range' | 'comparison' | 'enum_match' | 'custom_expression'; // 规则类型
  ruleDefinition: any; // JSONB 存储规则的具体定义
  drivingProductAttribute?: string; // 驱动规则的产品属性 (例如 "slicingThicknessTarget")
  drivingLogicExpression?: string; // 如何从产品属性推导出目标物料属性的表达式 (例如 "product.slicingThicknessTarget * 0.5")
  isActive: boolean; // 规则是否启用
  notes?: string;
}