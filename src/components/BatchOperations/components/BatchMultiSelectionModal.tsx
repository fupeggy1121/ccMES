// src/components/BatchMultiSelectionModal.tsx
import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { BatchData } from '../types';

interface BatchMultiSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedBatches: BatchData[]) => void;
  initialSelectedBatchIds: string[];
  allBatches: BatchData[];
  productCodeFilter: string;
  stationFilter: string;
}

const BatchMultiSelectionModal: React.FC<BatchMultiSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialSelectedBatchIds,
  allBatches,
  productCodeFilter,
  stationFilter,
}) => {
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 已选择的批次状态
  const [selectedBatches, setSelectedBatches] = useState<BatchData[]>([]);

  // 过滤可选的批次
  const filteredBatches = useMemo(() => {
    return allBatches.filter(batch => {
      // 根据搜索条件过滤批次编码
      const matchesSearch = searchTerm 
        ? batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      return matchesSearch;
    });
  }, [allBatches, searchTerm]);

  // 处理批次选择/取消选择
  const handleToggleBatchSelection = (batch: BatchData) => {
    setSelectedBatches(prevSelected => {
      const isAlreadySelected = prevSelected.some(b => b.id === batch.id);
      
      if (isAlreadySelected) {
        return prevSelected.filter(b => b.id !== batch.id);
      } else {
        return [...prevSelected, batch];
      }
    });
  };

  // 处理确认选择
  const handleConfirmSelection = () => {
    onSelect(selectedBatches);
    onClose();
  };

  // 初始化已选择的批次
  React.useEffect(() => {
    if (isOpen) {
      const initiallySelected = allBatches.filter(batch => 
        initialSelectedBatchIds.includes(batch.id)
      );
      setSelectedBatches(initiallySelected);
    }
  }, [isOpen, allBatches, initialSelectedBatchIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold">选择批次</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border pl-10"
              placeholder="搜索批次编码..."
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Batch List */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="border-b">
                <th className="py-3 px-4 w-12 text-left text-gray-700 font-medium"></th>
                <th className="py-3 px-4 text-left text-gray-700 font-medium">批次编码</th>
                <th className="py-3 px-4 text-left text-gray-700 font-medium">产品料号</th>
                <th className="py-3 px-4 text-left text-gray-700 font-medium">站点</th>
                <th className="py-3 px-4 text-center text-gray-700 font-medium">总片数</th>
                <th className="py-3 px-4 text-center text-gray-700 font-medium">良品数</th>
                <th className="py-3 px-4 text-center text-gray-700 font-medium">不良品数</th>
                <th className="py-3 px-4 text-center text-gray-700 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch, index) => (
                  <tr 
                    key={batch.id} 
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => handleToggleBatchSelection(batch)}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBatches.some(b => b.id === batch.id)}
                        onChange={() => handleToggleBatchSelection(batch)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{batch.batchCode}</td>
                    <td className="py-3 px-4">{batch.productCode}</td>
                    <td className="py-3 px-4">{batch.stationName}</td>
                    <td className="py-3 px-4 text-center">{batch.totalQty}</td>
                    <td className="py-3 px-4 text-center">{batch.goodQty}</td>
                    <td className="py-3 px-4 text-center">{batch.defectQty}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        batch.status === '进行中' ? 'bg-green-100 text-green-800' :
                        batch.status === 'Hold' ? 'bg-red-100 text-red-800' :
                        batch.status === '已完成' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    {searchTerm ? '没有搜索到符合条件的批次' : '没有可用的批次'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={selectedBatches.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认选择 ({selectedBatches.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchMultiSelectionModal;