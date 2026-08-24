import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap, Panel, useReactFlow, Node as RFNode, Edge as RFEdge, OnNodesChange, OnEdgesChange, OnConnect, MarkerType, Connection, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomWorkflowNode from "./CustomWorkflowNode";
import ConditionEdge from './ConditionEdge'; // 导入自定义边组件
import { WorkflowTemplate, WorkflowNodeData } from '../types/workflow';
import { NodeConfigPanel } from './workflow-designer';
import { Plus, Play,  X,Diamond, Square } from 'lucide-react';
import { cn } from '../utils/cn'; // 确保导入 cn 工具函数

const nodeTypesMap = {
  start: CustomWorkflowNode,
  condition: CustomWorkflowNode,
  action: CustomWorkflowNode,
  end: CustomWorkflowNode,
};

// 定义自定义边类型
const edgeTypesMap = {
  condition: ConditionEdge,
};

const sidebarNodeTypes = [
  { type: 'start', title: '开始节点', icon: Play, color: 'bg-green-500', description: '工作流开始', shapeClass: 'rounded-lg' },
  { type: 'condition', title: '条件判断', icon: Diamond, color: 'bg-yellow-500', description: '根据条件分支', shapeClass: '[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]' },
  { type: 'action', title: '执行动作', icon: Square, color: 'bg-blue-500', description: '执行各种自动化操作', shapeClass: 'rounded-lg' },
  { type: 'end', title: '结束节点', icon:  X, color: 'bg-red-500', description: '工作流结束', shapeClass: 'rounded-full' }
];

interface WorkflowDesignerProps {
  template: WorkflowTemplate;
  nodes: RFNode<WorkflowNodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<RFNode<WorkflowNodeData>[]>>;
  onNodesChange: OnNodesChange;
  edges: RFEdge[];
  setEdges: React.Dispatch<React.SetStateAction<RFEdge[]>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
}

const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  template,
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
  onConnect: onConnectProp, // 重命名 prop 以避免冲突
  onUpdateNode,
  onDeleteNode,
}) => {
  const [selectedRFNode, setSelectedRFNode] = useState<RFNode<WorkflowNodeData> | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const handleNodeClick = useCallback((event: React.MouseEvent, node: RFNode<WorkflowNodeData>) => {
    setSelectedRFNode(node);
    setIsConfigPanelOpen(true);
  }, []);

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const reactFlowBounds = e.currentTarget.getBoundingClientRect();
    const type = e.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type) {
      return;
    }

    const position = screenToFlowPosition({
      x: e.clientX - reactFlowBounds.left,
      y: e.clientY - reactFlowBounds.top,
    });

    // 根据节点类型创建基础节点数据
    let newNodeData: WorkflowNodeData = {
      title: sidebarNodeTypes.find(n => n.type === type)?.title || '新节点',
      description: sidebarNodeTypes.find(n => n.type === type)?.description || '',
      config: {},
      type: type as WorkflowNodeData['type'],
    };

    // 特殊处理：如果是 action 类型
    if (type === 'action') {
      // 创建默认配置对象
      const defaultConfig: any = {};
      
      // 随机决定是批次释放还是设备释放（可以根据实际需求调整）
      const releaseType = Math.random() > 0.5 ? 'batchRelease' : 'equipmentRelease';
      defaultConfig.actionType = releaseType;
      
      // 根据释放类型设置不同的标题和描述
      if (releaseType === 'batchRelease') {
        newNodeData = {
          ...newNodeData,
          title: '批次释放',
          description: '释放扣留批次，并记录详细备注',
          config: defaultConfig,
        };
      } else if (releaseType === 'equipmentRelease') {
        newNodeData = {
          ...newNodeData,
          title: '设备释放',
          description: '释放扣留设备，并记录详细备注',
          config: defaultConfig,
        };
      }
    }

    const newNode: RFNode<WorkflowNodeData> = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: newNodeData,
    };

    setNodes((nds) => {
      const updatedNodes = nds.concat(newNode);
      return updatedNodes;
    });

    requestAnimationFrame(() => {
      fitView();
    });
  }, [screenToFlowPosition, setNodes, fitView]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleUpdateNodeInternal = useCallback((updatedNode: RFNode<WorkflowNodeData>) => {
    onUpdateNode(updatedNode);
    setSelectedRFNode(updatedNode);
  }, [onUpdateNode]);

  const handleDeleteNodeInternal = useCallback((nodeId: string) => {
    onDeleteNode(nodeId);
    setIsConfigPanelOpen(false);
    setSelectedRFNode(null);
  }, [onDeleteNode]);

  const onReactFlowInit = useCallback((reactFlowInstance: any) => {
    reactFlowInstance.fitView();
  }, []);

  // 自定义 onConnect 函数，用于处理边的创建和标签设置
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      let edgeType: string = 'smoothstep';
      let edgeData: { label?: string } = {};

      if (sourceNode && sourceNode.type === 'condition' && sourceNode.data.config?.branchMappings) {
        const branchMapping = sourceNode.data.config.branchMappings.find(
          (mapping) => mapping.targetNodeId === params.target
        );
        if (branchMapping) {
          edgeType = 'condition';
          edgeData.label = branchMapping.result;
        }
      }

      const newEdge: RFEdge = {
        ...params,
        type: edgeType,
        data: edgeData,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        // 移除 style 属性，让 ConditionEdge 组件完全控制样式
        // style: {
        //   strokeWidth: 3,
        //   stroke: '#D1D5DB',
        // },
      };
      return addEdge(newEdge, eds);
    });
  }, [nodes, setEdges]);


  return (
    <div className="h-full bg-gray-50 flex">
      <div className="flex-1 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} // 使用自定义的 onConnect
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypesMap}
          edgeTypes={edgeTypesMap} // 注册自定义边类型
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            // 移除 style 属性，让 ConditionEdge 组件完全控制样式
            // style: {
            //   strokeWidth: 3,
            //   stroke: '#D1D5DB',
            // },
          }}
          fitView
          fitViewOptions={{ padding: 0.1, maxZoom: 0.9 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onInit={onReactFlowInit}
        >
          <Background />
          <Controls />
          <MiniMap />

          <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-sm">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700 mb-3">添加节点</h3>
              {sidebarNodeTypes.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <div
                    key={nodeType.type}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeType.type)}
                  >
                    <div className={cn(
                      "w-10 h-10",
                      nodeType.color,
                      "flex items-center justify-center mr-3",
                      nodeType.shapeClass
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{nodeType.title}</h4>
                      <p className="text-xs text-gray-600">{nodeType.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {isConfigPanelOpen && selectedRFNode && (
        <NodeConfigPanel
          selectedNode={selectedRFNode}
          allNodes={nodes}
          allEdges={edges}
          nodeTypes={sidebarNodeTypes}
          onUpdateNode={handleUpdateNodeInternal}
          onDeleteNode={handleDeleteNodeInternal}
          onClose={() => setIsConfigPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default WorkflowDesigner;