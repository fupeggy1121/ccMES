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