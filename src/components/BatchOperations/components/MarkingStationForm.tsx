// src/components/MarkingStationForm.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Tag, Check } from 'lucide-react';
import { BatchData, SubBatchData, WaferData, CarrierData, InspectionParameter } from '../types';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import ProcessParameters from './ProcessParameters';
import { getStationParameterDefinitions, determineWaferType, determineDisposition, determineGrade } from '../utils/inspectionHelpers';
import { batchApiService } from '../services/batchApiService';

interface MarkingStationFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>; // 变为异步
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
}

const MarkingStationForm: React.FC<MarkingStationFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
}) => {
  // State for selected carrier and its wafers
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [wafersInCurrentCarrier, setWafersInCurrentCarrier] = useState<WaferData[]>([]);
  const [selectedWaferIds, setSelectedWaferIds] = useState<string[]>([]); // 用于批量选择晶圆片，类型改为 string
  const [isLoadingWafers, setIsLoadingWafers] = useState<boolean>(false);

  // Derived state for carriers from displayedFormSubBatches
  const carriers: CarrierData[] = useMemo(() => {
    if (!displayedFormSubBatches) return [];
    return displayedFormSubBatches.map(subBatch => ({
      id: subBatch.carrierId,
      sublotId: subBatch.sublotId,
      goodQty: subBatch.goodQty,
      defectQty: subBatch.defectQty,
    }));
  }, [displayedFormSubBatches]);

  // Effect to set initial selected carrier and wafers
  useEffect(() => {
    if (carriers.length > 0 && !selectedCarrierId) {
      setSelectedCarrierId(carriers[0].id);
    }
  }, [carriers, selectedCarrierId]);

  // 从数据库获取晶圆数据的函数
  const fetchWafersForSubBatches = useCallback(async (subBatchUUIDs: string[], batchId: string): Promise<WaferData[]> => { // 接收 subBatchUUIDs
    if (subBatchUUIDs.length === 0 || !batchId) {
      console.warn('没有提供子批次代码或批次ID');
      return [];
    }

    try {
      const wafers = await batchApiService.getWaferCarrierContents(subBatchUUIDs, batchId);
      return wafers;
    } catch (err: any) {
      console.error('获取晶圆数据时发生错误:', err.message);
      return [];
    }
  }, [selectedBatch?.station, selectedBatch?.ingotId]);

  // Effect to load wafers for the selected carrier
  useEffect(() => {
    const loadWafersForCarrier = async () => {
      if (!selectedCarrierId || !selectedBatch || displayedFormSubBatches.length === 0) {
        setWafersInCurrentCarrier([]);
        return;
      }

      // 找到当前选中的片篮对应的子批次
      const currentSubBatch = displayedFormSubBatches.find(subBatch => subBatch.carrierId === selectedCarrierId);
      if (!currentSubBatch) {
        console.warn('未找到当前片篮对应的子批次');
        setWafersInCurrentCarrier([]);
        return;
      }

      setIsLoadingWafers(true);
      try {
        // 从数据库获取当前子批次的晶圆数据
        const fetchedWafers = await fetchWafersForSubBatches([currentSubBatch.id], selectedBatch.id); // 传递子批次UUID
        
        // 过滤出当前片篮的晶圆片
        const filteredWafers = fetchedWafers.filter(wafer => wafer.carrierId === selectedCarrierId);
        
        setWafersInCurrentCarrier(filteredWafers);
        setSelectedWaferIds([]); // Reset selected wafers when carrier changes
      } catch (error) {
        console.error('加载晶圆数据失败:', error);
        setWafersInCurrentCarrier([]);
      } finally {
        setIsLoadingWafers(false);
      }
    };

    loadWafersForCarrier();
  }, [selectedCarrierId, selectedBatch, displayedFormSubBatches, fetchWafersForSubBatches]);

  // Marking rule simulation
  const generateMarkingCodeLogic = (productCode: string, waferId: string): string => {
    // Simple rule: ProductCode-WaferID-Timestamp (last 4 digits)
    const timestampSuffix = Date.now().toString().slice(-4);
    return `${productCode}-${waferId}-${timestampSuffix}`;
  };

  // Handlers
  const handleCarrierSelect = (carrierId: string) => {
    setSelectedCarrierId(carrierId);
  };

  // 处理单个晶圆片复选框选择 (用于批量操作)
  const handleWaferCheckboxSelect = (waferId: string) => { // waferId 类型改为 string
    setSelectedWaferIds(prev =>
      prev.includes(waferId)
        ? prev.filter(id => id !== waferId)
        : [...prev, id]
    );
  };

  // 处理单个晶圆片类型变化
  const handleWaferTypeChange = (waferId: string, newType: 'GOOD' | 'REJECT' | 'LOSS' | 'Select') => { // waferId 类型改为 string
    setWafersInCurrentCarrier(prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, type: newType }
          : wafer
      )
    );
  };

  // 批量操作处理函数
  const handleBatchTypeChange = (newType: 'GOOD' | 'REJECT' | 'LOSS') => {
    setWafersInCurrentCarrier(prev =>
      prev.map(wafer =>
        selectedWaferIds.includes(wafer.id)
          ? { ...wafer, type: newType }
          : wafer
      )
    );
    setSelectedWaferIds([]); // 清空批量选择
  };

  // 处理打标码输入框的变更
  const handleMarkingCodeChange = (waferId: string, newCode: string) => { // waferId 类型改为 string
    setWafersInCurrentCarrier(prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, markingCode: newCode }
          : wafer
      )
    );
  };

  // 生成打标码
  const handleGenerateMarkingCode = () => {
    if (selectedWaferIds.length !== 1 || !selectedBatch) {
      alert('请选择且仅选择一个晶圆片进行打标码生成。');
      return;
    }
    const selectedWaferId = selectedWaferIds[0];
    const selectedWafer = wafersInCurrentCarrier.find(w => w.id === selectedWaferId);
    if (selectedWafer && selectedBatch.productCode) {
      const code = generateMarkingCodeLogic(selectedBatch.productCode, selectedWafer.waferId);
      setWafersInCurrentCarrier(prev =>
        prev.map(w =>
          w.id === selectedWaferId
            ? { ...w, markingCode: code, markingStatus: '已生成码' } // 更新晶圆片列表中的打标码和状态
            : w
        )
      );
    }
  };

  // 确认打标
  const handleConfirmMarking = async () => {
    if (selectedWaferIds.length !== 1) {
      alert('请选择且仅选择一个晶圆片进行确认打标操作。');
      return;
    }
    const selectedWaferId = selectedWaferIds[0];
    const selectedWafer = wafersInCurrentCarrier.find(w => w.id === selectedWaferId);
    if (!selectedWafer || !selectedWafer.markingCode) {
      alert('请先生成或输入打标码。');
      return;
    }

    try {
      await batchApiService.updateWaferMarking(
        selectedWafer.id,
        selectedWafer.markingCode!,
        '已完成'
      );

      // 模拟设备打标操作
      console.log(`模拟设备打标: Wafer ID: ${selectedWafer.waferId}, Marking Code: ${selectedWafer.markingCode}`);

      // 更新本地状态
      setWafersInCurrentCarrier(prev =>
        prev.map(w =>
          w.id === selectedWaferId
            ? { ...w, markingStatus: '已完成' } // 仅更新状态，打标码已在 wafer 对象中
            : w
        )
      );
      setSelectedWaferIds([]); // 清空选中状态
      alert(`晶圆片 ${selectedWafer.waferId} 打标完成！`);
    } catch (error) {
      console.error('确认打标时出错:', error);
      alert('确认打标失败，请重试。');
    }
  };

  // 获取打标状态的颜色
  const getMarkingStatusColor = (status: WaferData['markingStatus']) => {
    switch (status) {
      case '待打标': return 'text-gray-600 bg-gray-100';
      case '已生成码': return 'text-blue-600 bg-blue-100';
      case '已确认': return 'text-green-600 bg-green-100'; // Not explicitly used but good to have
      case '已完成': return 'text-purple-600 bg-purple-100';
      case '跳过': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 计算 "生成打标码" 按钮的禁用状态
  const isGenerateMarkingCodeButtonDisabled = useMemo(() => {
    if (selectedWaferIds.length !== 1) {
      return true; // 必须且只能选中一个晶圆片
    }
    const selectedWafer = wafersInCurrentCarrier.find(w => w.id === selectedWaferIds[0]);
    // 只有当晶圆片状态为"待打标"且类型为"GOOD"时才启用
    return (
      !selectedWafer || // Should not happen if length is 1, but good for type safety
      selectedWafer.markingStatus !== '待打标' ||
      selectedWafer.type !== 'GOOD'
    );
  }, [selectedWaferIds, wafersInCurrentCarrier]);

  // 计算 "确认打标" 按钮的禁用状态
  const isConfirmMarkingButtonDisabled = useMemo(() => {
    if (selectedWaferIds.length !== 1) {
      return true; // 必须且只能选中一个晶圆片
    }
    const selectedWafer = wafersInCurrentCarrier.find(w => w.id === selectedWaferIds[0]);
    // 只有当晶圆片状态为"已生成码"且有打标码时才启用
    return (
      !selectedWafer || // Should not happen if length is 1
      selectedWafer.markingStatus !== '已生成码' ||
      !selectedWafer.markingCode // 检查 wafer 对象中的 markingCode
    );
  }, [selectedWaferIds, wafersInCurrentCarrier]);

  // Callback for when a parameter changes in ProcessParameters
  const handleParameterChange = useCallback((waferId: string, paramName: string, newValue: number) => { // waferId 类型改为 string
    setWafersInCurrentCarrier(prevWafers => {
      const updatedWafers = prevWafers.map(wafer => {
        if (wafer.id === waferId) {
          const updatedParams = wafer.inspectionParameters?.map(param =>
            param.name === paramName ? { ...param, value: newValue } : param
          ) || [];

          // Re-evaluate type, disposition, grade based on new parameters
          const newType = determineWaferType(updatedParams);
          const newDisposition = determineDisposition(newType, updatedParams);
          const newGrade = determineGrade(selectedBatch?.station || '', updatedParams);

          return {
            ...wafer,
            inspectionParameters: updatedParams,
            type: newType,
            disposition: newDisposition,
            grade: newGrade,
            inspectionStatus: '已检验', // Mark as inspected after manual change
          };
        }
        return wafer;
      });
      return updatedWafers;
    });
  }, [selectedBatch]);

  // Callback for when auto-fill is requested in ProcessParameters
  const handleAutoFillParameter = useCallback((waferId: string, paramName: string) => { // waferId 类型改为 string
    setWafersInCurrentCarrier(prevWafers => {
      const updatedWafers = prevWafers.map(wafer => {
        if (wafer.id === waferId) {
          const updatedParams = wafer.inspectionParameters?.map(param => {
            if (param.name === paramName) {
              // Simulate EAP auto-fill with a random value within a reasonable range
              let autoValue: number;
              if (paramName === '真空度') autoValue = parseFloat((Math.random() * (100 - 10) + 10).toFixed(2));
              else if (paramName === '激光功率') autoValue = parseFloat((Math.random() * (20 - 5) + 5).toFixed(2));
              else if (paramName === '电流大小') autoValue = parseFloat((Math.random() * (5 - 1) + 1).toFixed(2));
              else autoValue = parseFloat((Math.random() * 100).toFixed(2)); // Default random

              return { ...param, value: autoValue };
            }
            return param;
          }) || [];

          // Re-evaluate type, disposition, grade based on new parameters
          const newType = determineWaferType(updatedParams);
          const newDisposition = determineDisposition(newType, updatedParams);
          const newGrade = determineGrade(selectedBatch?.station || '', updatedParams);

          return {
            ...wafer,
            inspectionParameters: updatedParams,
            type: newType,
            disposition: newDisposition,
            grade: newGrade,
            inspectionStatus: '已检验', // Mark as inspected after auto-fill
          };
        }
        return wafer;
      });
      return updatedWafers;
    });
  }, [selectedBatch]);

  // Callback for when ProcessParameters component updates wafers
  const handleWafersUpdate = useCallback((updatedWafers: WaferData[]) => {
    setWafersInCurrentCarrier(updatedWafers);
  }, []);


  if (!selectedBatch) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-500">请先选择一个批次进行打标操作。</p>
      </div>
    );
  }

  return (
    <>
        <div className="bg-white rounded-lg shadow-sm mb-4">
          {/* 设备&站点 Section */}
          <EquipmentStationInfo selectedBatch={selectedBatch} />

          {/* 批次信息 Section */}
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />

          {/* 制程参数模块 - 仅在打标站点显示 */}
          {selectedBatch.station === 'markingStation' && (
            <ProcessParameters // 替换为 ProcessParameters
              wafers={wafersInCurrentCarrier}
              station={selectedBatch.station}
              onParameterChange={handleParameterChange}
              onAutoFillParameter={handleAutoFillParameter}
              onWafersUpdate={handleWafersUpdate}
            />
          )}

          {/* Marking Station Core UI */}
          <div className="p-6 grid grid-cols-3 gap-6">
            {/* Left: Carriers List - 占据 1/3 宽度 */}
            <div className="col-span-1">
              <h2 className="text-base font-medium mb-4 text-gray-700">片篮列表</h2>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="py-2 px-4 text-left text-gray-700 font-medium">片篮ID</th>
                        <th className="py-2 px-4 text-left text-gray-700 font-medium">Sublot ID</th>
                        <th className="py-2 px-4 text-center text-gray-700 font-medium">良品</th>
                        <th className="py-2 px-4 text-center text-gray-700 font-medium">不良</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carriers.length > 0 ? (
                        carriers.map((carrier) => (
                          <tr
                            key={carrier.id}
                            className={`cursor-pointer hover:bg-blue-50 ${selectedCarrierId === carrier.id ? 'bg-blue-50' : ''}`}
                            onClick={() => handleCarrierSelect(carrier.id)}
                          >
                            <td className="py-2 px-4">{carrier.id}</td>
                            <td className="py-2 px-4">{carrier.sublotId}</td>
                            <td className="py-2 px-4 text-center">{carrier.goodQty}</td>
                            <td className="py-2 px-4 text-center">{carrier.defectQty}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            无片篮数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Wafer Details & Marking Controls - 占据 2/3 宽度 */}
            <div className="col-span-2">
              {/* 晶圆片详情列表上方的操作按钮区域 */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-medium text-gray-700">晶圆片详情</h2>
                <div className="flex space-x-2">
                  {/* 确认打标按钮 */}
                  <button
                    onClick={handleConfirmMarking}
                    disabled={isConfirmMarkingButtonDisabled}
                    className={`inline-flex items-center px-3 py-1 rounded-md shadow-sm text-sm font-medium ${
                      isConfirmMarkingButtonDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    确认打标
                  </button>
                  {/* 生成打标码按钮 */}
                  <button
                    onClick={handleGenerateMarkingCode}
                    disabled={isGenerateMarkingCodeButtonDisabled}
                    className={`inline-flex items-center px-3 py-1 rounded-md shadow-sm text-sm font-medium ${
                      isGenerateMarkingCodeButtonDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    生成打标码
                  </button>
                  {/* 批量操作按钮 - 样式差异化 */}
                  <button
                    className={`px-3 py-1 rounded text-sm ${
                      selectedWaferIds.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-200 text-green-700 hover:bg-green-300'
                    }`}
                    onClick={() => handleBatchTypeChange('GOOD')}
                    disabled={selectedWaferIds.length === 0}
                  >
                    批量良好
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${
                      selectedWaferIds.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300'
                    }`}
                    onClick={() => handleBatchTypeChange('REJECT')}
                    disabled={selectedWaferIds.length === 0}
                  >
                    批量不良
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${
                      selectedWaferIds.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-200 text-red-700 hover:bg-red-300'
                    }`}
                    onClick={() => handleBatchTypeChange('LOSS')}
                    disabled={selectedWaferIds.length === 0}
                  >
                    批量Loss
                  </button>
                </div>
              </div>

              {/* 晶圆片详情列表 */}
              <div className="border rounded-lg">
                <div className="bg-gray-100 px-3 py-2 text-sm font-medium border-b flex items-center">
                  <input type="checkbox" className="mr-2" /> {/* 全选复选框，待实现 */}
                  <span className="w-16">槽位号</span>
                  <span className="w-36 ml-4">片号</span>
                  <span className="w-32 ml-4">类型</span>
                  <span className="w-32 ml-4">打标状态</span>
                  <span className="w-52 ml-4">打标码</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {isLoadingWafers ? (
                    <div className="px-6 py-4 text-center text-gray-500">
                      正在加载晶圆数据...
                    </div>
                  ) : wafersInCurrentCarrier.length > 0 ? (
                    wafersInCurrentCarrier.map((wafer) => (
                      <div
                        key={wafer.id}
                        className={`flex items-center px-3 py-2 border-b text-sm hover:bg-gray-50`} // 移除 cursor-pointer 和 onClick
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedWaferIds.includes(wafer.id)}
                          onChange={() => handleWaferCheckboxSelect(wafer.id)}
                          onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到行点击
                        />
                        <span className="w-16">{String(wafer.slotNo).padStart(2, '0')}</span>
                        <span className="w-36 ml-4">{wafer.waferId}</span>
                        <select
                          className="w-32 text-xs border rounded px-1 py-1 ml-4"
                          value={wafer.type}
                          onChange={(e) => handleWaferTypeChange(wafer.id, e.target.value as 'GOOD' | 'REJECT' | 'LOSS' | 'Select')}
                          onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到行点击
                        >
                          <option value="GOOD">GOOD</option>
                          <option value="REJECT">REJECT</option>
                          <option value="LOSS">LOSS</option>
                        </select>
                        <span className={`w-32 inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-4 ${getMarkingStatusColor(wafer.markingStatus)}`}>
                          {wafer.markingStatus}
                        </span>
                        {/* 将打标码显示从 span 更改为 input */}
                        <input
                          type="text"
                          value={wafer.markingCode || ''}
                          onChange={(e) => handleMarkingCodeChange(wafer.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到行点击
                          disabled={wafer.markingStatus !== '已生成码'} // 只有在"已生成码"状态下才可编辑
                          className={`w-52 text-xs border rounded px-1 py-1 ml-4 ${wafer.markingStatus !== '已生成码' ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                          placeholder="打标码"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-500">
                      请选择一个片篮查看晶圆片详情
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default MarkingStationForm;
