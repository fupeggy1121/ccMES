// modules/ocap/services/holdRule/types.ts
// 从 src/services/spcAutoHold/types.ts 搬迁而来：扣留规则的“配置”本体属于 OCAP
// 模块（要被工单建模里的批次扣留节点选用），自动触发引擎 spcAutoHoldService 仍留在
// src 下，通过跨模块 import 消费这里的类型。

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

/** 扣留规则配置本体——多数正常生产批次不需要选规则（默认扣留当前wafer所属批次），
 *  只有monitor料号跑批等窗口内多批次匹配的场景才需要在这里配置规则 */
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
  /** 规则圈定的全部批次（在制 + 已入库成品库），即"命中批次" */
  matchedBatchIds: string[];
  /** 其中真正执行了扣留的在制批次 */
  heldBatchIds?: string[];
  /** 其中已包装完成入成品库、只登记"已入库"未执行扣留的批次 */
  stockedOnlyBatchIds?: string[];
  workOrderId?: string;
  executedAt: string;
  /** noHoldableBatches：圈到了批次，但全都已经入成品库，在制侧没有可扣留对象 */
  result: 'holdApplied' | 'noBatchesMatched' | 'noHoldableBatches' | 'missingLastPassedAt';
  workOrderCreationFailed?: boolean;
}
