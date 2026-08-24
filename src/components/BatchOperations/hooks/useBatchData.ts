import { useState, useEffect, useCallback } from 'react';
import { BatchData } from '../types';
import { batchApiService } from '../services/batchApiService';

export const useBatchData = () => {
  const [batchList, setBatchList] = useState<BatchData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await batchApiService.listBatches();
      // 解包 response.data，如果 response 本身就是数组则直接用，否则用空数组兜底
      const batches = response?.data || response || [];
      setBatchList(batches);
    } catch (err: any) {
      console.error('Error fetching batches:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const updateBatch = useCallback(async (batchId: string, updates: Partial<BatchData>) => {
    try {
      await batchApiService.updateBatch(batchId, updates);
      setBatchList(prev => prev.map(batch =>
        batch.id === batchId ? { ...batch, ...updates } : batch
      ));
    } catch (error: any) {
      console.error('Error updating batch:', error.message);
      throw error;
    }
  }, []);

  return {
    batchList,
    isLoading,
    error,
    fetchBatches,
    updateBatch,
    setBatchList
  };
};