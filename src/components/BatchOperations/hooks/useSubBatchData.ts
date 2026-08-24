import { useState, useCallback } from 'react';
import { SubBatchData } from '../types';
import { batchApiService } from '../services/batchApiService';

export const useSubBatchData = () => {
  const [displayedFormSubBatches, setDisplayedFormSubBatches] = useState<SubBatchData[]>([]);

  const getSubBatchesForMaster = useCallback(async (masterBatchId: string): Promise<SubBatchData[]> => {
    try {
      return await batchApiService.getSubBatches(masterBatchId);
    } catch (error: any) {
      console.error('Error fetching sub-batches:', error.message);
      return [];
    }
  }, []);

  const updateSubBatch = useCallback(async (subBatchId: string, updates: Partial<SubBatchData>): Promise<void> => {
    try {
      await batchApiService.updateSubBatch(subBatchId, updates);
      setDisplayedFormSubBatches(prev => prev.map(subBatch =>
        subBatch.id === subBatchId ? { ...subBatch, ...updates } : subBatch
      ));
    } catch (error: any) {
      console.error('Error updating sub-batch:', error.message);
      throw error;
    }
  }, []);

  return {
    displayedFormSubBatches,
    setDisplayedFormSubBatches,
    getSubBatchesForMaster,
    updateSubBatch,
  };
};
