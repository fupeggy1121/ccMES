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
import { ruleStorage } from './ruleStorage';
import { AutoHoldRule, SpcAbnormalEvent } from './types';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';
import { BatchData } from '../../components/BatchOperations/types';
import { __resetBatchHoldServiceForTests, batchHoldService } from '../batchHold/batchHoldService';

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
