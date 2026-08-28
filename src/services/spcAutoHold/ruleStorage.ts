import { AutoHoldRule } from './types';

const STORAGE_KEY = 'spc_auto_hold_rules';

export const ruleStorage = {
  getRules(): AutoHoldRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载SPC自动Hold规则失败:', error);
      return [];
    }
  },

  saveRules(rules: AutoHoldRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('保存SPC自动Hold规则失败:', error);
      throw new Error('保存失败，可能是存储空间不足');
    }
  },

  addRule(rule: AutoHoldRule): void {
    const rules = this.getRules();
    rules.push(rule);
    this.saveRules(rules);
  },

  updateRule(id: string, updates: Partial<AutoHoldRule>): void {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === id);
    if (index !== -1) {
      rules[index] = { ...rules[index], ...updates };
      this.saveRules(rules);
    }
  },

  deleteRule(id: string): void {
    const rules = this.getRules();
    this.saveRules(rules.filter(r => r.id !== id));
  },

  getRuleById(id: string): AutoHoldRule | null {
    return this.getRules().find(r => r.id === id) || null;
  },
};
