// src/components/CombineTrayBatchForm.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { X, Combine } from 'lucide-react';
import { BatchData, SubBatchData, ProductData, CarrierData, WaferData, TargetCarrier } from '../types';
import EquipmentStationInfo from './EquipmentStationInfo';
import ProductCodeInputSelector from './ProductCodeInputSelector';
import CombineTrayWaferReorganizationModule from './CombineTrayWaferReorganizationModule';
import { useBatchOperations } from '../contexts/BatchOperationsContext';
import BatchMultiSelectionModal from './BatchMultiSelectionModal';

interface CombineTrayBatchFormProps {
  handleBackToBatchList: () => void;
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
}

const CombineTrayBatchForm: React.FC<CombineTrayBatchFormProps> = ({
  handleBackToBatchList,
  getSubBatchesForMaster,
  getStatusColor,
}) => {
  const { 
    selectedBatch: initialSelectedBatch, 
    batchList: allBatchesFromContext, 
    fetchProducts 
  } = useBatchOperations();

  const productCodeFilter = initialSelectedBatch?.productCode || '';
  const stationFilter = initialSelectedBatch?.station || '';

  const [selectedAccumulateBatches, setSelectedAccumulateBatches] = useState<BatchData[]>(
    initialSelectedBatch ? [initialSelectedBatch] : []
  );
  const [isVirtualBatchConfirmed, setIsVirtualBatchConfirmed] = useState<boolean>(false);
  const [isBatchMultiSelectionModalOpen, setIsBatchMultiSelectionModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [sourceCarriersForReorganization, setSourceCarriersForReorganization] = useState<CarrierData[]>([]);
  const [isLoadingCarriers, setIsLoadingCarriers] = useState<boolean>(false);

  // 加载产品数据
  useEffect(() => {
    const loadProducts = async () => {
      const products = await fetchProducts();
      setAllProducts(products);
    };
    loadProducts();
  }, [fetchProducts]);

  // 异步加载源片篮数据
  useEffect(() => {
    const loadSourceCarriers = async () => {
      if (selectedAccumulateBatches.length === 0) {
        setSourceCarriersForReorganization([]);
        return;
      }

      setIsLoadingCarriers(true);
      try {
        const allSubBatches: SubBatchData[] = [];
        
        // 使用 for...of 循环处理异步操作
        for (const batch of selectedAccumulateBatches) {
          const subBatches = await getSubBatchesForMaster(batch.id);
          subBatches.forEach(subBatch => {
            allSubBatches.push({ ...subBatch, masterBatchCode: batch.batchCode });
          });
        }

        // 将 SubBatchData 映射为 CombineTrayWaferReorganizationModule 所需的 CarrierData
        const carriers = allSubBatches.map(subBatch => ({
          id: subBatch.carrierId,
          sublotId: subBatch.sublotId,
          goodQty: subBatch.goodQty,
          defectQty: subBatch.defectQty,
          masterBatchCode: subBatch.masterBatchCode,
        }));

        setSourceCarriersForReorganization(carriers);
      } catch (error) {
        console.error('加载源片篮数据失败:', error);
        alert('加载源片篮数据失败，请稍后重试');
      } finally {
        setIsLoadingCarriers(false);
      }
    };

    loadSourceCarriers();
  }, [selectedAccumulateBatches, getSubBatchesForMaster]);

  // 创建 displayBatchInfo 对象，将设备相关和下一站点相关字段置空
  const displayBatchInfo = useMemo(() => {
    if (!initialSelectedBatch) return null;
    
    return {
      ...initialSelectedBatch,
      equipmentCode: '',
      equipmentName: '',
      equipmentChamber: '',
      nextStationCode: '',
      nextStationName: '',
    };
  }, [initialSelectedBatch]);

  // 过滤可用的批次（用于模态框）
  const availableBatchesForModal = useMemo(() => {
    if (!initialSelectedBatch) return [];

    return allBatchesFromContext.filter(batch => {
      // 必须与 initialSelectedBatch 具有相同 productCode 和 station
      const matchesProductCode = batch.productCode === initialSelectedBatch.productCode;
      const matchesStation = batch.station === initialSelectedBatch.station;
      
      // 不能包含 initialSelectedBatch 本身
      const notInitialBatch = batch.id !== initialSelectedBatch.id;

      return matchesProductCode && matchesStation && notInitialBatch;
    });
  }, [initialSelectedBatch, allBatchesFromContext]);

  // 虚拟批次汇总信息
  const virtualBatchSummary = useMemo(() => {
    if (selectedAccumulateBatches.length === 0) {
      return null;
    }

    const totalQty = selectedAccumulateBatches.reduce((sum, batch) => sum + batch.totalQty, 0);
    const goodQty = selectedAccumulateBatches.reduce((sum, batch) => sum + batch.goodQty, 0);
    const defectQty = selectedAccumulateBatches.reduce((sum, batch) => sum + batch.defectQty, 0);
    const firstBatch = selectedAccumulateBatches[0];

    return {
      batchCode: `VIRTUAL-${firstBatch.productCode}-${firstBatch.station}-${Date.now()}`,
      productCode: firstBatch.productCode,
      productName: firstBatch.productName,
      stationName: firstBatch.stationName,
      equipmentName: firstBatch.equipmentName,
      totalQty,
      goodQty,
      defectQty,
      status: firstBatch.status,
    };
  }, [selectedAccumulateBatches]);

  // 打开批次多选模态框
  const handleOpenBatchMultiSelectionModal = () => {
    setIsBatchMultiSelectionModalOpen(true);
  };

  // 关闭批次多选模态框
  const handleCloseBatchMultiSelectionModal = () => {
    setIsBatchMultiSelectionModalOpen(false);
  };

  // 确认批次多选
  const handleConfirmBatchMultiSelection = (selectedBatchesFromModal: BatchData[]) => {
    // 过滤掉与 initialSelectedBatch ID 相同的批次
    const filteredBatches = selectedBatchesFromModal.filter(
      batch => batch.id !== initialSelectedBatch?.id
    );

    // 将 initialSelectedBatch 重新添加到数组的开头
    const newSelectedBatches = initialSelectedBatch 
      ? [initialSelectedBatch, ...filteredBatches]
      : filteredBatches;

    setSelectedAccumulateBatches(newSelectedBatches);
  };

  // 移除已选批次
  const handleRemoveSelectedBatch = (batchIdToRemove: string) => {
    // 检查是否尝试移除 initialSelectedBatch
    if (initialSelectedBatch && batchIdToRemove === initialSelectedBatch.id) {
      alert('不能移除初始批次。');
      return;
    }

    setSelectedAccumulateBatches(prev => 
      prev.filter(batch => batch.id !== batchIdToRemove)
    );
  };

  // 处理 CombineTrayWaferReorganizationModule 的确认回调
  const handleConfirmWaferTransfer = (finalTargetCarriers: TargetCarrier[], finalSourceWafers: WaferData[]) => {
    console.log('Wafer transfer confirmed from CombineTrayBatchForm!');
    console.log('Final Target Carriers:', finalTargetCarriers);
    console.log('Final Source Wafers:', finalSourceWafers);
    alert('片子移动重组操作已确认！');
    // 在这里可以添加将数据发送到后端API或更新应用状态的逻辑
  };

  return (
    <>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* 设备&站点信息模块 */}
            <EquipmentStationInfo selectedBatch={displayBatchInfo} />

            {/* 已选批次展示区域 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="font-medium mb-4 text-gray-800">已选批次</h2>
              
              {/* 已选批次标签 */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedAccumulateBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      <span>{batch.batchCode}</span>
                      {batch.id !== initialSelectedBatch?.id && (
                        <button
                          onClick={() => handleRemoveSelectedBatch(batch.id)}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* 添加批次按钮 - 移动到批次标签同一行 */}
                  <button
                    onClick={handleOpenBatchMultiSelectionModal}
                    className="flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="text-lg mr-1">+</span>
                    添加批次
                  </button>
                </div>
              </div>
            </div>

            {/* Combine Tray Wafer Reorganization Module */}
            {selectedAccumulateBatches.length > 0 && (
              <div>
                {isLoadingCarriers ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">正在加载源片篮数据...</p>
                  </div>
                ) : (
                  <CombineTrayWaferReorganizationModule
                    initialSourceCarriers={sourceCarriersForReorganization}
                    onConfirmCombine={handleConfirmWaferTransfer}
                  />
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                onClick={handleBackToBatchList}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                关闭
              </button>
            </div>
          </div>
        </div>

      {/* 批次多选模态框 */}
      <BatchMultiSelectionModal
        isOpen={isBatchMultiSelectionModalOpen}
        onClose={handleCloseBatchMultiSelectionModal}
        onSelect={handleConfirmBatchMultiSelection}
        initialSelectedBatchIds={selectedAccumulateBatches.map(batch => batch.id)}
        allBatches={availableBatchesForModal}
        productCodeFilter={productCodeFilter}
        stationFilter={stationFilter}
      />
    </>
  );
};

export default CombineTrayBatchForm;