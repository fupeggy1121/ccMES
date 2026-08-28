import { useCallback } from 'react';
import { BatchData, SubBatchData, TargetCarrier, WaferData } from '../types';
import { batchApiService } from '../services/batchApiService';

export const useBatchOperationsHandlers = (
  batchList: BatchData[],
  selectedBatch: BatchData | null,
  displayedFormSubBatches: SubBatchData[],
  wafersForCurrentForm: WaferData[],
  setSelectedBatch: (batch: BatchData | null) => void,
  setDisplayedFormSubBatches: (subBatches: SubBatchData[]) => void,
  setCurrentFormType: (type: string) => void,
  setIsAccumulateFromStaging: (v: boolean) => void,
  setWafersForCurrentForm: (wafers: WaferData[]) => void,
  fetchBatches: () => Promise<void>,
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>,
  fetchWafersForSubBatches: (
    subBatches: SubBatchData[],
    stationCode: string,
    batchList: BatchData[]
  ) => Promise<WaferData[]>,
  loadBatchRemarks: (batchId: string) => Promise<void>,
  backToBatchList: () => void,
  targetBatchCode: string
) => {
  const handleInstation = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);

    const wafers = await fetchWafersForSubBatches(subBatches, batch.station, batchList);
    setWafersForCurrentForm(wafers);

    await loadBatchRemarks(batch.id);

    setCurrentFormType('instation');
  }, [
    batchList,
    getSubBatchesForMaster,
    fetchWafersForSubBatches,
    loadBatchRemarks,
    setSelectedBatch,
    setDisplayedFormSubBatches,
    setWafersForCurrentForm,
    setCurrentFormType
  ]);

  const handleSelectBatch = useCallback(async (batch: BatchData) => {
    if (batch.status === '待进站') {
      await handleInstation(batch);
      return;
    }

    setSelectedBatch(batch);

    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);

    await loadBatchRemarks(batch.id);

    const wafers = await fetchWafersForSubBatches(subBatches, batch.station, batchList);
    setWafersForCurrentForm(wafers);

    if (batch.status === '待出站') {
      setCurrentFormType('outstation');
    } else if (batch.status === '加工中') {
      if (batch.station === 'markingStation') {
        setCurrentFormType('markingStation');
      } else if (batch.station === 'geometricInspection02') {
        setCurrentFormType('geometricInspection02');
      } else if (batch.station === 'visualInspection') {
        setCurrentFormType('visualInspection');
      } else if (batch.station === 'particleInspection02') {
        setCurrentFormType('particleInspection02');
      } else {
        setCurrentFormType('outstation');
      }
    } else {
      setCurrentFormType('outstation');
    }
  }, [
    batchList,
    getSubBatchesForMaster,
    fetchWafersForSubBatches,
    loadBatchRemarks,
    setSelectedBatch,
    setDisplayedFormSubBatches,
    setWafersForCurrentForm,
    setCurrentFormType,
    handleInstation
  ]);

  const handleConfirmOutstation = useCallback(async () => {
    if (!selectedBatch) {
      console.error('No batch selected for outstation confirmation');
      return;
    }

    try {
      const goodWafers = wafersForCurrentForm.filter(wafer =>
        wafer.type === 'GOOD' || wafer.type === 'GoodSample'
      ).length;

      const defectWafers = wafersForCurrentForm.filter(wafer =>
        wafer.type === 'REJECT'
      ).length;

      const nextStationCode = selectedBatch.nextStationCode;
      const nextStationName = selectedBatch.nextStationName;

      if (!nextStationCode) {
        throw new Error('Next station is not defined for this batch');
      }

      await batchApiService.confirmOutstation(selectedBatch.id, {
        wafersForCurrentForm,
        displayedFormSubBatches,
        nextStationCode,
        nextStationName,
        goodQty: goodWafers,
        defectQty: defectWafers,
      });

      await fetchBatches();
      backToBatchList();

    } catch (err: any) {
      console.error('Error confirming outstation:', err.message);
      throw err;
    }
  }, [
    selectedBatch,
    wafersForCurrentForm,
    displayedFormSubBatches,
    fetchBatches,
    backToBatchList
  ]);

  const handleCancelEntry = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('cancelEntry');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleMergeBatch = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('mergeBatch');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleSplitBatch = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('splitBatch');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleMarkingStation = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('markingStation');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleDefectEntry = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('defectEntry');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleCancelDefectEntry = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('cancelDefectEntry');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleCutIntoSubpath = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('cutIntoSubpath');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleCarrierChange = useCallback(async (selectedSubBatches: SubBatchData[]) => {
    if (selectedSubBatches.length === 0) {
      return;
    }

    setDisplayedFormSubBatches(selectedSubBatches);

    const firstSubBatch = selectedSubBatches[0];
    let masterBatchCode = '';

    if (firstSubBatch.sublotId.includes('-SUB-')) {
      masterBatchCode = firstSubBatch.sublotId.split('-SUB-')[0];
    }

    let correspondingMasterBatch: BatchData | null = null;

    if (masterBatchCode) {
      correspondingMasterBatch = batchList.find(
        batch => batch.batchCode === masterBatchCode
      ) || null;
    }

    if (!correspondingMasterBatch && firstSubBatch.carrierId) {
      const carrierId = firstSubBatch.carrierId;
      correspondingMasterBatch = batchList.find(
        batch => batch.id.includes(carrierId) || batch.batchCode.includes(carrierId)
      ) || null;
    }

    setSelectedBatch(correspondingMasterBatch);
    setCurrentFormType('carrierChange');
  }, [batchList, setDisplayedFormSubBatches, setSelectedBatch, setCurrentFormType]);

  const handlePostEtchInspectionBalance = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    setCurrentFormType('postEtchInspectionBalance');
  }, [setSelectedBatch, setDisplayedFormSubBatches, setCurrentFormType, getSubBatchesForMaster]);

  const handleMeasurementEntry = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);

    const wafers = await fetchWafersForSubBatches(subBatches, batch.station, batchList);
    setWafersForCurrentForm(wafers);

    setCurrentFormType('measurementEntry');
  }, [
    batchList,
    getSubBatchesForMaster,
    fetchWafersForSubBatches,
    setSelectedBatch,
    setDisplayedFormSubBatches,
    setWafersForCurrentForm,
    setCurrentFormType
  ]);

  const handleProcessEntry = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);

    const wafers = await fetchWafersForSubBatches(subBatches, batch.station, batchList);
    setWafersForCurrentForm(wafers);

    setCurrentFormType('processEntry');
  }, [
    batchList,
    getSubBatchesForMaster,
    fetchWafersForSubBatches,
    setSelectedBatch,
    setDisplayedFormSubBatches,
    setWafersForCurrentForm,
    setCurrentFormType
  ]);

  const handleOpenBatchRemarksModal = useCallback(async (batch: BatchData) => {
    setSelectedBatch(batch);
    const subBatches = await getSubBatchesForMaster(batch.id);
    setDisplayedFormSubBatches(subBatches);
    await loadBatchRemarks(batch.id);
    setCurrentFormType('batchRemarks');
  }, [setSelectedBatch, setDisplayedFormSubBatches, loadBatchRemarks, setCurrentFormType, getSubBatchesForMaster]);

  const handleTransferBatch = useCallback((_batch: BatchData) => {
    setCurrentFormType('transfer');
  }, [setCurrentFormType]);

  const handleAccumulateBatch = useCallback((_batch: BatchData, isFromStaging?: boolean) => {
    setIsAccumulateFromStaging(isFromStaging ?? false);
    setCurrentFormType('accumulateBatch');
  }, [setCurrentFormType]);

  const handleCombineTrayBatch = useCallback((batch: BatchData) => {
    setSelectedBatch(batch);
    setCurrentFormType('combineTrayBatch');
  }, [setSelectedBatch, setCurrentFormType]);

  const handleConfirmSplit = useCallback(async (payload: {
    stagingAreaId?: string;
    targetCarriers: TargetCarrier[];
    targetWafers: WaferData[];
  }) => {
    if (!selectedBatch) return;
    try {
      await batchApiService.confirmSplit(selectedBatch.id, {
        targetCarriers: payload.targetCarriers,
        targetWafers: payload.targetWafers,
        operator: '当前操作人',
      });
      await fetchBatches();
      backToBatchList();
    } catch (err: any) {
      console.error('Error confirming split:', err.message);
      throw err;
    }
  }, [selectedBatch, fetchBatches, backToBatchList]);

  const handleConfirmCancelEntry = useCallback(() => {
    if (selectedBatch) {
      console.log('进站取消操作:', selectedBatch.batchCode);
      backToBatchList();
    }
  }, [selectedBatch, backToBatchList]);

  const handleConfirmMergeBatch = useCallback(async () => {
    if (!selectedBatch) return;
    const targetBatch = batchList.find(b => b.batchCode === targetBatchCode);
    if (!targetBatch) {
      console.error('未找到目标批次:', targetBatchCode);
      throw new Error('请先选择并批目标批次');
    }
    try {
      await batchApiService.confirmMerge(selectedBatch.id, { targetBatchId: targetBatch.id, operator: '当前操作人' });
      await fetchBatches();
      backToBatchList();
    } catch (err: any) {
      console.error('Error confirming merge:', err.message);
      throw err;
    }
  }, [selectedBatch, batchList, targetBatchCode, fetchBatches, backToBatchList]);

  const handleConfirmWaferTransfer = useCallback((
    finalTargetCarriers: TargetCarrier[],
    finalSourceWafers: WaferData[]
  ) => {
    console.log('Wafer transfer confirmed!');
    console.log('Final Target Carriers:', finalTargetCarriers);
    console.log('Final Source Wafers:', finalSourceWafers);
    backToBatchList();
  }, [backToBatchList]);

  const handleConfirmCarrierChange = useCallback((
    selectedSubBatches: SubBatchData[],
    mode: string,
    targetCarriers: TargetCarrier[],
    finalWafers: WaferData[]
  ) => {
    console.log('片篮更换操作确认:', {
      selectedSubBatches,
      mode,
      targetCarriers,
      finalWafers
    });
    backToBatchList();
  }, [backToBatchList]);

  const handleConfirmPostEtchInspectionBalance = useCallback((
    targetCarriers: TargetCarrier[],
    finalWafers: WaferData[]
  ) => {
    console.log('腐后目检配平操作确认:', {
      selectedBatch,
      targetCarriers,
      finalWafers
    });
    backToBatchList();
  }, [selectedBatch, backToBatchList]);

  return {
    handleInstation,
    handleSelectBatch,
    handleCancelEntry,
    handleMergeBatch,
    handleTransferBatch,
    handleAccumulateBatch,
    handleCombineTrayBatch,
    handleSplitBatch,
    handleMarkingStation,
    handleDefectEntry,
    handleCancelDefectEntry,
    handleCutIntoSubpath,
    handleCarrierChange,
    handlePostEtchInspectionBalance,
    handleMeasurementEntry,
    handleProcessEntry,
    handleConfirmSplit,
    handleConfirmCancelEntry,
    handleConfirmMergeBatch,
    handleConfirmWaferTransfer,
    handleConfirmCarrierChange,
    handleConfirmPostEtchInspectionBalance,
    handleConfirmOutstation,
    handleOpenBatchRemarksModal,
  };
};
