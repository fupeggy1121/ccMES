// src/components/FinalSortingOverviewModal.tsx

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { WaferData, InspectionParameter, BatchData } from '../types';
import { getStationDisplayName } from '../utils/inspectionHelpers';

interface FinalSortingOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  wafers: WaferData[];
  selectedBatch: BatchData | null;
  isAggregatedDataLoading: boolean;
}

const FinalSortingOverviewModal: React.FC<FinalSortingOverviewModalProps> = ({
  isOpen,
  onClose,
  wafers,
  selectedBatch,
  isAggregatedDataLoading,
}) => {
  if (!isOpen) {
    return null;
  }

  // 新增状态：筛选不良品和隐藏参数
  const [filterDefectsOnly, setFilterDefectsOnly] = useState<boolean>(false);
  const [hideParameters, setHideParameters] = useState<boolean>(true); // 默认勾选

  // CRITICAL CHANGE: 更新 fullProcessFlowOrder 数组以匹配后端返回的站点名称
  const fullProcessFlowOrder = ['几何参数检验', '颗粒检测', '目检'];

  const { orderedStationCodes, stationParameterMap, allParameterCount } = useMemo(() => {
    const currentBatchStation = selectedBatch?.station;
    let visibleProcessFlowOrder: string[] = [];

    if (currentBatchStation && fullProcessFlowOrder.includes(currentBatchStation)) {
      const currentIndex = fullProcessFlowOrder.indexOf(currentBatchStation);
      visibleProcessFlowOrder = fullProcessFlowOrder.slice(0, currentIndex + 1);
    } else {
      visibleProcessFlowOrder = [];
    }

    const uniqueStationCodes = new Set<string>();
    const parameterMap = new Map<string, string[]>();

    const safeWafers = wafers || [];

    safeWafers.forEach(wafer => {
      if (wafer.inspectionResultsByStation) {
        Object.keys(wafer.inspectionResultsByStation).forEach(stationCode => {
          if (visibleProcessFlowOrder.length === 0 || visibleProcessFlowOrder.includes(stationCode)) {
            uniqueStationCodes.add(stationCode);
            
            // 只有当 hideParameters 为 false 时才填充参数名称
            if (!hideParameters) {
              const stationParams = wafer.inspectionResultsByStation?.[stationCode]?.parameters || [];
              if (!parameterMap.has(stationCode)) {
                parameterMap.set(stationCode, []);
              }
              stationParams.forEach(param => {
                const currentParams = parameterMap.get(stationCode) || [];
                if (!currentParams.includes(param.name)) {
                  parameterMap.get(stationCode)?.push(param.name);
                }
              });
            }
          }
        });
      }
    });

    const sortedStationCodes = Array.from(uniqueStationCodes).sort((a, b) => {
      const indexA = visibleProcessFlowOrder.indexOf(a);
      const indexB = visibleProcessFlowOrder.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    let totalParamCount = 0;
    sortedStationCodes.forEach(stationCode => {
      // 如果隐藏参数，则参数列数为0，否则为实际参数数量
      const paramCount = hideParameters ? 0 : (parameterMap.get(stationCode)?.length || 0);
      totalParamCount += paramCount + 2; // +2 for defectType and defectCode
    });

    return {
      orderedStationCodes: sortedStationCodes,
      stationParameterMap: parameterMap,
      allParameterCount: totalParamCount,
    };
  }, [wafers, selectedBatch, hideParameters]); // 添加 hideParameters 到依赖数组

  // 根据筛选条件过滤晶圆数据
  const filteredWafers = useMemo(() => {
    const safeWafers = wafers || [];

    let currentFiltered = safeWafers;

    // 如果勾选了筛选不良品，则只显示类型为 'REJECT' 的晶圆
    if (filterDefectsOnly) {
      currentFiltered = currentFiltered.filter(wafer => wafer.type === 'REJECT');
    }
    
    return currentFiltered;
  }, [wafers, filterDefectsOnly]); // 添加 filterDefectsOnly 到依赖数组

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl m-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex-shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">最终分选总览</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-5 text-gray-700 text-sm">
          {isAggregatedDataLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">正在加载晶圆数据...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* 新增筛选复选框 */}
              <div className="mb-4 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterDefectsOnly}
                    onChange={(e) => setFilterDefectsOnly(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">筛选不良品</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hideParameters}
                    onChange={(e) => setHideParameters(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">隐藏参数</span>
                </label>
                <span className="ml-auto text-sm text-gray-500">
                  显示 {filteredWafers.length} / {wafers.length} 个晶圆
                </span>
              </div>

              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                      Wafer ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                      Sublot ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                      Carrier ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                      Lot ID
                    </th>
                    {orderedStationCodes.map(stationCode => {
                      // Colspan 依赖于 hideParameters
                      const colSpan = hideParameters ? 2 : (stationParameterMap.get(stationCode)?.length || 0) + 2;
                      return (
                        <th key={stationCode} colSpan={colSpan} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                          {getStationDisplayName(stationCode)}
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r"></th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r"></th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r"></th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r"></th>
                    {orderedStationCodes.map(stationCode => {
                      const paramNames = stationParameterMap.get(stationCode) || [];
                      return (
                        <React.Fragment key={stationCode}>
                          {!hideParameters && paramNames.map(paramName => ( // 根据 hideParameters 条件渲染参数头部
                            <th key={`${stationCode}-${paramName}`} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                              {paramName}
                            </th>
                          ))}
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                            不良类型
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                            不良代码
                          </th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWafers.length > 0 ? (
                    filteredWafers.map((wafer, index) => (
                      <tr
                        key={wafer.id}
                        className={`${
                          wafer.type === 'REJECT' 
                            ? 'bg-red-100 hover:bg-red-200'
                            : wafer.type === 'GoodSample'
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : wafer.type === 'LOSS'
                            ? 'bg-yellow-50 hover:bg-yellow-100'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                          {wafer.waferId}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                          {wafer.sublotId}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                          {wafer.carrierId}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                          {wafer.lotId}
                        </td>
                        {orderedStationCodes.map(stationCode => {
                          const paramNames = stationParameterMap.get(stationCode) || [];
                          const stationResult = wafer.inspectionResultsByStation?.[stationCode];
                          
                          return (
                            <React.Fragment key={stationCode}>
                              {!hideParameters && paramNames.map(paramName => { // 根据 hideParameters 条件渲染参数数据
                                const param = stationResult?.parameters.find(p => p.name === paramName);
                                return (
                                  <td key={`${stationCode}-${paramName}`} className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r">
                                    {param ? `${param.value}${param.unit ? ` ${param.unit}` : ''}` : '-'}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r">
                                {stationResult?.defectType || '-'}
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800 border-r">
                                {stationResult?.defectCode || '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4 + allParameterCount} className="px-6 py-4 text-center text-sm text-gray-500">
                        {filterDefectsOnly ? '没有不良晶圆' : '无晶圆片数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalSortingOverviewModal;

