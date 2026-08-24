// src/components/AccumulateWaferReorganizationModule.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarrierData, WaferData, TargetCarrier } from '../types'; // 导入通用类型

interface AccumulateWaferReorganizationModuleProps {
  initialSourceCarriers: CarrierData[]; // 传入源片篮数据
  onConfirmTransfer: (finalTargetCarriers: TargetCarrier[], finalSourceWafers: WaferData[]) => void; // 确认转篮操作的回调
  disableWaferTypeSelection?: boolean; // 新增属性，用于禁用片类型选择
  showBatchActionButtons?: boolean; // 新增属性，用于控制批量操作按钮的显示
}

const AccumulateWaferReorganizationModule: React.FC<AccumulateWaferReorganizationModuleProps> = ({
  initialSourceCarriers,
  onConfirmTransfer,
  disableWaferTypeSelection, // 接收新属性
  showBatchActionButtons = true, // 默认显示批量操作按钮
}) => {
  // 使用 useRef 创建持久的计数器
  const targetCarrierCounter = useRef(1);
  const waferIdCounter = useRef(1);

  // 使用 initialSourceCarriers 作为源数据
  const [sourceCarriers, setSourceCarriers] = useState<CarrierData[]>(initialSourceCarriers);
  const [allSourceWafers, setAllSourceWafers] = useState<WaferData[]>([]);

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
        const wafers = allWafers.filter(wafer => wafer.carrierId === initialSourceCarriers[0].id);
        setDisplayedSourceWafers(wafers);
      }
    } else {
      setAllSourceWafers([]);
      setSourceCarriers([]);
      setDisplayedSourceWafers([]);
    }
  }, [initialSourceCarriers]);

  // 片篮更换模块的状态
  const [selectedWafers, setSelectedWafers] = useState<number[]>([]);
  const [selectedSourceCarrierId, setSelectedSourceCarrierId] = useState<string>(initialSourceCarriers.length > 0 ? initialSourceCarriers[0].id : '');
  const [displayedSourceWafers, setDisplayedSourceWafers] = useState<WaferData[]>([]);
  const [targetCarriersList, setTargetCarriersList] = useState<TargetCarrier[]>([{ id: 'SA0160', count: 0 }]);
  const [selectedTargetCarrierId, setSelectedTargetCarrierId] = useState<string>('SA0160');
  const [targetWafers, setTargetWafers] = useState<WaferData[]>([]);

  // 监听选中的源片篮变化，更新显示的源晶圆
  useEffect(() => {
    if (selectedSourceCarrierId && allSourceWafers.length > 0) {
      const wafers = allSourceWafers.filter(wafer => wafer.carrierId === selectedSourceCarrierId);
      setDisplayedSourceWafers(wafers);
      setSelectedWafers([]);
    } else {
      setDisplayedSourceWafers([]);
    }
  }, [selectedSourceCarrierId, allSourceWafers]);

  // 处理单个晶圆类型变化
  const handleWaferTypeChange = (waferId: number, newType: 'GOOD' | 'BAD' | 'LOSS' | 'Select') => {
    setDisplayedSourceWafers(prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, type: newType }
          : wafer
      )
    );

    // 同时更新 allSourceWafers
    setAllSourceWafers(prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, type: newType }
          : wafer
      )
    );
  };

  // 批量操作处理函数
  const handleBatchGood = () => {
    const updatedWafers = displayedSourceWafers.map(wafer =>
      selectedWafers.includes(wafer.id)
        ? { ...wafer, type: 'GOOD' }
        : wafer
    );
    
    setDisplayedSourceWafers(updatedWafers);
    
    // 同时更新 allSourceWafers
    setAllSourceWafers(prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'GOOD' }
          : wafer
      )
    );
    
    setSelectedWafers([]);
  };

  const handleBatchBad = () => {
    const updatedWafers = displayedSourceWafers.map(wafer =>
      selectedWafers.includes(wafer.id)
        ? { ...wafer, type: 'BAD' }
        : wafer
    );
    
    setDisplayedSourceWafers(updatedWafers);
    
    // 同时更新 allSourceWafers
    setAllSourceWafers(prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'BAD' }
          : wafer
      )
    );
    
    setSelectedWafers([]);
  };

  const handleBatchLoss = () => {
    const updatedWafers = displayedSourceWafers.map(wafer =>
      selectedWafers.includes(wafer.id)
        ? { ...wafer, type: 'LOSS' }
        : wafer
    );
    
    setDisplayedSourceWafers(updatedWafers);
    
    // 同时更新 allSourceWafers
    setAllSourceWafers(prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'LOSS' }
          : wafer
      )
    );
    
    setSelectedWafers([]);
  };

  const handleWaferSelect = (id: number) => {
    setSelectedWafers(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // 修改源片篮选择逻辑
  const handleCarrierSelect = (carrierId: string) => {
    setSelectedSourceCarrierId(carrierId);
    const wafers = allSourceWafers.filter(wafer => wafer.carrierId === carrierId);
    setDisplayedSourceWafers(wafers);
  };

  // 目标片篮选择处理
  const handleTargetCarrierSelect = (carrierId: string) => {
    setSelectedTargetCarrierId(carrierId);
  };

  // 添加目标片篮
  const handleAddTargetCarrier = () => {
    targetCarrierCounter.current += 1;
    const newCarrier = { id: `SA${String(targetCarrierCounter.current).padStart(4, '0')}`, count: 0 };
    setTargetCarriersList(prev => [...prev, newCarrier]);
    setSelectedTargetCarrierId(newCarrier.id);
  };

  // 删除目标片篮
  const handleDeleteTargetCarrier = (carrierId: string) => {
    const newList = targetCarriersList.filter(carrier => carrier.id !== carrierId);
    setTargetCarriersList(newList);

    // 同时移除该片篮下的所有晶圆
    setTargetWafers(prev => prev.filter(wafer => wafer.carrierId !== carrierId));

    if (selectedTargetCarrierId === carrierId) {
      setSelectedTargetCarrierId(newList.length > 0 ? newList[0].id : '');
    }
  };

  // 目标片篮ID修改处理
  const handleTargetCarrierIdChange = (oldId: string, newValue: string) => {
    setTargetCarriersList(prev =>
      prev.map(carrier =>
        carrier.id === oldId
          ? { ...carrier, id: newValue }
          : carrier
      )
    );

    // 同时更新晶圆的 carrierId
    setTargetWafers(prev =>
      prev.map(wafer =>
        wafer.carrierId === oldId
          ? { ...wafer, carrierId: newValue }
          : wafer
      )
    );

    if (selectedTargetCarrierId === oldId) {
      setSelectedTargetCarrierId(newValue);
    }
  };

  // 右箭头按钮：移动选中晶圆到目标片篮
  const handleMoveSelectedWafersRight = () => {
    if (selectedWafers.length === 0) {
      alert('请选择至少一个晶圆进行移动！');
      return;
    }

    if (!selectedTargetCarrierId) {
      alert('请选择一个目标片篮！');
      return;
    }

    // 获取选中的晶圆
    const wafersToMove = displayedSourceWafers.filter(wafer => 
      selectedWafers.includes(wafer.id)
    );

    // 更新晶圆的 carrierId 为目标片篮
    const updatedWafersToMove = wafersToMove.map(wafer => ({
      ...wafer,
      carrierId: selectedTargetCarrierId,
      slotNo: targetWafers.filter(w => w.carrierId === selectedTargetCarrierId).length + 1
    }));

    // 添加到目标晶圆列表
    setTargetWafers(prev => [...prev, ...updatedWafersToMove]);

    // 从源数据中移除已移动的晶圆
    const updatedAllSourceWafers = allSourceWafers.filter(wafer => 
      !selectedWafers.includes(wafer.id)
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
      } else if (wafer.type === 'REJECT' || wafer.type === 'BAD') {
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

    // 更新目标片篮计数
    const targetCarrierWafers = targetWafers.filter(wafer => wafer.carrierId === selectedTargetCarrierId);
    const updatedTargetCarriers = targetCarriersList.map(carrier => 
      carrier.id === selectedTargetCarrierId
        ? { ...carrier, count: targetCarrierWafers.length + wafersToMove.length }
        : carrier
    );
    setTargetCarriersList(updatedTargetCarriers);

    // 清空选中状态
    setSelectedWafers([]);

    alert(`成功移动 ${wafersToMove.length} 个晶圆到目标片篮！`);
  };

  // 确认转篮操作
  const handleConfirmTransfer = () => {
    if (targetWafers.length === 0) {
      alert('没有可确认的转篮晶圆！');
      return;
    }

    onConfirmTransfer(targetCarriersList, targetWafers);
    alert('转篮操作已确认！');
  };

  // 获取当前选中的目标片篮晶圆
  const selectedTargetCarrierWafers = targetWafers.filter(wafer => 
    wafer.carrierId === selectedTargetCarrierId
  );

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-700">片重组</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-[1fr_1fr_min-content_2fr] gap-4">
          {/* 第一列：源片篮列表 */}
          <div>
            <h3 className="text-sm font-medium mb-5">源片篮</h3>            
            <div className="mb-4 rounded max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-1 px-2 text-left text-xs">源片篮</th>
                    <th className="py-1 px-2 text-left text-xs">Lot ID</th> {/* 新增 Lot ID 列 */}
                    <th className="py-1 px-2 text-left text-xs">Sublot ID</th>
                    <th className="py-1 px-2 text-center text-xs">良品</th>
                    <th className="py-1 px-2 text-center text-xs">不良</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceCarriers.map((carrier) => ( // 使用 sourceCarriers state
                    <tr
                      key={carrier.id}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedSourceCarrierId === carrier.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => handleCarrierSelect(carrier.id)}
                    >
                      <td className="py-1 px-2">{carrier.id}</td>
                      <td className="py-1 px-2">{carrier.masterBatchCode || 'N/A'}</td> {/* 显示 Lot ID */}
                      <td className="py-1 px-2">{carrier.sublotId}</td>
                      <td className="py-1 px-2 text-center">{carrier.goodQty}</td>
                      <td className="py-1 px-2 text-center">{carrier.defectQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 第二列：源片篮晶圆列表 */}
          <div>
            {showBatchActionButtons && ( // 根据 showBatchActionButtons 属性条件渲染
              <div className="flex space-x-2 mb-3">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  onClick={handleBatchGood}
                  disabled={selectedWafers.length === 0}
                >
                  批量良好
                </button>
                <button
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                  onClick={handleBatchBad}
                  disabled={selectedWafers.length === 0}
                >
                  批量不良
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  onClick={handleBatchLoss}
                  disabled={selectedWafers.length === 0}
                >
                  批量loss
                </button>
              </div>
            )}

            <div className="border rounded-lg">
              <div className="bg-gray-100 px-3 py-2 text-sm font-medium border-b flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="w-16">Slot No</span>
                <span className="w-20 ml-2">类型</span>
                <span className="flex-1 ml-2">WaferID</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {displayedSourceWafers.map((wafer) => (
                  <div key={wafer.id} className="flex items-center px-3 py-2 border-b text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedWafers.includes(wafer.id)}
                      onChange={() => handleWaferSelect(wafer.id)}
                    />
                    <span className="w-16">{wafer.slotNo}</span>
                    <select
                      className="w-20 text-xs border rounded px-1 py-1"
                      disabled={disableWaferTypeSelection} // 应用禁用属性
                      value={wafer.type} // 绑定 value 到 wafer.type
                      onChange={(e) => handleWaferTypeChange(wafer.id, e.target.value as 'GOOD' | 'BAD' | 'LOSS' | 'Select')} // 添加 onChange 处理器
                    >
                      <option value="GOOD">GOOD</option>
                      <option value="BAD">BAD</option>
                      <option value="LOSS">LOSS</option>
                    </select>
                    <span className="flex-1 ml-2 text-xs">{wafer.waferId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 移动按钮列 */}
          <div className="flex flex-col justify-center items-center space-y-4">
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
              onClick={handleMoveSelectedWafersRight}
              disabled={selectedWafers.length === 0 || !selectedTargetCarrierId}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* 第三列：目标片篮 */}
          <div>
            {/* 新的容器，用于包裹标题和按钮，并实现对齐 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">目标片篮</h3>
              <div className="flex space-x-2">
                <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">下移</button>
                <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">上移</button>
              </div>
            </div>

            {/* 目标片篮和Wafer明细的水平布局 */}
            <div className="flex gap-4">
              {/* 左侧：目标片篮列表 */}
              <div className="w-1/2">
                <div className="mb-4 rounded">
                  <table className="w-full text-sm ">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-1 px-2 text-left text-xs">目标片篮</th>
                        <th className="py-1 px-2 text-center text-xs">片数</th>
                        <th className="py-1 px-2 text-center text-xs">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetCarriersList.map((carrier, index) => (
                        <tr
                          key={index}
                          className={`cursor-pointer hover:bg-blue-50 ${
                            selectedTargetCarrierId === carrier.id ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => handleTargetCarrierSelect(carrier.id)}
                        >
                          <td className="py-1 px-2">
                            <input
                              type="text"
                              value={carrier.id}
                              onChange={(e) => handleTargetCarrierIdChange(carrier.id, e.target.value)}
                              className="w-full text-xs border rounded px-1 py-1"
                              placeholder="输入片篮编号"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="py-1 px-2 text-center">{carrier.count}</td>
                          <td className="py-1 px-2 text-center">
                            <button
                              className="text-red-500 text-xs hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTargetCarrier(carrier.id);
                              }}
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 mb-4"
                  onClick={handleAddTargetCarrier}
                >
                  增加片篮
                </button>

                {/* 确认转篮按钮 */}
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 w-full"
                  onClick={handleConfirmTransfer}
                  disabled={targetWafers.length === 0}
                >
                  确认转篮
                </button>
              </div>

              {/* 右侧：目标片篮Wafer明细 */}
              <div className="w-1/2">
                <div className="border rounded-lg">
                  <div className="bg-gray-100 px-3 py-2 text-sm font-medium border-b flex items-center">
                    <span className="w-16">Slot No</span>
                    <span className="w-20 ml-2">类型</span>
                    <span className="flex-1 ml-2">WaferID</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {selectedTargetCarrierWafers.length > 0 ? (
                      selectedTargetCarrierWafers.map((wafer) => (
                        <div key={wafer.id} className="flex items-center px-3 py-2 border-b text-sm hover:bg-gray-50">
                          <span className="w-16">{wafer.slotNo}</span>
                          <span className="w-20 ml-2 text-xs">{wafer.type}</span>
                          <span className="flex-1 ml-2 text-xs">{wafer.waferId}</span>
                        </div>
                      ))
                    ) : (
                      Array.from({ length: 25 }, (_, i) => ({
                        id: i + 100,
                        slotNo: 25 - i,
                        type: 'Select',
                        waferId: ''
                      })).map((wafer) => (
                        <div key={wafer.id} className="flex items-center px-3 py-2 border-b text-sm hover:bg-gray-50">
                          <span className="w-16">{wafer.slotNo}</span>
                          <select className="w-20 text-xs border rounded px-1 py-1 text-gray-400">
                            <option value="Select">Select</option>
                            <option value="GOOD">GOOD</option>
                            <option value="BAD">BAD</option>
                          </select>
                          <span className="flex-1 ml-2 text-xs text-gray-400">{wafer.waferId}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccumulateWaferReorganizationModule;