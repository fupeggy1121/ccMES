import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmCutIntoSubpath', () => {
  it('writes batch-level rework markers without touching wafer lineage', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches.find(b => !b.isHold && !b.reworkPathId)!;
    const waferSnapshotBefore = await mockBatchService.getBatchWafers(target.id, target.station);

    const result = await mockBatchService.confirmCutIntoSubpath(target.id, {
      reworkPathId: 'REWORK_CMP',
      reworkFirstStationCode: 'CMP_P',
      reworkFirstStationName: 'CMP处理',
      returnStationCode: 'RETURN_01',
      operator: 'tester',
    });
    expect(result.success).toBe(true);

    const after = (await mockBatchService.listBatches()).find(b => b.id === target.id)!;
    expect(after.reworkPathId).toBe('REWORK_CMP');
    expect(after.reworkReturnStationCode).toBe('RETURN_01');
    expect(after.nextStationCode).toBe('CMP_P');
    expect(after.nextStationName).toBe('CMP处理');

    // 回归测试点：返工不产生任何 LineageEvent，不触碰 wafer 数组
    const waferSnapshotAfter = await mockBatchService.getBatchWafers(target.id, target.station);
    expect(waferSnapshotAfter).toEqual(waferSnapshotBefore);
    waferSnapshotAfter.forEach(w => {
      expect(w.lineageEvents ?? []).toHaveLength(0);
    });
  });

  it('rejects cutting into a subpath when the batch is already in one', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches.find(b => !b.isHold && !b.reworkPathId)!;
    await mockBatchService.confirmCutIntoSubpath(target.id, {
      reworkPathId: 'REWORK_ETCH',
      reworkFirstStationCode: 'ETCH_R',
      reworkFirstStationName: '重新刻蚀',
      returnStationCode: 'RETURN_02',
      operator: 'tester',
    });

    await expect(
      mockBatchService.confirmCutIntoSubpath(target.id, {
        reworkPathId: 'REWORK_CMP',
        reworkFirstStationCode: 'CMP_P',
        reworkFirstStationName: 'CMP处理',
        returnStationCode: 'RETURN_01',
        operator: 'tester',
      })
    ).rejects.toThrow('已处于');
  });
});
