// src/components/workflow-designer/config-types/ActionNodeConfig.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Node as RFNode, Edge as RFEdge } from 'reactflow';
import { WorkflowNodeData } from '../../../types/workflow';
import { Plus, Trash2, ChevronDown, ChevronUp, Users, Mail, X, FileText, ExternalLink, HelpCircle } from 'lucide-react';
import UserGroupSelector from '../../UserGroupSelector';
import { useUserGroups } from '../../../hooks/useUserGroups';
import { useFormTemplates } from '../../../hooks/useFormTemplates';
import { useHoldRules } from '../../../hooks/useHoldRules';
import MultiSelectDropdown from '../../MultiSelectDropdown';
import { availableRoles } from '../../../constants/roles';

// 导入新的配置组件
import RemeasureActionConfig from './action-configs/RemeasureActionConfig';
import BatchHoldActionConfig from './action-configs/BatchHoldActionConfig';
import EquipmentDisableActionConfig from './action-configs/EquipmentDisableActionConfig';
import NotifyPersonnelActionConfig from './action-configs/NotifyPersonnelActionConfig';
import EquipmentCalibrationActionConfig from './action-configs/EquipmentCalibrationActionConfig';
import ApprovalActionConfig from './action-configs/ApprovalActionConfig';

interface ActionNodeConfigProps {
  node: RFNode<WorkflowNodeData>;
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void;
  allEdges: RFEdge[];
}

const ActionNodeConfig: React.FC<ActionNodeConfigProps> = ({ node, onUpdateNode, allEdges }) => {
  const [showGroupSelector, setShowGroupSelector] = useState<'recipients' | 'cc' | null>(null);
  const { userGroups } = useUserGroups();
  const { templates: formTemplates, loading: formTemplatesLoading } = useFormTemplates();
  const { rules: holdRules } = useHoldRules();

  const shouldShowFormTemplate = !['batchHold', 'equipmentDisable', 'notifyPersonnel'].includes(node.data.config?.actionType || '');

  const inflowCount = allEdges.filter(edge => edge.target === node.id).length;
  const outflowCount = allEdges.filter(edge => edge.source === node.id).length;
  
  const isProcessEndSwitchDisabled = outflowCount > 0;

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

  const renderFormTemplateSelector = () => {
    if (!shouldShowFormTemplate) {
      return null;
    }

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
                      to={`/form-templates/${selectedTemplate.id}/preview`}
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

  return (
    <>
      <UserGroupSelector
        isOpen={showGroupSelector !== null}
        onClose={() => setShowGroupSelector(null)}
        onSelect={(group) => {
          if (showGroupSelector === 'recipients') {
            const currentGroups = node.data.config?.emailConfig?.recipientGroups || [];
            if (!currentGroups.includes(group.id)) {
              onUpdateNode({
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    emailConfig: {
                      ...node.data.config?.emailConfig,
                      recipientGroups: [...currentGroups, group.id],
                      recipients: node.data.config?.emailConfig?.recipients || [],
                      cc: node.data.config?.emailConfig?.cc || []
                    } as any
                  }
                }
              });
            }
          } else if (showGroupSelector === 'cc') {
            const currentGroups = node.data.config?.emailConfig?.ccGroups || [];
            if (!currentGroups.includes(group.id)) {
              onUpdateNode({
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    emailConfig: {
                      ...node.data.config?.emailConfig,
                      ccGroups: [...currentGroups, group.id],
                      cc: node.data.config?.emailConfig?.cc || [],
                      recipients: node.data.config?.emailConfig?.recipients || []
                    } as any
                  }
                }
              });
            }
          }
          setShowGroupSelector(null);
        }}
        selectedGroupIds={[
          ...(node.data.config?.emailConfig?.recipientGroups || []),
          ...(node.data.config?.emailConfig?.ccGroups || [])
        ]}
      />

      <div className="space-y-4">
        {/* 基础信息分组 */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">基础信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">动作类型</label>
              <select
                value={node.data.config?.actionType || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const {
                    testPath, holdRule, disableReason, calibrationType, equipmentList,
                    calibrationSchedule, calibrationStandards, responsiblePersonnel,
                    notificationMethods, emailConfig, systemMessageConfig, oaConfig,
                    smsConfig, webhookConfig, notificationTiming, scheduledTime,
                    retryAttempts, escalationRules, approvers, timeout,
                    holdRuleConfig, standardWorkingHours, sendOvertimeAlert,
                    releaseEquipmentId, equipmentReleaseReason, // 新增
                    releaseBatchId, batchReleaseReason, // 新增
                    ...remainingConfig
                  } = node.data.config || {};

                  onUpdateNode({
                    ...node,
                    data: {
                      ...node.data,
                      config: {
                        ...remainingConfig,
                        actionType: e.target.value as any
                      }
                    }
                  });
                }}
              >
                <option value="">请选择动作类型</option>
                <option value="remeasure">复测</option>
                <option value="batchHold">批次扣留</option>
                <option value="equipmentDisable">设备扣留</option>
                <option value="notifyPersonnel">发送通知</option>
                <option value="equipmentCalibration">量测设备校准</option>
                <option value="approval">人工审批</option>
                <option value="equipmentRelease">设备释放</option> {/* 新增 */}
                <option value="batchRelease">批次释放</option> {/* 新增 */}
              </select>
            </div>

            {/* 扣留规则：引用"扣留规则"管理页里配置的真实规则，而不是写死的策略文案 */}
            {node.data.config?.actionType === 'batchHold' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">扣留规则</label>
                <select
                  value={node.data.config?.holdRuleConfig || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        config: {
                          ...node.data.config,
                          holdRuleConfig: e.target.value
                        }
                      }
                    });
                  }}
                >
                  <option value="">不选择（默认扣留当前批次）</option>
                  {holdRules.map(rule => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  多数正常生产批次留空即可，默认扣留当前批次；仅monitor料号跑批等需要按时间窗口匹配一批生产批次的场景，
                  才需要在此选择对应配置的扣留规则（可到OCAP菜单下的"扣留规则"页面新增或维护）。
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">节点名称</label>
              <input
                type="text"
                value={node.data.title}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  onUpdateNode({
                    ...node,
                    data: {
                      ...node.data,
                      title: e.target.value
                    }
                  });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <textarea
                value={node.data.description || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                onChange={(e) => {
                  onUpdateNode({
                    ...node,
                    data: {
                      ...node.data,
                      description: e.target.value
                    }
                  });
                }}
              />
            </div>

            {/* 流程结束开关 */}
            <div>
              <label htmlFor="isProcessEndToggle" className={`flex items-center justify-between ${isProcessEndSwitchDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <span className="text-sm font-medium text-gray-700">流程结束</span>
                <div className="relative inline-flex items-center">
                  <input
                    id="isProcessEndToggle"
                    type="checkbox"
                    checked={node.data.config?.isProcessEnd || false}
                    onChange={(e) => {
                      if (!isProcessEndSwitchDisabled) {
                        onUpdateNode({
                          ...node,
                          data: {
                            ...node.data,
                            config: {
                              ...node.data.config,
                              isProcessEnd: e.target.checked
                            }
                          }
                        });
                      }
                    }}
                    disabled={isProcessEndSwitchDisabled}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 ${isProcessEndSwitchDisabled ? 'bg-gray-200' : 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300'} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isProcessEndSwitchDisabled ? '' : 'peer-checked:bg-blue-600'}`}></div>
                </div>
              </label>
              {isProcessEndSwitchDisabled && (
                <p className="mt-1 text-xs text-gray-500">流程结束开关仅在节点没有流出边时可配置。</p>
              )}
            </div>
          </div>
        </div>

        {/* 执行参数分组 */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">执行参数</h3>

          {/* 修改：执行人员配置 - 仅当不是 'notifyPersonnel', 'equipmentDisable', 'batchHold', 'batchRelease' 类型时显示 */}
          {!['notifyPersonnel', 'equipmentDisable', 'batchHold', 'batchRelease', 'equipmentRelease'].includes(node.data.config?.actionType || '') && (
            <div className="mb-6">
              <MultiSelectDropdown
                label="执行人员"
                options={availableRoles}
                selectedValues={node.data.config?.responsiblePersonnel || []}
                onChange={(values) => {
                  onUpdateNode({
                    ...node,
                    data: {
                      ...node.data,
                      config: {
                        ...node.data.config,
                        responsiblePersonnel: values
                      }
                    }
                  });
                }}
                placeholder="选择负责执行该节点的人员角色"
              />
            </div>
          )}

          {/* 修改：标准工时和超工时告警仅在非特定类型时显示 */}
          {!['batchHold', 'batchRelease', 'equipmentDisable', 'equipmentRelease'].includes(node.data.config?.actionType || '') && (
            <>
              {/* 新增：标准工时配置 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">标准工时 (小时)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={node.data.config?.standardWorkingHours || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：8 (小时)"
                  onChange={(e) => {
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        config: {
                          ...node.data.config,
                          standardWorkingHours: e.target.value ? parseFloat(e.target.value) : undefined
                        }
                      }
                    });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">该节点预计完成所需的小时数</p>
              </div>

              {/* 新增：超工时告警开关 */}
              <div className="mb-6">
                <label htmlFor="sendOvertimeAlertToggle" className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">超工时告警</span>
                  <div className="relative inline-flex items-center">
                    <input
                      id="sendOvertimeAlertToggle"
                      type="checkbox"
                      checked={node.data.config?.sendOvertimeAlert || false}
                      onChange={(e) => {
                        onUpdateNode({
                          ...node,
                          data: {
                            ...node.data,
                            config: {
                              ...node.data.config,
                              sendOvertimeAlert: e.target.checked
                            }
                          }
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-1">启用后，当节点执行超时将发送告警通知</p>
              </div>
            </>
          )}

          <div className="space-y-4">
            {/* 动态渲染的动作类型特定配置组件 */}
            {node.data.config?.actionType === 'remeasure' && (
              <RemeasureActionConfig node={node} onUpdateNode={onUpdateNode} />
            )}
            {node.data.config?.actionType === 'batchHold' && (
              <BatchHoldActionConfig node={node} onUpdateNode={onUpdateNode} />
            )}
            {node.data.config?.actionType === 'equipmentDisable' && (
              <EquipmentDisableActionConfig node={node} onUpdateNode={onUpdateNode} />
            )}
            {node.data.config?.actionType === 'notifyPersonnel' && (
              <NotifyPersonnelActionConfig node={node} onUpdateNode={onUpdateNode} />
            )}
            {node.data.config?.actionType === 'equipmentCalibration' && (
              <EquipmentCalibrationActionConfig node={node} onUpdateNode={onUpdateNode} />
            )}
            {node.data.config?.actionType === 'approval' && (
              <ApprovalActionConfig node={node} onUpdateNode={onUpdateNode} />
            )}

            {/* 新增：设备释放配置 */}
            {node.data.config?.actionType === 'equipmentRelease' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">释放原因</label>
                  <textarea
                    value={node.data.config?.equipmentReleaseReason || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="请输入设备释放的原因"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: {
                          ...node.data,
                          config: { ...node.data.config, equipmentReleaseReason: e.target.value }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            )}

            {/* 新增：批次释放配置 */}
            {node.data.config?.actionType === 'batchRelease' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">释放原因</label>
                  <textarea
                    value={node.data.config?.batchReleaseReason || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="请输入批次释放的原因"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: {
                          ...node.data,
                          config: { ...node.data.config, batchReleaseReason: e.target.value }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            )}

            {/* "关联表单模版" for generic actions or if not covered by specific configs */}
            {shouldShowFormTemplate && !['remeasure', 'equipmentCalibration', 'approval'].includes(node.data.config?.actionType || '') &&
              renderFormTemplateSelector()
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionNodeConfig;