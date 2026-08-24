// src/components/EquipmentStationInfo.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { BatchData } from '../types'; // 从共享类型文件导入

interface EquipmentStationInfoProps {
  selectedBatch: BatchData | null;
}

const EquipmentStationInfo: React.FC<EquipmentStationInfoProps> = ({ selectedBatch }) => {
  // 判断批次是否处于"待进站"状态
  const isPendingEntry = selectedBatch?.status === '待进站';

  return (
    <div className="p-4">
      <h2 className="text-base font-medium mb-2 text-gray-700">设备&站点</h2>
      <div className="grid grid-cols-7 gap-4 text-sm">
        {/* 站点 - 合并字段 */}
        <div className="col-span-2">
          <label className="block text-gray-600 mb-1">站点</label>
          <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden">
            <input
              className="flex-1 px-3 py-2 bg-transparent focus:outline-none"
              value={selectedBatch?.station || ''}
              readOnly
            />
            <span className="px-1 text-gray-500">-</span>
            <input
              className="flex-1 px-3 py-2 bg-transparent focus:outline-none"
              value={selectedBatch?.stationName || ''}
              readOnly
            />
          </div>
        </div>

        {/* 设备 - 合并字段 */}
        <div className="col-span-2">
          <label className="block text-gray-600 mb-1">设备</label>
          <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden">
            <input
              className="flex-1 px-3 py-2 bg-transparent focus:outline-none"
              value={selectedBatch?.equipmentCode || ''}
              readOnly
              disabled={true}
            />
            <span className="px-1 text-gray-500">-</span>
            <input
              className="flex-1 px-3 py-2 bg-transparent focus:outline-none"
              value={selectedBatch?.equipmentName || ''}
              readOnly
              disabled={true}
            />
          </div>
        </div>

        {/* 设备腔室 */}
        <div>
          <label className="block text-gray-600 mb-1">设备腔室</label>
          <div className="relative">
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 appearance-none pr-8 cursor-not-allowed"
              value={selectedBatch?.equipmentChamber || 'DEFAULT'}
              disabled={true}
              readOnly={true}
            >
              <option>{selectedBatch?.equipmentChamber || 'DEFAULT'}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* 下一站点 - 合并字段 */}
        <div className="col-span-2">
          <label className="block text-gray-600 mb-1">下一站点</label>
          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
            <input
              className="flex-1 px-3 py-2 focus:outline-none bg-gray-50"
              value={selectedBatch?.nextStationCode || ''}
              readOnly
              disabled={true}
            />
            <span className="px-1 text-gray-500">-</span>
            <input
              className="flex-1 px-3 py-2 focus:outline-none bg-gray-50"
              value={selectedBatch?.nextStationName || ''}
              readOnly
              disabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentStationInfo;