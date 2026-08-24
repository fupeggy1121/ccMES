import { WorkflowTemplate } from '../types/workflow';
import { acidEtchingWorkflow, acidEtchingWorkflowMetadata } from './acidEtchingWorkflow';
import { temperatureWorkflow, temperatureWorkflowMetadata } from './temperatureWorkflow';
import { equipmentFailureWorkflow, equipmentFailureWorkflowMetadata } from './equipmentFailureWorkflow'; // 导入新的模板数据

// 系统预定义模板列表
export const systemTemplates: WorkflowTemplate[] = [
  {
    id: 'sys-acid-etching-001',
    name: acidEtchingWorkflowMetadata.name,
    category: 'acid_etching',
    description: acidEtchingWorkflowMetadata.description, 
    version: acidEtchingWorkflowMetadata.version,
    status: 'active',
    nodeCount: acidEtchingWorkflow.length,
    workflowData: acidEtchingWorkflow,
    metadata: {
      lastModified: acidEtchingWorkflowMetadata.lastModified,
      createdBy: acidEtchingWorkflowMetadata.createdBy || 'System',
      department: acidEtchingWorkflowMetadata.department,
      tags: ['acid_etching', 'removal_amount', 'quality'],
      ...acidEtchingWorkflowMetadata
    },
    isSystemTemplate: true
  },
  {
    id: 'sys-temperature-001',
    name: temperatureWorkflowMetadata.name,
    category: 'temperature',
    description: temperatureWorkflowMetadata.description,
    version: temperatureWorkflowMetadata.version,
    status: 'active',
    nodeCount: temperatureWorkflow.length,
    workflowData: temperatureWorkflow,
    metadata: {
      lastModified: temperatureWorkflowMetadata.lastModified,
      createdBy: temperatureWorkflowMetadata.createdBy || 'System',
      department: temperatureWorkflowMetadata.department,
      tags: temperatureWorkflowMetadata.tags
    },
    isSystemTemplate: true
  },
  { // 添加新的设备故障处理流程模板
    id: 'sys-equipment-failure-001',
    name: equipmentFailureWorkflowMetadata.name,
    category: 'equipment', // 假设有一个 'equipment' 分类
    description: equipmentFailureWorkflowMetadata.description,
    version: equipmentFailureWorkflowMetadata.version,
    status: 'active',
    nodeCount: equipmentFailureWorkflow.length,
    workflowData: equipmentFailureWorkflow,
    metadata: {
      lastModified: equipmentFailureWorkflowMetadata.lastModified,
      createdBy: equipmentFailureWorkflowMetadata.createdBy || 'System',
      department: equipmentFailureWorkflowMetadata.department,
      tags: equipmentFailureWorkflowMetadata.tags
    },
    isSystemTemplate: true
  }
];

// 分类配置
export const categoryConfigs = [
  {
    category: 'acid_etching' as const,
    label: '酸腐工艺',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    description: '酸腐蚀工艺异常处理'
  },
  {
    category: 'temperature' as const,
    label: '温度控制',
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
    description: '温度异常监控处理'
  },
  {
    category: 'pressure' as const,
    label: '压力控制',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    description: '压力异常监控处理'
  },
  {
    category: 'quality' as const,
    label: '质量异常',
    color: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    description: '产品质量异常处理'
  },
  {
    category: 'equipment' as const,
    label: '设备故障',
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-600',
    description: '设备故障诊断处理'
  },
  {
    category: 'custom' as const,
    label: '自定义',
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    description: '用户自定义工作流'
  }
];
