// src/components/ProductionPlan/MaterialBatchSelectionModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Search, Filter, CheckCircle, Package, Calendar, MapPin } from 'lucide-react';
import { PickedMaterialBatch } from '../../types';

interface MaterialBatchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedBatchIds: string[]) => void;
  availableBatchesForMaterial: PickedMaterialBatch[];
  initialSelectedBatchIds: string[];
  materialCode: string;
  materialName: string;
  processStationCode: string;
}

export const MaterialBatchSelectionModal: React.FC<MaterialBatchSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableBatchesForMaterial,
  initialSelectedBatchIds,
  materialCode,
  materialName,
  processStationCode
}) => {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(initialSelectedBatchIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // 当初始选中的批次ID变化时更新状态
  useEffect(() => {
    setSelectedBatchIds(initialSelectedBatchIds);
  }, [initialSelectedBatchIds]);

  // 获取唯一的位置选项
  const locationOptions = ['all', ...Array.from(new Set(availableBatchesForMaterial.map(batch => batch.location)))];

  // 过滤批次数据
  const filteredBatches = availableBatchesForMaterial.filter(batch => {
    const matchesSearch = 
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.lotNumber && batch.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      batch.materialName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || batch.location === locationFilter;
    const matchesStatus = statusFilter === 'all' || batch.inboundStatus === statusFilter;
    
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const handleBatchSelection = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(prev => [...prev, batchId]);
    } else {
      setSelectedBatchIds(prev => prev.filter(id => id !== batchId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(filteredBatches.map(batch => batch.id));
    } else {
      setSelectedBatchIds([]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedBatchIds);
    onClose();
  };

  const handleClose = () => {
    setSelectedBatchIds(initialSelectedBatchIds); // 重置选择
    onClose();
  };

  // 获取选中批次的总数量
  const getSelectedBatchesTotal = () => {
    return availableBatchesForMaterial
      .filter(batch => selectedBatchIds.includes(batch.id))
      .reduce((sum, batch) => sum + batch.pickedQuantity, 0);
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
              <h2 className="text-xl font-bold text-gray-900">选择物料批次</h2>
              <p className="text-sm text-gray-500 mt-1">
                物料: {materialCode} - {materialName} | 工艺站点: {processStationCode}
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

        <div className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* 搜索和筛选 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索批次号、批号或物料名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部位置</option>
                {locationOptions.filter(loc => loc !== 'all').map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="completed">已完成</option>
                <option value="pending">待处理</option>
              </select>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                筛选
              </button>
            </div>
          </div>

          {/* 物料批次列表 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">可选择的物料批次</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select-all-batches"
                  checked={selectedBatchIds.length === filteredBatches.length && filteredBatches.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="select-all-batches" className="text-sm text-gray-700">
                  全选 ({filteredBatches.length} 个批次)
                </label>
              </div>
            </div>

            {filteredBatches.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Package className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">暂无符合条件的物料批次</p>
                <p className="text-xs text-gray-400 mt-1">请调整搜索条件</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatchIds.includes(batch.id)}
                      onChange={(e) => handleBatchSelection(batch.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 grid grid-cols-6 gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{batch.batchNumber}</p>
                        {batch.lotNumber && (
                          <p className="text-sm text-gray-500">批号: {batch.lotNumber}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">物料</p>
                        <p className="font-medium text-gray-900">{batch.materialName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">规格</p>
                        <p className="font-medium text-gray-900">{batch.specification}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">数量</p>
                        <p className="font-medium text-gray-900">
                          {batch.pickedQuantity} {batch.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">位置</p>
                        <p className="font-medium text-gray-900">{batch.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">入库日期</p>
                        <p className="font-medium text-gray-900">
                          {batch.pickedDate.toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-1 text-sm font-medium ${
                      batch.inboundStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      <span>{batch.inboundStatus === 'completed' ? '可转移' : '待处理'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 选中批次统计 */}
          {selectedBatchIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">已选择 {selectedBatchIds.length} 个物料批次</span>
                </div>
                <div className="text-blue-700 font-medium">
                  总计: {getSelectedBatchesTotal()} 个物料单位
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            共 {availableBatchesForMaterial.length} 个可用物料批次
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedBatchIds.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              确认选择 ({selectedBatchIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};