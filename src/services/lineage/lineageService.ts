import { BatchData, FinishedGoodsBatch } from '../../components/BatchOperations/types';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';

/**
 * wafer 血缘查询服务——跨模块共享入口，重逻辑留在 BatchOperations 的 mock/real API 服务内部
 * （那里才有 _wafers/_equipmentPassEvents 的访问权限），本文件只做一层薄委托。
 * ③b 的 spcAutoHoldService 应该只导入这个服务，不直接碰 batchApiService/mockBatchService 内部状态。
 */
export const lineageService = {
  resolveCurrentBatches(equipmentId: string, timeWindow: { start: string; end: string }): Promise<BatchData[]> {
    return batchApiService.resolveCurrentBatches(equipmentId, timeWindow);
  },

  /**
   * 新增：同一个机台+时间窗口下，已经包装完成入成品库的批次。
   * 与 resolveCurrentBatches 是两拨不同的批次：前者还在制、可执行扣留，后者已离开在制流程，
   * 自动批量扣留只登记"已入库"供质量侧到成品库/出货环节处置。
   */
  resolveFinishedGoodsBatches(
    equipmentId: string,
    timeWindow: { start: string; end: string }
  ): Promise<FinishedGoodsBatch[]> {
    return batchApiService.resolveFinishedGoodsBatches(equipmentId, timeWindow);
  },
};
