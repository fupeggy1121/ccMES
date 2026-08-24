import { WorkflowNode } from '../types/workflow';

export const temperatureWorkflow: WorkflowNode[] = [
  {
    id: 'temp-1',
    type: 'start',
    title: '温度异常触发', 
    description: '系统检测到温度超标',
    position: { x: 408, y: 90 },
    // 修改 connections 指向新的确认异常告警节点
    connections: [{ targetNodeId: 'temp-confirm', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }]
  },
  {
    id: 'temp-confirm',
    type: 'action',
    title: '确认温度异常',
    description: '确认温度异常告警信息',
    position: { x: 408, y: 220 },
    config: {
      actionType: 'confirmAlert'
    },
    // 指向 temp-2 条件节点
    connections: [{ targetNodeId: 'temp-2', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }]
  },
  {
    id: 'temp-2',
    type: 'condition',
    title: '温度偏差程度?',
    description: '判断温度超标严重程度',
    position: { x: 378, y: 350 }, // y坐标从260修改为350
    config: {
      conditionExpressions: [
        { expression: 'temp_deviation < 5', resultLabel: '轻微', description: '偏差小于5°C' },
        { expression: 'temp_deviation >= 5 && temp_deviation < 10', resultLabel: '中等', description: '偏差5-10°C' },
        { expression: 'temp_deviation >= 10', resultLabel: '严重', description: '偏差大于10°C' }
      ],
      branchMappings: [
        { result: '轻微', targetNodeId: 'temp-3' },
        { result: '中等', targetNodeId: 'temp-4' },
        { result: '严重', targetNodeId: 'temp-5' }
      ]
    },
    connections: [
      { targetNodeId: 'temp-3', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' },
      { targetNodeId: 'temp-4', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' },
      { targetNodeId: 'temp-5', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'temp-3',
    type: 'action',
    title: '记录并继续',
    description: '记录异常信息，继续生产',
    position: { x: 200, y: 540 }, // 调整y坐标保持相对位置
    config: {
      actionType: 'dataLogging'
    },
    connections: [{ targetNodeId: 'temp-end-1', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }]
  },
  {
    id: 'temp-4',
    type: 'action',
    title: '调整参数',
    description: '调整温度控制参数',
    position: { x: 406, y: 540 }, // 调整y坐标保持相对位置
    config: {
      actionType: 'parameterAdjustment'
    },
    connections: [{ targetNodeId: 'temp-end-1', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }]
  },
  {
    id: 'temp-5',
    type: 'action',
    title: '停机检修',
    description: '立即停机，通知维护人员',
    position: { x: 600, y: 540 }, // 调整y坐标保持相对位置
    config: {
      actionType: 'notifyPersonnel',
      notificationMethods: ['email', 'systemMessage']
    },
    connections: [{ targetNodeId: 'temp-end-2', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }]
  },
  {
    id: 'temp-end-1',
    type: 'end',
    title: '继续生产',
    description: '问题已解决',
    position: { x: 300, y: 690 }, // 调整y坐标保持相对位置
    connections: [] // 结束节点没有出站连接
  },
  {
    id: 'temp-end-2',
    type: 'end',
    title: '设备待修',
    description: '等待维护完成',
    position: { x: 600, y: 690 }, // 调整y坐标保持相对位置
    connections: [] // 结束节点没有出站连接
  }
];

export const temperatureWorkflowMetadata = {
  name: '温度异常处理流程',
  version: '1.3', // 更新版本号
  description: '处理生产过程中的温度异常情况',
  lastModified: '2025-11-03', // 更新最后修改日期
  createdBy: 'Equipment Team',
  department: 'Manufacturing',
  tags: ['temperature', 'equipment', 'monitoring'],
  nodeCount: 8, // 更新节点数量
  changeHistory: [
    {
      version: '1.3',
      date: '2025-11-03',
      author: 'Equipment Team',
      description: '添加确认异常告警动作节点，调整流程逻辑'
    },
    {
      version: '1.2',
      date: '2024-01-15',
      author: 'Equipment Team',
      description: '优化条件分支逻辑'
    },
    {
      version: '1.1',
      date: '2024-01-10',
      author: 'Equipment Team',
      description: '初始版本创建'
    }
  ]
};