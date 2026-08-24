// src/components/workflow-designer/config-types/action-configs/EquipmentCalibrationActionConfig.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Node as RFNode } from 'reactflow';
import { WorkflowNodeData } from '../../../../types/workflow';
import { useFormTemplates } from '../../../../hooks/useFormTemplates';
import { FileText, ExternalLink, ChevronDown, X } from 'lucide-react';

interface EquipmentCalibrationActionConfigProps {
  node: RFNode<WorkflowNodeData>;
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void;
}

interface Equipment {
  id: string;
  name: string;
}

const EquipmentCalibrationActionConfig: React.FC<EquipmentCalibrationActionConfigProps> = ({ node, onUpdateNode }) => {
  const { templates: formTemplates, loading: formTemplatesLoading } = useFormTemplates();
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 模拟设备列表数据源
  const mockEquipmentList: Equipment[] = [
    { id: 'EQP-001', name: '设备 EQP-001' },
    { id: 'EQP-002', name: '设备 EQP-002' },
    { id: 'EQP-003', name: '设备 EQP-003' },
    { id: 'EQP-004', name: '设备 EQP-004' },
    { id: 'EQP-005', name: '设备 EQP-005' },
    { id: 'EQP-006', name: '设备 EQP-006' },
    { id: 'EQP-007', name: '设备 EQP-007' },
  ];

  // 初始化逻辑：确保 calibratedEquipmentSource 有默认值
  useEffect(() => {
    if (!node.data.config?.calibratedEquipmentSource) {
      onUpdateNode({
        ...node,
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            calibratedEquipmentSource: 'current_anomaly_equipment'
          }
        }
      });
    }
  }, [node.data.config?.calibratedEquipmentSource]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEquipmentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      quality_check: '质量检查',
      equipment_maintenance: '设备维护',
      production_record: '生产记录',
      exception_handling: '异常处理',
      calibration: '校准',
      custom: '自定义'
    };
    return categoryMap[category] || category;
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    const currentEquipmentList = node.data.config?.equipmentList || [];
    const isSelected = currentEquipmentList.includes(equipmentId);
    
    let newEquipmentList: string[];
    if (isSelected) {
      newEquipmentList = currentEquipmentList.filter(id => id !== equipmentId);
    } else {
      newEquipmentList = [...currentEquipmentList, equipmentId];
    }

    onUpdateNode({
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          equipmentList: newEquipmentList
        }
      }
    });
  };

  const removeEquipment = (equipmentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const currentEquipmentList = node.data.config?.equipmentList || [];
    const newEquipmentList = currentEquipmentList.filter(id => id !== equipmentId);

    onUpdateNode({
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          equipmentList: newEquipmentList
        }
      }
    });
  };

  const getSelectedEquipmentNames = () => {
    const selectedIds = node.data.config?.equipmentList || [];
    return mockEquipmentList
      .filter(equipment => selectedIds.includes(equipment.id))
      .map(equipment => equipment.name);
  };

  const isEquipmentSelected = (equipmentId: string) => {
    return (node.data.config?.equipmentList || []).includes(equipmentId);
  };

  const renderFormTemplateSelector = () => {
    const selectedTemplate = formTemplates.find(t => t.id === node.data.config?.formTemplateId);

    return (
      <div className="space-y-3">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <label className="block text-sm font-medium text-gray-700">关联表单模版</label>
          </div>

          {formTemplatesLoading ? (
            <div className="text-sm text-gray-500 py-2">加载表单模版中...</div>
          ) : formTemplates.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">暂无可用表单模版，请先创建并发布模版</p>
              <Link
                to="/form-templates"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center"
              >
                前往创建表单模版
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </div>
          ) : (
            <>
              <select
                value={node.data.config?.formTemplateId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedTemplate = formTemplates.find(t => t.id === selectedId);
                  onUpdateNode({
                    ...node,
                    data: {
                      ...node.data,
                      config: {
                        ...node.data.config,
                        formTemplateId: selectedId || undefined,
                        formTemplateName: selectedTemplate?.name || undefined
                      }
                    }
                  });
                }}
              >
                <option value="">请选择表单模版（可选）</option>
                {formTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {getCategoryLabel(template.category)}
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{selectedTemplate.name}</span>
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {getCategoryLabel(selectedTemplate.category)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{selectedTemplate.description}</p>
                      <p className="text-xs text-gray-500">字段数：{selectedTemplate.fields.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
                    <Link
                      to={`/form-templates/${selectedTemplate.id}/edit`}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center"
                    >
                      查看详情
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateNode({
                          ...node,
                          data: {
                            ...node.data,
                            config: {
                              ...node.data.config,
                              formTemplateId: undefined,
                              formTemplateName: undefined
                            }
                          }
                        });
                      }}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline"
                    >
                      清除选择
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderEquipmentMultiSelect = () => {
    const selectedEquipmentNames = getSelectedEquipmentNames();
    const selectedCount = selectedEquipmentNames.length;

    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">选择具体设备</label>
        
        {/* 多选输入框 */}
        <div
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-h-[42px] flex items-center flex-wrap gap-1"
          onClick={() => setIsEquipmentDropdownOpen(!isEquipmentDropdownOpen)}
        >
          {selectedCount === 0 ? (
            <span className="text-gray-400">请选择设备</span>
          ) : (
            selectedEquipmentNames.map((name, index) => {
              const selectedId = (node.data.config?.equipmentList || [])[index];
              return (
                <span
                  key={selectedId}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                >
                  {name}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-600"
                    onClick={(e) => removeEquipment(selectedId, e)}
                  />
                </span>
              );
            })
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isEquipmentDropdownOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* 下拉菜单 */}
        {isEquipmentDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {mockEquipmentList.map((equipment) => (
              <div
                key={equipment.id}
                className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                  isEquipmentSelected(equipment.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleEquipmentToggle(equipment.id)}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={isEquipmentSelected(equipment.id)}
                  onChange={() => {}} // 由外层div的onClick处理
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="ml-2 text-sm text-gray-700">{equipment.name}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">
          {selectedCount > 0 ? `已选择 ${selectedCount} 个设备` : '点击选择设备（可多选）'}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 校准设备选择器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">校准设备</label>
        <select
          value={node.data.config?.calibratedEquipmentSource || 'current_anomaly_equipment'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  calibratedEquipmentSource: e.target.value as 'current_anomaly_equipment' | 'manual_selection'
                }
              }
            });
          }}
        >
          <option value="current_anomaly_equipment">当前异常片检测设备</option>
          <option value="manual_selection">手动选择</option>
        </select>
      </div>

      {/* 条件显示：手动选择设备时的多选下拉框 */}
      {node.data.config?.calibratedEquipmentSource === 'manual_selection' && renderEquipmentMultiSelect()}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">校准标准</label>
        <textarea
          value={node.data.config?.calibrationStandards || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="输入适用的校准标准或规范"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, calibrationStandards: e.target.value }
              }
            });
          }}
        />
      </div>

      {renderFormTemplateSelector()}
    </div>
  );
};

export default EquipmentCalibrationActionConfig;