import { describe, it, expect, beforeEach } from 'vitest';
import type { BatchData } from '../../components/BatchOperations/types';
import { batchHoldService, __resetBatchHoldServiceForTests } from './batchHoldService';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';

describe('batchHoldService', () => {
  beforeEach(() => {
    __resetBatchHoldServiceForTests();
  });

  it('holdBatches creates a holding record and sets BatchData.isHold to true', async () => {
    const batches = await batchApiService.listBatches();
    const targetId = batches[0].id;

    const created = await batchHoldService.holdBatches(
      [targetId],
      { category: 'SPC异常', text: '测试扣留', source: 'manual', notifiedProcessEngineer: '张伟', notifiedQualityEngineer: '李娜' },
      'tester'
    );

    expect(created).toHaveLength(1);
    expect(created[0].status).toBe('holding');
    expect(created[0].batchId).toBe(targetId);
    expect(created[0].batchCode).toBe(batches[0].batchCode);
    expect(created[0].notifiedProcessEngineer).toBe('张伟');
    expect(created[0].notifiedQualityEngineer).toBe('李娜');

    const updated = (await batchApiService.listBatches()).find((b: BatchData) => b.id === targetId);
    expect(updated?.isHold).toBe(true);
  });

  it('releaseBatches marks the active record released and clears BatchData.isHold', async () => {
    const batches = await batchApiService.listBatches();
    const targetId = batches[1].id;
    await batchHoldService.holdBatches([targetId], { category: '其他', text: '测试', source: 'manual' }, 'tester');

    const released = await batchHoldService.releaseBatches([targetId], '会议决议：风险已排除', 'reviewer');

    expect(released).toHaveLength(1);
    expect(released[0].status).toBe('released');
    expect(released[0].releaseApprovalComment).toBe('会议决议：风险已排除');
    expect(released[0].releaseBy).toBe('reviewer');

    const updated = (await batchApiService.listBatches()).find((b: BatchData) => b.id === targetId);
    expect(updated?.isHold).toBe(false);
  });

  it('releaseBatches on a batch with no active hold records is a no-op', async () => {
    const batches = await batchApiService.listBatches();
    const targetId = batches[3].id;

    const released = await batchHoldService.releaseBatches([targetId], '无意义', 'tester');

    expect(released).toHaveLength(0);
  });

  it('listActiveHoldRecords only returns records with status holding', async () => {
    const batches = await batchApiService.listBatches();
    const [a, b] = batches;
    await batchHoldService.holdBatches([a.id], { category: '其他', text: 'A', source: 'manual' }, 'tester');
    await batchHoldService.holdBatches([b.id], { category: '其他', text: 'B', source: 'manual' }, 'tester');
    await batchHoldService.releaseBatches([a.id], '解除', 'tester');

    const active = await batchHoldService.listActiveHoldRecords();
    expect(active.map(r => r.batchId)).toEqual([b.id]);
  });
});
