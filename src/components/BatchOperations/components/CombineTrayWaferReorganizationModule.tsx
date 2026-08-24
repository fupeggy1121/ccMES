// src/components/CombineTrayWaferReorganizationModule.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown, Plus, Trash2, ChevronRight } from 'lucide-react';
import { CarrierData, WaferData, TargetCarrier } from '../types';

interface CombineTrayWaferReorganizationModuleProps {
  initialSourceCarriers: CarrierData[];
  onConfirmCombine: (combinedWafers: WaferData[], combinedCarriers: TargetCarrier[]) => void;
}

const CombineTrayWaferReorganizationModule: React.FC<CombineTrayWaferReorganizationModuleProps> = ({
  initialSourceCarriers,
  onConfirmCombine,
}) => {
  // 使用 useRef 创建持久的计数器
  const combinedCarrierCounter = useRef(1);
  
  // 状态管理
  const [sourceCarriers, setSourceCarriers] = useState<CarrierData[]>(initialSourceCarriers);
  const [allSourceWafers, setAllSourceWafers] = useState<WaferData[]>([]);
  const [selectedSourceCarrierId, setSelectedSourceCarrierId] = useState<string>('');
  const [displayedSourceWafers, setDisplayedSourceWafers] = useState<WaferData[]>([]);
  const [combinedTrayCarriers, setCombinedTrayCarriers] = useState<TargetCarrier[]>([
    { id: 'COMBINED-001', goodQty: 0, defectQty: 0 }
  ]);
  const [combinedTrayWafers, setCombinedTrayWafers] = useState<WaferData[]>([]);
  const [selectedCombinedTrayId, setSelectedCombinedTrayId] = useState<string>('');
  
  // 新增状态：源片篮选中状态
  const [selectedSourceCarrierCheckboxes, setSelectedSourceCarrierCheckboxes] = useState<string[]>([]);
  
  // 新增状态：源Wafer选中状态
  const [selectedSourceWafers, setSelectedSourceWafers] = useState<number[]>([]);

  // 辅助函数：为单个载具生成晶圆数据
  const generateWafersForSingleCarrier = (carrier: CarrierData, startId: number): { wafers: WaferData[], nextId: number } => {
    const wafers: WaferData[] = [];
    let waferCounter = startId;
    const masterBatchCode = carrier.masterBatchCode || 'UNKNOWN';
    const sublotSuffix = carrier.sublotId.slice(-6);

    // 生成良品晶圆
    for (let i = 0; i < carrier.goodQty; i++) {
      wafers.push({
        id: waferCounter,
        slotNo: i + 1,
        type: 'GOOD',
        waferId: `W-${masterBatchCode}-${sublotSuffix}-${String(i + 1).padStart(3, '0')}`,
        sublotId: carrier.sublotId,
        carrierId: carrier.id,
        markingStatus: '已完成',
        inspectionStatus: '已检验',
        disposition: 'NONE',
        grade: 'A级',
        inspectionParameters: [],
      });
      waferCounter++;
    }

    // 生成不良品晶圆
    for (let i = 0; i < carrier.defectQty; i++) {
      wafers.push({
        id: waferCounter,
        slotNo: carrier.goodQty + i + 1,
        type: 'REJECT',
        waferId: `W-${masterBatchCode}-${sublotSuffix}-${String(carrier.goodQty + i + 1).padStart(3, '0')}`,
        sublotId: carrier.sublotId,
        carrierId: carrier.id,
        markingStatus: '已完成',
        inspectionStatus: '已检验',
        disposition: 'HOLD',
        grade: '-',
        inspectionParameters: [],
      });
      waferCounter++;
    }

    return { wafers, nextId: waferCounter };
  };

  // 初始化所有源晶圆数据
  useEffect(() => {
    if (initialSourceCarriers.length > 0) {
      let allWafers: WaferData[] = [];
      let currentId = 1;

      initialSourceCarriers.forEach(carrier => {
        const { wafers, nextId } = generateWafersForSingleCarrier(carrier, currentId);
        allWafers = [...allWafers, ...wafers];
        currentId = nextId;
      });

      setAllSourceWafers(allWafers);
      setSourceCarriers(initialSourceCarriers);
      
      if (!selectedSourceCarrierId) {
        setSelectedSourceCarrierId(initialSourceCarriers[0].id);
      }
    } else {
      setAllSourceWafers([]);
      setSourceCarriers([]);
    }
  }, [initialSourceCarriers]);

  // 监听 combinedTrayCarriers 变化，设置默认选中的并盘片篮
  useEffect(() => {
    if (combinedTrayCarriers.length > 0 && !selectedCombinedTrayId) {
      setSelectedCombinedTrayId(combinedTrayCarriers[0].id);
    }
  }, [combinedTrayCarriers]);

  // 监听选中的源片篮变化，更新显示的源晶圆
  useEffect(() => {
    if (selectedSourceCarrierId && allSourceWafers.length > 0) {
      const wafers = allSourceWafers.filter(wafer => wafer.carrierId === selectedSourceCarrierId);
      setDisplayedSourceWafers(wafers);
      setSelectedSourceWafers([]);
    } else {
      setDisplayedSourceWafers([]);
      setSelectedSourceWafers([]);
    }
  }, [selectedSourceCarrierId, allSourceWafers]);

  // 计算源片篮汇总统计
  const sourceCarrierSummary = useMemo(() => {
    const totalGoodQty = sourceCarriers.reduce((sum, carrier) => sum + carrier.goodQty, 0);
    const totalDefectQty = sourceCarriers.reduce((sum, carrier) => sum + carrier.defectQty, 0);
    return {
      totalGoodQty,
      totalDefectQty,
      totalQty: totalGoodQty + totalDefectQty
    };
  }, [sourceCarriers]);

  // 处理源片篮选择
  const handleSourceCarrierSelect = (carrierId: string) => {
    setSelectedSourceCarrierId(carrierId);
  };

  // 处理源片篮复选框变化
  const handleSourceCarrierCheckboxChange = (carrierId: string) => {
    setSelectedSourceCarrierCheckboxes(prev => 
      prev.includes(carrierId)
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    );
  };

  // 处理全选/全不选源片篮
  const handleSelectAllSourceCarriers = (checked: boolean) => {
    if (checked) {
      setSelectedSourceCarrierCheckboxes(sourceCarriers.map(carrier => carrier.id));
    } else {
      setSelectedSourceCarrierCheckboxes([]);
    }
  };

  // 处理源Wafer选择
  const handleWaferSelect = (waferId: number) => {
    setSelectedSourceWafers(prev => 
      prev.includes(waferId)
        ? prev.filter(id => id !== waferId)
        : [...prev, waferId]
    );
  };

  // 处理全选/全不选源Wafer
  const handleSelectAllSourceWafers = (checked: boolean) => {
    if (checked) {
      setSelectedSourceWafers(displayedSourceWafers.map(wafer => wafer.id));
    } else {
      setSelectedSourceWafers([]);
    }
  };

  // 添加并盘片篮
  const handleAddCombinedTrayCarrier = () => {
    combinedCarrierCounter.current += 1;
    const newCarrierId = `COMBINED-${String(combinedCarrierCounter.current).padStart(3, '0')}`;
    const newCarrier: TargetCarrier = { id: newCarrierId, goodQty: 0, defectQty: 0 };
    setCombinedTrayCarriers(prev => [...prev, newCarrier]);
    setSelectedCombinedTrayId(newCarrierId);
  };

  // 删除并盘片篮
  const handleRemoveCombinedTrayCarrier = (carrierId: string) => {
    // 移除片篮
    setCombinedTrayCarriers(prev => prev.filter(carrier => carrier.id !== carrierId));
    
    // 移除该片篮下的所有晶圆
    setCombinedTrayWafers(prev => prev.filter(wafer => wafer.carrierId !== carrierId));
    
    // 如果删除的是当前选中的片篮，则选中第一个片篮
    if (selectedCombinedTrayId === carrierId && combinedTrayCarriers.length > 1) {
      const remainingCarriers = combinedTrayCarriers.filter(carrier => carrier.id !== carrierId);
      setSelectedCombinedTrayId(remainingCarriers[0].id);
    }
  };

  // 修改并盘片篮ID
  const handleCombinedTrayCarrierIdChange = (oldId: string, newId: string) => {
    // 更新片篮ID
    setCombinedTrayCarriers(prev =>
      prev.map(carrier =>
        carrier.id === oldId ? { ...carrier, id: newId } : carrier
      )
    );

    // 更新晶圆的carrierId
    setCombinedTrayWafers(prev =>
      prev.map(wafer =>
        wafer.carrierId === oldId ? { ...wafer, carrierId: newId } : wafer
      )
    );

    // 如果更新的是当前选中的片篮，则更新选中状态
    if (selectedCombinedTrayId === oldId) {
      setSelectedCombinedTrayId(newId);
    }
  };

  // 更新并盘片篮状态的辅助函数
  const updateCombinedTrayState = (wafersToAdd: WaferData[]) => {
    const MAX_WAFERS_PER_CARRIER = 25;
    const updatedCombinedWafers = [...combinedTrayWafers, ...wafersToAdd];
    const carrierGroups: { [key: string]: WaferData[] } = {};

    // 按片篮分组
    updatedCombinedWafers.forEach(wafer => {
      if (!carrierGroups[wafer.carrierId]) {
        carrierGroups[wafer.carrierId] = [];
      }
      carrierGroups[wafer.carrierId].push(wafer);
    });

    // 重新分配槽位号并统计数量
    const updatedCarriers: TargetCarrier[] = [];
    let currentCarrierIndex = 0;
    const carrierIds = Object.keys(carrierGroups);

    for (const carrierId of carrierIds) {
      const wafersInCarrier = carrierGroups[carrierId];
      
      // 按当前槽位号排序
      wafersInCarrier.sort((a, b) => a.slotNo - b.slotNo);
      
      // 重新分配槽位号
      wafersInCarrier.forEach((wafer, index) => {
        wafer.slotNo = index + 1;
      });

      // 统计良品和不良品数量
      const goodQty = wafersInCarrier.filter(w => w.type === 'GOOD').length;
      const defectQty = wafersInCarrier.filter(w => w.type === 'REJECT').length;

      updatedCarriers.push({ id: carrierId, goodQty, defectQty });

      // 如果当前片篮已满且还有剩余晶圆，创建新片篮
      if (wafersInCarrier.length >= MAX_WAFERS_PER_CARRIER && currentCarrierIndex === carrierIds.length - 1) {
        combinedCarrierCounter.current += 1;
        const newCarrierId = `COMBINED-${String(combinedCarrierCounter.current).padStart(3, '0')}`;
        updatedCarriers.push({ id: newCarrierId, goodQty: 0, defectQty: 0 });
      }

      currentCarrierIndex++;
    }

    // 更新状态
    setCombinedTrayWafers(updatedCombinedWafers);
    setCombinedTrayCarriers(updatedCarriers);

    return updatedCombinedWafers;
  };

  // 整片篮并盘操作
  const handleCombineWafers = () => {
    if (selectedSourceCarrierCheckboxes.length === 0) {
      alert('请选择至少一个源片篮进行并盘！');
      return;
    }

    // 获取选中片篮中的所有晶圆
    const wafersToMove = allSourceWafers.filter(wafer => 
      selectedSourceCarrierCheckboxes.includes(wafer.carrierId)
    );

    if (wafersToMove.length === 0) {
      alert('选中的片篮中没有晶圆！');
      return;
    }

    // 更新并盘状态
    updateCombinedTrayState(wafersToMove);

    // 更新源数据：从 allSourceWafers 中移除已移动的晶圆
    const updatedAllSourceWafers = allSourceWafers.filter(wafer => 
      !selectedSourceCarrierCheckboxes.includes(wafer.carrierId)
    );
    setAllSourceWafers(updatedAllSourceWafers);

    // 更新源片篮：移除已清空的片篮
    const updatedSourceCarriers = sourceCarriers.filter(carrier => 
      !selectedSourceCarrierCheckboxes.includes(carrier.id)
    );
    setSourceCarriers(updatedSourceCarriers);

    // 清空选中状态
    setSelectedSourceCarrierCheckboxes([]);
    if (updatedSourceCarriers.length > 0 && !updatedSourceCarriers.find(c => c.id === selectedSourceCarrierId)) {
      setSelectedSourceCarrierId(updatedSourceCarriers[0].id);
    }

    alert(`成功并盘 ${wafersToMove.length} 个晶圆！`);
  };

  // 部分晶圆并盘操作（右箭头按钮）
  const handleMoveSelectedWafersRight = () => {
    if (selectedSourceWafers.length === 0) {
      alert('请选择至少一个晶圆进行移动！');
      return;
    }

    if (!selectedCombinedTrayId) {
      alert('请选择一个目标片篮！');
      return;
    }

    // 获取选中的晶圆
    const wafersToMove = allSourceWafers.filter(wafer => 
      selectedSourceWafers.includes(wafer.id)
    );

    // 更新晶圆的 carrierId 为目标片篮
    const updatedWafersToMove = wafersToMove.map(wafer => ({
      ...wafer,
      carrierId: selectedCombinedTrayId
    }));

    // 更新并盘状态
    updateCombinedTrayState(updatedWafersToMove);

    // 更新源数据：从 allSourceWafers 中移除已移动的晶圆
    const updatedAllSourceWafers = allSourceWafers.filter(wafer => 
      !selectedSourceWafers.includes(wafer.id)
    );
    setAllSourceWafers(updatedAllSourceWafers);

    // 更新源片篮统计
    const carrierWaferCounts: { [key: string]: { good: number, defect: number } } = {};
    updatedAllSourceWafers.forEach(wafer => {
      if (!carrierWaferCounts[wafer.carrierId]) {
        carrierWaferCounts[wafer.carrierId] = { good: 0, defect: 0 };
      }
      if (wafer.type === 'GOOD') {
        carrierWaferCounts[wafer.carrierId].good += 1;
      } else if (wafer.type === 'REJECT') {
        carrierWaferCounts[wafer.carrierId].defect += 1;
      }
    });

    const updatedSourceCarriers = sourceCarriers.map(carrier => {
      const counts = carrierWaferCounts[carrier.id] || { good: 0, defect: 0 };
      return {
        ...carrier,
        goodQty: counts.good,
        defectQty: counts.defect
      };
    });
    setSourceCarriers(updatedSourceCarriers);

    // 清空选中状态
    setSelectedSourceWafers([]);

    alert(`成功移动 ${wafersToMove.length} 个晶圆到目标片篮！`);
  };

  // 移动晶圆
  const handleMoveWafer = (waferId: number, direction: 'up' | 'down') => {
    const waferIndex = combinedTrayWafers.findIndex(w => w.id === waferId);
    if (waferIndex === -1) return;

    const currentWafer = combinedTrayWafers[waferIndex];
    const targetIndex = direction === 'up' ? waferIndex - 1 : waferIndex + 1;

    // 检查边界
    if (targetIndex < 0 || targetIndex >= combinedTrayWafers.length) return;

    const targetWafer = combinedTrayWafers[targetIndex];

    // 只允许在同一个片篮内移动
    if (currentWafer.carrierId !== targetWafer.carrierId) return;

    // 交换位置
    const newWafers = [...combinedTrayWafers];
    [newWafers[waferIndex], newWafers[targetIndex]] = [newWafers[targetIndex], newWafers[waferIndex]];

    // 重新分配槽位号
    const carrierId = currentWafer.carrierId;
    const carrierWafers = newWafers.filter(w => w.carrierId === carrierId);
    carrierWafers.forEach((wafer, index) => {
      wafer.slotNo = index + 1;
    });

    setCombinedTrayWafers(newWafers);
  };

  // 获取并盘片篮中的晶圆
  const getCombinedTrayWafersForCarrier = (carrierId: string): WaferData[] => {
    return combinedTrayWafers.filter(wafer => wafer.carrierId === carrierId);
  };

  // 获取当前选中的并盘片篮晶圆
  const selectedCombinedTrayWafers = useMemo(() => {
    if (!selectedCombinedTrayId) return [];
    return getCombinedTrayWafersForCarrier(selectedCombinedTrayId);
  }, [selectedCombinedTrayId, combinedTrayWafers]);

  // 确认并盘操作
  const handleConfirmCombine = () => {
    if (combinedTrayWafers.length === 0) {
      alert('没有可确认的并盘晶圆！');
      return;
    }

    onConfirmCombine(combinedTrayWafers, combinedTrayCarriers);
    alert('并盘操作已确认！');
  };

  // 获取晶圆类型颜色
  const getWaferTypeColor = (type: 'GOOD' | 'REJECT' | 'DISCARD' | 'Select'): string => {
    switch (type) {
      case 'GOOD':
        return 'bg-green-100 text-green-800';
      case 'REJECT':
        return 'bg-red-100 text-red-800';
      case 'DISCARD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 p-6">
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧主要部分：源批次明细 */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-4">并盘批次明细</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 左侧第一列：源片篮 */}
            <div>
              <h3 className="text-sm font-medium mb-2">源片篮</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">
                          <input
                            type="checkbox"
                            checked={selectedSourceCarrierCheckboxes.length === sourceCarriers.length && sourceCarriers.length > 0}
                            onChange={(e) => handleSelectAllSourceCarriers(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">片篮ID</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">批次ID</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Sublot ID</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">
                          <div className="flex flex-col items-center">
                            <span>良品</span>
                            <span className="font-bold text-green-600">{sourceCarrierSummary.totalGoodQty}</span>
                          </div>
                        </th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">
                          <div className="flex flex-col items-center">
                            <span>不良</span>
                            <span className="font-bold text-red-600">{sourceCarrierSummary.totalDefectQty}</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceCarriers.map((carrier) => (
                        <tr
                          key={carrier.id}
                          className={`cursor-pointer hover:bg-blue-50 ${
                            selectedSourceCarrierId === carrier.id ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => handleSourceCarrierSelect(carrier.id)}
                        >
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedSourceCarrierCheckboxes.includes(carrier.id)}
                              onChange={(e) => handleSourceCarrierCheckboxChange(carrier.id)}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                          </td>
                          <td className="py-2 px-3">{carrier.id}</td>
                          <td className="py-2 px-3">{carrier.masterBatchCode || 'N/A'}</td>
                          <td className="py-2 px-3">{carrier.sublotId}</td>
                          <td className="py-2 px-3 text-center">{carrier.goodQty}</td>
                          <td className="py-2 px-3 text-center">{carrier.defectQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 左侧第二列：源Wafer列表 */}
            <div>
              <h3 className="text-sm font-medium mb-2">Wafer列表</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">
                        <input
                          type="checkbox"
                          checked={selectedSourceWafers.length === displayedSourceWafers.length && displayedSourceWafers.length > 0}
                          onChange={(e) => handleSelectAllSourceWafers(e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">槽位号</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">类型</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Wafer ID</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Sublot ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSourceWafers.length > 0 ? (
                      displayedSourceWafers.map((wafer) => (
                        <tr key={wafer.id} className="hover:bg-gray-50 border-b">
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedSourceWafers.includes(wafer.id)}
                              onChange={() => handleWaferSelect(wafer.id)}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                          </td>
                          <td className="py-2 px-3">{String(wafer.slotNo).padStart(2, '0')}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWaferTypeColor(wafer.type)}`}>
                              {wafer.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-xs">{wafer.waferId}</td>
                          <td className="py-2 px-3 text-xs">{wafer.sublotId}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          请选择一个源片篮查看Wafer详情
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 移动按钮 */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleMoveSelectedWafersRight}
              disabled={selectedSourceWafers.length === 0 || !selectedCombinedTrayId}
              className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
                selectedSourceWafers.length === 0 || !selectedCombinedTrayId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              移动选中晶圆
            </button>
          </div>
        </div>

        {/* 右侧主要部分：并盘目标片篮 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handleCombineWafers}
              disabled={selectedSourceCarrierCheckboxes.length === 0}
              className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
                selectedSourceCarrierCheckboxes.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              并盘选中片篮
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 右侧第一列：并盘片篮列表 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">并盘目标片篮</h3>
              </div>
              
              <div className="border rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-100 px-3 py-2 text-sm font-medium border-b">
                  <div className="grid grid-cols-4 gap-2">
                    <span>片篮ID</span>
                    <span>良品数</span>
                    <span>不良品数</span>
                    <span>操作</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {combinedTrayCarriers.map((carrier, index) => (
                    <div 
                      key={index} 
                      className={`px-3 py-2 border-b text-sm hover:bg-gray-50 cursor-pointer ${
                        selectedCombinedTrayId === carrier.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedCombinedTrayId(carrier.id)}
                    >
                      <div className="grid grid-cols-4 gap-2 items-center">
                        <input
                          type="text"
                          value={carrier.id}
                          onChange={(e) => handleCombinedTrayCarrierIdChange(carrier.id, e.target.value)}
                          className="text-xs border rounded px-1 py-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-center">{carrier.goodQty}</span>
                        <span className="text-center">{carrier.defectQty}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCombinedTrayCarrier(carrier.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          disabled={combinedTrayCarriers.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 添加片篮按钮 */}
                <div className="p-3 border-t">
                  <button
                    onClick={handleAddCombinedTrayCarrier}
                    className="inline-flex items-center px-3 py-1 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    增加片篮
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧第二列：并盘Wafer列表 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Wafer列表</h3>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-3 py-2 text-sm font-medium border-b">
                  <div className="grid grid-cols-4 gap-2">
                    <span>槽位</span>
                    <span>类型</span>
                    <span>Wafer ID</span>
                    <span>操作</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {selectedCombinedTrayId && selectedCombinedTrayWafers.length > 0 ? (
                    selectedCombinedTrayWafers.map((wafer, index) => (
                      <div key={wafer.id} className="px-3 py-2 border-b text-sm hover:bg-gray-50">
                        <div className="grid grid-cols-4 gap-2 items-center">
                          <span>{String(wafer.slotNo).padStart(2, '0')}</span>
                          <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${getWaferTypeColor(wafer.type)}`}>
                            {wafer.type}
                          </span>
                          <span className="text-xs">{wafer.waferId}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleMoveWafer(wafer.id, 'up')}
                              disabled={index === 0 || selectedCombinedTrayWafers[index - 1]?.carrierId !== wafer.carrierId}
                              className="text-blue-500 hover:text-blue-700 disabled:text-gray-300"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveWafer(wafer.id, 'down')}
                              disabled={index === selectedCombinedTrayWafers.length - 1 || selectedCombinedTrayWafers[index + 1]?.carrierId !== wafer.carrierId}
                              className="text-blue-500 hover:text-blue-700 disabled:text-gray-300"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-500">
                      {selectedCombinedTrayId ? '该片篮中没有晶圆' : '请选择一个并盘片篮'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 确认并盘按钮 */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleConfirmCombine}
              disabled={combinedTrayWafers.length === 0}
              className={`inline-flex items-center px-6 py-2 rounded-md shadow-sm text-sm font-medium ${
                combinedTrayWafers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              确认并盘
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombineTrayWaferReorganizationModule;