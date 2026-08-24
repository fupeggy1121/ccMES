// src/components/CancelDefectWaferReorganizationModule.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CreditCard as Edit, Save, X, Plus } from 'lucide-react';
import { CarrierData, WaferData, TargetCarrier, WaferLossRecord } from '../types';
import { getDispositionDisplay } from '../utils/inspectionHelpers';
import LossWaferSelectionModal from './LossWaferSelectionModal';
import LossWaferAutocompleteInput from './LossWaferAutocompleteInput';

interface CancelDefectWaferReorganizationModuleProps {
  carriers: CarrierData[];
  setCarriers: React.Dispatch<React.SetStateAction<CarrierData[]>>;
  onConfirmTransfer: (finalSourceWafers: WaferData[]) => void;
  disableWaferTypeSelection?: boolean;
  showBatchActionButtons?: boolean;
}

const CancelDefectWaferReorganizationModule: React.FC<CancelDefectWaferReorganizationModuleProps> = ({
  carriers,
  setCarriers,
  onConfirmTransfer,
  disableWaferTypeSelection = false,
  showBatchActionButtons = true,
}) => {
  // 内部状态
  const [selectedSourceCarrierId, setSelectedSourceCarrierId] = useState<string>('');
  const [displayedSourceWafers, setDisplayedSourceWafers] = useState<WaferData[]>([]);
  const [selectedWafers, setSelectedWafers] = useState<number[]>([]);
  const [editingWafer, setEditingWafer] = useState<number | null>(null);
  const [tempWaferType, setTempWaferType] = useState<'GOOD' | 'REJECT' | 'LOSS'>('GOOD');
  const [isLossWaferSelectionModalOpen, setIsLossWaferSelectionModalOpen] = useState(false);

  // 模拟损失晶圆数据 - 在实际应用中应该从后端获取
  const mockLossWafers: WaferLossRecord[] = [
    {
      id: 'LOSS-001',
      waferId: 'W-LOSS-001',
      originalLotId: 'BATCH001',
      originalCarrierId: 'CAR-001-01',
      originalSublotId: 'BATCH001-SUB-01',
      reason: '工艺缺陷',
      lossDate: '2024-01-15',
      operator: 'OP001'
    },
    {
      id: 'LOSS-002',
      waferId: 'W-LOSS-002',
      originalLotId: 'BATCH001',
      originalCarrierId: 'CAR-001-01',
      originalSublotId: 'BATCH001-SUB-01',
      reason: '机械损伤',
      lossDate: '2024-01-16',
      operator: 'OP002'
    },
    {
      id: 'LOSS-003',
      waferId: 'W-LOSS-003',
      originalLotId: 'BATCH002',
      originalCarrierId: 'CAR-002-01',
      originalSublotId: 'BATCH002-SUB-01',
      reason: '参数异常',
      lossDate: '2024-01-17',
      operator: 'OP001'
    },
    {
      id: 'LOSS-004',
      waferId: 'W-LOSS-004',
      originalLotId: 'BATCH002',
      originalCarrierId: 'CAR-002-01',
      originalSublotId: 'BATCH002-SUB-01',
      reason: '外观不良',
      lossDate: '2024-01-18',
      operator: 'OP003'
    },
    {
      id: 'LOSS-005',
      waferId: 'W-LOSS-005',
      originalLotId: 'BATCH003',
      originalCarrierId: 'CAR-003-01',
      originalSublotId: 'BATCH003-SUB-01',
      reason: '测试失败',
      lossDate: '2024-01-19',
      operator: 'OP002'
    }
  ];

  // 根据载具数据生成晶圆数据 - 始终生成25个槽位，使用全局唯一的waferId
  const generateWafersForCarrier = (carrier: CarrierData): WaferData[] => {
    const wafers: WaferData[] = [];
    const goodWafers = carrier.goodQty || 0;
    const defectWafers = carrier.defectQty || 0;
    const emptySlots = 25 - goodWafers - defectWafers; // 始终基于25个槽位计算

    let waferCounter = 1;
    const masterBatchCode = carrier.masterBatchCode || 'UNKNOWN';
    const sublotSuffix = carrier.sublotId.slice(-6);

    // 生成良品晶圆
    for (let i = 0; i < goodWafers; i++) {
      wafers.push({
        id: waferCounter,
        slotNo: waferCounter,
        type: 'GOOD',
        waferId: `W-${masterBatchCode}-${sublotSuffix}-${String(waferCounter).padStart(3, '0')}`, // 使用全局唯一的waferId格式
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
    for (let i = 0; i < defectWafers; i++) {
      wafers.push({
        id: waferCounter,
        slotNo: waferCounter,
        type: 'REJECT',
        waferId: `W-${masterBatchCode}-${sublotSuffix}-${String(waferCounter).padStart(3, '0')}`, // 使用全局唯一的waferId格式
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

    // 生成空槽位
    for (let i = 0; i < emptySlots; i++) {
      wafers.push({
        id: waferCounter,
        slotNo: waferCounter,
        type: 'Select',
        waferId: '', // 空字符串表示空槽位
        sublotId: carrier.sublotId,
        carrierId: carrier.id,
        markingStatus: '未完成',
        inspectionStatus: '未检验',
        disposition: 'NONE',
        grade: '-',
        inspectionParameters: [],
      });
      waferCounter++;
    }

    return wafers;
  };

  // 添加新片篮
  const handleAddCarrier = () => {
    const newCarrierId = prompt('请输入新的片篮 ID:');
    if (newCarrierId && newCarrierId.trim() !== '') {
      const newCarrier: CarrierData = {
        id: newCarrierId.trim(),
        sublotId: `SL-${Date.now().toString().slice(-6)}`,
        goodQty: 23,
        defectQty: 0,
        totalQty: 25,
      };
      
      const updatedCarriers = [...carriers, newCarrier];
      setCarriers(updatedCarriers);
      setSelectedSourceCarrierId(newCarrier.id);
    }
  };

  // 处理空槽位片号录入
  const handleWaferIdChange = (waferId: number, newWaferId: string) => {
    setDisplayedSourceWafers(prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, waferId: newWaferId }
          : wafer
      )
    );
  };

  // 处理损失晶圆自动完成选择 - 更新以保持waferId唯一性
  const handleLossWaferSelect = (waferId: number, selectedLossWafer: WaferLossRecord | null) => {
    if (selectedLossWafer) {
      setDisplayedSourceWafers(prev =>
        prev.map(wafer =>
          wafer.id === waferId
            ? {
                ...wafer,
                waferId: selectedLossWafer.waferId, // 使用损失晶圆的唯一ID
                type: 'REJECT',
                disposition: 'HOLD',
                grade: '-'
              }
            : wafer
        )
      );
    }
  };

  // 处理选择损失晶圆的回调函数
  const handleSelectLossWafers = (selectedLossWafers: WaferLossRecord[]) => {
    // 查找当前显示晶圆中的空槽位
    const emptySlots = displayedSourceWafers.filter(wafer => wafer.type === 'Select' && wafer.waferId === '');
    
    // 用选中的损失晶圆数据填充空槽位
    const updatedWafers = [...displayedSourceWafers];
    let lossWaferIndex = 0;
    
    for (let i = 0; i < updatedWafers.length && lossWaferIndex < selectedLossWafers.length; i++) {
      if (updatedWafers[i].type === 'Select' && updatedWafers[i].waferId === '') {
        const lossWafer = selectedLossWafers[lossWaferIndex];
        updatedWafers[i] = {
          ...updatedWafers[i],
          waferId: lossWafer.waferId, // 使用损失晶圆的唯一ID
          type: 'REJECT', // 设置为不良品类型
          disposition: 'HOLD',
          grade: '-'
        };
        lossWaferIndex++;
      }
    }
    
    setDisplayedSourceWafers(updatedWafers);
    setIsLossWaferSelectionModalOpen(false);
  };

  // 监听 carriers 变化
  useEffect(() => {
    if (carriers.length > 0) {
      const firstCarrierId = carriers[0].id;
      setSelectedSourceCarrierId(firstCarrierId);
    } else {
      setSelectedSourceCarrierId('');
      setDisplayedSourceWafers([]);
    }
  }, [carriers]);

  // 监听选中的源片篮变化
  useEffect(() => {
    if (selectedSourceCarrierId && carriers.length > 0) {
      const selectedCarrier = carriers.find(c => c.id === selectedSourceCarrierId);
      if (selectedCarrier) {
        const wafers = generateWafersForCarrier(selectedCarrier);
        setDisplayedSourceWafers(wafers);
        setSelectedWafers([]);
      }
    } else {
      setDisplayedSourceWafers([]);
    }
  }, [selectedSourceCarrierId, carriers]);

  // 处理源片篮选择
  const handleCarrierSelect = (carrierId: string) => {
    setSelectedSourceCarrierId(carrierId);
  };

  // 处理晶圆选择
  const handleWaferSelect = (id: number) => {
    setSelectedWafers(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // 处理单个晶圆类型变化
  const handleWaferTypeChange = (waferId: number, newType: 'GOOD' | 'REJECT' | 'LOSS') => {
    setDisplayedSourceWafers(prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { 
              ...wafer, 
              type: newType, 
              disposition: newType === 'REJECT' ? 'HOLD' : newType === 'LOSS' ? 'NONE' : 'NONE',
              grade: newType === 'GOOD' ? 'A级' : '-'
            }
          : wafer
      )
    );
    setEditingWafer(null);
  };

  // 批量操作处理函数
  const handleBatchGood = () => {
    setDisplayedSourceWafers(prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'GOOD', disposition: 'NONE', grade: 'A级' }
          : wafer
      )
    );
    setSelectedWafers([]);
  };

  const handleBatchBad = () => {
    setDisplayedSourceWafers(prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'REJECT', disposition: 'HOLD', grade: '-' }
          : wafer
      )
    );
    setSelectedWafers([]);
  };

  const handleBatchLoss = () => {
    setDisplayedSourceWafers(prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'LOSS', disposition: 'NONE', grade: '-' }
          : wafer
      )
    );
    setSelectedWafers([]);
  };

  // 编辑相关函数
  const startEditing = (waferId: number, currentType: 'GOOD' | 'REJECT' | 'LOSS') => {
    setEditingWafer(waferId);
    setTempWaferType(currentType);
  };

  const cancelEditing = () => {
    setEditingWafer(null);
  };

  const saveEditing = (waferId: number) => {
    handleWaferTypeChange(waferId, tempWaferType);
  };

  // 获取类型颜色
  const getTypeColor = (type: 'GOOD' | 'REJECT' | 'LOSS' | 'Select'): string => {
    switch (type) {
      case 'GOOD':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'REJECT':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'LOSS':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Select':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getTypeText = (type: 'GOOD' | 'REJECT' | 'LOSS' | 'Select'): string => {
    switch (type) {
      case 'GOOD':
        return '良品';
      case 'REJECT':
        return '不良品';
      case 'LOSS':
        return '损失';
      case 'Select':
        return ''; // 空槽位不显示文本
      default:
        return '未知';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-700">晶圆详情</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-[1fr_2fr] gap-6">
          {/* 第一列：源片篮列表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">片篮列表</h3>
              <button
                onClick={handleAddCarrier}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="添加片篮"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="mb-4 max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-1 px-2 text-left text-xs">片篮ID</th>
                    <th className="py-1 px-2 text-left text-xs">Sublot ID</th>
                    <th className="py-1 px-2 text-center text-xs">良品</th>
                    <th className="py-1 px-2 text-center text-xs">不良</th>
                  </tr>
                </thead>
                <tbody>
                  {carriers.map((carrier) => (
                    <tr
                      key={carrier.id}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedSourceCarrierId === carrier.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => handleCarrierSelect(carrier.id)}
                    >
                      <td className="py-1 px-2">{carrier.id}</td>
                      <td className="py-1 px-2">{carrier.sublotId}</td>
                      <td className="py-1 px-2 text-center">{carrier.goodQty}</td>
                      <td className="py-1 px-2 text-center">{carrier.defectQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 第二列：晶圆片详情 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">晶圆片详情</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsLossWaferSelectionModalOpen(true)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="添加片号"
                >
                  <Plus size={16} />
                </button>
                {showBatchActionButtons && (
                  <button
                    onClick={handleBatchGood}
                    disabled={selectedWafers.length === 0}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedWafers.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    批量设为良品
                  </button>
                )}
              </div>
            </div>
            <div className="border rounded-lg">
              <div className="bg-gray-100 px-3 py-2 text-sm font-medium border-b flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="w-16">槽位号</span>
                <span className="flex-1 ml-4">片号</span>
                <span className="w-24 ml-4">类型</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {displayedSourceWafers.map((wafer) => (
                  <div key={wafer.id} className="flex items-center px-3 py-2 border-b text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedWafers.includes(wafer.id)}
                      onChange={() => handleWaferSelect(wafer.id)}
                    />
                    <span className="w-16">{String(wafer.slotNo).padStart(2, '0')}</span>
                    
                    {/* 空槽位显示 LossWaferAutocompleteInput，非空槽位显示只读文本 */}
                    {wafer.waferId === '' ? (
                      <div className="flex-1 ml-4">
                        <LossWaferAutocompleteInput
                          options={mockLossWafers}
                          onSelect={(selectedLossWafer) => handleLossWaferSelect(wafer.id, selectedLossWafer)}
                          placeholder="选择损失晶圆"
                        />
                      </div>
                    ) : (
                      <span className="flex-1 ml-4">{wafer.waferId}</span>
                    )}
                    
                    <span className={`w-24 ml-4 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(wafer.type)}`}>
                      {getTypeText(wafer.type)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">

            </div>
          </div>
        </div>
      </div>

      {/* 损失晶圆选择模态框 */}
      <LossWaferSelectionModal
        isOpen={isLossWaferSelectionModalOpen}
        onClose={() => setIsLossWaferSelectionModalOpen(false)}
        onSelectLossWafers={handleSelectLossWafers}
        lossWafers={mockLossWafers}
      />
    </div>
  );
};

export default CancelDefectWaferReorganizationModule;