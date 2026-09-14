// 规则的类型定义和存取已搬到 modules/ocap/services/holdRule/（规则配置本体属于OCAP模块，
// 要被工单建模的批次扣留节点选用）；本文件是自动触发引擎，依赖的 lineageService/batchHoldService
// 都在 src 下，所以引擎本身留在 src，只跨模块引用规则数据——跟下面对 workOrderService 的引用是同一种模式。
import { AutoHoldExecutionRecord, AutoHoldRule, SpcAbnormalEvent } from '../../../modules/ocap/services/holdRule/types';
import { ruleStorage } from '../../../modules/ocap/services/holdRule/ruleStorage';
import { lineageService } from '../lineage/lineageService';
import { batchHoldService } from '../batchHold/batchHoldService';
import { workOrderService } from '../../../modules/ocap/services/workOrderService';
import { BatchHoldExecution, HeldBatchSnapshot, WorkOrderStage } from '../../../modules/ocap/types/workOrder';
import { BatchData, FinishedGoodsBatch } from '../../components/BatchOperations/types';

let _executionRecords: AutoHoldExecutionRecord[] = [];
let _seq = 0;
const nextRecordId = () => `spc-exec-${Date.now()}-${_seq++}`;

function computeTimeWindow(
  rule: { timeWindowMode: 'fixed' | 'back-to-last-pass'; fixedWindowHours?: number },
  event: SpcAbnormalEvent
): { start: string; end: string } | null {
  if (rule.timeWindowMode === 'fixed') {
    const hours = rule.fixedWindowHours ?? 8;
    const end = new Date(event.occurredAt);
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (!event.lastPassedAt) return null;
  return { start: event.lastPassedAt, end: event.occurredAt };
}

/** 在制批次 → 节点展示用快照：这拨批次真正执行了扣留 */
function toHeldSnapshot(batch: BatchData, holdAt: string): HeldBatchSnapshot {
  return {
    batchId: batch.id,
    batchCode: batch.batchCode,
    productCode: batch.productCode,
    productName: batch.productName,
    quantity: batch.totalQty,
    ingotId: batch.ingotId,
    holdResult: 'held',
    stationName: batch.stationName || batch.station,
    equipmentName: batch.equipmentName || batch.equipmentCode,
    lastOutstationAt: batch.lastOutstationAt,
    holdAt,
  };
}

/** 成品库批次 → 节点展示用快照：已离开在制流程，只登记"已入库"，不执行扣留 */
function toStockedSnapshot(batch: FinishedGoodsBatch): HeldBatchSnapshot {
  return {
    batchId: batch.id,
    batchCode: batch.batchCode,
    productCode: batch.productCode,
    productName: batch.productName,
    quantity: batch.totalQty,
    ingotId: batch.ingotId,
    holdResult: 'stockedOnly',
    warehouseLocation: batch.warehouseLocation,
    inboundAt: batch.inboundAt,
    packagingBarcode: batch.packagingBarcode,
  };
}

/** 把这次扣留的批次清单包成工单的"批次扣留"节点，让工单详情页能直接展示扣留了哪些批次 */
function buildBatchHoldStage(
  rule: AutoHoldRule,
  event: SpcAbnormalEvent,
  timeWindow: { start: string; end: string },
  batches: HeldBatchSnapshot[],
  executedAt: string
): WorkOrderStage {
  const heldCount = batches.filter(b => b.holdResult === 'held').length;
  const stockedCount = batches.length - heldCount;
  const execution: BatchHoldExecution = {
    ruleId: rule.id,
    ruleName: rule.name,
    triggeredByEquipment: event.equipmentId,
    monitorType: event.monitorType,
    timeWindow,
    notifiedProcessEngineer: rule.responsibleProcessEngineer,
    notifiedQualityEngineer: rule.responsibleQualityEngineer,
    batches,
  };

  return {
    id: 'auto-hold-batch-hold',
    name: '批次扣留',
    description: `按扣留规则「${rule.name}」圈定时间窗口内流经机台${event.equipmentId}的批次并执行扣留`,
    type: 'action',
    actionType: 'batchHold',
    role: '系统',
    status: 'completed',
    completedAt: executedAt,
    assignee: 'SPC自动触发系统',
    analysis: `${event.parameterName} 判异结果 ${event.judgeResult}，规则命中 ${batches.length} 个批次`,
    actions: `在制批次 ${heldCount} 个已执行扣留；已包装入成品库批次 ${stockedCount} 个仅登记已入库，待质量侧在成品库/出货环节处置`,
    config: {
      actionType: 'batchHold',
      holdRuleConfig: rule.id,
      holdRemarks: `SPC自动Hold规则「${rule.name}」触发（机台${event.equipmentId}，${event.judgeResult}）`,
    },
    batchHoldExecution: execution,
  };
}

export const spcAutoHoldService = {
  async handleSpcAbnormalEvent(event: SpcAbnormalEvent): Promise<AutoHoldExecutionRecord[]> {
    if (!event.equipmentId) throw new Error('SpcAbnormalEvent.equipmentId 不能为空');
    if (event.judgeResult !== 'OOC' && event.judgeResult !== 'OOS') {
      throw new Error(`未知的 judgeResult: ${event.judgeResult}`);
    }

    const candidateRules = ruleStorage
      .getRules()
      .filter(r => r.enabled && r.equipmentId === event.equipmentId && r.monitorType === event.monitorType);

    const records: AutoHoldExecutionRecord[] = [];

    for (const rule of candidateRules) {
      const timeWindow = computeTimeWindow(rule, event);
      if (!timeWindow) {
        const record: AutoHoldExecutionRecord = {
          id: nextRecordId(),
          ruleId: rule.id,
          event,
          matchedBatchIds: [],
          executedAt: new Date().toISOString(),
          result: 'missingLastPassedAt',
        };
        _executionRecords.push(record);
        records.push(record);
        continue;
      }

      let matchedBatches = await lineageService.resolveCurrentBatches(event.equipmentId, timeWindow);
      if (rule.productCode) matchedBatches = matchedBatches.filter(b => b.productCode === rule.productCode);
      if (rule.station) matchedBatches = matchedBatches.filter(b => b.station === rule.station);

      // 同一窗口内还可能有已经包装完成入成品库的批次：它们同样流经过异常机台，属于风险范围，
      // 但已经离开在制流程，在制侧没有可扣留对象，只登记"已入库"随工单一起展示。
      // 不套用 rule.station 过滤——成品库批次没有"当前站点"，用在制站点去筛会把它们全滤掉。
      let stockedBatches = await lineageService.resolveFinishedGoodsBatches(event.equipmentId, timeWindow);
      if (rule.productCode) stockedBatches = stockedBatches.filter(b => b.productCode === rule.productCode);

      if (matchedBatches.length === 0 && stockedBatches.length === 0) {
        const record: AutoHoldExecutionRecord = {
          id: nextRecordId(),
          ruleId: rule.id,
          event,
          matchedBatchIds: [],
          heldBatchIds: [],
          stockedOnlyBatchIds: [],
          executedAt: new Date().toISOString(),
          result: 'noBatchesMatched',
        };
        _executionRecords.push(record);
        records.push(record);
        continue;
      }

      // 先预生成 workOrderId（只分配ID字符串，不落库），随 Hold 一起写入 HoldRecord；
      // 工单对象本身随后才创建——Hold 的生效不依赖工单创建是否成功，也不需要给
      // batchHoldService（阶段①②已实施）新增"事后更新 HoldRecord"的接口。
      const workOrderId = workOrderService.generateId();
      const heldBatchIds = matchedBatches.map(b => b.id);
      const stockedOnlyBatchIds = stockedBatches.map(b => b.id);
      const matchedBatchIds = [...heldBatchIds, ...stockedOnlyBatchIds];

      if (heldBatchIds.length > 0) {
        await batchHoldService.holdBatches(
          heldBatchIds,
          {
            category: 'SPC异常',
            text: `SPC自动Hold规则「${rule.name}」触发（机台${event.equipmentId}，${event.judgeResult}）`,
            source: 'ocap-auto',
            relatedRuleId: rule.id,
            relatedOcapWorkOrderId: workOrderId,
            triggeredByEquipment: event.equipmentId,
            triggeredTimeWindow: timeWindow,
            notifiedProcessEngineer: rule.responsibleProcessEngineer,
            notifiedQualityEngineer: rule.responsibleQualityEngineer,
          },
          'SPC自动触发系统'
        );
      }

      const executedAt = new Date().toISOString();
      const batchSnapshots: HeldBatchSnapshot[] = [
        ...matchedBatches.map(b => toHeldSnapshot(b, executedAt)),
        ...stockedBatches.map(toStockedSnapshot),
      ];

      let workOrderCreationFailed = false;
      try {
        workOrderService.createWorkOrder(
          {
            name: `SPC自动Hold：${rule.name}`,
            batchNumber: `${matchedBatchIds.length}个批次（在制${heldBatchIds.length}个/已入库${stockedOnlyBatchIds.length}个，详见批次扣留节点）`,
            equipment: event.equipmentId,
            productModel: matchedBatches[0]?.productCode ?? stockedBatches[0]?.productCode ?? '',
            exceptionType: 'SPC OOS/OOC',
            description: `规则「${rule.name}」命中，参数：${event.parameterName}，判异结果：${event.judgeResult}`,
            submitter: 'SPC自动触发系统',
            stages: [buildBatchHoldStage(rule, event, timeWindow, batchSnapshots, executedAt)],
          },
          workOrderId
        );
      } catch (err) {
        workOrderCreationFailed = true;
        console.error('自动Hold后生成OCAP工单失败:', err);
      }

      const record: AutoHoldExecutionRecord = {
        id: nextRecordId(),
        ruleId: rule.id,
        event,
        matchedBatchIds,
        heldBatchIds,
        stockedOnlyBatchIds,
        workOrderId,
        executedAt,
        // 圈到了批次但全在成品库时没有任何在制对象被扣留，不能报 holdApplied
        result: heldBatchIds.length > 0 ? 'holdApplied' : 'noHoldableBatches',
        ...(workOrderCreationFailed ? { workOrderCreationFailed: true } : {}),
      };
      _executionRecords.push(record);
      records.push(record);
    }

    return records;
  },

  listExecutionRecords(): AutoHoldExecutionRecord[] {
    return [..._executionRecords];
  },

  /** 仅供测试使用 */
  __resetForTests(): void {
    _executionRecords = [];
    _seq = 0;
  },
};
