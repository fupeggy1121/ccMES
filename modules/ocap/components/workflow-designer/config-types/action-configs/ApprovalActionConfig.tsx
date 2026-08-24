// src/components/workflow-designer/config-types/action-configs/ApprovalActionConfig.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Node as RFNode } from 'reactflow'; // 导入 RFNode
import { WorkflowNodeData } from '../../../../types/workflow'; // 导入 WorkflowNodeData
import { useFormTemplates } from '../../../../hooks/useFormTemplates';
import { FileText, ExternalLink } from 'lucide-react';

interface ApprovalActionConfigProps {
  node: RFNode<WorkflowNodeData>; // 修改类型
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void; // 修改类型
}

const ApprovalActionConfig: React.FC<ApprovalActionConfigProps> = ({ node, onUpdateNode }) => {
  const { templates: formTemplates, loading: formTemplatesLoading } = useFormTemplates();

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
    const selectedTemplate = formTemplates.find(t => t.id === node.data.config?.formTemplateId); // 访问 node.data.config

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
                value={node.data.config?.formTemplateId || ''} // 访问 node.data.config
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedTemplate = formTemplates.find(t => t.id === selectedId);
                  onUpdateNode({
                    ...node,
                    data: { // 更新 node.data
                      ...node.data,
                      config: {
                        ...node.data.config, // 访问 node.data.config
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
                          data: { // 更新 node.data
                            ...node.data,
                            config: {
                              ...node.data.config, // 访问 node.data.config
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">审批人</label>
        <select
          value={node.data.config?.approvers?.[0] || ''} // 访问 node.data.config
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
                ...node.data,
                config: {
                  ...node.data.config, // 访问 node.data.config
                  approvers: [e.target.value]
                }
              }
            });
          }}
        >
          <option value="">请选择审批人</option>
          <option value="production_manager">生产经理</option>
          <option value="quality_manager">质量经理</option>
          <option value="maintenance_manager">维护经理</option>
          <option value="engineering_manager">工程经理</option>
          <option value="department_head">部门主管</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">超时时间（秒）</label>
        <input
          type="number"
          min="60"
          value={node.data.config?.timeout || 300} // 访问 node.data.config
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
                ...node.data,
                config: { ...node.data.config, timeout: parseInt(e.target.value) } // 访问 node.data.config
              }
            });
          }}
        />
        <p className="text-xs text-gray-500 mt-1">审批超时后将自动升级或采取默认动作</p>
      </div>

      {renderFormTemplateSelector()}
    </div>
  );
};

export default ApprovalActionConfig;
