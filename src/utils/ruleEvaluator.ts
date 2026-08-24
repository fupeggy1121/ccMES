import { MaterialSelectionRule, BOMItem, ProductProcessSpec } from '../types';

export interface RuleEvaluationResult {
  compliant: boolean;
  violations: RuleViolation[];
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  message: string;
}

function safeEvaluateExpression(expression: string, productValue: number): any {
  const cleanExpr = expression.replace(/product\.\w+/g, String(productValue));

  const rangeMatch = cleanExpr.match(/\{\s*min:\s*([\d.+\-*/\s()]+),\s*max:\s*([\d.+\-*/\s()]+)\s*\}/);
  if (rangeMatch) {
    try {
      const min = evaluateArithmetic(rangeMatch[1].trim());
      const max = evaluateArithmetic(rangeMatch[2].trim());
      if (min !== null && max !== null) return { min, max };
    } catch {
      return null;
    }
  }

  try {
    return evaluateArithmetic(cleanExpr.trim());
  } catch {
    return null;
  }
}

function evaluateArithmetic(expr: string): number | null {
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
  try {
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export const evaluateMaterialRule = (
  material: BOMItem,
  rule: MaterialSelectionRule,
  productSpec: ProductProcessSpec | null
): { passes: boolean; violation?: RuleViolation } => {
  const targetAttribute = (material as any).attributes?.find(
    (attr: any) => attr.key === rule.targetMaterialAttribute
  );

  if (!targetAttribute) {
    return {
      passes: false,
      violation: {
        ruleId: rule.id,
        ruleName: rule.ruleName,
        message: `物料缺少属性: ${rule.targetMaterialAttribute}`,
      },
    };
  }

  let requiredValue: any = null;

  if (rule.drivingProductAttribute && rule.drivingLogicExpression && productSpec) {
    const productAttributeValue = (productSpec as any)[rule.drivingProductAttribute];
    if (productAttributeValue === undefined) {
      return {
        passes: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.ruleName,
          message: `产品缺少属性: ${rule.drivingProductAttribute}`,
        },
      };
    }
    requiredValue = safeEvaluateExpression(rule.drivingLogicExpression, productAttributeValue);
    if (requiredValue === null) {
      return {
        passes: false,
        violation: {
          ruleId: rule.id,
          ruleName: rule.ruleName,
          message: `规则表达式解析失败`,
        },
      };
    }
  }

  switch (rule.ruleType) {
    case 'range': {
      const min = rule.drivingProductAttribute ? requiredValue?.min : rule.ruleDefinition.min;
      const max = rule.drivingProductAttribute ? requiredValue?.max : rule.ruleDefinition.max;
      const val = Number(targetAttribute.value);
      const passes = targetAttribute.type === 'number' && val >= min && val <= max;
      return passes
        ? { passes: true }
        : {
            passes: false,
            violation: {
              ruleId: rule.id,
              ruleName: rule.ruleName,
              message: `${rule.targetMaterialAttribute} 值 ${val}${targetAttribute.unit || ''} 不在允许范围 [${min}, ${max}]${targetAttribute.unit || ''} 内`,
            },
          };
    }
    case 'comparison': {
      const operator = rule.ruleDefinition.operator;
      const compareValue = rule.drivingProductAttribute ? requiredValue : rule.ruleDefinition.value;
      const val = Number(targetAttribute.value);
      let passes = false;
      switch (operator) {
        case '>': passes = val > compareValue; break;
        case '<': passes = val < compareValue; break;
        case '>=': passes = val >= compareValue; break;
        case '<=': passes = val <= compareValue; break;
        case '==': passes = val == compareValue; break;
        case '!=': passes = val != compareValue; break;
      }
      return passes
        ? { passes: true }
        : {
            passes: false,
            violation: {
              ruleId: rule.id,
              ruleName: rule.ruleName,
              message: `${rule.targetMaterialAttribute} 值 ${val} 不满足条件 ${operator} ${compareValue}`,
            },
          };
    }
    case 'enum_match': {
      const allowedValues: string[] = rule.ruleDefinition.allowedValues || [];
      const passes = allowedValues.includes(String(targetAttribute.value));
      return passes
        ? { passes: true }
        : {
            passes: false,
            violation: {
              ruleId: rule.id,
              ruleName: rule.ruleName,
              message: `${rule.targetMaterialAttribute} 值 "${targetAttribute.value}" 不在允许的值列表中: [${allowedValues.join(', ')}]`,
            },
          };
    }
    case 'custom_expression': {
      const result = requiredValue;
      const passes = targetAttribute.value === result;
      return passes
        ? { passes: true }
        : {
            passes: false,
            violation: {
              ruleId: rule.id,
              ruleName: rule.ruleName,
              message: `${rule.targetMaterialAttribute} 值 "${targetAttribute.value}" 不满足自定义表达式要求`,
            },
          };
    }
    default:
      return { passes: false };
  }
};

export const evaluateMaterialCompliance = (
  material: BOMItem,
  rules: MaterialSelectionRule[],
  productSpec: ProductProcessSpec | null
): RuleEvaluationResult => {
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    const result = evaluateMaterialRule(material, rule, productSpec);
    if (!result.passes && result.violation) {
      violations.push(result.violation);
    }
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
};

export const filterMaterialsByRules = (
  materials: BOMItem[],
  rules: MaterialSelectionRule[],
  productSpec: ProductProcessSpec | null
): BOMItem[] => {
  if (rules.length === 0) return materials;

  return materials.filter(material => {
    return rules.every(rule => evaluateMaterialRule(material, rule, productSpec).passes);
  });
};
