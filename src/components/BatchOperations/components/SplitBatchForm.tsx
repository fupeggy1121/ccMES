// src/components/SplitBatchForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Archive, Info } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import { BatchData, SubBatchData, BatchDataItem, CarrierData, WaferData, TargetCarrier, StationData } from '../types';
import { batchApiService } from '../services/batchApiService';

interface StagingArea {
  id: string;
  name: string;
  description: string;
}

/** 工厂常用暂存区列表（可后续从后端获取） */
const STAGING_AREAS: StagingArea[] = [
  { id: 'MRB_REVIEW', name: 'MRB待评审区', description: '不良品待工程评审' },
  { id: 'STAGE_A', name: '暂存区-A', description: '通用暂存，片场零头片' },
  { id: 'STAGE_B', name: '暂存区-B', description: '通用暂存，片场零头片' },
  { id: 'REWORK_PENDING', name: '返工待处理区', description: '评审后标记为返工' },
  { id: 'SCRAP_PENDING', name: '报废待处理区', description: '评审后标记为直接报废' },
  { id: 'RESIDUAL_STOCK', name: '残值入库区', description: '评审后标记为残值入库' },
];

interface SplitBatchFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string, allStations: StationData[], parentBatch: BatchData | null) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
  onConfirmSplit: (payload: { stagingAreaId?: string; targetCarriers: TargetCarrier[]; targetWafers: WaferData[] }) => Promise<void>;
}

const SplitBatchForm: React.FC<SplitBatchFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  onConfirmSplit,
}) => {
  const [sourceCarriersForReorganization, setSourceCarriersForReorganization] = useState<CarrierData[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('0');
  const [selectedStagingAreaId, setSelectedStagingAreaId] = useState<string>('');
  const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);
  // 新增：片篮重组的最新结果，确认拆批时随暂存区选择一起提交
  const [latestReorgResult, setLatestReorgResult] = useState<{ targetCarriers: TargetCarrier[]; targetWafers: WaferData[] }>({
    targetCarriers: [],
    targetWafers: [],
  });

  const fetchWafersForSubBatches = useCallback(async (subBatchCodes: string[], batchId: string) => {
    if (subBatchCodes.length === 0) return [];
    try {
      return await batchApiService.getWafersForSplit(subBatchCodes, batchId);
    } catch (err: any) {
      console.error('Error fetching wafers:', err.message);
      return [];
    }
  }, []);

  useEffect(() => {
    const loadCarriers = async () => {
      if (selectedBatch && displayedFormSubBatches.length > 0) {
        const carriersData: CarrierData[] = displayedFormSubBatches.map(subBatch => ({
          id: subBatch.carrierId,
          sublotId: subBatch.sublotId,
          goodQty: subBatch.goodQty,
          defectQty: subBatch.defectQty,
          totalQty: subBatch.totalQty,
          masterBatchCode: selectedBatch.batchCode,
        }));
        setSourceCarriersForReorganization(carriersData);
      } else {
        setSourceCarriersForReorganization([]);
      }
    };
    loadCarriers();
  }, [selectedBatch, displayedFormSubBatches]);

  useEffect(() => {
    const loadWafers = async () => {
      if (selectedBatch && displayedFormSubBatches.length > 0) {
        const sublotIds = displayedFormSubBatches.map(sb => sb.sublotId);
        const fetched = await fetchWafersForSubBatches(sublotIds, selectedBatch.id);
        setWafersForCurrentForm(fetched);
      } else {
        setWafersForCurrentForm([]);
      }
    };
    loadWafers();
  }, [selectedBatch, displayedFormSubBatches, fetchWafersForSubBatches]);

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
            subBatches={displayedFormSubBatches}
          />
        </div>

        {/* 片篮更换模块 */}
        <WaferBasketReorganizationModule
          initialSourceCarriers={sourceCarriersForReorganization}
          onReorganizationStateChange={(targetCarriers, targetWafers) => setLatestReorgResult({ targetCarriers, targetWafers })}
          initialWafers={wafersForCurrentForm}
          disableWaferTypeSelection={true}
          readOnlyWaferDetails={true}
          showBatchActionButtons={false}
          selectedMode={selectedMode} // 新增：将 selectedMode 传递给子组件
          disableBatchWaferTypeActions={true} // 新增：禁用批量晶圆类型操作按钮          
        />

        {/* 暂存区选择 */}
        <div className="mt-4">
          <div className="px-4 py-4 space-y-3">
            {selectedBatch?.status === '暂存' ? (
              /* 批次已在暂存区：只读展示 */
              <div className="space-y-2">
                <label className="block text-gray-600 mb-1">
                  暂存区位置
                </label>
                <div className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600">
                  <Archive className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>批次已在暂存区（暂存状态）</span>
                  <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">只读</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-gray-600 mb-1">
                  选择暂存区位置
                </label>
                <select
                  value={selectedStagingAreaId}
                  onChange={e => setSelectedStagingAreaId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="">— 不移入暂存区 —</option>
                  {STAGING_AREAS.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name} — {area.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 说明提示 */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                拆出的批次移入暂存区后将在<strong>「暂存在制批次」标签页</strong>中显示，适用于暂时无法在产线处理的片子（不良片、零头片等）。
                <br />不良品后续需经 MRB 评审流程，评审完成后可处置为：
                <span className="ml-1 inline-flex flex-wrap gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">返工</span>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">直接报废</span>
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">残值入库</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            onClick={handleBackToBatchList}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            关闭
          </button>
          <button
            onClick={() => onConfirmSplit({
              stagingAreaId: selectedStagingAreaId || undefined,
              targetCarriers: latestReorgResult.targetCarriers,
              targetWafers: latestReorgResult.targetWafers,
            })}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            确认拆批
          </button>
        </div>
    </>
  );
};

export default SplitBatchForm;
