import { describe, it, expect, beforeEach } from 'vitest';

class MemoryLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}
(globalThis as any).localStorage = new MemoryLocalStorage();

import { spcAutoHoldService } from './spcAutoHoldService';
import { ruleStorage } from '../../../modules/ocap/services/holdRule/ruleStorage';
import { AutoHoldRule, SpcAbnormalEvent } from '../../../modules/ocap/services/holdRule/types';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';
import { BatchData } from '../../components/BatchOperations/types';
import { __resetBatchHoldServiceForTests, batchHoldService } from '../batchHold/batchHoldService';
import { workOrderService } from '../../../modules/ocap/services/workOrderService';
import { DEMO_AUTO_HOLD_EQUIPMENT } from '../../components/BatchOperations/data/mockEquipmentPassEvents';
import { finishedGoodsBatchList } from '../../components/BatchOperations/data/finishedGoodsBatches';

const makeRule = (overrides: Partial<AutoHoldRule> = {}): AutoHoldRule => ({
  id: `rule-${Math.random()}`,
  name: '测试规则',
  equipmentId: 'EQ_SPC_TEST',
  monitorType: 'metal-ion',
  timeWindowMode: 'fixed',
  fixedWindowHours: 8,
  responsibleProcessEngineer: '张伟',
  responsibleQualityEngineer: '李娜',
  enabled: true,
  createdAt: new Date().toISOString(),
  createdBy: 'tester',
  ...overrides,
});

describe('spcAutoHoldService.handleSpcAbnormalEvent', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    __resetBatchHoldServiceForTests();
  });

  it('holds matched batches and creates a work order when resolveCurrentBatches returns batches', async () => {
    const batches: BatchData[] = await batchApiService.listBatches();
    // seed 数据里有若干批次的 equipmentCode 是空串（例如"包装"站的批次），不能按下标硬取
    const target = batches.find(b => !!b.equipmentCode)!;
    expect(target).toBeTruthy();
    // 用批次真实的 equipmentCode 出站一次，制造一个会命中 resolveCurrentBatches 的场景
    // （不伪造 equipmentCode——confirmOutstation 写入 EquipmentPassEvent 时读的是 _batches
    //  里的真实存量数据，改一份局部拷贝的字段不会影响它）
    await batchApiService.confirmOutstation(target.id, {});

    const rule = makeRule({ equipmentId: target.equipmentCode });
    ruleStorage.addRule(rule);

    const event: SpcAbnormalEvent = {
      equipmentId: target.equipmentCode,
      occurredAt: new Date().toISOString(),
      parameterName: '金属离子浓度',
      monitorType: 'metal-ion',
      judgeResult: 'OOC',
    };

    const records = await spcAutoHoldService.handleSpcAbnormalEvent(event);
    const recordForRule = records.find(r => r.ruleId === rule.id)!;
    expect(recordForRule).toBeTruthy();
    // target 刚出站，一定会被 resolveCurrentBatches 命中（它自己就是 origin batch，wafer 仍在其中）
    expect(recordForRule.result).toBe('holdApplied');
    expect(recordForRule.matchedBatchIds).toContain(target.id);
    expect(recordForRule.workOrderId).toBeTruthy();
    const activeHolds = await batchHoldService.listActiveHoldRecords();
    expect(activeHolds.some(h => h.batchId === target.id)).toBe(true);
  });

  it('skips a rule requiring back-to-last-pass when the event has no lastPassedAt, without failing other rules', async () => {
    const backToLastPassRule = makeRule({ timeWindowMode: 'back-to-last-pass' });
    const fixedRule = makeRule({ timeWindowMode: 'fixed', fixedWindowHours: 1 });
    ruleStorage.addRule(backToLastPassRule);
    ruleStorage.addRule(fixedRule);

    const event: SpcAbnormalEvent = {
      equipmentId: 'EQ_SPC_TEST',
      occurredAt: new Date().toISOString(),
      parameterName: '金属离子浓度',
      monitorType: 'metal-ion',
      judgeResult: 'OOC',
      // 故意不带 lastPassedAt
    };

    const records = await spcAutoHoldService.handleSpcAbnormalEvent(event);
    const backToLastPassRecord = records.find(r => r.ruleId === backToLastPassRule.id)!;
    const fixedRecord = records.find(r => r.ruleId === fixedRule.id)!;

    expect(backToLastPassRecord.result).toBe('missingLastPassedAt');
    expect(['holdApplied', 'noBatchesMatched']).toContain(fixedRecord.result);
  });

  it('does not match a rule for a different equipmentId or monitorType', async () => {
    const rule = makeRule({ equipmentId: 'EQ_OTHER', monitorType: 'particle' });
    ruleStorage.addRule(rule);

    const event: SpcAbnormalEvent = {
      equipmentId: 'EQ_SPC_TEST',
      occurredAt: new Date().toISOString(),
      parameterName: 'x',
      monitorType: 'metal-ion',
      judgeResult: 'OOS',
    };

    const records = await spcAutoHoldService.handleSpcAbnormalEvent(event);
    expect(records.find(r => r.ruleId === rule.id)).toBeUndefined();
  });

  it('holds only in-process batches and registers finished-goods batches as display-only', async () => {
    // 出站履历种子数据里 EQ002 的窗口内既有在制批次也有已入库成品批次
    const rule = makeRule({ equipmentId: DEMO_AUTO_HOLD_EQUIPMENT, monitorType: 'flatness' });
    ruleStorage.addRule(rule);

    const records = await spcAutoHoldService.handleSpcAbnormalEvent({
      equipmentId: DEMO_AUTO_HOLD_EQUIPMENT,
      occurredAt: new Date().toISOString(),
      parameterName: '平坦度TTV',
      monitorType: 'flatness',
      judgeResult: 'OOC',
    });

    const record = records.find(r => r.ruleId === rule.id)!;
    expect(record.result).toBe('holdApplied');
    expect(record.heldBatchIds!.length).toBeGreaterThan(0);

    // 三个成品库批次都应该被圈进来，但都不执行扣留
    const fgIds = finishedGoodsBatchList.map(b => b.id);
    expect(record.stockedOnlyBatchIds).toEqual(expect.arrayContaining(fgIds));
    expect(record.matchedBatchIds.length).toBe(
      record.heldBatchIds!.length + record.stockedOnlyBatchIds!.length
    );

    const activeHolds = await batchHoldService.listActiveHoldRecords();
    fgIds.forEach(id => expect(activeHolds.some(h => h.batchId === id)).toBe(false));
  });

  it('puts the matched batch list on the generated work order as a batchHold stage', async () => {
    const rule = makeRule({ equipmentId: DEMO_AUTO_HOLD_EQUIPMENT, monitorType: 'flatness' });
    ruleStorage.addRule(rule);

    const records = await spcAutoHoldService.handleSpcAbnormalEvent({
      equipmentId: DEMO_AUTO_HOLD_EQUIPMENT,
      occurredAt: new Date().toISOString(),
      parameterName: '平坦度TTV',
      monitorType: 'flatness',
      judgeResult: 'OOC',
    });
    const record = records.find(r => r.ruleId === rule.id)!;

    const workOrder = workOrderService.listWorkOrders().find(w => w.id === record.workOrderId)!;
    expect(workOrder).toBeTruthy();
    const stage = workOrder.stages.find(st => st.actionType === 'batchHold')!;
    expect(stage).toBeTruthy();
    // 工单详情页按 slice(0, currentStage + 1) 显示节点，批次扣留节点必须落在可见范围内
    expect(workOrder.currentStage).toBe(workOrder.stages.length - 1);

    const snapshots = stage.batchHoldExecution!.batches;
    expect(snapshots.length).toBe(record.matchedBatchIds.length);
    expect(snapshots.filter(b => b.holdResult === 'held').length).toBe(record.heldBatchIds!.length);
    const stocked = snapshots.filter(b => b.holdResult === 'stockedOnly');
    expect(stocked.length).toBe(record.stockedOnlyBatchIds!.length);
    // 已入库批次展示的是库位/入库时间，不是站点
    stocked.forEach(b => {
      expect(b.warehouseLocation).toBeTruthy();
      expect(b.inboundAt).toBeTruthy();
      expect(b.stationName).toBeUndefined();
    });
    expect(stage.batchHoldExecution!.ruleName).toBe(rule.name);
  });

  it('listExecutionRecords accumulates records across calls', async () => {
    const before = spcAutoHoldService.listExecutionRecords().length;
    ruleStorage.addRule(makeRule());
    await spcAutoHoldService.handleSpcAbnormalEvent({
      equipmentId: 'EQ_SPC_TEST',
      occurredAt: new Date().toISOString(),
      parameterName: 'x',
      monitorType: 'metal-ion',
      judgeResult: 'OOS',
    });
    expect(spcAutoHoldService.listExecutionRecords().length).toBeGreaterThan(before);
  });
});
