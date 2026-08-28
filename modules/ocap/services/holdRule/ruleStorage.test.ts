import { describe, it, expect, beforeEach } from 'vitest';

// vitest 的 environment: 'node' 没有全局 localStorage（已用 `node -e "localStorage"` 验证会抛
// ReferenceError），这里挂一个最小的内存版 polyfill，只服务这一个测试文件，不改 vitest.config.ts。
class MemoryLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}
(globalThis as any).localStorage = new MemoryLocalStorage();

import { ruleStorage } from './ruleStorage';
import { AutoHoldRule } from './types';

const makeRule = (overrides: Partial<AutoHoldRule> = {}): AutoHoldRule => ({
  id: 'rule-1',
  name: '测试规则',
  equipmentId: 'EQ001',
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

describe('ruleStorage', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
  });

  it('getRules returns an empty array when nothing is stored', () => {
    expect(ruleStorage.getRules()).toEqual([]);
  });

  it('addRule persists a rule that getRules can read back', () => {
    ruleStorage.addRule(makeRule());
    expect(ruleStorage.getRules()).toHaveLength(1);
    expect(ruleStorage.getRuleById('rule-1')?.name).toBe('测试规则');
  });

  it('updateRule merges partial updates', () => {
    ruleStorage.addRule(makeRule());
    ruleStorage.updateRule('rule-1', { enabled: false });
    expect(ruleStorage.getRuleById('rule-1')?.enabled).toBe(false);
  });

  it('deleteRule removes the rule', () => {
    ruleStorage.addRule(makeRule());
    ruleStorage.deleteRule('rule-1');
    expect(ruleStorage.getRules()).toEqual([]);
  });
});
