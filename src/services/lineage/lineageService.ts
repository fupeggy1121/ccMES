import { BatchData } from '../../components/BatchOperations/types';
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
};
