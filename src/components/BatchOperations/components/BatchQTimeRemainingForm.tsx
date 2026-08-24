// src/components/BatchQTimeRemainingForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Info } from 'lucide-react';
import { StationData, BatchQTimeInfo, BatchData } from '../types';
import { mockBatchQTimeData } from '../data/mockQTimeData';

interface BatchQTimeRemainingFormProps {
  isOpen: boolean;
  onClose: () => void;
  allStations: StationData[];
  selectedBatchStation?: string; // 当前选中的批次站点（如果有）
  batchList: BatchData[]; // 新增：从Supabase获取的批次列表
}

const BatchQTimeRemainingForm: React.FC<BatchQTimeRemainingFormProps> = ({
  isOpen,
  onClose,
  allStations,
  selectedBatchStation,
  batchList // 新增：批次列表
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 初始化站点选择：优先使用选中的批次站点，否则使用第一个可用站点
  useEffect(() => {
    if (allStations.length > 0) {
      if (selectedBatchStation) {
        const stationExists = allStations.some(station => station.code === selectedBatchStation);
        if (stationExists) {
          setSelectedStation(selectedBatchStation);
        } else {
          setSelectedStation(allStations[0].code);
        }
      } else {
        setSelectedStation(allStations[0].code);
      }
    }
  }, [allStations, selectedBatchStation]);

  // 使用 useMemo 计算当前站点的批次数据
  const qTimeData = useMemo(() => {
    if (!selectedStation) return [];
    
    // 过滤出当前站点的批次数据
    const stationBatches = batchList.filter(batch => batch.station === selectedStation);
    
    // 为每个批次查找Q-Time信息并合并
    const mergedData = stationBatches.map(batch => {
      // 查找mock数据中对应的Q-Time信息
      const qTimeInfo = mockBatchQTimeData.find(item => item.batchCode === batch.batchCode);
      
      if (qTimeInfo) {
        // 如果找到Q-Time信息，合并数据
        return {
          ...batch,
          ...qTimeInfo
        };
      } else {
        // 如果未找到，设置默认Q-Time值（表示没有Q-Time限制）
        return {
          ...batch,
          qTimeRemainingHours: 999,
          currentStation: batch.station,
          rules: [],
          minRemainingHours: 999
        };
      }
    });
    
    // 按 minRemainingHours 正序排列
    return mergedData.sort((a, b) => a.minRemainingHours - b.minRemainingHours);
  }, [selectedStation, batchList]);

  // 获取站点名称
  const getStationName = (code: string): string => {
    const station = allStations.find(s => s.code === code);
    return station ? station.name : code;
  };

  // 格式化时间显示
  const formatHours = (hours: number): string => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}天${remainingHours > 0 ? ` ${remainingHours}小时` : ''}`;
    } else if (hours >= 1) {
      return `${hours.toFixed(1)}小时`;
    } else {
      const minutes = Math.floor(hours * 60);
      return `${minutes}分钟`;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string): string => {
    switch (status) {
      case '加工中': return 'text-blue-600 bg-blue-50';
      case '待出站': return 'text-purple-600 bg-purple-50';
      case 'Hold': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 处理站点变更
  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStation = e.target.value;
    setSelectedStation(newStation);
  };

  // 如果没有打开，返回null
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 背景遮罩 */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* 模态框内容 */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* 标题栏 */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  批次Q-Time剩余时长查询
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              查看选定站点下所有批次的Q-Time剩余时长，提前预警避免触发Hold操作
            </p>
          </div>

          {/* 站点选择器 */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择站点
                </label>
                <select
                  value={selectedStation}
                  onChange={handleStationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={loading}
                >
                  {allStations.map(station => (
                    <option key={station.code} value={station.code}>
                      {station.name} ({station.code})
                    </option>
                  ))}
                </select>
              </div>

            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Info className="w-4 h-4 mr-1 text-blue-500" />
              <span>批次按Q-Time剩余时长升序排列，剩余时间少的批次优先显示</span>
            </div>
          </div>

          {/* 数据表格区域 */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">加载批次Q-Time数据中...</p>
                </div>
              </div>
            ) : qTimeData.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">当前站点没有需要Q-Time监控的批次</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        批次号
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        产品料号
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        产品名称
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        总片数
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Q-Time剩余
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        触发规则
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {qTimeData.map((batch, index) => (
                      <tr key={batch.batchCode}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {batch.batchCode}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.productCode}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.productName}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.totalQty}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatHours(batch.minRemainingHours)}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {batch.rules && batch.rules.length > 0 ? (
                            <div className="space-y-1">
                              {batch.rules.map(rule => (
                                <div key={rule.id} className="text-xs">
                                  <div className="font-medium">{rule.sourceStation} → {rule.targetStation}</div>
                                  <div className="text-gray-500">限制: {rule.maxDurationHours}小时</div>
                                  {rule.description && (
                                    <div className="text-gray-400 italic">{rule.description}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">无Q-Time规则</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 底部信息栏 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                总计 {qTimeData.length} 个批次
              </div>
              <div className="text-xs text-gray-500">
                Q-Time剩余时长计算：取所有触发规则中最小剩余值
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>Q-Time规则说明：系统根据批次当前站点遍历所有触发的Q-Time规则，计算"规则限制时长" - "起始站等待时长"，取最小值作为剩余时长。</p>
              <p className="mt-1">注：没有Q-Time规则的批次显示为"无Q-Time规则"。</p>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchQTimeRemainingForm;