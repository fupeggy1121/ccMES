// src/components/CustomWorkflowNode.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNodeData } from '../types/workflow';
import { Play, Diamond, Square } from 'lucide-react';
import { cn } from '../utils/cn'; // 导入 cn 工具函数

// 定义节点类型配置，用于显示图标和颜色
const nodeTypeConfigs = {
  start: { icon: Play, color: 'bg-green-500' },
  condition: { icon: Diamond, color: 'bg-yellow-500' },
  action: { icon: Square, color: 'bg-blue-500' },
  end: { icon: Square, color: 'bg-red-500' },
};

const CustomWorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ id, data, selected }) => {
  // 根据 isProcessEnd 状态动态确定节点类型
  const effectiveNodeType = data.config?.isProcessEnd ? 'end' : data.type;
  const config = nodeTypeConfigs[effectiveNodeType as keyof typeof nodeTypeConfigs];
  const Icon = config ? config.icon : Square; // 默认图标

  const isConditionNode = effectiveNodeType === 'condition';
  const isEndNode = effectiveNodeType === 'end';

  return (
    <div
      className={cn(
        `shadow-md text-white flex flex-col items-center justify-center`,
        selected ? 'border-4 border-orange-500' : 'border-2 border-gray-200',
        config ? config.color : 'bg-gray-500',
        isConditionNode
          ? 'w-[180px] h-[100px] [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]' // 菱形样式
          : isEndNode
            ? 'w-[120px] h-[120px] rounded-full' // 圆形样式，固定宽高
            : 'px-4 py-2 rounded-md min-w-[120px] min-h-[80px]' // 其他节点的默认样式
      )}
    >
      <div className="text-sm font-semibold text-center">
        {data.title}
      </div>

      {/* Handles */}
      {/* 顶部锚点 (Target) */}
      {effectiveNodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          id="top-target"
          className="w-3 h-3 bg-white border-2 border-blue-500"
        />
      )}
      {/* 底部锚点 (Source) */}
      {effectiveNodeType !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          className="w-3 h-3 bg-white border-2 border-blue-500"
        />
      )}

      {/* 左侧锚点 (Target) */}
      {effectiveNodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Left}
          id="left-target"
          className="w-3 h-3 bg-white border-2 border-blue-500"
        />
      )}
      {/* 右侧锚点 (Source) */}
      {effectiveNodeType !== 'end' && (
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className="w-3 h-3 bg-white border-2 border-blue-500"
        />
      )}
    </div>
  );
};

export default CustomWorkflowNode;