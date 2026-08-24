// src/components/CancelDefectEntryForm.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import CancelDefectWaferReorganizationModule from './CancelDefectWaferReorganizationModule';
import { BatchData, SubBatchData, BatchDataItem, CarrierData, WaferData, TargetCarrier, WaferLossRecord } from '../types';
import { useBatchOperations } from '../contexts/BatchOperationsContext'; // 导入 Context

interface CancelDefectEntryFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  // 移除 batchDataForDisplay: BatchDataItem[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>; // 变为异步
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
}

const CancelDefectEntryForm: React.FC<CancelDefectEntryFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  // 移除 batchDataForDisplay,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
}) => {
  const { fetchLossWafers } = useBatchOperations(); // 从 Context 获取 fetchLossWafers
  const [allLossWafers, setAllLossWafers] = useState<WaferLossRecord[]>([]); // 存储从数据库获取的损失晶圆

  useEffect(() => {
    const loadLossWafers = async () => {
      const lossWafers = await fetchLossWafers();
      setAllLossWafers(lossWafers);
    };
    loadLossWafers();
  }, [fetchLossWafers]);

  // 将 displayedFormSubBatches 转换为 CancelDefectWaferReorganizationModule 所需的 CarrierData 格式
  const sourceCarriersForReorganization: CarrierData[] = useMemo(() => {
    if (!displayedFormSubBatches) return [];
    return displayedFormSubBatches.map(subBatch => ({
      id: subBatch.carrierId,
      sublotId: subBatch.sublotId,
      goodQty: subBatch.goodQty,
      defectQty: subBatch.defectQty,
      totalQty: subBatch.totalQty,
      masterBatchCode: selectedBatch?.batchCode || '',
    }));
  }, [displayedFormSubBatches, selectedBatch?.batchCode]);

  const [reorganizationCarriers, setReorganizationCarriers] = useState<CarrierData[]>([]);

  useEffect(() => {
    setReorganizationCarriers(sourceCarriersForReorganization);
  }, [sourceCarriersForReorganization]);

  // 处理晶圆片转移确认
  const handleConfirmWaferTransfer = (finalSourceWafers: WaferData[]) => {
    console.log('不良品录入取消 - 晶圆片转移确认!');
    console.log('Final Source Wafers:', finalSourceWafers);

    alert('不良品录入取消操作已确认！');
    handleBackToBatchList();
  };

  const handleConfirmCancel = () => {
    if (selectedBatch) {
      console.log('确认不良品录入取消操作:', selectedBatch.batchCode);
      handleBackToBatchList();
    }
  };

  return (
    <>
        <div className="bg-white rounded-lg shadow-sm mb-4">
          {/* 设备&站点 Section */}
          <EquipmentStationInfo selectedBatch={selectedBatch} />

          {/* 批次信息 Section */}
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            // batchData={batchDataForDisplay} // 移除此行
            subBatches={displayedFormSubBatches}
          />
        </div>

        {/* 晶圆片重组模块 */}
        <CancelDefectWaferReorganizationModule
          initialSourceCarriers={sourceCarriersForReorganization}
          carriers={reorganizationCarriers}
          setCarriers={setReorganizationCarriers}
          onConfirmTransfer={handleConfirmWaferTransfer}
          disableWaferTypeSelection={false}
          showBatchActionButtons={true}
          mockLossWafers={allLossWafers} // 传递从数据库获取的损失晶圆
        />

        {/* 底部操作按钮 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleBackToBatchList}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              onClick={handleConfirmCancel}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              确认取消不良品录入
            </button>
          </div>
        </div>
    </>
  );
};

export default CancelDefectEntryForm;
