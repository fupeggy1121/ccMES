// src/components/workflow-designer/config-types/action-configs/NotifyPersonnelActionConfig.tsx
import React, { useState } from 'react';
import { Node as RFNode } from 'reactflow'; // 导入 RFNode
import { WorkflowNodeData } from '../../../../types/workflow'; // 导入 WorkflowNodeData
import { ChevronDown, ChevronUp, Users, Plus, X, HelpCircle } from 'lucide-react';
import UserGroupSelector from '../../../UserGroupSelector';
import { useUserGroups } from '../../../../hooks/useUserGroups';

interface NotifyPersonnelActionConfigProps {
  node: RFNode<WorkflowNodeData>; // 修改类型
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void; // 修改类型
}

const NotifyPersonnelActionConfig: React.FC<NotifyPersonnelActionConfigProps> = ({ node, onUpdateNode }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    email: true,
    systemMessage: false,
    oa: false,
    sms: false,
    webhook: false
  });
  const [showGroupSelector, setShowGroupSelector] = useState<'recipients' | 'cc' | null>(null);
  const { userGroups } = useUserGroups();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNotificationMethodToggle = (method: 'email' | 'systemMessage' | 'oa' | 'sms' | 'webhook') => {
    const currentMethods = node.data.config?.notificationMethods || []; // 访问 node.data.config
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];

    onUpdateNode({
      ...node,
      data: { // 更新 node.data
        ...node.data,
        config: {
          ...node.data.config, // 访问 node.data.config
          notificationMethods: newMethods
        }
      }
    });
  };

  const selectedMethods = node.data.config?.notificationMethods || []; // 访问 node.data.config

  return (
    <>
      <UserGroupSelector
        isOpen={showGroupSelector !== null}
        onClose={() => setShowGroupSelector(null)}
        onSelect={(group) => {
          if (showGroupSelector === 'recipients') {
            const currentGroups = node.data.config?.emailConfig?.recipientGroups || []; // 访问 node.data.config
            if (!currentGroups.includes(group.id)) {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: {
                    ...node.data.config, // 访问 node.data.config
                    emailConfig: {
                      ...node.data.config?.emailConfig, // 访问 node.data.config
                      recipientGroups: [...currentGroups, group.id],
                      recipients: node.data.config?.emailConfig?.recipients || [], // 访问 node.data.config
                      cc: node.data.config?.emailConfig?.cc || [] // FIX: Initialize cc array
                    } as any
                  }
                }
              });
            }
          } else if (showGroupSelector === 'cc') {
            const currentGroups = node.data.config?.emailConfig?.ccGroups || []; // 访问 node.data.config
            if (!currentGroups.includes(group.id)) {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: {
                    ...node.data.config, // 访问 node.data.config
                    emailConfig: {
                      ...node.data.config?.emailConfig, // 访问 node.data.config
                      ccGroups: [...currentGroups, group.id],
                      cc: node.data.config?.emailConfig?.cc || [], // FIX: Initialize cc array
                      recipients: node.data.config?.emailConfig?.recipients || [] // 访问 node.data.config
                    } as any
                  }
                }
              });
            }
          }
          setShowGroupSelector(null);
        }}
        selectedGroupIds={[
          ...(node.data.config?.emailConfig?.recipientGroups || []), // 访问 node.data.config
          ...(node.data.config?.emailConfig?.ccGroups || []) // 访问 node.data.config
        ]}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">通知方式</label>
          <div className="space-y-2">
            {[
              { value: 'email', label: '邮件通知' },
              { value: 'systemMessage', label: '系统消息' },
              { value: 'oa', label: 'OA系统' },
              { value: 'sms', label: '短信通知' },
              { value: 'webhook', label: 'Webhook' }
            ].map((method) => (
              <label key={method.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMethods.includes(method.value as any)}
                  onChange={() => handleNotificationMethodToggle(method.value as any)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedMethods.includes('email') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => toggleSection('email')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
            >
              <span>邮件配置</span>
              {expandedSections.email ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.email && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">收件人</label>
                    <button
                      type="button"
                      onClick={() => setShowGroupSelector('recipients')}
                      className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>添加用户组</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">可搜索邮箱、联系人或群组</p>

                  <input
                    type="text"
                    value={(node.data.config?.emailConfig?.recipients || []).join(', ')} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="输入邮箱地址，用逗号分隔"
                    onChange={(e) => {
                      const recipients = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            emailConfig: { 
                              ...node.data.config?.emailConfig, 
                              recipients, 
                              recipientGroups: node.data.config?.emailConfig?.recipientGroups || [] // FIX: Initialize recipientGroups array
                            } as any
                          }
                        }
                      });
                    }}
                  />

                  {(node.data.config?.emailConfig?.recipientGroups && node.data.config.emailConfig.recipientGroups.length > 0) && ( // 访问 node.data.config
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-600">已选用户组：</p>
                      <div className="flex flex-wrap gap-2">
                        {node.data.config.emailConfig.recipientGroups.map((groupId) => { // 访问 node.data.config
                          const group = userGroups.find(g => g.id === groupId);
                          if (!group) return null;
                          return (
                            <div
                              key={groupId}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                            >
                              <Users className="w-3 h-3" />
                              <span>{group.name}</span>
                              <span className="text-blue-600">({group.member_count || 0})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const recipientGroups = (node.data.config?.emailConfig?.recipientGroups || []).filter(id => id !== groupId); // 访问 node.data.config
                                  onUpdateNode({
                                    ...node,
                                    data: { // 更新 node.data
                                      ...node.data,
                                      config: {
                                        ...node.data.config, // 访问 node.data.config
                                        emailConfig: { 
                                          ...node.data.config?.emailConfig, 
                                          recipientGroups, 
                                          recipients: node.data.config?.emailConfig?.recipients || [] 
                                        } as any
                                      }
                                    }
                                  });
                                }}
                                className="hover:bg-blue-200 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">抄送</label>
                    <button
                      type="button"
                      onClick={() => setShowGroupSelector('cc')}
                      className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>添加用户组</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={(node.data.config?.emailConfig?.cc || []).join(', ')} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="输入抄送邮箱，用逗号分隔"
                    onChange={(e) => {
                      const cc = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            emailConfig: { 
                              ...node.data.config?.emailConfig, 
                              cc, 
                              ccGroups: node.data.config?.emailConfig?.ccGroups || [], // FIX: Initialize ccGroups array
                              recipients: node.data.config?.emailConfig?.recipients || [] 
                            } as any
                          }
                        }
                      });
                    }}
                  />

                  {(node.data.config?.emailConfig?.ccGroups && node.data.config.emailConfig.ccGroups.length > 0) && ( // 访问 node.data.config
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-600">已选用户组：</p>
                      <div className="flex flex-wrap gap-2">
                        {node.data.config.emailConfig.ccGroups.map((groupId) => { // 访问 node.data.config
                          const group = userGroups.find(g => g.id === groupId);
                          if (!group) return null;
                          return (
                            <div
                              key={groupId}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                            >
                              <Users className="w-3 h-3" />
                              <span>{group.name}</span>
                              <span className="text-blue-600">({group.member_count || 0})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const ccGroups = (node.data.config?.emailConfig?.ccGroups || []).filter(id => id !== groupId); // 访问 node.data.config
                                  onUpdateNode({
                                    ...node,
                                    data: { // 更新 node.data
                                      ...node.data,
                                      config: {
                                        ...node.data.config, // 访问 node.data.config
                                        emailConfig: { 
                                          ...node.data.config?.emailConfig, 
                                          ccGroups, 
                                          cc: node.data.config?.emailConfig?.cc, 
                                          recipients: node.data.config?.emailConfig?.recipients || [] 
                                        } as any
                                      }
                                    }
                                  });
                                }}
                                className="hover:bg-blue-200 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
                  <input
                    type="text"
                    value={node.data.config?.emailConfig?.subject || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="邮件主题模板"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            emailConfig: {
                              ...node.data.config?.emailConfig, // 访问 node.data.config
                              subject: e.target.value,
                              recipients: node.data.config?.emailConfig?.recipients || [] // 访问 node.data.config
                            } as any
                          }
                        }
                      });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">支持变量：{'{{batchNumber}}'}, {'{{equipment}}'}, {'{{exceptionType}}'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮件正文模板</label>
                  <textarea
                    value={node.data.config?.emailConfig?.bodyTemplate || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="输入邮件正文模板"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            emailConfig: {
                              ...node.data.config?.emailConfig, // 访问 node.data.config
                              bodyTemplate: e.target.value,
                              recipients: node.data.config?.emailConfig?.recipients || [] // 访问 node.data.config
                            } as any
                          }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedMethods.includes('systemMessage') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => toggleSection('systemMessage')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
            >
              <span>系统消息配置</span>
              {expandedSections.systemMessage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.systemMessage && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">接收人ID</label>
                  <input
                    type="text"
                    value={(node.data.config?.systemMessageConfig?.recipientIds || []).join(', ')} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="输入用户ID，用逗号分隔"
                    onChange={(e) => {
                      const recipientIds = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            systemMessageConfig: { ...node.data.config?.systemMessageConfig, recipientIds } as any // 访问 node.data.config
                          }
                        }
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <select
                    value={node.data.config?.systemMessageConfig?.priority || 'medium'} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            systemMessageConfig: {
                              ...node.data.config?.systemMessageConfig, // 访问 node.data.config
                              priority: e.target.value as any,
                              recipientIds: node.data.config?.systemMessageConfig?.recipientIds || [] // 访问 node.data.config
                            } as any
                          }
                        }
                      });
                    }}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">消息模板</label>
                  <textarea
                    value={node.data.config?.systemMessageConfig?.messageTemplate || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="输入系统消息模板"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            systemMessageConfig: {
                              ...node.data.config?.systemMessageConfig, // 访问 node.data.config
                              messageTemplate: e.target.value,
                              recipientIds: node.data.config?.systemMessageConfig?.recipientIds || [] // 访问 node.data.config
                            } as any
                          }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedMethods.includes('oa') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => toggleSection('oa')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
            >
              <span>OA系统配置</span>
              {expandedSections.oa ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.oa && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工作流类型</label>
                  <input
                    type="text"
                    value={node.data.config?.oaConfig?.workflowType || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：异常处理审批流程"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            oaConfig: { ...node.data.config?.oaConfig, workflowType: e.target.value } as any // 访问 node.data.config
                          }
                        }
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">审批链</label>
                  <input
                    type="text"
                    value={(node.data.config?.oaConfig?.approvalChain || []).join(' -> ')} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="输入审批人，用 -> 分隔"
                    onChange={(e) => {
                      const approvalChain = e.target.value.split('->').map(s => s.trim()).filter(s => s);
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            oaConfig: { ...node.data.config?.oaConfig, approvalChain } as any // 访问 node.data.config
                          }
                        }
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OA系统端点</label>
                  <input
                    type="text"
                    value={node.data.config?.oaConfig?.endpoint || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://oa.company.com/api/workflow"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            oaConfig: { ...node.data.config?.oaConfig, endpoint: e.target.value } as any // 访问 node.data.config
                          }
                        }
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">请求载荷模板</label>
                  <textarea
                    value={node.data.config?.oaConfig?.payloadTemplate || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    rows={4}
                    placeholder='{"workflowId": "{{workflowId}}", "data": {...}}'
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            oaConfig: { ...node.data.config?.oaConfig, payloadTemplate: e.target.value } as any // 访问 node.data.config
                          }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedMethods.includes('sms') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => toggleSection('sms')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
            >
              <span>短信通知配置</span>
              {expandedSections.sms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.sms && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
                  <input
                    type="text"
                    value={(node.data.config?.smsConfig?.phoneNumbers || []).join(', ')} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="输入手机号码，用逗号分隔"
                    onChange={(e) => {
                      const phoneNumbers = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            smsConfig: { ...node.data.config?.smsConfig, phoneNumbers } as any // 访问 node.data.config
                          }
                        }
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">短信模板</label>
                  <textarea
                    value={node.data.config?.smsConfig?.messageTemplate || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="输入短信内容模板"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            smsConfig: {
                              ...node.data.config?.smsConfig, // 访问 node.data.config
                              messageTemplate: e.target.value,
                              phoneNumbers: node.data.config?.smsConfig?.phoneNumbers || [] // 访问 node.data.config
                            } as any
                          }
                        }
                      });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">短信长度限制：70个字符</p>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedMethods.includes('webhook') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => toggleSection('webhook')}
              className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
            >
              <span>Webhook配置</span>
              {expandedSections.webhook ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.webhook && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                  <input
                    type="text"
                    value={node.data.config?.webhookConfig?.url || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://api.example.com/webhook"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            webhookConfig: { ...node.data.config?.webhookConfig, url: e.target.value } as any // 访问 node.data.config
                          }
                        }
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HTTP方法</label>
                  <select
                    value={node.data.config?.webhookConfig?.method || 'POST'} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            webhookConfig: {
                              ...node.data.config?.webhookConfig, // 访问 node.data.config
                              method: e.target.value as any,
                              url: node.data.config?.webhookConfig?.url || '' // 访问 node.data.config
                            } as any
                          }
                        }
                      });
                    }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">请求载荷模板</label>
                  <textarea
                    value={node.data.config?.webhookConfig?.payloadTemplate || ''} // 访问 node.data.config
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    rows={4}
                    placeholder='{"event": "anomaly_detected", "data": {...}}'
                    onChange={(e) => {
                      onUpdateNode({
                        ...node,
                        data: { // 更新 node.data
                          ...node.data,
                          config: {
                            ...node.data.config, // 访问 node.data.config
                            webhookConfig: {
                              ...node.data.config?.webhookConfig, // 访问 node.data.config
                              payloadTemplate: e.target.value,
                              url: node.data.config?.webhookConfig?.url || '' // 访问 node.data.config
                            } as any
                          }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">发送时机</label>
          <select
            value={node.data.config?.notificationTiming || 'immediate'} // 访问 node.data.config
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: { ...node.data.config, notificationTiming: e.target.value as any } // 访问 node.data.config
                }
              });
            }}
          >
            <option value="immediate">立即发送</option>
            <option value="scheduled">定时发送</option>
          </select>
        </div>

        {node.data.config?.notificationTiming === 'scheduled' && ( // 访问 node.data.config
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">定时时间</label>
            <input
              type="datetime-local"
              value={node.data.config?.scheduledTime || ''} // 访问 node.data.config
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                onUpdateNode({
                  ...node,
                  data: { // 更新 node.data
                    ...node.data,
                    config: { ...node.data.config, scheduledTime: e.target.value } // 访问 node.data.config
                  }
                });
              }}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">重试次数</label>
          <input
            type="number"
            min="0"
            max="10"
            value={node.data.config?.retryAttempts || 3} // 访问 node.data.config
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: { ...node.data.config, retryAttempts: parseInt(e.target.value) } // 访问 node.data.config
                }
              });
            }}
          />
          <p className="text-xs text-gray-500 mt-1">发送失败时的最大重试次数</p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={node.data.config?.escalationRules?.enabled || false} // 访问 node.data.config
              onChange={(e) => {
                onUpdateNode({
                  ...node,
                  data: { // 更新 node.data
                    ...node.data,
                    config: {
                      ...node.data.config, // 访问 node.data.config
                      escalationRules: {
                        ...node.data.config?.escalationRules, // 访问 node.data.config
                        enabled: e.target.checked,
                        timeoutMinutes: node.data.config?.escalationRules?.timeoutMinutes || 30, // 访问 node.data.config
                        escalateTo: node.data.config?.escalationRules?.escalateTo || [] // 访问 node.data.config
                      }
                    }
                  }
                });
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">启用升级规则</span>
          </label>

          {node.data.config?.escalationRules?.enabled && ( // 访问 node.data.config
            <div className="space-y-3 ml-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">超时时间（分钟）</label>
                <input
                  type="number"
                  min="1"
                  value={node.data.config?.escalationRules?.timeoutMinutes || 30} // 访问 node.data.config
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    onUpdateNode({
                      ...node,
                      data: { // 更新 node.data
                        ...node.data,
                        config: {
                          ...node.data.config, // 访问 node.data.config
                          escalationRules: {
                            ...node.data.config?.escalationRules, // 访问 node.data.config
                            enabled: true,
                            timeoutMinutes: parseInt(e.target.value),
                            escalateTo: node.data.config?.escalationRules?.escalateTo || [] // 访问 node.data.config
                          }
                        }
                      }
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">升级至</label>
                <input
                  type="text"
                  value={(node.data.config?.escalationRules?.escalateTo || []).join(', ')} // 访问 node.data.config
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="输入升级对象，用逗号分隔"
                  onChange={(e) => {
                    const escalateTo = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    onUpdateNode({
                      ...node,
                      data: { // 更新 node.data
                        ...node.data,
                        config: {
                          ...node.data.config, // 访问 node.data.config
                          escalationRules: {
                            ...node.data.config?.escalationRules, // 访问 node.data.config
                            enabled: true,
                            timeoutMinutes: node.data.config?.escalationRules?.timeoutMinutes || 30, // 访问 node.data.config
                            escalateTo: escalateTo // FIX: Use explicit assignment instead of shorthand
                          }
                        }
                      }
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotifyPersonnelActionConfig;