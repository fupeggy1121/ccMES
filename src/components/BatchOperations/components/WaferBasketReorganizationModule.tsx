// src/components/WaferBasketReorganizationModule.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { CarrierData, WaferData, TargetCarrier } from '../types'; // 导入通用类型

interface WaferBasketReorganizationModuleProps {
  initialSourceCarriers: CarrierData[]; // 传入源片篮数据
  selectedMode: string; // 新增：倒篮模式
  onReorganizationStateChange?: (finalTargetCarriers: TargetCarrier[], finalSourceWafers: WaferData[]) => void; // 状态变化回调
  disableWaferTypeSelection?: boolean; // 新增属性，用于禁用片类型选择
  showBatchActionButtons?: boolean; // 新增属性，用于控制批量操作按钮的显示
  hideTargetMoveButtons?: boolean; // 新增属性：隐藏目标片篮上下移动按钮
  hideTransferButtons?: boolean; // 新增属性：隐藏左右移动按钮
  hideTargetSection?: boolean;   // 新增属性：隐藏目标片篮整列（仅展示源片篮）
  disableBatchWaferTypeActions?: boolean; // 新增：禁用批量晶圆类型操作按钮
  isDefectEntryMode?: boolean; // 不良录入模式：启用 Good/Reject/Loss 类型、处置下拉
  readOnlyWaferDetails?: boolean; // 只读模式：Wafer 明细表格全部禁止编辑
  initialWafers?: WaferData[]; // 预加载晶圆数据（来自 service），优先于内部生成的占位数据
  initialTargetWafers?: WaferData[]; // 预览模式：目标片篮预填晶圆
  initialTargetCarriers?: TargetCarrier[]; // 预览模式：目标片篮列表（设置后跳过模式自动初始化）
}

const MOCK_DEFECT_REASONS = ['划伤', '崩边', '污染', '裂纹', '气泡', '厚度异常', '颗粒污染', '破片'] as const;

const WaferBasketReorganizationModule: React.FC<WaferBasketReorganizationModuleProps> = ({
  initialSourceCarriers,
  selectedMode,
  onReorganizationStateChange,
  disableWaferTypeSelection, // 接收新属性
  showBatchActionButtons = true, // 默认显示批量操作按钮
  hideTargetMoveButtons = false, // 默认显示目标片篮移动按钮
  hideTransferButtons = false, // 默认显示左右移动按钮
  hideTargetSection = false,   // 默认显示目标片篮区域
  disableBatchWaferTypeActions = false, // 新增：默认不禁用
  isDefectEntryMode = false,
  readOnlyWaferDetails = false,
  initialWafers,
  initialTargetWafers,
  initialTargetCarriers,
}) => {
  // 使用 useRef 创建持久的计数器，用于生成目标片篮中晶圆的唯一ID
  const targetWaferIdCounter = useRef(2000); // 从一个足够高的数字开始，避免与源晶圆ID冲突

  // 使用 initialSourceCarriers 作为源数据
  const [sourceCarriers, setSourceCarriers] = useState<CarrierData[]>(initialSourceCarriers);

  // 辅助函数：根据载具ID生成晶圆数据
  const getWafersForCarrier = (carrier: CarrierData): WaferData[] => {
    if (!carrier) return [];

    // 优先使用预加载的真实晶圆数据（来自 service / mockWafersBySubBatch）
    if (initialWafers && initialWafers.length > 0) {
      const carrierWafers = initialWafers.filter(w => w.carrierId === carrier.id);
      if (carrierWafers.length > 0) {
        const occupied = new Set(carrierWafers.map(w => w.slotNo));
        const result: WaferData[] = [...carrierWafers];
        for (let slot = 25; slot >= 1; slot--) {
          if (!occupied.has(slot)) {
            result.push({
              id: slot + 3000,
              slotNo: slot,
              type: 'Select' as const,
              waferId: '',
              sublotId: carrier.sublotId,
              carrierId: carrier.id,
              markingStatus: '未打标',
              inspectionStatus: '未检验',
            });
          }
        }
        return result.sort((a, b) => b.slotNo - a.slotNo);
      }
    }

    // WaferID 的序号需要在整个主批次内唯一递增，而不是每换一个片篮就从 1 重新开始，
    // 因此按 sourceCarriers 中当前片篮之前所有片篮的片数累加出一个偏移量。
    const carrierIndex = sourceCarriers.findIndex(c => c.id === carrier.id);
    const waferSeqOffset = sourceCarriers
      .slice(0, carrierIndex === -1 ? 0 : carrierIndex)
      .reduce((sum, c) => sum + (c.totalQty ?? (c.goodQty + c.defectQty)), 0);

    const wafers: WaferData[] = [];
    let currentWaferCount = 0; // To track total wafers generated for slot numbering

    // Generate GOOD wafers
    for (let i = 0; i < carrier.goodQty; i++) {
      wafers.push({
        id: currentWaferCount + 1, // Unique ID for React key
        slotNo: 25 - currentWaferCount, // Slot numbers from 25 down to 1
        type: 'GOOD',
        waferId: `W-${carrier.sublotId.slice(0, 11)}-${String(waferSeqOffset + currentWaferCount + 1).padStart(3, '0')}`, // Example Wafer ID
        sublotId: carrier.sublotId,
        carrierId: carrier.id,
        markingStatus: '未打标', // Default status
        inspectionStatus: '未检验', // Default status
      });
      currentWaferCount++;
    }

    // Generate REJECT wafers
    for (let i = 0; i < carrier.defectQty; i++) {
      wafers.push({
        id: currentWaferCount + 1,
        slotNo: 25 - currentWaferCount,
        type: 'REJECT',
        waferId: `W-${carrier.sublotId.slice(0, 11)}-${String(waferSeqOffset + currentWaferCount + 1).padStart(3, '0')}`,
        sublotId: carrier.sublotId,
        carrierId: carrier.id,
        markingStatus: '未打标',
        inspectionStatus: '未检验',
        inspectionResultsByStation: {
          defect_entry: { parameters: [], defectCode: MOCK_DEFECT_REASONS[i % MOCK_DEFECT_REASONS.length] },
        },
      });
      currentWaferCount++;
    }

    // Fill remaining slots with 'Select' type (empty slots) up to 25
    for (let i = currentWaferCount; i < 25; i++) {
        wafers.push({
            id: i + 1, // Unique ID for React key
            slotNo: 25 - i, // Slot numbers from 25 down to 1
            type: 'Select',
            waferId: '',
            sublotId: carrier.sublotId, // Associate with the carrier's sublot
            carrierId: carrier.id,
            markingStatus: '未打标',
            inspectionStatus: '未检验',
        });
    }

    // Sort wafers by slotNo descending to match 25->1 display order
    return wafers.sort((a, b) => b.slotNo - a.slotNo);
  };

  // 目标晶圆数据状态
  const [targetWafers, setTargetWafers] = useState<WaferData[]>(() => {
    // If preview target wafers are provided, use them directly
    if (initialTargetWafers && initialTargetWafers.length > 0) {
      return initialTargetWafers;
    }
    // Initialize with 25 empty slots for the default/first target carrier
    const initialCarrierId = initialTargetCarriers?.[0]?.id || 'SA0160';
    return Array.from({ length: 25 }, (_, i) => {
      targetWaferIdCounter.current++; // Use the ref for initial IDs too
      return {
        id: targetWaferIdCounter.current, // Unique ID for React key
        slotNo: 25 - i, // Slot numbers from 25 down to 1
        type: 'Select' as const,
        waferId: '',
        sublotId: '',
        carrierId: initialCarrierId,
        markingStatus: '未打标',
        inspectionStatus: '未检验',
      };
    }).sort((a, b) => b.slotNo - a.slotNo); // Ensure descending order
  });

  // 片篮更换模块的状态
  const [selectedWafers, setSelectedWafers] = useState<number[]>([]);
  const [selectedSourceCarrierId, setSelectedSourceCarrierId] = useState<string>(initialSourceCarriers.length > 0 ? initialSourceCarriers[0].id : '');
  // 按片篮ID持久保存各源片篮的晶圆状态，切换片篮浏览时不再丢失已判定的结果
  const [sourceWafersByCarrierId, setSourceWafersByCarrierId] = useState<Record<string, WaferData[]>>({});
  const [targetCarriersList, setTargetCarriersList] = useState<TargetCarrier[]>(
    initialTargetCarriers || [{ id: 'SA0160', goodQty: 0, defectQty: 0 }]
  );
  const [selectedTargetCarrierId, setSelectedTargetCarrierId] = useState<string>(
    initialTargetCarriers?.[0]?.id || 'SA0160'
  );
  const [transferMode, setTransferMode] = useState<'平移' | '1>25' | '25>1'>('平移'); // 新增：移动模式状态

  // 当前选中源片篮的晶圆列表（派生自持久化的 map）
  const displayedSourceWafers = sourceWafersByCarrierId[selectedSourceCarrierId] ?? [];

  // 更新指定源片篮的晶圆列表（判定类型/处置等编辑操作统一走这里）
  const setSourceWafersForCarrier = (
    carrierId: string,
    updater: WaferData[] | ((prev: WaferData[]) => WaferData[])
  ) => {
    setSourceWafersByCarrierId(prev => {
      const prevForCarrier = prev[carrierId] ?? [];
      const next = typeof updater === 'function'
        ? (updater as (p: WaferData[]) => WaferData[])(prevForCarrier)
        : updater;
      return { ...prev, [carrierId]: next };
    });
  };

  // --- Step 1: Update internal state when initialSourceCarriers prop changes ---
  useEffect(() => {
    setSourceCarriers(initialSourceCarriers);
    if (initialSourceCarriers.length > 0) {
      const firstCarrierId = initialSourceCarriers[0].id;
      setSelectedSourceCarrierId(firstCarrierId);
      const firstCarrier = initialSourceCarriers.find(c => c.id === firstCarrierId);
      setSourceWafersByCarrierId(firstCarrier ? { [firstCarrierId]: getWafersForCarrier(firstCarrier) } : {});
    } else {
      setSelectedSourceCarrierId('');
      setSourceWafersByCarrierId({});
    }
  }, [initialSourceCarriers]); // Dependency on initialSourceCarriers

  // Update targetWafers initialization in useEffect
  useEffect(() => {
    // When preview target carriers are provided, skip mode-based re-initialization
    if (initialTargetCarriers) return;

    if (['A', 'B', 'C', 'D'].includes(selectedMode)) {
      const initialTargetCarriers: TargetCarrier[] = initialSourceCarriers.map(carrier => ({
        id: carrier.id,
        goodQty: 0,
        defectQty: 0
      }));
      setTargetCarriersList(initialTargetCarriers);
      setSelectedTargetCarrierId(initialTargetCarriers.length > 0 ? initialTargetCarriers[0].id : '');
      
      // Initialize target wafers with 25->1 slot order
      setTargetWafers(Array.from({ length: 25 }, (_, i) => {
        targetWaferIdCounter.current++;
        return {
          id: targetWaferIdCounter.current, // Unique ID
          slotNo: 25 - i, // Slot numbers from 25 down to 1
          type: 'Select' as const,
          waferId: '',
          sublotId: '',
          carrierId: initialTargetCarriers[0]?.id || '', // Associate with the first initial target carrier
          markingStatus: '未打标',
          inspectionStatus: '未检验',
        };
      }).sort((a, b) => b.slotNo - a.slotNo)); // Ensure descending order
    } else if (selectedMode === '3') {
      setTargetCarriersList([]);
      setSelectedTargetCarrierId('');
      setTargetWafers([]);
    } else {
      // For other modes, ensure targetWafers are initialized with empty slots for the default carrier
      const defaultTargetCarrierId = 'SA0160';
      setTargetCarriersList([{ id: defaultTargetCarrierId, goodQty: 0, defectQty: 0 }]);
      setSelectedTargetCarrierId(defaultTargetCarrierId);
      
      setTargetWafers(Array.from({ length: 25 }, (_, i) => {
        targetWaferIdCounter.current++;
        return {
          id: targetWaferIdCounter.current, // Unique ID
          slotNo: 25 - i, // Slot numbers from 25 down to 1
          type: 'Select' as const,
          waferId: '',
          sublotId: '',
          carrierId: defaultTargetCarrierId,
          markingStatus: '未打标',
          inspectionStatus: '未检验',
        };
      }).sort((a, b) => b.slotNo - a.slotNo)); // Ensure descending order
    }
    
    setSelectedWafers([]);
  }, [selectedMode, initialSourceCarriers]);

  // Notify parent of target state changes
  useEffect(() => {
    if (!onReorganizationStateChange) return;
    const finalTargetCarriers: TargetCarrier[] = targetCarriersList.map(carrier => ({
      id: carrier.id,
      goodQty: targetWafers.filter(w => w.carrierId === carrier.id && w.type === 'GOOD').length,
      defectQty: targetWafers.filter(w => w.carrierId === carrier.id && (w.type === 'BAD' || w.type === 'LOSS' || w.type === 'REJECT')).length,
    }));
    onReorganizationStateChange(finalTargetCarriers, targetWafers);
  }, [targetCarriersList, targetWafers, onReorganizationStateChange]);

  // When selectedSourceCarrierId changes, lazily load its wafer data —
  // 若该片篮已有加载/编辑过的数据则保留现状，不覆盖已判定的结果
  useEffect(() => {
    if (!selectedSourceCarrierId || sourceCarriers.length === 0) return;
    setSourceWafersByCarrierId(prev => {
      if (prev[selectedSourceCarrierId]) return prev;
      const selectedCarrier = sourceCarriers.find(c => c.id === selectedSourceCarrierId);
      if (!selectedCarrier) return prev;
      return { ...prev, [selectedSourceCarrierId]: getWafersForCarrier(selectedCarrier) };
    });
  }, [selectedSourceCarrierId, sourceCarriers, initialWafers]);


  // 处理单个晶圆类型变化
  const handleWaferTypeChange = (waferId: number, newType: 'GOOD' | 'BAD' | 'LOSS' | 'Select') => {
    setSourceWafersForCarrier(selectedSourceCarrierId, prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, type: newType }
          : wafer
      )
    );
  };

  // 批量操作处理函数
  const handleBatchGood = () => {
    setSourceWafersForCarrier(selectedSourceCarrierId, prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'GOOD' }
          : wafer
      )
    );
    setSelectedWafers([]);
  };

  const handleBatchBad = () => {
    setSourceWafersForCarrier(selectedSourceCarrierId, prev =>
      prev.map(wafer =>
        selectedWafers.includes(wafer.id)
          ? { ...wafer, type: 'BAD' }
          : wafer
      )
    );
    setSelectedWafers([]);
  };

  const handleBatchLoss = () => {
    setSourceWafersForCarrier(selectedSourceCarrierId, prev =>
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

  // 处理回收等级变化
  const handleRecycleGradeChange = (waferId: number, newGrade: 'A级' | 'B级' | 'C级' | '') => {
    setSourceWafersForCarrier(selectedSourceCarrierId, prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, recycleGrade: newGrade || undefined }
          : wafer
      )
    );
  };

  // 不良录入模式：类型变更（Good / Reject / Loss）
  const handleDefectEntryTypeChange = (waferId: number, newType: 'GOOD' | 'REJECT' | 'LOSS') => {
    setSourceWafersForCarrier(selectedSourceCarrierId, prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? {
              ...wafer,
              type: newType,
              inspectionResultsByStation: newType === 'REJECT'
                ? { defect_entry: { parameters: [], defectCode: MOCK_DEFECT_REASONS[Math.floor(Math.random() * MOCK_DEFECT_REASONS.length)] } }
                : undefined,
              defectDisposal: newType === 'REJECT' ? wafer.defectDisposal : undefined,
              recycleGrade: newType === 'REJECT' ? wafer.recycleGrade : undefined,
            }
          : wafer
      )
    );
  };

  // 不良录入模式：不良处置下拉变更
  const handleDefectDisposalChange = (waferId: number, value: '返工' | '残值回收' | '报废' | '') => {
    setSourceWafersForCarrier(selectedSourceCarrierId, prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? {
              ...wafer,
              defectDisposal: value || undefined,
              // 切换为非残值回收时清除回收等级
              recycleGrade: value === '残值回收' ? wafer.recycleGrade : undefined,
            }
          : wafer
      )
    );
  };

  // 修改源片篮选择逻辑（晶圆数据由上方 effect 惰性加载 / 保留已判定结果）
  const handleCarrierSelect = (carrierId: string) => {
    setSelectedSourceCarrierId(carrierId);
  };

  // 目标片篮选择处理
  const handleTargetCarrierSelect = (carrierId: string) => {
    setSelectedTargetCarrierId(carrierId);
  };

  // 添加目标片篮
  const handleAddTargetCarrier = () => {
    const newId = `SA${String(targetCarriersList.length + 1).padStart(3, '0')}`;
    const newCarrier = { id: newId, goodQty: 0, defectQty: 0 };
    const updatedList = [...targetCarriersList, newCarrier];
    setTargetCarriersList(updatedList);
    setSelectedTargetCarrierId(newId);

    // Generate 25 empty wafers for the new target carrier
    const newEmptyWafers: WaferData[] = Array.from({ length: 25 }, (_, i) => {
      targetWaferIdCounter.current++; // Ensure unique ID for each new wafer
      return {
        id: targetWaferIdCounter.current,
        slotNo: 25 - i, // Slot numbers from 25 down to 1
        type: 'Select' as const,
        waferId: '',
        sublotId: '',
        carrierId: newId, // Associate with the new carrier
        markingStatus: '未打标',
        inspectionStatus: '未检验',
      };
    }).sort((a, b) => b.slotNo - a.slotNo); // Ensure descending order

    setTargetWafers(prev => [...prev, ...newEmptyWafers]);
  };

  // 删除目标片篮
  const handleDeleteTargetCarrier = (carrierId: string) => {
    const newList = targetCarriersList.filter(carrier => carrier.id !== carrierId);
    setTargetCarriersList(newList);

    // 从目标晶圆中移除该片篮的所有晶圆（包括空槽位）
    setTargetWafers(prev => prev.filter(wafer => wafer.carrierId !== carrierId));

    if (selectedTargetCarrierId === carrierId) {
      setSelectedTargetCarrierId(newList.length > 0 ? newList[0].id : '');
    }
  };

  // 目标片篮ID修改处理
  const handleTargetCarrierIdChange = (oldId: string, newValue: string) => {
    // Check for duplicate ID
    if (targetCarriersList.some(c => c.id === newValue && c.id !== oldId)) {
      alert('目标片篮ID已存在，请使用其他ID。');
      return;
    }

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

  // 移动选中的晶圆到目标片篮（向右移动）
  const handleMoveSelectedWafersRight = () => {
    if (selectedWafers.length === 0) {
      alert('请选择至少一个晶圆进行移动！');
      return;
    }

    if (!selectedTargetCarrierId) {
      alert('请选择一个目标片篮！');
      return;
    }

    // 1. Get selected wafers from source
    let wafersToMove = displayedSourceWafers.filter(wafer => selectedWafers.includes(wafer.id));

    // 2. Sort selected wafers based on transferMode (source order)
    
    if (transferMode === '1>25') {
      // Sort ascending (1 -> 25)
      wafersToMove.sort((a, b) => a.slotNo - b.slotNo);
    } else { // '平移' or '25>1'
      // Sort descending (25 -> 1)
      wafersToMove.sort((a, b) => b.slotNo - a.slotNo);
    }

    // 3. Get empty slots in the target carrier from the *full* targetWafers state
    let emptyTargetSlots = targetWafers.filter(wafer => wafer.carrierId === selectedTargetCarrierId && wafer.waferId === '');

    // 4. Sort empty target slots based on transferMode (target order)
    if (transferMode === '25>1') {
      // Sort ascending (1 -> 25)
      emptyTargetSlots.sort((a, b) => a.slotNo - b.slotNo);
    } else { // '平移' or '1>25'
      // Sort descending (25 -> 1)
      emptyTargetSlots.sort((a, b) => b.slotNo - a.slotNo);
    }

    if (emptyTargetSlots.length === 0) {
      alert('目标片篮已满或没有空槽位！');
      return;
    }

    if (wafersToMove.length > emptyTargetSlots.length) {
      alert(`目标片篮空槽位不足，只能移动 ${emptyTargetSlots.length} 个晶圆。`);
      wafersToMove = wafersToMove.slice(0, emptyTargetSlots.length); // Only move what fits
    }

    // Create a mutable copy of targetWafers for updates
    const updatedTargetWafers = [...targetWafers];
    const movedWaferIds: number[] = [];

    // Perform the transfer by updating existing empty slots in updatedTargetWafers
    wafersToMove.forEach((sourceWafer, index) => {
      const targetSlot = emptyTargetSlots[index];
      if (targetSlot) {
        // Find the actual wafer object in updatedTargetWafers to modify
        const targetWaferIndexInFullList = updatedTargetWafers.findIndex(w => w.id === targetSlot.id);
        if (targetWaferIndexInFullList !== -1) {
          updatedTargetWafers[targetWaferIndexInFullList] = {
            ...sourceWafer,
            id: targetSlot.id, // Keep target slot's original ID for React key
            slotNo: targetSlot.slotNo, // Keep target slot's original slotNo
            carrierId: selectedTargetCarrierId,
          };
          movedWaferIds.push(sourceWafer.id);
        }
      }
    });

    // Clear moved wafers from source (by making them empty slots in displayedSourceWafers)
    // 注意：只清空内容，槽位（slotNo）本身保留，行不从列表中消失
    const finalSourceWafers = displayedSourceWafers.map(wafer => {
      if (movedWaferIds.includes(wafer.id)) {
        return {
          ...wafer,
          waferId: '',
          type: 'Select' as const,
          sublotId: '',
          carrierId: wafer.carrierId, // Keep original carrierId
          markingStatus: '未打标',
          inspectionStatus: '未检验',
          defectDisposal: undefined,
          recycleGrade: undefined,
          inspectionResultsByStation: undefined,
        };
      }
      return wafer;
    });

    setTargetWafers(updatedTargetWafers);
    setSourceWafersForCarrier(selectedSourceCarrierId, finalSourceWafers);
    setSelectedWafers([]); // Clear selection after move

    alert(`成功移动 ${movedWaferIds.length} 个晶圆到目标片篮！`);
  };

  // 从目标片篮移动回源片篮（向左移动）
  const handleMoveSelectedWafersLeft = () => {
    // 实现从目标片篮移动回源片篮的逻辑
    // 这里暂不实现，可根据需要添加
    alert('向左移动功能待实现');
  };

  // 一键移动：将所有源片篮（不限于当前选中的片篮）中标记为不良（REJECT/LOSS）的晶圆，
  // 按当前「移动模式」的顺序规则，一次性移动到目标片篮；目标片篮空间不足时自动新增片篮承接。
  const handleOneClickMoveDefects = () => {
    // 1. 汇总各源片篮的不良片（未加载/未编辑过的片篮，用原始生成数据兜底）
    const perCarrierDefects = sourceCarriers.map(carrier => {
      const wafers = sourceWafersByCarrierId[carrier.id] ?? getWafersForCarrier(carrier);
      const defects = wafers.filter(w => w.waferId !== '' && (w.type === 'REJECT' || w.type === 'LOSS'));
      const sorted = [...defects].sort((a, b) =>
        transferMode === '1>25' ? a.slotNo - b.slotNo : b.slotNo - a.slotNo
      );
      return { carrierId: carrier.id, defects: sorted };
    });

    const wafersToMove = perCarrierDefects.flatMap(entry => entry.defects);

    if (wafersToMove.length === 0) {
      alert('未发现标记为不良的晶圆，无需移动。');
      return;
    }

    // 2. 汇总现有目标片篮的空槽位（按移动模式排序，片篮按列表顺序依次填充）
    let workingTargetCarriers = [...targetCarriersList];
    let workingTargetWafers = [...targetWafers];

    const collectEmptySlots = () =>
      workingTargetCarriers.flatMap(carrier => {
        const emptySlots = workingTargetWafers.filter(w => w.carrierId === carrier.id && w.waferId === '');
        return [...emptySlots].sort((a, b) =>
          transferMode === '25>1' ? a.slotNo - b.slotNo : b.slotNo - a.slotNo
        );
      });

    let emptyTargetSlots = collectEmptySlots();
    const originalTargetCarrierCount = workingTargetCarriers.length;

    // 3. 空位不足时自动新增目标片篮承接，直到能装下所有不良片
    while (emptyTargetSlots.length < wafersToMove.length) {
      const newId = `SA${String(workingTargetCarriers.length + 1).padStart(3, '0')}`;
      workingTargetCarriers = [...workingTargetCarriers, { id: newId, goodQty: 0, defectQty: 0 }];
      const newEmptyWafers: WaferData[] = Array.from({ length: 25 }, (_, i) => {
        targetWaferIdCounter.current++;
        return {
          id: targetWaferIdCounter.current,
          slotNo: 25 - i,
          type: 'Select' as const,
          waferId: '',
          sublotId: '',
          carrierId: newId,
          markingStatus: '未打标',
          inspectionStatus: '未检验',
        };
      }).sort((a, b) => b.slotNo - a.slotNo);
      workingTargetWafers = [...workingTargetWafers, ...newEmptyWafers];
      emptyTargetSlots = collectEmptySlots();
    }

    // 4. 依次分配：保留目标槽位的 id/slotNo，carrierId 换成其所属目标片篮
    const movedIdsByCarrierId: Record<string, Set<number | string>> = {};
    wafersToMove.forEach((sourceWafer, index) => {
      const targetSlot = emptyTargetSlots[index];
      const targetIdx = workingTargetWafers.findIndex(w => w.id === targetSlot.id);
      if (targetIdx !== -1) {
        workingTargetWafers[targetIdx] = {
          ...sourceWafer,
          id: targetSlot.id,
          slotNo: targetSlot.slotNo,
          carrierId: targetSlot.carrierId,
        };
      }
      if (!movedIdsByCarrierId[sourceWafer.carrierId]) {
        movedIdsByCarrierId[sourceWafer.carrierId] = new Set();
      }
      movedIdsByCarrierId[sourceWafer.carrierId].add(sourceWafer.id);
    });

    // 5. 清空各源片篮中已移动晶圆对应槽位的内容（槽位本身保留，展示为空行）
    setSourceWafersByCarrierId(prev => {
      const next = { ...prev };
      Object.entries(movedIdsByCarrierId).forEach(([carrierId, movedIds]) => {
        const carrier = sourceCarriers.find(c => c.id === carrierId);
        const carrierWafers = prev[carrierId] ?? (carrier ? getWafersForCarrier(carrier) : []);
        next[carrierId] = carrierWafers.map(wafer =>
          movedIds.has(wafer.id)
            ? {
                ...wafer,
                waferId: '',
                type: 'Select' as const,
                sublotId: '',
                markingStatus: '未打标',
                inspectionStatus: '未检验',
                defectDisposal: undefined,
                recycleGrade: undefined,
                inspectionResultsByStation: undefined,
              }
            : wafer
        );
      });
      return next;
    });

    setTargetCarriersList(workingTargetCarriers);
    setTargetWafers(workingTargetWafers);
    setSelectedWafers([]);

    const addedCarrierCount = workingTargetCarriers.length - originalTargetCarrierCount;
    alert(
      `一键移动完成：已将 ${wafersToMove.length} 片不良晶圆移动到目标片篮` +
      (addedCarrierCount > 0 ? `（自动新增 ${addedCarrierCount} 个片篮承接）` : '') +
      '。'
    );
  };

  // 处理目标晶圆类型变化
  const handleTargetWaferTypeChange = (waferId: number, newType: 'GOOD' | 'BAD' | 'REJECT' | 'LOSS' | 'Select') => {
    setTargetWafers(prev =>
      prev.map(wafer =>
        wafer.id === waferId
          ? { ...wafer, type: newType }
          : wafer
      )
    );
  };

  // 上下移动目标片篮中的 wafer（交换内容，slotNo 不变）
  const handleMoveTargetWafer = (waferId: number, direction: 'up' | 'down') => {
    const carrierWafers = targetWafers
      .filter(w => w.carrierId === selectedTargetCarrierId)
      .sort((a, b) => b.slotNo - a.slotNo); // 降序：[25, 24, ..., 1]
    const idx = carrierWafers.findIndex(w => w.id === waferId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= carrierWafers.length) return;
    const waferA = carrierWafers[idx];
    const waferB = carrierWafers[swapIdx];
    setTargetWafers(prev => prev.map(w => {
      if (w.id === waferA.id) return { ...w, waferId: waferB.waferId, type: waferB.type };
      if (w.id === waferB.id) return { ...w, waferId: waferA.waferId, type: waferA.type };
      return w;
    }));
  };

  // 获取当前选中的目标片篮晶圆，并按 slotNo 降序排序
  const selectedTargetCarrierWafers = targetWafers.filter(wafer =>
    wafer.carrierId === selectedTargetCarrierId
  ).sort((a, b) => b.slotNo - a.slotNo);

  // 不良录入模式：源片篮明细行按「原始槽位」展示——槽位代表片篮物理位置，
  // 片子移到目标片篮后该槽位仍应保留为空行，而不是整行消失（因此不能直接用当前 waferId 判断是否展示）
  const selectedSourceCarrierForDetail = sourceCarriers.find(c => c.id === selectedSourceCarrierId);
  const originalOccupiedSlotNos = selectedSourceCarrierForDetail
    ? new Set(getWafersForCarrier(selectedSourceCarrierForDetail).filter(w => w.waferId !== '').map(w => w.slotNo))
    : new Set<number>();

  // 源片篮数 / 片总数统计，供操作人员核对
  const sourceCarrierCount = sourceCarriers.length;
  const sourceTotalWaferCount = sourceCarriers.reduce(
    (sum, c) => sum + (c.totalQty ?? (c.goodQty + c.defectQty)),
    0
  );

  return (
    <div className="bg-white mb-4">
      <div className="p-6">
        <div className={`grid gap-4 ${
          hideTargetSection
            ? 'grid-cols-1'
            : hideTransferButtons
              ? 'grid-cols-2'
              : 'grid-cols-[minmax(0,1fr)_min-content_minmax(0,1fr)]'
        }`}>
          {/* 左侧：源片篮列表 + Wafer 明细 */}
          <div className={hideTargetSection ? "flex gap-4 min-w-0" : "flex flex-col gap-3 min-w-0"}>
            {/* 源片篮列表 */}
            <div className={hideTargetSection ? "w-1/3 flex-shrink-0" : ""}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">源片篮</h3>
              <span className="text-xs text-gray-500">源片篮数：{sourceCarrierCount}　片总数：{sourceTotalWaferCount}</span>
            </div>
            <div className="h-40 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-gray-100">
                    <th className="py-1 px-2 text-left text-xs">源片篮</th>
                    <th className="py-1 px-2 text-left text-xs">Sublot ID</th>
                    <th className="py-1 px-2 text-center text-xs">良品</th>
                    <th className="py-1 px-2 text-center text-xs">不良</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceCarriers.map((carrier) => (
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

            <div className={hideTargetSection ? "w-2/3 flex flex-col gap-2" : "flex flex-col gap-3"}>
            {showBatchActionButtons && (
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 rounded text-xs ${
                    disableBatchWaferTypeActions || selectedWafers.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  onClick={handleBatchGood}
                  disabled={disableBatchWaferTypeActions || selectedWafers.length === 0}
                >
                  批量良好
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs ${
                    disableBatchWaferTypeActions || selectedWafers.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                  onClick={handleBatchBad}
                  disabled={disableBatchWaferTypeActions || selectedWafers.length === 0}
                >
                  批量不良
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs ${
                    disableBatchWaferTypeActions || selectedWafers.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  onClick={handleBatchLoss}
                  disabled={disableBatchWaferTypeActions || selectedWafers.length === 0}
                >
                  批量loss
                </button>
              </div>
            )}

            <div className="border rounded-lg overflow-x-auto">
              <div className="bg-gray-100 px-3 py-1 text-xs font-medium border-b flex items-center min-w-max">
                <input type="checkbox" className="mr-2" />
                <span className="w-12 flex-shrink-0">Slot</span>
                <span className="w-44 ml-2 flex-shrink-0">WaferID</span>
                <span className="w-44 ml-2 flex-shrink-0">材料号</span>
                <span className="w-16 ml-2 flex-shrink-0">类型</span>
                <span className="w-20 ml-2 flex-shrink-0">不良代码</span>
                <span className="w-24 ml-2 flex-shrink-0">不良处置</span>
                <span className="w-24 ml-2 flex-shrink-0">回收等级</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="min-w-max">
                {displayedSourceWafers
                  // 不良录入模式下过滤掉从未有片的空槽位；片子被移出后原槽位仍保留展示（原始占用槽位集合，不随移动变化）
                  .filter(w => !isDefectEntryMode || originalOccupiedSlotNos.has(w.slotNo))
                  .map((wafer) => {
                  const inspResult = Object.values(wafer.inspectionResultsByStation ?? {})[0];
                  const defectCode = inspResult?.defectCode ?? (wafer.type === 'REJECT' ? '待录入' : '—');
                  const disposalMap: Record<string, string> = {
                    REWORK_WASH: '返工(清洗)',
                    REWORK_POLISH: '返工(抛光)',
                    HOLD: '暂定',
                    NONE: '—',
                  };
                  const disposal = wafer.disposition ? (disposalMap[wafer.disposition] ?? '—') : '—';
                  return (
                    <div key={wafer.id} className="flex items-center px-3 py-1 border-b text-xs hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedWafers.includes(wafer.id)}
                        onChange={() => handleWaferSelect(wafer.id)}
                      />
                      <span className="w-12 flex-shrink-0">{wafer.slotNo}</span>
                      <span className={`w-44 ml-2 flex-shrink-0 text-xs truncate ${wafer.waferId ? '' : 'text-gray-400'}`} title={wafer.waferId || undefined}>{wafer.waferId || '空'}</span>
                      <span className="w-44 ml-2 flex-shrink-0 text-xs truncate" title={wafer.materialCode ?? ''}>{wafer.materialCode ?? '—'}</span>
                      <select
                        className="w-16 ml-2 flex-shrink-0 text-xs border rounded px-1 py-0.5"
                        disabled={disableWaferTypeSelection || readOnlyWaferDetails || (isDefectEntryMode && !wafer.waferId)}
                        value={wafer.type}
                        onChange={(e) => {
                          if (isDefectEntryMode) {
                            handleDefectEntryTypeChange(wafer.id, e.target.value as 'GOOD' | 'REJECT' | 'LOSS');
                          } else {
                            handleWaferTypeChange(wafer.id, e.target.value as 'GOOD' | 'BAD' | 'LOSS' | 'Select');
                          }
                        }}
                      >
                        {isDefectEntryMode ? (
                          <>
                            <option value="GOOD">Good</option>
                            <option value="REJECT">Reject</option>
                            <option value="LOSS">Loss</option>
                          </>
                        ) : (
                          <>
                            <option value="GOOD">GOOD</option>
                            <option value="BAD">BAD</option>
                            <option value="LOSS">LOSS</option>
                          </>
                        )}
                      </select>
                      {/* 不良代码：只读展示，不良录入模式下自动填入 mock 原因 */}
                      <span className={`w-20 ml-2 flex-shrink-0 text-xs ${defectCode === '—' ? 'text-gray-400' : 'text-red-600'}`}>{defectCode}</span>
                      {/* 不良处置：不良录入模式下为下拉输入，否则只读展示 */}
                      {isDefectEntryMode && !readOnlyWaferDetails ? (
                        <select
                          className="w-24 ml-2 flex-shrink-0 text-xs border rounded px-1 py-0.5"
                          value={wafer.defectDisposal || ''}
                          disabled={!wafer.waferId}
                          onChange={(e) => handleDefectDisposalChange(wafer.id, e.target.value as '返工' | '残值回收' | '报废' | '')}
                        >
                          <option value="">—</option>
                          <option value="返工">返工</option>
                          <option value="残值回收">残值回收</option>
                          <option value="报废">报废</option>
                        </select>
                      ) : (
                        <span className={`w-24 ml-2 flex-shrink-0 text-xs ${disposal === '—' ? 'text-gray-400' : 'text-gray-700'}`}>{disposal}</span>
                      )}
                      {/* 回收等级：仅不良处置 = 残值回收 时可选，其余情况 disable */}
                      <select
                        className="w-24 ml-2 flex-shrink-0 text-xs border rounded px-1 py-0.5"
                        disabled={
                          readOnlyWaferDetails ||
                          !wafer.waferId ||
                          (isDefectEntryMode && wafer.defectDisposal !== '残值回收')
                        }
                        value={wafer.recycleGrade || ''}
                        onChange={(e) => handleRecycleGradeChange(wafer.id, e.target.value as 'A级' | 'B级' | 'C级' | '')}
                      >
                        <option value="">—</option>
                        <option value="A级">A级</option>
                        <option value="B级">B级</option>
                        <option value="C级">C级</option>
                      </select>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* 移动按钮列 */}
          {!hideTransferButtons && !hideTargetSection && (
            <div className="flex flex-col justify-center items-center space-y-4">
              {isDefectEntryMode && (
                <button
                  className="bg-amber-500 text-white px-3 py-2 rounded hover:bg-amber-600 flex items-center justify-center space-x-1 text-xs whitespace-nowrap"
                  onClick={handleOneClickMoveDefects}
                  title="按当前移动模式，将所有源片篮中标记的不良片一键移动到目标片篮"
                >
                  <Zap className="w-4 h-4" />
                  <span>一键移动</span>
                </button>
              )}
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
                onClick={handleMoveSelectedWafersRight}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
                onClick={handleMoveSelectedWafersLeft}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* 模式选择组件 */}
              <div className="flex flex-col items-start space-y-2 mt-4 text-sm">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="transferMode"
                    value="平移"
                    checked={transferMode === '平移'}
                    onChange={() => setTransferMode('平移')}
                  />
                  <span className="ml-2">平移</span>
                </label>   
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="transferMode"
                    value="25>1"
                    checked={transferMode === '25>1'}
                    onChange={() => setTransferMode('25>1')}
                  />
                  <span className="ml-2">25&gt;1</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="transferMode"
                    value="1>25"
                    checked={transferMode === '1>25'}
                    onChange={() => setTransferMode('1>25')}
                  />
                  <span className="ml-2">1&gt;25</span>
                </label>

              </div>
            </div>
          )}

          {/* 目标片篮：列表 + Wafer 明细垂直堆叠 */}
          {!hideTargetSection && (
          <div className="flex flex-col gap-3 min-w-0">
            {selectedMode !== '3' && (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-700">目标片篮</h3>
                    <span className="text-xs text-gray-500">共 {targetCarriersList.length} 篮</span>
                  </div>
                  {!['A', 'B', 'C', 'D'].includes(selectedMode) && (
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      onClick={handleAddTargetCarrier}
                    >
                      增加片篮
                    </button>
                  )}
                </div>

                {/* 目标片篮列表 */}
                <div>
                  <div className="h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100">
                          <th className="py-1 px-2 text-left text-xs">目标片篮</th>
                          <th className="py-1 px-2 text-center text-xs">良品</th>
                          <th className="py-1 px-2 text-center text-xs">不良</th>
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
                                readOnly={['A', 'B', 'C', 'D'].includes(selectedMode)}
                              />
                            </td>
                            <td className="py-1 px-2 text-center">
                              {targetWafers.filter(w => w.carrierId === carrier.id && w.type === 'GOOD').length}
                            </td>
                            <td className="py-1 px-2 text-center">
                              {targetWafers.filter(w => w.carrierId === carrier.id && (w.type === 'BAD' || w.type === 'LOSS' || w.type === 'REJECT')).length}
                            </td>
                            <td className="py-1 px-2 text-center">
                              {!['A', 'B', 'C', 'D'].includes(selectedMode) && (
                                <button
                                  className="text-red-500 text-xs hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTargetCarrier(carrier.id);
                                  }}
                                >
                                  删除
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 目标片篮 Wafer 明细 */}
                <div className="border rounded-lg overflow-x-auto">
                  <div className="bg-gray-100 px-3 py-1 text-xs font-medium border-b">
                    <div className="flex items-center min-w-max">
                      <span className="w-10 flex-shrink-0"></span>
                      <span className="w-12 flex-shrink-0 ml-1">Slot</span>
                      <span className="w-44 ml-2 flex-shrink-0">WaferID</span>
                      <span className="w-44 ml-2 flex-shrink-0">材料号</span>
                      <span className="w-16 ml-2 flex-shrink-0">类型</span>
                      <span className="w-20 ml-2 flex-shrink-0">不良代码</span>
                      <span className="w-24 ml-2 flex-shrink-0">不良处置</span>
                      <span className="w-24 ml-2 flex-shrink-0">回收等级</span>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="min-w-max">
                    {selectedTargetCarrierWafers.map((wafer, idx) => (
                      <div key={wafer.id} className="flex items-center px-3 py-1 border-b text-xs hover:bg-gray-50">
                        {/* 上下移动箭头 */}
                        <div className="flex flex-col w-10 flex-shrink-0">
                          <button
                            className="text-gray-400 hover:text-blue-500 disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                            onClick={() => handleMoveTargetWafer(wafer.id, 'up')}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-blue-500 disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                            onClick={() => handleMoveTargetWafer(wafer.id, 'down')}
                            disabled={idx === selectedTargetCarrierWafers.length - 1}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="w-12 flex-shrink-0 ml-1">{wafer.slotNo}</span>
                        <span className={`w-44 ml-2 flex-shrink-0 text-xs truncate ${wafer.waferId ? 'text-gray-900' : 'text-gray-400'}`} title={wafer.waferId || undefined}>
                          {wafer.waferId || '空'}
                        </span>
                        <span className="w-44 ml-2 flex-shrink-0 text-xs truncate text-gray-400">—</span>
                        <select
                          className="w-16 ml-2 flex-shrink-0 text-xs border rounded px-1 py-0.5"
                          value={wafer.type}
                          onChange={(e) => handleTargetWaferTypeChange(wafer.id, e.target.value as 'GOOD' | 'BAD' | 'REJECT' | 'LOSS' | 'Select')}
                          disabled={!wafer.waferId}
                        >
                          <option value="Select">Select</option>
                          {isDefectEntryMode ? (
                            <>
                              <option value="GOOD">Good</option>
                              <option value="REJECT">Reject</option>
                              <option value="LOSS">Loss</option>
                            </>
                          ) : (
                            <>
                              <option value="GOOD">GOOD</option>
                              <option value="BAD">BAD</option>
                              <option value="LOSS">LOSS</option>
                            </>
                          )}
                        </select>
                        <span className="w-20 ml-2 flex-shrink-0 text-xs text-gray-400">—</span>
                        <span className="w-24 ml-2 flex-shrink-0 text-xs text-gray-400">—</span>
                        <span className="w-24 ml-2 flex-shrink-0 text-xs text-gray-400">—</span>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaferBasketReorganizationModule;
