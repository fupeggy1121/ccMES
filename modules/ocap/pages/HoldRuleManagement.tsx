// modules/ocap/pages/HoldRuleManagement.tsx
// 从 src/components/SpcAutoHoldRules/SpcAutoHoldRulesModule.tsx 搬迁而来：扣留规则作为一种
// 批次扣留的方式，可以在OCAP工单建模流程的批次扣留节点里选择，所以规则管理页归到OCAP模块菜单下。
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ruleStorage } from '../services/holdRule/ruleStorage';
import { seedMockRulesIfEmpty } from '../services/holdRule/mockRules';
import { spcAutoHoldService } from '../../../src/services/spcAutoHold/spcAutoHoldService';
import { AutoHoldRule, AutoHoldExecutionRecord, SpcAbnormalEvent } from '../services/holdRule/types';
import { batchApiService } from '../../../src/components/BatchOperations/services/batchApiService';
import HoldRuleFormModal from '../components/hold-rule/HoldRuleFormModal';

/** datetime-local 控件按本地时区解读值，不能直接塞 toISOString()（那是UTC，会整体偏移时区差） */
const toDatetimeLocalValue = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyEventForm = (): SpcAbnormalEvent => ({
  equipmentId: '',
  occurredAt: toDatetimeLocalValue(new Date()),
  parameterName: '',
  monitorType: 'metal-ion',
  judgeResult: 'OOC',
  lastPassedAt: '',
});

const HoldRuleManagement: React.FC = () => {
  const [rules, setRules] = useState<AutoHoldRule[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoHoldRule | null>(null);

  const [eventForm, setEventForm] = useState<SpcAbnormalEvent>(emptyEventForm());
  const [executionRecords, setExecutionRecords] = useState<AutoHoldExecutionRecord[]>([]);

  const loadRules = () => setRules(ruleStorage.getRules());

  useEffect(() => {
    // 首次打开、本地还没有任何规则时，种入几条示例规则，方便直接在批次扣留节点里看到真实可选项
    seedMockRulesIfEmpty();
    loadRules();
    setExecutionRecords(spcAutoHoldService.listExecutionRecords());
    // 机台编码没有独立的主数据服务，只能从批次数据里的 equipmentCode 字段取真实出现过的值去重
    // （StationData/listStations 是工序/站点列表，只有 code/name，没有 equipmentCode）
    batchApiService.listBatches().then((batches: any[]) => {
      const codes = Array.from(new Set(batches.map(b => b.equipmentCode).filter(Boolean))) as string[];
      setEquipmentOptions(codes);
    });
  }, []);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rule: AutoHoldRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleSaveRule = (values: Omit<AutoHoldRule, 'id' | 'createdAt' | 'createdBy'>) => {
    if (editingRule) {
      ruleStorage.updateRule(editingRule.id, values);
    } else {
      ruleStorage.addRule({
        ...values,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: '当前操作人',
      });
    }
    setIsFormOpen(false);
    setEditingRule(null);
    loadRules();
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm('确认删除这条规则？')) return;
    ruleStorage.deleteRule(id);
    loadRules();
  };

  const handleSimulateTrigger = async () => {
    if (!eventForm.equipmentId || !eventForm.monitorType) {
      alert('请填写机台和monitor类型');
      return;
    }
    const event: SpcAbnormalEvent = {
      ...eventForm,
      occurredAt: new Date(eventForm.occurredAt).toISOString(),
      lastPassedAt: eventForm.lastPassedAt ? new Date(eventForm.lastPassedAt).toISOString() : undefined,
    };
    await spcAutoHoldService.handleSpcAbnormalEvent(event);
    setExecutionRecords(spcAutoHoldService.listExecutionRecords());
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold text-gray-800">扣留规则</h1>
      <p className="text-sm text-gray-500 -mt-4">
        正常生产批次的wafer量测数据经SPC检测异常时，默认扣留当前wafer所属批次，无需配置规则；
        仅针对monitor料号跑批等需要按时间窗口匹配一批生产批次的场景，才需要在此配置扣留规则——
        配置后可在OCAP工单建模的批次扣留节点中选择对应规则。
      </p>

      {/* 规则列表 */}
      <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-800">规则列表</h2>
          <button
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            创建规则
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3">规则名称</th>
              <th className="py-2 px-3">机台</th>
              <th className="py-2 px-3">monitor类型</th>
              <th className="py-2 px-3">时间窗口</th>
              <th className="py-2 px-3">责任人</th>
              <th className="py-2 px-3">状态</th>
              <th className="py-2 px-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id} className="border-b">
                <td className="py-2 px-3">{rule.name}</td>
                <td className="py-2 px-3">{rule.equipmentId}</td>
                <td className="py-2 px-3">{rule.monitorType}</td>
                <td className="py-2 px-3">
                  {rule.timeWindowMode === 'fixed' ? `固定${rule.fixedWindowHours}小时` : '回溯到上次合格'}
                </td>
                <td className="py-2 px-3">{rule.responsibleProcessEngineer} / {rule.responsibleQualityEngineer}</td>
                <td className="py-2 px-3">{rule.enabled ? '启用' : '停用'}</td>
                <td className="py-2 px-3 space-x-2">
                  <button className="text-blue-600 hover:underline" onClick={() => handleOpenEdit(rule)}>编辑</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDeleteRule(rule.id)}>删除</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={7} className="py-4 px-3 text-center text-gray-400">暂无规则</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 模拟触发面板：测试用，无真实SPC接入 */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-medium text-amber-800">模拟触发（测试用，无真实SPC系统接入）</h2>
        <p className="text-xs text-amber-700">
          这里手填的事件和未来真实SPC系统要调用的是同一个 spcAutoHoldService.handleSpcAbnormalEvent 接口，
          唯一区别是事件来源。
        </p>
        <div className="grid grid-cols-2 gap-4">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={eventForm.equipmentId}
            onChange={e => setEventForm(f => ({ ...f, equipmentId: e.target.value }))}
          >
            <option value="">选择机台 *</option>
            {equipmentOptions.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="monitor类型 *"
            value={eventForm.monitorType}
            onChange={e => setEventForm(f => ({ ...f, monitorType: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="参数名"
            value={eventForm.parameterName}
            onChange={e => setEventForm(f => ({ ...f, parameterName: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={eventForm.judgeResult}
            onChange={e => setEventForm(f => ({ ...f, judgeResult: e.target.value as 'OOC' | 'OOS' }))}
          >
            <option value="OOC">OOC</option>
            <option value="OOS">OOS</option>
          </select>
          <label className="flex flex-col text-xs text-gray-600 gap-1">
            发生时间
            <input
              type="datetime-local"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              value={eventForm.occurredAt}
              onChange={e => setEventForm(f => ({ ...f, occurredAt: e.target.value }))}
            />
          </label>
          <label className="flex flex-col text-xs text-gray-600 gap-1">
            上次合格时间（回溯到上次合格模式需要）
            <input
              type="datetime-local"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              value={eventForm.lastPassedAt}
              onChange={e => setEventForm(f => ({ ...f, lastPassedAt: e.target.value }))}
            />
          </label>
        </div>
        <button
          className="px-4 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
          onClick={handleSimulateTrigger}
        >
          模拟触发
        </button>
      </section>

      {/* 最近触发记录 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-base font-medium text-gray-800 mb-3">最近触发记录</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3">时间</th>
              <th className="py-2 px-3">规则</th>
              <th className="py-2 px-3">命中批次数</th>
              <th className="py-2 px-3">结果</th>
              <th className="py-2 px-3">工单</th>
            </tr>
          </thead>
          <tbody>
            {[...executionRecords].reverse().map(record => (
              <tr key={record.id} className="border-b">
                <td className="py-2 px-3">{new Date(record.executedAt).toLocaleString()}</td>
                <td className="py-2 px-3">{rules.find(r => r.id === record.ruleId)?.name ?? record.ruleId}</td>
                <td className="py-2 px-3">{record.matchedBatchIds.length}</td>
                <td className="py-2 px-3">{record.result}</td>
                <td className="py-2 px-3">
                  {record.workOrderId ?? '—'}
                  {record.workOrderCreationFailed && <span className="text-red-600 ml-1">（生成失败）</span>}
                </td>
              </tr>
            ))}
            {executionRecords.length === 0 && (
              <tr><td colSpan={5} className="py-4 px-3 text-center text-gray-400">暂无触发记录</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <HoldRuleFormModal
        isOpen={isFormOpen}
        editingRule={editingRule}
        equipmentOptions={equipmentOptions}
        onClose={() => { setIsFormOpen(false); setEditingRule(null); }}
        onSave={handleSaveRule}
      />
    </div>
  );
};

export default HoldRuleManagement;
