// src/components/CutIntoSubpathForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, CornerRightDown } from 'lucide-react';
import { BatchData, SubBatchData, StationConfig, ParameterDetail, StationData } from '../types';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import MainProcessStationConfig from './MainProcessStationConfig';
import ParameterSelectionModal from './ParameterSelectionModal';
import BatchRemarksEditor from './BatchRemarksEditor';

// 导入模拟数据
import {
  mockReworkPaths,
  mockReturnStations,
  mockEquipmentGroups,
  mockRecipes
} from '../data/reworkPaths';
import {
  mockMeasurementParameters,
  mockProcessParameters,
  mockSpcParameters
} from '../data/mockParameters';
import { useBatchOperations } from '../contexts/BatchOperationsContext';
import { batchApiService } from '../services/batchApiService';

interface CutIntoSubpathFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
}

const CutIntoSubpathForm: React.FC<CutIntoSubpathFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
}) => {
  const { fetchStations, fetchBatches } = useBatchOperations();
  const [allStations, setAllStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [productMainPathStations, setProductMainPathStations] = useState<StationData[]>([]);

  const [selectedReworkPathId, setSelectedReworkPathId] = useState<string>('');
  const [configuredStations, setConfiguredStations] = useState<StationConfig[]>([]);
  const [selectedReturnStationCode, setSelectedReturnStationCode] = useState<string>('');

  // 参数模态框状态
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
  const [currentEditingStationId, setCurrentEditingStationId] = useState<string | null>(null);
  const [currentParameterType, setCurrentParameterType] = useState<'measurement' | 'process' | 'spc' | null>(null);

  // 备注模态框状态
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [currentRemarksStationId, setCurrentRemarksStationId] = useState<string | null>(null);
  const [editingStationRemarks, setEditingStationRemarks] = useState<string[]>([]);

  // 获取所有站点数据
  useEffect(() => {
    const loadStations = async () => {
      if (!selectedBatch) return;
      
      setLoading(true);
      try {
        const stations = await fetchStations();
        setAllStations(stations);
        
        // 根据产品代码过滤获取该产品的主路径站点
        const productStations = stations.filter(station => 
          station.productCodes && station.productCodes.includes(selectedBatch.productCode)
        );
        setProductMainPathStations(productStations);
      } catch (error) {
        console.error('Error loading stations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStations();
  }, [selectedBatch, fetchStations]);

  // 获取选中的返工路径
  const selectedReworkPath = useMemo(() => {
    return mockReworkPaths.find(path => path.id === selectedReworkPathId) || null;
  }, [selectedReworkPathId]);

  // 筛选回流站点，只显示当前批次产品料号关联的主路径中的站点
  const filteredReturnStations = useMemo(() => {
    if (!selectedBatch || productMainPathStations.length === 0) return [];
    
    return productMainPathStations.map(station => ({
      code: station.code,
      name: station.name,
      description: station.description || ''
    }));
  }, [selectedBatch, productMainPathStations]);

  // 处理返工路径选择
  const handleReworkPathSelect = (pathId: string) => {
    setSelectedReworkPathId(pathId);
    const selectedPath = mockReworkPaths.find(path => path.id === pathId);
    if (selectedPath) {
      // 深拷贝站点配置，以便本地修改
      setConfiguredStations(JSON.parse(JSON.stringify(selectedPath.stations)));
    } else {
      setConfiguredStations([]);
    }
  };

  // 处理站点字段更新
  const handleUpdateStationField = (stationId: string, field: keyof StationConfig, value: any) => {
    setConfiguredStations(prev => 
      prev.map(station => 
        station.id === stationId ? { ...station, [field]: value } : station
      )
    );
  };

  // 打开参数模态框
  const handleOpenParameterModal = (stationId: string, parameterType: 'measurement' | 'process' | 'spc') => {
    setCurrentEditingStationId(stationId);
    setCurrentParameterType(parameterType);
    setIsParameterModalOpen(true);
  };

  // 打开备注模态框
  const handleOpenRemarksModal = (stationId: string) => {
    const station = configuredStations.find(s => s.id === stationId);
    setEditingStationRemarks(station?.remarks || []);
    setCurrentRemarksStationId(stationId);
    setIsRemarksModalOpen(true);
  };

  // 配置偏离（占位实现）
  const handleConfigureDeviation = (station: StationConfig) => {
    alert(`配置偏离 - 站点: ${station.stationName}`);
    // 这里可以实现实际的偏离配置逻辑
  };

  // 保存参数
  const handleSaveParameters = (savedParameters: ParameterDetail[]) => {
    if (currentEditingStationId && currentParameterType) {
      setConfiguredStations(prev =>
        prev.map(station =>
          station.id === currentEditingStationId
            ? { ...station, [`${currentParameterType}Parameters`]: savedParameters }
            : station
        )
      );
    }
    setIsParameterModalOpen(false);
    setCurrentEditingStationId(null);
    setCurrentParameterType(null);
  };

  // 保存备注
  const handleSaveRemarks = (savedRemarks: string[]) => {
    if (currentRemarksStationId) {
      setConfiguredStations(prev =>
        prev.map(station =>
          station.id === currentRemarksStationId
            ? { ...station, remarks: savedRemarks }
            : station
        )
      );
    }
    setIsRemarksModalOpen(false);
    setCurrentRemarksStationId(null);
  };

  // 获取当前编辑站点的参数数据
  const getCurrentStationParameters = () => {
    if (!currentEditingStationId || !currentParameterType) {
      return { parameters: [], selectedParameters: [] };
    }

    const station = configuredStations.find(s => s.id === currentEditingStationId);
    const selectedParameters = station ? station[`${currentParameterType}Parameters`] || [] : [];

    // 根据参数类型获取对应的全局参数列表
    let parameters: ParameterDetail[] = [];
    switch (currentParameterType) {
      case 'measurement':
        parameters = mockMeasurementParameters;
        break;
      case 'process':
        parameters = mockProcessParameters;
        break;
      case 'spc':
        parameters = mockSpcParameters;
        break;
    }

    return { parameters, selectedParameters: selectedParameters as ParameterDetail[] };
  };

  // 获取参数模态框标题
  const getParameterModalTitle = () => {
    if (!currentEditingStationId || !currentParameterType) {
      return '参数选择';
    }

    const station = configuredStations.find(s => s.id === currentEditingStationId);
    const stationName = station?.stationName || '未知站点';
    
    const typeMap = {
      measurement: '量测',
      process: '工艺',
      spc: 'SPC'
    };

    return `${stationName} - ${typeMap[currentParameterType]}参数选择`;
  };

  // 处理确认切入子路径操作
  const handleConfirmCutIntoSubpath = async () => {
    if (!selectedBatch || !selectedReworkPathId || !selectedReturnStationCode) {
      alert('请选择返工路径和回流站点');
      return;
    }
    const firstStation = selectedReworkPath?.stations[0];
    if (!firstStation) {
      alert('所选返工路径没有配置任何站点，无法切入');
      return;
    }

    try {
      await batchApiService.confirmCutIntoSubpath(selectedBatch.id, {
        reworkPathId: selectedReworkPathId,
        reworkFirstStationCode: firstStation.stationCode,
        reworkFirstStationName: firstStation.stationName,
        returnStationCode: selectedReturnStationCode,
        operator: '当前操作人',
      });
      await fetchBatches();
      handleBackToBatchList();
    } catch (err: any) {
      console.error('Error confirming cut into subpath:', err.message);
      alert(`切入子路径失败：${err.message}`);
    }
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载站点数据...</p>
        </div>
      </div>
    );
  }

  if (!selectedBatch) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">未选择批次</p>
          <button
            onClick={handleBackToBatchList}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            返回批次列表
          </button>
        </div>
      </div>
    );
  }

  const { parameters, selectedParameters } = getCurrentStationParameters();

  return (
    <>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* 设备&站点 Section */}
            <EquipmentStationInfo selectedBatch={selectedBatch} />

            {/* 批次信息 Section */}
            <BatchInfoDisplay
              selectedBatch={selectedBatch}
              getSubBatchesForMaster={getSubBatchesForMaster}
              getStatusColor={getStatusColor}
              subBatches={displayedFormSubBatches}
            />

            {/* 返工路径选择 Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">返工路径选择</h2>
              
              {/* 返工路径选择器 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  返工路径 *
                </label>
                <select
                  value={selectedReworkPathId}
                  onChange={(e) => handleReworkPathSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">请选择返工路径</option>
                  {mockReworkPaths.map((path) => (
                    <option key={path.id} value={path.id}>
                      {path.name} {path.description && `- ${path.description}`}
                    </option>
                  ))}
                </select>
                {selectedReworkPath && selectedReworkPath.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedReworkPath.description}
                  </p>
                )}
              </div>

              {/* 返工路径站点配置 */}
              {selectedReworkPath && configuredStations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-800 mb-3">子路径工艺卡控</h3>
                  <div className="border border-gray-200 rounded">
                    <MainProcessStationConfig
                      stations={configuredStations}
                      isReadOnly={false}
                      onUpdateStationField={handleUpdateStationField}
                      onOpenParameterModal={handleOpenParameterModal}
                      onOpenRemarksModal={handleOpenRemarksModal}
                      onConfigureDeviation={handleConfigureDeviation}
                      mockEquipmentGroups={mockEquipmentGroups}
                      mockRecipes={mockRecipes}
                      showDeviationButton={false}
                    />
                  </div>
                </div>
              )}

              {/* 回流站点选择 */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回流站点 *
                </label>
                <select
                  value={selectedReturnStationCode}
                  onChange={(e) => setSelectedReturnStationCode(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">请选择返工结束后切回主路径的站点</option>
                  {filteredReturnStations.map((station) => (
                    <option key={station.code} value={station.code}>
                      {station.name} ({station.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 操作说明 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">操作说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 切入子路径操作将当前批次从主工艺路径切换到返工路径</li>
                <li>• 请选择返工路径并配置各站点的工艺参数</li>
                <li>• 返工结束后，批次将切回到指定的回流站点继续主路径加工</li>
                <li>• 配置完成后，请点击"确认切入"按钮</li>
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                onClick={handleBackToBatchList}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCutIntoSubpath}
                disabled={!selectedReworkPathId || !selectedReturnStationCode}
                className={`px-6 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  selectedReworkPathId && selectedReturnStationCode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                确认切入
              </button>
            </div>
          </div>
        </div>

      {/* 参数选择模态框 */}
      <ParameterSelectionModal
        isOpen={isParameterModalOpen}
        onClose={() => {
          setIsParameterModalOpen(false);
          setCurrentEditingStationId(null);
          setCurrentParameterType(null);
        }}
        onSave={handleSaveParameters}
        title={getParameterModalTitle()}
        parameters={parameters}
        selectedParameters={selectedParameters}
      />

      {/* 站点备注编辑模态框 */}
      {isRemarksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">编辑站点备注</h3>
              <button
                onClick={() => {
                  setIsRemarksModalOpen(false);
                  setCurrentRemarksStationId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="px-6 py-4">
              <BatchRemarksEditor
                remarks={editingStationRemarks}
                onRemarksChange={setEditingStationRemarks}
              />
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsRemarksModalOpen(false);
                  setCurrentRemarksStationId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleSaveRemarks(editingStationRemarks);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CutIntoSubpathForm;