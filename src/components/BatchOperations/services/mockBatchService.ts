/**
 * mockBatchService.ts
 *
 * 完全使用本地 mock 数据，不发起任何网络请求。
 * 接口与 batchApiService.ts 保持一致，可直接替换使用。
 *
 * 如需切换回真实 API，只需在 batchApiService.ts 中
 * 将最后一行 export 改回 batchApiService 即可。
 */

import { BatchData, SubBatchData, WaferData, WaferLossRecord, PackagingRecord, EquipmentPassEvent, TargetCarrier } from '../types';
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
// 包装出货条码记录（按主批次 id 分组）
const _packagingRecords: Record<string, PackagingRecord[]> = {};
// 新增：设备出站履历——只追加不覆盖，与 BatchData.lastOutstationAt（单值覆盖）不是一回事
let _equipmentPassEvents: EquipmentPassEvent[] = [];

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


  /** 新增：查询某机台在时间窗口内的出站履历 */
  listEquipmentPassEvents: async (
    equipmentCode: string,
    timeWindow: { start: string; end: string }
  ): Promise<EquipmentPassEvent[]> => {
    await delay();
    const startMs = new Date(timeWindow.start).getTime();
    const endMs = new Date(timeWindow.end).getTime();
    return _equipmentPassEvents.filter(e => {
      if (e.equipmentCode !== equipmentCode) return false;
      const t = new Date(e.occurredAt).getTime();
      return t >= startMs && t <= endMs;
    });
  },

  // ── 写操作 ────────────────────────────────

  /** 获取指定主批次的包装出货条码记录 */
  getPackagingRecords: async (batchId: string): Promise<PackagingRecord[]> => {
    await delay();
    return _packagingRecords[batchId] || [];
  },

  /** 生成包装出货条码记录（支持合箱），并把子批次状态置为已包装 */
  createPackagingRecord: async (
    batchId: string,
    payload: {
      sublotIds: string[];
      carrierIds: string[];
      packagingBarcode: string;
      operator: string;
      remark?: string;
    }
  ): Promise<{ success: boolean; record: PackagingRecord }> => {
    await delay();
    const subs = _subBatches[batchId] || [];
    const totalQty = subs
      .filter(s => payload.sublotIds.includes(s.sublotId))
      .reduce((sum, s) => sum + s.totalQty, 0);

    const record: PackagingRecord = {
      id: `pkg-${Date.now()}`,
      packagingBarcode: payload.packagingBarcode,
      sublotIds: payload.sublotIds,
      carrierIds: payload.carrierIds,
      totalQty,
      operator: payload.operator,
      packagingTime: new Date().toISOString(),
      remark: payload.remark,
      printStatus: '未打印',
      printCount: 0,
      reprints: [],
    };

    if (!_packagingRecords[batchId]) _packagingRecords[batchId] = [];
    _packagingRecords[batchId].push(record);

    _subBatches[batchId] = subs.map(s =>
      payload.sublotIds.includes(s.sublotId)
        ? { ...s, packagingBarcode: record.packagingBarcode, packagingStatus: '已包装' as const, packagingTime: record.packagingTime }
        : s
    );

    _addHistory(batchId, `包装：生成出货条码 ${record.packagingBarcode}`);
    return { success: true, record };
  },

  /** 打印出货条码标签（mock） */
  printPackagingRecord: async (batchId: string, recordId: string): Promise<{ success: boolean }> => {
    await delay();
    const records = _packagingRecords[batchId] || [];
    const idx = records.findIndex(r => r.id === recordId);
    if (idx === -1) return { success: false };

    const updatedRecord: PackagingRecord = {
      ...records[idx],
      printStatus: '已打印',
      printCount: records[idx].printCount + 1,
    };
    _packagingRecords[batchId] = records.map((r, i) => (i === idx ? updatedRecord : r));

    _subBatches[batchId] = (_subBatches[batchId] || []).map(s =>
      updatedRecord.sublotIds.includes(s.sublotId)
        ? { ...s, printStatus: '已打印' as const, printCount: (s.printCount || 0) + 1 }
        : s
    );

    _addHistory(batchId, `打印出货条码 ${updatedRecord.packagingBarcode}`);
    return { success: true };
  },

  /** 重打出货条码标签（需填重打原因） */
  reprintPackagingRecord: async (
    batchId: string,
    recordId: string,
    reason: string,
    operator: string
  ): Promise<{ success: boolean }> => {
    await delay();
    const records = _packagingRecords[batchId] || [];
    const idx = records.findIndex(r => r.id === recordId);
    if (idx === -1) return { success: false };

    const updatedRecord: PackagingRecord = {
      ...records[idx],
      printCount: records[idx].printCount + 1,
      reprints: [
        ...records[idx].reprints,
        {
          id: `reprint-${Date.now()}`,
          reason,
          operator,
          time: new Date().toISOString(),
        },
      ],
    };
    _packagingRecords[batchId] = records.map((r, i) => (i === idx ? updatedRecord : r));

    _subBatches[batchId] = (_subBatches[batchId] || []).map(s =>
      updatedRecord.sublotIds.includes(s.sublotId)
        ? { ...s, printCount: (s.printCount || 0) + 1 }
        : s
    );

    _addHistory(batchId, `重打出货条码 ${updatedRecord.packagingBarcode}（原因：${reason}）`);
    return { success: true };
  },

  /** 出站确认 */
  confirmOutstation: async (batchId: string, _payload: any) => {
    await delay();
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx !== -1) {
      const batch = _batches[idx];
      _batches[idx] = { ...batch, status: '已出站', lastOutstationAt: new Date().toISOString() };
      // 新增：追加设备出站履历，只增不改，供 resolveCurrentBatches 回溯窗口查询使用
      _equipmentPassEvents.push({
        batchId: batch.id,
        batchCode: batch.batchCode,
        equipmentCode: batch.equipmentCode,
        station: batch.station,
        occurredAt: new Date().toISOString(),
      });
    }
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

  /**
   * 拆批确认：真实把选中的晶圆从源批次移出，按目标片篮分组落到一个新建的暂存批次。
   * 注意：targetWafers 里的 .id 是 WaferBasketReorganizationModule 生成的目标槽位占位 id，
   * 不是真实晶圆的 id，必须用 waferId 反查 _wafers[] 里的真实记录再移动。
   */
  confirmSplit: async (
    batchId: string,
    payload: { targetCarriers: TargetCarrier[]; targetWafers: WaferData[]; operator: string }
  ): Promise<{ success: boolean; newBatchId: string }> => {
    await delay();
    const sourceIdx = _batches.findIndex(b => b.id === batchId);
    if (sourceIdx === -1) throw new Error(`批次 ${batchId} 不存在`);
    const sourceBatch = _batches[sourceIdx];
    if (sourceBatch.isHold) throw new Error('批次已锁定，无法拆批');

    const sourceSubs = _subBatches[batchId] || [];
    const waferByWaferId = new Map<string, { wafer: WaferData; subBatchId: string }>();
    sourceSubs.forEach(sub => {
      (_wafers[sub.id] || []).forEach(w => {
        if (w.waferId) waferByWaferId.set(w.waferId, { wafer: w, subBatchId: sub.id });
      });
    });

    const occurredAt = new Date().toISOString();
    const carrierGroups = payload.targetCarriers
      .map(carrier => {
        const occupiedSlots = payload.targetWafers.filter(w => w.carrierId === carrier.id && w.waferId);
        const realWafers = occupiedSlots
          .map(slot => waferByWaferId.get(slot.waferId))
          .filter((entry): entry is { wafer: WaferData; subBatchId: string } => Boolean(entry));
        return { carrier, realWafers };
      })
      .filter(group => group.realWafers.length > 0);

    if (carrierGroups.length === 0) {
      throw new Error('未选中任何晶圆，无法拆批');
    }

    const movedWaferIds = new Set(carrierGroups.flatMap(g => g.realWafers.map(e => e.wafer.id)));
    const newBatchId = `batch-${Date.now()}`;
    const newBatchCode = `${sourceBatch.batchCode}-SPLIT-${Date.now()}`;

    const isGood = (w: WaferData) => w.type === 'GOOD' || w.type === 'GoodSample';
    const totalQty = carrierGroups.reduce((sum, g) => sum + g.realWafers.length, 0);
    const goodQty = carrierGroups.reduce((sum, g) => sum + g.realWafers.filter(e => isGood(e.wafer)).length, 0);

    const newBatch: BatchData = {
      ...sourceBatch,
      id: newBatchId,
      batchCode: newBatchCode,
      status: '暂存',
      totalQty,
      goodQty,
      defectQty: totalQty - goodQty,
      isHold: false,
      mergedIntoBatchId: undefined,
      reworkPathId: undefined,
      reworkReturnStationCode: undefined,
    };
    _batches.push(newBatch);
    _subBatches[newBatchId] = [];

    carrierGroups.forEach((group, i) => {
      const newSubBatchId = `${newBatchId}-sub-${i}`;
      const groupGoodQty = group.realWafers.filter(e => isGood(e.wafer)).length;
      _subBatches[newBatchId].push({
        id: newSubBatchId,
        sublotId: `${newBatchCode}-SUB-${String(i + 1).padStart(2, '0')}`,
        carrierId: group.carrier.id,
        totalQty: group.realWafers.length,
        goodQty: groupGoodQty,
        defectQty: group.realWafers.length - groupGoodQty,
        status: '暂存',
        station: sourceBatch.station,
        stationName: sourceBatch.stationName,
        equipment: sourceBatch.equipmentCode,
      });
      _wafers[newSubBatchId] = group.realWafers.map(e => ({
        ...e.wafer,
        carrierId: group.carrier.id,
        lineageEvents: [
          ...(e.wafer.lineageEvents || []),
          { eventType: 'split' as const, fromBatchId: batchId, toBatchId: newBatchId, occurredAt, operatedBy: payload.operator },
        ],
      }));
    });

    // 源批次：从各自原子批次里剔除已搬走的 wafer，剩余数量重新汇总（不做手工加减）
    _subBatches[batchId] = sourceSubs.map(sub => {
      const remaining = (_wafers[sub.id] || []).filter(w => !movedWaferIds.has(w.id));
      _wafers[sub.id] = remaining;
      const remainingGood = remaining.filter(isGood).length;
      return { ...sub, totalQty: remaining.length, goodQty: remainingGood, defectQty: remaining.length - remainingGood };
    });
    const sourceRemainingTotal = _subBatches[batchId].reduce((sum, s) => sum + s.totalQty, 0);
    const sourceRemainingGood = _subBatches[batchId].reduce((sum, s) => sum + s.goodQty, 0);
    _batches[sourceIdx] = {
      ...sourceBatch,
      totalQty: sourceRemainingTotal,
      goodQty: sourceRemainingGood,
      defectQty: sourceRemainingTotal - sourceRemainingGood,
    };

    _addHistory(batchId, `拆批：${totalQty}片移出至暂存批次${newBatchCode}`);
    _addHistory(newBatchId, `拆批产生（来源批次${sourceBatch.batchCode}）`);

    return { success: true, newBatchId };
  },

  /** 并批确认：把源批次的全部子批次与晶圆整体挪到目标批次名下，源批次保留记录标记为已合批 */
  confirmMerge: async (
    sourceBatchId: string,
    payload: { targetBatchId: string; operator: string }
  ): Promise<{ success: boolean }> => {
    await delay();
    const sourceIdx = _batches.findIndex(b => b.id === sourceBatchId);
    const targetIdx = _batches.findIndex(b => b.id === payload.targetBatchId);
    if (sourceIdx === -1) throw new Error(`源批次 ${sourceBatchId} 不存在`);
    if (targetIdx === -1) throw new Error(`目标批次 ${payload.targetBatchId} 不存在`);
    const sourceBatch = _batches[sourceIdx];
    const targetBatch = _batches[targetIdx];
    if (sourceBatch.id === targetBatch.id) throw new Error('不能合并到批次自身');
    if (sourceBatch.isHold) throw new Error('源批次已锁定，无法并批');
    if (targetBatch.isHold) throw new Error('目标批次已锁定，无法接收并批');
    if (sourceBatch.status === '已合批') throw new Error('源批次已经合批，无法重复操作');
    if (targetBatch.status === '已合批') throw new Error('目标批次已合批，不能作为并批目标');

    const occurredAt = new Date().toISOString();
    const sourceSubs = _subBatches[sourceBatchId] || [];

    // 子批次 sublotId 保留原名不改写，归属只看 _subBatches 的 key，与现有模型一致
    _subBatches[payload.targetBatchId] = [...(_subBatches[payload.targetBatchId] || []), ...sourceSubs];
    sourceSubs.forEach(sub => {
      _wafers[sub.id] = (_wafers[sub.id] || []).map(w => ({
        ...w,
        lineageEvents: [
          ...(w.lineageEvents || []),
          { eventType: 'merge' as const, fromBatchId: sourceBatchId, toBatchId: payload.targetBatchId, occurredAt, operatedBy: payload.operator },
        ],
      }));
    });
    _subBatches[sourceBatchId] = [];

    const targetSubsAfter = _subBatches[payload.targetBatchId];
    const targetTotal = targetSubsAfter.reduce((sum, s) => sum + s.totalQty, 0);
    const targetGood = targetSubsAfter.reduce((sum, s) => sum + s.goodQty, 0);
    _batches[targetIdx] = { ...targetBatch, totalQty: targetTotal, goodQty: targetGood, defectQty: targetTotal - targetGood };
    _batches[sourceIdx] = {
      ...sourceBatch,
      status: '已合批',
      mergedIntoBatchId: payload.targetBatchId,
      totalQty: 0,
      goodQty: 0,
      defectQty: 0,
    };

    _addHistory(sourceBatchId, `并批：已合并至批次 ${targetBatch.batchCode}`);
    _addHistory(payload.targetBatchId, `并批：接收批次 ${sourceBatch.batchCode} 的全部子批次`);

    return { success: true };
  },
  /**
   * 切入返工子路径：批次ID不变，只做真实的状态/路由写入，不产生 LineageEvent、不触碰 wafer 数组
   * （返工不改变批次归属，对血缘正向追踪没有查询价值）
   */
  confirmCutIntoSubpath: async (
    batchId: string,
    payload: {
      reworkPathId: string;
      reworkFirstStationCode: string;
      reworkFirstStationName: string;
      returnStationCode: string;
      operator: string;
    }
  ): Promise<{ success: boolean }> => {
    await delay();
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx === -1) throw new Error(`批次 ${batchId} 不存在`);
    const batch = _batches[idx];
    if (batch.reworkPathId) throw new Error('批次已处于返工路径中，无法重复切入');

    _batches[idx] = {
      ...batch,
      reworkPathId: payload.reworkPathId,
      reworkReturnStationCode: payload.returnStationCode,
      nextStationCode: payload.reworkFirstStationCode,
      nextStationName: payload.reworkFirstStationName,
    };

    _addHistory(batchId, `切入返工子路径：${payload.reworkPathId}（回流站点：${payload.returnStationCode}）`);
    return { success: true };
  },


  /** 批量扣留（底层写操作：直接翻转 isHold，不感知 HoldRecord 结构，供上层 batchHoldService 调用） */
  holdBatches: async (batchIds: string[], reasonText: string): Promise<{ success: boolean }> => {
    await delay();
    _batches = _batches.map(b => (batchIds.includes(b.id) ? { ...b, isHold: true } : b));
    batchIds.forEach(id => _addHistory(id, `批量扣留：${reasonText}`));
    return { success: true };
  },

  /** 批量释放（底层写操作：直接翻转 isHold） */
  releaseBatches: async (batchIds: string[]): Promise<{ success: boolean }> => {
    await delay();
    _batches = _batches.map(b => (batchIds.includes(b.id) ? { ...b, isHold: false } : b));
    batchIds.forEach(id => _addHistory(id, '批量释放'));
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
