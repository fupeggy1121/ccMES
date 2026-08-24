/**
 * mockBatchService.ts
 *
 * 完全使用本地 mock 数据，不发起任何网络请求。
 * 接口与 batchApiService.ts 保持一致，可直接替换使用。
 *
 * 如需切换回真实 API，只需在 batchApiService.ts 中
 * 将最后一行 export 改回 batchApiService 即可。
 */

import { BatchData, SubBatchData, WaferData, WaferLossRecord } from '../types';
import { batchList } from '../data/batches';
import { mockSubBatches } from '../data/mockSubBatches';
import { mockStations, mockProducts, mockLossWafers, mockWafersBySubBatch } from '../data/mockWafers';

// 简单延迟，模拟网络异步（可设为 0 去除延迟）
const delay = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms));

// 内存中可变的批次列表（支持写操作修改状态）
let _batches: BatchData[] = batchList.map(b => ({ ...b }));
// 内存中可变的子批次
let _subBatches: Record<string, SubBatchData[]> = Object.fromEntries(
  Object.entries(mockSubBatches).map(([k, v]) => [k, v.map(s => ({ ...s }))])
);
// 内存中可变的晶圆数据
let _wafers: Record<string, WaferData[]> = Object.fromEntries(
  Object.entries(mockWafersBySubBatch).map(([k, v]) => [k, v.map(w => ({ ...w }))])
);
// 批次备注
const _remarks: Record<string, string[]> = {};
// 操作历史
const _history: Record<string, any[]> = {};

export const mockBatchService = {

  // ── 查询 ──────────────────────────────────

  /** 查询批次列表 */
  listBatches: async (params: Record<string, any> = {}): Promise<BatchData[]> => {
    await delay();
    let result = [..._batches];
    if (params.status) result = result.filter(b => b.status === params.status);
    if (params.station) result = result.filter(b => b.station === params.station);
    return result;
  },

  /** 查询所有站点 */
  listStations: async () => {
    await delay();
    return mockStations;
  },

  /** 查询所有站点（别名） */
  getStations: async () => {
    await delay();
    return mockStations;
  },

  /** 查询产品列表 */
  getProducts: async () => {
    await delay();
    return mockProducts;
  },

  /** 查询损耗晶圆记录 */
  getLossWafers: async (_limit = 200): Promise<WaferLossRecord[]> => {
    await delay();
    return mockLossWafers.slice(0, _limit);
  },

  /** 查询批次详情（含子批次） */
  getBatchDetail: async (batchId: string) => {
    await delay();
    const batch = _batches.find(b => b.id === batchId);
    if (!batch) throw new Error(`批次 ${batchId} 不存在`);
    const subBatches = _subBatches[batchId] || [];
    return { batch, subBatches };
  },

  /** 查询批次晶圆数据 */
  getBatchWafers: async (batchId: string, _stationCode: string): Promise<WaferData[]> => {
    await delay();
    const subs = _subBatches[batchId] || [];
    return subs.flatMap(s => _wafers[s.id] || []);
  },

  /** 查询操作历史 */
  getBatchHistory: async (batchId: string, _limit = 50) => {
    await delay();
    return (_history[batchId] || []).slice(0, _limit);
  },

  /** 获取子批次列表 */
  getSubBatches: async (masterBatchId: string): Promise<SubBatchData[]> => {
    await delay();
    return _subBatches[masterBatchId] || [];
  },

  /** 获取聚合晶圆数据 */
  getAggregatedWaferData: async (batchId: string): Promise<WaferData[]> => {
    await delay();
    const subs = _subBatches[batchId] || [];
    return subs.flatMap(s => _wafers[s.id] || []);
  },

  /** 获取晶圆载具内容 */
  getWaferCarrierContents: async (subBatchUUIDs: string[], _batchId: string) => {
    await delay();
    return subBatchUUIDs.flatMap(id => _wafers[id] || []);
  },

  /** 获取拆批晶圆 */
  getWafersForSplit: async (subBatchCodes: string[], batchId: string) => {
    await delay();
    const subs = _subBatches[batchId] || [];
    const matched = subs.filter(s => subBatchCodes.includes(s.sublotId));
    return matched.flatMap(s => _wafers[s.id] || []);
  },

  // ── 写操作 ────────────────────────────────

  /** 出站确认 */
  confirmOutstation: async (batchId: string, _payload: any) => {
    await delay();
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx !== -1) _batches[idx] = { ..._batches[idx], status: '已出站' };
    _addHistory(batchId, '出站确认');
    return { success: true };
  },

  /** 进站确认 */
  confirmInstation: async (payload: any) => {
    await delay();
    const batchId = payload.batchId;
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx !== -1) _batches[idx] = { ..._batches[idx], status: '加工中' };
    _addHistory(batchId, '进站确认');
    return { success: true };
  },

  /** 拆批确认 */
  confirmSplit: async (payload: any) => {
    await delay();
    _addHistory(payload.batchId, '拆批');
    return { success: true };
  },

  /** 并批确认 */
  confirmMerge: async (payload: any) => {
    await delay();
    _addHistory(payload.batchId, '并批');
    return { success: true };
  },

  /** 更新晶圆打标信息 */
  updateWaferMarking: async (waferId: string, markingCode: string, markingStatus: string) => {
    await delay();
    for (const wafers of Object.values(_wafers)) {
      const wafer = wafers.find(w => w.id === waferId || w.waferId === waferId);
      if (wafer) {
        wafer.markingCode = markingCode;
        wafer.markingStatus = markingStatus as WaferData['markingStatus'];
        break;
      }
    }
    return { success: true };
  },

  /** 保存检验结果 */
  saveInspectionResults: async (resultsToUpsert: any[]) => {
    await delay();
    for (const result of resultsToUpsert) {
      for (const wafers of Object.values(_wafers)) {
        const wafer = wafers.find(w => w.id === result.waferId || w.waferId === result.waferId);
        if (wafer) {
          if (!wafer.inspectionResultsByStation) wafer.inspectionResultsByStation = {};
          wafer.inspectionResultsByStation[result.stationCode] = result;
          wafer.inspectionStatus = '已检验';
          break;
        }
      }
    }
    return { success: true };
  },

  /** 获取批次备注 */
  getBatchRemarks: async (batchId: string): Promise<string[]> => {
    await delay();
    return _remarks[batchId] || [];
  },

  /** 保存批次备注 */
  saveBatchRemarks: async (batchId: string, remarks: string[]) => {
    await delay();
    _remarks[batchId] = remarks;
    return { success: true };
  },

  /** 更新子批次 */
  updateSubBatch: async (subBatchId: string, updates: Partial<SubBatchData>) => {
    await delay();
    for (const [batchId, subs] of Object.entries(_subBatches)) {
      const idx = subs.findIndex(s => s.id === subBatchId);
      if (idx !== -1) {
        _subBatches[batchId][idx] = { ..._subBatches[batchId][idx], ...updates };
        break;
      }
    }
    return { success: true };
  },

  /** 记录操作日志 */
  logOperation: async (logData: any) => {
    await delay();
    _addHistory(logData.batchId, logData.action || '操作');
    return { success: true };
  },

  // ── Token 管理（mock 模式下为空操作） ────────

  setAuthToken: (_token: string) => {},
  clearAuthToken: () => {},
  getAuthToken: () => null as string | null,
};

function _addHistory(batchId: string, action: string) {
  if (!_history[batchId]) _history[batchId] = [];
  _history[batchId].unshift({
    id: `hist-${Date.now()}`,
    action,
    timestamp: new Date().toISOString(),
    operator: '本地Mock',
  });
}
