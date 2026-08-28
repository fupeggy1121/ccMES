// src/services/spcAutoHold/types.ts

/** 黑盒触发输入——判异算法本身不在本系统范围内，只消费一个已经判完异的事件 */
export interface SpcAbnormalEvent {
  equipmentId: string;
  occurredAt: string;
  parameterName: string;
  monitorType: string;
  judgeResult: 'OOC' | 'OOS';
  /** 上一次同机台同monitor合格的时间点。判异黑盒只在异常时触发一次，从不产生"合格"事件，
   *  "回溯到上次合格"这个时间锚点只能由触发方随事件一起带进来，本系统不反向推算。 */
  lastPassedAt?: string;
}

/** SPC自动Hold规则配置本体 */
export interface AutoHoldRule {
  id: string;
  name: string;
  equipmentId: string;
  productCode?: string;
  station?: string;
  monitorType: string;
  timeWindowMode: 'fixed' | 'back-to-last-pass';
  fixedWindowHours?: number;
  responsibleProcessEngineer: string;
  responsibleQualityEngineer: string;
  enabled: boolean;
  createdAt: string;
  createdBy: string;
}

/** 一次规则执行的记录——纯内存保存，是验证规则跑没跑对的唯一途径 */
export interface AutoHoldExecutionRecord {
  id: string;
  ruleId: string;
  event: SpcAbnormalEvent;
  matchedBatchIds: string[];
  workOrderId?: string;
  executedAt: string;
  result: 'holdApplied' | 'noBatchesMatched' | 'missingLastPassedAt';
  workOrderCreationFailed?: boolean;
}
