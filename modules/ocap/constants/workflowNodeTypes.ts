// src/constants/workflowNodeTypes.ts

// 导入图标组件
import { 
  PlayCircle, 
  Square, 
  GitBranch, 
  CheckCircle, 
  Clock,
  AlertCircle,
  MessageCircle,
  User,
  Database,
  Code,
  FileText
} from 'lucide-react';

// 定义工作流节点类型常量
export const workflowNodeTypes = [
  {
    type: 'start',
    title: '开始节点',
    icon: PlayCircle,
    bgColorClass: 'bg-green-500',
    iconColorClass: 'text-white',
    shapeClass: 'start-node'
  },
  {
    type: 'end', 
    title: '结束节点',
    icon: Square,
    bgColorClass: 'bg-red-500',
    iconColorClass: 'text-white',
    shapeClass: 'end-node'
  },
  {
    type: 'condition',
    title: '条件分支',
    icon: GitBranch,
    bgColorClass: 'bg-yellow-500',
    iconColorClass: 'text-white',
    shapeClass: 'condition-node',
    iconRotationClass: '-rotate-45'
  },
  {
    type: 'approval',
    title: '审批节点',
    icon: CheckCircle,
    bgColorClass: 'bg-orange-500',
    iconColorClass: 'text-white',
    shapeClass: 'approval-node'
  },
  {
    type: 'delay',
    title: '延迟节点', 
    icon: Clock,
    bgColorClass: 'bg-purple-500',
    iconColorClass: 'text-white',
    shapeClass: 'delay-node'
  },
  {
    type: 'alert',
    title: '告警节点',
    icon: AlertCircle,
    bgColorClass: 'bg-yellow-500',
    iconColorClass: 'text-white',
    shapeClass: 'alert-node'
  },
  {
    type: 'message',
    title: '消息节点',
    icon: MessageCircle,
    bgColorClass: 'bg-cyan-500',
    iconColorClass: 'text-white',
    shapeClass: 'message-node'
  },
  {
    type: 'human',
    title: '人工节点',
    icon: User,
    bgColorClass: 'bg-pink-500',
    iconColorClass: 'text-white',
    shapeClass: 'human-node'
  },
  {
    type: 'data',
    title: '数据节点',
    icon: Database,
    bgColorClass: 'bg-indigo-500',
    iconColorClass: 'text-white',
    shapeClass: 'data-node'
  },
  {
    type: 'script',
    title: '脚本节点',
    icon: Code,
    bgColorClass: 'bg-teal-500',
    iconColorClass: 'text-white',
    shapeClass: 'script-node'
  },
  {
    type: 'document',
    title: '文档节点',
    icon: FileText,
    bgColorClass: 'bg-gray-500',
    iconColorClass: 'text-white',
    shapeClass: 'document-node'
  },
  {
    type: 'action',
    title: '动作节点', 
    icon: Square,
    bgColorClass: 'bg-blue-500',
    iconColorClass: 'text-white',
    shapeClass: 'action-node'
  }
] as const;

// 导出类型定义
export type WorkflowNodeType = typeof workflowNodeTypes[number]['type'];
export type WorkflowNodeConfig = typeof workflowNodeTypes[number];