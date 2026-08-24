import React from 'react';
import { Trash2 } from 'lucide-react';
import { Node as RFNode } from 'reactflow';
import { WorkflowNodeData } from '../../types/workflow';
import StartEndNodeConfig from './config-types/StartEndNodeConfig';
import ActionNodeConfig from './config-types/ActionNodeConfig';
import ConditionNodeConfig from './config-types/ConditionNodeConfig';

interface NodeType {
  type: string;
  title: string;
  icon: any;
  color: string;
  description: string;
}

interface NodeConfigPanelProps {
  selectedNode: RFNode<WorkflowNodeData> | null;
  allNodes: RFNode<WorkflowNodeData>[];
  allEdges: RFEdge[];
  nodeTypes: NodeType[];
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  allNodes,
  allEdges,
  nodeTypes,
  onUpdateNode,
  onDeleteNode,
  onClose
}) => {
  if (!selectedNode) return null;

  const getNodeTypeText = (node: RFNode<WorkflowNodeData>) => {
    const nodeType = nodeTypes.find(t => t.type === node.type);
    return nodeType ? nodeType.title : '未知节点';
  };

  const renderNodeConfig = () => {
    switch (selectedNode.type) {
      case 'start':
      case 'end':
        return <StartEndNodeConfig node={selectedNode} onUpdateNode={onUpdateNode} />;
      case 'action':
        return <ActionNodeConfig node={selectedNode} allEdges={allEdges} onUpdateNode={onUpdateNode} />;
      case 'condition':
        return <ConditionNodeConfig node={selectedNode} allNodes={allNodes} onUpdateNode={onUpdateNode} />;
      default:
        return <StartEndNodeConfig node={selectedNode} onUpdateNode={onUpdateNode} />;
    }
  };

  return (
    <div className="w-80 bg-white shadow-md border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">节点配置</h3>
          <p className="text-sm text-gray-600 mt-1">节点类型：{getNodeTypeText(selectedNode)}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button 
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          删除节点
        </button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        {renderNodeConfig()}
      </div>
    </div>
  );
};

export default NodeConfigPanel;