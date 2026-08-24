// src/components/SubProcessConfigForm.tsx
import React, { useState } from 'react';
import MainProcessStationConfig from './MainProcessStationConfig';
import { Station, SubProcessConfig, StationSubPath } from '../types/Product'; // 导入 StationSubPath

interface SubProcessConfigFormProps {
  subProcessConfigs?: SubProcessConfig[];
  isReadOnly: boolean;
  onAddSubProcessConfig: () => void;
  onRemoveSubProcessConfig: (configId: string) => void;
  onSubProcessConfigPathChange: (configId: string, pathId: string) => void; // 更改为 pathId
  onUpdateStationField: (
    stationId: string,
    field: keyof Station,
    value: any,
    configType: 'sub',
    subConfigId?: string
  ) => void;
  onOpenParameterModal: (
    stationId: string,
    parameterType: 'measurement' | 'process' | 'spc',
    configType: 'sub',
    subConfigId?: string
  ) => void;
  onOpenRemarksModal: (
    stationId: string,
    configType: 'sub',
    subConfigId?: string
  ) => void;
  subProcessPathOptions: StationSubPath[]; // 更改类型为 StationSubPath[]
  EquipmentGroups: string[];
  equipmentList: Equipment[]; // 更改为 Equipment[]
  parameterGroups: ParameterGroup[]; // 新增：传递 parameterGroups
  showDeviationButton?: boolean;
}

const SubProcessConfigForm: React.FC<SubProcessConfigFormProps> = ({
  subProcessConfigs = [],
  isReadOnly,
  onAddSubProcessConfig,
  onRemoveSubProcessConfig,
  onSubProcessConfigPathChange,
  onUpdateStationField,
  onOpenParameterModal,
  onOpenRemarksModal,
  subProcessPathOptions,
  equipmentGroups, // 使用新的 prop
  equipmentList,   // 使用新的 prop
  parameterGroups, // 使用新的 prop
  showDeviationButton = true
}) => {
  // 处理子路径选择变化
  const handlePathChange = (configId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    onSubProcessConfigPathChange(configId, e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">工艺子路径配置</h3>
        <button
          type="button"
          onClick={onAddSubProcessConfig}
          disabled={isReadOnly}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          新增子路径
        </button>
      </div>

      {subProcessConfigs.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500">暂无子路径配置</p>
        </div>
      ) : (
        subProcessConfigs.map((config) => (
          <div key={config.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <label className="block text-sm font-medium text-gray-700">子路径选择</label>
                <select
                  value={config.selectedSubPathId || ''} // 修改这里
                  onChange={(e) => handlePathChange(config.id, e)}
                  disabled={isReadOnly}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                >
                  <option value="">请选择子路径</option>
                  {subProcessPathOptions.map((path) => (
                    <option key={path.id} value={path.id}> {/* 使用 path.id 作为 value */}
                      {path.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => onRemoveSubProcessConfig(config.id)}
                disabled={isReadOnly}
                className="mt-6 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                删除
              </button>
            </div>

  {config.selectedSubPathId && (
    <MainProcessStationConfig
      stations={config.stations || []}
      isReadOnly={isReadOnly}
      productStationSubPathOverrides={[]}
      onUpdateStationField={(stationId, field, value) => onUpdateStationField(stationId, field, value, 'sub', config.id)}
      onOpenParameterModal={(stationId, parameterType) => onOpenParameterModal(stationId, parameterType, 'sub', config.id)}
      onOpenRemarksModal={(stationId) => onOpenRemarksModal(stationId, 'sub', config.id)}
      equipmentGroups={equipmentGroups} // 传递
      equipmentList={equipmentList}     // 传递
      parameterGroups={parameterGroups} // 传递
      showDeviationButton={showDeviationButton}
    />
  )}
          </div>
        ))
      )}
    </div>
  );
};

export default SubProcessConfigForm;