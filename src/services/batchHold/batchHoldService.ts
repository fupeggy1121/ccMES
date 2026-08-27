import { BatchData } from '../../components/BatchOperations/types';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';
import { BatchHoldService, HoldRecord } from './types';

let _holdRecords: HoldRecord[] = [];
let _seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${_seq++}`;

async function resolveBatchMeta(batchId: string): Promise<BatchData | undefined> {
  const batches = await batchApiService.listBatches();
  return batches.find((b: BatchData) => b.id === batchId);
}

export const batchHoldService: BatchHoldService = {
  async holdBatches(batchIds, reason, operator) {
    const created: HoldRecord[] = [];
    for (const batchId of batchIds) {
      const batch = await resolveBatchMeta(batchId);
      if (!batch) continue;
      const record: HoldRecord = {
        id: nextId('hold'),
        batchId,
        batchCode: batch.batchCode,
        station: batch.station,
        quantity: batch.totalQty,
        holdSource: reason.source,
        holdReasonCategory: reason.category,
        holdReasonText: reason.text,
        relatedOcapWorkOrderId: reason.relatedOcapWorkOrderId,
        relatedRuleId: reason.relatedRuleId,
        triggeredByEquipment: reason.triggeredByEquipment,
        triggeredTimeWindow: reason.triggeredTimeWindow,
        status: 'holding',
        holdAt: new Date().toISOString(),
        holdBy: operator,
        notifiedProcessEngineer: reason.notifiedProcessEngineer,
        notifiedQualityEngineer: reason.notifiedQualityEngineer,
      };
      _holdRecords.push(record);
      created.push(record);
    }
    if (created.length > 0) {
      await batchApiService.holdBatches(created.map(r => r.batchId), reason.text);
    }
    return created;
  },

  async releaseBatches(batchIds, approvalComment, operator) {
    const releasedNow: HoldRecord[] = [];
    const batchIdsToClearFlag: string[] = [];
    const releaseAt = new Date().toISOString();

    for (const batchId of batchIds) {
      const hasActive = _holdRecords.some(r => r.batchId === batchId && r.status === 'holding');
      if (!hasActive) continue;
      batchIdsToClearFlag.push(batchId);
    }

    _holdRecords = _holdRecords.map(r => {
      if (batchIdsToClearFlag.includes(r.batchId) && r.status === 'holding') {
        const updated: HoldRecord = {
          ...r,
          status: 'released',
          releaseAt,
          releaseBy: operator,
          releaseApprovalComment: approvalComment,
        };
        releasedNow.push(updated);
        return updated;
      }
      return r;
    });

    if (batchIdsToClearFlag.length > 0) {
      await batchApiService.releaseBatches(batchIdsToClearFlag);
    }
    return releasedNow;
  },

  async listHoldRecords(batchId) {
    return _holdRecords.filter(r => r.batchId === batchId);
  },

  async listActiveHoldRecords() {
    return _holdRecords.filter(r => r.status === 'holding');
  },
};

/** 仅供测试使用：重置模块内内存状态，避免测试间互相污染 */
export function __resetBatchHoldServiceForTests() {
  _holdRecords = [];
  _seq = 0;
}
