import { useMemo } from 'react';
import { MaterialSelectionRule, BOMTemplateItem, ProductProcessSpec } from '../types';

interface RuleEvaluationResult {
  matchedMaterials: BOMTemplateItem[];
  ruleName: string;
  applicableAttribute: string;
  evaluationDetails: string;
}

export const useRulesForSelection = (
  rules: MaterialSelectionRule[],
  availableMaterials: BOMTemplateItem[],
  productProcessSpec: ProductProcessSpec | null,
  selectedRuleId?: string
): RuleEvaluationResult | null => {
  return useMemo(() => {
    if (!selectedRuleId || !productProcessSpec) {
      return null;
    }

    const selectedRule = rules.find(r => r.id === selectedRuleId);
    if (!selectedRule) {
      return null;
    }

    const matchedMaterials = evaluateRule(
      selectedRule,
      availableMaterials,
      productProcessSpec
    );

    if (matchedMaterials.length === 0) {
      return null;
    }

    return {
      matchedMaterials,
      ruleName: selectedRule.ruleName,
      applicableAttribute: selectedRule.targetMaterialAttribute,
      evaluationDetails: generateEvaluationDetails(
        selectedRule,
        productProcessSpec,
        matchedMaterials.length
      ),
    };
  }, [rules, availableMaterials, productProcessSpec, selectedRuleId]);
};

function evaluateRule(
  rule: MaterialSelectionRule,
  materials: BOMTemplateItem[],
  productSpec: ProductProcessSpec
): BOMTemplateItem[] {
  return materials.filter(material => {
    const targetAttrValue = getAttributeValue(
      material,
      rule.targetMaterialAttribute
    );

    if (targetAttrValue === null) {
      return false;
    }

    switch (rule.ruleType) {
      case 'range':
        return evaluateRangeRule(
          targetAttrValue,
          rule.ruleDefinition,
          productSpec,
          rule.drivingLogicExpression
        );

      case 'comparison':
        return evaluateComparisonRule(
          targetAttrValue,
          rule.ruleDefinition,
          productSpec,
          rule.drivingLogicExpression
        );

      case 'enum_match':
        return evaluateEnumRule(
          targetAttrValue,
          rule.ruleDefinition
        );

      case 'custom_expression':
        return evaluateCustomExpression(
          material,
          rule.ruleDefinition,
          productSpec,
          rule.drivingLogicExpression
        );

      default:
        return false;
    }
  });
}

function getAttributeValue(material: BOMTemplateItem, attributeKey: string): any {
  if (!material.attributes) {
    return null;
  }

  const attr = material.attributes.find(a => a.key === attributeKey);
  return attr ? attr.value : null;
}

function evaluateRangeRule(
  materialValue: any,
  ruleDefinition: any,
  productSpec: ProductProcessSpec,
  drivingLogicExpression?: string
): boolean {
  if (typeof materialValue !== 'number') {
    return false;
  }

  let targetValue = ruleDefinition.targetValue;

  if (drivingLogicExpression && ruleDefinition.useDrivingLogic) {
    targetValue = deriveDrivingValue(
      productSpec,
      ruleDefinition.drivingProductAttribute,
      drivingLogicExpression
    );
  }

  const { min = -Infinity, max = Infinity } = ruleDefinition;
  return materialValue >= min && materialValue <= max;
}

function evaluateComparisonRule(
  materialValue: any,
  ruleDefinition: any,
  productSpec: ProductProcessSpec,
  drivingLogicExpression?: string
): boolean {
  const { operator, threshold } = ruleDefinition;

  let compareValue = threshold;
  if (drivingLogicExpression && ruleDefinition.useDrivingLogic) {
    compareValue = deriveDrivingValue(
      productSpec,
      ruleDefinition.drivingProductAttribute,
      drivingLogicExpression
    );
  }

  switch (operator) {
    case 'eq':
      return materialValue === compareValue;
    case 'neq':
      return materialValue !== compareValue;
    case 'gt':
      return materialValue > compareValue;
    case 'gte':
      return materialValue >= compareValue;
    case 'lt':
      return materialValue < compareValue;
    case 'lte':
      return materialValue <= compareValue;
    default:
      return false;
  }
}

function evaluateEnumRule(
  materialValue: any,
  ruleDefinition: any
): boolean {
  const { allowedValues = [] } = ruleDefinition;
  return allowedValues.includes(materialValue);
}

function evaluateCustomExpression(
  material: BOMTemplateItem,
  ruleDefinition: any,
  productSpec: ProductProcessSpec,
  drivingLogicExpression?: string
): boolean {
  try {
    const expression = ruleDefinition.expression;
    const context = {
      material,
      productSpec,
      Math,
    };

    const func = new Function(
      'material',
      'productSpec',
      'Math',
      `return ${expression}`
    );
    return func(material, productSpec, Math) === true;
  } catch (error) {
    console.error('Custom expression evaluation error:', error);
    return false;
  }
}

function deriveDrivingValue(
  productSpec: ProductProcessSpec,
  drivingProductAttribute: string | undefined,
  expression: string
): number {
  if (!drivingProductAttribute) {
    return 0;
  }

  const productValue = (productSpec as any)[drivingProductAttribute];
  if (typeof productValue !== 'number') {
    return 0;
  }

  try {
    const func = new Function('product', `return ${expression}`);
    return func(productValue);
  } catch (error) {
    console.error('Driving value derivation error:', error);
    return 0;
  }
}

function generateEvaluationDetails(
  rule: MaterialSelectionRule,
  productSpec: ProductProcessSpec,
  matchCount: number
): string {
  return `根据规则 "${rule.ruleName}" 评估，匹配 ${matchCount} 个物料。产品属性 ${rule.drivingProductAttribute} = ${(productSpec as any)[rule.drivingProductAttribute]}`;
}
