// src/components/InstationForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import { BatchData, SubBatchData, CarrierData, WaferData } from '../types';
import { batchApiService } from '../services/batchApiService';

interface InstationFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
}

const InstationForm: React.FC<InstationFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
}) => {
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
          // ignore fetch errors; module falls back to placeholder generation
        }
      }
    };
    loadWafers();
  }, [selectedBatch, displayedFormSubBatches]);

  const handleConfirmInstation = () => {
    if (selectedBatch) {
      console.log('确认进站操作:', selectedBatch.batchCode);
      handleBackToBatchList();
    }
  };

  return (
    <>
        <div className="bg-white rounded-lg shadow-sm mb-2">
          {/* 设备&站点 Section */}
          <EquipmentStationInfo selectedBatch={selectedBatch} />

          {/* 批次信息 Section */}
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />

          {/* 晶圆信息显示区域 */}
          {displayedFormSubBatches && displayedFormSubBatches.length > 0 && (
            <WaferBasketReorganizationModule
              initialSourceCarriers={sourceCarriersForReorganization}
              initialWafers={wafersForCurrentForm}
              selectedMode=""
              onReorganizationStateChange={() => {}}
              readOnlyWaferDetails={true}
              hideTargetSection={true}
              hideTransferButtons={true}
              showBatchActionButtons={true}
              disableBatchWaferTypeActions={true}
              disableWaferTypeSelection={true}
              isDefectEntryMode={false}
            />
          )}

          {/* 底部操作按钮 */}
          <div className="p-4 flex justify-end space-x-4 border-t">
            <button
              onClick={handleBackToBatchList}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              onClick={handleConfirmInstation}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              确认进站
            </button>
          </div>
        </div>
    </>
  );
};

export default InstationForm;