import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmOutstation', () => {
  it('stamps lastOutstationAt on the batch when outstation is confirmed', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches[0];

    await mockBatchService.confirmOutstation(target.id, {});

    const updated = (await mockBatchService.listBatches()).find(b => b.id === target.id);
    expect(updated?.lastOutstationAt).toBeTruthy();
    expect(new Date(updated!.lastOutstationAt as string).toString()).not.toBe('Invalid Date');
  });
});
