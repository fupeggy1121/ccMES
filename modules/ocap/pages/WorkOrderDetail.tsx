import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { mockWorkOrders } from '../data/mockData';
// 导入新的组件
import WorkOrderBasicInfoCard from '../components/work-order/WorkOrderBasicInfoCard';
import ExceptionDetailsCard from '../components/work-order/ExceptionDetailsCard';
import ProcessingFlowDisplay from '../components/work-order/ProcessingFlowDisplay';

const WorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, we would fetch from an API
    const foundOrder = mockWorkOrders.find(order => order.id === id);
    
    if (foundOrder) {
      setWorkOrder(foundOrder);
    }
    setLoading(false);
  }, [id]);
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  if (!workOrder) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">工单不存在</h2>
        <p className="text-gray-600 mb-4">找不到工单号为 {id} 的记录</p>
        <Link to="/work-orders" className="text-blue-600 hover:underline">
          返回工单列表
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/work-orders" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ChevronLeft size={18} className="mr-1" />
          返回列表
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            {workOrder.name}
          </h1>
          <p className="text-gray-600 mt-1">
            工单编号：{workOrder.id} · 查看异常处理流程和详情
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 在较大屏幕上并排显示工单基本信息和异常详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WorkOrderBasicInfoCard workOrder={workOrder} />
          <ExceptionDetailsCard workOrder={workOrder} />
        </div>

        {/* 处理流程区域保持全宽 */}
        <ProcessingFlowDisplay workOrder={workOrder} />
      </div>
    </div>
  );
};

export default WorkOrderDetail;