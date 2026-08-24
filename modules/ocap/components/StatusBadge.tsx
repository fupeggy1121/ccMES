import React from 'react';
import { cn } from '../utils/cn';
import { Clock, AlertCircle, CheckCircle, BarChart3, Wrench, Package, Cog } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'exception';
  exceptionType?: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status', exceptionType, size = 'md' }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  let label = '';

  if (type === 'exception') {
    switch (exceptionType) {
      case 'SPC OOC/OOS':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        icon = <BarChart3 size={size === 'sm' ? 12 : 14} className="mr-1" />;
        label = 'SPC OOC/OOS';
        break;
      case '参数异常':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        icon = <Cog size={size === 'sm' ? 12 : 14} className="mr-1" />;
        label = '参数异常';
        break;
      case '设备异常':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        icon = <Wrench size={size === 'sm' ? 12 : 14} className="mr-1" />;
        label = '设备异常';
        break;
      case '工艺异常':
        bgColor = 'bg-indigo-100';
        textColor = 'text-indigo-800';
        icon = <Cog size={size === 'sm' ? 12 : 14} className="mr-1" />;
        label = '工艺异常';
        break;
      case '质量缺陷':
        bgColor = 'bg-pink-100';
        textColor = 'text-pink-800';
        icon = <AlertCircle size={size === 'sm' ? 12 : 14} className="mr-1" />;
        label = '质量缺陷';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        label = exceptionType || '未知';
    }
  } else {
    switch (status) {
      case 'processing':
      case 'current':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        icon = <AlertCircle size={size === 'sm' ? 12 : 14} className="mr-1" />;
        label = '处理中';
        break;
      case 'completed':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = <CheckCircle size={size === 'sm' ? 12 : 14} className="mr-1" />;
        label = '已完成';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        label = '未知';
    }
  }

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        bgColor, 
        textColor,
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
    >
      {icon}
      {label}
    </span>
  );
};

export default StatusBadge;