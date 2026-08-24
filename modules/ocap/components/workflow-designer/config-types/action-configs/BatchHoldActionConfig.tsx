// src/components/workflow-designer/config-types/action-configs/BatchHoldActionConfig.tsx
import React from 'react';
import { Node as RFNode } from 'reactflow'; // 导入 RFNode
import { WorkflowNodeData } from '../../../../types/workflow'; // 导入 WorkflowNodeData

interface BatchHoldActionConfigProps {
  node: RFNode<WorkflowNodeData>; // 修改类型
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void; // 修改类型
}

const BatchHoldActionConfig: React.FC<BatchHoldActionConfigProps> = ({ node, onUpdateNode }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">扣留备注内容</label>
        <textarea
          value={node.data.config?.holdRemarks || ''} // 绑定到新的 holdRemarks 属性
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="请输入批次扣留的详细备注内容"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
                ...node.data,
                config: { ...node.data.config, holdRemarks: e.target.value } // 更新 holdRemarks 属性
              }
            });
          }}
        />
        <p className="text-xs text-gray-500 mt-1">详细说明批次扣留的原因和后续处理建议</p>
      </div>
    </div>
  );
};

export default BatchHoldActionConfig;
