import { useState, useCallback } from 'react';
import { WaferData, SubBatchData, BatchData } from '../types';
import { batchApiService } from '../services/batchApiService';

export const useWafersData = () => {
  const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);
  const [aggregatedWafersForOverview, setAggregatedWafersForOverview] = useState<WaferData[]>([]);
  const [isAggregatedDataLoading, setIsAggregatedDataLoading] = useState<boolean>(false);

  const fetchWafersForSubBatches = useCallback(async (
    subBatches: SubBatchData[],
    stationCode: string,
    batchList: BatchData[]
  ): Promise<WaferData[]> => {
    try {
      if (!subBatches || subBatches.length === 0) return [];

      const subBatchIds = subBatches.map(sb => sb.id);
      const firstBatch = batchList[0];
      if (!firstBatch?.id) return [];

      // 注意：这里假设 batchApiService.getWafersForSubBatches 返回的是一个 WaferData[]
      // 如果它返回的是 { data: WaferData[] } 这样的结构，也需要进行调整
      return await batchApiService.getWafersForSubBatches(subBatchIds, stationCode, firstBatch.id);
    } catch (error: any) {
      console.error('Error fetching wafers for sub-batches:', error.message);
      return [];
    }
  }, []);

  const fetchAggregatedWaferData = useCallback(async (
    batchId: string,
    batchList: BatchData[],
    getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>
  ): Promise<WaferData[]> => {
    setIsAggregatedDataLoading(true);

    try {
      const response = await batchApiService.getAggregatedWaferData(batchId);
      // CRITICAL CHANGE: 直接将 response 视为 wafers 数组，因为 API 响应的 data 字段就是 wafers 数组
      const wafers = response || []; 
      
      // CRITICAL CHANGE: 移除对 resultsToUpsert 的处理，因为 API 响应中没有此字段
      // 如果后端 API 确实需要返回 resultsToUpsert 并且需要调用 saveInspectionResults，
      // 则需要修改后端 API 响应结构，或者在前端模拟此数据。
      // 目前为了解决当前错误，暂时移除。
      // const resultsToUpsert = response?.resultsToUpsert || [];
      // if (resultsToUpsert.length > 0) {
      //   await batchApiService.saveInspectionResults(resultsToUpsert);
      // }

      setAggregatedWafersForOverview(wafers);
      return wafers;
    } catch (error: any) {
      console.error('Error fetching aggregated wafer data:', error.message);
      setAggregatedWafersForOverview([]);
      throw error;
    } finally {
      setIsAggregatedDataLoading(false);
    }
  }, []);

  const handleParameterChangeInForm = useCallback((waferId: string, parameterName: string, value: number) => {
    setWafersForCurrentForm(prevWafers =>
      prevWafers.map(wafer => {
        if (wafer.waferId === waferId) {
          const updatedParameters = wafer.inspectionParameters.map(param => {
            if (param.name === parameterName) {
              const minSpec = param.minSpec || 0;
              const maxSpec = param.maxSpec || 100;
              const status = value >= minSpec && value <= maxSpec ? 'PASS' : 'FAIL';
              return {
                ...param,
                value,
                status
              };
            }
            return param;
          });

          return {
            ...wafer,
            inspectionParameters: updatedParameters
          };
        }
        return wafer;
      })
    );
  }, []);

  const handleAutoFillParameterInForm = useCallback((parameterName: string, value: number) => {
    setWafersForCurrentForm(prevWafers =>
      prevWafers.map(wafer => {
        const updatedParameters = wafer.inspectionParameters.map(param => {
          if (param.name === parameterName) {
            const minSpec = param.minSpec || 0;
            const maxSpec = param.maxSpec || 100;
            const status = value >= minSpec && value <= maxSpec ? 'PASS' : 'FAIL';
            return {
              ...param,
              value,
              status
            };
          }
          return param;
        });

        return {
          ...wafer,
          inspectionParameters: updatedParameters
        };
      })
    );
  }, []);

  const handleWafersUpdateInForm = useCallback((updatedWafers: WaferData[]) => {
    setWafersForCurrentForm(updatedWafers);
  }, []);

  return {
    wafersForCurrentForm,
    setWafersForCurrentForm,
    aggregatedWafersForOverview, 
    isAggregatedDataLoading,
    setIsAggregatedDataLoading,
    fetchWafersForSubBatches,
    fetchAggregatedWaferData,
    handleParameterChangeInForm,
    handleAutoFillParameterInForm,
    handleWafersUpdateInForm,
  };
};
