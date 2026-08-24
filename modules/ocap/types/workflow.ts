import { Node as RFNode, Edge as RFEdge, XYPosition } from 'reactflow';

export interface WorkflowNodeData {
  type: 'start' | 'condition' | 'action' | 'end';
  title: string;
  description?: string;
  config?: {
    // 新增起始站点和结束站点配置
    startStation?: string;
    endStation?: string;
    
    // 条件节点的新配置结构
    dataSources?: Array<{
      name: string;
      parameters: string[];
    }>;
    conditionExpressions?: Array<{
      expression: string;
      resultLabel: string;
    }>;
    branchMappings?: Array<{
      result: string;
      targetNodeId: string;
    }>;
    
    // 原有其他类型节点的配置保持不变
    actionType?: 'remeasure' | 'batchHold' | 'equipmentDisable' | 'notifyPersonnel' | 'equipmentCalibration' | 'approval' | 'equipmentRelease' | 'batchRelease'; // 新增：设备释放和批次释放
    parameters?: Record<string, any>;
    approvers?: string[];
    timeout?: number;
    testPath?: string;
    holdRule?: string;
    holdRuleConfig?: string; // 新增：扣留规则配置
    disableReason?: string;

    // 流程结束开关
    isProcessEnd?: boolean;

    // 复测相关配置
    retestObject?: 'anomaly_sample' | 'custom';
    sampleSelectionRule?: 'all_batch_samples' | 'same_batch_samples' | 'specific_sample_id';
    remeasurementPath?: 'anomaly_source_station_same_equipment';
    measurementParameter?: 'anomaly_parameter' | 'anomaly_parameter_group';

    // 表单模版关联配置
    formTemplateId?: string;
    formTemplateName?: string;

    // 设备扣留原因配置（新版）
    disableReasonType?: string;
    disableReasonDetail?: string;

    // 量测设备校准配置
    calibrationType?: 'automated' | 'manual';
    equipmentList?: string[];
    calibrationSchedule?: string;
    calibrationStandards?: string;
    responsiblePersonnel?: string[];
    calibratedEquipmentSource?: 'current_anomaly_equipment' | 'manual_selection'; // 新增：校准设备选择模式

    // 增强的通知配置
    notificationMethods?: Array<'email' | 'systemMessage' | 'oa' | 'sms' | 'webhook'>;
    emailConfig?: {
      recipients: string[];
      recipientGroups?: string[];
      cc?: string[];
      ccGroups?: string[];
      subject: string;
      bodyTemplate: string;
      attachments?: string[];
    };
    systemMessageConfig?: {
      recipientIds: string[];
      priority: 'low' | 'medium' | 'high' | 'urgent';
      messageTemplate: string;
    };
    oaConfig?: {
      workflowType: string;
      approvalChain: string[];
      endpoint: string;
      payloadTemplate: string;
    };
    smsConfig?: {
      phoneNumbers: string[];
      messageTemplate: string;
    };
    webhookConfig?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT';
      headers?: Record<string, string>;
      payloadTemplate: string;
    };
    notificationTiming?: 'immediate' | 'scheduled';
    scheduledTime?: string;
    retryAttempts?: number;
    escalationRules?: {
      enabled: boolean;
      timeoutMinutes: number;
      escalateTo: string[];
    };
    
    // 新增：标准工时配置
    standardWorkingHours?: number; // 新增：标准工时（单位：小时）
    sendOvertimeAlert?: boolean; // 新增：是否发送超工时告警
    
    // 新增：设备释放和批次释放配置字段
    releaseEquipmentId?: string; // 新增：设备释放目标ID
    equipmentReleaseReason?: string; // 新增：设备释放原因
    releaseBatchId?: string; // 新增：批次释放目标ID
    batchReleaseReason?: string; // 新增：批次释放原因
  };
}

export interface WorkflowConnection {
  targetNodeId: string;
  sourceHandleId?: string; // 源节点上的锚点ID (例如 'bottom-source', 'right-source')
  targetHandleId?: string; // 目标节点上的锚点ID (例如 'top-target', 'left-target')
}

// 保留 WorkflowNode 类型用于向后兼容，但推荐使用 RFNode<WorkflowNodeData>
export interface WorkflowNode {
  id: string;
  type: 'start' | 'condition' | 'action' | 'end';
  title: string;
  description?: string;
  position: { x: number; y: number };
  connections?: WorkflowConnection[]; // 修改此行
  config?: WorkflowNodeData['config'];
}

export interface NodeType {
  type: string;
  title: string;
  icon: any;
  color: string;
  description: string;
}

// 工作流模板类型
export interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'temperature' | 'acid_etching' | 'pressure' | 'quality' | 'equipment' | 'custom';
  description: string;
  version: string; // 已添加 version 属性
  status: 'active' | 'draft' | 'archived' | 'pending_review';
  nodeCount: number;
  // nodes: RFNode<WorkflowNodeData>[];
  // edges: RFEdge[];
  metadata: {
    lastModified: string; // 确保包含 lastModified
    createdBy: string; // 确保包含 createdBy
    department?: string;
    tags?: string[];
    [key: string]: any;
  };
  isSystemTemplate: boolean; // 是否为系统预定义模板
}

// 模板分类显示配置
export interface TemplateCategoryConfig {
  category: WorkflowTemplate['category'];
  label: string;
  color: string;
  icon: string;
  description: string;
}执行各种自动化操作