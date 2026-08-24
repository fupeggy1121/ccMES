import React from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  GitBranch, 
  Settings, 
  Square
} from 'lucide-react';
import { cn } from '../utils/cn';
import { workflowNodeTypes } from '../constants/workflowNodeTypes';

interface Stage {
  id: string;
  name: string;
  role: string;
  status: 'completed' | 'current' | 'pending';
  type: 'start' | 'condition' | 'action' | 'end';
  completedAt?: string;
  assignee?: string;
}

interface ProcessTimelineProps {
  currentStage: number;
  stages: Stage[];
  onStageClick?: (stage: Stage) => void;
  selectedStageId?: string;
}

const ProcessTimeline: React.FC<ProcessTimelineProps> = ({ 
  currentStage, 
  stages, 
  onStageClick, 
  selectedStageId 
}) => {
  // 根据类型从 workflowNodeTypes 数组中查找节点配置
  const getNodeConfig = (type: string) => {
    const config = workflowNodeTypes.find(config => config.type === type);
    if (!config) {
      console.warn(`No node config found for type: ${type}. Using default configuration.`);
      // 返回一个默认配置作为降级方案
      return workflowNodeTypes.find(config => config.type === 'action') || workflowNodeTypes[0];
    }
    return config;
  };

  // 根据状态和节点配置获取样式类
  const getNodeStyles = (stage: Stage) => {
    const nodeConfig = getNodeConfig(stage.type);
    if (!nodeConfig) {
      // 如果连默认配置都找不到，返回基础样式
      return {
        bgColor: stage.status === 'pending' ? 'bg-gray-200' : 'bg-blue-200',
        iconColor: stage.status === 'pending' ? 'text-gray-400' : 'text-blue-800'
      };
    }

    switch (stage.status) {
      case 'completed':
        return {
          bgColor: nodeConfig.bgColorClass,
          iconColor: nodeConfig.iconColorClass
        };
      case 'current':
        // 从 bgColorClass 派生浅色背景，从 iconColorClass 派生深色图标
        const lightBgColor = nodeConfig.bgColorClass.replace(/(bg-\w+)-(\d+)/, '$1-100');
        const darkIconColor = nodeConfig.iconColorClass.replace(/(text-\w+)-(\d+)/, '$1-800');
        return {
          bgColor: `${lightBgColor} ring-4 ring-white`,
          iconColor: darkIconColor
        };
      case 'pending':
        return {
          bgColor: 'bg-gray-200',
          iconColor: 'text-gray-400'
        };
      default:
        return { bgColor: '', iconColor: '' };
    }
  };

  return (
    <div className="relative">
      {stages.map((stage, index) => {
        const nodeConfig = getNodeConfig(stage.type);
        if (!nodeConfig) return null;

        const { icon: IconComponent, shapeClass, iconRotationClass } = nodeConfig;
        const { bgColor, iconColor } = getNodeStyles(stage);

        return (
          <div key={stage.id} className="relative pb-8">
            {index < stages.length - 1 && (
              <div
                className={cn(
                  "absolute top-4 left-4 -ml-px h-full w-0.5",
                  index < currentStage ? "bg-blue-600" : "bg-gray-200"
                )}
                aria-hidden="true"
              />
            )}
            
            <div className="relative flex items-start space-x-3">
              <div>
                <div
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center cursor-pointer transition-all hover:scale-110",
                    shapeClass,
                    bgColor,
                    stage.id === selectedStageId && "ring-2 ring-offset-2 ring-yellow-500"
                  )}
                  onClick={() => onStageClick?.(stage)}
                >
                  <div className={cn(
                    stage.status === 'pending' ? "opacity-50" : "opacity-100",
                    iconRotationClass
                  )}>
                    <IconComponent className={cn("h-4 w-4", iconColor)} />
                  </div>
                </div>
              </div>
              
              <div className="min-w-0 flex-1 py-1.5">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors",
                      stage.status === 'completed' 
                        ? "text-gray-900" 
                        : stage.status === 'current' 
                          ? "text-blue-600" 
                          : "text-gray-500",
                      stage.id === selectedStageId && "font-bold text-yellow-700"
                    )}
                    onClick={() => onStageClick?.(stage)}
                  >
                    {stage.name}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                    {stage.role}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 border border-blue-200">
                    {stage.type}
                  </span>
                </div>
                
                {stage.status === 'completed' && stage.completedAt && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    完成于 {format(new Date(stage.completedAt), 'yyyy-MM-dd HH:mm')}
                    {stage.assignee && ` · ${stage.assignee}`}
                  </p>
                )}
                
                {stage.status === 'current' && (
                  <p className="mt-0.5 text-xs text-blue-600">
                    处理中
                    {stage.assignee && ` · ${stage.assignee}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProcessTimeline;