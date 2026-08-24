import React from 'react';
import { Info } from 'lucide-react';
import { MaterialSelectionRule } from '../../types';

interface RuleDefinitionFormProps {
  ruleType: 'range' | 'comparison' | 'enum_match' | 'custom_expression';
  ruleDefinition: any;
  drivingProductAttribute?: string;
  drivingLogicExpression?: string;
  onRuleDefinitionChange: (field: string, value: any) => void;
  onProductAttributeChange: (value: string) => void;
  onLogicExpressionChange: (value: string) => void;
  errors?: Record<string, string>;
}

const RULE_TYPE_HINTS: Record<string, string> = {
  range: '属性值必须在指定的最小值和最大值之间（包含端点）',
  comparison: '属性值与指定值进行数值比较（>、<、>=、<=、==、!=）',
  enum_match: '属性值必须是指定列表中的某个值',
  custom_expression: '通过表达式计算期望值并与属性值比较',
};

export const RuleDefinitionForm: React.FC<RuleDefinitionFormProps> = ({
  ruleType,
  ruleDefinition,
  drivingProductAttribute = '',
  drivingLogicExpression = '',
  onRuleDefinitionChange,
  onProductAttributeChange,
  onLogicExpressionChange,
  errors = {},
}) => {
  const updateDefinition = (field: string, value: any) => {
    onRuleDefinitionChange('ruleDefinition', {
      ...ruleDefinition,
      [field]: value,
    });
  };

  const handleAllowedValuesChange = (input: string) => {
    const values = input.split(',').map(v => v.trim()).filter(v => v.length > 0);
    updateDefinition('allowedValues', values);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">{RULE_TYPE_HINTS[ruleType]}</p>
      </div>

      {ruleType === 'range' && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700">产品属性驱动（可选）</h4>
            <p className="text-xs text-gray-500">若填写，范围将根据产品属性动态计算；否则使用下方固定范围。</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">驱动产品属性</label>
                <input
                  value={drivingProductAttribute}
                  onChange={e => onProductAttributeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：slicingThicknessTarget"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">驱动逻辑表达式</label>
                <input
                  value={drivingLogicExpression}
                  onChange={e => onLogicExpressionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="{ min: product.x * 0.4, max: product.x * 0.6 }"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">固定最小值</label>
              <input
                type="number"
                value={ruleDefinition?.min ?? ''}
                onChange={e => updateDefinition('min', e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.min ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="0"
              />
              {errors.min && <p className="text-red-500 text-xs mt-1">{errors.min}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">固定最大值</label>
              <input
                type="number"
                value={ruleDefinition?.max ?? ''}
                onChange={e => updateDefinition('max', e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.max ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="100"
              />
              {errors.max && <p className="text-red-500 text-xs mt-1">{errors.max}</p>}
            </div>
          </div>
        </div>
      )}

      {ruleType === 'comparison' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">比较运算符 <span className="text-red-500">*</span></label>
            <select
              value={ruleDefinition?.operator || ''}
              onChange={e => updateDefinition('operator', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.operator ? 'border-red-300' : 'border-gray-300'}`}
            >
              <option value="">请选择</option>
              <option value=">">&gt; 大于</option>
              <option value="<">&lt; 小于</option>
              <option value=">=">&gt;= 大于等于</option>
              <option value="<=">&lt;= 小于等于</option>
              <option value="==">== 等于</option>
              <option value="!=">!= 不等于</option>
            </select>
            {errors.operator && <p className="text-red-500 text-xs mt-1">{errors.operator}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">比较值 <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={ruleDefinition?.value ?? ''}
              onChange={e => updateDefinition('value', e.target.value === '' ? '' : Number(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.compValue ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="0"
            />
            {errors.compValue && <p className="text-red-500 text-xs mt-1">{errors.compValue}</p>}
          </div>
        </div>
      )}

      {ruleType === 'enum_match' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">允许的值（逗号分隔）<span className="text-red-500">*</span></label>
          <input
            value={(ruleDefinition?.allowedValues || []).join(', ')}
            onChange={e => handleAllowedValuesChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.allowedValues ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="例：陶瓷, 金属, 复合材料"
          />
          {errors.allowedValues && <p className="text-red-500 text-xs mt-1">{errors.allowedValues}</p>}
          {(ruleDefinition?.allowedValues || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(ruleDefinition.allowedValues as string[]).map((v: string) => (
                <span key={v} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{v}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {ruleType === 'custom_expression' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">驱动产品属性</label>
            <input
              value={drivingProductAttribute}
              onChange={e => onProductAttributeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例：slicingThicknessTarget"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">计算表达式</label>
            <input
              value={drivingLogicExpression}
              onChange={e => onLogicExpressionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="product.x * 0.5"
            />
          </div>
        </div>
      )}
    </div>
  );
};
