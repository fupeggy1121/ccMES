// src/types/workOrder.ts
import { WorkflowNodeData } from '../types/workflow';

export interface WorkOrderStage {
  id: string;
  name: string;
  type: 'start' | 'condition' | 'action' | 'end';
  role: string;
  status: 'processing' | 'completed' | 'pending'; // Added 'pending' for completeness
  completedAt?: string;
  assignee?: string;
  analysis?: string;
  actions?: string;
  actionType?: string;
  formTemplateName?: string;
  config?: WorkflowNodeData['config'];
  description?: string; // 新增：存储原始工作流节点的描述
  /** 新增：批次扣留节点的执行快照（含在制已扣留批次 + 已入库仅登记批次） */
  batchHoldExecution?: BatchHoldExecution;
}

/** 批次扣留节点命中的单个批次快照。
 *  自动批量扣留按"机台+时间窗口"圈定风险批次时会同时圈到两类批次：
 *  - 在制批次：还在产线上，能真正执行扣留（holdResult='held'）；
 *  - 已包装完成入成品库的批次：已经离开在制流程，MES 侧不再有可扣留的在制对象，
 *    只登记"已入库"供质量侧到成品库/出货环节处置（holdResult='stockedOnly'）。
 *  快照存在阶段上而不是反查 HoldRecord，是因为"已入库仅登记"的那部分批次
 *  本就不会产生 HoldRecord，反查拿不到完整清单。 */
export interface HeldBatchSnapshot {
  batchId: string;
  batchCode: string;
  productCode: string;
  productName: string;
  quantity: number;
  ingotId?: string;
  /** 扣留结果：held=在制批次已执行扣留；stockedOnly=已入库，仅登记展示不执行扣留 */
  holdResult: 'held' | 'stockedOnly';
  /** 在制批次：命中时所在站点 */
  stationName?: string;
  /** 在制批次：命中时所在机台 */
  equipmentName?: string;
  /** 在制批次：最近一次出站时间 */
  lastOutstationAt?: string;
  /** 在制批次：扣留执行时间 */
  holdAt?: string;
  /** 已入库批次：成品库库位 */
  warehouseLocation?: string;
  /** 已入库批次：入库时间 */
  inboundAt?: string;
  /** 已入库批次：出货条码 */
  packagingBarcode?: string;
}

/** 批次扣留节点的执行快照——记录这次扣留依据哪条规则、圈定了哪些批次 */
export interface BatchHoldExecution {
  ruleId?: string;
  ruleName?: string;
  /** 触发异常的机台 */
  triggeredByEquipment?: string;
  monitorType?: string;
  /** 规则圈定批次用的时间窗口 */
  timeWindow?: { start: string; end: string };
  /** 责任工艺工程师（结构化记录，不触发真实发送） */
  notifiedProcessEngineer?: string;
  /** 知会质量工程师（结构化记录，不触发真实发送） */
  notifiedQualityEngineer?: string;
  batches: HeldBatchSnapshot[];
}

export interface WorkOrderAssignee {
  name: string;
  department: string;
  role: string;
}

export interface SPCControlLimits {
  ucl: string;
  lcl: string;
  usl: string;
  lsl: string;
}

export interface SPCParameters {
  controlParameter: string;
  specification: string;
  measuredValue: string;
  controlLimits: SPCControlLimits;
}

export interface AbnormalValue {
  value: string;
  deviation: string;
  deviationPercent: string;
}

export interface OutOfLimitRule {
  ruleName: string;
  ruleDescription: string;
  triggerCondition: string;
}

export interface WorkOrderAttachment {
  name: string;
  url: string;
  type: string;
  size: string;
}

export interface WorkOrder {
  id: string;
  name: string;
  batchNumber: string;
  equipment: string;
  productModel: string;
  exceptionType: string;
  description: string;
  parameters?: string;
  spcParameters?: SPCParameters;
  abnormalValue?: AbnormalValue;
  outOfLimitRule?: OutOfLimitRule;
  status: 'processing' | 'completed';
  submitter: string;
  createdAt: string;
  currentStage: number;
  currentAssignee: WorkOrderAssignee | null;
  stages: WorkOrderStage[];
  attachments?: WorkOrderAttachment[];
}