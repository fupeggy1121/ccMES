// src/components/MainProcessStationConfig.tsx
import React from 'react';
import { StationConfig } from '../types';

interface MainProcessStationConfigProps {
  stations: StationConfig[];
  isReadOnly: boolean;
  onUpdateStationField: (stationId: string, field: keyof StationConfig, value: any) => void;
  onOpenParameterModal: (stationId: string, parameterType: 'measurement' | 'process' | 'spc') => void;
  onOpenRemarksModal: (stationId: string) => void;
  onConfigureDeviation: (station: StationConfig) => void;
  mockEquipmentGroups: string[];
  mockRecipes: string[];
  showDeviationButton?: boolean;
}

const MainProcessStationConfig: React.FC<MainProcessStationConfigProps> = ({
  stations,
  isReadOnly,
  onUpdateStationField,
  onOpenParameterModal,
  onOpenRemarksModal,
  onConfigureDeviation,
  mockEquipmentGroups,
  mockRecipes,
  showDeviationButton = true
}) => {
  const safeStations = Array.isArray(stations) ? stations : [];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              站点名称
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              设备组
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              配方
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              量测参数
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              工艺参数
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              SPC管控
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              备注
            </th>
            {showDeviationButton && (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                操作
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {safeStations.length === 0 ? (
            <tr>
              <td colSpan={showDeviationButton ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                暂无站点配置
              </td>
            </tr>
          ) : (
            safeStations.map((station) => (
              <tr key={station?.id || `station-${Math.random()}`}>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station?.stationName || '-'}
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  <select
                    value={station?.equipmentGroup || ''}
                    onChange={(e) => station?.id && onUpdateStationField(station.id, 'equipmentGroup', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={isReadOnly}
                  >
                    <option value="">请选择</option>
                    {(mockEquipmentGroups || []).map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  <select
                    value={station?.recipe || ''}
                    onChange={(e) => station?.id && onUpdateStationField(station.id, 'recipe', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    disabled={isReadOnly}
                  >
                    <option value="">请选择</option>
                    {(mockRecipes || []).map(recipe => (
                      <option key={recipe} value={recipe}>{recipe}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  <button
                    type="button"
                    onClick={() => station?.id && onOpenParameterModal(station.id, 'measurement')}
                    className={`text-blue-600 hover:text-blue-800 text-xs ${
                      isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isReadOnly}
                  >
                    {(station?.measurementParameters?.length || 0) > 0 
                      ? `已选择 ${station.measurementParameters.length} 个参数`
                      : '选择参数'
                    }
                  </button>
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  <button
                    type="button"
                    onClick={() => station?.id && onOpenParameterModal(station.id, 'process')}
                    className={`text-blue-600 hover:text-blue-800 text-xs ${
                      isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isReadOnly}
                  >
                    {(station?.processParameters?.length || 0) > 0 
                      ? `已选择 ${station.processParameters.length} 个参数`
                      : '选择参数'
                    }
                  </button>
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  <button
                    type="button"
                    onClick={() => station?.id && onOpenParameterModal(station.id, 'spc')}
                    className={`text-blue-600 hover:text-blue-800 text-xs ${
                      isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isReadOnly}
                  >
                    {(station?.spcParameters?.length || 0) > 0 
                      ? `已选择 ${station.spcParameters.length} 个参数`
                      : '选择参数'
                    }
                  </button>
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  <button
                    type="button"
                    onClick={() => station?.id && onOpenRemarksModal(station.id)}
                    className={`text-blue-600 hover:text-blue-800 text-xs ${
                      isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isReadOnly}
                  >
                    {(station?.remarks?.length || 0) > 0 
                      ? `${station.remarks.length} 条备注`
                      : '添加备注'
                    }
                  </button>
                </td>
                {showDeviationButton && (
                  <td className="px-4 py-2 text-sm border-b">
                    <button
                      type="button"
                      onClick={() => station && onConfigureDeviation(station)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      偏离配置
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MainProcessStationConfig;