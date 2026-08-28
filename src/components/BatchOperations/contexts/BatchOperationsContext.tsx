// src/contexts/BatchOperationsContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { BatchData, SubBatchData, ProductData, StationData, WaferLossRecord, TargetCarrier, WaferData } from '../types';
import { useBatchData } from '../hooks/useBatchData';
import { useSubBatchData } from '../hooks/useSubBatchData';
import { useWafersData } from '../hooks/useWafersData';
import { useBatchRemarks } from '../hooks/useBatchRemarks';
import { useBatchOperationsHandlers } from '../hooks/useBatchOperationsHandlers';
import { getStatusColor } from '../utils/statusHelpers';
import { batchApiService } from '../services/batchApiService';

interface BatchOperationsContextType {
  // 状态
  batchList: BatchData[];
  selectedBatch: BatchData | null;
  /** 新增：重新拉取批次列表，供批量Hold/Release等写操作后刷新数据 */
  fetchBatches: () => Promise<void>;
  displayedFormSubBatches: SubBatchData[];
  currentFormType: string;
  isTransferModalOpen: boolean;
  batchToTransfer: BatchData | null;
  targetBatchCode: string;
  isMergeTargetModalOpen: boolean;
  cancellationReason: string;
  isDocumentationModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  aggregatedWafersForOverview: WaferData[];
  isAggregatedDataLoading: boolean;
  wafersForCurrentForm: WaferData[];
  currentBatchRemarks: string[];
  allStations: StationData[]; // 新增：所有站点数据
  loadingStations: boolean; // 新增：加载站点状态
  isQTimeRemainingModalOpen: boolean; // 新增：Q-Time剩余查询模态框状态
  
  // 辅助函数
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  fetchProducts: () => Promise<ProductData[]>;
  fetchStations: () => Promise<StationData[]>;
  fetchLossWafers: () => Promise<WaferLossRecord[]>;
  
  // 设置函数
  setSelectedBatch: (batch: BatchData | null) => void;
  setDisplayedFormSubBatches: (subBatches: SubBatchData[]) => void;
  setCurrentFormType: (type: string) => void;
  setIsTransferModalOpen: (open: boolean) => void;
  setBatchToTransfer: (batch: BatchData | null) => void;
  setTargetBatchCode: (code: string) => void;
  setIsMergeTargetModalOpen: (open: boolean) => void;
  setCancellationReason: (reason: string) => void;
  setIsDocumentationModalOpen: (open: boolean) => void;
  setIsAggregatedDataLoading: (loading: boolean) => void;
  setWafersForCurrentForm: (wafers: WaferData[]) => void;
  setIsQTimeRemainingModalOpen: (open: boolean) => void; // 新增：设置Q-Time模态框状态
  
  // 事件处理函数
  handleInstation: (batch: BatchData) => Promise<void>;
  handleSelectBatch: (batch: BatchData) => Promise<void>;
  handleCancelEntry: (batch: BatchData) => Promise<void>;
  handleMergeBatch: (batch: BatchData) => Promise<void>;
  handleTransferBatch: (batch: BatchData) => void;
  handleAccumulateBatch: (batch: BatchData, isFromStaging?: boolean) => void;
  isAccumulateFromStaging: boolean;
  handleCombineTrayBatch: (batch: BatchData) => void;
  handleSplitBatch: (batch: BatchData) => Promise<void>;
  handleMarkingStation: (batch: BatchData) => Promise<void>;
  handleDefectEntry: (batch: BatchData) => Promise<void>;
  handleCancelDefectEntry: (batch: BatchData) => Promise<void>;
  handleCutIntoSubpath: (batch: BatchData) => Promise<void>;
  handleCarrierChange: (selectedSubBatches: SubBatchData[]) => Promise<void>;
  handlePostEtchInspectionBalance: (batch: BatchData) => Promise<void>;
  handleMeasurementEntry: (batch: BatchData) => Promise<void>;
  handleProcessEntry: (batch: BatchData) => Promise<void>;
  handleConfirmSplit: (payload: { stagingAreaId?: string; targetCarriers: TargetCarrier[]; targetWafers: WaferData[] }) => Promise<void>;
  handleConfirmCancelEntry: () => void;
  handleConfirmMergeBatch: () => Promise<void>;
  handleConfirmWaferTransfer: (finalTargetCarriers: TargetCarrier[], finalSourceWafers: WaferData[]) => void;
  handleConfirmCarrierChange: (selectedSubBatches: SubBatchData[], mode: string, targetCarriers: TargetCarrier[], finalWafers: WaferData[]) => void;
  handleConfirmPostEtchInspectionBalance: (targetCarriers: TargetCarrier[], finalWafers: WaferData[]) => void;
  handleConfirmOutstation: () => Promise<void>;
  handleBackToBatchList: () => void;
  handleOpenMergeTargetModal: () => void;
  handleCloseMergeTargetModal: () => void;
  handleSelectMergeTargetBatch: (batchCode: string) => void;
  fetchAggregatedWaferData: (batchId: string) => Promise<void>;
  handleParameterChangeInForm: (waferId: string, parameterName: string, value: number) => void;
  handleAutoFillParameterInForm: (parameterName: string, value: number) => void;
  handleWafersUpdateInForm: (updatedWafers: WaferData[]) => void;
  handleOpenBatchRemarksModal: (batch: BatchData) => Promise<void>;
  handleSaveBatchRemarks: (remarks: string[]) => Promise<void>;
  handleOpenQTimeRemaining: (batch?: BatchData) => void; // 新增：打开Q-Time剩余查询
}

const BatchOperationsContext = createContext<BatchOperationsContextType | undefined>(undefined);

export const BatchOperationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 状态定义
  const [currentFormType, setCurrentFormType] = useState<string>('none');
  const [isAccumulateFromStaging, setIsAccumulateFromStaging] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [batchToTransfer, setBatchToTransfer] = useState<BatchData | null>(null);
  const [targetBatchCode, setTargetBatchCode] = useState<string>('');
  const [isMergeTargetModalOpen, setIsMergeTargetModalOpen] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState<boolean>(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null);
  const [allStations, setAllStations] = useState<StationData[]>([]); // 新增：所有站点数据状态
  const [loadingStations, setLoadingStations] = useState<boolean>(false); // 新增：加载站点状态
  const [isQTimeRemainingModalOpen, setIsQTimeRemainingModalOpen] = useState<boolean>(false); // 新增：Q-Time模态框状态

  // 使用自定义 Hook
  const { 
    batchList, 
    isLoading, 
    error, 
    fetchBatches 
  } = useBatchData();

  const { 
    displayedFormSubBatches, 
    setDisplayedFormSubBatches, 
    getSubBatchesForMaster 
  } = useSubBatchData();

  const {
    wafersForCurrentForm,
    setWafersForCurrentForm,
    aggregatedWafersForOverview,
    isAggregatedDataLoading,
    setIsAggregatedDataLoading,
    fetchWafersForSubBatches,
    fetchAggregatedWaferData: fetchAggregatedWaferDataHook,
    handleParameterChangeInForm,
    handleAutoFillParameterInForm,
    handleWafersUpdateInForm,
  } = useWafersData();

  const {
    currentBatchRemarks,
    loadBatchRemarks,
    saveBatchRemarks,
  } = useBatchRemarks();

  // 加载站点数据 - 改回调用 stationService.getStations()
  const loadStations = useCallback(async () => {
    setLoadingStations(true);
    try {
         const stations = await batchApiService.listStations(); 
         setAllStations(stations);
    } catch (error) {
      console.error('Failed to load stations:', error);
    } finally {
      setLoadingStations(false);
    }
  }, []);

  // 组件挂载时加载站点数据
  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // 返回批次列表的处理函数
  const handleBackToBatchList = useCallback(() => {
    setCurrentFormType('none');
    setSelectedBatch(null);
    setDisplayedFormSubBatches([]);
    setWafersForCurrentForm([]);
    setCancellationReason('');
    setTargetBatchCode('');
    setIsQTimeRemainingModalOpen(false); // 新增：重置Q-Time模态框状态
  }, [
    setCurrentFormType, 
    setSelectedBatch, 
    setDisplayedFormSubBatches, 
    setWafersForCurrentForm, 
    setCancellationReason, 
    setTargetBatchCode,
    setIsQTimeRemainingModalOpen
  ]);

  // 新增：打开Q-Time剩余查询模态框
  const handleOpenQTimeRemaining = useCallback((batch?: BatchData) => {
    if (batch) {
      setSelectedBatch(batch);
    }
    setIsQTimeRemainingModalOpen(true);
  }, []);

  // 操作处理函数
  const handlers = useBatchOperationsHandlers(
    batchList,
    selectedBatch,
    displayedFormSubBatches,
    wafersForCurrentForm,
    setSelectedBatch,
    setDisplayedFormSubBatches,
    setCurrentFormType,
    setIsAccumulateFromStaging,
    setWafersForCurrentForm,
    fetchBatches,
    getSubBatchesForMaster,
    (subBatches, stationCode) => fetchWafersForSubBatches(subBatches, stationCode, batchList),
    loadBatchRemarks,
    handleBackToBatchList,
    targetBatchCode
  );

  // 其他辅助函数
  const fetchProducts = useCallback(async (): Promise<ProductData[]> => {
    return await batchApiService.getProducts();
  }, []);

  const fetchStations = useCallback(async (): Promise<StationData[]> => {
    return await batchApiService.getStations();
  }, []);

  const fetchLossWafers = useCallback(async (): Promise<WaferLossRecord[]> => {
    return await batchApiService.getLossWafers();
  }, []);

  const fetchAggregatedWaferData = useCallback(async (batchId: string): Promise<void> => {
    await fetchAggregatedWaferDataHook(batchId, batchList, getSubBatchesForMaster);
  }, [batchList, fetchAggregatedWaferDataHook, getSubBatchesForMaster]);

  const handleOpenMergeTargetModal = useCallback(() => {
    setIsMergeTargetModalOpen(true);
  }, []);

  const handleCloseMergeTargetModal = useCallback(() => {
    setIsMergeTargetModalOpen(false);
  }, []);

  const handleSelectMergeTargetBatch = useCallback((batchCode: string) => {
    setTargetBatchCode(batchCode);
    handleCloseMergeTargetModal();
  }, [handleCloseMergeTargetModal]);

  const handleSaveBatchRemarks = useCallback(async (remarks: string[]): Promise<void> => {
    if (!selectedBatch) {
      console.error('No batch selected for saving remarks');
      return;
    }
    
    try {
      await saveBatchRemarks(selectedBatch.id, remarks);
      handleBackToBatchList();
    } catch (error) {
      console.error('Failed to save batch remarks:', error);
      throw error;
    }
  }, [selectedBatch, saveBatchRemarks, handleBackToBatchList]);

  const value: BatchOperationsContextType = {
    // 状态
    batchList,
    selectedBatch,
    fetchBatches,
    displayedFormSubBatches,
    currentFormType,
    isAccumulateFromStaging,
    isTransferModalOpen,
    batchToTransfer,
    targetBatchCode,
    isMergeTargetModalOpen,
    cancellationReason,
    isDocumentationModalOpen,
    isLoading,
    error,
    aggregatedWafersForOverview,
    isAggregatedDataLoading,
    wafersForCurrentForm,
    currentBatchRemarks,
    allStations,
    loadingStations,
    isQTimeRemainingModalOpen,
    
    // 辅助函数
    getSubBatchesForMaster,
    getStatusColor,
    fetchProducts,
    fetchStations,
    fetchLossWafers,
    
    // 设置函数
    setSelectedBatch,
    setDisplayedFormSubBatches,
    setCurrentFormType,
    setIsTransferModalOpen,
    setBatchToTransfer,
    setTargetBatchCode,
    setIsMergeTargetModalOpen,
    setCancellationReason,
    setIsDocumentationModalOpen,
    setIsAggregatedDataLoading,
    setWafersForCurrentForm,
    setIsQTimeRemainingModalOpen,
    
    // 事件处理函数
    handleInstation: handlers.handleInstation,
    handleSelectBatch: handlers.handleSelectBatch,
    handleCancelEntry: handlers.handleCancelEntry,
    handleMergeBatch: handlers.handleMergeBatch,
    handleTransferBatch: handlers.handleTransferBatch,
    handleAccumulateBatch: handlers.handleAccumulateBatch,
    handleCombineTrayBatch: handlers.handleCombineTrayBatch,
    handleSplitBatch: handlers.handleSplitBatch,
    handleMarkingStation: handlers.handleMarkingStation,
    handleDefectEntry: handlers.handleDefectEntry,
    handleCancelDefectEntry: handlers.handleCancelDefectEntry,
    handleCutIntoSubpath: handlers.handleCutIntoSubpath,
    handleCarrierChange: handlers.handleCarrierChange,
    handlePostEtchInspectionBalance: handlers.handlePostEtchInspectionBalance,
    handleMeasurementEntry: handlers.handleMeasurementEntry,
    handleProcessEntry: handlers.handleProcessEntry,
    handleConfirmSplit: handlers.handleConfirmSplit,
    handleConfirmCancelEntry: handlers.handleConfirmCancelEntry,
    handleConfirmMergeBatch: handlers.handleConfirmMergeBatch,
    handleConfirmWaferTransfer: handlers.handleConfirmWaferTransfer,
    handleConfirmCarrierChange: handlers.handleConfirmCarrierChange,
    handleConfirmPostEtchInspectionBalance: handlers.handleConfirmPostEtchInspectionBalance,
    handleConfirmOutstation: handlers.handleConfirmOutstation,
    handleBackToBatchList,
    handleOpenMergeTargetModal,
    handleCloseMergeTargetModal,
    handleSelectMergeTargetBatch,
    fetchAggregatedWaferData,
    handleParameterChangeInForm,
    handleAutoFillParameterInForm,
    handleWafersUpdateInForm,
    handleOpenBatchRemarksModal: handlers.handleOpenBatchRemarksModal,
    handleSaveBatchRemarks,
    handleOpenQTimeRemaining,
  };

  return (
    <BatchOperationsContext.Provider value={value}>
      {children}
    </BatchOperationsContext.Provider>
  );
};

export const useBatchOperations = () => {
  const context = useContext(BatchOperationsContext);
  if (context === undefined) {
    throw new Error('useBatchOperations must be used within a BatchOperationsProvider');
  }
  return context;
};