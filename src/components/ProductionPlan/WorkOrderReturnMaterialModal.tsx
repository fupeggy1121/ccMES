// src/components/ProductionPlan/WorkOrderReturnMaterialModal.tsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Package, Calendar } from 'lucide-react';
import { PickedMaterialBatch, ProductionOrder } from '../../types';

interface WorkOrderReturnMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: ProductionOrder;
  actualPickedBatches: PickedMaterialBatch[];
  onReturnSubmit: (batchIds: string[], requestedBy: string, notes?: string) => void;
}

export const WorkOrderReturnMaterialModal: React.FC<WorkOrderReturnMaterialModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  actualPickedBatches,
  onReturnSubmit
}) => {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [requestedBy, setRequestedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [eligibleBatches, setEligibleBatches] = useState<PickedMaterialBatch[]>([]);

  // 过滤符合条件的物料批次
  useEffect(() => {
    if (workOrder && actualPickedBatches) {
      const eligible = actualPickedBatches.filter(batch => 
        batch.inboundStatus === 'completed' && 
        batch.inboundStatus !== 'returned' &&
        batch.workOrderId === workOrder.id
      );
      setEligibleBatches(eligible);
    }
  }, [workOrder, actualPickedBatches]);

  // 重置表单
  const resetForm = () => {
    setSelectedBatchIds([]);
    setRequestedBy('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBatchSelection = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(prev => [...prev, batchId]);
    } else {
      setSelectedBatchIds(prev => prev.filter(id => id !== batchId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(eligibleBatches.map(batch => batch.id));
    } else {
      setSelectedBatchIds([]);
    }
  };

  const handleSubmit = () => {
    if (selectedBatchIds.length === 0) {
      alert('请选择要退回的物料批次');
      return;
    }

    if (!requestedBy.trim()) {
      alert('请输入退料申请人');
      return;
    }

    onReturnSubmit(selectedBatchIds, requestedBy, notes);
    alert(`退料申请已提交！\n共退回 ${selectedBatchIds.length} 个物料批次`);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">工单退料申请</h2>
              <p className="text-sm text-gray-500 mt-1">
                工单号: {workOrder.orderNumber} | 产品: {workOrder.productName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* 可退物料批次列表 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">可退物料批次</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedBatchIds.length === eligibleBatches.length && eligibleBatches.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="select-all" className="text-sm text-gray-700">
                  全选
                </label>
              </div>
            </div>

            {eligibleBatches.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">暂无符合条件的可退物料批次</p>
                <p className="text-xs text-gray-400 mt-1">
                  只有入库状态为"已完成"且未退回的物料批次可以退回
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        选择
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物料编码
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物料名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        规格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        批次号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eligibleBatches.map((batch) => (
                      <tr 
                        key={batch.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedBatchIds.includes(batch.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBatchIds.includes(batch.id)}
                            onChange={(e) => handleBatchSelection(batch.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {batch.materialCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.materialName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {batch.specification}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {batch.batchNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-medium">
                            {batch.pickedQuantity}
                          </span>
                          <span className="ml-1 text-gray-500">
                            {batch.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            可退
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 退料信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">退料信息</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="requestedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  退料申请人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="requestedBy"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入申请人姓名"
                />
              </div>
              
              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
                  退料日期
                </label>
                <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{new Date().toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                退料原因/备注
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入退料原因或备注信息..."
              />
            </div>
          </div>

          {/* 统计信息 */}
          {selectedBatchIds.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">已选择 {selectedBatchIds.length} 个物料批次</span>
                </div>
                <div className="text-green-700 font-medium">
                  总计: {eligibleBatches
                    .filter(batch => selectedBatchIds.includes(batch.id))
                    .reduce((sum, batch) => sum + batch.pickedQuantity, 0)} 个物料单位
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            共 {eligibleBatches.length} 个可退物料批次
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedBatchIds.length === 0 || !requestedBy.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>确认退料</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};