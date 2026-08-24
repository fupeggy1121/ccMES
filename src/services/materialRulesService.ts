import { MaterialSelectionRule } from '../types';
import { supabase } from '../lib/supabaseClient';

const MOCK_RULES: MaterialSelectionRule[] = [
  {
    id: 'RULE-GUIDE-001',
    ruleName: '导轮槽距匹配',
    processStationCode: 'MOCVD生长',
    materialCategory: '导轮',
    targetMaterialAttribute: 'groovePitch',
    ruleType: 'range',
    ruleDefinition: { min: 0, max: 0 },
    drivingProductAttribute: 'slicingThicknessTarget',
    drivingLogicExpression: '{ min: product.slicingThicknessTarget * 0.4, max: product.slicingThicknessTarget * 0.6 }',
    isActive: true,
    notes: '根据产品切片厚度目标值动态计算导轮槽距范围',
  },
  {
    id: 'RULE-GUIDE-002',
    ruleName: '导轮材质限制',
    processStationCode: 'MOCVD生长',
    materialCategory: '导轮',
    targetMaterialAttribute: 'materialType',
    ruleType: 'enum_match',
    ruleDefinition: { allowedValues: ['陶瓷'] },
    isActive: true,
    notes: 'MOCVD生长工艺只允许使用陶瓷导轮',
  },
];

let localRules: MaterialSelectionRule[] = [...MOCK_RULES];
let useLocal = false;

async function tryDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (useLocal) return fallback;
  try {
    return await fn();
  } catch {
    useLocal = true;
    return fallback;
  }
}

export const materialRulesService = {
  async fetchRulesByProcessStationAndCategory(
    processStationCode: string,
    materialCategory: string
  ): Promise<MaterialSelectionRule[]> {
    return tryDb(async () => {
      const { data, error } = await supabase
        .from('material_selection_rules')
        .select('*')
        .eq('process_station_code', processStationCode)
        .eq('material_category', materialCategory)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []).map(mapRowToRule);
    }, localRules.filter(r => r.processStationCode === processStationCode && r.materialCategory === materialCategory && r.isActive));
  },

  async fetchAllRules(): Promise<MaterialSelectionRule[]> {
    return tryDb(async () => {
      const { data, error } = await supabase
        .from('material_selection_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRowToRule);
    }, [...localRules]);
  },

  async createRule(rule: Omit<MaterialSelectionRule, 'id'>): Promise<MaterialSelectionRule> {
    return tryDb(async () => {
      const { data, error } = await supabase
        .from('material_selection_rules')
        .insert([mapRuleToRow(rule as MaterialSelectionRule)])
        .select()
        .single();
      if (error) throw error;
      return mapRowToRule(data);
    }, (() => {
      const newRule: MaterialSelectionRule = { ...rule, id: `RULE-${Date.now()}` };
      localRules = [newRule, ...localRules];
      return newRule;
    })());
  },

  async updateRule(id: string, updates: Partial<MaterialSelectionRule>): Promise<MaterialSelectionRule> {
    return tryDb(async () => {
      const { data, error } = await supabase
        .from('material_selection_rules')
        .update(mapRuleToRow(updates as MaterialSelectionRule))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return mapRowToRule(data);
    }, (() => {
      localRules = localRules.map(r => r.id === id ? { ...r, ...updates } : r);
      return localRules.find(r => r.id === id)!;
    })());
  },

  async deleteRule(id: string): Promise<void> {
    return tryDb(async () => {
      const { error } = await supabase
        .from('material_selection_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }, (() => {
      localRules = localRules.filter(r => r.id !== id);
    })());
  },

  async toggleRuleActive(id: string, isActive: boolean): Promise<void> {
    return tryDb(async () => {
      const { error } = await supabase
        .from('material_selection_rules')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    }, (() => {
      localRules = localRules.map(r => r.id === id ? { ...r, isActive } : r);
    })());
  },
};

function mapRowToRule(row: any): MaterialSelectionRule {
  return {
    id: row.id,
    ruleName: row.rule_name,
    processStationCode: row.process_station_code,
    materialCategory: row.material_category,
    targetMaterialAttribute: row.target_material_attribute,
    ruleType: row.rule_type,
    ruleDefinition: row.rule_definition,
    drivingProductAttribute: row.driving_product_attribute,
    drivingLogicExpression: row.driving_logic_expression,
    isActive: row.is_active,
    notes: row.notes,
  };
}

function mapRuleToRow(rule: Partial<MaterialSelectionRule>): any {
  const row: any = {};
  if (rule.ruleName !== undefined) row.rule_name = rule.ruleName;
  if (rule.processStationCode !== undefined) row.process_station_code = rule.processStationCode;
  if (rule.materialCategory !== undefined) row.material_category = rule.materialCategory;
  if (rule.targetMaterialAttribute !== undefined) row.target_material_attribute = rule.targetMaterialAttribute;
  if (rule.ruleType !== undefined) row.rule_type = rule.ruleType;
  if (rule.ruleDefinition !== undefined) row.rule_definition = rule.ruleDefinition;
  if (rule.drivingProductAttribute !== undefined) row.driving_product_attribute = rule.drivingProductAttribute;
  if (rule.drivingLogicExpression !== undefined) row.driving_logic_expression = rule.drivingLogicExpression;
  if (rule.isActive !== undefined) row.is_active = rule.isActive;
  if (rule.notes !== undefined) row.notes = rule.notes;
  return row;
}
