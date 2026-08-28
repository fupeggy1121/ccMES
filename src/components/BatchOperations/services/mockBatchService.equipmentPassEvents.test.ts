import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService equipment pass events', () => {
  it('confirmOutstation appends an EquipmentPassEvent without overwriting earlier ones', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches[4];

    await mockBatchService.confirmOutstation(target.id, {});
    await new Promise(resolve => setTimeout(resolve, 5));
    await mockBatchService.confirmOutstation(target.id, {});

    const events = await mockBatchService.listEquipmentPassEvents(target.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });

    const forThisBatch = events.filter(e => e.batchId === target.id);
    expect(forThisBatch.length).toBe(2);
  });

  it('listEquipmentPassEvents filters by equipmentCode and time window', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches[5];
    await mockBatchService.confirmOutstation(target.id, {});

    const wrongEquipment = await mockBatchService.listEquipmentPassEvents('NON_EXISTENT_EQ', {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(wrongEquipment.filter(e => e.batchId === target.id)).toHaveLength(0);

    const wrongWindow = await mockBatchService.listEquipmentPassEvents(target.equipmentCode, {
      start: new Date(Date.now() + 60_000).toISOString(),
      end: new Date(Date.now() + 120_000).toISOString(),
    });
    expect(wrongWindow.filter(e => e.batchId === target.id)).toHaveLength(0);
  });
});
