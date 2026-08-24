import React from 'react';
import { WorkOrder } from '../../types/workOrder';
import StatusBadge from '../StatusBadge'; // 注意路径调整

interface ExceptionDetailsCardProps {
  workOrder: WorkOrder;
}

const ExceptionDetailsCard: React.FC<ExceptionDetailsCardProps> = ({ workOrder }) => {
  const isSPCOCAP = workOrder.exceptionType === 'SPC OCAP';

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">异常详情</h2>
      
      <div className="space-y-6">
        {/* 基础异常信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">异常描述</label>
            <p className="mt-1 text-sm text-gray-900">{workOrder.description}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">异常类型</label>
            <p className="mt-1 text-sm text-gray-900">{workOrder.exceptionType}</p>
          </div>
        </div>

        {/* 生产信息 */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">生产信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">批次号</label>
              <p className="mt-1 text-sm text-gray-900">{workOrder.batchNumber}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">产品型号</label>
              <p className="mt-1 text-sm text-gray-900">{workOrder.productModel}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">设备</label>
              <p className="mt-1 text-sm text-gray-900">{workOrder.equipment}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">提交人</label>
              <p className="mt-1 text-sm text-gray-900">{workOrder.submitter}</p>
            </div>
          </div>
        </div>

        {/* SPC OCAP 特定信息 */}
        {isSPCOCAP && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">SPC OCAP 参数</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">控制参数</label>
                <p className="mt-1 text-sm text-gray-900">{workOrder.spcParameters?.controlParameter}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">规格</label>
                <p className="mt-1 text-sm text-gray-900">{workOrder.spcParameters?.specification}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">测量值</label>
                <p className="mt-1 text-sm text-gray-900">{workOrder.spcParameters?.measuredValue}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">异常值</label>
                <p className="mt-1 text-sm text-gray-900">{workOrder.abnormalValue?.value} ({workOrder.abnormalValue?.deviation})</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">超限规则</label>
                <p className="mt-1 text-sm text-gray-900">{workOrder.outOfLimitRule?.ruleName} - {workOrder.outOfLimitRule?.triggerCondition}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExceptionDetailsCard;
