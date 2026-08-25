// src/components/OutstationForm.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import ProcessParameters from './ProcessParameters';
import PackagingSection from './PackagingSection';
import { BatchData, SubBatchData, WaferData, CarrierData } from '../types';
import { batchApiService } from '../services/batchApiService';

interface OutstationFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
  handleConfirmOutstation: () => Promise<void>;
  currentBatchRemarks: string[];
  currentFormType: string;
  onSubBatchesUpdated: (updated: SubBatchData[]) => void;
}

const OutstationForm: React.FC<OutstationFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  handleConfirmOutstation,
  currentBatchRemarks,
  currentFormType,
  onSubBatchesUpdated,
}) => {
  const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const handleWaferDispositionChange = useCallback((waferId: string, newDisposition: WaferData['disposition']) => {
    setWafersForCurrentForm(prevWafers =>
      prevWafers.map(wafer =>
        wafer.waferId === waferId
          ? { ...wafer, disposition: newDisposition }
          : wafer
      )
    );
  }, []);

  const handleParameterChange = useCallback((waferId: string, paramName: string, newValue: number) => {
    setWafersForCurrentForm(prevWafers =>
      prevWafers.map(wafer =>
        wafer.waferId === waferId
          ? {
              ...wafer,
              inspectionParameters: wafer.inspectionParameters?.map(p =>
                p.name === paramName ? { ...p, value: newValue } : p
              )
            }
          : wafer
      )
    );
  }, []);

  const handleAutoFillParameter = useCallback((waferId: string, paramName: string) => {
    setWafersForCurrentForm(prevWafers =>
      prevWafers.map(wafer =>
        wafer.waferId === waferId
          ? {
              ...wafer,
              inspectionParameters: wafer.inspectionParameters?.map(p =>
                p.name === paramName ? { ...p, value: Math.random() * 100 } : p
              )
            }
          : wafer
      )
    );
  }, []);

  // 根据子批次信息动态生成 wafer 兜底数据（API 无数据时使用）
  const generateFallbackWafers = useCallback((subBatches: SubBatchData[]): WaferData[] => {
    return subBatches.flatMap(sb =>
      Array.from({ length: sb.totalQty }, (_, i) => {
        const slotNo = i + 1;
        const isDefect = i < sb.defectQty;
        return {
          id: `${sb.id}-${String(slotNo).padStart(2, '0')}`,
          slotNo,
          type: (isDefect ? 'REJECT' : 'GOOD') as WaferData['type'],
          waferId: `W-${sb.sublotId}-${String(slotNo).padStart(3, '0')}`,
          sublotId: sb.sublotId,
          carrierId: sb.carrierId,
          lotId: sb.id,
          markingCode: '',
          markingStatus: '待打标' as WaferData['markingStatus'],
          disposition: (isDefect ? 'HOLD' : 'NONE') as WaferData['disposition'],
          grade: isDefect ? 'C' : 'A',
          inspectionStatus: '待检验' as WaferData['inspectionStatus'],
          inspectionParameters: [],
          inspectionResultsByStation: {},
        };
      })
    );
  }, []);

  const fetchWafersForSubBatches = useCallback(async (subBatchUUIDs: string[], batchId: string) => {
    if (subBatchUUIDs.length === 0) {
      return [];
    }

    setLoading(true);
    try {
      const wafers = await batchApiService.getWaferCarrierContents(subBatchUUIDs, batchId);
      return wafers;
    } catch (err: unknown) {
      console.error('Error fetching wafers:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化 wafersForCurrentForm
  useEffect(() => {
    const loadWafers = async () => {
      if (selectedBatch && displayedFormSubBatches.length > 0) {
        const subBatchUUIDs = displayedFormSubBatches.map(sb => sb.id);
        const fetchedWafers = await fetchWafersForSubBatches(subBatchUUIDs, selectedBatch.id);
        if (fetchedWafers.length > 0) {
          setWafersForCurrentForm(fetchedWafers);
        } else {
          // API 无数据时，根据子批次信息动态生成兜底 wafer 数据
          setWafersForCurrentForm(generateFallbackWafers(displayedFormSubBatches));
        }
      } else {
        setWafersForCurrentForm([]);
      }
    };
    loadWafers();
  }, [selectedBatch, displayedFormSubBatches, fetchWafersForSubBatches, generateFallbackWafers]);

  // 处理确认出站
  const handleConfirmOutstationClick = async () => {
    setIsConfirming(true);
    try {
      await handleConfirmOutstation();
    } finally {
      setIsConfirming(false);
    }
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载晶圆数据...</p>
        </div>
      </div>
    );
  }

  const isPackagingStation = selectedBatch?.station === '包装';
  const hasUnprintedSubBatch = displayedFormSubBatches.some(sb => sb.printStatus !== '已打印');
  const isOutstationBlockedByPrinting = isPackagingStation && hasUnprintedSubBatch;

  return (
    <>
        {/* Main content card */}
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

          {isPackagingStation ? (
            /* 包装打印 Section - 包装站点专属，替代晶圆信息/量测参数 */
            <PackagingSection
              selectedBatch={selectedBatch}
              subBatches={displayedFormSubBatches}
              onSubBatchesUpdated={onSubBatchesUpdated}
            />
          ) : (
            <>
              {/* 晶圆信息 Section - 只读展示当前子批次及片详情 */}
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
              {/* 量测参数 Section */}
              <div className="p-1 border-b">
                <ProcessParameters
                  wafers={wafersForCurrentForm}
                  station={selectedBatch?.station || ''}
                />
              </div>
            </>
          )}

          {/* 批次备注 Section */}
          {currentBatchRemarks.length > 0 && (
            <div className="p-6 border-b">
              <h2 className="text-base font-medium mb-4 text-gray-700">批次备注</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <ul className="space-y-2">
                  {currentBatchRemarks.map((remark, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-700">{remark}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="p-6 flex justify-end space-x-4">
            <button
              onClick={handleBackToBatchList}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              取消
            </button>
            <div className="flex flex-col items-end">
              <button
                onClick={handleConfirmOutstationClick}
                disabled={isConfirming || isOutstationBlockedByPrinting}
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConfirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    处理中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    确认出站
                  </>
                )}
              </button>
              {isOutstationBlockedByPrinting && (
                <p className="text-xs text-red-600 mt-1">还有未打印标签的子批次，无法确认出站</p>
              )}
            </div>
          </div>
        </div>
    </>
  );
};

export default OutstationForm;