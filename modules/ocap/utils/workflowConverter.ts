// src/utils/workflowConverter.ts

import { Node as RFNode, Edge as RFEdge, XYPosition } from 'reactflow';
import { WorkflowNode, WorkflowNodeData, WorkflowConnection } from '../types/workflow'; // 导入 WorkflowConnection

/**
 * 将自定义工作流节点数组转换为 React Flow 兼容的节点和边
 * @param customNodes 自定义的工作流节点数组
 * @returns 包含 nodes 和 edges 的对象
 */
export function convertCustomWorkflowToReactFlow(
  customNodes: WorkflowNode[]
): { nodes: RFNode<WorkflowNodeData>[]; edges: RFEdge[] } {
  const nodes: RFNode<WorkflowNodeData>[] = [];
  const edges: RFEdge[] = [];

  customNodes.forEach((node) => {
    const { id, position, type, title, description, config, connections, ...otherNodeProps } = node;
    
    const rfNode: RFNode<WorkflowNodeData> = {
      id,
      position,
      type: type,
      data: {
        type: type,
        title: title,
        description: description,
        config: config,
        ...otherNodeProps,
      },
    };

    nodes.push(rfNode);

    // 转换连接 (WorkflowConnection[]) 为边
    if (connections && Array.isArray(connections)) {
      connections.forEach((conn: WorkflowConnection) => { // 遍历 WorkflowConnection 对象
        const edgeId = `${node.id}-${conn.targetNodeId}`;
        
        let edgeType: string = 'smoothstep';
        let edgeData: { label?: string } = {};

        // 如果源节点是条件判断节点，尝试从 branchMappings 中获取标签
        if (node.type === 'condition' && node.config?.branchMappings) {
          const branchMapping = node.config.branchMappings.find(
            (mapping) => mapping.targetNodeId === conn.targetNodeId
          );
          if (branchMapping) {
            edgeType = 'condition'; // 使用自定义边类型
            edgeData.label = branchMapping.result;
          }
        }

        const edge: RFEdge = {
          id: edgeId,
          source: node.id,
          target: conn.targetNodeId,
          type: edgeType, // 使用动态确定的边类型
          sourceHandle: conn.sourceHandleId, // 使用指定的源锚点ID
          targetHandle: conn.targetHandleId, // 使用指定的目标锚点ID
          data: edgeData, // 传递标签数据
        };
        edges.push(edge);
      });
    }
  });

  return { nodes, edges };
}

/**
 * 将 React Flow 节点和边转换回自定义工作流格式
 * @param nodes React Flow 节点数组
 * @param edges React Flow 边数组
 * @returns 自定义的工作流节点数组
 */
export function convertReactFlowToCustomWorkflow(
  nodes: RFNode<WorkflowNodeData>[],
  edges: RFEdge[]
): WorkflowNode[] {
  return nodes.map((node) => {
    const customNode: WorkflowNode = {
      id: node.id,
      position: node.position,
      type: node.data.type,
      title: node.data.title,
      description: node.data.description,
      config: node.data.config,
      // 重建 connections 数组为 WorkflowConnection[]
      connections: edges
        .filter((edge) => edge.source === node.id)
        .map((edge) => ({
          targetNodeId: edge.target,
          sourceHandleId: edge.sourceHandle || undefined, // 存储源锚点ID
          targetHandleId: edge.targetHandle || undefined, // 存储目标锚点ID
        })),
    };

    return customNode;
  });
}

// 默认导出主要转换函数
export default convertCustomWorkflowToReactFlow;
