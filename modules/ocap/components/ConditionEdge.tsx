import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from 'reactflow';

const ConditionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
  selected, // 接收 selected 属性
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style} // 保留 style prop，以便 React Flow 内部的其他样式可以合并
        className={selected ? 'stroke-orange-500 stroke-[4px]' : 'stroke-gray-300 stroke-[3px]'} // 根据 selected 状态应用条件类
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: 12,
              fontWeight: 700,
              pointerEvents: 'all',
              border: '1px solid #e5e7eb', // Light gray border
              color: '#4b5563', // Darker gray text
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default ConditionEdge;
