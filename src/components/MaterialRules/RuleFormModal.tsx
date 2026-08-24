import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info } from 'lucide-react';
import { MaterialSelectionRule } from '../../types';

interface RuleFormModalProps {
  isOpen: boolean;
  rule: MaterialSelectionRule | null;
  onClose: () => void;
  onSave: (rule: Omit<MaterialSelectionRule, 'id'>) => Promise<void>;
}

const RULE_TYPE_LABELS: Record<string, string> = {
  range: '范围匹配',
  comparison: '比较运算',
  enum_match: '枚举匹配',
  custom_expression: '自定义表达式',
};

const RULE_TYPE_HINTS: Record<string, string> = {
  range: '属性值必须在指定的最小值和最大值之间（包含端点）',
  comparison: '属性值与指定值进行数值比较（>、<、>=、<=、==、!=）',
  enum_match: '属性值必须是指定列表中的某个值',
  custom_expression: '通过表达式计算期望值并与属性值比较',
};

export const RuleFormModal: React.FC<RuleFormModalProps> = ({ isOpen, rule, onClose, onSave }) => {
  const [form, setForm] = useState<Omit<MaterialSelectionRule, 'id'>>({
    ruleName: '',
    processStationCode: '',
    materialCategory: '',
    targetMaterialAttribute: '',
    ruleType: 'range',
    ruleDefinition: {},
    drivingProductAttribute: '',
    drivingLogicExpression: '',
    isActive: true,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rule) {
      setForm({
        ruleName: rule.ruleName,
        processStationCode: rule.processStationCode,
        materialCategory: rule.materialCategory,
        targetMaterialAttribute: rule.targetMaterialAttribute,
        ruleType: rule.ruleType,
        ruleDefinition: rule.ruleDefinition,
        drivingProductAttribute: rule.drivingProductAttribute || '',
        drivingLogicExpression: rule.drivingLogicExpression || '',
        isActive: rule.isActive,
        notes: rule.notes || '',
      });
    } else {
      setForm({
        ruleName: '',
        processStationCode: '',
        materialCategory: '',
        targetMaterialAttribute: '',
        ruleType: 'range',
        ruleDefinition: {},
        drivingProductAttribute: '',
        drivingLogicExpression: '',
        isActive: true,
        notes: '',
      });
    }
    setErrors({});
  }, [rule, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.ruleName.trim()) errs.ruleName = '请输入规则名称';
    if (!form.processStationCode.trim()) errs.processStationCode = '请输入工艺站点编码';
    if (!form.materialCategory.trim()) errs.materialCategory = '请输入物料类别';
    if (!form.targetMaterialAttribute.trim()) errs.targetMaterialAttribute = '请输入目标物料属性';

    if (form.ruleType === 'range') {
      const hasDriving = form.drivingProductAttribute?.trim() && form.drivingLogicExpression?.trim();
      if (!hasDriving) {
        const min = form.ruleDefinition?.min;
        const max = form.ruleDefinition?.max;
        if (min === undefined || min === '') errs.min = '请输入最小值';
        if (max === undefined || max === '') errs.max = '请输入最大值';
        if (min !== undefined && max !== undefined && Number(min) > Number(max)) errs.max = '最大值必须大于等于最小值';
      }
    }
    if (form.ruleType === 'comparison') {
      if (!form.ruleDefinition?.operator) errs.operator = '请选择比较运算符';
      if (form.ruleDefinition?.value === undefined || form.ruleDefinition?.value === '') errs.compValue = '请输入比较值';
    }
    if (form.ruleType === 'enum_match') {
      const vals = form.ruleDefinition?.allowedValues;
      if (!vals || !Array.isArray(vals) || vals.length === 0) errs.allowedValues = '请输入至少一个允许值';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const toSave: Omit<MaterialSelectionRule, 'id'> = {
        ...form,
        drivingProductAttribute: form.drivingProductAttribute?.trim() || undefined,
        drivingLogicExpression: form.drivingLogicExpression?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };
      await onSave(toSave);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const updateDefinition = (key: string, value: any) => {
    setForm(prev => ({ ...prev, ruleDefinition: { ...prev.ruleDefinition, [key]: value } }));
  };

  const handleAllowedValuesChange = (raw: string) => {
    const vals = raw.split(',').map(s => s.trim()).filter(Boolean);
    updateDefinition('allowedValues', vals);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {rule ? '编辑选料规则' : '新建选料规则'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">规则名称 <span className="text-red-500">*</span></label>
              <input
                value={form.ruleName}
                onChange={e => setForm(p => ({ ...p, ruleName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.ruleName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="例：导轮槽距匹配"
              />
              {errors.ruleName && <p className="text-red-500 text-xs mt-1">{errors.ruleName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工艺站点编码 <span className="text-red-500">*</span></label>
              <input
                value={form.processStationCode}
                onChange={e => setForm(p => ({ ...p, processStationCode: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.processStationCode ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="例：MOCVD生长"
              />
              {errors.processStationCode && <p className="text-red-500 text-xs mt-1">{errors.processStationCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">物料类别 <span className="text-red-500">*</span></label>
              <input
                value={form.materialCategory}
                onChange={e => setForm(p => ({ ...p, materialCategory: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.materialCategory ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="例：导轮"
              />
              {errors.materialCategory && <p className="text-red-500 text-xs mt-1">{errors.materialCategory}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标物料属性 <span className="text-red-500">*</span></label>
              <input
                value={form.targetMaterialAttribute}
                onChange={e => setForm(p => ({ ...p, targetMaterialAttribute: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.targetMaterialAttribute ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="例：groovePitch"
              />
              {errors.targetMaterialAttribute && <p className="text-red-500 text-xs mt-1">{errors.targetMaterialAttribute}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">规则类型 <span className="text-red-500">*</span></label>
              <select
                value={form.ruleType}
                onChange={e => {
                  setForm(p => ({ ...p, ruleType: e.target.value as MaterialSelectionRule['ruleType'], ruleDefinition: {} }));
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">{RULE_TYPE_HINTS[form.ruleType]}</p>
          </div>

          {form.ruleType === 'range' && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">产品属性驱动（可选）</h4>
                <p className="text-xs text-gray-500">若填写，范围将根据产品属性动态计算；否则使用下方固定范围。</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">驱动产品属性</label>
                    <input
                      value={form.drivingProductAttribute || ''}
                      onChange={e => setForm(p => ({ ...p, drivingProductAttribute: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例：slicingThicknessTarget"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">驱动逻辑表达式</label>
                    <input
                      value={form.drivingLogicExpression || ''}
                      onChange={e => setForm(p => ({ ...p, drivingLogicExpression: e.target.value }))}
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
                    value={form.ruleDefinition?.min ?? ''}
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
                    value={form.ruleDefinition?.max ?? ''}
                    onChange={e => updateDefinition('max', e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.max ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="100"
                  />
                  {errors.max && <p className="text-red-500 text-xs mt-1">{errors.max}</p>}
                </div>
              </div>
            </div>
          )}

          {form.ruleType === 'comparison' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">比较运算符 <span className="text-red-500">*</span></label>
                <select
                  value={form.ruleDefinition?.operator || ''}
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
                  value={form.ruleDefinition?.value ?? ''}
                  onChange={e => updateDefinition('value', e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.compValue ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="0"
                />
                {errors.compValue && <p className="text-red-500 text-xs mt-1">{errors.compValue}</p>}
              </div>
            </div>
          )}

          {form.ruleType === 'enum_match' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">允许的值（逗号分隔）<span className="text-red-500">*</span></label>
              <input
                value={(form.ruleDefinition?.allowedValues || []).join(', ')}
                onChange={e => handleAllowedValuesChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.allowedValues ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="例：陶瓷, 金属, 复合材料"
              />
              {errors.allowedValues && <p className="text-red-500 text-xs mt-1">{errors.allowedValues}</p>}
              {(form.ruleDefinition?.allowedValues || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(form.ruleDefinition.allowedValues as string[]).map((v: string) => (
                    <span key={v} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{v}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.ruleType === 'custom_expression' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">驱动产品属性</label>
                <input
                  value={form.drivingProductAttribute || ''}
                  onChange={e => setForm(p => ({ ...p, drivingProductAttribute: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：slicingThicknessTarget"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">计算表达式</label>
                <input
                  value={form.drivingLogicExpression || ''}
                  onChange={e => setForm(p => ({ ...p, drivingLogicExpression: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="product.x * 0.5"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="规则说明..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-700">{form.isActive ? '规则已启用' : '规则已禁用'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存规则'}
          </button>
        </div>
      </div>
    </div>
  );
};
