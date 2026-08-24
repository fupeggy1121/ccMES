// src/components/ProductionPlan/ProductionPlan.tsx
import React, { useState } from 'react';
import { Calendar, Clock, Package, Target, TrendingUp, AlertCircle, Plus, Search, Filter, User, FileText, ShoppingCart, ArrowRight, List, RotateCcw, Move, Edit } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { MaterialPickingForm } from './MaterialPickingForm';
import { WorkOrderForm } from './WorkOrderForm';
import { MaterialFeedingForm } from './MaterialFeedingForm';
import { BOMViewModal } from './BOMViewModal';
import { ProductionPlanDocumentModal } from './ProductionPlanDocumentModal';
import { WorkOrderReturnMaterialModal } from './WorkOrderReturnMaterialModal';
import { WorkOrderMaterialTransferModal } from './WorkOrderMaterialTransferModal';
import { ProductionOrder } from '../../types';
// import { processStationsByProductName } from '../../config/processConfig'; // 移除此行

export const ProductionPlan: React.FC = () => {
  const {
    productionOrders,
    bomItems,
    loading,
    createMaterialPickingRequest,
    createProductionOrder,
    updateProductionOrder,
    completePreloadRecord,
    actualPickedBatches,
    returnPickedMaterialBatches,
    transferPickedMaterialBatches,
    productProcessStations, // 新增：从 useData 导入
    fetchAndSetProductProcessStations, // 新增：从 useData 导入
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showPickingForm, setShowPickingForm] = useState(false);
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
  const [showFeedingForm, setShowFeedingForm] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showReturnMaterialModal, setShowReturnMaterialModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any>(null);
  const [showTransferMaterialModal, setShowTransferMaterialModal] = useState(false);
  const [selectedOrderForTransfer, setSelectedOrderForTransfer] = useState<any>(null);

  const [showEditWorkOrderForm, setShowEditWorkOrderForm] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ProductionOrder | null>(null);

  const filteredOrders = productionOrders.filter(order => {
    const matchesSearch =
      order.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.assignedOperator.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || order.orderType === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const orderTypeOptions = [
    { value: 'all', label: '全部类别' },
    { value: '标准工单', label: '标准工单' },
    { value: '返工工单', label: '返工工单' },
    { value: '实验工单', label: '实验工单' },
    { value: '其他类型', label: '其他类型' }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-gray-100 text-gray-800',
      'partially scheduled': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    const labels = {
      scheduled: '已排产',
      'partially scheduled': '部分排产',
      completed: '已关闭',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof styles]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    const labels = {
      high: '高',
      medium: '中',
      low: '低'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof styles]}
      </span>
    );
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  // 处理工单备料
  const handleMaterialPicking = (order: any) => {
    setSelectedOrder(order);
    // 在打开备料表单前，先获取该工单产品的工艺站点
    fetchAndSetProductProcessStations(order.productRefId);
    setShowPickingForm(true);
  };

  // 处理物料投料
  const handleMaterialFeeding = (order: any) => {
    setSelectedOrder(order);
    // 在打开投料表单前，先获取该工单产品的工艺站点
    fetchAndSetProductProcessStations(order.productRefId);
    setShowFeedingForm(true);
  };

  // 处理 BOM 查看
  const handleBOMView = (order: any) => {
    setSelectedOrder(order);
    // 在打开 BOM 模态框前，先获取该工单产品的工艺站点
    fetchAndSetProductProcessStations(order.productRefId);
    setShowBOMModal(true);
  };

  // 处理编辑工单
  const handleEditOrder = (order: ProductionOrder) => {
    setOrderToEdit(order);
    // 在打开编辑表单前，先获取该工单产品的工艺站点
    fetchAndSetProductProcessStations(order.productRefId);
    setShowEditWorkOrderForm(true);
  };

  // 处理工单退料
  const handleMaterialReturn = (order: any) => {
    setSelectedOrderForReturn(order);
    setShowReturnMaterialModal(true);
  };

  // 处理物料转移
  const handleMaterialTransfer = (order: any) => {
    setSelectedOrderForTransfer(order);
    setShowTransferMaterialModal(true);
  };

  // 处理退料提交
  const handleReturnSubmit = (batchIds: string[], requestedBy: string, notes?: string) => {
    returnPickedMaterialBatches(batchIds, requestedBy, notes);
  };

  // 处理转移提交
  const handleTransferSubmit = (
    sourceWorkOrderId: string,
    batchIdsToTransfer: string[],
    targetWorkOrderId: string,
    targetLocation: string,
    transferringOperator: string
  ) => {
    transferPickedMaterialBatches(
      sourceWorkOrderId,
      batchIdsToTransfer,
      targetWorkOrderId,
      targetLocation,
      transferringOperator
    );
  };

  const handlePickingFormSubmit = (workOrderId: string, workOrderNumber: string, requestedBy: string, bomPickingItems: any[], notes?: string) => {
    const request = createMaterialPickingRequest(workOrderId, workOrderNumber, requestedBy, bomPickingItems, notes);
    alert(`领料申请已提交！\n申请单号: ${request.id}\n出库申请已自动生成，等待库管审批`);
  };

  // 修改：handleWorkOrderFormSubmit 函数以支持编辑
  const handleWorkOrderFormSubmit = async (workOrderData: any, isEditMode: boolean) => {
    if (isEditMode && orderToEdit) {
      try {
        const updatedOrder = await updateProductionOrder(orderToEdit.id, {
          targetQuantity: workOrderData.targetQuantity,
          priority: workOrderData.priority,
          startDate: workOrderData.startDate,
          endDate: workOrderData.endDate,
          notes: workOrderData.notes,
          // 其他不可编辑字段不在此处更新
        });
        alert(`生产工单 ${updatedOrder.orderNumber} 更新成功！`);
      } catch (error) {
        alert('更新工单失败！');
        console.error('Error updating production order:', error);
      }
      setShowEditWorkOrderForm(false);
      setOrderToEdit(null);
    } else {
      try {
        const newOrder = await createProductionOrder(workOrderData);
        alert(`生产工单创建成功！\n工单号: ${newOrder.orderNumber}`);
      } catch (error) {
        alert('创建工单失败！');
        console.error('Error creating production order:', error);
      }
      setShowWorkOrderForm(false);
    }
  };

  const handleFeedingFormSubmit = (feedingData: any, preloadRecordId?: string) => {
    console.log('Material feeding data:', feedingData);
    if (preloadRecordId) {
      completePreloadRecord(preloadRecordId);
      alert(`投料成功！预装片记录 ${preloadRecordId} 已标记为完成。`);
    }
  };

  // 判断工单是否可以退料（已排产或部分排产的工单）
  const canReturnMaterials = (order: any) => {
    return order.status === 'scheduled' || order.status === 'partially scheduled';
  };

  // 判断工单是否可以转移物料（已排产或部分排产的工单）
  const canTransferMaterials = (order: any) => {
    return order.status === 'scheduled' || order.status === 'partially scheduled';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">生产工单</h2>
          <p className="text-gray-600 mt-1">生产工单管理与进度监控</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDocumentModal(true)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            文档
          </button>
          <button
            onClick={() => setShowWorkOrderForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建工单
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索工单号或产品名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="scheduled">已排产</option>
              <option value="partially scheduled">部分排产</option>
              <option value="completed">已完成</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部优先级</option>
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>

            {/* 工单类别筛选 */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {orderTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
      </div>

      {/* Production Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">生产工单列表</h3>
            <span className="text-sm text-gray-500">共 {filteredOrders.length} 条工单</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  工单号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  产品名称
                </th>
                {/* 工单类别列 */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  工单类别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  生产进度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  计划时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  负责人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  优先级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const progressPercentage = getProgressPercentage(order.currentProgress, order.targetQuantity);

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{order.productName}</div>
                      </div>
                    </td>
                    {/* 显示工单类别 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.orderType || '标准工单'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {order.currentProgress.toLocaleString()}/{order.targetQuantity.toLocaleString()}
                          </span>
                          <span className="font-medium text-gray-900">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {order.startDate.toLocaleDateString('zh-CN')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          至 {order.endDate.toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{order.assignedOperator}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(order.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleBOMView(order)}
                          className="text-purple-600 hover:text-purple-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <List className="w-4 h-4" />
                          BOM
                        </button>
                        <button
                          onClick={() => handleMaterialPicking(order)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          工单备料
                        </button>
                        <button
                          onClick={() => handleMaterialFeeding(order)}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <ArrowRight className="w-4 h-4" />
                          投料
                        </button>
                        {/* 工单退料按钮 */}
                        <button
                          onClick={() => handleMaterialReturn(order)}
                          disabled={!canReturnMaterials(order)}
                          className={`flex items-center gap-1 text-sm font-medium ${
                            canReturnMaterials(order)
                              ? 'text-orange-600 hover:text-orange-900'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={canReturnMaterials(order) ? '工单退料' : '只有已排产或部分排产的工单可以退料'}
                        >
                          <RotateCcw className="w-4 h-4" />
                          退料
                        </button>
                        {/* 工单挪料按钮 */}
                        <button
                          onClick={() => handleMaterialTransfer(order)}
                          disabled={!canTransferMaterials(order)}
                          className={`flex items-center gap-1 text-sm font-medium ${
                            canTransferMaterials(order)
                              ? 'text-indigo-600 hover:text-indigo-900'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={canTransferMaterials(order) ? '工单挪料' : '只有已排产或部分排产的工单可以挪料'}
                        >
                          <Move className="w-4 h-4" />
                          挪料
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无生产工单</h3>
            <p className="mt-1 text-sm text-gray-500">请检查搜索条件或创建新的生产工单。</p>
          </div>
        )}
      </div>

      {/* Material Picking Form Modal */}
      {showPickingForm && selectedOrder && (
        <MaterialPickingForm
          workOrderId={selectedOrder.id}
          workOrderNumber={selectedOrder.orderNumber}
          bomItems={selectedOrder.bomItems}
          productType={selectedOrder.productName}
          targetQuantity={selectedOrder.targetQuantity}
          onClose={() => {
            setShowPickingForm(false);
            setSelectedOrder(null);
            fetchAndSetProductProcessStations(''); // 清空工艺站点
          }}
          onSubmit={handlePickingFormSubmit}
          actualPickedBatches={actualPickedBatches}
          currentProductProcessStations={productProcessStations} // 新增：传递工艺站点
          fetchAndSetProductProcessStations={fetchAndSetProductProcessStations} // 新增：传递获取函数
        />
      )}

      {/* Work Order Form Modal (for creation) */}
      {showWorkOrderForm && (
        <WorkOrderForm
          onClose={() => {
            setShowWorkOrderForm(false);
            fetchAndSetProductProcessStations(''); // 清空工艺站点
          }}
          onSubmit={(data) => handleWorkOrderFormSubmit(data, false)}
          isEdit={false}
        />
      )}

      {/* Work Order Form Modal (for editing) */}
      {showEditWorkOrderForm && orderToEdit && (
        <WorkOrderForm
          onClose={() => {
            setShowEditWorkOrderForm(false);
            setOrderToEdit(null);
            fetchAndSetProductProcessStations(''); // 清空工艺站点
          }}
          onSubmit={(data) => handleWorkOrderFormSubmit(data, true)}
          initialData={orderToEdit}
          isEdit={true}
        />
      )}

      {/* Material Feeding Form Modal */}
      {showFeedingForm && selectedOrder && (
        <MaterialFeedingForm
          workOrderId={selectedOrder.id}
          workOrderType={selectedOrder.orderType}
          workOrderProductType={selectedOrder.productName}
          workOrderStartProcessStationCode={selectedOrder.startProcessStationCode}
          workOrderEndProcessStationCodee={selectedOrder.endProcessStationCode}
          workOrderNumber={selectedOrder.orderNumber}
          onClose={() => {
            setShowFeedingForm(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleFeedingFormSubmit}
          currentProductProcessStations={productProcessStations} // 新增：传递工艺站点
          fetchAndSetProductProcessStations={fetchAndSetProductProcessStations} // 新增：传递获取函数
        />
      )}

      {/* BOM View Modal */}
      {showBOMModal && selectedOrder && (
        <BOMViewModal
          workOrderNumber={selectedOrder.orderNumber}
          bomItems={selectedOrder.bomItems}
          productType={selectedOrder.productName}
          onClose={() => {
            setShowBOMModal(false);
            setSelectedOrder(null);
          }}
          currentProductProcessStations={productProcessStations} // 新增：传递工艺站点
        />
      )}

      {/* Production Plan Document Modal */}
      {showDocumentModal && (
        <ProductionPlanDocumentModal
          isOpen={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
        />
      )}

      {/* Work Order Return Material Modal */}
      {showReturnMaterialModal && selectedOrderForReturn && (
        <WorkOrderReturnMaterialModal
          isOpen={showReturnMaterialModal}
          onClose={() => {
            setShowReturnMaterialModal(false);
            setSelectedOrderForReturn(null);
          }}
          workOrder={selectedOrderForReturn}
          actualPickedBatches={actualPickedBatches}
          onReturnSubmit={handleReturnSubmit}
        />
      )}

      {/* Work Order Material Transfer Modal */}
      {showTransferMaterialModal && selectedOrderForTransfer && (
        <WorkOrderMaterialTransferModal
          isOpen={showTransferMaterialModal}
          onClose={() => {
            setShowTransferMaterialModal(false);
            setSelectedOrderForTransfer(null);
          }}
          sourceWorkOrder={selectedOrderForTransfer}
          productionOrders={productionOrders}
          actualPickedBatches={actualPickedBatches}
          onTransferSubmit={handleTransferSubmit}
        />
      )}
    </div>
  );
};
