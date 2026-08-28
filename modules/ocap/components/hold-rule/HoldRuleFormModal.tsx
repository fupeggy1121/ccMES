// modules/ocap/components/hold-rule/HoldRuleFormModal.tsx
// 扣留规则的新建/编辑表单，从 HoldRuleManagement 页面里抽出来做成弹窗——
// 页面本身只保留规则列表，点击"创建规则"/"编辑"才弹出这个表单。
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AutoHoldRule } from '../../services/holdRule/types';

type RuleFormValues = Omit<AutoHoldRule, 'id' | 'createdAt' | 'createdBy'>;

const emptyRuleForm = (): RuleFormValues => ({
  name: '',
  equipmentId: '',
  productCode: '',
  station: '',
  monitorType: 'metal-ion',
  timeWindowMode: 'fixed',
  fixedWindowHours: 8,
  responsibleProcessEngineer: '',
  responsibleQualityEngineer: '',
  enabled: true,
});

interface HoldRuleFormModalProps {
  isOpen: boolean;
  editingRule: AutoHoldRule | null; // null = 新建模式，非空 = 编辑该条规则
  equipmentOptions: string[];
  onClose: () => void;
  onSave: (values: RuleFormValues) => void;
}

const HoldRuleFormModal: React.FC<HoldRuleFormModalProps> = ({
  isOpen, editingRule, equipmentOptions, onClose, onSave,
}) => {
  const [form, setForm] = useState<RuleFormValues>(emptyRuleForm());

  // 每次打开弹窗时，按当前是新建还是编辑重置表单内容
  useEffect(() => {
    if (!isOpen) return;
    if (editingRule) {
      setForm({
        name: editingRule.name,
        equipmentId: editingRule.equipmentId,
        productCode: editingRule.productCode ?? '',
        station: editingRule.station ?? '',
        monitorType: editingRule.monitorType,
        timeWindowMode: editingRule.timeWindowMode,
        fixedWindowHours: editingRule.fixedWindowHours,
        responsibleProcessEngineer: editingRule.responsibleProcessEngineer,
        responsibleQualityEngineer: editingRule.responsibleQualityEngineer,
        enabled: editingRule.enabled,
      });
    } else {
      setForm(emptyRuleForm());
    }
  }, [isOpen, editingRule]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!form.name || !form.equipmentId || !form.monitorType) {
      alert('请填写规则名称、机台和monitor类型');
      return;
    }
    if (form.timeWindowMode === 'fixed' && !form.fixedWindowHours) {
      alert('固定周期模式需要填写回溯小时数');
      return;
    }
    if (!form.responsibleProcessEngineer || !form.responsibleQualityEngineer) {
      alert('请填写责任工艺工程师和知会质量工程师');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{editingRule ? '编辑规则' : '创建规则'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="规则名称 *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={form.equipmentId}
            onChange={e => setForm(f => ({ ...f, equipmentId: e.target.value }))}
          >
            <option value="">选择机台 *</option>
            {equipmentOptions.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="产品料号（可选）"
            value={form.productCode}
            onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="工序/站点（可选）"
            value={form.station}
            onChange={e => setForm(f => ({ ...f, station: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="monitor类型 *（如 metal-ion）"
            value={form.monitorType}
            onChange={e => setForm(f => ({ ...f, monitorType: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={form.timeWindowMode}
            onChange={e => setForm(f => ({ ...f, timeWindowMode: e.target.value as 'fixed' | 'back-to-last-pass' }))}
          >
            <option value="fixed">固定周期回溯</option>
            <option value="back-to-last-pass">回溯到上次合格</option>
          </select>
          {form.timeWindowMode === 'fixed' && (
            <input
              type="number"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="回溯小时数 *"
              value={form.fixedWindowHours ?? ''}
              onChange={e => setForm(f => ({ ...f, fixedWindowHours: Number(e.target.value) }))}
            />
          )}
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="责任工艺工程师 *"
            value={form.responsibleProcessEngineer}
            onChange={e => setForm(f => ({ ...f, responsibleProcessEngineer: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="知会质量工程师 *"
            value={form.responsibleQualityEngineer}
            onChange={e => setForm(f => ({ ...f, responsibleQualityEngineer: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
            />
            启用该规则
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            onClick={handleSubmit}
          >
            {editingRule ? '保存修改' : '创建规则'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoldRuleFormModal;
