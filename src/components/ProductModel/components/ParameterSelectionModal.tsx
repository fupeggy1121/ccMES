// src/components/ParameterSelectionModal.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Select } from 'antd';
import { Parameter, ParameterGroup } from '../types/Product';
import { SAMPLING_RULE_OPTIONS } from '../constants/samplingRules';

const { Option } = Select;

interface ParameterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  parameters: Parameter[];
  selectedParameters: Parameter[];
  onSave: (selectedParams: Parameter[], samplingRule?: string) => void;
  isDeviationContext?: boolean;
  stationParameterGroups: ParameterGroup[];
  initialSelectedParameterGroupIds: string[];
  parameterType: 'measurement' | 'process' | 'spc';
  initialSamplingRule?: string;
}

const ParameterSelectionModal: React.FC<ParameterSelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  parameters,
  selectedParameters,
  onSave,
  isDeviationContext = false,
  stationParameterGroups,
  initialSelectedParameterGroupIds,
  parameterType,
  initialSamplingRule,
}) => {
  const [localSelected, setLocalSelected] = useState<Parameter[]>([]);
  const [localSelectedParameterGroupIds, setLocalSelectedParameterGroupIds] = useState<string[]>([]);
  const [localSamplingRule, setLocalSamplingRule] = useState<string>('');

  // drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalSelected(selectedParameters || []);
  }, [selectedParameters]);

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedParameterGroupIds && initialSelectedParameterGroupIds.length > 0) {
        setLocalSelectedParameterGroupIds(initialSelectedParameterGroupIds);
      } else {
        setLocalSelectedParameterGroupIds([]);
      }

      if (parameterType === 'measurement') {
        setLocalSamplingRule(initialSamplingRule || '');
      } else {
        setLocalSamplingRule('');
      }
    }
  }, [isOpen, initialSelectedParameterGroupIds, stationParameterGroups, parameterType, initialSamplingRule]);

  // 根据选中的参数组过滤参数列表（未选中的）
  const filteredParameters = useMemo(() => {
    if (localSelectedParameterGroupIds.length === 0) return [];
    return parameters.filter(
      param =>
        param.parameter_group_id &&
        localSelectedParameterGroupIds.includes(param.parameter_group_id)
    );
  }, [parameters, localSelectedParameterGroupIds]);

  // 已选中的参数（保持顺序），未选中的参数
  const unselectedParameters = useMemo(
    () => filteredParameters.filter(p => !localSelected.some(s => s.id === p.id)),
    [filteredParameters, localSelected]
  );

  // ── 勾选 / 取消勾选 ──────────────────────────────────────────
  const handleToggleParameter = (parameter: Parameter) => {
    const isSelected = localSelected.some(p => p.id === parameter.id);
    if (isSelected) {
      setLocalSelected(prev => prev.filter(p => p.id !== parameter.id));
    } else {
      setLocalSelected(prev => [...prev, parameter]);
    }
  };

  // ── 上下移动（已选区） ────────────────────────────────────────
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setLocalSelected(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    setLocalSelected(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  // ── 拖拽（已选区） ────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === dropIndex) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    setLocalSelected(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleSave = () => {
    onSave(localSelected, parameterType === 'measurement' ? localSamplingRule : undefined);
    onClose();
  };

  const paramTypeBadge = (type: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      measurement: { cls: 'bg-blue-100 text-blue-800', label: '量测' },
      process:     { cls: 'bg-green-100 text-green-800', label: '工艺' },
      spc:         { cls: 'bg-purple-100 text-purple-800', label: 'SPC' },
    };
    const entry = map[type] ?? { cls: 'bg-gray-100 text-gray-800', label: '其他' };
    return <span className={`px-2 py-0.5 text-xs rounded ${entry.cls}`}>{entry.label}</span>;
  };

  if (!isOpen) return null;

  const colHeaders = (
    <tr>
      <th className="w-8 px-2 py-3 border-b" />
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">序号</th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">参数代码</th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">参数名称</th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">单位</th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">类型</th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">描述</th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">排序</th>
    </tr>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 flex flex-col max-h-[90vh]">
        {/* 标题 */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 参数组与量测规则选择器 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择参数组</label>
              <Select
                mode="multiple"
                placeholder="请选择参数组"
                value={localSelectedParameterGroupIds}
                onChange={(vals: string[]) => setLocalSelectedParameterGroupIds(vals)}
                style={{ width: '100%' }}
              >
                {stationParameterGroups.map(group => (
                  <Option key={group.id} value={group.id}>{group.name}</Option>
                ))}
              </Select>
              {localSelectedParameterGroupIds.length === 0 && (
                <p className="text-sm text-red-500 mt-1">请至少选择一个参数组以显示参数。</p>
              )}
            </div>

            {parameterType === 'measurement' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">量测规则</label>
                <Select
                  placeholder="请选择量测规则"
                  value={localSamplingRule || undefined}
                  onChange={(value: string) => setLocalSamplingRule(value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {SAMPLING_RULE_OPTIONS.map(rule => (
                    <Option key={rule.value} value={rule.value}>{rule.label}</Option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* ── 已选参数（可排序） ── */}
          {localSelected.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-blue-700">
                  已选参数（{localSelected.length} 项）
                </span>
                <span className="text-xs text-gray-400">拖动行或点击 ↑↓ 按钮可调整展示顺序</span>
              </div>
              <div className="overflow-x-auto rounded border border-blue-200">
                <table className="min-w-full bg-blue-50">
                  <thead className="bg-blue-100">
                    {colHeaders}
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {localSelected.map((parameter, index) => {
                      const isDragOver = dragOverIndex === index;
                      return (
                        <tr
                          key={parameter.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`transition-colors ${isDragOver ? 'bg-blue-200 border-t-2 border-blue-500' : 'hover:bg-blue-100'} cursor-grab active:cursor-grabbing`}
                        >
                          {/* 拖拽手柄 */}
                          <td className="px-2 py-3 text-gray-400">
                            <GripVertical className="w-4 h-4" />
                          </td>
                          {/* 序号 */}
                          <td className="px-4 py-3 text-sm font-medium text-blue-700 w-10">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{parameter.code}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{parameter.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{parameter.unit || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{paramTypeBadge(parameter.type)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{parameter.description || '-'}</td>
                          {/* 排序按钮 + 取消勾选 */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="上移"
                              >
                                <ChevronUp className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === localSelected.length - 1}
                                className="p-1 rounded hover:bg-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="下移"
                              >
                                <ChevronDown className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleToggleParameter(parameter)}
                                className="ml-1 p-1 rounded hover:bg-red-100 transition-colors"
                                title="取消选择"
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 未选参数 ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-600">
                可选参数（{unselectedParameters.length} 项）
              </span>
              <span className="text-xs text-gray-400">勾选后添加到已选列表末尾</span>
            </div>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  {colHeaders}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {unselectedParameters.length > 0 ? (
                    unselectedParameters.map((parameter) => (
                      <tr
                        key={parameter.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleToggleParameter(parameter)}
                      >
                        <td className="px-2 py-3">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleParameter(parameter)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">—</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{parameter.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{parameter.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{parameter.unit || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{paramTypeBadge(parameter.type)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{parameter.description || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">—</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                        {localSelectedParameterGroupIds.length === 0
                          ? '请先选择参数组'
                          : '该参数组下的参数已全部选中'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <span className="text-sm text-gray-500">
            已选 <strong className="text-blue-600">{localSelected.length}</strong> 个参数
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterSelectionModal;
