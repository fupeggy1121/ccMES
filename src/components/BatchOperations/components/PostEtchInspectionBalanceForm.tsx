// src/components/PostEtchInspectionBalanceForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Scale, ArrowRight, ArrowLeft, CheckCircle2, Eye } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import { BatchData, SubBatchData, CarrierData, WaferData, TargetCarrier } from '../types';
import { batchApiService } from '../services/batchApiService';

// 倒篮模式定义（与「片篮更换」保持一致）
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

const CARRIER_CAPACITY = 25;
const DEFAULT_STAGING_AREA = 'MRB待评审区';

interface BalanceResult {
  targetCarriers: TargetCarrier[];
  finalWafers: WaferData[];
  balanced: boolean;
  note: string;
}

/** 按容量（25片/篮）将良品片依次装入新片篮；A-D/3 模式为 1:1 不倒篮 */
function distributeGoodWafers(
  mode: string,
  sourceCarriers: CarrierData[],
  allGoodWafers: WaferData[]
): { targetCarriers: TargetCarrier[]; finalWafers: WaferData[] } {
  if (['A', 'B', 'C', 'D', '3'].includes(mode)) {
    const targetCarriers: TargetCarrier[] = sourceCarriers.map(c => ({
      id: c.id,
      goodQty: allGoodWafers.length > 0
        ? allGoodWafers.filter(w => w.carrierId === c.id).length
        : c.goodQty,
      defectQty: 0,
    }));
    return { targetCarriers, finalWafers: allGoodWafers };
  }

  const targetCarriers: TargetCarrier[] = [];
  const finalWafers: WaferData[] = [];

  if (allGoodWafers.length > 0) {
    const carriersNeeded = Math.max(1, Math.ceil(allGoodWafers.length / CARRIER_CAPACITY));
    for (let ci = 0; ci < carriersNeeded; ci++) {
      const targetId = `SA${String(ci + 1).padStart(3, '0')}`;
      const slice = allGoodWafers.slice(ci * CARRIER_CAPACITY, (ci + 1) * CARRIER_CAPACITY);
      const assigned = slice.map((w, idx) => ({ ...w, carrierId: targetId, slotNo: idx + 1 }));
      finalWafers.push(...assigned);
      targetCarriers.push({ id: targetId, goodQty: assigned.length, defectQty: 0 });
    }
  } else {
    const totalGood = sourceCarriers.reduce((s, c) => s + c.goodQty, 0);
    const carriersNeeded = Math.max(1, Math.ceil(totalGood / CARRIER_CAPACITY));
    let waferSeq = 0;
    for (let ci = 0; ci < carriersNeeded; ci++) {
      const targetId = `SA${String(ci + 1).padStart(3, '0')}`;
      const qtyInCarrier = ci < carriersNeeded - 1
        ? CARRIER_CAPACITY
        : totalGood - ci * CARRIER_CAPACITY;
      targetCarriers.push({ id: targetId, goodQty: qtyInCarrier, defectQty: 0 });
      // 无真实晶圆明细时，按数量合成占位晶圆记录，避免目标片篮表格（按 targetWafers 实时统计）显示为 0
      for (let slot = 0; slot < qtyInCarrier; slot++) {
        waferSeq++;
        finalWafers.push({
          id: `SYN-${targetId}-${slot + 1}`,
          slotNo: qtyInCarrier - slot,
          type: 'GOOD',
          waferId: `W-${targetId}-${String(waferSeq).padStart(3, '0')}`,
          sublotId: '',
          carrierId: targetId,
          markingStatus: '未打标',
          inspectionStatus: '未检验',
        });
      }
    }
  }

  return { targetCarriers, finalWafers };
}

/**
 * 配平：仅处理末尾未配对的片篮。
 * 若目标片篮总数为奇数，将末篮拆成两篮（差值≤1片），
 * 优先复用用户手动新增的空篮承接拆出的部分，否则自动补一个新篮。
 */
function applyBalancing(
  distribution: { targetCarriers: TargetCarrier[]; finalWafers: WaferData[] },
  preferredEmptyCarrierId?: string
): BalanceResult {
  const { targetCarriers, finalWafers } = distribution;

  if (targetCarriers.length === 0 || targetCarriers.length % 2 === 0) {
    return { targetCarriers, finalWafers, balanced: false, note: '目标片篮总数为偶数，无需配平。' };
  }

  const lastCarrier = targetCarriers[targetCarriers.length - 1];
  const n = lastCarrier.goodQty;
  if (n <= 1) {
    return { targetCarriers, finalWafers, balanced: false, note: '末篮片数不足2片，无法拆分配平，请人工确认清洗上料方式。' };
  }

  const firstHalf = Math.ceil(n / 2);
  const secondHalf = Math.floor(n / 2);
  const secondCarrierId = preferredEmptyCarrierId
    || `SA${String(targetCarriers.length + 1).padStart(3, '0')}`;

  const updatedCarriers = targetCarriers.slice(0, -1).concat([
    { id: lastCarrier.id, goodQty: firstHalf, defectQty: 0 },
    { id: secondCarrierId, goodQty: secondHalf, defectQty: 0 },
  ]);

  let updatedWafers = finalWafers;
  if (finalWafers.length > 0) {
    const lastCarrierWafers = finalWafers.filter(w => w.carrierId === lastCarrier.id);
    const toMoveIds = new Set(lastCarrierWafers.slice(firstHalf).map(w => w.id));
    updatedWafers = finalWafers.map(w =>
      toMoveIds.has(w.id) ? { ...w, carrierId: secondCarrierId } : w
    );
  }

  return {
    targetCarriers: updatedCarriers,
    finalWafers: updatedWafers,
    balanced: true,
    note: `目标片篮总数为奇数，已将末篮 ${lastCarrier.id}（${n}片）拆分为 ${lastCarrier.id}（${firstHalf}片）与 ${secondCarrierId}（${secondHalf}片），差值≤1片，可双篮配平上料清洗。`,
  };
}

interface PostEtchInspectionBalanceFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
  onConfirm: (targetCarriers: TargetCarrier[], finalWafers: WaferData[]) => void;
  onStepChange?: (step: 1 | 2) => void;
}

/** 步骤条：展示在表单表头标题右侧（供 BatchOperationModal 的 headerRight 使用） */
export const PostEtchInspectionBalanceStepIndicator: React.FC<{ step: 1 | 2 }> = ({ step }) => (
  <div className="flex items-center space-x-2 text-xs flex-shrink-0">
    <div className={`flex items-center space-x-1 ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</span>
      <span>不良判定与拆批</span>
    </div>
    <ArrowRight className="w-3 h-3 text-gray-300" />
    <div className={`flex items-center space-x-1 ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</span>
      <span>换篮与配平</span>
    </div>
  </div>
);

const PostEtchInspectionBalanceForm: React.FC<PostEtchInspectionBalanceFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  onConfirm,
  onStepChange,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);
  const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('0');
  const [preConfirmTargetState, setPreConfirmTargetState] = useState<{ targetCarriers: TargetCarrier[] } | null>(null);
  const [finalResult, setFinalResult] = useState<BalanceResult | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // Step 1：源片篮（含不良品，用于目检判定展示）
  const sourceCarriersForInspection: CarrierData[] = useMemo(() => {
    if (!displayedFormSubBatches) return [];
    return displayedFormSubBatches.map(sb => ({
      id: sb.carrierId,
      sublotId: sb.sublotId,
      goodQty: sb.goodQty,
      defectQty: sb.defectQty,
      totalQty: sb.totalQty,
      masterBatchCode: selectedBatch?.batchCode || '',
      productCode: selectedBatch?.productCode || '',
    }));
  }, [displayedFormSubBatches, selectedBatch]);

  useEffect(() => {
    const loadWafers = async () => {
      if (selectedBatch && displayedFormSubBatches.length > 0) {
        const subBatchUUIDs = displayedFormSubBatches.map(sb => sb.id);
        try {
          const wafers = await batchApiService.getWaferCarrierContents(subBatchUUIDs, selectedBatch.id);
          if (wafers.length > 0) setWafersForCurrentForm(wafers);
        } catch {
          // ignore; falls back to sub-batch 汇总数据
        }
      }
    };
    loadWafers();
  }, [selectedBatch, displayedFormSubBatches]);

  const goodWafersReal = useMemo(
    () => wafersForCurrentForm.filter(w => w.type === 'GOOD' || w.type === 'GoodSample'),
    [wafersForCurrentForm]
  );
  const rejectWafersReal = useMemo(
    () => wafersForCurrentForm.filter(w => w.type === 'REJECT' || w.type === 'LOSS'),
    [wafersForCurrentForm]
  );
  const hasRealWaferData = goodWafersReal.length > 0 || rejectWafersReal.length > 0;

  const totalGoodQty = hasRealWaferData
    ? goodWafersReal.length
    : displayedFormSubBatches.reduce((s, sb) => s + sb.goodQty, 0);
  const totalDefectQty = hasRealWaferData
    ? rejectWafersReal.length
    : displayedFormSubBatches.reduce((s, sb) => s + sb.defectQty, 0);

  // Step 2：去除不良品后的良品源片篮
  const goodOnlySourceCarriers: CarrierData[] = useMemo(() => {
    return displayedFormSubBatches.map(sb => ({
      id: sb.carrierId,
      sublotId: sb.sublotId,
      goodQty: sb.goodQty,
      defectQty: 0,
      totalQty: sb.goodQty,
      masterBatchCode: selectedBatch?.batchCode || '',
      productCode: selectedBatch?.productCode || '',
    }));
  }, [displayedFormSubBatches, selectedBatch]);

  // 预览用：确认后源片篮展示为空（片子已移至目标片篮）
  const zeroedSourceCarriers: CarrierData[] = useMemo(
    () => goodOnlySourceCarriers.map(c => ({ ...c, goodQty: 0, defectQty: 0, totalQty: 0 })),
    [goodOnlySourceCarriers]
  );

  const handleNextStep = () => {
    if (!selectedBatch) return;
    console.log(
      `[腐后目检配平] 自动拆批：批次 ${selectedBatch.batchCode} 不良品 ${totalDefectQty} 片移入暂存区「${DEFAULT_STAGING_AREA}」，良品 ${totalGoodQty} 片留在原片篮进入换篮/配平步骤。`
    );
    setStep(2);
  };

  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
    setFinalResult(null);
    setPreConfirmTargetState(null);
  };

  const handlePreConfirmStateChange = (targetCarriers: TargetCarrier[]) => {
    setPreConfirmTargetState({ targetCarriers });
  };

  const handlePreview = () => {
    const distribution = distributeGoodWafers(selectedMode, goodOnlySourceCarriers, goodWafersReal);
    const usedIds = new Set(distribution.targetCarriers.map(c => c.id));
    const manualEmptyCarrier = preConfirmTargetState?.targetCarriers.find(
      c => !usedIds.has(c.id) && c.goodQty === 0 && c.defectQty === 0
    );

    const result = applyBalancing(distribution, manualEmptyCarrier?.id);
    setFinalResult(result);
    setPreviewKey(k => k + 1);
  };

  const handleFinish = () => {
    if (!finalResult) return;
    console.log('[腐后目检配平] 确认完成:', finalResult);
    onConfirm(finalResult.targetCarriers, finalResult.finalWafers);
  };

  if (!selectedBatch) {
    return (
      <div className="p-6 text-center text-gray-600">
        未选择批次
        <div className="mt-4">
          <button
            onClick={handleBackToBatchList}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回批次列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <EquipmentStationInfo selectedBatch={selectedBatch} />
      <BatchInfoDisplay
        selectedBatch={selectedBatch}
        getSubBatchesForMaster={getSubBatchesForMaster}
        getStatusColor={getStatusColor}
        subBatches={displayedFormSubBatches}
      />

      {step === 1 ? (
        <>
          <WaferBasketReorganizationModule
            initialSourceCarriers={sourceCarriersForInspection}
            initialWafers={wafersForCurrentForm}
            selectedMode="0"
            isDefectEntryMode={true}
            disableWaferTypeSelection={false}
            showBatchActionButtons={true}
          />

          <div className="p-6 flex justify-between items-center border-t">
            <p className="text-xs text-gray-500">
              判定完不良品后，点击「下一步」将自动拆批：不良品移入暂存区「{DEFAULT_STAGING_AREA}」，良品进入换篮/配平步骤。
            </p>
            <div className="flex space-x-4 flex-shrink-0">
              <button
                onClick={handleBackToBatchList}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                下一步
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="p-4">
            <h2 className="text-base font-medium mb-2 text-gray-700">选择换篮模式</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <select
                  value={selectedMode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CARRIER_CHANGE_MODES.map(mode => (
                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePreview}
                className="flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              可在下方「目标片篮」中手动新增空篮；点击右侧预览按钮后系统会按容量（25片/篮）依次装篮，并自动完成配平（末篮片数为奇数时优先使用已新增的空篮）。
            </p>
          </div>

          {!finalResult ? (
            <WaferBasketReorganizationModule
              key={`edit-${previewKey}`}
              initialSourceCarriers={goodOnlySourceCarriers}
              initialWafers={goodWafersReal}
              selectedMode={selectedMode}
              onReorganizationStateChange={(targetCarriers) => handlePreConfirmStateChange(targetCarriers)}
              disableWaferTypeSelection={true}
              showBatchActionButtons={false}
              hideTargetMoveButtons={true}
              hideTransferButtons={true}
            />
          ) : (
            <>
              <div className="mx-6 mt-2 mb-4 p-3 bg-blue-50 rounded-md flex items-start space-x-2">
                <Scale className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">{finalResult.note}</p>
              </div>
              <WaferBasketReorganizationModule
                key={`result-${previewKey}`}
                initialSourceCarriers={zeroedSourceCarriers}
                selectedMode={selectedMode}
                initialWafers={[]}
                initialTargetWafers={finalResult.finalWafers}
                initialTargetCarriers={finalResult.targetCarriers}
                disableWaferTypeSelection={true}
                showBatchActionButtons={false}
                hideTargetMoveButtons={true}
                hideTransferButtons={true}
              />
            </>
          )}

          <div className="p-6 flex justify-between pt-4 border-t">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              上一步
            </button>

            <div className="space-x-3">
              <button
                onClick={handleFinish}
                disabled={!finalResult}
                className={`px-6 py-2 rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  finalResult
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                完成
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PostEtchInspectionBalanceForm;
