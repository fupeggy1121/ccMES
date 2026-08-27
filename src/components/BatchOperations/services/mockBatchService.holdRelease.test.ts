import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.holdBatches / releaseBatches', () => {
  it('holdBatches sets isHold=true on all matched batches', async () => {
    const batches = await mockBatchService.listBatches();
    const ids = [batches[0].id, batches[1].id];

    const result = await mockBatchService.holdBatches(ids, '测试原因');

    expect(result.success).toBe(true);
    const updated = await mockBatchService.listBatches();
    expect(updated.find(b => b.id === ids[0])?.isHold).toBe(true);
    expect(updated.find(b => b.id === ids[1])?.isHold).toBe(true);
  });

  it('releaseBatches sets isHold=false on all matched batches', async () => {
    const batches = await mockBatchService.listBatches();
    const id = batches[2].id;
    await mockBatchService.holdBatches([id], '测试原因');

    const result = await mockBatchService.releaseBatches([id]);

    expect(result.success).toBe(true);
    const updated = await mockBatchService.listBatches();
    expect(updated.find(b => b.id === id)?.isHold).toBe(false);
  });
});
