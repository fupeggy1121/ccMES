// src/components/DefectEntryForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import { BatchData, SubBatchData, BatchDataItem, CarrierData, WaferData, TargetCarrier } from '../types';
import { batchApiService } from '../services/batchApiService';

interface DefectEntryFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  // 移除 batchDataForDisplay: BatchDataItem[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>; // 变为异步
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
  // 移除 mockSourceCarriers: CarrierData[];
  handleConfirmWaferTransfer: (finalTargetCarriers: TargetCarrier[], finalSourceWafers: WaferData[]) => void;
}

const DefectEntryForm: React.FC<DefectEntryFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  // 移除 batchDataForDisplay,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  // 移除 mockSourceCarriers,
  handleConfirmWaferTransfer,
}) => {
  // 将 displayedFormSubBatches 转换为 WaferBasketReorganizationModule 所需的 CarrierData 格式
  const sourceCarriersForReorganization: CarrierData[] = useMemo(() => {
    if (!displayedFormSubBatches) return [];
    return displayedFormSubBatches.map(subBatch => ({
      id: subBatch.carrierId,
      sublotId: subBatch.sublotId,
      goodQty: subBatch.goodQty,
      defectQty: subBatch.defectQty,
      totalQty: subBatch.totalQty,
      masterBatchCode: selectedBatch?.batchCode || '',
      productCode: selectedBatch?.productCode || ''
    }));
  }, [displayedFormSubBatches, selectedBatch]);

  const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);

  useEffect(() => {
    const loadWafers = async () => {
      if (selectedBatch && displayedFormSubBatches.length > 0) {
        const subBatchUUIDs = displayedFormSubBatches.map(sb => sb.id);
        try {
          const wafers = await batchApiService.getWaferCarrierContents(subBatchUUIDs, selectedBatch.id);
          if (wafers.length > 0) setWafersForCurrentForm(wafers);
        } catch {
          // ignore; module falls back to placeholder generation
        }
      }
    };
    loadWafers();
  }, [selectedBatch, displayedFormSubBatches]);

  const handleConfirmDefectEntry = () => {
    if (selectedBatch) {
      console.log('确认不良品录入操作:', selectedBatch.batchCode);
      // 这里可以添加调用API处理不良品录入操作的逻辑
      // handleConfirmWaferTransfer 应该在这里被调用，处理片重组的结果
      // onConfirmTransfer(finalTargetCarriers, finalSourceWafers);
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

          {/* 片重组模块：不良品录入只需源片篮及片详情，无需目标片篮操作 */}
          <WaferBasketReorganizationModule
            initialSourceCarriers={sourceCarriersForReorganization}
            initialWafers={wafersForCurrentForm}
            onConfirmTransfer={handleConfirmWaferTransfer}
            isDefectEntryMode={true}
            disableWaferTypeSelection={false}
            showBatchActionButtons={true}
            hideTransferButtons={true}
            hideTargetSection={true}
          />

          {/* 底部操作按钮 */}
          <div className="p-6 flex justify-end space-x-4 border-t">
            <button
              onClick={handleBackToBatchList}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              onClick={handleConfirmDefectEntry}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              确认不良品录入
            </button>
          </div>
        </div>
    </>
  );
};

export default DefectEntryForm;
