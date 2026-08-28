// 规则的类型定义和存取已搬到 modules/ocap/services/holdRule/（规则配置本体属于OCAP模块，
// 要被工单建模的批次扣留节点选用）；本文件是自动触发引擎，依赖的 lineageService/batchHoldService
// 都在 src 下，所以引擎本身留在 src，只跨模块引用规则数据——跟下面对 workOrderService 的引用是同一种模式。
import { AutoHoldExecutionRecord, SpcAbnormalEvent } from '../../../modules/ocap/services/holdRule/types';
import { ruleStorage } from '../../../modules/ocap/services/holdRule/ruleStorage';
import { lineageService } from '../lineage/lineageService';
import { batchHoldService } from '../batchHold/batchHoldService';
import { workOrderService } from '../../../modules/ocap/services/workOrderService';

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

      if (matchedBatches.length === 0) {
        const record: AutoHoldExecutionRecord = {
          id: nextRecordId(),
          ruleId: rule.id,
          event,
          matchedBatchIds: [],
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
      const matchedBatchIds = matchedBatches.map(b => b.id);

      await batchHoldService.holdBatches(
        matchedBatchIds,
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

      let workOrderCreationFailed = false;
      try {
        workOrderService.createWorkOrder(
          {
            name: `SPC自动Hold：${rule.name}`,
            batchNumber: `${matchedBatchIds.length}个批次（详见Hold记录）`,
            equipment: event.equipmentId,
            productModel: matchedBatches[0]?.productCode ?? '',
            exceptionType: 'SPC OOS/OOC',
            description: `规则「${rule.name}」命中，参数：${event.parameterName}，判异结果：${event.judgeResult}`,
            submitter: 'SPC自动触发系统',
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
        workOrderId,
        executedAt: new Date().toISOString(),
        result: 'holdApplied',
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
