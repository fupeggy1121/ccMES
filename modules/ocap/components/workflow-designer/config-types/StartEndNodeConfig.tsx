import React from 'react';
import { Node as RFNode } from 'reactflow'; // 导入 RFNode
import { WorkflowNodeData } from '../../../types/workflow'; // 导入 WorkflowNodeData

interface StartEndNodeConfigProps {
  node: RFNode<WorkflowNodeData>; // 修改类型
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void; // 修改类型
}

const StartEndNodeConfig: React.FC<StartEndNodeConfigProps> = ({ node, onUpdateNode }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">节点名称</label>
        <input
          type="text"
          value={node.data.title} // 访问 node.data.title
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
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
          value={node.data.description || ''} // 访问 node.data.description
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          onChange={(e) => {
            onUpdateNode({
              ...node,
              data: { // 更新 node.data
                ...node.data,
                description: e.target.value
              }
            });
          }}
        />
      </div>
    </div>
  );
};

export default StartEndNodeConfig;
