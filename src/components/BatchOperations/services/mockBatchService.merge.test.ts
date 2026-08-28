import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmMerge', () => {
  it('moves all sub-batches/wafers to the target batch and marks the source as 已合批', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.status !== '已合批' && b.totalQty > 0)!;
    const target = batches.find(b => b.id !== source.id && !b.isHold && b.status !== '已合批')!;

    const sourceWafersBefore = await mockBatchService.getBatchWafers(source.id, source.station);
    const targetBefore = (await mockBatchService.listBatches()).find(b => b.id === target.id)!;

    const result = await mockBatchService.confirmMerge(source.id, { targetBatchId: target.id, operator: 'tester' });
    expect(result.success).toBe(true);

    const after = await mockBatchService.listBatches();
    const sourceAfter = after.find(b => b.id === source.id)!;
    const targetAfter = after.find(b => b.id === target.id)!;

    expect(sourceAfter.status).toBe('已合批');
    expect(sourceAfter.mergedIntoBatchId).toBe(target.id);
    expect(sourceAfter.totalQty).toBe(0);
    expect(targetAfter.totalQty).toBe(targetBefore.totalQty + sourceWafersBefore.filter(w => w.waferId).length);

    const targetWafersAfter = await mockBatchService.getBatchWafers(target.id, '');
    const movedWaferIds = new Set(sourceWafersBefore.filter(w => w.waferId).map(w => w.waferId));
    const relocated = targetWafersAfter.filter(w => movedWaferIds.has(w.waferId));
    expect(relocated.length).toBe(movedWaferIds.size);
    relocated.forEach(w => {
      expect(w.lineageEvents?.[w.lineageEvents.length - 1]).toMatchObject({
        eventType: 'merge',
        fromBatchId: source.id,
        toBatchId: target.id,
        operatedBy: 'tester',
      });
    });
  });

  it('rejects merging a batch into itself', async () => {
    const batches = await mockBatchService.listBatches();
    const batch = batches.find(b => !b.isHold && b.status !== '已合批')!;
    await expect(
      mockBatchService.confirmMerge(batch.id, { targetBatchId: batch.id, operator: 'tester' })
    ).rejects.toThrow('自身');
  });

  it('rejects merging when the source is on hold', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.status !== '已合批')!;
    const target = batches.find(b => b.id !== source.id && !b.isHold && b.status !== '已合批')!;
    await mockBatchService.holdBatches([source.id], '测试锁定');

    await expect(
      mockBatchService.confirmMerge(source.id, { targetBatchId: target.id, operator: 'tester' })
    ).rejects.toThrow('已锁定');
  });
});
