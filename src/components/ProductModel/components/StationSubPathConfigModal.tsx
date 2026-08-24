// src/components/StationSubPathConfigModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Tabs, Table, Checkbox } from 'antd';
import { Station, StationSubPath, ProductStationSubPathOverride } from '../types/Product';
import { populateStationsForSubPath } from '../utils/stationEnrichment';
import MainProcessStationConfig from './MainProcessStationConfig';

const { TabPane } = Tabs;

interface StationSubPathConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  productStationSubPathOverrides: ProductStationSubPathOverride[];
  onSaveOverrides: (overrides: ProductStationSubPathOverride[]) => void;
  subProcessPathOptions: StationSubPath[];
  equipmentGroups: EquipmentGroup[]; // 新增
  equipmentList: Equipment[]; // 新增
  parameterGroups: ParameterGroup[]; // 新增
}

const StationSubPathConfigModal: React.FC<StationSubPathConfigModalProps> = ({
  isOpen,
  onClose,
  station,
  productStationSubPathOverrides,
  onSaveOverrides,
  subProcessPathOptions,
  equipmentGroups, // 使用新的 prop
  equipmentList,   // 使用新的 prop
  parameterGroups, // 使用新的 prop
}) => {
  const [localOverrides, setLocalOverrides] = useState<ProductStationSubPathOverride[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('regular');
  const [isStationSubPathsGloballyDisabled, setIsStationSubPathsGloballyDisabled] = useState<boolean>(false);
  const [editingSubPathStations, setEditingSubPathStations] = useState<{
    subPath: StationSubPath;
    stations: Station[];
    override: ProductStationSubPathOverride;
  } | null>(null);
  const [selectedSpecialSamplingSubPathId, setSelectedSpecialSamplingSubPathId] = useState<string | null>(null); // 新增此行

  useEffect(() => {
    if (station) {
      setIsStationSubPathsGloballyDisabled(false);
      setEditingSubPathStations(null);
      setSelectedSpecialSamplingSubPathId(null); // 清除选中状态

      const initialOverrides: ProductStationSubPathOverride[] = station.associatedSubPaths.map(subPath => {
        const existingOverride = productStationSubPathOverrides.find(
          o => o.stationId === station.id && o.subPathId === subPath.id
        );

        if (existingOverride) {
          // 确保 configuredStations 在特殊抽样路径启用时被填充
          if (subPath.type === 'specialSampling' && (existingOverride.isEnabled ?? subPath.defaultEnabled) && !existingOverride.configuredStations) {
            // 异步获取站点数据，并更新到 override 中
            populateStationsForSubPath(subPath.id).then(stations => {
              setLocalOverrides(current => current.map(o =>
                o.subPathId === subPath.id ? { ...o, configuredStations: stations } : o
              ));
            });
          }
          return {
            ...existingOverride,
            isDisabled: (subPath.type === 'regular' || subPath.type === 'rework' || subPath.type === 'regular_sub')
              ? (existingOverride.isDisabled !== undefined ? existingOverride.isDisabled : !subPath.defaultEnabled)
              : undefined,
            isEnabled: subPath.type === 'specialSampling'
              ? (existingOverride.isEnabled !== undefined ? existingOverride.isEnabled : subPath.defaultEnabled)
              : undefined,
          };
        }

        const defaultIsEnabled = subPath.type === 'specialSampling' ? subPath.defaultEnabled : undefined;
        return {
          stationId: station.id,
          subPathId: subPath.id,
          isDisabled: (subPath.type === 'regular' || subPath.type === 'rework' || subPath.type === 'regular_sub') ? !subPath.defaultEnabled : undefined,
          isEnabled: defaultIsEnabled,
          configuredStations: undefined // 初始时不填充，在启用或选中时填充
        };
      });

      setLocalOverrides(initialOverrides);

      // 自动选中第一个已启用且有配置站点的特殊抽样路径
      const firstEnabledSpecialSampling = initialOverrides.find(
        override => {
          const subPath = station.associatedSubPaths.find(sp => sp.id === override.subPathId);
          return subPath?.type === 'specialSampling' && (override.isEnabled ?? subPath.defaultEnabled) && override.configuredStations;
        }
      );

      if (firstEnabledSpecialSampling) {
        const subPath = station.associatedSubPaths.find(sp => sp.id === firstEnabledSpecialSampling.subPathId);
        if (subPath && firstEnabledSpecialSampling.configuredStations) {
          setSelectedSpecialSamplingSubPathId(firstEnabledSpecialSampling.subPathId);
          setEditingSubPathStations({
            subPath,
            stations: firstEnabledSpecialSampling.configuredStations,
            override: firstEnabledSpecialSampling
          });
        }
      }

    }
  }, [station, productStationSubPathOverrides, subProcessPathOptions]);

  const handleSelectSpecialSamplingSubPath = (subPath: StationSubPath, override: ProductStationSubPathOverride) => {
    if (override.isEnabled && override.configuredStations) {
      setSelectedSpecialSamplingSubPathId(subPath.id);
      setEditingSubPathStations({
        subPath,
        stations: override.configuredStations,
        override
      });
    } else {
      // 如果未启用或未配置站点，则清除选中状态
      setSelectedSpecialSamplingSubPathId(null);
      setEditingSubPathStations(null);
    }
  };

  const handleSave = () => {
    let updatedOverrides = localOverrides;
    if (editingSubPathStations) {
      updatedOverrides = localOverrides.map(override => {
        if (override.subPathId === editingSubPathStations.subPath.id) {
          return {
            ...override,
            configuredStations: editingSubPathStations.stations
          };
        }
        return override;
      });
    }

    let finalOverrides: ProductStationSubPathOverride[];

    if (isStationSubPathsGloballyDisabled && station) {
      finalOverrides = station.associatedSubPaths.map(subPath => {
        if (subPath.type === 'regular' || subPath.type === 'rework' || subPath.type === 'regular_sub' || subPath.type === 'lab') {
          if (subPath.canBeDisabled) {
            return {
              stationId: station.id,
              subPathId: subPath.id,
              isDisabled: true,
              isEnabled: undefined,
              configuredStations: undefined
            };
          }
          return null;
        }
        return null;
      }).filter(Boolean) as ProductStationSubPathOverride[];
    } else {
      finalOverrides = updatedOverrides.filter(override => {
        const subPath = station?.associatedSubPaths.find(sp => sp.id === override.subPathId);
        if (!subPath) return false;

        if (subPath.type === 'regular' || subPath.type === 'rework' || subPath.type === 'regular_sub' || subPath.type === 'lab') {
          return override.isDisabled !== !subPath.defaultEnabled; // 只有当 isDisabled 不等于默认值时才保存
        } else if (subPath.type === 'specialSampling') {
          return override.isEnabled !== subPath.defaultEnabled || override.configuredStations !== undefined;
        }
        return false;
      });
    }

    onSaveOverrides(finalOverrides);
    onClose();
  };

  const handleRegularReworkToggle = (subPathId: string, checked: boolean) => {
    setLocalOverrides(prev => prev.map(override => {
      if (override.subPathId === subPathId) {
        return { ...override, isDisabled: checked };
      }
      return override;
    }));
  };

  const handleSpecialSamplingToggle = async (subPathId: string, checked: boolean) => {
    setLocalOverrides(prev => {
      const updatedOverrides = prev.map(override => {
        if (override.subPathId === subPathId) {
          const subPath = station?.associatedSubPaths.find(sp => sp.id === subPathId);

          if (checked && subPath) {
            // 当启用时，异步获取站点并更新 override
            populateStationsForSubPath(subPath.id).then(stations => {
              const updatedOverrideWithStations = {
                ...override,
                isEnabled: checked,
                configuredStations: stations
              };
              setLocalOverrides(current => current.map(o => o.subPathId === subPathId ? updatedOverrideWithStations : o));
              // 自动选中新启用的子路径
              setSelectedSpecialSamplingSubPathId(subPathId);
              setEditingSubPathStations({
                subPath,
                stations,
                override: updatedOverrideWithStations
              });
            });
            return { ...override, isEnabled: checked }; // 暂时返回不带 stations 的状态
          } else {
            // 当禁用时
            if (selectedSpecialSamplingSubPathId === subPathId) {
              setSelectedSpecialSamplingSubPathId(null);
              setEditingSubPathStations(null);
            }
            return {
              ...override,
              isEnabled: checked,
              configuredStations: undefined
            };
          }
        }
        return override;
      });
      return updatedOverrides;
    });
  };

  const handleGlobalDisableToggle = (checked: boolean) => {
    setIsStationSubPathsGloballyDisabled(checked);
  };

  const handleUpdateStationField = (
    stationId: string,
    field: keyof Station,
    value: any
  ) => {
    if (!editingSubPathStations) return;

    // 更新 editingSubPathStations 中的站点
    setEditingSubPathStations(prev => {
      if (!prev) return null;

      const updatedStations = prev.stations.map(station => {
        if (station.id === stationId) {
          return { ...station, [field]: value };
        }
        return station;
      });

      // 同时更新 localOverrides 数组中对应 override 的 configuredStations
      setLocalOverrides(currentOverrides => currentOverrides.map(override => {
        if (override.subPathId === prev.subPath.id) {
          return { ...override, configuredStations: updatedStations };
        }
        return override;
      }));

      return { ...prev, stations: updatedStations };
    });
  };

  const handleSaveSubPathStations = () => {
    if (!editingSubPathStations) return;

    setLocalOverrides(prev => prev.map(override => {
      if (override.subPathId === editingSubPathStations.subPath.id) {
        return {
          ...override,
          configuredStations: editingSubPathStations.stations
        };
      }
      return override;
    }));

    setEditingSubPathStations(null);
  };

  const handleCancelSubPathStations = () => {
    setEditingSubPathStations(null);
  };

  const getOverrideForSubPath = (subPathId: string): ProductStationSubPathOverride | undefined => {
    return localOverrides.find(o => o.subPathId === subPathId);
  };

  // 获取常规/返工子路径数据（移除 lab 类型）
  const getRegularReworkLabSubPaths = () => {
    if (!station) return [];
    return station.associatedSubPaths.filter(
      sp => sp.type === 'regular' || sp.type === 'rework' || sp.type === 'regular_sub' // 移除 || sp.type === 'lab'
    );
  };

  // 获取特殊抽样子路径数据
  const getSpecialSamplingSubPaths = () => {
    if (!station) return [];
    return station.associatedSubPaths.filter(
      sp => sp.type === 'specialSampling'
    );
  };

  // 常规/返工/实验室子路径表格列定义
  const regularReworkLabColumns = [
    {
      title: '子路径名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: StationSubPath) => (
        <span className="font-medium">{text}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let className = '';
        let label = '';

        switch (type) {
          case 'regular':
          case 'regular_sub':
            className = 'bg-blue-100 text-blue-800';
            label = '常规';
            break;
          case 'rework':
            className = 'bg-yellow-100 text-yellow-800';
            label = '返工';
            break;
          case 'lab':
            className = 'bg-purple-100 text-purple-800';
            label = '实验室';
            break;
          default:
            className = 'bg-gray-100 text-gray-800';
            label = type;
        }

        return (
          <span className={`text-xs px-2 py-0.5 rounded-full ${className}`}>
            {label}
          </span>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <p className="text-sm text-gray-600">{text}</p>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StationSubPath) => {
        const override = getOverrideForSubPath(record.id);
        const isDisabledByOverride = override?.isDisabled ?? !record.defaultEnabled; // 默认启用，所以 isDisabled 默认是 false

        // 计算复选框禁用状态
        const checkboxDisabled = !record.canBeDisabled || isStationSubPathsGloballyDisabled;

        // 计算复选框选中状态
        let checkboxChecked: boolean;
        if (!record.canBeDisabled) {
          checkboxChecked = false; // 不可禁用的子路径，复选框始终不选中（表示启用）
        } else {
          checkboxChecked = isStationSubPathsGloballyDisabled || isDisabledByOverride;
        }

        // 确定显示的文本
        let statusText = '';
        if (!record.canBeDisabled) {
          statusText = '固定启用';
        } else if (isStationSubPathsGloballyDisabled) {
          statusText = '全局禁用';
        } else if (isDisabledByOverride) {
          statusText = '已禁用';
        } else {
          statusText = '已启用';
        }

        return (
          <Checkbox
            checked={checkboxChecked}
            disabled={checkboxDisabled}
            onChange={(e) => handleRegularReworkToggle(record.id, e.target.checked)}
          >
            {statusText}
          </Checkbox>
        );
      },
    },
  ];

  // 特殊抽样子路径表格列定义
  const specialSamplingColumns = [
    {
      title: '子路径名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: StationSubPath) => (
        <span className="font-medium">{text}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: () => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
          特殊抽样
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <p className="text-sm text-gray-600">{text}</p>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StationSubPath) => {
        const override = getOverrideForSubPath(record.id);
        const isEnabledByOverride = override?.isEnabled ?? record.defaultEnabled;

        const checkboxDisabled = false;
        const checkboxChecked = isEnabledByOverride;

        let statusText = '';
        if (isEnabledByOverride) {
          statusText = '已启用';
        } else {
          statusText = '已禁用';
        }

        return (
          <Checkbox
            checked={checkboxChecked}
            disabled={checkboxDisabled}
            onChange={(e) => handleSpecialSamplingToggle(record.id, e.target.checked)}
          >
            {statusText}
          </Checkbox>
        );
      },
    },
  ];

  if (!isOpen || !station) return null;

  const regularReworkLabSubPaths = getRegularReworkLabSubPaths();
  const specialSamplingSubPaths = getSpecialSamplingSubPaths();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">子路径配置</h2>
            <p className="text-sm text-gray-600 mt-1">
              站点: {station.stationName} ({station.stationCode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {station.associatedSubPaths.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              该站点没有可配置的子路径
            </div>
          ) : (
            <div>
              <Tabs
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                className="station-subpath-tabs"
              >
                <TabPane
                  tab={`常规/返工子路径 (${regularReworkLabSubPaths.length})`} // 修改标题
                  key="regular"
                >
                  <>
                    <div className="mb-4">
                      <Checkbox
                        checked={isStationSubPathsGloballyDisabled}
                        onChange={(e) => handleGlobalDisableToggle(e.target.checked)}
                      >
                        <span className="font-medium">禁用所有子路径</span>
                      </Checkbox>
                    </div>

                    {regularReworkLabSubPaths.length > 0 ? (
                      <Table
                        dataSource={regularReworkLabSubPaths}
                        columns={regularReworkLabColumns}
                        rowKey="id"
                        pagination={false}
                        size="middle"
                        className="station-subpath-table"
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        没有常规/返工子路径
                      </div>
                    )}
                  </>
                </TabPane>

                <TabPane
                  tab={`特殊抽样路径 (${specialSamplingSubPaths.length})`}
                  key="special"
                >
                  {specialSamplingSubPaths.length > 0 ? (
                    <Table
                      dataSource={specialSamplingSubPaths}
                      columns={specialSamplingColumns}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      className="station-subpath-table"
                      rowClassName={(record) =>
                        `cursor-pointer ${
                          selectedSpecialSamplingSubPathId === record.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                        }`
                      }
                      onRow={(record) => {
                        return {
                          onClick: () => {
                            const override = getOverrideForSubPath(record.id);
                            if (override?.isEnabled && override?.configuredStations) {
                              handleSelectSpecialSamplingSubPath(record, override);
                            } else {
                              // 如果未启用或未配置，则清除选中状态
                              setSelectedSpecialSamplingSubPathId(null);
                              setEditingSubPathStations(null);
                            }
                          },
                        };
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      没有特殊抽样子路径
                    </div>
                  )}
                  {/* Conditional rendering for the station config */}
  {editingSubPathStations ? (
    <div className="mt-8 border-t pt-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          子路径站点配置 - {editingSubPathStations.subPath.name}
        </h3>
      </div>
      <MainProcessStationConfig
        stations={editingSubPathStations.stations}
        isReadOnly={false}
        showDeviationButton={false}
        hideSubPathConfigColumn={true}
        onUpdateStationField={handleUpdateStationField}
        onOpenParameterModal={() => console.log('打开参数模态框')}
        onOpenRemarksModal={() => console.log('打开备注模态框')}
        onConfigureSubPaths={() => {}}
        onConfigureDeviation={() => {}}
        productStationSubPathOverrides={localOverrides}
        equipmentGroups={equipmentGroups} // 传递
        equipmentList={equipmentList}     // 传递
        parameterGroups={parameterGroups} // 传递
      />
    </div>
  ) : (
                    <div className="text-center py-8 text-gray-500 mt-8 border-t pt-6">
                      <p className="text-sm">请选择一个已启用的特殊抽样路径进行配置。</p>
                    </div>
                  )}
                </TabPane>
              </Tabs>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationSubPathConfigModal;