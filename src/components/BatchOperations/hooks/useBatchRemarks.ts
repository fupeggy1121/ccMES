import { useState, useCallback } from 'react';
import { batchApiService } from '../services/batchApiService';

export const useBatchRemarks = () => {
  const [currentBatchRemarks, setCurrentBatchRemarks] = useState<string[]>([]);
  const [isBatchRemarksModalOpen, setIsBatchRemarksModalOpen] = useState<boolean>(false);

  const loadBatchRemarks = useCallback(async (batchId: string): Promise<void> => {
    try {
      const remarks = await batchApiService.getBatchRemarks(batchId);
      setCurrentBatchRemarks(remarks);
    } catch (error: any) {
      console.warn('Failed to load batch remarks:', error.message);
      setCurrentBatchRemarks([]);
    }
  }, []);

  const saveBatchRemarks = useCallback(async (batchId: string, remarks: string[]): Promise<void> => {
    try {
      await batchApiService.saveBatchRemarks(batchId, remarks);
      setCurrentBatchRemarks(remarks);
    } catch (error: any) {
      console.error('Failed to save batch remarks:', error.message);
      throw error;
    }
  }, []);

  const openBatchRemarksModal = useCallback(() => {
    setIsBatchRemarksModalOpen(true);
  }, []);

  const closeBatchRemarksModal = useCallback(() => {
    setIsBatchRemarksModalOpen(false);
  }, []);

  return {
    currentBatchRemarks,
    isBatchRemarksModalOpen,
    loadBatchRemarks,
    saveBatchRemarks,
    openBatchRemarksModal,
    closeBatchRemarksModal,
    setCurrentBatchRemarks,
  };
};
