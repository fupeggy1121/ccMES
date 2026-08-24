import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Node as RFNode } from 'reactflow';
import { WorkflowNodeData } from '../../../types/workflow';
import MultiSelectDropdown from '../../MultiSelectDropdown'; // 导入 MultiSelectDropdown
import { availableRoles } from '../../../constants/roles'; // 导入角色列表

interface ConditionNodeConfigProps {
  node: RFNode<WorkflowNodeData>;
  allNodes: RFNode<WorkflowNodeData>[];
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void;
}

const ConditionNodeConfig: React.FC<ConditionNodeConfigProps> = ({ node, allNodes, onUpdateNode }) => {
  return (
    <div className="space-y-4">
      {/* 基础信息标题 */}
      <h3 className="text-base font-semibold text-gray-800 mb-3">基础信息</h3>
      
      {/* 节点名称和描述 */}
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
          rows={3}
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

      {/* 执行参数标题 */}
      <h3 className="text-base font-semibold text-gray-800 mb-3">执行参数</h3>

      {/* 条件表达式配置 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">条件表达式</label>
          <button
            type="button"
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            onClick={() => {
              const newCondition = {
                expression: '',
                resultLabel: '新条件'
              };
              
              onUpdateNode({
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    conditionExpressions: [
                      ...(node.data.config?.conditionExpressions || []),
                      newCondition
                    ],
                    branchMappings: [
                      ...(node.data.config?.branchMappings || []),
                      {
                        result: newCondition.resultLabel,
                        targetNodeId: ''
                      }
                    ]
                  }
                }
              });
            }}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            添加条件
          </button>
        </div>
        
        <div className="space-y-3">
          {node.data.config?.conditionExpressions?.map((condition: any, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  value={condition.resultLabel}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded mr-2"
                  placeholder="结果标签"
                  onChange={(e) => {
                    const updatedConditions = [...(node.data.config?.conditionExpressions || [])];
                    updatedConditions[index] = {
                      ...updatedConditions[index],
                      resultLabel: e.target.value
                    };
                    
                    const updatedBranchMappings = node.data.config?.branchMappings?.map(mapping =>
                      mapping.result === condition.resultLabel 
                        ? { ...mapping, result: e.target.value }
                        : mapping
                    );
                    
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        config: {
                          ...node.data.config,
                          conditionExpressions: updatedConditions,
                          branchMappings: updatedBranchMappings
                        }
                      }
                    });
                  }}
                />
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => {
                    const updatedConditions = node.data.config?.conditionExpressions?.filter(
                      (_, i) => i !== index
                    );
                    
                    const updatedBranchMappings = node.data.config?.branchMappings?.filter(
                      mapping => mapping.result !== condition.resultLabel
                    );
                    
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        config: {
                          ...node.data.config,
                          conditionExpressions: updatedConditions,
                          branchMappings: updatedBranchMappings
                        }
                      }
                    });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">表达式</label>
                <input
                  type="text"
                  value={condition.expression}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                  placeholder="例如: severity == 'high'"
                  onChange={(e) => {
                    const updatedConditions = [...(node.data.config?.conditionExpressions || [])];
                    updatedConditions[index] = {
                      ...updatedConditions[index],
                      expression: e.target.value
                    };
                    
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        config: {
                          ...node.data.config,
                          conditionExpressions: updatedConditions
                        }
                      }
                    });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分支映射配置 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">分支映射</label>
        <div className="space-y-3">
          {node.data.config?.branchMappings?.map((mapping: any, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-700 flex-1">
                  {mapping.result}
                </span>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">目标节点</label>
                <select
                  value={mapping.targetNodeId}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  onChange={(e) => {
                    const updatedMappings = [...(node.data.config?.branchMappings || [])];
                    updatedMappings[index] = {
                      ...updatedMappings[index],
                      targetNodeId: e.target.value
                    };
                    
                    onUpdateNode({
                      ...node,
                      data: {
                        ...node.data,
                        config: {
                          ...node.data.config,
                          branchMappings: updatedMappings
                        }
                      }
                    });
                  }}
                >
                  <option value="">选择目标节点</option>
                  {allNodes
                    .filter(n => n.id !== node.id)
                    .map(n => (
                      <option key={n.id} value={n.id}>
                        {n.data.title} ({n.id})
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConditionNodeConfig;