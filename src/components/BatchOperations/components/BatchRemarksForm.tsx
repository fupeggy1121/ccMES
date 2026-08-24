// src/components/BatchRemarksForm.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import BatchRemarksEditor from './BatchRemarksEditor';
import { BatchData, SubBatchData } from '../types';
import { mockStationRemarks, StationRemark } from '../data/mockStationRemarks';

interface BatchRemarksFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  currentBatchRemarks: string[];
  onSaveBatchRemarks: (remarks: string[]) => void;
}

const BatchRemarksForm: React.FC<BatchRemarksFormProps> = ({
  isOpen,
  onClose,
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  currentBatchRemarks,
  onSaveBatchRemarks
}) => {
  const [localRemarks, setLocalRemarks] = useState<string[]>(currentBatchRemarks);
  const [stationRemarks, setStationRemarks] = useState<StationRemark | null>(null);

  // 加载站点备注
useEffect(() => {
  if (selectedBatch?.station) {
    const foundStationRemarks = mockStationRemarks.find(
      remark => remark.stationCode === selectedBatch.station
    );
    setStationRemarks(foundStationRemarks || null);
  } else {
    setStationRemarks(null);
  }
}, [selectedBatch]);


  if (!isOpen || !selectedBatch) return null;

  const handleSave = () => {
    const filteredRemarks = localRemarks.filter(remark => remark.trim() !== '');
    onSaveBatchRemarks(filteredRemarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">批次备注</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 设备&站点信息 */}
          <EquipmentStationInfo selectedBatch={selectedBatch} />

          {/* 批次信息 */}
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />

          {/* 站点备注模块 */}
          {stationRemarks && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
                <span>站点备注</span>
                <span className="text-sm font-normal text-gray-500">
                  最后更新: {stationRemarks.lastUpdated}
                </span>
              </h3>
              <div className="space-y-3">
                {stationRemarks.remarks.map((remark, index) => (
                  <div 
                    key={index} 
                    className="flex items-start p-3 bg-white rounded border border-gray-100"
                  >
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span className="text-gray-700">{remark}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span className="font-medium">站点:</span> {stationRemarks.stationName} ({stationRemarks.stationCode})
              </div>
            </div>
          )}

          {/* 批次备注编辑 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">批次备注</h3>
            <BatchRemarksEditor
              remarks={localRemarks}
              onRemarksChange={setLocalRemarks}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchRemarksForm;