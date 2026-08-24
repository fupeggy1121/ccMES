// src/components/BatchSelectionModal.tsx
import React, { useState, useEffect } from 'react';

interface Batch {
  id: string;
  batchCode: string;
  productCode: string;
  productName: string;
  totalSheets: number;
  goodSheets: number;
  defectiveSheets: number;
  status: '生产中' | '待并批' | '已完成';
  station: string;
}

interface BatchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (batchId: string) => void;
  batches: Batch[];
  currentBatchProductCode: string;
  currentBatchStation: string;
  currentBatchId: string;
}

const BatchSelectionModal: React.FC<BatchSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  batches,
  currentBatchProductCode,
  currentBatchStation,
  currentBatchId
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // 当模态框打开时重置选择
  useEffect(() => {
    if (isOpen) {
      setSelectedBatchId('');
    }
  }, [isOpen]);

  // 过滤批次数据
  const filteredBatches = batches.filter(batch => 
    batch.id !== currentBatchId &&
    batch.productCode === currentBatchProductCode &&
    batch.station === currentBatchStation &&
    batch.status === '待并批' // 只显示待并批状态的批次
  );

  const handleConfirm = () => {
    if (selectedBatchId) {
      onSelect(selectedBatchId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold">选择并批批次</h2>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">选择</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批次编码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品料号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总片数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">良品数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">不良品数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">站点</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr 
                    key={batch.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedBatchId === batch.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedBatchId(batch.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="radio"
                        name="batch-select"
                        checked={selectedBatchId === batch.id}
                        onChange={() => setSelectedBatchId(batch.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.batchCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.productCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.totalSheets}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.goodSheets}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.defectiveSheets}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.station}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                    没有符合条件的批次可供选择
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end p-5 border-t">
          <button
            onClick={onClose}
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedBatchId}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              selectedBatchId 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSelectionModal;