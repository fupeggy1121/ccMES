// src/components/ProductionPlan/InboundMaterialModal.tsx
import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { PickedMaterialBatch } from '../../types';

// 扩展的物料批次接口
interface ExtendedMaterialBatch extends PickedMaterialBatch {
  inboundOperator: string;
  inboundActualDate: string;
  inboundLocation: string;
}

interface InboundMaterialModalProps {
  selectedBatches: PickedMaterialBatch[];
  onClose: () => void;
  onInboundConfirm: (inboundDetails: { 
    batchId: string; 
    operator: string; 
    inboundDate: Date; 
    location: string;
  }[]) => void;
}

export const InboundMaterialModal: React.FC<InboundMaterialModalProps> = ({
  selectedBatches,
  onClose,
  onInboundConfirm
}) => {
  // 预定义的线边仓位置选项
  const locationOptions = [
    '线边仓A区',
    '线边仓B区', 
    '线边仓C区',
    '线边仓D区',
    '临时存储区'
  ];

  // 初始化本地状态，为每个批次添加默认值
  const [editableBatches, setEditableBatches] = useState<ExtendedMaterialBatch[]>(() => {
    return selectedBatches.map(batch => ({
      ...batch,
      inboundOperator: '',
      inboundActualDate: new Date().toISOString().slice(0, 16), // 当前日期时间
      inboundLocation: locationOptions[0] // 默认第一个位置
    }));
  });

  // 更新批次字段的处理函数
  const handleBatchFieldChange = (batchId: string, field: keyof ExtendedMaterialBatch, value: string) => {
    setEditableBatches(prev => 
      prev.map(batch => 
        batch.id === batchId ? { ...batch, [field]: value } : batch
      )
    );
  };

  const handleConfirm = () => {
    // 检查所有批次的操作员是否都已填写
    const hasEmptyOperator = editableBatches.some(batch => 
      batch.inboundStatus !== 'completed' && !batch.inboundOperator.trim()
    );

    if (hasEmptyOperator) {
      alert('请填写所有批次的操作员信息');
      return;
    }

    // 收集每个批次的入库详情
    const inboundDetails = editableBatches.map(batch => ({
      batchId: batch.id,
      operator: batch.inboundOperator,
      inboundDate: new Date(batch.inboundActualDate),
      location: batch.inboundLocation
    }));

    onInboundConfirm(inboundDetails);
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          已入库
        </span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          已取消
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          待入库
        </span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">物料入库单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Selected Batches List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">待入库物料批次</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        批次号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物料编码
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物料名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作员
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        入库日期
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        线边仓位置
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        当前状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editableBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{batch.batchNumber}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{batch.materialCode}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{batch.materialName}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {batch.pickedQuantity.toLocaleString()} {batch.unit}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={batch.inboundOperator}
                            onChange={(e) => handleBatchFieldChange(batch.id, 'inboundOperator', e.target.value)}
                            disabled={batch.inboundStatus === 'completed'}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="输入操作员"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="datetime-local"
                            value={batch.inboundActualDate}
                            onChange={(e) => handleBatchFieldChange(batch.id, 'inboundActualDate', e.target.value)}
                            disabled={batch.inboundStatus === 'completed'}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <select
                            value={batch.inboundLocation}
                            onChange={(e) => handleBatchFieldChange(batch.id, 'inboundLocation', e.target.value)}
                            disabled={batch.inboundStatus === 'completed'}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            {locationOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(batch.inboundStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="text-sm font-medium text-green-900">入库摘要</h4>
            </div>
            <div className="mt-2 text-sm text-green-800">
              <p>• 本次将完成 {editableBatches.filter(b => b.inboundStatus !== 'completed').length} 个物料批次的入库操作</p>
              <p>• 已入库批次将显示为只读状态</p>
              <p>• 入库后这些物料将正式进入生产库存</p>
              <p>• 入库状态将更新为"已入库"</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={editableBatches.some(batch => 
              batch.inboundStatus !== 'completed' && !batch.inboundOperator.trim()
            )}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            确认入库
          </button>
        </div>
      </div>
    </div>
  );
};