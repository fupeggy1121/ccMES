import { describe, it, expect } from 'vitest';
import { lineageService } from './lineageService';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';

describe('lineageService.resolveCurrentBatches', () => {
  it('delegates to batchApiService.resolveCurrentBatches and returns matching batches', async () => {
    const batches = await batchApiService.listBatches();
    const target = batches[6];
    await batchApiService.confirmOutstation(target.id, {});

    const result = await lineageService.resolveCurrentBatches(target.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(result.some(b => b.id === target.id)).toBe(true);
  });
});
