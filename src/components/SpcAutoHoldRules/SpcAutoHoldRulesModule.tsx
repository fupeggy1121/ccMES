import React, { useEffect, useState } from 'react';
import { ruleStorage } from '../../services/spcAutoHold/ruleStorage';
import { spcAutoHoldService } from '../../services/spcAutoHold/spcAutoHoldService';
import { AutoHoldRule, AutoHoldExecutionRecord, SpcAbnormalEvent } from '../../services/spcAutoHold/types';
import { batchApiService } from '../BatchOperations/services/batchApiService';

const emptyRuleForm = (): Omit<AutoHoldRule, 'id' | 'createdAt' | 'createdBy'> => ({
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

const emptyEventForm = (): SpcAbnormalEvent => ({
  equipmentId: '',
  occurredAt: new Date().toISOString().slice(0, 16),
  parameterName: '',
  monitorType: 'metal-ion',
  judgeResult: 'OOC',
  lastPassedAt: '',
});

const SpcAutoHoldRulesModule: React.FC = () => {
  const [rules, setRules] = useState<AutoHoldRule[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [ruleForm, setRuleForm] = useState(emptyRuleForm());
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState<SpcAbnormalEvent>(emptyEventForm());
  const [executionRecords, setExecutionRecords] = useState<AutoHoldExecutionRecord[]>([]);

  const loadRules = () => setRules(ruleStorage.getRules());

  useEffect(() => {
    loadRules();
    setExecutionRecords(spcAutoHoldService.listExecutionRecords());
    // 机台编码没有独立的主数据服务，只能从批次数据里的 equipmentCode 字段取真实出现过的值去重
    // （StationData/listStations 是工序/站点列表，只有 code/name，没有 equipmentCode）
    batchApiService.listBatches().then((batches: any[]) => {
      const codes = Array.from(new Set(batches.map(b => b.equipmentCode).filter(Boolean))) as string[];
      setEquipmentOptions(codes);
    });
  }, []);

  const handleSaveRule = () => {
    if (!ruleForm.name || !ruleForm.equipmentId || !ruleForm.monitorType) {
      alert('请填写规则名称、机台和monitor类型');
      return;
    }
    if (ruleForm.timeWindowMode === 'fixed' && !ruleForm.fixedWindowHours) {
      alert('固定周期模式需要填写回溯小时数');
      return;
    }
    if (!ruleForm.responsibleProcessEngineer || !ruleForm.responsibleQualityEngineer) {
      alert('请填写责任工艺工程师和知会质量工程师');
      return;
    }

    if (editingRuleId) {
      ruleStorage.updateRule(editingRuleId, ruleForm);
    } else {
      ruleStorage.addRule({
        ...ruleForm,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: '当前操作人',
      });
    }
    setRuleForm(emptyRuleForm());
    setEditingRuleId(null);
    loadRules();
  };

  const handleEditRule = (rule: AutoHoldRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      equipmentId: rule.equipmentId,
      productCode: rule.productCode ?? '',
      station: rule.station ?? '',
      monitorType: rule.monitorType,
      timeWindowMode: rule.timeWindowMode,
      fixedWindowHours: rule.fixedWindowHours,
      responsibleProcessEngineer: rule.responsibleProcessEngineer,
      responsibleQualityEngineer: rule.responsibleQualityEngineer,
      enabled: rule.enabled,
    });
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
      <h1 className="text-xl font-semibold text-gray-800">SPC自动Hold规则</h1>

      {/* 规则列表 + 新建/编辑表单 */}
      <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-base font-medium text-gray-800">{editingRuleId ? '编辑规则' : '新建规则'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="规则名称 *"
            value={ruleForm.name}
            onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={ruleForm.equipmentId}
            onChange={e => setRuleForm(f => ({ ...f, equipmentId: e.target.value }))}
          >
            <option value="">选择机台 *</option>
            {equipmentOptions.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="产品料号（可选）"
            value={ruleForm.productCode}
            onChange={e => setRuleForm(f => ({ ...f, productCode: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="工序/站点（可选）"
            value={ruleForm.station}
            onChange={e => setRuleForm(f => ({ ...f, station: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="monitor类型 *（如 metal-ion）"
            value={ruleForm.monitorType}
            onChange={e => setRuleForm(f => ({ ...f, monitorType: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={ruleForm.timeWindowMode}
            onChange={e => setRuleForm(f => ({ ...f, timeWindowMode: e.target.value as 'fixed' | 'back-to-last-pass' }))}
          >
            <option value="fixed">固定周期回溯</option>
            <option value="back-to-last-pass">回溯到上次合格</option>
          </select>
          {ruleForm.timeWindowMode === 'fixed' && (
            <input
              type="number"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="回溯小时数 *"
              value={ruleForm.fixedWindowHours ?? ''}
              onChange={e => setRuleForm(f => ({ ...f, fixedWindowHours: Number(e.target.value) }))}
            />
          )}
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="责任工艺工程师 *"
            value={ruleForm.responsibleProcessEngineer}
            onChange={e => setRuleForm(f => ({ ...f, responsibleProcessEngineer: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="知会质量工程师 *"
            value={ruleForm.responsibleQualityEngineer}
            onChange={e => setRuleForm(f => ({ ...f, responsibleQualityEngineer: e.target.value }))}
          />
        </div>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            onClick={handleSaveRule}
          >
            {editingRuleId ? '保存修改' : '新建规则'}
          </button>
          {editingRuleId && (
            <button
              className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { setEditingRuleId(null); setRuleForm(emptyRuleForm()); }}
            >
              取消编辑
            </button>
          )}
        </div>

        <table className="w-full text-sm mt-4">
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
                  <button className="text-blue-600 hover:underline" onClick={() => handleEditRule(rule)}>编辑</button>
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
    </div>
  );
};

export default SpcAutoHoldRulesModule;
