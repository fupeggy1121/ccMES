import React from 'react';
import { format } from 'date-fns';
import { WorkOrder } from '../../types/workOrder';
import StatusBadge from '../StatusBadge'; // 注意路径调整

interface WorkOrderBasicInfoCardProps {
  workOrder: WorkOrder;
}

const WorkOrderBasicInfoCard: React.FC<WorkOrderBasicInfoCardProps> = ({ workOrder }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">工单基础信息</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">工单ID</label>
          <p className="mt-1 text-sm text-gray-900">{workOrder.id}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">工单名称</label>
          <p className="mt-1 text-sm text-gray-900">{workOrder.name}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">异常类型</label>
          <p className="mt-1 text-sm text-gray-900">{workOrder.exceptionType}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">状态</label>
          <div className="mt-1">
            <StatusBadge status={workOrder.status} />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">创建时间</label>
          <p className="mt-1 text-sm text-gray-900">
            {format(new Date(workOrder.createdAt), 'yyyy-MM-dd HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderBasicInfoCard;
