import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';
import { DEMO_AUTO_HOLD_EQUIPMENT } from '../data/mockEquipmentPassEvents';
import { finishedGoodsBatchList } from '../data/finishedGoodsBatches';

describe('mockBatchService finished-goods batches', () => {
  it('keeps finished-goods batches out of the in-process batch list', async () => {
    const batches = await mockBatchService.listBatches();
    const fgIds = new Set(finishedGoodsBatchList.map(b => b.id));
    expect(batches.some(b => fgIds.has(b.id))).toBe(false);
  });

  it('resolveFinishedGoodsBatches returns batches that passed the equipment inside the window', async () => {
    const resolved = await mockBatchService.resolveFinishedGoodsBatches(DEMO_AUTO_HOLD_EQUIPMENT, {
      start: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    });
    expect(resolved.map(b => b.id).sort()).toEqual(finishedGoodsBatchList.map(b => b.id).sort());
    resolved.forEach(b => {
      expect(b.warehouseLocation).toBeTruthy();
      expect(b.inboundAt).toBeTruthy();
      // 过站时间必须早于包装时间，否则"先包装后过站"的时间线自相矛盾
      expect(new Date(b.packagedAt).getTime()).toBeLessThan(new Date(b.inboundAt).getTime() + 1);
    });
  });

  it('resolveFinishedGoodsBatches excludes other equipment and windows outside the pass time', async () => {
    const otherEquipment = await mockBatchService.resolveFinishedGoodsBatches('NON_EXISTENT_EQ', {
      start: new Date(0).toISOString(),
      end: new Date().toISOString(),
    });
    expect(otherEquipment).toHaveLength(0);

    const futureWindow = await mockBatchService.resolveFinishedGoodsBatches(DEMO_AUTO_HOLD_EQUIPMENT, {
      start: new Date(Date.now() + 60_000).toISOString(),
      end: new Date(Date.now() + 120_000).toISOString(),
    });
    expect(futureWindow).toHaveLength(0);
  });
});
