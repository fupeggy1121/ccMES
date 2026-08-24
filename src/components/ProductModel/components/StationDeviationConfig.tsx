// src/components/StationDeviationConfig.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { Station, StationDeviation, Parameter, EquipmentGroup, Equipment } from '../types/Product';
import ParameterSelectionModal from './ParameterSelectionModal';

interface StationDeviationConfigProps {
  station: Station;
  deviation?: StationDeviation | null;
  onUpdateDeviation: (deviation: StationDeviation | null) => void; // 更新：可以接受 null
  isReadOnly?: boolean;
  equipmentGroups: EquipmentGroup[]; // 更改为 EquipmentGroup[]
  equipmentList: Equipment[]; // 更改为 Equipment[]
  allParameters: Parameter[]; // 新增：所有参数
}

const StationDeviationConfig: React.FC<StationDeviationConfigProps> = ({
  station,
  deviation = {},
  onUpdateDeviation,
  isReadOnly = false,
  equipmentGroups, // 使用新的 prop
  equipmentList,   // 使用新的 prop
  allParameters    // 使用新的 prop
}) => {
  // 确保 station 属性有效
  if (!station) {
    return null;
  }

  const [parameterModalOpen, setParameterModalOpen] = useState(false);
  const [currentParameterType, setCurrentParameterType] = useState<'measurement' | 'process' | 'spc'>('measurement');

  // 将 Station 字段名映射到 StationDeviation 偏离字段名
  const getDeviatedFieldName = useCallback((field: keyof Station): keyof StationDeviation => {
    const fieldMap: Record<keyof Station, keyof StationDeviation> = {
      equipment_group_ids: 'deviatedEquipmentGroups', // 修改这里
      recipe: 'deviatedRecipe',
      measurementParameters: 'deviatedMeasurementParameters',
      processParameters: 'deviatedProcessParameters',
      spcParameters: 'deviatedSpcParameters',
      remarks: 'deviatedRemarks'
    };
    return fieldMap[field] || field as keyof StationDeviation;
  }, []);

  // 更新：处理所有类型偏离字段的统一函数
  const handleUpdateDeviation = useCallback((field: keyof Station | 'allowJump' | 'autoSkip', value: string | string[] | Parameter[] | boolean) => {
    const updatedDeviation = deviation ? { ...deviation } : { stationId: station.id };
    
    // 确定要更新的字段名
    let fieldName: keyof StationDeviation;
    if (field === 'allowJump' || field === 'autoSkip') {
      fieldName = field;
    } else {
      fieldName = getDeviatedFieldName(field);
    }
    
    // 处理布尔值字段（allowJump 和 autoSkip）
    if (field === 'allowJump' || field === 'autoSkip') {
      // 无论值是true还是false，都设置该字段
      updatedDeviation[fieldName] = value as boolean;
    } 
    // 处理数组字段 (equipment_group_ids, measurementParameters, processParameters, spcParameters, remarks)
    else if (field === 'equipment_group_ids' || field === 'measurementParameters' || field === 'processParameters' || field === 'spcParameters' || field === 'remarks') {
      const originalValue = station[field];
      const isSameValue = JSON.stringify((value as any[] || []).sort()) === JSON.stringify((originalValue as any[] || []).sort()); // 排序后比较
      
      if (isSameValue) {
        // 如果偏离值与原始值相同，则移除该偏离
        delete updatedDeviation[fieldName];
      } else {
        updatedDeviation[fieldName] = value as any;
      }
    }
    // 处理字符串字段 (recipe)
    else { // field === 'recipe'
      const originalValue = station[field];
      const isSameValue = String(value) === String(originalValue);
      
      if (isSameValue) {
        // 如果偏离值与原始值相同，则移除该偏离
        delete updatedDeviation[fieldName];
      } else {
        updatedDeviation[fieldName] = value as string;
      }
    }
    
    // 检查是否还有任何有意义的偏离
    const { stationId, ...meaningfulDeviations } = updatedDeviation;
    const hasMeaningfulDeviations = Object.keys(meaningfulDeviations).length > 0;
    
    onUpdateDeviation(hasMeaningfulDeviations ? updatedDeviation : null);
  }, [deviation, station, onUpdateDeviation, getDeviatedFieldName]);

  const getFieldValue = useCallback((field: keyof Station): string | string[] | Parameter[] => {
    const deviatedField = getDeviatedFieldName(field);
    
    // For array fields (equipment_group_ids, measurementParameters, processParameters, spcParameters, remarks)
    if (field === 'equipment_group_ids' || field === 'measurementParameters' || field === 'processParameters' || field === 'spcParameters' || field === 'remarks') {
      if (deviation && Object.prototype.hasOwnProperty.call(deviation, deviatedField)) {
        const deviatedValue = deviation[deviatedField] as any;
        return Array.isArray(deviatedValue) ? deviatedValue : [];
      }
      const stationValue = station[field];
      return Array.isArray(stationValue) ? stationValue : [];
    }
    
    // For string fields (recipe)
    if (deviation && Object.prototype.hasOwnProperty.call(deviation, deviatedField)) {
      const deviatedValue = deviation[deviatedField];
      return deviatedValue === null || deviatedValue === undefined ? '' : String(deviatedValue);
    }
    const stationValue = station[field];
    return stationValue === null || stationValue === undefined ? '' : String(stationValue);
  }, [deviation, station, getDeviatedFieldName]);

  const hasDeviation = useCallback((field: keyof Station | 'allowJump' | 'autoSkip'): boolean => {
    // 如果 deviation 为 null 或 undefined，直接返回 false
    if (!deviation) {
      return false;
    }
    
    let fieldName: keyof StationDeviation;
    if (field === 'allowJump' || field === 'autoSkip') {
      fieldName = field;
      // 对于布尔字段，检查是否为 true
      return deviation[fieldName] === true;
    } else {
      fieldName = getDeviatedFieldName(field);
    }
    
    // 使用可选链安全地检查 deviation 中的偏离字段
    if (!deviation || !Object.prototype.hasOwnProperty.call(deviation, fieldName) || deviation[fieldName] === undefined) {
      return false;
    }
    
    const deviationValue = deviation[fieldName];
    
    if (field === 'allowJump' || field === 'autoSkip') {
      // 布尔字段，如果为 true 表示有偏离
      return deviationValue === true;
    }
    
    const stationValue = station[field];
    
    if (deviationValue === undefined) return false;
    
    if (field === 'equipment_group_ids' || field === 'measurementParameters' || field === 'processParameters' || field === 'spcParameters' || field === 'remarks') {
      return JSON.stringify((deviationValue as any[] || []).sort()) !== JSON.stringify((stationValue as any[] || []).sort());
    } else { // string field (recipe)
      return JSON.stringify(deviationValue) !== JSON.stringify(stationValue);
    }
  }, [deviation, station, getDeviatedFieldName]);

  const formatParameters = useCallback((parameters: Parameter[]): string => {
    if (!parameters || parameters.length === 0) return '无参数';
    return parameters.map(param => {
      const limits = [];
      if (param.upperLimit !== undefined && param.upperLimit !== '') {
        limits.push(`上限: ${param.upperLimit}`);
      }
      if (param.lowerLimit !== undefined && param.lowerLimit !== '') {
        limits.push(`下限: ${param.lowerLimit}`);
      }
      const limitText = limits.length > 0 ? ` (${limits.join(', ')})` : '';
      return `${param.name}${limitText}`;
    }).join(', ');
  }, []);

  const getInputClassName = useCallback((field: keyof Station): string => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200";
    return hasDeviation(field) 
      ? `${baseClasses} bg-yellow-50 border-yellow-400 border-2` 
      : baseClasses;
  }, [hasDeviation]);

  const getDisplayClassName = useCallback((field: keyof Station): string => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 transition-colors duration-200";
    return hasDeviation(field) 
      ? `${baseClasses} bg-yellow-50 border-yellow-400 border-2` 
      : baseClasses;
  }, [hasDeviation]);

  // 计算是否有任何偏离 - 更新：包括 allowJump 和 autoSkip
  const hasAnyDeviation = useMemo(() => {
    // 如果 deviation 为 null 或 undefined，直接返回 false
    if (!deviation) {
      return false;
    }
    
    const fields: (keyof Station)[] = [
      'equipment_group_ids', 
      'recipe', 
      'measurementParameters', 
      'processParameters', 
      'spcParameters'
    ];
    
    // 检查是否有字段偏离或者 allowJump/autoSkip 为 true
    return fields.some(field => hasDeviation(field)) || 
           deviation.allowJump === true || 
           deviation.autoSkip === true;
  }, [deviation, hasDeviation]);

  const handleParameterButtonClick = useCallback((type: 'measurement' | 'process' | 'spc') => {
    setCurrentParameterType(type);
    setParameterModalOpen(true);
  }, []);

  const getAvailableParameters = useCallback((type: 'measurement' | 'process' | 'spc'): Parameter[] => {
    // 从 allParameters 中筛选出对应类型的参数
    return allParameters.filter(param => param.type === type);
  }, [allParameters]);

  const getParameterFieldName = useCallback((type: 'measurement' | 'process' | 'spc'): keyof Station => {
    switch (type) {
      case 'measurement':
        return 'measurementParameters';
      case 'process':
        return 'processParameters';
      case 'spc':
        return 'spcParameters';
      default:
        return 'measurementParameters';
    }
  }, []);

  const getParameterTitle = useCallback((type: 'measurement' | 'process' | 'spc'): string => {
    switch (type) {
      case 'measurement':
        return '量测参数';
      case 'process':
        return '工艺参数';
      case 'spc':
        return 'SPC管控参数';
      default:
        return '参数';
    }
  }, []);

  // 修复参数保存逻辑 - 确保正确处理参数选择
  const handleParameterSave = useCallback((selectedParameters: Parameter[]) => {
    const fieldName = getParameterFieldName(currentParameterType);
    handleUpdateDeviation(fieldName, selectedParameters);
    setParameterModalOpen(false);
  }, [currentParameterType, getParameterFieldName, handleUpdateDeviation]);

  // 获取当前显示的参数值
  const getCurrentParameterDisplay = useCallback((field: keyof Station): string => {
    const parameters = getFieldValue(field) as Parameter[];
    return formatParameters(parameters);
  }, [getFieldValue, formatParameters]);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      {/* 偏离状态指示器 */}
      <div className="flex items-center justify-between mb-6">
        {hasAnyDeviation && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            存在偏离配置 
          </span>
        )}
      </div>

      {/* 新增：站点跳转配置 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">站点跳转配置</h3> 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={deviation?.allowJump || false}
                onChange={(e) => handleUpdateDeviation('allowJump', e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">是否允许跳站</span>
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={deviation?.autoSkip || false}
                onChange={(e) => handleUpdateDeviation('autoSkip', e.target.checked)}
                disabled={isReadOnly || !deviation?.allowJump}
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                  !deviation?.allowJump ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <span className={`ml-2 text-sm font-medium ${
                !deviation?.allowJump ? 'text-gray-400' : 'text-gray-700'
              }`}>自动跳站</span>
            </label>
            {!deviation?.allowJump && (
              <span className="ml-2 text-xs text-gray-500">(需先启用允许跳站)</span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">设备组配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原始设备组</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {station.equipment_group_ids?.map(id => equipmentGroups.find(g => g.id === id)?.name || id).join(', ') || '未设置'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              偏离设备组
              {hasDeviation('equipment_group_ids') && (
                <span className="ml-2 text-xs text-yellow-600">(已偏离)</span>
              )}
            </label>
            <select
              value={((getFieldValue('equipment_group_ids') as string[]) || [])[0] || ''} // 假设仍然是单选，只取第一个
              onChange={(e) => handleUpdateDeviation('equipment_group_ids', e.target.value ? [e.target.value] : [])}
              className={getInputClassName('equipment_group_ids')}
              disabled={isReadOnly}
            >
              <option value="">请选择设备组</option>
              {equipmentGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">配方配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原始配方</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {station.recipe || '未设置'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              偏离配方
              {hasDeviation('recipe') && (
                <span className="ml-2 text-xs text-yellow-600">(已偏离)</span>
              )}
            </label>
            <select
              value={getFieldValue('recipe') as string || ''}
              onChange={(e) => handleUpdateDeviation('recipe', e.target.value)}
              className={getInputClassName('recipe')}
              disabled={isReadOnly}
            >
              <option value="">不校验配方</option>
              {equipmentList.map(equipment => ( // 使用 equipmentList prop
                <option key={equipment.id} value={equipment.name}>{equipment.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 参数配置统一区域 */}
      <div className="space-y-6">
        {/* 量测参数配置 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              量测参数配置
              {hasDeviation('measurementParameters') && (
                <span className="ml-2 text-xs text-yellow-600">(已偏离)</span>
              )}
            </h3>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleParameterButtonClick('measurement')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex-shrink-0"
              >
                选择参数
              </button>
            )}
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">当前参数</label>
            <div className={getDisplayClassName('measurementParameters')}>
              {getCurrentParameterDisplay('measurementParameters')}
            </div>
          </div>
        </div>

        {/* 工艺参数配置 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              工艺参数配置
              {hasDeviation('processParameters') && (
                <span className="ml-2 text-xs text-yellow-600">(已偏离)</span>
              )}
            </h3>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleParameterButtonClick('process')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex-shrink-0"
              >
                选择参数
              </button>
            )}
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">当前参数</label>
            <div className={getDisplayClassName('processParameters')}>
              {getCurrentParameterDisplay('processParameters')}
            </div>
          </div>
        </div>

        {/* SPC管控参数配置 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              SPC管控参数配置
              {hasDeviation('spcParameters') && (
                <span className="ml-2 text-xs text-yellow-600">(已偏离)</span>
              )}
            </h3>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleParameterButtonClick('spc')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex-shrink-0"
              >
                选择参数
              </button>
            )}
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">当前参数</label>
            <div className={getDisplayClassName('spcParameters')}>
              {getCurrentParameterDisplay('spcParameters')}
            </div>
          </div>
        </div>
      </div>

      {/* 参数选择模态框 */}
      <ParameterSelectionModal
        isOpen={parameterModalOpen}
        onClose={() => setParameterModalOpen(false)}
        title={`选择${getParameterTitle(currentParameterType)}`}
        parameters={getAvailableParameters(currentParameterType)}
        selectedParameters={getFieldValue(getParameterFieldName(currentParameterType)) as Parameter[] || []}
        onSave={handleParameterSave}
        isDeviationContext={true}
      />
    </div>
  );
};

export default StationDeviationConfig;