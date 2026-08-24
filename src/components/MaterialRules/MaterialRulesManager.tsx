import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, CreditCard as Edit, Trash2, Shield, ShieldOff, RefreshCw, Filter, ChevronDown, ToggleLeft, ToggleRight, Tag, Layers, Cpu, AlertCircle, CheckCircle } from 'lucide-react';
import { MaterialSelectionRule } from '../../types';
import { materialRulesService } from '../../services/materialRulesService';
import { RuleFormModal } from './RuleFormModal';

const RULE_TYPE_LABELS: Record<string, string> = {
  range: '范围匹配',
  comparison: '比较运算',
  enum_match: '枚举匹配',
  custom_expression: '自定义表达式',
};

const RULE_TYPE_COLORS: Record<string, string> = {
  range: 'bg-blue-100 text-blue-800',
  comparison: 'bg-amber-100 text-amber-800',
  enum_match: 'bg-green-100 text-green-800',
  custom_expression: 'bg-gray-100 text-gray-800',
};

function getRuleDefinitionSummary(rule: MaterialSelectionRule): string {
  switch (rule.ruleType) {
    case 'range': {
      if (rule.drivingProductAttribute) {
        return `由 ${rule.drivingProductAttribute} 动态计算`;
      }
      return `[${rule.ruleDefinition?.min ?? '?'}, ${rule.ruleDefinition?.max ?? '?'}]`;
    }
    case 'comparison': {
      return `${rule.ruleDefinition?.operator ?? '?'} ${rule.ruleDefinition?.value ?? '?'}`;
    }
    case 'enum_match': {
      const vals: string[] = rule.ruleDefinition?.allowedValues || [];
      return vals.length > 0 ? vals.join(' | ') : '无约束';
    }
    case 'custom_expression': {
      return rule.drivingLogicExpression ? rule.drivingLogicExpression.slice(0, 40) + '...' : '—';
    }
    default:
      return '—';
  }
}

export const MaterialRulesManager: React.FC = () => {
  const [rules, setRules] = useState<MaterialSelectionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStation, setFilterStation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<MaterialSelectionRule | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialRulesService.fetchAllRules();
      setRules(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stations = useMemo(() => ['all', ...Array.from(new Set(rules.map(r => r.processStationCode)))], [rules]);
  const categories = useMemo(() => ['all', ...Array.from(new Set(rules.map(r => r.materialCategory)))], [rules]);

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchesSearch = !searchTerm ||
        r.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.processStationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.materialCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.targetMaterialAttribute.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStation = filterStation === 'all' || r.processStationCode === filterStation;
      const matchesCategory = filterCategory === 'all' || r.materialCategory === filterCategory;
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? r.isActive : !r.isActive);
      return matchesSearch && matchesStation && matchesCategory && matchesStatus;
    });
  }, [rules, searchTerm, filterStation, filterCategory, filterStatus]);

  const handleToggle = async (rule: MaterialSelectionRule) => {
    try {
      await materialRulesService.toggleRuleActive(rule.id, !rule.isActive);
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
    } catch (e: any) {
      alert('操作失败: ' + e.message);
    }
  };

  const handleDelete = async (rule: MaterialSelectionRule) => {
    if (!confirm(`确定要删除规则 "${rule.ruleName}" 吗？`)) return;
    try {
      await materialRulesService.deleteRule(rule.id);
      setRules(prev => prev.filter(r => r.id !== rule.id));
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleSave = async (data: Omit<MaterialSelectionRule, 'id'>) => {
    if (editingRule) {
      const updated = await materialRulesService.updateRule(editingRule.id, data);
      setRules(prev => prev.map(r => r.id === editingRule.id ? updated : r));
    } else {
      const created = await materialRulesService.createRule(data);
      setRules(prev => [created, ...prev]);
    }
  };

  const openCreate = () => { setEditingRule(null); setShowForm(true); };
  const openEdit = (rule: MaterialSelectionRule) => { setEditingRule(rule); setShowForm(true); };

  const activeCount = rules.filter(r => r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">物料选料规则管理</h2>
          <p className="text-gray-600 mt-1">配置基于规则的动态物料筛选条件</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新建规则
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{rules.length}</div>
            <div className="text-sm text-gray-500">规则总数</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
            <div className="text-sm text-gray-500">已启用规则</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{Array.from(new Set(rules.map(r => r.processStationCode))).length}</div>
            <div className="text-sm text-gray-500">覆盖工艺站点</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索规则名称、站点、类别..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStation}
              onChange={e => setFilterStation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部站点</option>
              {stations.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部类别</option>
              {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="active">已启用</option>
              <option value="inactive">已禁用</option>
            </select>
            <button onClick={load} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">规则列表</h3>
          <span className="text-sm text-gray-500">共 {filteredRules.length} 条规则</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-red-500 gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Shield className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">暂无规则</p>
            <p className="text-xs text-gray-400 mt-1">点击"新建规则"开始配置物料筛选规则</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRules.map(rule => (
              <div key={rule.id} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${!rule.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${rule.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {rule.isActive
                        ? <Shield className="w-4 h-4 text-blue-600" />
                        : <ShieldOff className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{rule.ruleName}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${RULE_TYPE_COLORS[rule.ruleType]}`}>
                          {RULE_TYPE_LABELS[rule.ruleType]}
                        </span>
                        {!rule.isActive && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">已禁用</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> {rule.processStationCode}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {rule.materialCategory}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" /> 属性: <code className="font-mono text-blue-700">{rule.targetMaterialAttribute}</code>
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 inline-block font-mono">
                        {getRuleDefinitionSummary(rule)}
                      </div>
                      {rule.notes && (
                        <p className="mt-1.5 text-xs text-gray-400">{rule.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`p-1.5 rounded-lg transition-colors ${rule.isActive ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-600'}`}
                      title={rule.isActive ? '禁用规则' : '启用规则'}
                    >
                      {rule.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="编辑规则"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="删除规则"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RuleFormModal
        isOpen={showForm}
        rule={editingRule}
        onClose={() => { setShowForm(false); setEditingRule(null); }}
        onSave={handleSave}
      />
    </div>
  );
};
