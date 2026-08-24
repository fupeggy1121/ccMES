// src/components/TransferOperationModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ProductCodeInputSelector from './ProductCodeInputSelector';
import { BatchData, ProductData, SubBatchData, BatchDataItem, StationData } from '../types';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import { useBatchOperations } from '../contexts/BatchOperationsContext'; // 导入 Context

// 移除：import { mockProductMainPathStations } from '../data/processPaths';
// 移除：const mockAllProducts: ProductData[] = [...];

interface TransferOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    batchId: string,
    targetProductCode: string,
    currentCutOutStation: string,
    targetCutInStation: string
  ) => void;
  selectedBatch: BatchData | null;
  getSubBatchesForMaster?: (masterBatchId: string) => Promise<SubBatchData[]>; // 变为异步
  getStatusColor?: (status: string) => string;
  // 移除 batchData?: BatchDataItem[];
}

const TransferOperationModal: React.FC<TransferOperationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedBatch,
  getSubBatchesForMaster = async () => [], // 默认值变为异步函数
  getStatusColor = () => 'text-gray-600 bg-gray-100',
  // 移除 batchData,
}) => {
  const { fetchProducts, fetchStations } = useBatchOperations(); // 从 Context 获取数据和函数

  const [targetProductCode, setTargetProductCode] = useState<string>('');
  const [currentCutOutStation, setCurrentCutOutStation] = useState<string>('');
  const [targetCutInStation, setTargetCutInStation] = useState<string>('');

  const [allProducts, setAllProducts] = useState<ProductData[]>([]); // 存储从数据库获取的产品数据
  const [allStations, setAllStations] = useState<StationData[]>([]); // 存储从数据库获取的站点数据

  // 在组件挂载时获取产品和站点数据
  useEffect(() => {
    const loadData = async () => {
      const products = await fetchProducts();
      setAllProducts(products);
      const stations = await fetchStations();
      setAllStations(stations);
    };
    loadData();
  }, [fetchProducts, fetchStations]);

  // 根据产品编码获取可用的站点列表
  const getStationsForProduct = useCallback((productCode: string | undefined) => {
    if (!productCode) return [];
    // 实际逻辑中，这里应该根据 productCode 查询该产品对应的工艺路径上的站点
    // 目前简化为返回所有站点，或者根据 mockProductMainPathStations 模拟
    // 假设 allStations 包含了所有可能的站点
    return allStations;
  }, [allStations]);

  // 重置表单状态
  useEffect(() => {
    if (isOpen) {
      setTargetProductCode('');
      setCurrentCutOutStation('');
      setTargetCutInStation('');
    }
  }, [isOpen]);

  // 当选中批次变化时，更新当前料号切出站点选项
  useEffect(() => {
    if (selectedBatch) {
      const currentStations = getStationsForProduct(selectedBatch.productCode);
      if (currentStations.length > 0) {
        setCurrentCutOutStation(currentStations[0].code);
      } else {
        setCurrentCutOutStation('');
      }
    }
  }, [selectedBatch, getStationsForProduct]);

  // 当目标产品料号变化时，更新目标料号切入站点选项
  useEffect(() => {
    if (targetProductCode) {
      const targetStations = getStationsForProduct(targetProductCode);
      if (targetStations.length > 0) {
        setTargetCutInStation(targetStations[0].code);
      } else {
        setTargetCutInStation('');
      }
    } else {
      setTargetCutInStation('');
    }
  }, [targetProductCode, getStationsForProduct]);


  const handleSelectTargetProduct = (product: ProductData) => {
    setTargetProductCode(product.productCode);
  };

  const handleConfirmTransfer = () => {
    if (!selectedBatch) {
      alert('没有选中的批次信息！');
      return;
    }
    if (!targetProductCode || !currentCutOutStation || !targetCutInStation) {
      alert('请填写所有必填项：转档目标料号、当前料号切出站点、目标料号切入站点！');
      return;
    }

    if (window.confirm('确定要执行转档操作吗？')) {
      onConfirm(
        selectedBatch.id,
        targetProductCode,
        currentCutOutStation,
        targetCutInStation
      );
      onClose();
    }
  };

  if (!isOpen || !selectedBatch) return null;

  const actualSubBatches = getSubBatchesForMaster(selectedBatch.id); // 注意这里仍然是 Promise<SubBatchData[]>
  const currentProductStations = getStationsForProduct(selectedBatch.productCode);
  const targetProductStations = getStationsForProduct(targetProductCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">转档操作</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5">
          {/* 设备&站点模块 */}
          <EquipmentStationInfo selectedBatch={selectedBatch} />

          {/* 批次信息模块 */}
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            // batchData={batchData} // 移除此行
            subBatches={[]} // 暂时传入空数组，因为 actualSubBatches 是 Promise
          />

          {/* 转档配置模块 */}
          <div className="p-4 bg-white  mt-4">
            <h3 className="text-lg font-semibold mb-3">转档配置</h3>
            <div className="space-y-4">
              {/* 转档目标料号 - 使用新组件 */}
              <div>
                <label htmlFor="targetProductCode" className="block text-sm font-medium text-gray-700 mb-1">
                  转档目标料号:
                </label>
                <ProductCodeInputSelector
                  value={targetProductCode}
                  onSelect={handleSelectTargetProduct}
                  allProducts={allProducts} // 传递所有产品数据
                />
              </div>

              {/* 当前料号切出站点 */}
              <div>
                <label htmlFor="currentCutOutStation" className="block text-sm font-medium text-gray-700 mb-1">
                  当前料号切出站点:
                </label>
                <select
                  id="currentCutOutStation"
                  value={currentCutOutStation}
                  onChange={(e) => setCurrentCutOutStation(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                >
                  {currentProductStations.length > 0 ? (
                    currentProductStations.map((station) => (
                      <option key={station.code} value={station.code}>
                        {station.name} ({station.code})
                      </option>
                    ))
                  ) : (
                    <option value="">无可用站点</option>
                  )}
                </select>
              </div>

              {/* 目标料号切入站点 */}
              <div>
                <label htmlFor="targetCutInStation" className="block text-sm font-medium text-gray-700 mb-1">
                  目标料号切入站点:
                </label>
                <select
                  id="targetCutInStation"
                  value={targetCutInStation}
                  onChange={(e) => setTargetCutInStation(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                >
                  {targetProductStations.length > 0 ? (
                    targetProductStations.map((station) => (
                      <option key={station.code} value={station.code}>
                        {station.name} ({station.code})
                      </option>
                    ))
                  ) : (
                    <option value="">请先选择目标料号</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-5 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirmTransfer}
            className="px-4 py-2 text-sm font-medium text-white rounded-md bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            确认转档
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferOperationModal;
