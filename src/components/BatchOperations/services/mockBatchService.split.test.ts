import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmSplit', () => {
  it('moves real wafers into a newly created staging batch and records a LineageEvent', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.totalQty > 0)!;
    const sourceWafers = await mockBatchService.getBatchWafers(source.id, source.station);
    const occupied = sourceWafers.filter(w => w.waferId);
    expect(occupied.length).toBeGreaterThan(0);

    const moved = occupied.slice(0, 2);
    const targetCarrierId = 'SA0160';
    // 模拟 WaferBasketReorganizationModule 的输出：waferId/type 原样带过去，id 被替换成目标槽位占位 id
    const targetWafers = moved.map((w, i) => ({ ...w, id: `placeholder-${i}`, carrierId: targetCarrierId }));

    const before = await mockBatchService.listBatches();
    const sourceBefore = before.find(b => b.id === source.id)!;

    const result = await mockBatchService.confirmSplit(source.id, {
      targetCarriers: [{ id: targetCarrierId, goodQty: 0, defectQty: 0 }],
      targetWafers,
      operator: 'tester',
    });

    expect(result.success).toBe(true);
    expect(result.newBatchId).toBeTruthy();

    const after = await mockBatchService.listBatches();
    const newBatch = after.find(b => b.id === result.newBatchId);
    expect(newBatch).toBeTruthy();
    expect(newBatch!.status).toBe('暂存');
    expect(newBatch!.totalQty).toBe(moved.length);

    const sourceAfter = after.find(b => b.id === source.id)!;
    expect(sourceAfter.totalQty).toBe(sourceBefore.totalQty - moved.length);

    const newBatchWafers = await mockBatchService.getBatchWafers(result.newBatchId, '');
    const movedWaferIds = new Set(moved.map(w => w.waferId));
    const relocated = newBatchWafers.filter(w => movedWaferIds.has(w.waferId));
    expect(relocated).toHaveLength(moved.length);
    relocated.forEach(w => {
      expect(w.lineageEvents?.[w.lineageEvents.length - 1]).toMatchObject({
        eventType: 'split',
        fromBatchId: source.id,
        toBatchId: result.newBatchId,
        operatedBy: 'tester',
      });
    });

    const remainingSourceWafers = await mockBatchService.getBatchWafers(source.id, source.station);
    expect(remainingSourceWafers.some(w => movedWaferIds.has(w.waferId))).toBe(false);
  });

  it('rejects a split with no real wafers assigned to any target carrier', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.totalQty > 0)!;

    await expect(
      mockBatchService.confirmSplit(source.id, {
        targetCarriers: [{ id: 'SA0170', goodQty: 0, defectQty: 0 }],
        targetWafers: [{ ...(await mockBatchService.getBatchWafers(source.id, source.station))[0], waferId: '', carrierId: 'SA0170' }],
        operator: 'tester',
      })
    ).rejects.toThrow('未选中任何晶圆');
  });

  it('rejects splitting a batch that is on hold', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.totalQty > 0)!;
    await mockBatchService.holdBatches([source.id], '测试锁定');

    await expect(
      mockBatchService.confirmSplit(source.id, {
        targetCarriers: [{ id: 'SA0180', goodQty: 0, defectQty: 0 }],
        targetWafers: [],
        operator: 'tester',
      })
    ).rejects.toThrow('已锁定');
  });
});
