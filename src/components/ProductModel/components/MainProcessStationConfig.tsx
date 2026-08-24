// src/components/MainProcessStationConfig.tsx
import React from 'react';
import { Settings } from 'lucide-react';
import { Station, ProductStationSubPathOverride, EquipmentGroup, Equipment, ParameterGroup } from '../types/Product';

interface MainProcessStationConfigProps {
  stations: Station[];
  isReadOnly: boolean;
  productStationSubPathOverrides: ProductStationSubPathOverride[];
  onUpdateStationField: (stationId: string, field: keyof Station, value: any) => void;
  onOpenParameterModal: (stationId: string, parameterType: 'measurement' | 'process' | 'spc') => void;
  onOpenRemarksModal: (stationId: string) => void;
  onConfigureSubPaths: (station: Station) => void;
  onConfigureDeviation: (station: Station) => void;
  equipmentGroups: EquipmentGroup[];
  equipmentList: Equipment[];
  parameterGroups: ParameterGroup[]; // 仍然需要传递给 ProductModal，但不再直接在此组件中使用选择器
  showDeviationButton?: boolean;
  hideSubPathConfigColumn?: boolean;
}

const MainProcessStationConfig: React.FC<MainProcessStationConfigProps> = ({
  stations,
  isReadOnly,
  productStationSubPathOverrides,
  onUpdateStationField,
  onOpenParameterModal,
  onOpenRemarksModal,
  onConfigureSubPaths,
  onConfigureDeviation,
  equipmentGroups,
  equipmentList,
  parameterGroups, // 保持传递，因为 ProductModal 需要它
  showDeviationButton = true,
  hideSubPathConfigColumn = false
}) => {
  const safeStations = Array.isArray(stations) ? stations : [];

  const getSubPathStatus = (station: Station) => {
    const stationOverrides = productStationSubPathOverrides.filter(o => o.stationId === station.id);
    
    if (station.associatedSubPaths.length === 0) {
      return { hasSubPaths: false, hasOverrides: false, count: 0 };
    }
    
    const hasOverrides = stationOverrides.length > 0;
    const disabledCount = stationOverrides.filter(o => o.isDisabled === true).length;
    const enabledCount = stationOverrides.filter(o => o.isEnabled === true).length;
    
    return {
      hasSubPaths: true,
      hasOverrides,
      count: station.associatedSubPaths.length,
      disabledCount,
      enabledCount
    };
  };

  // 获取设备组名称
  const getEquipmentGroupName = (station: Station) => {
    if (!station.equipment_group_ids || station.equipment_group_ids.length === 0) {
      return '';
    }
    const group = equipmentGroups.find(g => g.id === station.equipment_group_ids![0]); // 假设只显示第一个
    return group ? group.name : '未知设备组';
  };

  // 获取设备列表（基于选中的设备组）
  const getFilteredEquipment = (station: Station) => {
    if (!station.equipment_group_ids || station.equipment_group_ids.length === 0) {
      return equipmentList; // 如果没有选择设备组，显示所有设备
    }
    const selectedGroupId = station.equipment_group_ids[0]; // 假设只使用第一个进行过滤
    return equipmentList.filter(equipment => 
      equipment.equipment_group_id === selectedGroupId
    );
  };

  // 获取参数组名称 (此函数仅用于显示，不再用于选择)
  const getParameterGroupNames = (station: Station) => {
    if (!station.parameterGroups || station.parameterGroups.length === 0) {
      return [];
    }
    return station.parameterGroups.map(group => group.name);
  };

  // 更新设备组ID
  const handleEquipmentGroupChange = (stationId: string, equipmentGroupId: string) => {
    onUpdateStationField(stationId, 'equipment_group_ids', equipmentGroupId ? [equipmentGroupId] : []); // 存储为数组
  };

  // 更新设备配方
  const handleRecipeChange = (stationId: string, recipe: string) => {
    onUpdateStationField(stationId, 'recipe', recipe);
  };

  // handleParameterGroupChange 已被移除，因为选择器已移走

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
            {/* 移除参数组列头 */}
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
            {!hideSubPathConfigColumn && (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                子路径配置
              </th>
            )}
            {showDeviationButton && (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                偏离配置
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {safeStations.length === 0 ? (
            <tr>
              {/* 调整 colSpan 以适应移除的“参数组”列 */}
              <td colSpan={(showDeviationButton ? 1 : 0) + (hideSubPathConfigColumn ? 0 : 1) + 7} className="px-4 py-8 text-center text-gray-500">
                暂无站点配置
              </td>
            </tr>
          ) : (
            safeStations.map((station) => {
              const subPathStatus = getSubPathStatus(station);
              const filteredEquipment = getFilteredEquipment(station);
              
              return (
                <tr key={station?.id || `station-${Math.random()}`}>
                  <td className="px-4 py-2 text-sm text-gray-900 border-b">
                    {station?.stationName || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm border-b">
                    <select
                      value={station?.equipment_group_ids?.[0] || ''} // 假设只显示和选择第一个设备组
                      onChange={(e) => {
                        station?.id && handleEquipmentGroupChange(station.id, e.target.value);
                      }}
                      className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      disabled={isReadOnly}
                    >
                      <option value="">请选择设备组</option>
                      {equipmentGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 text-xs text-gray-500">
                      {getEquipmentGroupName(station)}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm border-b">
                    <select
                      value={station?.recipe || ''}
                      onChange={(e) => station?.id && handleRecipeChange(station.id, e.target.value)}
                      className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      disabled={isReadOnly}
                    >
                      <option value="">请选择配方</option>
                      {filteredEquipment.map(equipment => (
                        <option key={equipment.id} value={equipment.recipe || equipment.code}>
                          {equipment.name} ({equipment.code})
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* 移除参数组选择器 */}
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
                        ? `已选择 ${station?.measurementParameters?.length || 0} 个参数`
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
                        ? `已选择 ${station?.processParameters?.length || 0} 个参数`
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
                      disabled={isReadOnly || (station?.measurementParameters?.length || 0) === 0}
                    >
                      {(station?.spcParameters?.length || 0) > 0 
                        ? `已选择 ${station?.spcParameters?.length || 0} 个参数`
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
                        ? `${station?.remarks?.length || 0} 条备注`
                        : '添加备注'
                      }
                    </button>
                  </td>
                  {!hideSubPathConfigColumn && (
                    <td className="px-4 py-2 text-sm border-b">
                      {subPathStatus.hasSubPaths ? (
                        <button
                          type="button"
                          onClick={() => station && onConfigureSubPaths(station)}
                          className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
                            subPathStatus.hasOverrides
                              ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isReadOnly}
                        >
                          <Settings className="w-3 h-3" />
                          {subPathStatus.hasOverrides ? '已配置' : '配置'}
                          {subPathStatus.disabledCount > 0 && (
                            <span className="ml-1 text-xs text-red-600">
                              ({subPathStatus.disabledCount}禁用)
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">无子路径</span>
                      )}
                    </td>
                  )}
                  {showDeviationButton && (
                    <td className="px-4 py-2 text-sm border-b">
                      <button
                        type="button"
                        onClick={() => station && onConfigureDeviation(station)}
                        className="px-4 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        偏离配置
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MainProcessStationConfig;
