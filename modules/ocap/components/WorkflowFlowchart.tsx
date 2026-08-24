import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Save, Settings, AlertTriangle, Activity, PenTool as Tool, Bell, CheckSquare, FileSearch } from 'lucide-react';

const initialNodes: Node[] = [
  {
    id: 'ecap-flow',
    type: 'input',
    position: { x: 250, y: 0 },
    data: { label: 'eCAP Generic Flow' },
    style: { background: '#10B981', color: 'white', borderRadius: '4px', width: 200 }
  },
  {
    id: 'auto-analysis',
    position: { x: 250, y: 100 },
    data: { label: 'Auto Analysis' },
    style: { background: '#3B82F6', color: 'white', borderRadius: '4px', width: 200 }
  }
];

const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'ecap-flow',
    target: 'auto-analysis',
    type: 'smoothstep'
  }
];

const nodeTypes = {
  decision: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-gray-200">
      <div className="flex items-center">
        <AlertTriangle size={16} className="mr-2 text-yellow-500" />
        <div className="text-sm">{data.label}</div>
      </div>
    </div>
  ),
  action: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-gray-200">
      <div className="flex items-center">
        <Activity size={16} className="mr-2 text-blue-500" />
        <div className="text-sm">{data.label}</div>
      </div>
    </div>
  )
};

const WorkflowFlowchart = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: type === 'decision' ? 'decision' : 'action',
      position: { x: 250, y: (nodes.length + 1) * 100 },
      data: { label: getNodeLabel(type) },
      style: { width: 200 }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getNodeLabel = (type: string): string => {
    switch (type) {
      case 'remeasurement':
        return 'Do Remeasurement?';
      case 'hold':
        return 'Do Auto Hold Lot?';
      case 'inhibit':
        return 'Do Auto Inhibit Tool?';
      case 'notify':
        return 'Notify Users';
      case 'analysis':
        return 'Extended Analysis';
      case 'action':
        return 'Final Lot Actions';
      default:
        return 'New Node';
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-sm">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 mb-3">添加节点</h3>
            <button
              onClick={() => addNode('remeasurement')}
              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-50"
            >
              <AlertTriangle size={16} className="mr-2 text-yellow-500" />
              重测判断
            </button>
            <button
              onClick={() => addNode('hold')}
              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-50"
            >
              <Tool size={16} className="mr-2 text-blue-500" />
              批次暂停
            </button>
            <button
              onClick={() => addNode('inhibit')}
              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-50"
            >
              <Tool size={16} className="mr-2 text-red-500" />
              设备禁用
            </button>
            <button
              onClick={() => addNode('notify')}
              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-50"
            >
              <Bell size={16} className="mr-2 text-purple-500" />
              通知相关人员
            </button>
            <button
              onClick={() => addNode('analysis')}
              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-50"
            >
              <FileSearch size={16} className="mr-2 text-green-500" />
              扩展分析
            </button>
            <button
              onClick={() => addNode('action')}
              className="flex items-center w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-50"
            >
              <CheckSquare size={16} className="mr-2 text-indigo-500" />
              最终处置
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Node Settings Modal */}
      {showSettings && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">节点配置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">节点名称</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const newNodes = nodes.map(node =>
                      node.id === selectedNode.id
                        ? { ...node, data: { ...node.data, label: e.target.value } }
                        : node
                    );
                    setNodes(newNodes);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">超时设置</label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="number"
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="24"
                  />
                  <span className="text-gray-500">小时</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">通知方式</label>
                <div className="mt-1 space-y-2">
                  <label className="inline-flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="ml-2 text-sm text-gray-700">邮件通知</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="ml-2 text-sm text-gray-700">系统消息</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="ml-2 text-sm text-gray-700">短信通知</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowFlowchart;