import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

// 固定用三个不同的种子批次 id，避免两个测试之间互相拿到同一条被前一个测试改动过的批次
// （mockBatchService 的内存状态在同一测试文件的多个 it() 之间是共享、累积的，与
// batchHoldService.test.ts 用固定索引取批次是同一个道理）
const BATCH_A_ID = 'aba03c67-3bf4-417c-b013-43f8f4d83c8e'; // BATCHQO20O3, equipmentCode='EQ003'
const MERGE_TARGET_ID = 'ddc2e9df-3406-4b88-9edf-099a38d0c864'; // BATCHG0RXA7
const BATCH_A2_ID = '207b7612-7e5a-4b47-914a-979fd946c52a'; // BATCHHDDTFP, equipmentCode='EQ002'

describe('mockBatchService.resolveCurrentBatches', () => {
  it('follows a multi-hop split-then-merge chain back to the final batch', async () => {
    const batches = await mockBatchService.listBatches();
    const batchA = batches.find(b => b.id === BATCH_A_ID)!;
    const mergeTarget = batches.find(b => b.id === MERGE_TARGET_ID)!;

    // A 出站：产生一条设备出站履历
    await mockBatchService.confirmOutstation(batchA.id, {});
    const passEvents = await mockBatchService.listEquipmentPassEvents(batchA.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });
    const passedAt = passEvents.find(e => e.batchId === batchA.id)!.occurredAt;

    // A 拆出一部分晶圆到新批次 B
    const wafersOfA = (await mockBatchService.getBatchWafers(batchA.id, batchA.station)).filter(w => w.waferId);
    const moved = wafersOfA.slice(0, 1);
    const splitResult = await mockBatchService.confirmSplit(batchA.id, {
      targetCarriers: [{ id: 'SA0190', goodQty: 0, defectQty: 0 }],
      targetWafers: moved.map(w => ({ ...w, id: 'placeholder-0', carrierId: 'SA0190' })),
      operator: 'tester',
    });
    const batchB = splitResult.newBatchId;

    // B 整体合并进 C（mergeTarget）
    await mockBatchService.confirmMerge(batchB, { targetBatchId: mergeTarget.id, operator: 'tester' });

    const resolved = await mockBatchService.resolveCurrentBatches(batchA.equipmentCode, {
      start: new Date(new Date(passedAt).getTime() - 1000).toISOString(),
      end: new Date(new Date(passedAt).getTime() + 60_000).toISOString(),
    });
    const resolvedIds = resolved.map(b => b.id);

    // 拆出去又被合并的那片晶圆，最终应该被追踪到 mergeTarget，而不是 A 或 B
    expect(resolvedIds).toContain(mergeTarget.id);
    // A 剩余未拆出的晶圆仍在 A 里，A 也应该出现在结果里
    expect(resolvedIds).toContain(batchA.id);
  });

  it('excludes a wafer that left the origin batch before the equipment pass timestamp', async () => {
    const batches = await mockBatchService.listBatches();
    const batchA = batches.find(b => b.id === BATCH_A2_ID)!;

    // 先拆批（此时还没出站，视为"命中前已经离开"）
    const wafersOfA = (await mockBatchService.getBatchWafers(batchA.id, batchA.station)).filter(w => w.waferId);
    const preSplitResult = await mockBatchService.confirmSplit(batchA.id, {
      targetCarriers: [{ id: 'SA0200', goodQty: 0, defectQty: 0 }],
      targetWafers: wafersOfA.slice(0, 1).map(w => ({ ...w, id: 'placeholder-1', carrierId: 'SA0200' })),
      operator: 'tester',
    });
    const splitOffBatchId = preSplitResult.newBatchId;

    // 拆批之后才出站——出站事件的时刻晚于 wafer 离开 A 的时刻
    await mockBatchService.confirmOutstation(batchA.id, {});
    const passEvents = await mockBatchService.listEquipmentPassEvents(batchA.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });
    const passedAt = passEvents.find(e => e.batchId === batchA.id)!.occurredAt;

    const resolved = await mockBatchService.resolveCurrentBatches(batchA.equipmentCode, {
      start: new Date(new Date(passedAt).getTime() - 1000).toISOString(),
      end: new Date(new Date(passedAt).getTime() + 60_000).toISOString(),
    });

    // A 剩余的晶圆仍应命中 A 自己；但那片已经在出站之前就拆走的晶圆所在的新批次不应该被圈入
    // （因为它离开 A 的时间早于这次出站命中的时刻，不算"命中那一刻还在 A 里"）
    const resolvedIds = resolved.map(b => b.id);
    expect(resolvedIds).toContain(batchA.id);
    expect(resolvedIds).not.toContain(splitOffBatchId);
  });
});
