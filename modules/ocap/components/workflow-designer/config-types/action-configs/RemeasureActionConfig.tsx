// src/components/workflow-designer/config-types/action-configs/RemeasureActionConfig.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Node as RFNode } from 'reactflow'; // 导入 RFNode
import { WorkflowNodeData } from '../../../../types/workflow'; // 导入 WorkflowNodeData
import { useFormTemplates } from '../../../../hooks/useFormTemplates';
import { FileText, ExternalLink } from 'lucide-react';

interface RemeasureActionConfigProps {
  node: RFNode<WorkflowNodeData>; // 修改类型
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void; // 修改类型
}

const RemeasureActionConfig: React.FC<RemeasureActionConfigProps> = ({ node, onUpdateNode }) => {
  const { templates: formTemplates, loading: formTemplatesLoading } = useFormTemplates();

  // 初始化 retestObject
  useEffect(() => {
    if (!node.data.config?.retestObject) { // 访问 node.data.config
      onUpdateNode({
        ...node,
        data: { // 更新 node.data
          ...node.data,
          config: {
            ...node.data.config, // 访问 node.data.config
            retestObject: 'anomaly_sample'
          }
        }
      });
    }
  }, [node.data.config?.retestObject]); // 访问 node.data.config

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
      {/* 复测对象 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">复测对象</label>
        <select
          value={node.data.config?.retestObject || 'anomaly_sample'} // 访问 node.data.config
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
                ...node.data,
                config: { ...node.data.config, retestObject: e.target.value } // 访问 node.data.config
              }
            });
          }}
        >
          <option value="anomaly_sample">异常样本</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      {/* 样本选择规则 - 仅在复测对象为自定义时显示 */}
      {node.data.config?.retestObject === 'custom' && ( // 访问 node.data.config
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">样本选择规则</label>
          <select
            value={node.data.config?.sampleSelectionRule || 'all_batch_samples'} // 访问 node.data.config
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: { ...node.data.config, sampleSelectionRule: e.target.value } // 访问 node.data.config
                }
              });
            }}
          >
            <option value="all_batch_samples">所有批次样本</option>
            <option value="same_batch_samples">同批次样本</option>
            <option value="specific_sample_id">指定样本ID</option>
          </select>
        </div>
      )}

      {/* 复测路径 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">复测路径</label>
        <select
          value={node.data.config?.remeasurementPath || 'anomaly_source_station_same_equipment'} // 访问 node.data.config
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
                ...node.data,
                config: { ...node.data.config, remeasurementPath: e.target.value } // 访问 node.data.config
              }
            });
          }}
        >
          <option value="anomaly_source_station_same_equipment">异常参数来源测量站点/同设备</option>
        </select>
      </div>

      {/* 测量参数 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">测量参数</label>
        <select
          value={node.data.config?.measurementParameter || 'anomaly_parameter'} // 访问 node.data.config
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
                ...node.data,
                config: { ...node.data.config, measurementParameter: e.target.value } // 访问 node.data.config
              }
            });
          }}
        >
          <option value="anomaly_parameter">异常参数</option>
          <option value="anomaly_parameter_group">异常参数组</option>
        </select>
      </div>

      {renderFormTemplateSelector()}
    </div>
  );
};

export default RemeasureActionConfig;
 