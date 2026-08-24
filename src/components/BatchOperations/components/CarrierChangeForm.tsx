// src/components/CarrierChangeForm.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Check, Eye, Plus, Trash2 } from 'lucide-react';
import { BatchData, SubBatchData, WaferData, TargetCarrier, CarrierData } from '../types';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import { batchApiService } from '../services/batchApiService';

// 倒篮模式定义
const CARRIER_CHANGE_MODES = [
  { id: '0', name: '0 - carrier change-backward' },
  { id: '1', name: '1 - carrier change-forward' },
  { id: '2', name: '2 - carrier change-parallel' },
  { id: '3', name: '3 - same carrier-return' },
  { id: '4', name: '4 - carrier change-reverse backward' },
  { id: '5', name: '5 - carrier change-reverse forward' },
  { id: '6', name: '6 - carrier change-reverse parallel' },
  { id: 'A', name: 'A - Regeneration -backward backward' },
  { id: 'B', name: 'B - Regeneration - forward backward' },
  { id: 'C', name: 'C - Regeneration -reverse' },
  { id: 'D', name: 'D - Regeneration -reverse' },
];

interface CarrierChangeFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>; // 变为异步
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
  onConfirmCarrierChange: (selectedSubBatches: SubBatchData[], mode: string, targetCarriers: TargetCarrier[], finalWafers: WaferData[]) => void;
}

const CarrierChangeForm: React.FC<CarrierChangeFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  onConfirmCarrierChange,
}) => {
  // 状态管理
  const [selectedMode, setSelectedMode] = useState<string>('0');
  const [previewResult, setPreviewResult] = useState<{
    targetCarriers: TargetCarrier[];
    finalWafers: WaferData[];
  } | null>(null);
  // key 用于强制重挂载 WaferBasketReorganizationModule
  const [previewKey, setPreviewKey] = useState(0);

  // 重组模块状态
  const [reorganizationState, setReorganizationState] = useState<{
    targetCarriers: TargetCarrier[];
    finalWafers: WaferData[];
  } | null>(null);

  // 处理模式选择变化
  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
    setPreviewResult(null); // 重置预览结果
    setReorganizationState(null); // 重置重组状态
  };

  // 处理预览操作
  const handlePreview = () => {
    if (displayedFormSubBatches.length === 0) {
      alert('没有可操作的子批次');
      return;
    }

    const CARRIER_CAPACITY = 25;
    // 获取所有非空源晶圆（按源片篮顺序排列）
    const allSourceWafers = wafersForCurrentForm.filter(w => w.waferId !== '');

    let previewTargetCarriers: TargetCarrier[];
    let previewWafers: WaferData[];

    if (['A', 'B', 'C', 'D'].includes(selectedMode)) {
      // 再生模式：目标片篮与源片篮一一对应，片子保留在原片篮
      previewTargetCarriers = initialSourceCarriers.map(c => ({
        id: c.id,
        goodQty: allSourceWafers.length > 0
          ? allSourceWafers.filter(w => w.carrierId === c.id && w.type === 'GOOD').length
          : c.goodQty,
        defectQty: allSourceWafers.length > 0
          ? allSourceWafers.filter(w => w.carrierId === c.id && (w.type === 'REJECT' || w.type === 'LOSS' || w.type === 'BAD')).length
          : c.defectQty,
      }));
      previewWafers = allSourceWafers;
    } else if (selectedMode === '3') {
      // 模式3：同片篮返回，片子留在原片篮
      previewTargetCarriers = initialSourceCarriers.map(c => ({
        id: c.id,
        goodQty: allSourceWafers.length > 0
          ? allSourceWafers.filter(w => w.carrierId === c.id && w.type === 'GOOD').length
          : c.goodQty,
        defectQty: allSourceWafers.length > 0
          ? allSourceWafers.filter(w => w.carrierId === c.id && (w.type === 'REJECT' || w.type === 'LOSS' || w.type === 'BAD')).length
          : c.defectQty,
      }));
      previewWafers = allSourceWafers;
    } else {
      // 模式0/1/2/4/5/6：将源片篮片子合并后按容量（25片/篮）依次分配到新目标片篮
      previewTargetCarriers = [];
      previewWafers = [];

      if (allSourceWafers.length > 0) {
        // 有具体晶圆数据：按序分配，每篮最多 CARRIER_CAPACITY 片
        const carriersNeeded = Math.max(1, Math.ceil(allSourceWafers.length / CARRIER_CAPACITY));
        for (let ci = 0; ci < carriersNeeded; ci++) {
          const targetId = `SA${String(ci + 1).padStart(3, '0')}`;
          const slice = allSourceWafers.slice(ci * CARRIER_CAPACITY, (ci + 1) * CARRIER_CAPACITY);
          const assigned = slice.map((w, idx) => ({ ...w, carrierId: targetId, slotNo: idx + 1 }));
          previewWafers.push(...assigned);
          previewTargetCarriers.push({
            id: targetId,
            goodQty: assigned.filter(w => w.type === 'GOOD').length,
            defectQty: assigned.filter(w => w.type === 'REJECT' || w.type === 'LOSS' || w.type === 'BAD').length,
          });
        }
      } else {
        // 无具体晶圆数据：按子批次汇总片数估算所需片篮数量
        const totalAll = displayedFormSubBatches.reduce((s, sb) => s + sb.totalQty, 0);
        const totalGoodAll = displayedFormSubBatches.reduce((s, sb) => s + sb.goodQty, 0);
        const totalDefectAll = displayedFormSubBatches.reduce((s, sb) => s + sb.defectQty, 0);
        const carriersNeeded = Math.max(1, Math.ceil(totalAll / CARRIER_CAPACITY));
        for (let ci = 0; ci < carriersNeeded; ci++) {
          const targetId = `SA${String(ci + 1).padStart(3, '0')}`;
          const wafersInThisCarrier = ci < carriersNeeded - 1
            ? CARRIER_CAPACITY
            : totalAll - ci * CARRIER_CAPACITY;
          // 按整批良品/不良比例估算本片篮分布
          const goodInCarrier = totalAll > 0
            ? Math.round((totalGoodAll / totalAll) * wafersInThisCarrier)
            : 0;
          const defectInCarrier = wafersInThisCarrier - goodInCarrier;
          previewTargetCarriers.push({ id: targetId, goodQty: goodInCarrier, defectQty: Math.max(0, defectInCarrier) });
        }
      }
    }

    setPreviewResult({ targetCarriers: previewTargetCarriers, finalWafers: previewWafers });
    setPreviewKey(k => k + 1); // 强制重挂载片篮模块展示预览效果
  };

  // 处理确认执行
  const handleConfirm = () => {
    if (!reorganizationState) {
      alert('请先预览操作结果');
      return;
    }
    
    // 使用所有displayedFormSubBatches作为操作的子批次
    onConfirmCarrierChange(
      displayedFormSubBatches,
      selectedMode,
      reorganizationState.targetCarriers,
      reorganizationState.finalWafers
    );
  };

  // 晶圆数据加载
  const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);

  useEffect(() => {
    const loadWafers = async () => {
      if (selectedBatch && displayedFormSubBatches.length > 0) {
        const subBatchUUIDs = displayedFormSubBatches.map(sb => sb.id);
        try {
          const fetched = await batchApiService.getWaferCarrierContents(subBatchUUIDs, selectedBatch.id);
          setWafersForCurrentForm(fetched);
        } catch {
          setWafersForCurrentForm([]);
        }
      } else {
        setWafersForCurrentForm([]);
      }
    };
    loadWafers();
  }, [selectedBatch, displayedFormSubBatches]);

  // 重置表单
  const handleReset = () => {
    setSelectedMode('0');
    setPreviewResult(null);
    setReorganizationState(null);
    setPreviewKey(k => k + 1); // 重挂载恢复默认状态
  };

  // 处理重组状态变化
  const handleReorganizationStateChange = (
    finalTargetCarriers: TargetCarrier[],
    finalWafers: WaferData[]
  ) => {
    setReorganizationState({ targetCarriers: finalTargetCarriers, finalWafers: finalWafers });
  };

  // 根据displayedFormSubBatches生成源片篮数据
  const initialSourceCarriers = useMemo((): CarrierData[] => {
    if (displayedFormSubBatches.length === 0) return [];
    
    return displayedFormSubBatches.map(subBatch => ({
      id: subBatch.carrierId,
      sublotId: subBatch.sublotId,
      goodQty: subBatch.goodQty,
      defectQty: subBatch.defectQty,
      totalQty: subBatch.totalQty,
      masterBatchCode: selectedBatch?.batchCode || ''
    }));
  }, [displayedFormSubBatches, selectedBatch]);

  // 根据预览状态计算源片篮展示数据：预览时源片篮各数量置零（展示为空）
  const previewSourceCarriers = useMemo((): CarrierData[] => {
    if (!previewResult) return initialSourceCarriers;
    return initialSourceCarriers.map(c => ({ ...c, goodQty: 0, defectQty: 0, totalQty: 0 }));
  }, [previewResult, initialSourceCarriers]);

  // 计算总晶圆片数
  const totalWafers = useMemo(() => {
    return displayedFormSubBatches.reduce((sum, subBatch) => sum + subBatch.totalQty, 0);
  }, [displayedFormSubBatches]);

  // 计算总良品数
  const totalGoodWafers = useMemo(() => {
    return displayedFormSubBatches.reduce((sum, subBatch) => sum + subBatch.goodQty, 0);
  }, [displayedFormSubBatches]);

  // 计算总不良品数
  const totalDefectWafers = useMemo(() => {
    return displayedFormSubBatches.reduce((sum, subBatch) => sum + subBatch.defectQty, 0);
  }, [displayedFormSubBatches]);


  if (!selectedBatch) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">未选择批次</p>
          <button
            onClick={handleBackToBatchList}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回批次列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* 设备&站点信息 */}
            <EquipmentStationInfo selectedBatch={selectedBatch} />

            {/* 批次信息 Section */}
            <BatchInfoDisplay
              selectedBatch={selectedBatch}
              getSubBatchesForMaster={getSubBatchesForMaster}
              getStatusColor={getStatusColor}
              subBatches={displayedFormSubBatches}
            />


            {/* 倒篮模式选择 */}
            <div className=" p-4">
              <h2 className="text-base font-medium mb-2 text-gray-700">选择倒篮模式</h2>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <select
                    value={selectedMode}
                    onChange={(e) => handleModeChange(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CARRIER_CHANGE_MODES.map((mode) => (
                      <option key={mode.id} value={mode.id}>
                        {mode.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handlePreview}
                  disabled={displayedFormSubBatches.length === 0}
                  className={`flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    displayedFormSubBatches.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 晶圆片重组模块：预览时 key 变化强制重挂载，源片篮置空，目标展示预览结果 */}
            {displayedFormSubBatches.length > 0 && (
              <WaferBasketReorganizationModule
                key={previewKey}
                initialSourceCarriers={previewSourceCarriers}
                selectedMode={selectedMode}
                onReorganizationStateChange={handleReorganizationStateChange}
                initialWafers={previewResult ? [] : wafersForCurrentForm}
                initialTargetWafers={previewResult?.finalWafers}
                initialTargetCarriers={previewResult?.targetCarriers}
                disableWaferTypeSelection={false}
                showBatchActionButtons={false}
                hideTargetMoveButtons={true}
                hideTransferButtons={true}
              />
            )}

            {/* 操作按钮区域 */}
            <div className="flex justify-between pt-6 border-t">
              <div className="space-x-3">
                <button
                  onClick={handleBackToBatchList}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  关闭
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  重置
                </button>
              </div>
              
              <div className="space-x-3">
                {/* 注意：确认执行按钮已移除 */}
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default CarrierChangeForm;