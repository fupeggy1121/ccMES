export type HoldReasonCategory = 'SPC异常' | '客户投诉' | '辅料问题' | '其他';

export interface HoldRecord {
  id: string;
  batchId: string;
  batchCode: string;
  station: string;
  quantity: number;
  holdSource: 'manual' | 'ocap-auto';
  holdReasonCategory: HoldReasonCategory;
  holdReasonText: string;
  relatedOcapWorkOrderId?: string;
  relatedRuleId?: string;
  triggeredByEquipment?: string;
  triggeredTimeWindow?: { start: string; end: string };
  status: 'holding' | 'released';
  holdAt: string;
  holdBy: string;
  releaseAt?: string;
  releaseBy?: string;
  releaseApprovalComment?: string;
  /** 新增："工程异常反馈"通知的责任工艺工程师（结构化记录，不触发真实发送） */
  notifiedProcessEngineer?: string;
  /** 新增：知会质量工程师（结构化记录，不触发真实发送） */
  notifiedQualityEngineer?: string;
}

export interface HoldBatchesReason {
  category: HoldReasonCategory;
  text: string;
  source: 'manual' | 'ocap-auto';
  relatedOcapWorkOrderId?: string;
  relatedRuleId?: string;
  triggeredByEquipment?: string;
  triggeredTimeWindow?: { start: string; end: string };
  notifiedProcessEngineer?: string;
  notifiedQualityEngineer?: string;
}

export interface BatchHoldService {
  holdBatches(batchIds: string[], reason: HoldBatchesReason, operator: string): Promise<HoldRecord[]>;
  releaseBatches(batchIds: string[], approvalComment: string, operator: string): Promise<HoldRecord[]>;
  listHoldRecords(batchId: string): Promise<HoldRecord[]>;
  listActiveHoldRecords(): Promise<HoldRecord[]>;
}
